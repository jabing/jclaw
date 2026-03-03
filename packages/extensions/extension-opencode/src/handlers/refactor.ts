/**
 * Refactor Handler
 *
 * Handles code refactoring operations using LSP features.
 * Supports extract, inline, and rename strategies.
 *
 * @module @jclaw/extension-opencode/handlers/refactor
 */

import type {
  TextEdit,
  WorkspaceEdit,
  ExecuteCommandParams,
  RenameParams,
} from 'vscode-languageserver-protocol';
import { LSPBridge } from '../lsp-bridge.js';
import { OpenCodeAdapter } from '../adapter.js';

/**
 * Input for refactor handler
 */
export interface RefactorInput {
  /** Target code element (file path or symbol identifier) */
  target: string;
  /** Refactoring strategy */
  strategy: 'extract' | 'inline' | 'rename';
  /** New name for rename strategy */
  newName?: string;
  /** File path (if target is a symbol within a file) */
  file?: string;
  /** Line number (0-indexed) */
  line?: number;
  /** Character position (0-indexed) */
  character?: number;
}

/**
 * Result from refactor handler
 */
export interface RefactorResult {
  /** Whether the refactoring was successful */
  success: boolean;
  /** Workspace edit or array of text edits */
  edits: WorkspaceEdit | TextEdit[];
  /** Optional error message */
  error?: string;
}

/**
 * Handle refactor request
 *
 * Performs refactoring operations using LSP:
 * - extract: Extract method/variable/function using workspace/executeCommand
 * - inline: Inline variable/method using workspace/executeCommand
 * - rename: Rename symbol using textDocument/rename
 *
 * @param input - Refactor input containing target and strategy
 * @param lspBridge - LSP bridge for language server communication
 * @param openCodeAdapter - OpenCode adapter for AI-assisted fallback
 * @returns Promise resolving to refactor result
 */
export async function handleRefactor(
  input: RefactorInput,
  lspBridge: LSPBridge,
  openCodeAdapter: OpenCodeAdapter
): Promise<RefactorResult> {
  const { target, strategy, newName, file, line, character } = input;

  try {
    // Validate LSP bridge is ready
    if (!lspBridge.isReady()) {
      // Fallback to AI-assisted refactoring if LSP is not available
      return await handleAIFallback(input, openCodeAdapter);
    }

    switch (strategy) {
      case 'rename':
        return await handleRename(
          target,
          newName,
          file,
          line,
          character,
          lspBridge
        );
      case 'extract':
        return await handleExtract(target, file, line, character, lspBridge);
      case 'inline':
        return await handleInline(target, file, line, character, lspBridge);
      default:
        return {
          success: false,
          edits: [],
          error: `Unknown refactoring strategy: ${strategy}`,
        };
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      success: false,
      edits: [],
      error: errorMessage,
    };
  }
}

/**
 * Handle rename refactoring using textDocument/rename
 *
 * @param target - Target symbol to rename
 * @param newName - New name for the symbol
 * @param file - File path containing the symbol
 * @param line - Line number (0-indexed)
 * @param character - Character position (0-indexed)
 * @param lspBridge - LSP bridge instance
 * @returns Promise resolving to refactor result
 */
async function handleRename(
  target: string,
  newName: string | undefined,
  file: string | undefined,
  line: number | undefined,
  character: number | undefined,
  lspBridge: LSPBridge
): Promise<RefactorResult> {
  if (!newName) {
    return {
      success: false,
      edits: [],
      error: 'New name is required for rename refactoring',
    };
  }

  if (!file || line === undefined || character === undefined) {
    return {
      success: false,
      edits: [],
      error:
        'File path, line, and character position are required for rename refactoring',
    };
  }

  try {
    // Build the rename params
    const params: RenameParams = {
      textDocument: {
        uri: fileToUri(file),
      },
      position: {
        line,
        character,
      },
      newName,
    };

    // Send textDocument/rename request
    // This returns WorkspaceEdit | null
    const result = await sendLSPRequest<WorkspaceEdit | null>(
      lspBridge,
      'textDocument/rename',
      params
    );

    if (!result) {
      return {
        success: false,
        edits: [],
        error: `Cannot rename '${target}' - no valid rename target found`,
      };
    }

    return {
      success: true,
      edits: result,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      success: false,
      edits: [],
      error: `Rename failed: ${errorMessage}`,
    };
  }
}

/**
 * Handle extract refactoring using workspace/executeCommand
 *
 * Common extract commands:
 * - 'editor.action.refactor.extract.function' (VS Code style)
 * - 'refactor.extract.method'
 * - 'refactor.extract.variable'
 * - 'refactor.extract.constant'
 *
 * @param target - Target code to extract
 * @param file - File path containing the target
 * @param line - Line number (0-indexed)
 * @param character - Character position (0-indexed)
 * @param lspBridge - LSP bridge instance
 * @returns Promise resolving to refactor result
 */
async function handleExtract(
  target: string,
  file: string | undefined,
  line: number | undefined,
  character: number | undefined,
  lspBridge: LSPBridge
): Promise<RefactorResult> {
  if (!file || line === undefined || character === undefined) {
    return {
      success: false,
      edits: [],
      error:
        'File path, line, and character position are required for extract refactoring',
    };
  }

  try {
    // Try common extract command patterns
    const extractCommands = [
      'refactor.extract.method',
      'refactor.extract.function',
      'refactor.extract.variable',
      'refactor.extract.constant',
      'editor.action.refactor.extract.function',
      'editor.action.refactor.extract.constant',
    ];

    for (const command of extractCommands) {
      try {
        const result = await executeRefactorCommand(
          lspBridge,
          command,
          file,
          line,
          character,
          target
        );

        if (
          result &&
          (hasValidEdits(result) || hasValidDocumentChanges(result))
        ) {
          return {
            success: true,
            edits: result,
          };
        }
      } catch {
        // Try next command
        continue;
      }
    }

    return {
      success: false,
      edits: [],
      error: `No suitable extract refactoring available for '${target}'`,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      success: false,
      edits: [],
      error: `Extract failed: ${errorMessage}`,
    };
  }
}

/**
 * Handle inline refactoring using workspace/executeCommand
 *
 * Common inline commands:
 * - 'refactor.inline.variable'
 * - 'refactor.inline.method'
 * - 'refactor.inline.function'
 * - 'editor.action.refactor.inline.variable'
 *
 * @param target - Target code to inline
 * @param file - File path containing the target
 * @param line - Line number (0-indexed)
 * @param character - Character position (0-indexed)
 * @param lspBridge - LSP bridge instance
 * @returns Promise resolving to refactor result
 */
async function handleInline(
  target: string,
  file: string | undefined,
  line: number | undefined,
  character: number | undefined,
  lspBridge: LSPBridge
): Promise<RefactorResult> {
  if (!file || line === undefined || character === undefined) {
    return {
      success: false,
      edits: [],
      error:
        'File path, line, and character position are required for inline refactoring',
    };
  }

  try {
    // Try common inline command patterns
    const inlineCommands = [
      'refactor.inline.variable',
      'refactor.inline.method',
      'refactor.inline.function',
      'refactor.inline.constant',
      'editor.action.refactor.inline.variable',
      'editor.action.refactor.inline.function',
    ];

    for (const command of inlineCommands) {
      try {
        const result = await executeRefactorCommand(
          lspBridge,
          command,
          file,
          line,
          character,
          target
        );

        if (
          result &&
          (hasValidEdits(result) || hasValidDocumentChanges(result))
        ) {
          return {
            success: true,
            edits: result,
          };
        }
      } catch {
        // Try next command
        continue;
      }
    }

    return {
      success: false,
      edits: [],
      error: `No suitable inline refactoring available for '${target}'`,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      success: false,
      edits: [],
      error: `Inline failed: ${errorMessage}`,
    };
  }
}

/**
 * Execute a refactoring command via workspace/executeCommand
 *
 * @param lspBridge - LSP bridge instance
 * @param command - Command identifier
 * @param file - File path
 * @param line - Line number
 * @param character - Character position
 * @param target - Target identifier
 * @returns Promise resolving to WorkspaceEdit or null
 */
async function executeRefactorCommand(
  lspBridge: LSPBridge,
  command: string,
  file: string,
  line: number,
  character: number,
  target: string
): Promise<WorkspaceEdit | null> {
  const params: ExecuteCommandParams = {
    command,
    arguments: [
      {
        uri: fileToUri(file),
        range: {
          start: { line, character },
          end: { line, character },
        },
      },
      target,
    ],
  };

  return await sendLSPRequest<WorkspaceEdit | null>(
    lspBridge,
    'workspace/executeCommand',
    params
  );
}

/**
 * AI-assisted fallback for when LSP is unavailable
 *
 * @param input - Refactor input
 * @param openCodeAdapter - OpenCode adapter
 * @returns Promise resolving to refactor result
 */
async function handleAIFallback(
  input: RefactorInput,
  openCodeAdapter: OpenCodeAdapter
): Promise<RefactorResult> {
  const { target, strategy, newName, file } = input;

  try {
    const prompt = buildRefactorPrompt(target, strategy, newName, file);

    const result = await openCodeAdapter.run(prompt, {
      timeout: 120000, // 2 minutes for refactoring
    });

    if (result.exitCode !== 0) {
      return {
        success: false,
        edits: [],
        error: `AI refactoring failed: ${result.stderr || result.stdout}`,
      };
    }

    // Parse AI response for edits
    const edits = parseAIRefactorResponse(result.stdout);

    return {
      success: edits.length > 0,
      edits,
      error:
        edits.length === 0 ? 'No refactoring suggestions from AI' : undefined,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      success: false,
      edits: [],
      error: `AI fallback failed: ${errorMessage}`,
    };
  }
}

/**
 * Build prompt for AI-assisted refactoring
 *
 * @param target - Target code element
 * @param strategy - Refactoring strategy
 * @param newName - New name (for rename)
 * @param file - File path
 * @returns Formatted prompt string
 */
function buildRefactorPrompt(
  target: string,
  strategy: string,
  newName: string | undefined,
  file: string | undefined
): string {
  let prompt = `Perform a ${strategy} refactoring on the following code element:\n\n`;
  prompt += `Target: ${target}\n`;

  if (file) {
    prompt += `File: ${file}\n`;
  }

  if (strategy === 'rename' && newName) {
    prompt += `New name: ${newName}\n`;
  }

  prompt += `\nPlease provide the refactoring as a WorkspaceEdit in JSON format:\n`;
  prompt += `\n{\n`;
  prompt += `  "changes": {\n`;
  prompt += `    "file://path/to/file": [\n`;
  prompt += `      {\n`;
  prompt += `        "range": {\n`;
  prompt += `          "start": { "line": 0, "character": 0 },\n`;
  prompt += `          "end": { "line": 0, "character": 0 }\n`;
  prompt += `        },\n`;
  prompt += `        "newText": "refactored code"\n`;
  prompt += `      }\n`;
  prompt += `    ]\n`;
  prompt += `  }\n`;
  prompt += `}\n`;

  return prompt;
}

/**
 * Parse AI response for WorkspaceEdit or TextEdit[]
 *
 * @param response - AI response string
 * @returns Array of TextEdits or WorkspaceEdit
 */
function parseAIRefactorResponse(response: string): TextEdit[] {
  try {
    // Try to find JSON object in the response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return [];
    }

    const editData = JSON.parse(jsonMatch[0]);

    // Handle WorkspaceEdit format
    if (editData.changes) {
      const allEdits: TextEdit[] = [];
      for (const uri in editData.changes) {
        const uriEdits = editData.changes[uri];
        if (Array.isArray(uriEdits)) {
          allEdits.push(...uriEdits);
        }
      }
      return allEdits;
    }

    // Handle TextEdit[] format
    if (Array.isArray(editData)) {
      return editData.filter(isValidTextEdit);
    }

    return [];
  } catch {
    return [];
  }
}

/**
 * Send an LSP request using the bridge
 *
 * Uses reflection to access the private sendRequest method
 *
 * @param lspBridge - LSP bridge instance
 * @param method - LSP method name
 * @param params - Method parameters
 * @returns Promise resolving to the response result
 */
async function sendLSPRequest<T>(
  lspBridge: LSPBridge,
  method: string,
  params: unknown
): Promise<T> {
  return await lspBridge.request<T>(method, params);
}

/**
 * Check if a WorkspaceEdit has valid changes
 *
 * @param edit - WorkspaceEdit to check
 * @returns True if edit has changes
 */
function hasValidEdits(edit: WorkspaceEdit): boolean {
  return !!(edit.changes && Object.keys(edit.changes).length > 0);
}

/**
 * Check if a WorkspaceEdit has valid document changes
 *
 * @param edit - WorkspaceEdit to check
 * @returns True if edit has document changes
 */
function hasValidDocumentChanges(edit: WorkspaceEdit): boolean {
  return !!(edit.documentChanges && edit.documentChanges.length > 0);
}

/**
 * Validate if an object is a valid TextEdit
 *
 * @param edit - Object to validate
 * @returns True if valid TextEdit
 */
function isValidTextEdit(edit: unknown): edit is TextEdit {
  if (!edit || typeof edit !== 'object') return false;

  const textEdit = edit as TextEdit;
  return (
    textEdit.range !== undefined &&
    typeof textEdit.range.start?.line === 'number' &&
    typeof textEdit.range.start?.character === 'number' &&
    typeof textEdit.range.end?.line === 'number' &&
    typeof textEdit.range.end?.character === 'number' &&
    typeof textEdit.newText === 'string'
  );
}

/**
 * Convert file path to URI
 *
 * @param filePath - File path
 * @returns File URI
 */
function fileToUri(filePath: string): string {
  if (filePath.startsWith('file://')) {
    return filePath;
  }
  // Simple file path to URI conversion
  const normalizedPath = filePath.replace(/\\/g, '/');
  return `file:///${normalizedPath.startsWith('/') ? normalizedPath.slice(1) : normalizedPath}`;
}

export default handleRefactor;
