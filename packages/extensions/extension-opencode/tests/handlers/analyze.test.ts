/**
 * Tests for Analyze Handler
 *
 * Unit tests for the code analysis handler using mocked
 * file system and LSP bridge.
 *
 * @module @jclaw/extension-opencode/tests/handlers/analyze
 */

import { handleAnalyze, AnalyzeInput } from '../../src/handlers/analyze';
import { LSPBridge } from '../../src/lsp-bridge';
import { OpenCodeAdapter } from '../../src/adapter';
import { readFile } from 'fs/promises';
import type {
  DocumentSymbol,
  Diagnostic,
} from 'vscode-languageserver-protocol';

// Mock fs/promises
jest.mock('fs/promises', () => ({
  readFile: jest.fn(),
}));

// Mock url module
jest.mock('url', () => ({
  pathToFileURL: jest.fn((path: string) => ({
    toString: () => `file://${path}`,
  })),
}));

/**
 * Creates a mock LSPBridge for testing
 */
function createMockLSPBridge(): jest.Mocked<LSPBridge> {
  return {
    didOpen: jest.fn(),
    didChange: jest.fn(),
    didSave: jest.fn(),
    didClose: jest.fn(),
    request: jest.fn(),
    sendNotification: jest.fn(),
    isReady: jest.fn().mockReturnValue(true),
    getState: jest.fn(),
    getServerCapabilities: jest.fn(),
    initialize: jest.fn(),
    shutdown: jest.fn(),
    dispose: jest.fn(),
  } as unknown as jest.Mocked<LSPBridge>;
}

/**
 * Creates a mock OpenCodeAdapter for testing
 */
function createMockOpenCodeAdapter(): jest.Mocked<OpenCodeAdapter> {
  return {
    run: jest.fn(),
    isAvailable: jest.fn(),
  } as unknown as jest.Mocked<OpenCodeAdapter>;
}

describe('handleAnalyze', () => {
  let mockLSPBridge: jest.Mocked<LSPBridge>;
  let mockOpenCodeAdapter: jest.Mocked<OpenCodeAdapter>;
  const mockReadFile = readFile as jest.MockedFunction<typeof readFile>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockLSPBridge = createMockLSPBridge();
    mockOpenCodeAdapter = createMockOpenCodeAdapter();
  });

  describe('basic functionality', () => {
    it('should analyze file successfully with default depth', async () => {
      const input: AnalyzeInput = {
        path: '/test/file.ts',
      };

      const fileContent = 'function test() { return 1; }';
      mockReadFile.mockResolvedValue(fileContent);

      const symbols: DocumentSymbol[] = [
        {
          name: 'test',
          kind: 12,
          range: {
            start: { line: 0, character: 0 },
            end: { line: 0, character: 29 },
          },
          selectionRange: {
            start: { line: 0, character: 9 },
            end: { line: 0, character: 13 },
          },
        },
      ];

      mockLSPBridge.request.mockResolvedValue(symbols);

      const result = await handleAnalyze(
        input,
        mockLSPBridge,
        mockOpenCodeAdapter
      );

      expect(result.symbols).toHaveLength(1);
      expect(result.summary).toContain('Analysis of /test/file.ts');
      expect(result.summary).toContain('Lines: 1');
    });

    it('should use custom depth when provided', async () => {
      const input: AnalyzeInput = {
        path: '/test/file.ts',
        depth: 2,
      };

      mockReadFile.mockResolvedValue('const x = 1;');
      mockLSPBridge.request.mockResolvedValue([]);

      const result = await handleAnalyze(
        input,
        mockLSPBridge,
        mockOpenCodeAdapter
      );

      expect(result.summary).toBeDefined();
    });
  });

  describe('file reading', () => {
    it('should read file as utf-8', async () => {
      const input: AnalyzeInput = {
        path: '/test/file.ts',
      };

      mockReadFile.mockResolvedValue('content');
      mockLSPBridge.request.mockResolvedValue([]);

      await handleAnalyze(input, mockLSPBridge, mockOpenCodeAdapter);

      expect(mockReadFile).toHaveBeenCalledWith('/test/file.ts', 'utf-8');
    });

    it('should handle file read errors', async () => {
      const input: AnalyzeInput = {
        path: '/nonexistent/file.ts',
      };

      mockReadFile.mockRejectedValue(new Error('ENOENT: file not found'));

      const result = await handleAnalyze(
        input,
        mockLSPBridge,
        mockOpenCodeAdapter
      );

      expect(result.symbols).toEqual([]);
      expect(result.diagnostics).toEqual([]);
      expect(result.summary).toContain('Analysis failed');
      expect(result.summary).toContain('ENOENT');
    });

    it('should handle empty file', async () => {
      const input: AnalyzeInput = {
        path: '/test/empty.ts',
      };

      mockReadFile.mockResolvedValue('');
      mockLSPBridge.request.mockResolvedValue([]);

      const result = await handleAnalyze(
        input,
        mockLSPBridge,
        mockOpenCodeAdapter
      );

      expect(result.summary).toContain('Lines: 1');
      expect(result.summary).toContain('Characters: 0');
    });

    it('should handle multi-line file', async () => {
      const input: AnalyzeInput = {
        path: '/test/file.ts',
      };

      mockReadFile.mockResolvedValue('line1\nline2\nline3');
      mockLSPBridge.request.mockResolvedValue([]);

      const result = await handleAnalyze(
        input,
        mockLSPBridge,
        mockOpenCodeAdapter
      );

      expect(result.summary).toContain('Lines: 3');
    });
  });

  describe('LSP integration', () => {
    it('should call didOpen with correct document', async () => {
      const input: AnalyzeInput = {
        path: '/test/file.ts',
      };

      mockReadFile.mockResolvedValue('const x = 1;');
      mockLSPBridge.request.mockResolvedValue([]);

      await handleAnalyze(input, mockLSPBridge, mockOpenCodeAdapter);

      expect(mockLSPBridge.didOpen).toHaveBeenCalledWith(
        expect.objectContaining({
          uri: 'file:///test/file.ts',
          languageId: 'typescript',
          version: 1,
          text: 'const x = 1;',
        })
      );
    });

    it('should request document symbols', async () => {
      const input: AnalyzeInput = {
        path: '/test/file.ts',
      };

      mockReadFile.mockResolvedValue('function test() {}');
      mockLSPBridge.request.mockResolvedValue([]);

      await handleAnalyze(input, mockLSPBridge, mockOpenCodeAdapter);

      expect(mockLSPBridge.request).toHaveBeenCalledWith(
        'textDocument/documentSymbol',
        expect.objectContaining({
          textDocument: { uri: 'file:///test/file.ts' },
        })
      );
    });

    it('should request diagnostics', async () => {
      const input: AnalyzeInput = {
        path: '/test/file.ts',
      };

      mockReadFile.mockResolvedValue('const x = 1;');
      mockLSPBridge.request.mockResolvedValue([]);

      await handleAnalyze(input, mockLSPBridge, mockOpenCodeAdapter);

      expect(mockLSPBridge.request).toHaveBeenCalledWith(
        'textDocument/diagnostic',
        expect.objectContaining({
          textDocument: { uri: 'file:///test/file.ts' },
          identifier: 'analyze',
        })
      );
    });

    it('should call didClose after analysis', async () => {
      const input: AnalyzeInput = {
        path: '/test/file.ts',
      };

      mockReadFile.mockResolvedValue('const x = 1;');
      mockLSPBridge.request.mockResolvedValue([]);

      await handleAnalyze(input, mockLSPBridge, mockOpenCodeAdapter);

      expect(mockLSPBridge.didClose).toHaveBeenCalledWith(
        'file:///test/file.ts'
      );
    });
  });

  describe('symbol handling', () => {
    it('should count symbols correctly', async () => {
      const input: AnalyzeInput = {
        path: '/test/file.ts',
      };

      mockReadFile.mockResolvedValue('function a() {} class B {}');

      const symbols: DocumentSymbol[] = [
        {
          name: 'a',
          kind: 12,
          range: {
            start: { line: 0, character: 0 },
            end: { line: 0, character: 13 },
          },
          selectionRange: {
            start: { line: 0, character: 9 },
            end: { line: 0, character: 10 },
          },
        },
        {
          name: 'B',
          kind: 5,
          range: {
            start: { line: 0, character: 14 },
            end: { line: 0, character: 26 },
          },
          selectionRange: {
            start: { line: 0, character: 20 },
            end: { line: 0, character: 21 },
          },
        },
      ];

      mockLSPBridge.request
        .mockResolvedValueOnce(symbols)
        .mockResolvedValueOnce(null);

      const result = await handleAnalyze(
        input,
        mockLSPBridge,
        mockOpenCodeAdapter
      );

      expect(result.summary).toContain('Symbols: 2 total');
      expect(result.summary).toContain('Function: 1');
      expect(result.summary).toContain('Class: 1');
    });

    it('should handle symbols with children', async () => {
      const input: AnalyzeInput = {
        path: '/test/file.ts',
        depth: 2,
      };

      mockReadFile.mockResolvedValue('class A { method() {} }');

      const symbols: DocumentSymbol[] = [
        {
          name: 'A',
          kind: 5,
          range: {
            start: { line: 0, character: 0 },
            end: { line: 0, character: 23 },
          },
          selectionRange: {
            start: { line: 0, character: 6 },
            end: { line: 0, character: 7 },
          },
          children: [
            {
              name: 'method',
              kind: 6,
              range: {
                start: { line: 0, character: 10 },
                end: { line: 0, character: 21 },
              },
              selectionRange: {
                start: { line: 0, character: 10 },
                end: { line: 0, character: 16 },
              },
            },
          ],
        },
      ];

      mockLSPBridge.request
        .mockResolvedValueOnce(symbols)
        .mockResolvedValueOnce(null);

      const result = await handleAnalyze(
        input,
        mockLSPBridge,
        mockOpenCodeAdapter
      );

      expect(result.summary).toContain('Symbols: 2 total');
    });

    it('should handle all symbol kinds', async () => {
      const input: AnalyzeInput = {
        path: '/test/file.ts',
      };

      mockReadFile.mockResolvedValue('content');

      const symbols: DocumentSymbol[] = [
        {
          name: 'file',
          kind: 1,
          range: {
            start: { line: 0, character: 0 },
            end: { line: 0, character: 1 },
          },
          selectionRange: {
            start: { line: 0, character: 0 },
            end: { line: 0, character: 1 },
          },
        },
        {
          name: 'module',
          kind: 2,
          range: {
            start: { line: 0, character: 0 },
            end: { line: 0, character: 1 },
          },
          selectionRange: {
            start: { line: 0, character: 0 },
            end: { line: 0, character: 1 },
          },
        },
        {
          name: 'namespace',
          kind: 3,
          range: {
            start: { line: 0, character: 0 },
            end: { line: 0, character: 1 },
          },
          selectionRange: {
            start: { line: 0, character: 0 },
            end: { line: 0, character: 1 },
          },
        },
        {
          name: 'package',
          kind: 4,
          range: {
            start: { line: 0, character: 0 },
            end: { line: 0, character: 1 },
          },
          selectionRange: {
            start: { line: 0, character: 0 },
            end: { line: 0, character: 1 },
          },
        },
        {
          name: 'class',
          kind: 5,
          range: {
            start: { line: 0, character: 0 },
            end: { line: 0, character: 1 },
          },
          selectionRange: {
            start: { line: 0, character: 0 },
            end: { line: 0, character: 1 },
          },
        },
        {
          name: 'method',
          kind: 6,
          range: {
            start: { line: 0, character: 0 },
            end: { line: 0, character: 1 },
          },
          selectionRange: {
            start: { line: 0, character: 0 },
            end: { line: 0, character: 1 },
          },
        },
        {
          name: 'property',
          kind: 7,
          range: {
            start: { line: 0, character: 0 },
            end: { line: 0, character: 1 },
          },
          selectionRange: {
            start: { line: 0, character: 0 },
            end: { line: 0, character: 1 },
          },
        },
        {
          name: 'field',
          kind: 8,
          range: {
            start: { line: 0, character: 0 },
            end: { line: 0, character: 1 },
          },
          selectionRange: {
            start: { line: 0, character: 0 },
            end: { line: 0, character: 1 },
          },
        },
        {
          name: 'constructor',
          kind: 9,
          range: {
            start: { line: 0, character: 0 },
            end: { line: 0, character: 1 },
          },
          selectionRange: {
            start: { line: 0, character: 0 },
            end: { line: 0, character: 1 },
          },
        },
        {
          name: 'enum',
          kind: 10,
          range: {
            start: { line: 0, character: 0 },
            end: { line: 0, character: 1 },
          },
          selectionRange: {
            start: { line: 0, character: 0 },
            end: { line: 0, character: 1 },
          },
        },
        {
          name: 'interface',
          kind: 11,
          range: {
            start: { line: 0, character: 0 },
            end: { line: 0, character: 1 },
          },
          selectionRange: {
            start: { line: 0, character: 0 },
            end: { line: 0, character: 1 },
          },
        },
        {
          name: 'function',
          kind: 12,
          range: {
            start: { line: 0, character: 0 },
            end: { line: 0, character: 1 },
          },
          selectionRange: {
            start: { line: 0, character: 0 },
            end: { line: 0, character: 1 },
          },
        },
        {
          name: 'variable',
          kind: 13,
          range: {
            start: { line: 0, character: 0 },
            end: { line: 0, character: 1 },
          },
          selectionRange: {
            start: { line: 0, character: 0 },
            end: { line: 0, character: 1 },
          },
        },
        {
          name: 'constant',
          kind: 14,
          range: {
            start: { line: 0, character: 0 },
            end: { line: 0, character: 1 },
          },
          selectionRange: {
            start: { line: 0, character: 0 },
            end: { line: 0, character: 1 },
          },
        },
        {
          name: 'string',
          kind: 15,
          range: {
            start: { line: 0, character: 0 },
            end: { line: 0, character: 1 },
          },
          selectionRange: {
            start: { line: 0, character: 0 },
            end: { line: 0, character: 1 },
          },
        },
        {
          name: 'number',
          kind: 16,
          range: {
            start: { line: 0, character: 0 },
            end: { line: 0, character: 1 },
          },
          selectionRange: {
            start: { line: 0, character: 0 },
            end: { line: 0, character: 1 },
          },
        },
        {
          name: 'boolean',
          kind: 17,
          range: {
            start: { line: 0, character: 0 },
            end: { line: 0, character: 1 },
          },
          selectionRange: {
            start: { line: 0, character: 0 },
            end: { line: 0, character: 1 },
          },
        },
        {
          name: 'array',
          kind: 18,
          range: {
            start: { line: 0, character: 0 },
            end: { line: 0, character: 1 },
          },
          selectionRange: {
            start: { line: 0, character: 0 },
            end: { line: 0, character: 1 },
          },
        },
        {
          name: 'object',
          kind: 19,
          range: {
            start: { line: 0, character: 0 },
            end: { line: 0, character: 1 },
          },
          selectionRange: {
            start: { line: 0, character: 0 },
            end: { line: 0, character: 1 },
          },
        },
        {
          name: 'key',
          kind: 20,
          range: {
            start: { line: 0, character: 0 },
            end: { line: 0, character: 1 },
          },
          selectionRange: {
            start: { line: 0, character: 0 },
            end: { line: 0, character: 1 },
          },
        },
        {
          name: 'null',
          kind: 21,
          range: {
            start: { line: 0, character: 0 },
            end: { line: 0, character: 1 },
          },
          selectionRange: {
            start: { line: 0, character: 0 },
            end: { line: 0, character: 1 },
          },
        },
        {
          name: 'enumMember',
          kind: 22,
          range: {
            start: { line: 0, character: 0 },
            end: { line: 0, character: 1 },
          },
          selectionRange: {
            start: { line: 0, character: 0 },
            end: { line: 0, character: 1 },
          },
        },
        {
          name: 'struct',
          kind: 23,
          range: {
            start: { line: 0, character: 0 },
            end: { line: 0, character: 1 },
          },
          selectionRange: {
            start: { line: 0, character: 0 },
            end: { line: 0, character: 1 },
          },
        },
        {
          name: 'event',
          kind: 24,
          range: {
            start: { line: 0, character: 0 },
            end: { line: 0, character: 1 },
          },
          selectionRange: {
            start: { line: 0, character: 0 },
            end: { line: 0, character: 1 },
          },
        },
        {
          name: 'operator',
          kind: 25,
          range: {
            start: { line: 0, character: 0 },
            end: { line: 0, character: 1 },
          },
          selectionRange: {
            start: { line: 0, character: 0 },
            end: { line: 0, character: 1 },
          },
        },
        {
          name: 'typeParameter',
          kind: 26,
          range: {
            start: { line: 0, character: 0 },
            end: { line: 0, character: 1 },
          },
          selectionRange: {
            start: { line: 0, character: 0 },
            end: { line: 0, character: 1 },
          },
        },
      ];

      mockLSPBridge.request
        .mockResolvedValueOnce(symbols)
        .mockResolvedValueOnce(null);

      const result = await handleAnalyze(
        input,
        mockLSPBridge,
        mockOpenCodeAdapter
      );

      expect(result.summary).toContain('File: 1');
      expect(result.summary).toContain('Module: 1');
      expect(result.summary).toContain('TypeParameter: 1');
    });
  });

  describe('diagnostic handling', () => {
    it('should count diagnostics by severity', async () => {
      const input: AnalyzeInput = {
        path: '/test/file.ts',
      };

      mockReadFile.mockResolvedValue('content');

      const diagnostics: Diagnostic[] = [
        {
          severity: 1,
          message: 'Error',
          range: {
            start: { line: 0, character: 0 },
            end: { line: 0, character: 1 },
          },
        },
        {
          severity: 2,
          message: 'Warning',
          range: {
            start: { line: 1, character: 0 },
            end: { line: 1, character: 1 },
          },
        },
        {
          severity: 3,
          message: 'Info',
          range: {
            start: { line: 2, character: 0 },
            end: { line: 2, character: 1 },
          },
        },
        {
          severity: 4,
          message: 'Hint',
          range: {
            start: { line: 3, character: 0 },
            end: { line: 3, character: 1 },
          },
        },
      ];

      mockLSPBridge.request
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce({ items: [{ diagnostics }] });

      const result = await handleAnalyze(
        input,
        mockLSPBridge,
        mockOpenCodeAdapter
      );

      expect(result.summary).toContain('Errors: 1');
      expect(result.summary).toContain('Warnings: 1');
      expect(result.summary).toContain('Info: 1');
      expect(result.summary).toContain('Hints: 1');
    });

    it('should handle null diagnostic result', async () => {
      const input: AnalyzeInput = {
        path: '/test/file.ts',
      };

      mockReadFile.mockResolvedValue('content');
      mockLSPBridge.request
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce(null);

      const result = await handleAnalyze(
        input,
        mockLSPBridge,
        mockOpenCodeAdapter
      );

      expect(result.summary).toContain('Issues: 0 total');
    });

    it('should handle empty diagnostic items', async () => {
      const input: AnalyzeInput = {
        path: '/test/file.ts',
      };

      mockReadFile.mockResolvedValue('content');
      mockLSPBridge.request
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce({ items: [] });

      const result = await handleAnalyze(
        input,
        mockLSPBridge,
        mockOpenCodeAdapter
      );

      expect(result.summary).toContain('Issues: 0 total');
    });

    it('should handle diagnostic request errors gracefully', async () => {
      const input: AnalyzeInput = {
        path: '/test/file.ts',
      };

      mockReadFile.mockResolvedValue('content');
      mockLSPBridge.request
        .mockResolvedValueOnce([])
        .mockRejectedValueOnce(new Error('Method not supported'));

      const result = await handleAnalyze(
        input,
        mockLSPBridge,
        mockOpenCodeAdapter
      );

      expect(result.diagnostics).toEqual([]);
      expect(result.summary).toContain('Issues: 0 total');
    });

    it('should list specific issues at depth 2', async () => {
      const input: AnalyzeInput = {
        path: '/test/file.ts',
        depth: 2,
      };

      mockReadFile.mockResolvedValue('content');

      const diagnostics: Diagnostic[] = [
        {
          severity: 1,
          message: 'Type error',
          range: {
            start: { line: 5, character: 10 },
            end: { line: 5, character: 20 },
          },
        },
      ];

      mockLSPBridge.request
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce({ items: [{ diagnostics }] });

      const result = await handleAnalyze(
        input,
        mockLSPBridge,
        mockOpenCodeAdapter
      );

      expect(result.summary).toContain('Issues found:');
      expect(result.summary).toContain('[Error] Line 6: Type error');
    });

    it('should limit issues at depth 2', async () => {
      const input: AnalyzeInput = {
        path: '/test/file.ts',
        depth: 2,
      };

      mockReadFile.mockResolvedValue('content');

      const diagnostics: Diagnostic[] = Array(15)
        .fill(null)
        .map((_, i) => ({
          severity: 1,
          message: `Error ${i}`,
          range: {
            start: { line: i, character: 0 },
            end: { line: i, character: 1 },
          },
        }));

      mockLSPBridge.request
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce({ items: [{ diagnostics }] });

      const result = await handleAnalyze(
        input,
        mockLSPBridge,
        mockOpenCodeAdapter
      );

      expect(result.summary).toContain('and 5 more');
    });

    it('should show more issues at depth 3', async () => {
      const input: AnalyzeInput = {
        path: '/test/file.ts',
        depth: 3,
      };

      mockReadFile.mockResolvedValue('content');

      const diagnostics: Diagnostic[] = Array(25)
        .fill(null)
        .map((_, i) => ({
          severity: 1,
          message: `Error ${i}`,
          range: {
            start: { line: i, character: 0 },
            end: { line: i, character: 1 },
          },
        }));

      mockLSPBridge.request
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce({ items: [{ diagnostics }] });

      const result = await handleAnalyze(
        input,
        mockLSPBridge,
        mockOpenCodeAdapter
      );

      expect(result.summary).toContain('and 5 more');
    });
  });

  describe('language detection', () => {
    it.each([
      ['/test/file.ts', 'typescript'],
      ['/test/file.tsx', 'typescriptreact'],
      ['/test/file.js', 'javascript'],
      ['/test/file.jsx', 'javascriptreact'],
      ['/test/file.py', 'python'],
      ['/test/file.java', 'java'],
      ['/test/file.go', 'go'],
      ['/test/file.rs', 'rust'],
      ['/test/file.cpp', 'cpp'],
      ['/test/file.c', 'c'],
      ['/test/file.cs', 'csharp'],
      ['/test/file.rb', 'ruby'],
      ['/test/file.php', 'php'],
      ['/test/file.swift', 'swift'],
      ['/test/file.kt', 'kotlin'],
      ['/test/file.scala', 'scala'],
      ['/test/file.html', 'html'],
      ['/test/file.css', 'css'],
      ['/test/file.scss', 'scss'],
      ['/test/file.json', 'json'],
      ['/test/file.yaml', 'yaml'],
      ['/test/file.yml', 'yaml'],
      ['/test/file.xml', 'xml'],
      ['/test/file.md', 'markdown'],
      ['/test/file.sql', 'sql'],
      ['/test/file.sh', 'shellscript'],
      ['/test/file.ps1', 'powershell'],
      ['/test/Dockerfile', 'dockerfile'],
      ['/test/file.vue', 'vue'],
      ['/test/file.svelte', 'svelte'],
      ['/test/file.unknown', 'plaintext'],
    ])('should detect %s as %s', async (filePath, expectedLanguage) => {
      const input: AnalyzeInput = {
        path: filePath,
      };

      mockReadFile.mockResolvedValue('content');
      mockLSPBridge.request.mockResolvedValue([]);

      await handleAnalyze(input, mockLSPBridge, mockOpenCodeAdapter);

      expect(mockLSPBridge.didOpen).toHaveBeenCalledWith(
        expect.objectContaining({
          languageId: expectedLanguage,
        })
      );
    });

    it('should handle files without extension as plaintext', async () => {
      const input: AnalyzeInput = {
        path: '/test/Makefile',
      };

      mockReadFile.mockResolvedValue('content');
      mockLSPBridge.request.mockResolvedValue([]);

      await handleAnalyze(input, mockLSPBridge, mockOpenCodeAdapter);

      expect(mockLSPBridge.didOpen).toHaveBeenCalledWith(
        expect.objectContaining({
          languageId: 'plaintext',
        })
      );
    });
  });

  describe('edge cases', () => {
    it('should handle symbol request errors gracefully', async () => {
      const input: AnalyzeInput = {
        path: '/test/file.ts',
      };

      mockReadFile.mockResolvedValue('content');
      mockLSPBridge.request
        .mockRejectedValueOnce(new Error('Method not supported'))
        .mockResolvedValueOnce(null);

      const result = await handleAnalyze(
        input,
        mockLSPBridge,
        mockOpenCodeAdapter
      );

      expect(result.symbols).toEqual([]);
      expect(result.summary).toContain('No symbols found');
    });

    it('should handle null symbol result', async () => {
      const input: AnalyzeInput = {
        path: '/test/file.ts',
      };

      mockReadFile.mockResolvedValue('content');
      mockLSPBridge.request
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null);

      const result = await handleAnalyze(
        input,
        mockLSPBridge,
        mockOpenCodeAdapter
      );

      expect(result.symbols).toEqual([]);
    });

    it('should handle empty symbol array', async () => {
      const input: AnalyzeInput = {
        path: '/test/file.ts',
      };

      mockReadFile.mockResolvedValue('content');
      mockLSPBridge.request.mockResolvedValue([]);

      const result = await handleAnalyze(
        input,
        mockLSPBridge,
        mockOpenCodeAdapter
      );

      expect(result.summary).toContain('(No symbols found)');
    });

    it('should handle file with only whitespace', async () => {
      const input: AnalyzeInput = {
        path: '/test/file.ts',
      };

      mockReadFile.mockResolvedValue('   \n   \n   ');
      mockLSPBridge.request.mockResolvedValue([]);

      const result = await handleAnalyze(
        input,
        mockLSPBridge,
        mockOpenCodeAdapter
      );

      expect(result.summary).toContain('Lines: 3');
    });
  });

  describe('summary output', () => {
    it('should include file path in summary', async () => {
      const input: AnalyzeInput = {
        path: '/test/myfile.ts',
      };

      mockReadFile.mockResolvedValue('content');
      mockLSPBridge.request.mockResolvedValue([]);

      const result = await handleAnalyze(
        input,
        mockLSPBridge,
        mockOpenCodeAdapter
      );

      expect(result.summary).toContain('Analysis of /test/myfile.ts');
    });

    it('should show no issues when clean', async () => {
      const input: AnalyzeInput = {
        path: '/test/file.ts',
      };

      mockReadFile.mockResolvedValue('content');
      mockLSPBridge.request.mockResolvedValue([]);

      const result = await handleAnalyze(
        input,
        mockLSPBridge,
        mockOpenCodeAdapter
      );

      expect(result.summary).toContain('(No issues found)');
    });

    it('should show character count', async () => {
      const input: AnalyzeInput = {
        path: '/test/file.ts',
      };

      mockReadFile.mockResolvedValue('hello world');
      mockLSPBridge.request.mockResolvedValue([]);

      const result = await handleAnalyze(
        input,
        mockLSPBridge,
        mockOpenCodeAdapter
      );

      expect(result.summary).toContain('Characters: 11');
    });
  });
});
