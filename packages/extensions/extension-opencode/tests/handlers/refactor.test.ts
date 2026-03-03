/**
 * Tests for Refactor Handler
 *
 * Unit tests for the code refactoring handler using mocked
 * LSP bridge and OpenCode adapter.
 *
 * @module @jclaw/extension-opencode/tests/handlers/refactor
 */

import { handleRefactor, RefactorInput } from '../../src/handlers/refactor';
import { LSPBridge } from '../../src/lsp-bridge';
import { OpenCodeAdapter } from '../../src/adapter';
import type { WorkspaceEdit } from 'vscode-languageserver-protocol';

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

describe('handleRefactor', () => {
  let mockLSPBridge: jest.Mocked<LSPBridge>;
  let mockOpenCodeAdapter: jest.Mocked<OpenCodeAdapter>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockLSPBridge = createMockLSPBridge();
    mockOpenCodeAdapter = createMockOpenCodeAdapter();
  });

  describe('input validation', () => {
    it('should handle unknown strategy', async () => {
      const input: RefactorInput = {
        target: 'myFunction',
        strategy: 'unknown' as 'rename',
        file: '/test/file.ts',
        line: 10,
        character: 5,
      };

      const result = await handleRefactor(
        input,
        mockLSPBridge,
        mockOpenCodeAdapter
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('Unknown refactoring strategy');
    });

    it('should handle when LSP is not ready and AI fallback fails', async () => {
      mockLSPBridge.isReady.mockReturnValue(false);
      mockOpenCodeAdapter.run.mockResolvedValue({
        stdout: 'invalid',
        stderr: '',
        exitCode: 0,
        duration: 1000,
      });

      const input: RefactorInput = {
        target: 'myFunction',
        strategy: 'rename',
        newName: 'newFunction',
        file: '/test/file.ts',
        line: 10,
        character: 5,
      };

      const result = await handleRefactor(
        input,
        mockLSPBridge,
        mockOpenCodeAdapter
      );

      expect(result.success).toBe(false);
      expect(mockOpenCodeAdapter.run).toHaveBeenCalled();
    });
  });

  describe('rename refactoring', () => {
    it('should fail rename without newName', async () => {
      const input: RefactorInput = {
        target: 'oldName',
        strategy: 'rename',
        file: '/test/file.ts',
        line: 10,
        character: 5,
      };

      const result = await handleRefactor(
        input,
        mockLSPBridge,
        mockOpenCodeAdapter
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('New name is required');
    });

    it('should fail rename without file/line/character', async () => {
      const input: RefactorInput = {
        target: 'oldName',
        strategy: 'rename',
        newName: 'newName',
      };

      const result = await handleRefactor(
        input,
        mockLSPBridge,
        mockOpenCodeAdapter
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain(
        'File path, line, and character position are required'
      );
    });

    it('should fail rename without line', async () => {
      const input: RefactorInput = {
        target: 'oldName',
        strategy: 'rename',
        newName: 'newName',
        file: '/test/file.ts',
        character: 5,
      };

      const result = await handleRefactor(
        input,
        mockLSPBridge,
        mockOpenCodeAdapter
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain(
        'File path, line, and character position are required'
      );
    });

    it('should fail rename without character', async () => {
      const input: RefactorInput = {
        target: 'oldName',
        strategy: 'rename',
        newName: 'newName',
        file: '/test/file.ts',
        line: 10,
      };

      const result = await handleRefactor(
        input,
        mockLSPBridge,
        mockOpenCodeAdapter
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain(
        'File path, line, and character position are required'
      );
    });

    it('should perform successful rename', async () => {
      const workspaceEdit: WorkspaceEdit = {
        changes: {
          'file:///test/file.ts': [
            {
              range: {
                start: { line: 10, character: 0 },
                end: { line: 10, character: 7 },
              },
              newText: 'newName',
            },
          ],
        },
      };

      mockLSPBridge.request.mockResolvedValue(workspaceEdit);

      const input: RefactorInput = {
        target: 'oldName',
        strategy: 'rename',
        newName: 'newName',
        file: '/test/file.ts',
        line: 10,
        character: 5,
      };

      const result = await handleRefactor(
        input,
        mockLSPBridge,
        mockOpenCodeAdapter
      );

      expect(result.success).toBe(true);
      expect(mockLSPBridge.request).toHaveBeenCalledWith(
        'textDocument/rename',
        expect.objectContaining({
          textDocument: { uri: 'file:///test/file.ts' },
          position: { line: 10, character: 5 },
          newName: 'newName',
        })
      );
    });

    it('should handle rename returning null', async () => {
      mockLSPBridge.request.mockResolvedValue(null);

      const input: RefactorInput = {
        target: 'oldName',
        strategy: 'rename',
        newName: 'newName',
        file: '/test/file.ts',
        line: 10,
        character: 5,
      };

      const result = await handleRefactor(
        input,
        mockLSPBridge,
        mockOpenCodeAdapter
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('Cannot rename');
    });

    it('should handle rename LSP error', async () => {
      mockLSPBridge.request.mockRejectedValue(new Error('LSP error'));

      const input: RefactorInput = {
        target: 'oldName',
        strategy: 'rename',
        newName: 'newName',
        file: '/test/file.ts',
        line: 10,
        character: 5,
      };

      const result = await handleRefactor(
        input,
        mockLSPBridge,
        mockOpenCodeAdapter
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('Rename failed');
    });

    it('should handle rename with file:// prefix', async () => {
      const workspaceEdit: WorkspaceEdit = {
        changes: {
          'file:///test/file.ts': [
            {
              range: {
                start: { line: 10, character: 0 },
                end: { line: 10, character: 7 },
              },
              newText: 'newName',
            },
          ],
        },
      };

      mockLSPBridge.request.mockResolvedValue(workspaceEdit);

      const input: RefactorInput = {
        target: 'oldName',
        strategy: 'rename',
        newName: 'newName',
        file: 'file:///test/file.ts',
        line: 10,
        character: 5,
      };

      const result = await handleRefactor(
        input,
        mockLSPBridge,
        mockOpenCodeAdapter
      );

      expect(result.success).toBe(true);
    });
  });

  describe('extract refactoring', () => {
    it('should fail extract without file/line/character', async () => {
      const input: RefactorInput = {
        target: 'someCode',
        strategy: 'extract',
      };

      const result = await handleRefactor(
        input,
        mockLSPBridge,
        mockOpenCodeAdapter
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain(
        'File path, line, and character position are required'
      );
    });

    it('should perform successful extract method', async () => {
      const workspaceEdit: WorkspaceEdit = {
        changes: {
          'file:///test/file.ts': [
            {
              range: {
                start: { line: 10, character: 0 },
                end: { line: 15, character: 1 },
              },
              newText: 'extractedMethod()',
            },
          ],
        },
      };

      mockLSPBridge.request.mockResolvedValue(workspaceEdit);

      const input: RefactorInput = {
        target: 'someCode',
        strategy: 'extract',
        file: '/test/file.ts',
        line: 10,
        character: 5,
      };

      const result = await handleRefactor(
        input,
        mockLSPBridge,
        mockOpenCodeAdapter
      );

      expect(result.success).toBe(true);
    });

    it('should try multiple extract commands', async () => {
      mockLSPBridge.request
        .mockRejectedValueOnce(new Error('Not supported'))
        .mockRejectedValueOnce(new Error('Not supported'))
        .mockResolvedValueOnce({
          changes: {
            'file:///test/file.ts': [
              {
                range: {
                  start: { line: 0, character: 0 },
                  end: { line: 0, character: 1 },
                },
                newText: 'extracted',
              },
            ],
          },
        });

      const input: RefactorInput = {
        target: 'someCode',
        strategy: 'extract',
        file: '/test/file.ts',
        line: 10,
        character: 5,
      };

      const result = await handleRefactor(
        input,
        mockLSPBridge,
        mockOpenCodeAdapter
      );

      expect(result.success).toBe(true);
      expect(mockLSPBridge.request).toHaveBeenCalledTimes(3);
    });

    it('should return error when no extract command works', async () => {
      mockLSPBridge.request.mockRejectedValue(new Error('Not supported'));

      const input: RefactorInput = {
        target: 'someCode',
        strategy: 'extract',
        file: '/test/file.ts',
        line: 10,
        character: 5,
      };

      const result = await handleRefactor(
        input,
        mockLSPBridge,
        mockOpenCodeAdapter
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('No suitable extract refactoring');
    });

    it('should handle extract with documentChanges', async () => {
      const workspaceEdit: WorkspaceEdit = {
        documentChanges: [
          {
            kind: 'create',
            uri: 'file:///test/newfile.ts',
          },
        ],
      };

      mockLSPBridge.request.mockResolvedValue(workspaceEdit);

      const input: RefactorInput = {
        target: 'someCode',
        strategy: 'extract',
        file: '/test/file.ts',
        line: 10,
        character: 5,
      };

      const result = await handleRefactor(
        input,
        mockLSPBridge,
        mockOpenCodeAdapter
      );

      expect(result.success).toBe(true);
    });

    it('should skip empty results and continue trying commands', async () => {
      mockLSPBridge.request
        .mockResolvedValueOnce({ changes: {} })
        .mockResolvedValueOnce({ changes: { 'file:///test.ts': [] } })
        .mockResolvedValueOnce({
          changes: {
            'file:///test/file.ts': [
              {
                range: {
                  start: { line: 0, character: 0 },
                  end: { line: 0, character: 1 },
                },
                newText: 'extracted',
              },
            ],
          },
        });

      const input: RefactorInput = {
        target: 'someCode',
        strategy: 'extract',
        file: '/test/file.ts',
        line: 10,
        character: 5,
      };

      const result = await handleRefactor(
        input,
        mockLSPBridge,
        mockOpenCodeAdapter
      );

      expect(result.success).toBe(true);
    });
  });

  describe('inline refactoring', () => {
    it('should fail inline without file/line/character', async () => {
      const input: RefactorInput = {
        target: 'someVar',
        strategy: 'inline',
      };

      const result = await handleRefactor(
        input,
        mockLSPBridge,
        mockOpenCodeAdapter
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain(
        'File path, line, and character position are required'
      );
    });

    it('should perform successful inline', async () => {
      const workspaceEdit: WorkspaceEdit = {
        changes: {
          'file:///test/file.ts': [
            {
              range: {
                start: { line: 10, character: 0 },
                end: { line: 10, character: 10 },
              },
              newText: '42',
            },
          ],
        },
      };

      mockLSPBridge.request.mockResolvedValue(workspaceEdit);

      const input: RefactorInput = {
        target: 'someVar',
        strategy: 'inline',
        file: '/test/file.ts',
        line: 10,
        character: 5,
      };

      const result = await handleRefactor(
        input,
        mockLSPBridge,
        mockOpenCodeAdapter
      );

      expect(result.success).toBe(true);
    });

    it('should try multiple inline commands', async () => {
      mockLSPBridge.request
        .mockRejectedValueOnce(new Error('Not supported'))
        .mockResolvedValueOnce({
          changes: {
            'file:///test/file.ts': [
              {
                range: {
                  start: { line: 0, character: 0 },
                  end: { line: 0, character: 1 },
                },
                newText: 'inlined',
              },
            ],
          },
        });

      const input: RefactorInput = {
        target: 'someVar',
        strategy: 'inline',
        file: '/test/file.ts',
        line: 10,
        character: 5,
      };

      const result = await handleRefactor(
        input,
        mockLSPBridge,
        mockOpenCodeAdapter
      );

      expect(result.success).toBe(true);
      expect(mockLSPBridge.request).toHaveBeenCalledTimes(2);
    });

    it('should return error when no inline command works', async () => {
      mockLSPBridge.request.mockRejectedValue(new Error('Not supported'));

      const input: RefactorInput = {
        target: 'someVar',
        strategy: 'inline',
        file: '/test/file.ts',
        line: 10,
        character: 5,
      };

      const result = await handleRefactor(
        input,
        mockLSPBridge,
        mockOpenCodeAdapter
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('No suitable inline refactoring');
    });
  });

  describe('AI fallback', () => {
    it('should use AI fallback when LSP is not ready', async () => {
      mockLSPBridge.isReady.mockReturnValue(false);
      mockOpenCodeAdapter.run.mockResolvedValue({
        stdout: JSON.stringify({
          changes: {
            'file:///test/file.ts': [
              {
                range: {
                  start: { line: 0, character: 0 },
                  end: { line: 0, character: 1 },
                },
                newText: 'aiRefactored',
              },
            ],
          },
        }),
        stderr: '',
        exitCode: 0,
        duration: 1000,
      });

      const input: RefactorInput = {
        target: 'myFunction',
        strategy: 'rename',
        newName: 'newFunction',
        file: '/test/file.ts',
      };

      const result = await handleRefactor(
        input,
        mockLSPBridge,
        mockOpenCodeAdapter
      );

      expect(result.success).toBe(true);
      expect(mockOpenCodeAdapter.run).toHaveBeenCalled();
    });

    it('should handle AI fallback with TextEdit array format', async () => {
      mockLSPBridge.isReady.mockReturnValue(false);
      mockOpenCodeAdapter.run.mockResolvedValue({
        stdout: JSON.stringify([
          {
            range: {
              start: { line: 0, character: 0 },
              end: { line: 0, character: 1 },
            },
            newText: 'refactored',
          },
        ]),
        stderr: '',
        exitCode: 0,
        duration: 1000,
      });

      const input: RefactorInput = {
        target: 'myFunction',
        strategy: 'extract',
        file: '/test/file.ts',
        line: 10,
        character: 5,
      };

      const result = await handleRefactor(
        input,
        mockLSPBridge,
        mockOpenCodeAdapter
      );

      expect(result.success).toBe(true);
    });

    it('should handle AI fallback failure', async () => {
      mockLSPBridge.isReady.mockReturnValue(false);
      mockOpenCodeAdapter.run.mockResolvedValue({
        stdout: '',
        stderr: 'AI error',
        exitCode: 1,
        duration: 1000,
      });

      const input: RefactorInput = {
        target: 'myFunction',
        strategy: 'rename',
        newName: 'newFunction',
        file: '/test/file.ts',
      };

      const result = await handleRefactor(
        input,
        mockLSPBridge,
        mockOpenCodeAdapter
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('AI refactoring failed');
    });

    it('should handle AI fallback with invalid JSON', async () => {
      mockLSPBridge.isReady.mockReturnValue(false);
      mockOpenCodeAdapter.run.mockResolvedValue({
        stdout: 'not valid json',
        stderr: '',
        exitCode: 0,
        duration: 1000,
      });

      const input: RefactorInput = {
        target: 'myFunction',
        strategy: 'extract',
        file: '/test/file.ts',
      };

      const result = await handleRefactor(
        input,
        mockLSPBridge,
        mockOpenCodeAdapter
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('No refactoring suggestions');
    });

    it('should handle AI fallback throwing error', async () => {
      mockLSPBridge.isReady.mockReturnValue(false);
      mockOpenCodeAdapter.run.mockRejectedValue(new Error('Network error'));

      const input: RefactorInput = {
        target: 'myFunction',
        strategy: 'rename',
        newName: 'newFunction',
        file: '/test/file.ts',
      };

      const result = await handleRefactor(
        input,
        mockLSPBridge,
        mockOpenCodeAdapter
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('AI fallback failed');
    });

    it('should include all context in AI prompt', async () => {
      mockLSPBridge.isReady.mockReturnValue(false);
      mockOpenCodeAdapter.run.mockResolvedValue({
        stdout: '[]',
        stderr: '',
        exitCode: 0,
        duration: 1000,
      });

      const input: RefactorInput = {
        target: 'myFunction',
        strategy: 'rename',
        newName: 'newFunction',
        file: '/test/file.ts',
      };

      await handleRefactor(input, mockLSPBridge, mockOpenCodeAdapter);

      expect(mockOpenCodeAdapter.run).toHaveBeenCalledWith(
        expect.stringContaining('rename'),
        expect.any(Object)
      );
      expect(mockOpenCodeAdapter.run).toHaveBeenCalledWith(
        expect.stringContaining('myFunction'),
        expect.any(Object)
      );
      expect(mockOpenCodeAdapter.run).toHaveBeenCalledWith(
        expect.stringContaining('newFunction'),
        expect.any(Object)
      );
      expect(mockOpenCodeAdapter.run).toHaveBeenCalledWith(
        expect.stringContaining('/test/file.ts'),
        expect.any(Object)
      );
    });

    it('should use 2 minute timeout for AI fallback', async () => {
      mockLSPBridge.isReady.mockReturnValue(false);
      mockOpenCodeAdapter.run.mockResolvedValue({
        stdout: '[]',
        stderr: '',
        exitCode: 0,
        duration: 1000,
      });

      const input: RefactorInput = {
        target: 'myFunction',
        strategy: 'extract',
        file: '/test/file.ts',
      };

      await handleRefactor(input, mockLSPBridge, mockOpenCodeAdapter);

      expect(mockOpenCodeAdapter.run).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          timeout: 120000,
        })
      );
    });
  });

  describe('workspace/executeCommand calls', () => {
    it('should call workspace/executeCommand for extract', async () => {
      mockLSPBridge.request.mockResolvedValue({
        changes: {
          'file:///test.ts': [
            {
              range: {
                start: { line: 0, character: 0 },
                end: { line: 0, character: 1 },
              },
              newText: 'extracted',
            },
          ],
        },
      });

      const input: RefactorInput = {
        target: 'someCode',
        strategy: 'extract',
        file: '/test/file.ts',
        line: 10,
        character: 5,
      };

      await handleRefactor(input, mockLSPBridge, mockOpenCodeAdapter);

      expect(mockLSPBridge.request).toHaveBeenCalledWith(
        'workspace/executeCommand',
        expect.objectContaining({
          command: expect.stringContaining('extract'),
          arguments: expect.arrayContaining([
            expect.objectContaining({
              uri: 'file:///test/file.ts',
              range: {
                start: { line: 10, character: 5 },
                end: { line: 10, character: 5 },
              },
            }),
            'someCode',
          ]),
        })
      );
    });

    it('should call workspace/executeCommand for inline', async () => {
      mockLSPBridge.request.mockResolvedValue({
        changes: {
          'file:///test.ts': [
            {
              range: {
                start: { line: 0, character: 0 },
                end: { line: 0, character: 1 },
              },
              newText: 'inlined',
            },
          ],
        },
      });

      const input: RefactorInput = {
        target: 'someVar',
        strategy: 'inline',
        file: '/test/file.ts',
        line: 10,
        character: 5,
      };

      await handleRefactor(input, mockLSPBridge, mockOpenCodeAdapter);

      expect(mockLSPBridge.request).toHaveBeenCalledWith(
        'workspace/executeCommand',
        expect.objectContaining({
          command: expect.stringContaining('inline'),
          arguments: expect.arrayContaining([
            expect.objectContaining({
              uri: 'file:///test/file.ts',
              range: {
                start: { line: 10, character: 5 },
                end: { line: 10, character: 5 },
              },
            }),
            'someVar',
          ]),
        })
      );
    });
  });

  describe('error handling', () => {
    it('should catch and format generic errors', async () => {
      mockLSPBridge.isReady.mockImplementation(() => {
        throw new Error('Unexpected error');
      });

      const input: RefactorInput = {
        target: 'myFunction',
        strategy: 'rename',
        newName: 'newFunction',
        file: '/test/file.ts',
        line: 10,
        character: 5,
      };

      const result = await handleRefactor(
        input,
        mockLSPBridge,
        mockOpenCodeAdapter
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('Unexpected error');
    });

    it('should handle non-Error exceptions', async () => {
      mockLSPBridge.isReady.mockImplementation(() => {
        throw 'string error';
      });

      const input: RefactorInput = {
        target: 'myFunction',
        strategy: 'rename',
        newName: 'newFunction',
        file: '/test/file.ts',
        line: 10,
        character: 5,
      };

      const result = await handleRefactor(
        input,
        mockLSPBridge,
        mockOpenCodeAdapter
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('string error');
    });
  });

  describe('edge cases', () => {
    it('should handle Windows file paths', async () => {
      const workspaceEdit: WorkspaceEdit = {
        changes: {
          'file:///C:/test/file.ts': [
            {
              range: {
                start: { line: 0, character: 0 },
                end: { line: 0, character: 1 },
              },
              newText: 'renamed',
            },
          ],
        },
      };

      mockLSPBridge.request.mockResolvedValue(workspaceEdit);

      const input: RefactorInput = {
        target: 'oldName',
        strategy: 'rename',
        newName: 'newName',
        file: 'C:\\test\\file.ts',
        line: 10,
        character: 5,
      };

      const result = await handleRefactor(
        input,
        mockLSPBridge,
        mockOpenCodeAdapter
      );

      expect(result.success).toBe(true);
    });

    it('should handle WorkspaceEdit with both changes and documentChanges', async () => {
      const workspaceEdit: WorkspaceEdit = {
        changes: {
          'file:///test.ts': [
            {
              range: {
                start: { line: 0, character: 0 },
                end: { line: 0, character: 1 },
              },
              newText: 'changed',
            },
          ],
        },
        documentChanges: [
          {
            kind: 'create',
            uri: 'file:///test/new.ts',
          },
        ],
      };

      mockLSPBridge.request.mockResolvedValue(workspaceEdit);

      const input: RefactorInput = {
        target: 'someCode',
        strategy: 'extract',
        file: '/test/file.ts',
        line: 10,
        character: 5,
      };

      const result = await handleRefactor(
        input,
        mockLSPBridge,
        mockOpenCodeAdapter
      );

      expect(result.success).toBe(true);
    });

    it('should handle null result from extract command before finding valid one', async () => {
      mockLSPBridge.request.mockResolvedValueOnce(null).mockResolvedValueOnce({
        changes: {
          'file:///test.ts': [
            {
              range: {
                start: { line: 0, character: 0 },
                end: { line: 0, character: 1 },
              },
              newText: 'extracted',
            },
          ],
        },
      });

      const input: RefactorInput = {
        target: 'someCode',
        strategy: 'extract',
        file: '/test/file.ts',
        line: 10,
        character: 5,
      };

      const result = await handleRefactor(
        input,
        mockLSPBridge,
        mockOpenCodeAdapter
      );

      expect(result.success).toBe(true);
    });
  });
});
