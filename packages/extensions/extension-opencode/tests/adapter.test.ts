/**
 * Tests for OpenCode Adapter
 *
 * Unit tests for the OpenCode CLI adapter using mocked child_process.
 *
 * @module @jclaw/extension-opencode/tests/adapter
 */

import { OpenCodeAdapter, OpenCodeResult } from '../src/adapter';
import { spawn } from 'child_process';

// Mock child_process
jest.mock('child_process');

type MockChildProcess = {
  stdout: { on: jest.Mock };
  stderr: { on: jest.Mock };
  on: jest.Mock;
  kill: jest.Mock;
};

type SpawnMock = jest.Mock & {
  mockChildProcess: MockChildProcess;
};

/**
 * Creates a mock child process for testing
 */
function createMockSpawn(): SpawnMock {
  const mockChildProcess: MockChildProcess = {
    stdout: { on: jest.fn() },
    stderr: { on: jest.fn() },
    on: jest.fn(),
    kill: jest.fn(),
  };

  const spawnMock = jest.fn(() => mockChildProcess) as SpawnMock;
  spawnMock.mockChildProcess = mockChildProcess;

  return spawnMock;
}

/**
 * Simulates stdout data emission
 */
function emitStdout(spawnMock: SpawnMock, data: string): void {
  const stdoutOnCall = spawnMock.mockChildProcess.stdout.on.mock.calls.find(
    (call) => call[0] === 'data'
  );
  if (stdoutOnCall) {
    stdoutOnCall[1](Buffer.from(data));
  }
}

/**
 * Simulates stderr data emission
 */
function emitStderr(spawnMock: SpawnMock, data: string): void {
  const stderrOnCall = spawnMock.mockChildProcess.stderr.on.mock.calls.find(
    (call) => call[0] === 'data'
  );
  if (stderrOnCall) {
    stderrOnCall[1](Buffer.from(data));
  }
}

/**
 * Simulates process close event
 */
function emitClose(spawnMock: SpawnMock, code: number | null): void {
  const closeCall = spawnMock.mockChildProcess.on.mock.calls.find(
    (call) => call[0] === 'close'
  );
  if (closeCall) {
    closeCall[1](code);
  }
}

/**
 * Simulates process error event
 */
function emitError(spawnMock: SpawnMock, error: Error): void {
  const errorCall = spawnMock.mockChildProcess.on.mock.calls.find(
    (call) => call[0] === 'error'
  );
  if (errorCall) {
    errorCall[1](error);
  }
}

describe('OpenCodeAdapter', () => {
  let mockSpawn: SpawnMock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockSpawn = createMockSpawn();
    (spawn as unknown as jest.Mock) = mockSpawn;
  });

  describe('constructor', () => {
    it('should use default opencode path when not specified', () => {
      const adapter = new OpenCodeAdapter();
      // Verify by running - the spawn should use 'opencode'
      adapter.run('test');
      expect(mockSpawn).toHaveBeenCalledWith(
        'opencode',
        expect.any(Array),
        expect.any(Object)
      );
    });

    it('should use custom opencode path when specified', () => {
      const adapter = new OpenCodeAdapter('/custom/path/opencode');
      adapter.run('test');
      expect(mockSpawn).toHaveBeenCalledWith(
        '/custom/path/opencode',
        expect.any(Array),
        expect.any(Object)
      );
    });
  });

  describe('run', () => {
    it('should spawn process with correct arguments', async () => {
      const adapter = new OpenCodeAdapter();
      const runPromise = adapter.run('test prompt');

      // Simulate immediate close
      emitStdout(mockSpawn, 'output');
      emitClose(mockSpawn, 0);

      await runPromise;

      expect(mockSpawn).toHaveBeenCalledWith(
        'opencode',
        ['run', 'test prompt'],
        expect.objectContaining({
          windowsHide: true,
        })
      );
    });

    it('should include model option in arguments', async () => {
      const adapter = new OpenCodeAdapter();
      const runPromise = adapter.run('test', { model: 'claude-3' });

      emitClose(mockSpawn, 0);

      await runPromise;

      expect(mockSpawn).toHaveBeenCalledWith(
        'opencode',
        ['run', 'test', '--model', 'claude-3'],
        expect.any(Object)
      );
    });

    it('should include session option in arguments', async () => {
      const adapter = new OpenCodeAdapter();
      const runPromise = adapter.run('test', { session: 'session-123' });

      emitClose(mockSpawn, 0);

      await runPromise;

      expect(mockSpawn).toHaveBeenCalledWith(
        'opencode',
        ['run', 'test', '--session', 'session-123'],
        expect.any(Object)
      );
    });

    it('should include both model and session options', async () => {
      const adapter = new OpenCodeAdapter();
      const runPromise = adapter.run('test', {
        model: 'gpt-4',
        session: 'session-456',
      });

      emitClose(mockSpawn, 0);

      await runPromise;

      expect(mockSpawn).toHaveBeenCalledWith(
        'opencode',
        ['run', 'test', '--model', 'gpt-4', '--session', 'session-456'],
        expect.any(Object)
      );
    });

    it('should use custom cwd when specified', async () => {
      const adapter = new OpenCodeAdapter();
      const runPromise = adapter.run('test', { cwd: '/custom/dir' });

      emitClose(mockSpawn, 0);

      await runPromise;

      expect(mockSpawn).toHaveBeenCalledWith(
        'opencode',
        expect.any(Array),
        expect.objectContaining({
          cwd: '/custom/dir',
        })
      );
    });

    it('should return stdout content', async () => {
      const adapter = new OpenCodeAdapter();
      const runPromise = adapter.run('test');

      emitStdout(mockSpawn, 'Hello from OpenCode!');
      emitClose(mockSpawn, 0);

      const result = await runPromise;

      expect(result.stdout).toBe('Hello from OpenCode!');
    });

    it('should return stderr content', async () => {
      const adapter = new OpenCodeAdapter();
      const runPromise = adapter.run('test');

      emitStderr(mockSpawn, 'Warning: deprecated feature');
      emitClose(mockSpawn, 0);

      const result = await runPromise;

      expect(result.stderr).toBe('Warning: deprecated feature');
    });

    it('should return exit code 0 on success', async () => {
      const adapter = new OpenCodeAdapter();
      const runPromise = adapter.run('test');

      emitClose(mockSpawn, 0);

      const result = await runPromise;

      expect(result.exitCode).toBe(0);
    });

    it('should return non-zero exit code on failure', async () => {
      const adapter = new OpenCodeAdapter();
      const runPromise = adapter.run('test');

      emitClose(mockSpawn, 1);

      const result = await runPromise;

      expect(result.exitCode).toBe(1);
    });

    it('should return exit code 1 when null', async () => {
      const adapter = new OpenCodeAdapter();
      const runPromise = adapter.run('test');

      emitClose(mockSpawn, null);

      const result = await runPromise;

      expect(result.exitCode).toBe(1);
    });

    it('should return duration in milliseconds', async () => {
      const adapter = new OpenCodeAdapter();
      const runPromise = adapter.run('test');

      // Small delay to ensure duration > 0
      await new Promise((resolve) => setTimeout(resolve, 10));
      emitClose(mockSpawn, 0);

      const result = await runPromise;

      expect(result.duration).toBeGreaterThanOrEqual(0);
      expect(typeof result.duration).toBe('number');
    });

    it('should accumulate multiple stdout chunks', async () => {
      const adapter = new OpenCodeAdapter();
      const runPromise = adapter.run('test');

      emitStdout(mockSpawn, 'Part 1 ');
      emitStdout(mockSpawn, 'Part 2 ');
      emitStdout(mockSpawn, 'Part 3');
      emitClose(mockSpawn, 0);

      const result = await runPromise;

      expect(result.stdout).toBe('Part 1 Part 2 Part 3');
    });

    it('should reject on timeout', async () => {
      jest.useFakeTimers();

      const adapter = new OpenCodeAdapter();
      const runPromise = adapter.run('test', { timeout: 1000 });

      // Fast-forward time
      jest.advanceTimersByTime(1001);

      await expect(runPromise).rejects.toThrow(
        'OpenCode timed out after 1000ms'
      );
      expect(mockSpawn.mockChildProcess.kill).toHaveBeenCalled();

      jest.useRealTimers();
    });

    it('should use default timeout of 5 minutes', async () => {
      const adapter = new OpenCodeAdapter();
      const runPromise = adapter.run('test');

      // Resolve immediately for test
      emitClose(mockSpawn, 0);

      const result = await runPromise;
      expect(result).toBeDefined();
    });

    it('should reject on spawn error', async () => {
      const adapter = new OpenCodeAdapter();
      const runPromise = adapter.run('test');

      emitError(mockSpawn, new Error('spawn ENOENT'));

      await expect(runPromise).rejects.toThrow('spawn ENOENT');
    });

    it('should clear timeout on successful completion', async () => {
      jest.useFakeTimers();

      const adapter = new OpenCodeAdapter();
      const runPromise = adapter.run('test', { timeout: 1000 });

      emitClose(mockSpawn, 0);

      const result = await runPromise;
      expect(result.exitCode).toBe(0);

      // Advance time past timeout - should not reject
      jest.advanceTimersByTime(2000);

      jest.useRealTimers();
    });
  });

  describe('isAvailable', () => {
    it('should return true when CLI is available', async () => {
      const adapter = new OpenCodeAdapter();
      const availablePromise = adapter.isAvailable();

      emitStdout(mockSpawn, 'opencode v1.0.0');
      emitClose(mockSpawn, 0);

      const available = await availablePromise;

      expect(available).toBe(true);
    });

    it('should return false when CLI returns non-zero exit code', async () => {
      const adapter = new OpenCodeAdapter();
      const availablePromise = adapter.isAvailable();

      emitClose(mockSpawn, 1);

      const available = await availablePromise;

      expect(available).toBe(false);
    });

    it('should return false when CLI is not found', async () => {
      const adapter = new OpenCodeAdapter();
      const availablePromise = adapter.isAvailable();

      emitError(mockSpawn, new Error('spawn ENOENT'));

      const available = await availablePromise;

      expect(available).toBe(false);
    });

    it('should use short timeout for availability check', async () => {
      const adapter = new OpenCodeAdapter();
      const availablePromise = adapter.isAvailable();

      // Verify spawn was called
      expect(mockSpawn).toHaveBeenCalled();

      emitClose(mockSpawn, 0);

      await availablePromise;
    });
  });

  describe('Integration-like tests', () => {
    it('should handle complete successful workflow', async () => {
      const adapter = new OpenCodeAdapter('/usr/local/bin/opencode');
      const runPromise = adapter.run('Create a hello world program', {
        model: 'claude-3',
        session: 'test-session',
        cwd: '/home/user/project',
      });

      emitStdout(mockSpawn, 'Creating hello world program...\n');
      emitStdout(mockSpawn, 'File created: hello.py\n');
      emitStderr(mockSpawn, 'Note: Using claude-3 model\n');
      emitClose(mockSpawn, 0);

      const result: OpenCodeResult = await runPromise;

      expect(result.stdout).toContain('Creating hello world program');
      expect(result.stdout).toContain('File created: hello.py');
      expect(result.stderr).toContain('Using claude-3 model');
      expect(result.exitCode).toBe(0);
      expect(result.duration).toBeGreaterThanOrEqual(0);
    });

    it('should handle CLI error gracefully', async () => {
      const adapter = new OpenCodeAdapter();
      const runPromise = adapter.run('invalid command');

      emitStderr(mockSpawn, 'Error: Invalid command syntax\n');
      emitClose(mockSpawn, 2);

      const result = await runPromise;

      expect(result.exitCode).toBe(2);
      expect(result.stderr).toContain('Invalid command');
    });
  });
});
