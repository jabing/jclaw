/**
 * Sandbox Isolator
 *
 * Isolates code execution to prevent malicious or buggy code
 * from affecting the main system
 *
 * @module @jclaw/core/evolution/kernel
 */

import type { Executor } from '../../types.js';

export interface IsolationResult {
  success: boolean;
  output: string;
  error?: string;
  duration: number;
}

export interface IsolationConfig {
  timeout: number;
  memoryLimit?: string;
  cpuLimit?: string;
}

export class SandboxIsolator {
  private readonly executor: Executor;
  private readonly config: IsolationConfig;

  constructor(executor: Executor, config?: Partial<IsolationConfig>) {
    this.executor = executor;
    this.config = {
      timeout: 30000, // 30 seconds default
      ...config,
    };
  }

  /**
   * Isolate and execute code in a sandbox environment
   */
  async isolate(code: string): Promise<IsolationResult> {
    const startTime = Date.now();

    try {
      // For now, execute directly. In production, this would use
      // a proper sandbox (Docker container, VM, etc.)
      const result = await this.executor.execute(code, {
        timeout: this.config.timeout,
      });

      return {
        success: result.exitCode === 0,
        output: result.stdout,
        duration: Date.now() - startTime,
      };
    } catch (error) {
      return {
        success: false,
        output: '',
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: Date.now() - startTime,
      };
    }
  }

  /**
   * Clean up isolation environment
   */
  async cleanup(): Promise<void> {
    // Clean up any temporary files or containers
    // Implementation depends on sandbox technology
  }
}

export function createSandboxIsolator(
  executor: Executor,
  config?: Partial<IsolationConfig>
): SandboxIsolator {
  return new SandboxIsolator(executor, config);
}
