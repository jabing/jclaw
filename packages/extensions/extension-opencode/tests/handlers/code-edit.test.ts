/**
 * Tests for Code Edit Handler
 *
 * Unit tests for the AI-powered code editing handler using mocked
 * file system, LSP bridge, and OpenCode adapter.
 *
 * @module @jclaw/extension-opencode/tests/handlers/code-edit
 */

import { handleCodeEdit, CodeEditInput } from '../../src/handlers/code-edit';
import { LSPBridge } from '../../src/lsp-bridge';
import { OpenCodeAdapter } from '../../src/adapter';
import { readFile, writeFile } from 'fs/promises';
import type { TextEdit } from 'vscode-languageserver-protocol';

// Mock fs/promises
jest.mock('fs/promises', () => ({
  readFile: jest.fn(),
  writeFile: jest.fn(),
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

describe('handleCodeEdit', () => {
  let mockLSPBridge: jest.Mocked<LSPBridge>;
  let mockOpenCodeAdapter: jest.Mocked<OpenCodeAdapter>;
  const mockReadFile = readFile as jest.MockedFunction<typeof readFile>;
  const mockWriteFile = writeFile as jest.MockedFunction<typeof writeFile>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockLSPBridge = createMockLSPBridge();
    mockOpenCodeAdapter = createMockOpenCodeAdapter();
    // Default mock for writeFile to resolve successfully
    mockWriteFile.mockResolvedValue(undefined);
  });

  describe('basic input validation', () => {
    it('should handle missing file gracefully', async () => {
      const input: CodeEditInput = {
        file: '/nonexistent/file.ts',
        instruction: 'Add a comment',
      };

      mockReadFile.mockRejectedValue(new Error('ENOENT: file not found'));

      const result = await handleCodeEdit(
        input,
        mockLSPBridge,
        mockOpenCodeAdapter
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('ENOENT');
      expect(result.edits).toEqual([]);
    });

    it('should handle empty instruction', async () => {
      const input: CodeEditInput = {
        file: '/test/file.ts',
        instruction: '',
      };

      const fileContent = 'const x = 1;';
      mockReadFile.mockResolvedValue(fileContent);
      mockOpenCodeAdapter.run.mockResolvedValue({
        stdout: '[]',
        stderr: '',
        exitCode: 0,
        duration: 1000,
      });

      const result = await handleCodeEdit(
        input,
        mockLSPBridge,
        mockOpenCodeAdapter
      );

      expect(result.success).toBe(true);
      expect(mockOpenCodeAdapter.run).toHaveBeenCalledWith(
        expect.stringContaining('Instruction:'),
        expect.any(Object)
      );
    });
  });

  describe('successful edits', () => {
    it('should apply single edit successfully', async () => {
      const input: CodeEditInput = {
        file: '/test/file.ts',
        instruction: 'Add a comment',
      };

      const fileContent = 'const x = 1;';
      mockReadFile.mockResolvedValue(fileContent);

      const edits: TextEdit[] = [
        {
          range: {
            start: { line: 0, character: 0 },
            end: { line: 0, character: 0 },
          },
          newText: '// Comment\n',
        },
      ];

      mockOpenCodeAdapter.run.mockResolvedValue({
        stdout: JSON.stringify(edits),
        stderr: '',
        exitCode: 0,
        duration: 1000,
      });

      const result = await handleCodeEdit(
        input,
        mockLSPBridge,
        mockOpenCodeAdapter
      );

      expect(result.success).toBe(true);
      expect(result.edits).toHaveLength(1);
      expect(mockLSPBridge.didOpen).toHaveBeenCalled();
      expect(mockLSPBridge.didChange).toHaveBeenCalled();
      expect(mockLSPBridge.didSave).toHaveBeenCalled();
      expect(mockWriteFile).toHaveBeenCalled();
    });

    it('should apply multiple edits in correct order', async () => {
      const input: CodeEditInput = {
        file: '/test/file.ts',
        instruction: 'Add comments',
      };

      const fileContent = 'const x = 1;\nconst y = 2;';
      mockReadFile.mockResolvedValue(fileContent);

      const edits: TextEdit[] = [
        {
          range: {
            start: { line: 0, character: 0 },
            end: { line: 0, character: 0 },
          },
          newText: '// First comment\n',
        },
        {
          range: {
            start: { line: 1, character: 0 },
            end: { line: 1, character: 0 },
          },
          newText: '// Second comment\n',
        },
      ];

      mockOpenCodeAdapter.run.mockResolvedValue({
        stdout: JSON.stringify(edits),
        stderr: '',
        exitCode: 0,
        duration: 1000,
      });

      const result = await handleCodeEdit(
        input,
        mockLSPBridge,
        mockOpenCodeAdapter
      );

      expect(result.success).toBe(true);
      expect(result.edits).toHaveLength(2);
    });

    it('should handle multi-line replacement', async () => {
      const input: CodeEditInput = {
        file: '/test/file.ts',
        instruction: 'Replace function',
      };

      const fileContent = 'function oldFunc() {\n  return 1;\n}';
      mockReadFile.mockResolvedValue(fileContent);

      const edits: TextEdit[] = [
        {
          range: {
            start: { line: 0, character: 0 },
            end: { line: 2, character: 1 },
          },
          newText: 'function newFunc() {\n  return 2;\n}',
        },
      ];

      mockOpenCodeAdapter.run.mockResolvedValue({
        stdout: JSON.stringify(edits),
        stderr: '',
        exitCode: 0,
        duration: 1000,
      });

      const result = await handleCodeEdit(
        input,
        mockLSPBridge,
        mockOpenCodeAdapter
      );

      expect(result.success).toBe(true);
      expect(mockWriteFile).toHaveBeenCalledWith(
        input.file,
        'function newFunc() {\n  return 2;\n}',
        'utf-8'
      );
    });

    it('should handle single-line partial edit', async () => {
      const input: CodeEditInput = {
        file: '/test/file.ts',
        instruction: 'Change variable name',
      };

      const fileContent = 'const oldName = 1;';
      mockReadFile.mockResolvedValue(fileContent);

      const edits: TextEdit[] = [
        {
          range: {
            start: { line: 0, character: 6 },
            end: { line: 0, character: 13 },
          },
          newText: 'newName',
        },
      ];

      mockOpenCodeAdapter.run.mockResolvedValue({
        stdout: JSON.stringify(edits),
        stderr: '',
        exitCode: 0,
        duration: 1000,
      });

      const result = await handleCodeEdit(
        input,
        mockLSPBridge,
        mockOpenCodeAdapter
      );

      expect(result.success).toBe(true);
      expect(mockWriteFile).toHaveBeenCalledWith(
        input.file,
        'const newName = 1;',
        'utf-8'
      );
    });
  });

  describe('OpenCode failures', () => {
    it('should handle non-zero exit code', async () => {
      const input: CodeEditInput = {
        file: '/test/file.ts',
        instruction: 'Edit code',
      };

      mockReadFile.mockResolvedValue('const x = 1;');
      mockOpenCodeAdapter.run.mockResolvedValue({
        stdout: '',
        stderr: 'Error: Model not available',
        exitCode: 1,
        duration: 1000,
      });

      const result = await handleCodeEdit(
        input,
        mockLSPBridge,
        mockOpenCodeAdapter
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('OpenCode failed');
      expect(result.error).toContain('Model not available');
    });

    it('should handle OpenCode timeout', async () => {
      const input: CodeEditInput = {
        file: '/test/file.ts',
        instruction: 'Edit code',
      };

      mockReadFile.mockResolvedValue('const x = 1;');
      mockOpenCodeAdapter.run.mockRejectedValue(new Error('Timeout'));

      const result = await handleCodeEdit(
        input,
        mockLSPBridge,
        mockOpenCodeAdapter
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('Timeout');
    });

    it('should handle OpenCode throwing error', async () => {
      const input: CodeEditInput = {
        file: '/test/file.ts',
        instruction: 'Edit code',
      };

      mockReadFile.mockResolvedValue('const x = 1;');
      mockOpenCodeAdapter.run.mockRejectedValue(new Error('Network error'));

      const result = await handleCodeEdit(
        input,
        mockLSPBridge,
        mockOpenCodeAdapter
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('Network error');
    });
  });

  describe('edit parsing', () => {
    it('should return empty edits when AI suggests no changes', async () => {
      const input: CodeEditInput = {
        file: '/test/file.ts',
        instruction: 'Optimize code',
      };

      mockReadFile.mockResolvedValue('const x = 1;');
      mockOpenCodeAdapter.run.mockResolvedValue({
        stdout: '[]',
        stderr: '',
        exitCode: 0,
        duration: 1000,
      });

      const result = await handleCodeEdit(
        input,
        mockLSPBridge,
        mockOpenCodeAdapter
      );

      expect(result.success).toBe(true);
      expect(result.edits).toEqual([]);
      expect(result.error).toBe('No edits suggested by AI');
    });

    it('should handle JSON wrapped in markdown code blocks', async () => {
      const input: CodeEditInput = {
        file: '/test/file.ts',
        instruction: 'Add type annotation',
      };

      mockReadFile.mockResolvedValue('let x = 1;');

      const edits: TextEdit[] = [
        {
          range: {
            start: { line: 0, character: 4 },
            end: { line: 0, character: 5 },
          },
          newText: 'x: number',
        },
      ];

      mockOpenCodeAdapter.run.mockResolvedValue({
        stdout: `Here are the edits:
\`\`\`json
${JSON.stringify(edits)}
\`\`\``,
        stderr: '',
        exitCode: 0,
        duration: 1000,
      });

      const result = await handleCodeEdit(
        input,
        mockLSPBridge,
        mockOpenCodeAdapter
      );

      expect(result.success).toBe(true);
      expect(result.edits).toHaveLength(1);
    });

    it('should handle invalid JSON gracefully', async () => {
      const input: CodeEditInput = {
        file: '/test/file.ts',
        instruction: 'Edit code',
      };

      mockReadFile.mockResolvedValue('const x = 1;');
      mockOpenCodeAdapter.run.mockResolvedValue({
        stdout: 'This is not valid JSON',
        stderr: '',
        exitCode: 0,
        duration: 1000,
      });

      const result = await handleCodeEdit(
        input,
        mockLSPBridge,
        mockOpenCodeAdapter
      );

      expect(result.success).toBe(true);
      expect(result.edits).toEqual([]);
    });

    it('should filter out invalid edit objects', async () => {
      const input: CodeEditInput = {
        file: '/test/file.ts',
        instruction: 'Edit code',
      };

      mockReadFile.mockResolvedValue('const x = 1;');

      const mixedEdits = [
        {
          range: {
            start: { line: 0, character: 0 },
            end: { line: 0, character: 0 },
          },
          newText: '// valid',
        },
        { invalid: 'no range' },
        { range: { start: { line: 0 } }, newText: 'incomplete' },
      ];

      mockOpenCodeAdapter.run.mockResolvedValue({
        stdout: JSON.stringify(mixedEdits),
        stderr: '',
        exitCode: 0,
        duration: 1000,
      });

      const result = await handleCodeEdit(
        input,
        mockLSPBridge,
        mockOpenCodeAdapter
      );

      expect(result.success).toBe(true);
      expect(result.edits).toHaveLength(1);
    });
  });

  describe('search/replace fallback', () => {
    it('should extract edits from search/replace format', async () => {
      const input: CodeEditInput = {
        file: '/test/file.ts',
        instruction: 'Rename variable',
      };

      mockReadFile.mockResolvedValue('const oldVar = 1;');
      mockOpenCodeAdapter.run.mockResolvedValue({
        stdout: `Search:
\`\`\`
const oldVar
\`\`\`
Replace:
\`\`\`
const newVar
\`\`\``,
        stderr: '',
        exitCode: 0,
        duration: 1000,
      });

      const result = await handleCodeEdit(
        input,
        mockLSPBridge,
        mockOpenCodeAdapter
      );

      expect(result.success).toBe(true);
      expect(result.edits).toHaveLength(1);
      expect(result.edits[0]!.newText).toBe('const newVar');
    });

    it('should handle find/with format', async () => {
      const input: CodeEditInput = {
        file: '/test/file.ts',
        instruction: 'Change value',
      };

      mockReadFile.mockResolvedValue('const x = 5;');
      mockOpenCodeAdapter.run.mockResolvedValue({
        stdout: `Find:
\`\`\`
= 5
\`\`\`
With:
\`\`\`
= 10
\`\`\``,
        stderr: '',
        exitCode: 0,
        duration: 1000,
      });

      const result = await handleCodeEdit(
        input,
        mockLSPBridge,
        mockOpenCodeAdapter
      );

      expect(result.success).toBe(true);
      expect(result.edits).toHaveLength(1);
    });

    it('should skip search/replace when text not found', async () => {
      const input: CodeEditInput = {
        file: '/test/file.ts',
        instruction: 'Edit code',
      };

      mockReadFile.mockResolvedValue('const x = 1;');
      mockOpenCodeAdapter.run.mockResolvedValue({
        stdout: `Search:
\`\`\`
nonexistent text
\`\`\`
Replace:
\`\`\`
replacement
\`\`\``,
        stderr: '',
        exitCode: 0,
        duration: 1000,
      });

      const result = await handleCodeEdit(
        input,
        mockLSPBridge,
        mockOpenCodeAdapter
      );

      expect(result.success).toBe(true);
      expect(result.edits).toEqual([]);
    });
  });

  describe('LSP integration', () => {
    it('should call didOpen with correct document', async () => {
      const input: CodeEditInput = {
        file: '/test/file.ts',
        instruction: 'Add comment',
      };

      mockReadFile.mockResolvedValue('const x = 1;');
      mockOpenCodeAdapter.run.mockResolvedValue({
        stdout: '[]',
        stderr: '',
        exitCode: 0,
        duration: 1000,
      });

      await handleCodeEdit(input, mockLSPBridge, mockOpenCodeAdapter);

      expect(mockLSPBridge.didOpen).toHaveBeenCalledWith(
        expect.objectContaining({
          uri: 'file:///test/file.ts',
          languageId: 'typescript',
          version: 1,
          text: 'const x = 1;',
        })
      );
    });

    it('should call didChange with correct changes', async () => {
      const input: CodeEditInput = {
        file: '/test/file.ts',
        instruction: 'Add comment',
      };

      mockReadFile.mockResolvedValue('const x = 1;');

      const edits: TextEdit[] = [
        {
          range: {
            start: { line: 0, character: 0 },
            end: { line: 0, character: 0 },
          },
          newText: '// Comment\n',
        },
      ];

      mockOpenCodeAdapter.run.mockResolvedValue({
        stdout: JSON.stringify(edits),
        stderr: '',
        exitCode: 0,
        duration: 1000,
      });

      await handleCodeEdit(input, mockLSPBridge, mockOpenCodeAdapter);

      expect(mockLSPBridge.didChange).toHaveBeenCalledWith(
        expect.objectContaining({
          uri: 'file:///test/file.ts',
          version: 1,
        }),
        expect.arrayContaining([
          expect.objectContaining({
            range: edits[0]!.range,
            text: '// Comment\n',
          }),
        ])
      );
    });

    it('should call didSave with updated content', async () => {
      const input: CodeEditInput = {
        file: '/test/file.ts',
        instruction: 'Add comment',
      };

      mockReadFile.mockResolvedValue('const x = 1;');

      const edits: TextEdit[] = [
        {
          range: {
            start: { line: 0, character: 0 },
            end: { line: 0, character: 0 },
          },
          newText: '// Comment\n',
        },
      ];

      mockOpenCodeAdapter.run.mockResolvedValue({
        stdout: JSON.stringify(edits),
        stderr: '',
        exitCode: 0,
        duration: 1000,
      });

      await handleCodeEdit(input, mockLSPBridge, mockOpenCodeAdapter);

      expect(mockLSPBridge.didSave).toHaveBeenCalledWith(
        'file:///test/file.ts',
        '// Comment\nconst x = 1;'
      );
    });
  });

  describe('file system operations', () => {
    it('should read file as utf-8', async () => {
      const input: CodeEditInput = {
        file: '/test/file.ts',
        instruction: 'Edit code',
      };

      mockReadFile.mockResolvedValue('const x = 1;');
      mockOpenCodeAdapter.run.mockResolvedValue({
        stdout: '[]',
        stderr: '',
        exitCode: 0,
        duration: 1000,
      });

      await handleCodeEdit(input, mockLSPBridge, mockOpenCodeAdapter);

      expect(mockReadFile).toHaveBeenCalledWith('/test/file.ts', 'utf-8');
    });

    it('should write updated content to file', async () => {
      const input: CodeEditInput = {
        file: '/test/file.ts',
        instruction: 'Add comment',
      };

      mockReadFile.mockResolvedValue('const x = 1;');

      const edits: TextEdit[] = [
        {
          range: {
            start: { line: 0, character: 0 },
            end: { line: 0, character: 0 },
          },
          newText: '// Comment\n',
        },
      ];

      mockOpenCodeAdapter.run.mockResolvedValue({
        stdout: JSON.stringify(edits),
        stderr: '',
        exitCode: 0,
        duration: 1000,
      });

      await handleCodeEdit(input, mockLSPBridge, mockOpenCodeAdapter);

      expect(mockWriteFile).toHaveBeenCalledWith(
        '/test/file.ts',
        '// Comment\nconst x = 1;',
        'utf-8'
      );
    });

    it('should handle write file errors', async () => {
      const input: CodeEditInput = {
        file: '/test/file.ts',
        instruction: 'Add comment',
      };

      mockReadFile.mockResolvedValue('const x = 1;');
      mockOpenCodeAdapter.run.mockResolvedValue({
        stdout:
          '[{"range":{"start":{"line":0,"character":0},"end":{"line":0,"character":0}},"newText":"//"}]',
        stderr: '',
        exitCode: 0,
        duration: 1000,
      });
      mockWriteFile.mockRejectedValue(new Error('Permission denied'));

      const result = await handleCodeEdit(
        input,
        mockLSPBridge,
        mockOpenCodeAdapter
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('Permission denied');
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
      const input: CodeEditInput = {
        file: filePath,
        instruction: 'Edit code',
      };

      mockReadFile.mockResolvedValue('content');
      mockOpenCodeAdapter.run.mockResolvedValue({
        stdout: '[]',
        stderr: '',
        exitCode: 0,
        duration: 1000,
      });

      await handleCodeEdit(input, mockLSPBridge, mockOpenCodeAdapter);

      expect(mockLSPBridge.didOpen).toHaveBeenCalledWith(
        expect.objectContaining({
          languageId: expectedLanguage,
        })
      );
    });

    it('should handle files without extension as plaintext', async () => {
      const input: CodeEditInput = {
        file: '/test/Makefile',
        instruction: 'Edit code',
      };

      mockReadFile.mockResolvedValue('content');
      mockOpenCodeAdapter.run.mockResolvedValue({
        stdout: '[]',
        stderr: '',
        exitCode: 0,
        duration: 1000,
      });

      await handleCodeEdit(input, mockLSPBridge, mockOpenCodeAdapter);

      expect(mockLSPBridge.didOpen).toHaveBeenCalledWith(
        expect.objectContaining({
          languageId: 'makefile',
        })
      );
    });
  });

  describe('complex scenarios', () => {
    it('should handle full file replacement', async () => {
      const input: CodeEditInput = {
        file: '/test/file.ts',
        instruction: 'Rewrite entire file',
      };

      mockReadFile.mockResolvedValue('old content');

      const edits: TextEdit[] = [
        {
          range: {
            start: { line: 0, character: 0 },
            end: { line: 0, character: 11 },
          },
          newText: 'new content here',
        },
      ];

      mockOpenCodeAdapter.run.mockResolvedValue({
        stdout: JSON.stringify(edits),
        stderr: '',
        exitCode: 0,
        duration: 1000,
      });

      const result = await handleCodeEdit(
        input,
        mockLSPBridge,
        mockOpenCodeAdapter
      );

      expect(result.success).toBe(true);
      expect(mockWriteFile).toHaveBeenCalledWith(
        input.file,
        'new content here',
        'utf-8'
      );
    });

    it('should handle edits at end of file', async () => {
      const input: CodeEditInput = {
        file: '/test/file.ts',
        instruction: 'Add at end',
      };

      mockReadFile.mockResolvedValue('line1\nline2');

      const edits: TextEdit[] = [
        {
          range: {
            start: { line: 1, character: 5 },
            end: { line: 1, character: 5 },
          },
          newText: '\nline3',
        },
      ];

      mockOpenCodeAdapter.run.mockResolvedValue({
        stdout: JSON.stringify(edits),
        stderr: '',
        exitCode: 0,
        duration: 1000,
      });

      const result = await handleCodeEdit(
        input,
        mockLSPBridge,
        mockOpenCodeAdapter
      );

      expect(result.success).toBe(true);
      expect(mockWriteFile).toHaveBeenCalledWith(
        input.file,
        'line1\nline2\nline3',
        'utf-8'
      );
    });

    it('should handle empty file', async () => {
      const input: CodeEditInput = {
        file: '/test/file.ts',
        instruction: 'Add content',
      };

      mockReadFile.mockResolvedValue('');

      const edits: TextEdit[] = [
        {
          range: {
            start: { line: 0, character: 0 },
            end: { line: 0, character: 0 },
          },
          newText: 'new content',
        },
      ];

      mockOpenCodeAdapter.run.mockResolvedValue({
        stdout: JSON.stringify(edits),
        stderr: '',
        exitCode: 0,
        duration: 1000,
      });

      const result = await handleCodeEdit(
        input,
        mockLSPBridge,
        mockOpenCodeAdapter
      );

      expect(result.success).toBe(true);
      expect(mockWriteFile).toHaveBeenCalledWith(
        input.file,
        'new content',
        'utf-8'
      );
    });

    it('should handle multiple edits on same line', async () => {
      const input: CodeEditInput = {
        file: '/test/file.ts',
        instruction: 'Multiple changes',
      };

      mockReadFile.mockResolvedValue('abc def ghi');

      const edits: TextEdit[] = [
        {
          range: {
            start: { line: 0, character: 0 },
            end: { line: 0, character: 3 },
          },
          newText: 'xyz',
        },
        {
          range: {
            start: { line: 0, character: 8 },
            end: { line: 0, character: 11 },
          },
          newText: 'jkl',
        },
      ];

      mockOpenCodeAdapter.run.mockResolvedValue({
        stdout: JSON.stringify(edits),
        stderr: '',
        exitCode: 0,
        duration: 1000,
      });

      const result = await handleCodeEdit(
        input,
        mockLSPBridge,
        mockOpenCodeAdapter
      );

      expect(result.success).toBe(true);
      expect(mockWriteFile).toHaveBeenCalledWith(
        input.file,
        'xyz def jkl',
        'utf-8'
      );
    });
  });
});
