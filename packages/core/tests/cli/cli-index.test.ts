/**
 * Comprehensive Tests for CLI index (entry point)
 *
 * These tests provide full coverage for the CLI entry point including:
 * - Command routing (exec, config)
 * - Help and version display
 * - Error handling
 * - Process exit codes
 */

// Mock exec and config commands
const mockExecCommand = jest.fn();
const mockConfigCommand = jest.fn();
const mockShowExecHelp = jest.fn();
const mockShowConfigHelp = jest.fn();

jest.mock('../../src/cli/commands/exec.js', () => ({
  execCommand: mockExecCommand,
  showExecHelp: mockShowExecHelp,
}));

jest.mock('../../src/cli/commands/config.js', () => ({
  configCommand: mockConfigCommand,
  showConfigHelp: mockShowConfigHelp,
}));

// Mock fs for glob
jest.mock('fs', () => ({
  existsSync: jest.fn().mockReturnValue(false),
  readFileSync: jest.fn(),
}));

jest.mock('glob', () => ({
  glob: jest.fn(),
}));

// Import after mocking
import { main, VERSION } from '../../src/cli/index.js';

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

describe('CLI index', () => {
  let consoleMock: ReturnType<typeof mockConsole>;
  let originalArgv: string[];
  let originalExit: (code?: number) => never;
  let exitMock: jest.Mock;

  beforeEach(() => {
    consoleMock = mockConsole();
    originalArgv = process.argv;
    originalExit = process.exit as unknown as (code?: number) => never;

    // Mock process.exit to prevent actual exit
    exitMock = jest.fn() as jest.Mock;
    process.exit = exitMock as unknown as (code?: number) => never;

    jest.clearAllMocks();
  });

  afterEach(() => {
    consoleMock.restore();
    process.argv = originalArgv;
    process.exit = originalExit;
  });

  describe('VERSION', () => {
    it('should have a version defined', () => {
      expect(VERSION).toBeDefined();
      expect(VERSION).toMatch(/^\d+\.\d+\.\d+$/);
    });

    it('should have correct version format', () => {
      const parts = VERSION.split('.');
      expect(parts).toHaveLength(3);
      parts.forEach((part) => {
        expect(Number(part)).not.toBeNaN();
      });
    });
  });



  describe('main - no arguments', () => {
    it('should show help when no arguments provided', async () => {
      process.argv = ['node', 'jclaw'];

      await main();

      const output = consoleMock.logs.join('\n');
      expect(output).toContain('JClaw');
      expect(output).toContain('Usage:');
    });

    it('should exit with code 0 when no arguments', async () => {
      process.argv = ['node', 'jclaw'];

      await main();

      expect(exitMock).toHaveBeenCalledWith(0);
    });
  });

  describe('main - help flag', () => {
    it('should show help with --help flag', async () => {
      process.argv = ['node', 'jclaw', '--help'];

      await main();

      const output = consoleMock.logs.join('\n');
      expect(output).toContain('JClaw');
      expect(output).toContain('Usage:');
    });

    it('should show help with -h flag', async () => {
      process.argv = ['node', 'jclaw', '-h'];

      await main();

      const output = consoleMock.logs.join('\n');
      expect(output).toContain('JClaw');
    });

    it('should exit with code 0 for help', async () => {
      process.argv = ['node', 'jclaw', '--help'];

      await main();

      expect(exitMock).toHaveBeenCalledWith(0);
    });
  });

  describe('main - version flag', () => {
    it('should show version with --version flag', async () => {
      process.argv = ['node', 'jclaw', '--version'];

      await main();

      const output = consoleMock.logs.join('\n');
      expect(output).toContain(`jclaw v${VERSION}`);
    });

    it('should show version with -v flag', async () => {
      process.argv = ['node', 'jclaw', '-v'];

      await main();

      const output = consoleMock.logs.join('\n');
      expect(output).toContain(`jclaw v${VERSION}`);
    });

    it('should exit with code 0 for version', async () => {
      process.argv = ['node', 'jclaw', '--version'];

      await main();

      expect(exitMock).toHaveBeenCalledWith(0);
    });
  });

  describe('main - exec command', () => {
    it('should route to exec command', async () => {
      process.argv = ['node', 'jclaw', 'exec', 'test prompt'];
      mockExecCommand.mockResolvedValue(undefined);

      await main();

      expect(mockExecCommand).toHaveBeenCalledWith(['test prompt']);
    });

    it('should pass multiple args to exec', async () => {
      process.argv = ['node', 'jclaw', 'exec', '--verbose', 'test'];
      mockExecCommand.mockResolvedValue(undefined);

      await main();

      expect(mockExecCommand).toHaveBeenCalledWith(['--verbose', 'test']);
    });

    it('should show exec help with --help flag', async () => {
      process.argv = ['node', 'jclaw', 'exec', '--help'];

      await main();

      expect(mockShowExecHelp).toHaveBeenCalled();
    });

    it('should show exec help with -h flag', async () => {
      process.argv = ['node', 'jclaw', 'exec', '-h'];

      await main();

      expect(mockShowExecHelp).toHaveBeenCalled();
    });

    it('should handle exec command errors', async () => {
      process.argv = ['node', 'jclaw', 'exec', 'test'];
      mockExecCommand.mockRejectedValue(new Error('Exec failed'));

      await main();

      const errors = consoleMock.errors.join('\n');
      expect(errors).toContain('Error: Exec failed');
      expect(exitMock).toHaveBeenCalledWith(1);
    });
  });

  describe('main - config command', () => {
    it('should route to config command', async () => {
      process.argv = ['node', 'jclaw', 'config', 'get', 'execution.mode'];
      mockConfigCommand.mockResolvedValue(undefined);

      await main();

      expect(mockConfigCommand).toHaveBeenCalledWith(['get', 'execution.mode']);
    });

    it('should pass all args to config', async () => {
      process.argv = ['node', 'jclaw', 'config', 'set', 'key', 'value'];
      mockConfigCommand.mockResolvedValue(undefined);

      await main();

      expect(mockConfigCommand).toHaveBeenCalledWith(['set', 'key', 'value']);
    });

    it('should show config help with --help flag', async () => {
      process.argv = ['node', 'jclaw', 'config', '--help'];

      await main();

      expect(mockShowConfigHelp).toHaveBeenCalled();
    });

    it('should show config help with -h flag', async () => {
      process.argv = ['node', 'jclaw', 'config', '-h'];

      await main();

      expect(mockShowConfigHelp).toHaveBeenCalled();
    });

    it('should handle config command errors', async () => {
      process.argv = ['node', 'jclaw', 'config', 'get'];
      mockConfigCommand.mockRejectedValue(new Error('Key required'));

      await main();

      const errors = consoleMock.errors.join('\n');
      expect(errors).toContain('Error: Key required');
      expect(exitMock).toHaveBeenCalledWith(1);
    });
  });

  describe('main - unknown command', () => {
    it('should show error for unknown command', async () => {
      process.argv = ['node', 'jclaw', 'unknown'];

      await main();

      const errors = consoleMock.errors.join('\n');
      expect(errors).toContain('Unknown command: unknown');
    });

    it('should show help for unknown command', async () => {
      process.argv = ['node', 'jclaw', 'unknown'];

      await main();

      const output = consoleMock.logs.join('\n');
      expect(output).toContain('JClaw');
      expect(output).toContain('Usage:');
    });

    it('should exit with code 1 for unknown command', async () => {
      process.argv = ['node', 'jclaw', 'unknown'];

      await main();

      expect(exitMock).toHaveBeenCalledWith(1);
    });

    it('should handle misspelled commands', async () => {
      process.argv = ['node', 'jclaw', 'exect'];

      await main();

      const errors = consoleMock.errors.join('\n');
      expect(errors).toContain('Unknown command: exect');
    });
  });

  describe('main - error handling', () => {
    it('should handle generic errors', async () => {
      process.argv = ['node', 'jclaw', 'exec', 'test'];
      mockExecCommand.mockRejectedValue('String error');

      await main();

      const errors = consoleMock.errors.join('\n');
      expect(errors).toContain('Error: Unknown error');
      expect(exitMock).toHaveBeenCalledWith(1);
    });

    it('should handle errors with no message', async () => {
      process.argv = ['node', 'jclaw', 'exec', 'test'];
      mockExecCommand.mockRejectedValue({});

      await main();

      const errors = consoleMock.errors.join('\n');
      expect(errors).toContain('Error: Unknown error');
      expect(exitMock).toHaveBeenCalledWith(1);
    });

    it('should handle null error', async () => {
      process.argv = ['node', 'jclaw', 'exec', 'test'];
      mockExecCommand.mockRejectedValue(null);

      await main();

      const errors = consoleMock.errors.join('\n');
      expect(errors).toContain('Error: Unknown error');
      expect(exitMock).toHaveBeenCalledWith(1);
    });
  });
});
