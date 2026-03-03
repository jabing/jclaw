/**
 * DockerExecutor Tests
 *
 * Tests for the Docker command executor implementation.
 * Note: These tests require Docker to be installed and running.
 */

import {
  DockerExecutor,
  createDockerExecutor,
} from '../../src/executor/docker.js';

describe('DockerExecutor', () => {
  let executor: DockerExecutor;
  let dockerAvailable: boolean;

  beforeAll(async () => {
    // Check if Docker is available
    const { spawn } = await import('child_process');
    dockerAvailable = await new Promise((resolve) => {
      const proc = spawn('docker', ['version'], { windowsHide: true });
      proc.on('close', (code) => resolve(code === 0));
      proc.on('error', () => resolve(false));
    });

    if (!dockerAvailable) {
      console.warn('Docker is not available. Docker tests will be skipped.');
    }
  });

  beforeEach(() => {
    executor = new DockerExecutor();
  });

  const runIfDocker = (
    name: string,
    fn: () => Promise<void>,
    timeout?: number
  ) => {
    const testFn = dockerAvailable ? it : it.skip;
    testFn(name, fn, timeout);
  };

  describe('constructor and properties', () => {
    it('should create an instance with mode "docker"', () => {
      expect(executor.mode).toBe('docker');
    });

    it('should be created by factory function', () => {
      const factoryExecutor = createDockerExecutor();
      expect(factoryExecutor).toBeInstanceOf(DockerExecutor);
      expect(factoryExecutor.mode).toBe('docker');
    });
  });

  describe('execute', () => {
    runIfDocker(
      'should execute basic command and return stdout',
      async () => {
        const result = await executor.execute('echo hello');
        expect(result.stdout.trim()).toBe('hello');
        expect(result.exitCode).toBe(0);
        expect(result.duration).toBeGreaterThanOrEqual(0);
      },
      30000
    );

    runIfDocker(
      'should handle command failure with non-zero exit code',
      async () => {
        const result = await executor.execute('exit 1');
        expect(result.exitCode).toBe(1);
        expect(result.duration).toBeGreaterThanOrEqual(0);
      },
      30000
    );

    runIfDocker(
      'should capture stderr output',
      async () => {
        const result = await executor.execute('echo error >&2');
        expect(result.stderr.toLowerCase()).toContain('error');
        expect(result.exitCode).toBe(0);
      },
      30000
    );

    runIfDocker(
      'should handle timeout correctly',
      async () => {
        const startTime = Date.now();
        // Use a command that sleeps longer than the timeout
        const result = await executor.execute('sleep 10', { timeout: 500 });
        const elapsed = Date.now() - startTime;

        // Should timeout around 500ms
        expect(elapsed).toBeLessThan(5000);
        // Should return timeout exit code 124
        expect(result.exitCode).toBe(124);
      },
      15000
    );

    runIfDocker(
      'should respect custom working directory',
      async () => {
        const result = await executor.execute('pwd', {
          cwd: '/tmp',
        });

        expect(result.stdout.trim()).toBe('/tmp');
        expect(result.exitCode).toBe(0);
      },
      30000
    );

    runIfDocker(
      'should handle custom environment variables',
      async () => {
        const result = await executor.execute('echo $MY_TEST_VAR', {
          env: { MY_TEST_VAR: 'custom_value' },
        });

        expect(result.stdout.trim()).toBe('custom_value');
        expect(result.exitCode).toBe(0);
      },
      30000
    );

    runIfDocker(
      'should use custom image when specified',
      async () => {
        const result = await executor.execute('cat /etc/os-release', {
          container: { image: 'alpine:latest' },
        });

        expect(result.stdout.toLowerCase()).toContain('alpine');
        expect(result.exitCode).toBe(0);
      },
      60000
    );

    runIfDocker(
      'should support busybox image',
      async () => {
        const result = await executor.execute('echo test', {
          container: { image: 'busybox:latest' },
        });

        expect(result.stdout.trim()).toBe('test');
        expect(result.exitCode).toBe(0);
      },
      60000
    );

    runIfDocker(
      'should return duration in milliseconds',
      async () => {
        const result = await executor.execute('echo test');

        expect(typeof result.duration).toBe('number');
        expect(result.duration).toBeGreaterThanOrEqual(0);
      },
      30000
    );

    runIfDocker(
      'should handle complex commands with pipes',
      async () => {
        const result = await executor.execute(
          'echo "hello world" | tr " " "-"'
        );

        expect(result.stdout.trim()).toBe('hello-world');
        expect(result.exitCode).toBe(0);
      },
      30000
    );

    runIfDocker(
      'should handle multiple environment variables',
      async () => {
        const result = await executor.execute('echo "$VAR1-$VAR2"', {
          env: {
            VAR1: 'first',
            VAR2: 'second',
          },
        });

        expect(result.stdout.trim()).toBe('first-second');
        expect(result.exitCode).toBe(0);
      },
      30000
    );
  });

  describe('resource limits', () => {
    runIfDocker(
      'should apply memory limit when specified',
      async () => {
        // This test just verifies the command doesn't fail with memory limit
        // Actual memory limiting is handled by Docker
        const result = await executor.execute('echo test', {
          container: {
            image: 'alpine:latest',
            memory: '128m',
          },
        });

        expect(result.stdout.trim()).toBe('test');
        expect(result.exitCode).toBe(0);
      },
      60000
    );

    runIfDocker(
      'should apply CPU limit when specified',
      async () => {
        // This test just verifies the command doesn't fail with CPU limit
        const result = await executor.execute('echo test', {
          container: {
            image: 'alpine:latest',
            cpu: '0.5',
          },
        });

        expect(result.stdout.trim()).toBe('test');
        expect(result.exitCode).toBe(0);
      },
      60000
    );

    runIfDocker(
      'should apply both memory and CPU limits',
      async () => {
        const result = await executor.execute('echo test', {
          container: {
            image: 'alpine:latest',
            memory: '256m',
            cpu: '1.0',
          },
        });

        expect(result.stdout.trim()).toBe('test');
        expect(result.exitCode).toBe(0);
      },
      60000
    );
  });

  describe('error handling', () => {
    runIfDocker(
      'should handle invalid image gracefully',
      async () => {
        const result = await executor.execute('echo test', {
          container: { image: 'nonexistent-image-xyz-abc:invalid' },
        });

        expect(result.exitCode).not.toBe(0);
        expect(result.stderr.length).toBeGreaterThan(0);
      },
      60000
    );

    runIfDocker(
      'should handle invalid commands gracefully',
      async () => {
        const result = await executor.execute('nonexistent_command_xyz_123');

        expect(result.exitCode).not.toBe(0);
        expect(result.stderr.length).toBeGreaterThan(0);
      },
      30000
    );
  });
});
