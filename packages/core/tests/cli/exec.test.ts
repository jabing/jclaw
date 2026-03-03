/**
 * Comprehensive Tests for CLI exec command
 *
 * These tests provide >80% coverage for the exec command including:
 * - Command parsing (all flags and options)
 * - Config loading (YAML parsing, file search)
 * - Agent initialization and execution
 * - Error handling
 */

// Mock modules before importing the module under test
const mockAgent = {
  start: jest.fn(),
  stop: jest.fn(),
  execute: jest.fn(),
};

const mockCreateAgent = jest.fn(() => mockAgent);
const mockCreateSimpleMemoryClient = jest.fn(() => ({
  connect: jest.fn(),
  disconnect: jest.fn(),
  query: jest.fn(),
  saveMemory: jest.fn(),
}));

jest.mock('fs', () => ({
  existsSync: jest.fn(),
  readFileSync: jest.fn(),
}));

jest.mock('glob', () => ({
  glob: jest.fn(),
}));

jest.mock('../../src/runtime/agent.js', () => ({
  createAgent: mockCreateAgent,
}));

jest.mock('../../src/context/simple-memory-client.js', () => ({
  createSimpleMemoryClient: mockCreateSimpleMemoryClient,
}));

import {
  execCommand,
  showExecHelp,
  ExecOptions,
  JClawConfig,
} from '../../src/cli/commands/exec.js';

// Mock console methods
const mockConsole = () => {
  const logs: string[] = [];
  const errors: string[] = [];
  const originalLog = console.log;
  const originalError = console.error;

  console.log = (...args: unknown[]) => {
    logs.push(args.join(' '));
  };
  console.error = (...args: unknown[]) => {
    errors.push(args.join(' '));
  };

  return {
    logs,
    errors,
    restore: () => {
      console.log = originalLog;
      console.error = originalError;
    },
  };
};

describe('exec command', () => {
  let consoleMock: ReturnType<typeof mockConsole>;

  beforeEach(() => {
    consoleMock = mockConsole();
    jest.clearAllMocks();
    mockAgent.start.mockResolvedValue(undefined);
    mockAgent.stop.mockResolvedValue(undefined);
    // Reset process.exitCode
    process.exitCode = 0;
  });

  afterEach(() => {
    consoleMock.restore();
  });

  describe('argument parsing', () => {
    it('should throw error when no prompt provided', async () => {
      await expect(execCommand([])).rejects.toThrow('No prompt provided');
    });

    it('should throw error when only flags provided without prompt', async () => {
      await expect(execCommand(['--verbose'])).rejects.toThrow(
        'No prompt provided'
      );
    });

    it('should throw error for invalid mode', async () => {
      await expect(execCommand(['--mode', 'invalid', 'test'])).rejects.toThrow(
        'Invalid mode'
      );
    });

    it('should throw error for unknown option', async () => {
      await expect(execCommand(['--unknown', 'test'])).rejects.toThrow(
        'Unknown option'
      );
    });

    it('should accept local mode', async () => {
      const { existsSync } = jest.requireMock('fs');
      existsSync.mockReturnValue(false);
      mockAgent.execute.mockResolvedValue({
        success: true,
        output: 'test output',
        duration: 100,
      });

      await execCommand(['--mode', 'local', 'test prompt']);

      expect(mockCreateAgent).toHaveBeenCalledWith(
        expect.objectContaining({
          executionMode: 'local',
        })
      );
    });

    it('should accept docker mode', async () => {
      const { existsSync } = jest.requireMock('fs');
      existsSync.mockReturnValue(false);
      mockAgent.execute.mockResolvedValue({
        success: true,
        output: 'test output',
        duration: 100,
      });

      await execCommand(['--mode', 'docker', 'test prompt']);

      expect(mockCreateAgent).toHaveBeenCalledWith(
        expect.objectContaining({
          executionMode: 'docker',
        })
      );
    });

    it('should accept hybrid mode', async () => {
      const { existsSync } = jest.requireMock('fs');
      existsSync.mockReturnValue(false);
      mockAgent.execute.mockResolvedValue({
        success: true,
        output: 'test output',
        duration: 100,
      });

      await execCommand(['--mode', 'hybrid', 'test prompt']);

      expect(mockCreateAgent).toHaveBeenCalledWith(
        expect.objectContaining({
          executionMode: 'hybrid',
        })
      );
    });

    it('should accept short mode flag (-m)', async () => {
      const { existsSync } = jest.requireMock('fs');
      existsSync.mockReturnValue(false);
      mockAgent.execute.mockResolvedValue({
        success: true,
        output: 'test output',
        duration: 100,
      });

      await execCommand(['-m', 'local', 'test prompt']);

      expect(mockCreateAgent).toHaveBeenCalledWith(
        expect.objectContaining({
          executionMode: 'local',
        })
      );
    });

    it('should accept short verbose flag (-V)', async () => {
      const { existsSync } = jest.requireMock('fs');
      existsSync.mockReturnValue(false);
      mockAgent.execute.mockResolvedValue({
        success: true,
        output: 'test output',
        duration: 100,
      });

      await execCommand(['-V', 'test prompt']);

      expect(mockCreateAgent).toHaveBeenCalledWith(
        expect.objectContaining({
          verbose: true,
        })
      );
    });

    it('should accept short config flag (-c)', async () => {
      const { existsSync, readFileSync } = jest.requireMock('fs');
      existsSync.mockImplementation((path: string) => path === './custom.yaml');
      readFileSync.mockReturnValue('execution:\n  mode: docker\n');
      mockAgent.execute.mockResolvedValue({
        success: true,
        output: 'test output',
        duration: 100,
      });

      await execCommand(['-c', './custom.yaml', 'test prompt']);

      expect(existsSync).toHaveBeenCalledWith('./custom.yaml');
    });
  });

  describe('configuration loading', () => {
    it('should throw error for non-existent config file', async () => {
      const { existsSync } = jest.requireMock('fs');
      existsSync.mockReturnValue(false);

      await expect(
        execCommand(['--config', './nonexistent.yaml', 'test'])
      ).rejects.toThrow('Config file not found');
    });

    it('should search for jclaw.yaml in current directory', async () => {
      const { existsSync } = jest.requireMock('fs');
      existsSync.mockReturnValue(false);
      mockAgent.execute.mockResolvedValue({
        success: true,
        output: 'test output',
        duration: 100,
      });

      await execCommand(['test']);

      const calls = existsSync.mock.calls;
      const hasJclawYaml = calls.some(
        (call: unknown[]) =>
          typeof call[0] === 'string' && call[0].includes('jclaw.yaml')
      );
      expect(hasJclawYaml).toBe(true);
    });

    it('should parse YAML config file correctly', async () => {
      const { existsSync, readFileSync } = jest.requireMock('fs');
      existsSync.mockReturnValue(true);
      readFileSync.mockReturnValue(`
execution:
  mode: docker
  timeout: 60000
local:
  restrictions:
    allowedPaths:
      - /tmp
    blockedCommands:
      - rm -rf
`);
      mockAgent.execute.mockResolvedValue({
        success: true,
        output: 'test output',
        duration: 100,
      });

      await execCommand(['--config', './config.yaml', 'test']);

      expect(mockCreateAgent).toHaveBeenCalled();
    });

    it('should handle config with nested properties', async () => {
      const { existsSync, readFileSync } = jest.requireMock('fs');
      existsSync.mockReturnValue(true);
      readFileSync.mockReturnValue(`
docker:
  image: node:18
  memory: 512m
  cpu: 1.0
llm:
  apiBase: https://api.openai.com/v1
  apiKey: test-key
  model: gpt-4
`);
      mockAgent.execute.mockResolvedValue({
        success: true,
        output: 'test output',
        duration: 100,
      });

      await execCommand(['--config', './config.yaml', 'test']);

      expect(mockCreateAgent).toHaveBeenCalledWith(
        expect.objectContaining({
          llm: expect.objectContaining({
            apiKey: 'test-key',
            model: 'gpt-4',
          }),
        })
      );
    });

    it('should handle config with boolean and numeric values', async () => {
      const { existsSync, readFileSync } = jest.requireMock('fs');
      existsSync.mockReturnValue(true);
      readFileSync.mockReturnValue(`
evolution:
  enabled: true
  sandboxTimeout: 300
context:
  maxTokens: 128000
`);
      mockAgent.execute.mockResolvedValue({
        success: true,
        output: 'test output',
        duration: 100,
      });

      await execCommand(['--config', './config.yaml', 'test']);

      expect(mockCreateAgent).toHaveBeenCalledWith(
        expect.objectContaining({
          enableAutoSkill: true,
        })
      );
    });

    it('should throw error for invalid YAML file', async () => {
      const { existsSync, readFileSync } = jest.requireMock('fs');
      existsSync.mockReturnValue(true);
      readFileSync.mockImplementation(() => {
        throw new Error('Permission denied');
      });

      await expect(
        execCommand(['--config', './invalid.yaml', 'test'])
      ).rejects.toThrow('Failed to load config file');
    });

    it('should show verbose output with config file path', async () => {
      const { existsSync, readFileSync } = jest.requireMock('fs');
      existsSync.mockImplementation((path: string) => {
        return path.includes('jclaw.yaml');
      });
      readFileSync.mockReturnValue(`
execution:
  mode: local
  timeout: 300000
`);
      mockAgent.execute.mockResolvedValue({
        success: true,
        output: 'test output',
        duration: 100,
      });

      await execCommand(['--verbose', 'test']);

      const output = consoleMock.logs.join('\n');
      expect(output).toContain('[verbose]');
      expect(output).toContain('Loaded config from:');
    });

    it('should handle empty config file gracefully', async () => {
      const { existsSync, readFileSync } = jest.requireMock('fs');
      existsSync.mockReturnValue(true);
      readFileSync.mockReturnValue('');
      mockAgent.execute.mockResolvedValue({
        success: true,
        output: 'test output',
        duration: 100,
      });

      await execCommand(['--config', './empty.yaml', 'test']);

      expect(mockCreateAgent).toHaveBeenCalled();
    });

    it('should handle config file with only comments', async () => {
      const { existsSync, readFileSync } = jest.requireMock('fs');
      existsSync.mockReturnValue(true);
      readFileSync.mockReturnValue(`
# This is a comment
# execution:
#   mode: docker
`);
      mockAgent.execute.mockResolvedValue({
        success: true,
        output: 'test output',
        duration: 100,
      });

      await execCommand(['--config', './comments.yaml', 'test']);

      expect(mockCreateAgent).toHaveBeenCalled();
    });

    it('should merge CLI options with file config (CLI takes precedence)', async () => {
      const { existsSync, readFileSync } = jest.requireMock('fs');
      existsSync.mockReturnValue(true);
      readFileSync.mockReturnValue(`
execution:
  mode: docker
  timeout: 60000
`);
      mockAgent.execute.mockResolvedValue({
        success: true,
        output: 'test output',
        duration: 100,
      });

      // CLI mode should override file config
      await execCommand([
        '--mode',
        'local',
        '--config',
        './config.yaml',
        'test',
      ]);

      expect(mockCreateAgent).toHaveBeenCalledWith(
        expect.objectContaining({
          executionMode: 'local',
        })
      );
    });
  });

  describe('prompt handling', () => {
    it('should handle multi-word prompts', async () => {
      const { existsSync } = jest.requireMock('fs');
      existsSync.mockReturnValue(false);
      mockAgent.execute.mockResolvedValue({
        success: true,
        output: 'test output',
        duration: 100,
      });

      await execCommand(['Analyze', 'this', 'project', 'structure']);

      const output = consoleMock.logs.join('\n');
      expect(output).toContain('Executing: Analyze this project structure');
      expect(mockAgent.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          prompt: 'Analyze this project structure',
        })
      );
    });

    it('should handle prompts with flags mixed in', async () => {
      const { existsSync } = jest.requireMock('fs');
      existsSync.mockReturnValue(false);
      mockAgent.execute.mockResolvedValue({
        success: true,
        output: 'test output',
        duration: 100,
      });

      await execCommand(['--verbose', 'run', 'tests']);

      const output = consoleMock.logs.join('\n');
      expect(output).toContain('Executing: run tests');
    });

    it('should handle prompts with quotes', async () => {
      const { existsSync } = jest.requireMock('fs');
      existsSync.mockReturnValue(false);
      mockAgent.execute.mockResolvedValue({
        success: true,
        output: 'test output',
        duration: 100,
      });

      await execCommand(['"echo hello world"']);

      expect(mockAgent.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          prompt: '"echo hello world"',
        })
      );
    });
  });

  describe('agent execution', () => {
    it('should start agent before execution', async () => {
      const { existsSync } = jest.requireMock('fs');
      existsSync.mockReturnValue(false);
      mockAgent.execute.mockResolvedValue({
        success: true,
        output: 'test output',
        duration: 100,
      });

      await execCommand(['test prompt']);

      expect(mockAgent.start).toHaveBeenCalled();
      expect(mockAgent.execute).toHaveBeenCalled();
    });

    it('should stop agent after execution', async () => {
      const { existsSync } = jest.requireMock('fs');
      existsSync.mockReturnValue(false);
      mockAgent.execute.mockResolvedValue({
        success: true,
        output: 'test output',
        duration: 100,
      });

      await execCommand(['test prompt']);

      expect(mockAgent.stop).toHaveBeenCalled();
    });

    it('should print task output on success', async () => {
      const { existsSync } = jest.requireMock('fs');
      existsSync.mockReturnValue(false);
      mockAgent.execute.mockResolvedValue({
        success: true,
        output: 'Command output here',
        duration: 150,
      });

      await execCommand(['test prompt']);

      const output = consoleMock.logs.join('\n');
      expect(output).toContain('Command output here');
    });

    it('should print verbose output with execution details', async () => {
      const { existsSync } = jest.requireMock('fs');
      existsSync.mockReturnValue(false);
      mockAgent.execute.mockResolvedValue({
        success: true,
        output: 'test output',
        duration: 250,
      });

      await execCommand(['--verbose', 'test prompt']);

      const output = consoleMock.logs.join('\n');
      expect(output).toContain('[verbose] Executing task...');
      expect(output).toContain('[verbose] Prompt: test prompt');
      expect(output).toContain('[verbose] Execution completed');
      expect(output).toContain('[verbose] Success: true');
      expect(output).toContain('[verbose] Duration: 250ms');
    });

    it('should set exit code to 1 on task failure', async () => {
      const { existsSync } = jest.requireMock('fs');
      existsSync.mockReturnValue(false);
      mockAgent.execute.mockResolvedValue({
        success: false,
        output: '',
        error: 'Command failed',
        duration: 100,
      });

      await execCommand(['test prompt']);

      expect(process.exitCode).toBe(1);
    });

    it('should print error message on task failure', async () => {
      const { existsSync } = jest.requireMock('fs');
      existsSync.mockReturnValue(false);
      mockAgent.execute.mockResolvedValue({
        success: false,
        output: '',
        error: 'Command not found',
        duration: 100,
      });

      await execCommand(['test prompt']);

      const errors = consoleMock.errors.join('\n');
      expect(errors).toContain('Error: Command not found');
    });

    it('should handle hybrid mode by converting to local for task', async () => {
      const { existsSync } = jest.requireMock('fs');
      existsSync.mockReturnValue(false);
      mockAgent.execute.mockResolvedValue({
        success: true,
        output: 'test output',
        duration: 100,
      });

      await execCommand(['--mode', 'hybrid', 'test prompt']);

      expect(mockAgent.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          executionMode: 'local', // hybrid gets converted to local for task
        })
      );
    });

    it('should create context manager with correct options', async () => {
      const { existsSync } = jest.requireMock('fs');
      existsSync.mockReturnValue(false);
      mockAgent.execute.mockResolvedValue({
        success: true,
        output: 'test output',
        duration: 100,
      });

      await execCommand(['test prompt']);

      expect(mockCreateSimpleMemoryClient).toHaveBeenCalledWith({
        enableSynonyms: true,
        enableFuzzyMatch: true,
      });
    });

    it('should handle agent stop error gracefully', async () => {
      const { existsSync } = jest.requireMock('fs');
      existsSync.mockReturnValue(false);
      mockAgent.execute.mockResolvedValue({
        success: true,
        output: 'test output',
        duration: 100,
      });
      mockAgent.stop.mockRejectedValue(new Error('Stop failed'));

      // Should not throw
      await expect(
        execCommand(['--verbose', 'test prompt'])
      ).resolves.not.toThrow();

      const errors = consoleMock.errors.join('\n');
      expect(errors).toContain('[verbose] Error stopping agent:');
    });

    it('should handle agent execution error', async () => {
      const { existsSync } = jest.requireMock('fs');
      existsSync.mockReturnValue(false);
      mockAgent.execute.mockRejectedValue(new Error('Execution failed'));

      await expect(execCommand(['test prompt'])).rejects.toThrow(
        'Execution failed'
      );

      expect(process.exitCode).toBe(1);
    });

    it('should print verbose error details on execution failure', async () => {
      const { existsSync } = jest.requireMock('fs');
      existsSync.mockReturnValue(false);
      const error = new Error('Detailed error');
      mockAgent.execute.mockRejectedValue(error);

      try {
        await execCommand(['--verbose', 'test prompt']);
      } catch {
        // Expected to throw
      }

      const errors = consoleMock.errors.join('\n');
      expect(errors).toContain('Execution failed: Detailed error');
    });

    it('should pass correct task structure to agent', async () => {
      const { existsSync } = jest.requireMock('fs');
      existsSync.mockReturnValue(false);
      mockAgent.execute.mockResolvedValue({
        success: true,
        output: 'test output',
        duration: 100,
      });

      await execCommand(['test prompt']);

      const callArg = mockAgent.execute.mock.calls[0][0];
      expect(callArg).toHaveProperty('id');
      expect(callArg).toHaveProperty('prompt', 'test prompt');
      expect(callArg).toHaveProperty('executionMode');
      expect(callArg.id).toMatch(/^exec-\d+$/);
    });
  });

  describe('execution modes', () => {
    it('should use local mode by default', async () => {
      const { existsSync } = jest.requireMock('fs');
      existsSync.mockReturnValue(false);
      mockAgent.execute.mockResolvedValue({
        success: true,
        output: 'test output',
        duration: 100,
      });

      await execCommand(['test']);

      expect(mockCreateAgent).toHaveBeenCalledWith(
        expect.objectContaining({
          executionMode: 'local',
        })
      );
    });

    it('should handle docker mode execution', async () => {
      const { existsSync } = jest.requireMock('fs');
      existsSync.mockReturnValue(false);
      mockAgent.execute.mockResolvedValue({
        success: true,
        output: 'docker output',
        duration: 200,
      });

      await execCommand(['--mode', 'docker', 'test']);

      expect(mockCreateAgent).toHaveBeenCalledWith(
        expect.objectContaining({
          executionMode: 'docker',
        })
      );
      expect(mockAgent.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          executionMode: 'docker',
        })
      );
    });
  });

  describe('LLM configuration', () => {
    it('should pass LLM config from file to agent', async () => {
      const { existsSync, readFileSync } = jest.requireMock('fs');
      existsSync.mockReturnValue(true);
      readFileSync.mockReturnValue(`
llm:
  apiBase: https://custom.api.com/v1
  apiKey: my-secret-key
  model: gpt-4-turbo
`);
      mockAgent.execute.mockResolvedValue({
        success: true,
        output: 'test output',
        duration: 100,
      });

      await execCommand(['--config', './config.yaml', 'test']);

      expect(mockCreateAgent).toHaveBeenCalledWith(
        expect.objectContaining({
          llm: {
            apiBase: 'https://custom.api.com/v1',
            apiKey: 'my-secret-key',
            model: 'gpt-4-turbo',
          },
        })
      );
    });

    it('should use default OpenAI endpoint when only apiKey provided', async () => {
      const { existsSync, readFileSync } = jest.requireMock('fs');
      existsSync.mockReturnValue(true);
      readFileSync.mockReturnValue(`
llm:
  apiKey: my-key
`);
      mockAgent.execute.mockResolvedValue({
        success: true,
        output: 'test output',
        duration: 100,
      });

      await execCommand(['--config', './config.yaml', 'test']);

      expect(mockCreateAgent).toHaveBeenCalledWith(
        expect.objectContaining({
          llm: {
            apiBase: 'https://api.openai.com/v1',
            apiKey: 'my-key',
            model: 'gpt-4',
          },
        })
      );
    });

    it('should not pass LLM config when no apiKey provided', async () => {
      const { existsSync } = jest.requireMock('fs');
      existsSync.mockReturnValue(false);
      mockAgent.execute.mockResolvedValue({
        success: true,
        output: 'test output',
        duration: 100,
      });

      await execCommand(['test']);

      const callArg = (mockCreateAgent.mock.calls[0] as unknown[])[0] as { llm?: unknown };
      expect(callArg.llm).toBeUndefined();
    });
  });

  describe('AutoSkill configuration', () => {
    it('should enable AutoSkill when evolution.enabled is true', async () => {
      const { existsSync, readFileSync } = jest.requireMock('fs');
      existsSync.mockReturnValue(true);
      readFileSync.mockReturnValue(`
evolution:
  enabled: true
  strategies:
    - template
    - mutation
`);
      mockAgent.execute.mockResolvedValue({
        success: true,
        output: 'test output',
        duration: 100,
      });

      await execCommand(['--config', './config.yaml', 'test']);

      expect(mockCreateAgent).toHaveBeenCalledWith(
        expect.objectContaining({
          enableAutoSkill: true,
        })
      );
    });

    it('should disable AutoSkill by default', async () => {
      const { existsSync } = jest.requireMock('fs');
      existsSync.mockReturnValue(false);
      mockAgent.execute.mockResolvedValue({
        success: true,
        output: 'test output',
        duration: 100,
      });

      await execCommand(['test']);

      expect(mockCreateAgent).toHaveBeenCalledWith(
        expect.objectContaining({
          enableAutoSkill: false,
        })
      );
    });
  });

  describe('help display', () => {
    it('should show help message', () => {
      showExecHelp();

      const output = consoleMock.logs.join('\n');
      expect(output).toContain('jclaw exec');
      expect(output).toContain('Usage:');
      expect(output).toContain('Options:');
      expect(output).toContain('Examples:');
    });

    it('should include mode option in help', () => {
      showExecHelp();

      const output = consoleMock.logs.join('\n');
      expect(output).toContain('--mode');
      expect(output).toContain('local, docker, or hybrid');
    });

    it('should include config option in help', () => {
      showExecHelp();

      const output = consoleMock.logs.join('\n');
      expect(output).toContain('--config');
      expect(output).toContain('jclaw.yaml');
    });

    it('should include verbose option in help', () => {
      showExecHelp();

      const output = consoleMock.logs.join('\n');
      expect(output).toContain('--verbose');
    });

    it('should include all examples in help', () => {
      showExecHelp();

      const output = consoleMock.logs.join('\n');
      expect(output).toContain('jclaw exec "echo hello"');
      expect(output).toContain('jclaw exec --mode docker');
      expect(output).toContain('jclaw exec --config');
    });
  });
});

describe('exec command error handling', () => {
  let consoleMock: ReturnType<typeof mockConsole>;

  beforeEach(() => {
    consoleMock = mockConsole();
    jest.clearAllMocks();
    mockAgent.start.mockResolvedValue(undefined);
    mockAgent.stop.mockResolvedValue(undefined);
    process.exitCode = 0;
  });

  afterEach(() => {
    consoleMock.restore();
  });

  it('should handle successful execution with empty output', async () => {
    const { existsSync } = jest.requireMock('fs');
    existsSync.mockReturnValue(false);
    mockAgent.execute.mockResolvedValue({
      success: true,
      output: '',
      duration: 50,
    });

    await execCommand(['test']);

    // Should not print anything when output is empty
    const output = consoleMock.logs
      .filter((log) => log.trim() !== '')
      .join('\n');
    expect(output).toContain('Executing: test');
    expect(process.exitCode).toBe(0);
  });

  it('should handle result with error but success=true in non-verbose mode', async () => {
    const { existsSync } = jest.requireMock('fs');
    existsSync.mockReturnValue(false);
    mockAgent.execute.mockResolvedValue({
      success: true,
      output: 'some output',
      error: 'warning message',
      duration: 100,
    });

    await execCommand(['test']);

    // Error should not be printed when success=true and not verbose
    const errors = consoleMock.errors.join('\n');
    expect(errors).not.toContain('warning message');
  });

  it('should handle result with error in verbose mode even when success=true', async () => {
    const { existsSync } = jest.requireMock('fs');
    existsSync.mockReturnValue(false);
    mockAgent.execute.mockResolvedValue({
      success: true,
      output: 'some output',
      error: 'warning message',
      duration: 100,
    });

    await execCommand(['--verbose', 'test']);

    const errors = consoleMock.errors.join('\n');
    expect(errors).toContain('Error: warning message');
  });
});

describe('exec command integration', () => {
  let consoleMock: ReturnType<typeof mockConsole>;

  beforeEach(() => {
    consoleMock = mockConsole();
    jest.clearAllMocks();
    mockAgent.start.mockResolvedValue(undefined);
    mockAgent.stop.mockResolvedValue(undefined);
    process.exitCode = 0;
  });

  afterEach(() => {
    consoleMock.restore();
  });

  it('should load config from specified path', async () => {
    const { existsSync, readFileSync } = jest.requireMock('fs');

    existsSync.mockReturnValue(true);
    readFileSync.mockReturnValue(`
execution:
  mode: docker
  timeout: 60000
`);
    mockAgent.execute.mockResolvedValue({
      success: true,
      output: 'test output',
      duration: 100,
    });

    await execCommand(['--config', './custom.yaml', 'test']);

    expect(existsSync).toHaveBeenCalledWith('./custom.yaml');
  });

  it('should show verbose output with config file', async () => {
    const { existsSync, readFileSync } = jest.requireMock('fs');

    existsSync.mockImplementation((path: string) =>
      path.includes('jclaw.yaml')
    );
    readFileSync.mockReturnValue(`
execution:
  mode: local
  timeout: 300000
`);
    mockAgent.execute.mockResolvedValue({
      success: true,
      output: 'test output',
      duration: 100,
    });

    await execCommand(['--verbose', 'test']);

    const output = consoleMock.logs.join('\n');
    expect(output).toContain('[verbose]');
    expect(output).toContain('[verbose] Loaded config from:');
  });

  it('should handle end-to-end execution flow', async () => {
    const { existsSync, readFileSync } = jest.requireMock('fs');

    existsSync.mockReturnValue(true);
    readFileSync.mockReturnValue(`
execution:
  mode: local
llm:
  apiKey: test-key
`);
    mockAgent.execute.mockResolvedValue({
      success: true,
      output: 'Task completed successfully',
      duration: 500,
    });

    await execCommand(['--config', './test.yaml', '--verbose', 'Run analysis']);

    expect(mockAgent.start).toHaveBeenCalled();
    expect(mockAgent.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        prompt: 'Run analysis',
      })
    );
    expect(mockAgent.stop).toHaveBeenCalled();

    const output = consoleMock.logs.join('\n');
    expect(output).toContain('Task completed successfully');
    expect(output).toContain('[verbose] Execution completed');
  });
});
