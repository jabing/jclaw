/**
 * Comprehensive Tests for CLI config command
 *
 * These tests provide full coverage for the config command including:
 * - Config get/set/list/reset operations
 * - Type parsing (string, number, boolean)
 * - Error handling
 * - Help display
 */

import {
  configCommand,
  getConfig,
  setConfigValue,
  DEFAULT_CONFIG,
  showConfigHelp,
} from '../../src/cli/commands/config.js';

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

describe('config command', () => {
  let consoleMock: ReturnType<typeof mockConsole>;

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

    it('should get default timeout value', async () => {
      await configCommand(['get', 'execution.timeout']);

      const output = consoleMock.logs.join('\n');
      expect(output).toContain('execution.timeout');
      expect(output).toContain('300000');
    });

    it('should get evolution enabled value', async () => {
      await configCommand(['get', 'evolution.enabled']);

      const output = consoleMock.logs.join('\n');
      expect(output).toContain('evolution.enabled');
      expect(output).toContain('false');
    });
  });

  describe('set', () => {
    it('should throw error when no key provided', async () => {
      await expect(configCommand(['set'])).rejects.toThrow(
        'Key and value required'
      );
    });

    it('should throw error when no value provided', async () => {
      await expect(configCommand(['set', 'some.key'])).rejects.toThrow(
        'Key and value required'
      );
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

    it('should set zero as numeric value', async () => {
      await configCommand(['set', 'test.zero', '0']);

      const config = getConfig();
      expect(config['test.zero']).toBe(0);
    });

    it('should set negative number as numeric value', async () => {
      await configCommand(['set', 'test.negative', '-10']);

      const config = getConfig();
      expect(config['test.negative']).toBe(-10);
    });

    it('should set float number as numeric value', async () => {
      await configCommand(['set', 'test.float', '3.14']);

      const config = getConfig();
      expect(config['test.float']).toBe(3.14);
    });

    it('should set execution mode to docker', async () => {
      await configCommand(['set', 'execution.mode', 'docker']);

      const config = getConfig();
      expect(config['execution.mode']).toBe('docker');
    });

    it('should set execution mode to hybrid', async () => {
      await configCommand(['set', 'execution.mode', 'hybrid']);

      const config = getConfig();
      expect(config['execution.mode']).toBe('hybrid');
    });

    it('should update existing value', async () => {
      await configCommand(['set', 'test.key', 'value1']);
      await configCommand(['set', 'test.key', 'value2']);

      const config = getConfig();
      expect(config['test.key']).toBe('value2');
    });

    it('should set value with spaces in key name', async () => {
      await configCommand(['set', 'some.nested.key', 'value']);

      const config = getConfig();
      expect(config['some.nested.key']).toBe('value');
    });
  });

  describe('list', () => {
    it('should list all configuration values', async () => {
      await configCommand(['list']);

      const output = consoleMock.logs.join('\n');
      expect(output).toContain('Current configuration');
      expect(output).toContain('execution.mode');
      expect(output).toContain('execution.timeout');
      expect(output).toContain('context.maxTokens');
      expect(output).toContain('evolution.enabled');
    });

    it('should include custom values in list', async () => {
      await configCommand(['set', 'custom.key', 'customvalue']);
      await configCommand(['list']);

      const output = consoleMock.logs.join('\n');
      expect(output).toContain('custom.key');
      expect(output).toContain('customvalue');
    });

    it('should show empty configuration if all reset', async () => {
      await configCommand(['reset']);
      // Add a custom value then remove it by resetting
      await configCommand(['set', 'temp', 'value']);
      await configCommand(['reset']);
      await configCommand(['list']);

      const output = consoleMock.logs.join('\n');
      expect(output).toContain('Current configuration');
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

    it('should remove custom values on reset', async () => {
      // Add custom values
      await configCommand(['set', 'custom.key1', 'value1']);
      await configCommand(['set', 'custom.key2', 'value2']);

      // Reset
      await configCommand(['reset']);

      // Verify custom values are removed
      const config = getConfig();
      expect(config['custom.key1']).toBeUndefined();
      expect(config['custom.key2']).toBeUndefined();
    });

    it('should confirm reset with message', async () => {
      await configCommand(['reset']);

      const output = consoleMock.logs.join('\n');
      expect(output).toContain('Configuration reset to defaults');
    });

    it('should reset timeout to default value', async () => {
      await configCommand(['set', 'execution.timeout', '60000']);
      await configCommand(['reset']);

      const config = getConfig();
      expect(config['execution.timeout']).toBe(300000);
    });
  });

  describe('help', () => {
    it('should show help when no subcommand provided', async () => {
      await configCommand([]);

      const output = consoleMock.logs.join('\n');
      expect(output).toContain('Configuration management');
    });

    it('should show help with --help flag', async () => {
      await configCommand(['--help']);

      const output = consoleMock.logs.join('\n');
      expect(output).toContain('jclaw config');
      expect(output).toContain('Usage:');
      expect(output).toContain('Commands:');
    });

    it('should show help with -h flag', async () => {
      await configCommand(['-h']);

      const output = consoleMock.logs.join('\n');
      expect(output).toContain('jclaw config');
    });
  });

  describe('unknown command', () => {
    it('should throw error for unknown subcommand', async () => {
      await expect(configCommand(['unknown'])).rejects.toThrow(
        'Unknown config command'
      );
    });

    it('should throw error for misspelled command', async () => {
      await expect(configCommand(['sett'])).rejects.toThrow(
        'Unknown config command'
      );
    });

    it('should throw error for empty string command', async () => {
      await expect(configCommand([''])).rejects.toThrow(
        'Unknown config command'
      );
    });
  });
});

describe('config exports', () => {
  let consoleMock: ReturnType<typeof mockConsole>;

  beforeEach(() => {
    consoleMock = mockConsole();
    // Reset config to defaults
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

  it('getConfig should return a copy of config', () => {
    const config1 = getConfig();
    const config2 = getConfig();

    expect(config1).toEqual(config2);
    expect(config1).not.toBe(config2); // Different objects
  });

  it('setConfigValue should update config', () => {
    setConfigValue('test.exported', 'value');

    const config = getConfig();
    expect(config['test.exported']).toBe('value');
  });

  it('setConfigValue should accept boolean values', () => {
    setConfigValue('test.bool', true);

    const config = getConfig();
    expect(config['test.bool']).toBe(true);
  });

  it('setConfigValue should accept numeric values', () => {
    setConfigValue('test.num', 123);

    const config = getConfig();
    expect(config['test.num']).toBe(123);
  });

  it('DEFAULT_CONFIG should have expected keys', () => {
    expect(Object.keys(DEFAULT_CONFIG)).toContain('execution.mode');
    expect(Object.keys(DEFAULT_CONFIG)).toContain('execution.timeout');
    expect(Object.keys(DEFAULT_CONFIG)).toContain('context.maxTokens');
    expect(Object.keys(DEFAULT_CONFIG)).toContain('evolution.enabled');
  });

  it('DEFAULT_CONFIG should have correct types', () => {
    expect(typeof DEFAULT_CONFIG['execution.mode']).toBe('string');
    expect(typeof DEFAULT_CONFIG['execution.timeout']).toBe('number');
    expect(typeof DEFAULT_CONFIG['context.maxTokens']).toBe('number');
    expect(typeof DEFAULT_CONFIG['evolution.enabled']).toBe('boolean');
  });
});

describe('config help display', () => {
  let consoleMock: ReturnType<typeof mockConsole>;

  beforeEach(() => {
    consoleMock = mockConsole();
  });

  afterEach(() => {
    consoleMock.restore();
  });

  it('should show help message', () => {
    showConfigHelp();

    const output = consoleMock.logs.join('\n');
    expect(output).toContain('jclaw config');
    expect(output).toContain('Usage:');
    expect(output).toContain('Commands:');
  });

  it('should include all commands in help', () => {
    showConfigHelp();

    const output = consoleMock.logs.join('\n');
    expect(output).toContain('get <key>');
    expect(output).toContain('set <key> <value>');
    expect(output).toContain('list');
    expect(output).toContain('reset');
  });

  it('should include examples in help', () => {
    showConfigHelp();

    const output = consoleMock.logs.join('\n');
    expect(output).toContain('Examples:');
    expect(output).toContain('jclaw config get execution.mode');
    expect(output).toContain('jclaw config set execution.mode');
    expect(output).toContain('jclaw config set evolution.enabled');
    expect(output).toContain('jclaw config list');
  });
});

describe('config type parsing', () => {
  let consoleMock: ReturnType<typeof mockConsole>;

  beforeEach(() => {
    consoleMock = mockConsole();
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

  it('should parse "true" as boolean true', async () => {
    await configCommand(['set', 'test.bool', 'true']);

    const config = getConfig();
    expect(config['test.bool']).toBe(true);
    expect(typeof config['test.bool']).toBe('boolean');
  });

  it('should parse "false" as boolean false', async () => {
    await configCommand(['set', 'test.bool', 'false']);

    const config = getConfig();
    expect(config['test.bool']).toBe(false);
    expect(typeof config['test.bool']).toBe('boolean');
  });

  it('should parse integer as number', async () => {
    await configCommand(['set', 'test.int', '42']);

    const config = getConfig();
    expect(config['test.int']).toBe(42);
    expect(typeof config['test.int']).toBe('number');
  });

  it('should parse zero as number', async () => {
    await configCommand(['set', 'test.zero', '0']);

    const config = getConfig();
    expect(config['test.zero']).toBe(0);
    expect(typeof config['test.zero']).toBe('number');
  });

  it('should parse negative number as number', async () => {
    await configCommand(['set', 'test.neg', '-5']);

    const config = getConfig();
    expect(config['test.neg']).toBe(-5);
    expect(typeof config['test.neg']).toBe('number');
  });

  it('should parse float as number', async () => {
    await configCommand(['set', 'test.float', '3.14159']);

    const config = getConfig();
    expect(config['test.float']).toBe(3.14159);
    expect(typeof config['test.float']).toBe('number');
  });

  it('should keep string value that looks like boolean in quotes as string', async () => {
    // Note: The actual command parsing handles quotes differently
    // This tests the set logic itself
    setConfigValue('test.quoted', '"true"');

    const config = getConfig();
    expect(config['test.quoted']).toBe('"true"');
    expect(typeof config['test.quoted']).toBe('string');
  });

  it('should keep string value as string when not parseable', async () => {
    await configCommand(['set', 'test.string', 'hello']);

    const config = getConfig();
    expect(config['test.string']).toBe('hello');
    expect(typeof config['test.string']).toBe('string');
  });

  it('should parse "TRUE" (uppercase) as string not boolean', async () => {
    await configCommand(['set', 'test.uppercase', 'TRUE']);

    const config = getConfig();
    expect(config['test.uppercase']).toBe('TRUE');
    expect(typeof config['test.uppercase']).toBe('string');
  });

  it('should parse "FALSE" (uppercase) as string not boolean', async () => {
    await configCommand(['set', 'test.uppercase', 'FALSE']);

    const config = getConfig();
    expect(config['test.uppercase']).toBe('FALSE');
    expect(typeof config['test.uppercase']).toBe('string');
  });
});
