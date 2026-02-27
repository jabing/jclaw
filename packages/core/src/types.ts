/**
 * JClaw Core Type Interfaces
 *
 * This file contains all core interface definitions for the JClaw agent framework.
 * These interfaces define the contracts between components without implementation.
 *
 * @module @jclaw/core/types
 */

/**
 * Agent 任务
 *
 * Represents a task to be executed by the agent runtime.
 */
export interface Task {
  /** Unique identifier for the task */
  id: string;
  /** The prompt or instruction to execute */
  prompt: string;
  /** Optional context data for task execution */
  context?: Record<string, unknown>;
  /** Optional execution mode override */
  executionMode?: 'local' | 'docker';
}

/**
 * 任务执行结果
 *
 * Represents the result of a task execution.
 */
export interface TaskResult {
  /** ID of the executed task */
  taskId: string;
  /** Whether the task completed successfully */
  success: boolean;
  /** Output from task execution (if successful) */
  output?: string;
  /** Error message (if failed) */
  error?: string;
  /** Execution duration in milliseconds */
  duration: number;
}

/**
 * 执行器选项
 *
 * Configuration options for command execution.
 */
export interface ExecuteOptions {
  /** Execution mode override */
  mode?: 'local' | 'docker';
  /** Timeout in milliseconds */
  timeout?: number;
  /** Working directory for execution */
  cwd?: string;
  /** Environment variables */
  env?: Record<string, string>;
  /** Security restrictions for local execution */
  restrictions?: {
    /** Paths allowed for access */
    allowedPaths?: string[];
    /** Commands that are blocked */
    blockedCommands?: string[];
  };
  /** Container configuration for Docker execution */
  container?: {
    /** Docker image name */
    image?: string;
    /** Memory limit (e.g., "512m") */
    memory?: string;
    /** CPU limit (e.g., "0.5") */
    cpu?: string;
  };
}

/**
 * 执行结果
 *
 * Result of a command execution.
 */
export interface ExecuteResult {
  /** Standard output from the command */
  stdout: string;
  /** Standard error from the command */
  stderr: string;
  /** Exit code of the command */
  exitCode: number;
  /** Execution duration in milliseconds */
  duration: number;
}

/**
 * 执行器接口
 *
 * Interface for command executors supporting different execution modes.
 */
export interface Executor {
  /**
   * Execute a command with the given options
   * @param command - The command to execute
   * @param options - Execution options
   * @returns Promise resolving to execution result
   */
  execute(command: string, options?: ExecuteOptions): Promise<ExecuteResult>;

  /** The execution mode of this executor */
  readonly mode: 'local' | 'docker' | 'hybrid';
}

/**
 * 上下文管理器接口
 *
 * Interface for managing agent context and knowledge.
 */
export interface ContextManager {
  /**
   * Establish connection to the context backend
   */
  connect(): Promise<void>;

  /**
   * Disconnect from the context backend
   */
  disconnect(): Promise<void>;

  /**
   * Query the context for relevant information
   * @param question - The question to query
   * @param options - Query options including topK for result count
   * @returns Relevant context as string
   */
  query(question: string, options?: { topK?: number }): Promise<string>;

  /**
   * Add a resource to the context
   * @param resourcePath - Path to the resource to add
   * @returns Resource identifier
   */
  addResource(resourcePath: string): Promise<string>;
}

/**
 * 能力定义
 *
 * Describes a capability provided by an extension.
 */
export interface Capability {
  /** Name of the capability */
  name: string;
  /** Human-readable description */
  description: string;
  /** JSON Schema for input validation (optional) */
  inputSchema?: Record<string, unknown>;
}

/**
 * 扩展接口
 *
 * Interface that all JClaw extensions must implement.
 */
export interface Extension {
  /** Extension name (unique identifier) */
  name: string;
  /** Semantic version string */
  version: string;
  /** Human-readable description */
  description: string;
  /** Required extension dependencies */
  dependencies?: string[];
  /** Optional extension dependencies */
  optionalDependencies?: string[];
  /** Capabilities provided by this extension */
  capabilities: Capability[];

  /**
   * Install the extension into the runtime
   * @param runtime - The agent runtime instance
   */
  install(runtime: unknown): Promise<void>;

  /**
   * Uninstall and cleanup the extension
   */
  uninstall(): Promise<void>;
}

/**
 * Agent 运行时接口
 *
 * Core interface for the JClaw agent runtime.
 */
export interface AgentRuntime {
  /**
   * Execute a task
   * @param task - The task to execute
   * @returns Promise resolving to task result
   */
  execute(task: Task): Promise<TaskResult>;

  /**
   * Start the agent runtime
   */
  start(): Promise<void>;

  /**
   * Stop the agent runtime
   */
  stop(): Promise<void>;

  /** Context manager instance */
  readonly context: ContextManager;

  /** Current execution mode */
  readonly executionMode: 'local' | 'docker' | 'hybrid';
}
