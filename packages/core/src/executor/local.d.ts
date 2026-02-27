/**
 * Local Executor Implementation
 *
 * Executes shell commands locally using Node.js spawn.
 * Supports Windows and Unix platforms with timeout control.
 *
 * @module @jclaw/core/executor/local
 */
import type { Executor, ExecuteOptions, ExecuteResult } from './interface.js';
/**
 * Local command executor using Node.js spawn
 *
 * Executes shell commands on the local system with support for:
 * - Cross-platform execution (Windows/Unix)
 * - Configurable timeout
 * - Working directory and environment variable customization
 */
export declare class LocalExecutor implements Executor {
    /** Execution mode identifier */
    readonly mode: "local";
    /**
     * Execute a shell command locally
     *
     * @param command - The command to execute
     * @param options - Execution options (timeout, cwd, env, etc.)
     * @returns Promise resolving to execution result
     */
    execute(command: string, options?: ExecuteOptions): Promise<ExecuteResult>;
}
/**
 * Create a new LocalExecutor instance
 *
 * @returns A new LocalExecutor instance
 */
export declare function createLocalExecutor(): LocalExecutor;
//# sourceMappingURL=local.d.ts.map