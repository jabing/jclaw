/**
 * TaskTrigger - Converts WhatsApp messages into JClaw tasks
 *
 * Extracts task prompts from messages and executes them via JClawAgent.
 * Supports async task execution with timeout handling.
 */

import type { Task, TaskResult, AgentRuntime } from '@jclaw/core';
import type { WhatsAppMessage } from './adapter.js';

/**
 * Configuration options for TaskTrigger
 */
export interface TaskTriggerConfig {
  /** Default timeout for task execution in milliseconds */
  defaultTimeout?: number;
  /** Command prefix to trigger JClaw (e.g., '@jclaw') */
  commandPrefix?: string;
  /** Whether to require the command prefix to trigger tasks */
  requirePrefix?: boolean;
}

/**
 * Result from task trigger execution
 */
export interface TaskTriggerResult {
  /** Whether a task was triggered */
  triggered: boolean;
  /** The task ID if triggered */
  taskId?: string;
  /** The task result if executed */
  result?: TaskResult;
  /** Error message if trigger failed */
  error?: string;
  /** Whether the message contained the command prefix */
  hasPrefix: boolean;
}

/**
 * TaskTrigger converts WhatsApp messages into JClaw tasks
 *
 * Example flow:
 * 1. User sends: "@jclaw check my emails"
 * 2. TaskTrigger extracts: "check my emails"
 * 3. Creates Task: { id, prompt: "check my emails" }
 * 4. Calls JClawAgent.execute(task)
 * 5. Returns result
 */
export class TaskTrigger {
  private agent: AgentRuntime;
  private defaultTimeout: number;
  private commandPrefix: string;
  private requirePrefix: boolean;

  /**
   * Create a new TaskTrigger
   * @param agent - The JClawAgent runtime to execute tasks
   * @param config - Configuration options
   */
  constructor(agent: AgentRuntime, config: TaskTriggerConfig = {}) {
    this.agent = agent;
    this.defaultTimeout = config.defaultTimeout ?? 60000;
    this.commandPrefix = config.commandPrefix ?? '@jclaw';
    this.requirePrefix = config.requirePrefix ?? true;
  }

  /**
   * Extract task prompt from message content
   * Removes the command prefix if present
   *
   * @param content - Raw message content
   * @returns Extracted task prompt or null if no task found
   */
  extractTask(content: string): string | null {
    const trimmed = content.trim();

    // Check if message starts with command prefix (case-insensitive)
    const prefixRegex = new RegExp(
      `^${this.escapeRegex(this.commandPrefix)}\\s*`,
      'i'
    );

    if (prefixRegex.test(trimmed)) {
      // Remove prefix and return the task prompt
      const taskPrompt = trimmed.replace(prefixRegex, '').trim();
      return taskPrompt.length > 0 ? taskPrompt : null;
    }

    // If prefix not required, treat entire message as task
    if (!this.requirePrefix && trimmed.length > 0) {
      return trimmed;
    }

    return null;
  }

  /**
   * Execute a task from a WhatsApp message
   * Extracts the task and executes it via JClawAgent
   *
   * @param message - The WhatsApp message
   * @param timeout - Optional timeout override in milliseconds
   * @returns TaskTriggerResult with execution details
   */
  async executeTask(
    message: WhatsAppMessage,
    timeout?: number
  ): Promise<TaskTriggerResult> {
    const taskPrompt = this.extractTask(message.content);
    const hasPrefix = this.hasCommandPrefix(message.content);

    // No task extracted
    if (!taskPrompt) {
      return {
        triggered: false,
        hasPrefix,
        error: hasPrefix ? 'Empty task prompt' : 'No command prefix found',
      };
    }

    // Generate unique task ID
    const taskId = this.generateTaskId(message);

    // Create task object
    const task: Task = {
      id: taskId,
      prompt: taskPrompt,
      context: {
        source: 'whatsapp',
        messageId: message.id,
        from: message.from,
        senderName: message.senderName,
        groupId: message.groupId,
        timestamp: message.timestamp,
      },
    };

    try {
      // Execute task with timeout
      const result = await this.executeWithTimeout(
        task,
        timeout ?? this.defaultTimeout
      );

      return {
        triggered: true,
        taskId,
        result,
        hasPrefix,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      return {
        triggered: true,
        taskId,
        hasPrefix,
        error: errorMessage,
        result: {
          taskId,
          success: false,
          error: errorMessage,
          duration: 0,
        },
      };
    }
  }

  /**
   * Check if a message contains the command prefix
   *
   * @param content - Message content
   * @returns True if message starts with command prefix
   */
  hasCommandPrefix(content: string): boolean {
    const trimmed = content.trim();
    const prefixRegex = new RegExp(
      `^${this.escapeRegex(this.commandPrefix)}\\s*`,
      'i'
    );
    return prefixRegex.test(trimmed);
  }

  /**
   * Execute task with timeout support
   *
   * @param task - Task to execute
   * @param timeoutMs - Timeout in milliseconds
   * @returns TaskResult from execution
   */
  private async executeWithTimeout(
    task: Task,
    timeoutMs: number
  ): Promise<TaskResult> {
    return new Promise((resolve, reject) => {
      const timeoutTimer = setTimeout(() => {
        reject(new Error(`Task execution timeout after ${timeoutMs}ms`));
      }, timeoutMs);

      this.agent
        .execute(task)
        .then((result) => {
          clearTimeout(timeoutTimer);
          resolve(result);
        })
        .catch((error) => {
          clearTimeout(timeoutTimer);
          reject(error);
        });
    });
  }

  /**
   * Generate a unique task ID from message
   *
   * @param message - WhatsApp message
   * @returns Unique task identifier
   */
  private generateTaskId(message: WhatsAppMessage): string {
    return `task_${message.from}_${message.timestamp}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;
  }

  /**
   * Escape special regex characters in string
   *
   * @param str - String to escape
   * @returns Escaped string safe for regex
   */
  private escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
}

/**
 * Create a TaskTrigger instance
 *
 * @param agent - The JClawAgent runtime
 * @param config - Configuration options
 * @returns TaskTrigger instance
 */
export function createTaskTrigger(
  agent: AgentRuntime,
  config?: TaskTriggerConfig
): TaskTrigger {
  return new TaskTrigger(agent, config);
}
