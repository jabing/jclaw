/**
 * LocalExecutor Tests
 *
 * Tests for the local command executor implementation.
 */
import { LocalExecutor, createLocalExecutor, } from '../../src/executor/local.js';
describe('LocalExecutor', () => {
    let executor;
    beforeEach(() => {
        executor = new LocalExecutor();
    });
    describe('constructor and properties', () => {
        it('should create an instance with mode "local"', () => {
            expect(executor.mode).toBe('local');
        });
        it('should be created by factory function', () => {
            const factoryExecutor = createLocalExecutor();
            expect(factoryExecutor).toBeInstanceOf(LocalExecutor);
            expect(factoryExecutor.mode).toBe('local');
        });
    });
    describe('execute', () => {
        it('should execute basic command and return stdout', async () => {
            const result = await executor.execute('echo hello');
            expect(result.stdout.trim()).toBe('hello');
            expect(result.stderr).toBe('');
            expect(result.exitCode).toBe(0);
            expect(result.duration).toBeGreaterThanOrEqual(0);
        });
        it('should handle command failure with non-zero exit code', async () => {
            const result = await executor.execute('exit 1');
            expect(result.exitCode).toBe(1);
            expect(result.duration).toBeGreaterThanOrEqual(0);
        });
        it('should capture stderr output', async () => {
            // This command writes to stderr on both platforms
            const result = await executor.execute('echo error >&2');
            expect(result.stderr.toLowerCase()).toContain('error');
            expect(result.exitCode).toBe(0);
        });
        it('should handle timeout correctly', async () => {
            // Use a Node.js command that can be easily killed
            // This creates a simple infinite loop in Node.js
            const longCommand = 'node -e "while(true) {}"';
            const startTime = Date.now();
            const result = await executor.execute(longCommand, { timeout: 200 });
            const elapsed = Date.now() - startTime;
            // Should timeout around 200ms, not run forever
            expect(elapsed).toBeLessThan(3000);
            // Accept either 124 (timeout exit code) or 1 (process killed in some environments)
            expect([1, 124]).toContain(result.exitCode);
        }, 10000); // Give test 10 seconds to complete
        it('should respect custom working directory', async () => {
            const result = await executor.execute('echo test', {
                cwd: process.cwd(),
            });
            expect(result.stdout.trim()).toBe('test');
            expect(result.exitCode).toBe(0);
        });
        it('should handle custom environment variables', async () => {
            const isWindows = process.platform === 'win32';
            const echoVarCmd = isWindows ? 'echo %MY_TEST_VAR%' : 'echo $MY_TEST_VAR';
            const result = await executor.execute(echoVarCmd, {
                env: { MY_TEST_VAR: 'custom_value' },
            });
            expect(result.stdout.trim()).toBe('custom_value');
            expect(result.exitCode).toBe(0);
        });
        it('should return duration in milliseconds', async () => {
            const result = await executor.execute('echo test');
            expect(typeof result.duration).toBe('number');
            expect(result.duration).toBeGreaterThanOrEqual(0);
        });
        it('should handle invalid command gracefully', async () => {
            const result = await executor.execute('nonexistent_command_xyz_123');
            expect(result.exitCode).not.toBe(0);
            expect(result.stderr.length).toBeGreaterThan(0);
        });
    });
});
//# sourceMappingURL=local.test.js.map