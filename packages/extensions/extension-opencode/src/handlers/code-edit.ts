/**
 * Code Edit Handler
 *
 * Handles AI-powered code editing with LSP context.
 * Provides intelligent file modifications using OpenCode AI
 * with proper LSP lifecycle management.
 *
 * @module @jclaw/extension-opencode/handlers/code-edit
 */

import { readFile, writeFile } from 'fs/promises';
import { pathToFileURL } from 'url';
import type {
  TextEdit,
  TextDocumentItem,
  VersionedTextDocumentIdentifier,
  TextDocumentContentChangeEvent,
} from 'vscode-languageserver-protocol';
import { LSPBridge } from '../lsp-bridge.js';
import { OpenCodeAdapter } from '../adapter.js';

/**
 * Input for code edit handler
 */
export interface CodeEditInput {
  /** Path to the file to edit */
  file: string;
  /** Natural language instruction for the edit */
  instruction: string;
}

/**
 * Result from code edit handler
 */
export interface CodeEditResult {
  /** Whether the edit was successful */
  success: boolean;
  /** Array of applied edits */
  edits: TextEdit[];
  /** Optional error message */
  error?: string;
}

/**
 * Handle code edit request
 *
 * Workflow:
 * 1. Read file content
 * 2. Open file via LSP (textDocument/didOpen)
 * 3. Call OpenCode with file content + instruction
 * 4. Parse AI response for edits
 * 5. Apply edits via LSP (textDocument/didChange)
 * 6. Save file (textDocument/didSave)
 *
 * @param input - Edit input containing file path and instruction
 * @param lspBridge - LSP bridge for language server communication
 * @param openCodeAdapter - OpenCode adapter for AI operations
 * @returns Promise resolving to edit result
 */
export async function handleCodeEdit(
  input: CodeEditInput,
  lspBridge: LSPBridge,
  openCodeAdapter: OpenCodeAdapter
): Promise<CodeEditResult> {
  const { file, instruction } = input;
  const edits: TextEdit[] = [];

  try {
    // Step 1: Read file content
    const content = await readFile(file, 'utf-8');
    const uri = pathToFileURL(file).toString();

    // Step 2: Open file via LSP
    const document: TextDocumentItem = {
      uri,
      languageId: getLanguageId(file),
      version: 1,
      text: content,
    };
    lspBridge.didOpen(document);

    // Step 3: Call OpenCode with file context
    const prompt = buildEditPrompt(file, content, instruction);
    const result = await openCodeAdapter.run(prompt, {
      timeout: 120000, // 2 minutes for code editing
    });

    if (result.exitCode !== 0) {
      return {
        success: false,
        edits: [],
        error: `OpenCode failed: ${result.stderr || result.stdout}`,
      };
    }

    // Step 4: Parse AI response for edits
    const parsedEdits = parseEditResponse(result.stdout, content);
    if (parsedEdits.length === 0) {
      return {
        success: true,
        edits: [],
        error: 'No edits suggested by AI',
      };
    }

    // Step 5: Apply edits via LSP
    const documentId: VersionedTextDocumentIdentifier = {
      uri,
      version: 1,
    };

    // Convert TextEdit[] to TextDocumentContentChangeEvent[]
    const contentChanges: TextDocumentContentChangeEvent[] = parsedEdits.map(
      (edit) => ({
        range: edit.range,
        text: edit.newText,
      })
    );

    lspBridge.didChange(documentId, contentChanges);

    // Apply edits to actual file
    const newContent = applyTextEdits(content, parsedEdits);
    await writeFile(file, newContent, 'utf-8');

    // Step 6: Save file via LSP
    lspBridge.didSave(uri, newContent);

    return {
      success: true,
      edits: parsedEdits,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      success: false,
      edits,
      error: errorMessage,
    };
  }
}

/**
 * Build prompt for OpenCode edit request
 *
 * @param filePath - Path to the file
 * @param content - Current file content
 * @param instruction - Edit instruction
 * @returns Formatted prompt string
 */
function buildEditPrompt(
  filePath: string,
  content: string,
  instruction: string
): string {
  return `You are an expert code editor. Please edit the following file according to the instruction.

File: ${filePath}

Current content:
\`\`\`
${content}
\`\`\`

Instruction: ${instruction}

Please provide your edits in the following JSON format:
[
  {
    "range": {
      "start": { "line": <number>, "character": <number> },
      "end": { "line": <number>, "character": <number> }
    },
    "newText": "<replacement text>"
  }
]

Important:
- Line numbers are 0-indexed
- Use {"start":{"line":0,"character":0},"end":{"line":0,"character":0}} for the entire file if replacing everything
- Provide only the JSON array, no other text
- Escape newlines and quotes properly in the JSON
- Each edit should be a complete, valid TextEdit object`;
}

/**
 * Parse OpenCode response for TextEdits
 *
 * @param response - AI response string
 * @param originalContent - Original file content for validation
 * @returns Array of parsed TextEdits
 */
function parseEditResponse(
  response: string,
  originalContent: string
): TextEdit[] {
  try {
    // Try to find JSON array in the response
    const jsonMatch = response.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      return [];
    }

    const edits = JSON.parse(jsonMatch[0]) as TextEdit[];

    // Validate edits have required fields
    if (!Array.isArray(edits)) {
      return [];
    }

    return edits.filter((edit) => {
      return (
        edit &&
        typeof edit === 'object' &&
        edit.range &&
        typeof edit.range.start?.line === 'number' &&
        typeof edit.range.start?.character === 'number' &&
        typeof edit.range.end?.line === 'number' &&
        typeof edit.range.end?.character === 'number' &&
        typeof edit.newText === 'string'
      );
    });
  } catch {
    // If JSON parsing fails, try to extract simple search/replace
    return extractSimpleEdits(response, originalContent);
  }
}

/**
 * Extract simple search/replace edits from response
 * Fallback when JSON parsing fails
 *
 * @param response - AI response string
 * @param originalContent - Original file content
 * @returns Array of TextEdits
 */
function extractSimpleEdits(
  response: string,
  originalContent: string
): TextEdit[] {
  const edits: TextEdit[] = [];

  // Try to find code blocks with search/replace patterns
  const searchReplacePattern =
    /(?:search|find):?[\s\n]*```\s*\n?([\s\S]*?)```\s*(?:replace|with):?[\s\n]*```\s*\n?([\s\S]*?)```/gi;

  let match;
  while ((match = searchReplacePattern.exec(response)) !== null) {
    const searchText = match[1]?.trim() ?? '';
    const replaceText = match[2]?.trim() ?? '';

    const position = findTextPosition(originalContent, searchText);
    if (position) {
      edits.push({
        range: {
          start: position.start,
          end: position.end,
        },
        newText: replaceText,
      });
    }
  }

  return edits;
}

/**
 * Find position of text in content
 *
 * @param content - File content
 * @param searchText - Text to find
 * @returns Range if found, null otherwise
 */
function findTextPosition(
  content: string,
  searchText: string
): {
  start: { line: number; character: number };
  end: { line: number; character: number };
} | null {
  const lines = content.split('\n');
  const searchLines = searchText.split('\n');

  for (let i = 0; i <= lines.length - searchLines.length; i++) {
    let match = true;
    for (let j = 0; j < searchLines.length; j++) {
      const contentLine = lines[i + j];
      const searchLine = searchLines[j];
      if (contentLine === undefined || searchLine === undefined) {
        match = false;
        break;
      }
      if (contentLine.trim() !== searchLine.trim()) {
        match = false;
        break;
      }
    }

    if (match) {
      const startLine = i;
      const firstSearchLine = searchLines[0];
      const firstContentLine = lines[i];
      if (firstSearchLine === undefined || firstContentLine === undefined) {
        continue;
      }
      const startChar = firstContentLine.indexOf(firstSearchLine.trim());
      const endLine = i + searchLines.length - 1;
      const lastSearchLine = searchLines[searchLines.length - 1];
      const endChar =
        searchLines.length === 1
          ? startChar + firstSearchLine.length
          : (lastSearchLine?.length ?? 0);

      return {
        start: { line: startLine, character: startChar },
        end: { line: endLine, character: endChar },
      };
    }
  }

  return null;
}

/**
 * Apply TextEdits to content
 *
 * @param content - Original content
 * @param edits - Array of TextEdits to apply
 * @returns Modified content
 */
function applyTextEdits(content: string, edits: TextEdit[]): string {
  // Sort edits in reverse order (from end to start) to avoid position shifts
  const sortedEdits = [...edits].sort((a, b) => {
    if (a.range.start.line !== b.range.start.line) {
      return b.range.start.line - a.range.start.line;
    }
    return b.range.start.character - a.range.start.character;
  });

  const lines = content.split('\n');

  for (const edit of sortedEdits) {
    const { start, end } = edit.range;

    if (start.line === end.line) {
      // Single line edit
      const line = lines[start.line];
      if (line !== undefined) {
        lines[start.line] =
          line.substring(0, start.character) +
          edit.newText +
          line.substring(end.character);
      }
    } else {
      // Multi-line edit
      const startLine = lines[start.line];
      const endLine = lines[end.line];
      if (startLine !== undefined && endLine !== undefined) {
        const newText =
          startLine.substring(0, start.character) +
          edit.newText +
          endLine.substring(end.character);

        // Replace lines from start to end with new text
        const newLines = newText.split('\n');
        lines.splice(start.line, end.line - start.line + 1, ...newLines);
      }
    }
  }

  return lines.join('\n');
}

/**
 * Get language ID from file path
 *
 * @param filePath - Path to the file
 * @returns Language ID for LSP
 */
function getLanguageId(filePath: string): string {
  // Get the basename (filename without directory)
  const basename = filePath.split('/').pop()?.toLowerCase() || '';
  const ext = basename.split('.').pop()?.toLowerCase();

  // Special handling for files without extension (like Dockerfile, Makefile)
  if (!basename.includes('.')) {
    const specialFiles: Record<string, string> = {
      dockerfile: 'dockerfile',
      makefile: 'makefile',
      gemfile: 'ruby',
      rakefile: 'ruby',
      vagrantfile: 'ruby',
      podfile: 'ruby',
      berksfile: 'ruby',
      capfile: 'ruby',
      guardfile: 'ruby',
      jenkinsfile: 'groovy',
    };
    if (specialFiles[basename]) {
      return specialFiles[basename];
    }
  }

  const languageMap: Record<string, string> = {
    ts: 'typescript',
    tsx: 'typescriptreact',
    js: 'javascript',
    jsx: 'javascriptreact',
    py: 'python',
    java: 'java',
    go: 'go',
    rs: 'rust',
    cpp: 'cpp',
    c: 'c',
    h: 'c',
    hpp: 'cpp',
    cs: 'csharp',
    rb: 'ruby',
    php: 'php',
    swift: 'swift',
    kt: 'kotlin',
    scala: 'scala',
    html: 'html',
    css: 'css',
    scss: 'scss',
    less: 'less',
    json: 'json',
    yaml: 'yaml',
    yml: 'yaml',
    xml: 'xml',
    md: 'markdown',
    sql: 'sql',
    sh: 'shellscript',
    bash: 'shellscript',
    zsh: 'shellscript',
    ps1: 'powershell',
    dockerfile: 'dockerfile',
    vue: 'vue',
    svelte: 'svelte',
  };

  return languageMap[ext || ''] || 'plaintext';
}

export default handleCodeEdit;
