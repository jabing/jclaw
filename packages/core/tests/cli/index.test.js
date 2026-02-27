/**
 * CLI Tests
 *
 * Tests for the JClaw command-line interface.
 */
import { execCommand } from '../../src/cli/commands/exec.js';
import { configCommand, getConfig, setConfigValue, DEFAULT_CONFIG, } from '../../src/cli/commands/config.js';
import { VERSION } from '../../src/cli/index.js';
// Mock console.log and console.error
const mockConsole = () => {
    const logs = [];
    const originalLog = console.log;
    const originalError = console.error;
    console.log = (...args) => {
        logs.push(args.join(' '));
    };
    console.error = (...args) => {
        logs.push(args.join(' '));
    };
    return {
        logs,
        restore: () => {
            console.log = originalLog;
            console.error = originalError;
        },
    };
};
describe('CLI', () => {
    describe('VERSION', () => {
        it('should have a version defined', () => {
            expect(VERSION).toBeDefined();
            expect(VERSION).toMatch(/^\d+\.\d+\.\d+$/);
        });
    });
});
describe('exec command', () => {
    let consoleMock;
    beforeEach(() => {
        consoleMock = mockConsole();
    });
    afterEach(() => {
        consoleMock.restore();
    });
    it('should throw error when no prompt provided', async () => {
        await expect(execCommand([])).rejects.toThrow('No prompt provided');
    });
    it('should execute with a prompt', async () => {
        await execCommand(['Analyze', 'this', 'project']);
        const output = consoleMock.logs.join('\n');
        expect(output).toContain('Executing: Analyze this project');
        expect(output).toContain('Phase 1');
    });
    it('should handle verbose flag', async () => {
        await execCommand(['Test', 'prompt', '--verbose']);
        const output = consoleMock.logs.join('\n');
        expect(output).toContain('[verbose]');
        expect(output).toContain('Test prompt');
    });
    it('should handle short verbose flag', async () => {
        await execCommand(['Another', 'test', '-V']);
        const output = consoleMock.logs.join('\n');
        expect(output).toContain('[verbose]');
    });
});
describe('config command', () => {
    let consoleMock;
    beforeEach(() => {
        consoleMock = mockConsole();
        // Reset config to defaults before each test
        Object.keys(DEFAULT_CONFIG).forEach((key) => {
            const value = DEFAULT_CONFIG[key];
            if (value !== undefined) {
                setConfigValue(key, value);
            }
        });
    });
    afterEach(() => {
        consoleMock.restore();
    });
    describe('get', () => {
        it('should throw error when no key provided', async () => {
            await expect(configCommand(['get'])).rejects.toThrow('Key required');
        });
        it('should get existing config value', async () => {
            await configCommand(['get', 'execution.mode']);
            const output = consoleMock.logs.join('\n');
            expect(output).toContain('execution.mode');
            expect(output).toContain('local');
        });
        it('should show not set for unknown keys', async () => {
            await configCommand(['get', 'unknown.key']);
            const output = consoleMock.logs.join('\n');
            expect(output).toContain('unknown.key');
            expect(output).toContain('not set');
        });
    });
    describe('set', () => {
        it('should throw error when no key provided', async () => {
            await expect(configCommand(['set'])).rejects.toThrow('Key and value required');
        });
        it('should throw error when no value provided', async () => {
            await expect(configCommand(['set', 'some.key'])).rejects.toThrow('Key and value required');
        });
        it('should set string value', async () => {
            await configCommand(['set', 'test.key', 'testvalue']);
            const output = consoleMock.logs.join('\n');
            expect(output).toContain('Set test.key = testvalue');
        });
        it('should set boolean value from string "true"', async () => {
            await configCommand(['set', 'test.bool', 'true']);
            const config = getConfig();
            expect(config['test.bool']).toBe(true);
        });
        it('should set boolean value from string "false"', async () => {
            await configCommand(['set', 'test.bool', 'false']);
            const config = getConfig();
            expect(config['test.bool']).toBe(false);
        });
        it('should set numeric value from numeric string', async () => {
            await configCommand(['set', 'test.number', '42']);
            const config = getConfig();
            expect(config['test.number']).toBe(42);
        });
    });
    describe('list', () => {
        it('should list all configuration values', async () => {
            await configCommand(['list']);
            const output = consoleMock.logs.join('\n');
            expect(output).toContain('Current configuration');
            expect(output).toContain('execution.mode');
        });
    });
    describe('reset', () => {
        it('should reset configuration to defaults', async () => {
            // Modify a value
            await configCommand(['set', 'execution.mode', 'docker']);
            // Reset
            await configCommand(['reset']);
            // Verify reset
            const config = getConfig();
            expect(config['execution.mode']).toBe('local');
        });
    });
    describe('help', () => {
        it('should show help when no subcommand provided', async () => {
            await configCommand([]);
            const output = consoleMock.logs.join('\n');
            expect(output).toContain('Configuration management');
        });
    });
    describe('unknown command', () => {
        it('should throw error for unknown subcommand', async () => {
            await expect(configCommand(['unknown'])).rejects.toThrow('Unknown config command');
        });
    });
});
describe('config exports', () => {
    it('should export getConfig function', () => {
        expect(typeof getConfig).toBe('function');
    });
    it('should export setConfigValue function', () => {
        expect(typeof setConfigValue).toBe('function');
    });
    it('should export DEFAULT_CONFIG', () => {
        expect(DEFAULT_CONFIG).toBeDefined();
        expect(DEFAULT_CONFIG['execution.mode']).toBe('local');
    });
});
//# sourceMappingURL=index.test.js.map