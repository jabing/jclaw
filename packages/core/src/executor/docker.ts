/**
 * Docker Executor Implementation
 *
 * Executes shell commands inside Docker containers using docker CLI.
 * Supports container isolation, resource limits, and timeout control.
 *
 * @module @jclaw/core/executor/docker
 */

import { spawn } from 'child_process';
import type { Executor, ExecuteOptions, ExecuteResult } from './interface.js';

/**
 * Default Docker image to use when none specified
 */
const DEFAULT_IMAGE = 'alpine:latest';

/**
 * Default timeout for command execution (5 minutes)
 */
const DEFAULT_TIMEOUT = 5 * 60 * 1000;

/**
 * Docker command executor using docker CLI
 *
 * Executes shell commands inside Docker containers with support for:
 * - Custom Docker images
 * - Environment variables
 * - Working directory configuration
 * - Resource limits (memory, CPU)
 * - Configurable timeout with container cleanup
 */
export class DockerExecutor implements Executor {
  /** Execution mode identifier */
  readonly mode = 'docker' as const;

  /**
   * Build docker run command arguments
   *
   * @param options - Execution options
   * @param command - The command to execute
   * @returns Array of docker run arguments
   */
  private buildDockerArgs(
    options: ExecuteOptions | undefined,
    command: string
  ): string[] {
    const args: string[] = ['run', '--rm'];

    // Add interactive flag to keep stdin open
    args.push('-i');

    // Add working directory if specified
    if (options?.cwd) {
      args.push('-w', options.cwd);
    }

    // Add environment variables
    if (options?.env) {
      for (const [key, value] of Object.entries(options.env)) {
        args.push('-e', `${key}=${value}`);
      }
    }

    // Add resource limits from container config
    if (options?.container) {
      if (options.container.memory) {
        args.push('--memory', options.container.memory);
      }
      if (options.container.cpu) {
        args.push('--cpus', options.container.cpu);
      }
    }

    // Add the image name
    const image = options?.container?.image ?? DEFAULT_IMAGE;
    args.push(image);

    // Add the command to execute
    // Use shell to properly execute the command string
    args.push('sh', '-c', command);

    return args;
  }

  /**
   * Execute a shell command inside a Docker container
   *
   * @param command - The command to execute
   * @param options - Execution options (timeout, cwd, env, container config, etc.)
   * @returns Promise resolving to execution result
   */
  async execute(
    command: string,
    options?: ExecuteOptions
  ): Promise<ExecuteResult> {
    const startTime = Date.now();
    const timeout = options?.timeout ?? DEFAULT_TIMEOUT;

    return new Promise<ExecuteResult>((resolve) => {
      let stdout = '';
      let stderr = '';
      let timedOut = false;
      let containerId: string | null = null;

      // Build docker run arguments
      const dockerArgs = this.buildDockerArgs(options, command);

      // Spawn the docker process
      const proc = spawn('docker', dockerArgs, {
        windowsHide: true,
      });

      // Capture container ID from docker's initial output if available
      // Note: docker run --rm doesn't output container ID to stdout,
      // but we can track the process itself

      // Set up timeout handler
      const timeoutId = setTimeout(() => {
        timedOut = true;
        // Kill the docker run process, which will stop and remove the container
        proc.kill('SIGKILL');
      }, timeout);

      // Collect stdout
      proc.stdout.on('data', (data: Buffer) => {
        stdout += data.toString('utf8');
      });

      // Collect stderr
      proc.stderr.on('data', (data: Buffer) => {
        const output = data.toString('utf8');
        stderr += output;

        // Try to extract container ID from docker output if present
        // This helps with cleanup if needed
        const containerMatch = output.match(/container ([a-f0-9]{12,})/);
        if (containerMatch && !containerId) {
          containerId = containerMatch[1] ?? null;
        }
      });

      // Handle process completion
      proc.on('close', (code: number | null) => {
        clearTimeout(timeoutId);
        const duration = Date.now() - startTime;

        resolve({
          stdout,
          stderr,
          exitCode: timedOut ? 124 : (code ?? 1),
          duration,
        });
      });

      // Handle process errors
      proc.on('error', (error: Error) => {
        clearTimeout(timeoutId);
        const duration = Date.now() - startTime;

        // Check if docker is not installed
        if (
          error.message.includes('ENOENT') ||
          error.message.includes('spawn')
        ) {
          resolve({
            stdout,
            stderr:
              'Docker is not installed or not in PATH. Please install Docker to use docker execution mode.',
            exitCode: 127,
            duration,
          });
          return;
        }

        resolve({
          stdout,
          stderr: error.message,
          exitCode: 1,
          duration,
        });
      });
    });
  }
}

/**
 * Create a new DockerExecutor instance
 *
 * @returns A new DockerExecutor instance
 */
export function createDockerExecutor(): DockerExecutor {
  return new DockerExecutor();
}
