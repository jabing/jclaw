/**
 * Analyze Handler
 *
 * Handles code analysis with LSP integration.
 * Provides document symbols, diagnostics, and structure analysis.
 *
 * @module @jclaw/extension-opencode/handlers/analyze
 */

import { readFile } from 'fs/promises';
import { pathToFileURL } from 'url';
import type {
  DocumentSymbol,
  Diagnostic,
  TextDocumentItem,
} from 'vscode-languageserver-protocol';
import { LSPBridge } from '../lsp-bridge.js';
import { OpenCodeAdapter } from '../adapter.js';

/**
 * Input for analyze handler
 */
export interface AnalyzeInput {
  /** Path to the file to analyze */
  path: string;
  /** Analysis depth level (1 = basic, 2 = detailed, 3 = comprehensive) */
  depth?: number;
}

/**
 * Result from analyze handler
 */
export interface AnalyzeResult {
  /** Document symbols found in the file */
  symbols: DocumentSymbol[];
  /** Diagnostics (errors, warnings, etc.) */
  diagnostics: Diagnostic[];
  /** Human-readable summary of the analysis */
  summary: string;
}

/**
 * Handle analyze request
 *
 * Workflow:
 * 1. Read file content
 * 2. Open file via LSP (textDocument/didOpen)
 * 3. Request document symbols (textDocument/documentSymbol)
 * 4. Request diagnostics (textDocument/diagnostic if available)
 * 5. Build summary from symbols and diagnostics
 * 6. Close file via LSP (textDocument/didClose)
 *
 * @param input - Analyze input containing file path and optional depth
 * @param lspBridge - LSP bridge for language server communication
 * @param _openCodeAdapter - OpenCode adapter (available for future AI-powered analysis)
 * @returns Promise resolving to analyze result
 */
export async function handleAnalyze(
  input: AnalyzeInput,
  lspBridge: LSPBridge,
  _openCodeAdapter: OpenCodeAdapter
): Promise<AnalyzeResult> {
  const { path: filePath, depth = 1 } = input;

  try {
    // Step 1: Read file content
    const content = await readFile(filePath, 'utf-8');
    const uri = pathToFileURL(filePath).toString();

    // Step 2: Open file via LSP
    const document: TextDocumentItem = {
      uri,
      languageId: getLanguageId(filePath),
      version: 1,
      text: content,
    };
    lspBridge.didOpen(document);

    // Step 3: Request document symbols
    let symbols: DocumentSymbol[] = [];
    try {
      const symbolResult = await lspBridge.request<DocumentSymbol[] | null>(
        'textDocument/documentSymbol',
        {
          textDocument: { uri },
        }
      );
      symbols = symbolResult ?? [];
    } catch (error) {
      console.warn(`Failed to get document symbols: ${error}`);
      symbols = [];
    }

    // Step 4: Request diagnostics if server supports it
    let diagnostics: Diagnostic[] = [];
    try {
      // Try the newer textDocument/diagnostic method first
      const diagnosticResult = await lspBridge.request<{
        items?: Array<{ diagnostics?: Diagnostic[] }>;
      } | null>('textDocument/diagnostic', {
        textDocument: { uri },
        identifier: 'analyze',
        previousResultId: undefined,
      });

      if (diagnosticResult?.items && diagnosticResult.items.length > 0) {
        diagnostics = diagnosticResult.items[0]?.diagnostics ?? [];
      }
    } catch {
      // Server may not support textDocument/diagnostic
      // Diagnostics might come via publishDiagnostics notification
      // For now, return empty diagnostics
      diagnostics = [];
    }

    // Step 5: Build summary
    const summary = buildSummary(
      filePath,
      symbols,
      diagnostics,
      depth,
      content
    );

    // Step 6: Close file via LSP
    lspBridge.didClose(uri);

    return {
      symbols,
      diagnostics,
      summary,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      symbols: [],
      diagnostics: [],
      summary: `Analysis failed: ${errorMessage}`,
    };
  }
}

/**
 * Build human-readable summary from analysis results
 *
 * @param filePath - Path to the analyzed file
 * @param symbols - Document symbols found
 * @param diagnostics - Diagnostics found
 * @param depth - Analysis depth level
 * @param content - File content
 * @returns Formatted summary string
 */
function buildSummary(
  filePath: string,
  symbols: DocumentSymbol[],
  diagnostics: Diagnostic[],
  depth: number,
  content: string
): string {
  const lines = content.split('\n');
  const lineCount = lines.length;
  const charCount = content.length;

  // Count symbols by kind
  const symbolCounts = new Map<string, number>();
  let totalSymbols = 0;

  function countSymbols(syms: DocumentSymbol[]): void {
    for (const sym of syms) {
      totalSymbols++;
      const kind = getSymbolKindName(sym.kind);
      symbolCounts.set(kind, (symbolCounts.get(kind) ?? 0) + 1);
      if (sym.children && depth > 1) {
        countSymbols(sym.children);
      }
    }
  }

  countSymbols(symbols);

  // Count diagnostics by severity
  const errorCount = diagnostics.filter(
    (d) => d.severity === 1 // Error
  ).length;
  const warningCount = diagnostics.filter(
    (d) => d.severity === 2 // Warning
  ).length;
  const infoCount = diagnostics.filter(
    (d) => d.severity === 3 // Information
  ).length;
  const hintCount = diagnostics.filter(
    (d) => d.severity === 4 // Hint
  ).length;

  // Build summary
  let summary = `Analysis of ${filePath}\n`;
  summary += `Lines: ${lineCount}, Characters: ${charCount}\n`;
  summary += `\n`;

  // Symbols section
  summary += `Symbols: ${totalSymbols} total\n`;
  if (symbolCounts.size > 0) {
    for (const [kind, count] of symbolCounts.entries()) {
      summary += `  - ${kind}: ${count}\n`;
    }
  } else {
    summary += `  (No symbols found)\n`;
  }
  summary += `\n`;

  // Diagnostics section
  const totalIssues = errorCount + warningCount + infoCount + hintCount;
  summary += `Issues: ${totalIssues} total\n`;
  if (totalIssues > 0) {
    if (errorCount > 0) summary += `  - Errors: ${errorCount}\n`;
    if (warningCount > 0) summary += `  - Warnings: ${warningCount}\n`;
    if (infoCount > 0) summary += `  - Info: ${infoCount}\n`;
    if (hintCount > 0) summary += `  - Hints: ${hintCount}\n`;

    // List specific issues if depth >= 2
    if (depth >= 2 && diagnostics.length > 0) {
      summary += `\nIssues found:\n`;
      const maxIssues = depth >= 3 ? 20 : 10;
      for (let i = 0; i < Math.min(diagnostics.length, maxIssues); i++) {
        const d = diagnostics[i];
        if (!d) continue;
        const severity = getSeverityName(d.severity);
        const line = d.range?.start?.line ?? 0;
        const message = d.message?.split('\n')[0] ?? 'Unknown issue';
        summary += `  [${severity}] Line ${line + 1}: ${message}\n`;
      }
      if (diagnostics.length > maxIssues) {
        summary += `  ... and ${diagnostics.length - maxIssues} more\n`;
      }
    }
  } else {
    summary += `  (No issues found)\n`;
  }

  // Detailed symbol list for depth >= 3
  if (depth >= 3 && symbols.length > 0) {
    summary += `\nSymbol Details:\n`;
    appendSymbolDetails(symbols, 0);
  }

  function appendSymbolDetails(syms: DocumentSymbol[], indent: number): void {
    const prefix = '  '.repeat(indent + 1);
    for (const sym of syms) {
      const kind = getSymbolKindName(sym.kind);
      const detail = sym.detail ? ` (${sym.detail})` : '';
      summary += `${prefix}${kind}: ${sym.name}${detail}\n`;
      if (sym.children && sym.children.length > 0) {
        appendSymbolDetails(sym.children, indent + 1);
      }
    }
  }

  return summary;
}

/**
 * Get human-readable name for symbol kind
 *
 * @param kind - Symbol kind number
 * @returns Symbol kind name
 */
function getSymbolKindName(kind: number): string {
  const kinds: Record<number, string> = {
    1: 'File',
    2: 'Module',
    3: 'Namespace',
    4: 'Package',
    5: 'Class',
    6: 'Method',
    7: 'Property',
    8: 'Field',
    9: 'Constructor',
    10: 'Enum',
    11: 'Interface',
    12: 'Function',
    13: 'Variable',
    14: 'Constant',
    15: 'String',
    16: 'Number',
    17: 'Boolean',
    18: 'Array',
    19: 'Object',
    20: 'Key',
    21: 'Null',
    22: 'EnumMember',
    23: 'Struct',
    24: 'Event',
    25: 'Operator',
    26: 'TypeParameter',
  };
  return kinds[kind] ?? `Unknown(${kind})`;
}

/**
 * Get human-readable name for diagnostic severity
 *
 * @param severity - Severity number
 * @returns Severity name
 */
function getSeverityName(severity: number | undefined): string {
  switch (severity) {
    case 1:
      return 'Error';
    case 2:
      return 'Warning';
    case 3:
      return 'Info';
    case 4:
      return 'Hint';
    default:
      return 'Unknown';
  }
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

  // Special handling for Dockerfile (extensionless file)
  if (!basename.includes('.')) {
    if (basename === 'dockerfile') {
      return 'dockerfile';
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

export default handleAnalyze;
