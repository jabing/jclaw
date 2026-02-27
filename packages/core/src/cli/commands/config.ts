/**
 * jclaw config command - Configuration management
 *
 * Phase 1: Basic stub implementation
 */

export interface ConfigOptions {
  key?: string;
  value?: string;
}

// Default configuration values
const DEFAULT_CONFIG: Record<string, string | number | boolean> = {
  'execution.mode': 'local',
  'execution.timeout': 300000,
  'context.maxTokens': 128000,
  'evolution.enabled': false,
};

// In-memory config store (Phase 1)
// Future phases will persist to file
let configStore: Record<string, string | number | boolean> = {
  ...DEFAULT_CONFIG,
};

export async function configCommand(args: string[]): Promise<void> {
  if (args.length === 0) {
    showConfigHelp();
    return;
  }

  const subCommand = args[0];

  switch (subCommand) {
    case 'get':
      await handleGet(args.slice(1));
      break;
    case 'set':
      await handleSet(args.slice(1));
      break;
    case 'list':
      await handleList();
      break;
    case 'reset':
      await handleReset();
      break;
    case '--help':
    case '-h':
      showConfigHelp();
      break;
    default:
      throw new Error(`Unknown config command: ${subCommand}`);
  }
}

async function handleGet(args: string[]): Promise<void> {
  const key = args[0];

  if (!key) {
    throw new Error(
      'Key required for get command. Usage: jclaw config get <key>'
    );
  }

  const value = configStore[key];

  if (value === undefined) {
    console.log(`${key} = <not set>`);
  } else {
    console.log(`${key} = ${value}`);
  }
}

async function handleSet(args: string[]): Promise<void> {
  const key = args[0];
  const value = args[1];

  if (!key || value === undefined) {
    throw new Error(
      'Key and value required for set command. Usage: jclaw config set <key> <value>'
    );
  }

  // Parse value type
  let parsedValue: string | number | boolean;
  if (value === 'true') {
    parsedValue = true;
  } else if (value === 'false') {
    parsedValue = false;
  } else if (!isNaN(Number(value))) {
    parsedValue = Number(value);
  } else {
    parsedValue = value;
  }

  configStore[key] = parsedValue;
  console.log(`Set ${key} = ${parsedValue}`);
}

async function handleList(): Promise<void> {
  console.log('Current configuration:');
  console.log('');

  for (const [key, value] of Object.entries(configStore)) {
    console.log(`  ${key} = ${value}`);
  }
}

async function handleReset(): Promise<void> {
  configStore = { ...DEFAULT_CONFIG };
  console.log('Configuration reset to defaults.');
}

export function getConfig(): Record<string, string | number | boolean> {
  return { ...configStore };
}

export function setConfigValue(
  key: string,
  value: string | number | boolean
): void {
  configStore[key] = value;
}

export function showConfigHelp(): void {
  console.log(`
jclaw config - Configuration management

Usage:
  jclaw config <command> [options]

Commands:
  get <key>              Get a configuration value
  set <key> <value>      Set a configuration value
  list                   List all configuration values
  reset                  Reset to default configuration

Examples:
  jclaw config get execution.mode
  jclaw config set execution.mode local
  jclaw config set evolution.enabled true
  jclaw config list
`);
}

export { DEFAULT_CONFIG };
