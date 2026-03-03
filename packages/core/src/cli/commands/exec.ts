/**
 * jclaw exec command - Execute a task with the given prompt
 *
 * This command executes tasks via JClawAgent with support for:
 * - Local and Docker execution modes
 * - Configuration file loading (jclaw.yaml)
 * - Proper error handling and user feedback
 */

import * as fs from 'fs';
import * as path from 'path';
import { createAgent } from '../../runtime/agent.js';
import { createSimpleMemoryClient } from '../../context/simple-memory-client.js';
import type { Task, TaskResult } from '../../types.js';
import { getConfig } from './config.js';

export interface ExecOptions {
  prompt: string;
  mode?: 'local' | 'docker' | 'hybrid';
  configPath?: string;
  verbose?: boolean;
}

export interface JClawConfig {
  execution?: {
    mode?: 'local' | 'docker' | 'hybrid';
    timeout?: number;
  };
  local?: {
    restrictions?: {
      allowedPaths?: string[];
      blockedCommands?: string[];
    };
  };
  docker?: {
    image?: string;
    memory?: string;
    cpu?: string;
  };
  extensions?: Record<string, unknown>;
  evolution?: {
    enabled?: boolean;
    strategies?: string[];
    sandboxTimeout?: number;
  };
  llm?: {
    apiBase?: string;
    apiKey?: string;
    model?: string;
  };
}

/**
 * Parse command line arguments for exec command
 */
function parseArgs(args: string[]): {
  options: ExecOptions;
  remainingArgs: string[];
} {
  const options: ExecOptions = {
    prompt: '',
  };
  const remainingArgs: string[] = [];

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (!arg) continue;

    if (arg === '--mode' || arg === '-m') {
      const mode = args[++i];
      if (mode && ['local', 'docker', 'hybrid'].includes(mode)) {
        options.mode = mode as 'local' | 'docker' | 'hybrid';
      } else {
        throw new Error(
          `Invalid mode: ${mode}. Must be one of: local, docker, hybrid`
        );
      }
    } else if (arg === '--config' || arg === '-c') {
      options.configPath = args[++i];
    } else if (arg === '--verbose' || arg === '-V') {
      options.verbose = true;
    } else if (arg === '--help' || arg === '-h') {
      showExecHelp();
      process.exit(0);
    } else if (!arg.startsWith('-')) {
      remainingArgs.push(arg);
    } else {
      throw new Error(`Unknown option: ${arg}`);
    }
  }

  // Join remaining args as the prompt
  options.prompt = remainingArgs.join(' ');

  return { options, remainingArgs };
}

/**
 * Find configuration file by searching up directory tree
 */
function findConfigFile(startDir: string, configName: string): string | null {
  let currentDir = startDir;

  while (currentDir !== path.dirname(currentDir)) {
    const configPath = path.join(currentDir, configName);
    if (fs.existsSync(configPath)) {
      return configPath;
    }
    currentDir = path.dirname(currentDir);
  }

  return null;
}

/**
 * Load configuration from YAML file
 */
function loadConfigFile(configPath: string): JClawConfig {
  try {
    const content = fs.readFileSync(configPath, 'utf-8');
    // Simple YAML parsing for key: value pairs
    const config: JClawConfig = {};
    let currentSection: string | null = null;
    let sectionObj: Record<string, unknown> = {};

    const lines = content.split('\n');
    for (const line of lines) {
      const trimmed = line.trim();

      // Skip comments and empty lines
      if (!trimmed || trimmed.startsWith('#')) continue;

      // Section header (e.g., "execution:")
      const sectionMatch = trimmed.match(/^(\w+):\s*$/);
      if (sectionMatch) {
        if (currentSection && Object.keys(sectionObj).length > 0) {
          (config as Record<string, unknown>)[currentSection] = sectionObj;
        }
        const matchedSection = sectionMatch[1];
        if (matchedSection) {
          currentSection = matchedSection;
        }
        sectionObj = {};
        continue;
      }

      // Nested property (e.g., "  mode: local")
      const propMatch = trimmed.match(/^(\s+)(\w+):\s*(.+)$/);
      if (propMatch && currentSection) {
        const indent = propMatch[1];
        const key = propMatch[2];
        const value = propMatch[3];

        if (!key || !value) continue;

        const trimmedValue = value.trim();

        // Try to parse as number or boolean
        let parsedValue: string | number | boolean = trimmedValue;
        if (trimmedValue === 'true') parsedValue = true;
        else if (trimmedValue === 'false') parsedValue = false;
        else if (!isNaN(Number(trimmedValue)))
          parsedValue = Number(trimmedValue);

        // Handle nested objects (second level)
        if (indent && indent.length >= 4) {
          // This is a nested property, we need to handle it differently
          // For simplicity, we'll flatten it for now
          const parentKey = Object.keys(sectionObj).pop();
          if (parentKey && typeof sectionObj[parentKey] === 'object') {
            (sectionObj[parentKey] as Record<string, unknown>)[key] =
              parsedValue;
          } else {
            sectionObj[key] = parsedValue;
          }
        } else {
          sectionObj[key] = parsedValue;
        }
      }
    }

    // Don't forget the last section
    if (currentSection && Object.keys(sectionObj).length > 0) {
      (config as Record<string, unknown>)[currentSection] = sectionObj;
    }

    return config;
  } catch (error) {
    throw new Error(
      `Failed to load config file: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Get configuration from file or defaults
 */
function getConfiguration(options: ExecOptions): JClawConfig {
  // Start with CLI config
  const cliConfig = getConfig();

  // Try to load from file
  let fileConfig: JClawConfig = {};
  if (options.configPath) {
    if (!fs.existsSync(options.configPath)) {
      throw new Error(`Config file not found: ${options.configPath}`);
    }
    fileConfig = loadConfigFile(options.configPath);
  } else {
    // Search for jclaw.yaml in current directory and up
    const cwd = process.cwd();
    const configPath = findConfigFile(cwd, 'jclaw.yaml');
    if (configPath) {
      fileConfig = loadConfigFile(configPath);
      if (options.verbose) {
        console.log(`[verbose] Loaded config from: ${configPath}`);
      }
    }
  }

  // Merge configurations (CLI options override file config)
  return {
    ...fileConfig,
    execution: {
      mode:
        options.mode ||
        fileConfig.execution?.mode ||
        (cliConfig['execution.mode'] as 'local' | 'docker' | 'hybrid') ||
        'local',
      timeout:
        fileConfig.execution?.timeout ||
        (cliConfig['execution.timeout'] as number) ||
        300000,
    },
  };
}

/**
 * Execute a task using JClawAgent
 */
export async function execCommand(args: string[]): Promise<void> {
  if (args.length === 0) {
    throw new Error('No prompt provided. Usage: jclaw exec <prompt>');
  }

  // Parse arguments
  const { options } = parseArgs(args);

  if (!options.prompt.trim()) {
    throw new Error('No prompt provided. Usage: jclaw exec <prompt>');
  }

  if (options.verbose) {
    console.log('[verbose] Executing task...');
    console.log(`[verbose] Prompt: ${options.prompt}`);
    console.log(`[verbose] Mode: ${options.mode || 'auto'}`);
  }

  console.log(`Executing: ${options.prompt}`);

  // Load configuration
  const config = getConfiguration(options);
  const executionMode = options.mode || config.execution?.mode || 'local';

  if (options.verbose) {
    console.log(`[verbose] Using execution mode: ${executionMode}`);
  }

  // Create context manager (using SimpleMemory)
  const contextManager = createSimpleMemoryClient({
    enableSynonyms: true,
    enableFuzzyMatch: true,
  });

  // Create agent
  const agent = createAgent({
    name: 'jclaw-cli',
    version: '0.1.0',
    executionMode: executionMode,
    verbose: options.verbose,
    contextManager,
    // Note: LLM config would come from environment or config file
    llm: config.llm?.apiKey
      ? {
          apiBase: config.llm.apiBase || 'https://api.openai.com/v1',
          apiKey: config.llm.apiKey,
          model: config.llm.model || 'gpt-4',
        }
      : undefined,
    enableAutoSkill: config.evolution?.enabled || false,
  });

  let result: TaskResult;

  try {
    // Start the agent
    await agent.start();

    // Create and execute task - executionMode only supports 'local' | 'docker' in Task type
    const taskMode: 'local' | 'docker' =
      executionMode === 'hybrid' ? 'local' : executionMode;
    const task: Task = {
      id: `exec-${Date.now()}`,
      prompt: options.prompt,
      executionMode: taskMode,
    };

    if (options.verbose) {
      console.log(`[verbose] Task ID: ${task.id}`);
      console.log('[verbose] Starting execution...');
    }

    result = await agent.execute(task);

    // Output results
    if (options.verbose) {
      console.log('[verbose] Execution completed');
      console.log(`[verbose] Success: ${result.success}`);
      console.log(`[verbose] Duration: ${result.duration}ms`);
    }

    // Print stdout if available
    if (result.output) {
      console.log(result.output);
    }

    // Print stderr if available and verbose mode
    if (result.error) {
      if (options.verbose || !result.success) {
        console.error(`Error: ${result.error}`);
      }
    }

    // Exit with appropriate code
    if (!result.success) {
      process.exitCode = 1;
    }
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    console.error(`Execution failed: ${errorMessage}`);

    if (options.verbose) {
      console.error(error);
    }

    process.exitCode = 1;
    throw error;
  } finally {
    // Always stop the agent
    try {
      await agent.stop();
    } catch (stopError) {
      if (options.verbose) {
        console.error('[verbose] Error stopping agent:', stopError);
      }
    }
  }
}

export function showExecHelp(): void {
  console.log(`
jclaw exec - Execute a task with the given prompt

Usage:
  jclaw exec <prompt> [options]

Options:
  --mode, -m       Execution mode: local, docker, or hybrid (default: local)
  --config, -c     Path to configuration file (default: jclaw.yaml)
  --verbose, -V    Show detailed execution info
  --help, -h       Show this help message

Examples:
  jclaw exec "echo hello"
  jclaw exec --mode docker "node --version"
  jclaw exec --config ./custom.yaml "task prompt"
  jclaw exec "Analyze this project structure" --verbose
`);
}
