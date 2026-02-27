/**
 * OpenCode Adapter
 *
 * Wraps OpenCode CLI calls for programmatic use.
 *
 * @module @jclaw/extension-opencode/adapter
 */

import { spawn } from 'child_process';

/**
 * Options for OpenCode CLI execution
 */
export interface OpenCodeOptions {
  /** Model to use for generation */
  model?: string;
  /** Session ID for context persistence */
  session?: string;
  /** Timeout in milliseconds (default: 300000 / 5 minutes) */
  timeout?: number;
  /** Working directory for execution */
  cwd?: string;
}

/**
 * Result from OpenCode CLI execution
 */
export interface OpenCodeResult {
  /** Standard output from the CLI */
  stdout: string;
  /** Standard error from the CLI */
  stderr: string;
  /** Exit code from the CLI process */
  exitCode: number;
  /** Duration of execution in milliseconds */
  duration: number;
}

/**
 * OpenCode Adapter - Encapsulates OpenCode CLI calls
 *
 * Provides a programmatic interface to the OpenCode CLI,
 * handling process spawning, timeouts, and result collection.
 *
 * @example
 * ```typescript
 * const adapter = new OpenCodeAdapter();
 * const result = await adapter.run('Create a hello world program');
 * console.log(result.stdout);
 * ```
 */
export class OpenCodeAdapter {
  private readonly opencodePath: string;

  /**
   * Create a new OpenCode adapter
   * @param opencodePath - Path to the opencode CLI (default: 'opencode')
   */
  constructor(opencodePath: string = 'opencode') {
    this.opencodePath = opencodePath;
  }

  /**
   * Execute OpenCode run command
   *
   * @param prompt - The prompt to send to OpenCode
   * @param options - Execution options
   * @returns Promise resolving to execution result
   * @throws Error if timeout is reached or process fails to spawn
   *
   * @example
   * ```typescript
   * const result = await adapter.run('Refactor this function', {
   *   model: 'claude-3',
   *   timeout: 60000
   * });
   * ```
   */
  async run(
    prompt: string,
    options: OpenCodeOptions = {}
  ): Promise<OpenCodeResult> {
    const startTime = Date.now();
    const timeout = options.timeout ?? 300000; // 5 minutes default timeout
    const cwd = options.cwd ?? process.cwd();

    const args = ['run', prompt];
    if (options.model) {
      args.push('--model', options.model);
    }
    if (options.session) {
      args.push('--session', options.session);
    }

    return new Promise((resolve, reject) => {
      const proc = spawn(this.opencodePath, args, {
        cwd,
        windowsHide: true,
      });

      let stdout = '';
      let stderr = '';

      proc.stdout.on('data', (data: Buffer) => {
        stdout += data.toString();
      });

      proc.stderr.on('data', (data: Buffer) => {
        stderr += data.toString();
      });

      const timer = setTimeout(() => {
        proc.kill();
        reject(new Error(`OpenCode timed out after ${timeout}ms`));
      }, timeout);

      proc.on('close', (code: number | null) => {
        clearTimeout(timer);
        resolve({
          stdout,
          stderr,
          exitCode: code ?? 1,
          duration: Date.now() - startTime,
        });
      });

      proc.on('error', (err: Error) => {
        clearTimeout(timer);
        reject(err);
      });
    });
  }

  /**
   * Check if OpenCode CLI is available
   *
   * Attempts to run a quick version check to verify the CLI is installed
   * and accessible in the system PATH.
   *
   * @returns Promise resolving to true if available, false otherwise
   *
   * @example
   * ```typescript
   * if (await adapter.isAvailable()) {
   *   console.log('OpenCode is ready to use');
   * }
   * ```
   */
  async isAvailable(): Promise<boolean> {
    try {
      const result = await this.run('--version', { timeout: 5000 });
      return result.exitCode === 0;
    } catch {
      return false;
    }
  }
}
