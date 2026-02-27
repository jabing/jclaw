/**
 * Local Executor Implementation
 *
 * Executes shell commands locally using Node.js spawn.
 * Supports Windows and Unix platforms with timeout control.
 *
 * @module @jclaw/core/executor/local
 */
import { spawn } from 'child_process';
/**
 * Default timeout for command execution (5 minutes)
 */
const DEFAULT_TIMEOUT = 5 * 60 * 1000;
/**
 * Local command executor using Node.js spawn
 *
 * Executes shell commands on the local system with support for:
 * - Cross-platform execution (Windows/Unix)
 * - Configurable timeout
 * - Working directory and environment variable customization
 */
export class LocalExecutor {
    /** Execution mode identifier */
    mode = 'local';
    /**
     * Execute a shell command locally
     *
     * @param command - The command to execute
     * @param options - Execution options (timeout, cwd, env, etc.)
     * @returns Promise resolving to execution result
     */
    async execute(command, options) {
        const startTime = Date.now();
        const timeout = options?.timeout ?? DEFAULT_TIMEOUT;
        return new Promise((resolve) => {
            let stdout = '';
            let stderr = '';
            let timedOut = false;
            // Determine shell based on platform
            const isWindows = process.platform === 'win32';
            const shell = isWindows ? 'cmd.exe' : '/bin/sh';
            const shellArgs = isWindows ? ['/c', command] : ['-c', command];
            // Spawn the process
            const proc = spawn(shell, shellArgs, {
                cwd: options?.cwd,
                env: { ...process.env, ...options?.env },
                windowsHide: true,
            });
            // Set up timeout handler
            const timeoutId = setTimeout(() => {
                timedOut = true;
                proc.kill('SIGKILL');
            }, timeout);
            // Collect stdout
            proc.stdout.on('data', (data) => {
                stdout += data.toString('utf8');
            });
            // Collect stderr
            proc.stderr.on('data', (data) => {
                stderr += data.toString('utf8');
            });
            // Handle process completion
            proc.on('close', (code) => {
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
            proc.on('error', (error) => {
                clearTimeout(timeoutId);
                const duration = Date.now() - startTime;
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
 * Create a new LocalExecutor instance
 *
 * @returns A new LocalExecutor instance
 */
export function createLocalExecutor() {
    return new LocalExecutor();
}
//# sourceMappingURL=local.js.map