/**
 * Task Executor - Enhanced with Capability Support
 */

import type { Task, TaskResult, ContextManager, Executor } from '../types.js';
import { LLMClient, type ChatMessage } from './llm-client.js';
import { ExtensionRegistry } from '../extension-system/registry.js';

const DEFAULT_SYSTEM_PROMPT = "You are JClaw, a self-evolving AI agent. You help users complete tasks.";

export interface TaskExecutorConfig {
  llmClient: LLMClient;
  contextManager?: ContextManager;
  executor?: Executor;
  extensionRegistry?: ExtensionRegistry;
  systemPrompt?: string;
  maxRetries?: number;
  verbose?: boolean;
}

export class TaskExecutor {
  private readonly config: Required<Omit<TaskExecutorConfig, 'contextManager' | 'executor' | 'extensionRegistry'>> & {
    contextManager?: ContextManager;
    executor?: Executor;
    extensionRegistry?: ExtensionRegistry;
  };

  constructor(config: TaskExecutorConfig) {
    this.config = { systemPrompt: DEFAULT_SYSTEM_PROMPT, maxRetries: 3, verbose: false, ...config };
  }

  async execute(task: Task): Promise<TaskResult> {
    const startTime = Date.now();
    let attempts = 0;
    let lastError: string | undefined;

    while (attempts < this.config.maxRetries) {
      attempts++;
      try {
        const output = await this.executeTask(task);
        return { taskId: task.id, success: true, output, duration: Date.now() - startTime };
      } catch (error) {
        lastError = error instanceof Error ? error.message : 'Unknown error';
        if (attempts < this.config.maxRetries) {
          await this.sleep(1000 * Math.pow(2, attempts - 1));
        }
      }
    }

    return { taskId: task.id, success: false, error: lastError, duration: Date.now() - startTime };
  }

  private async executeTask(task: Task): Promise<string> {
    const messages: ChatMessage[] = [{ role: 'system', content: this.buildSystemPrompt() }];

    if (this.config.contextManager) {
      try {
        const context = await this.config.contextManager.query(task.prompt, { topK: 5 });
        if (context) messages.push({ role: 'system', content: 'Relevant context: ' + context });
      } catch { /* ignore */ }
    }

    messages.push({ role: 'user', content: task.prompt });
    if (task.context) messages.push({ role: 'user', content: 'Additional context: ' + JSON.stringify(task.context) });

    let iterationCount = 0;
    const maxIterations = 5;

    while (iterationCount < maxIterations) {
      iterationCount++;
      const response = await this.config.llmClient.chat(messages);

      const capabilityCall = this.extractCapabilityCall(response.content);
      if (capabilityCall && this.config.extensionRegistry) {
        const registeredCap = this.config.extensionRegistry.getCapability(capabilityCall.name);
        if (registeredCap && registeredCap.capability && registeredCap.capability.handler) {
          try {
            const result = await registeredCap.capability.handler(capabilityCall.input);
            messages.push({ role: 'assistant', content: response.content });
            messages.push({ role: 'system', content: 'Capability result: ' + JSON.stringify(result) });
            continue;
          } catch (error) {
            messages.push({ role: 'assistant', content: response.content });
            messages.push({ role: 'system', content: 'Capability failed: ' + (error as Error).message });
            continue;
          }
        }
      }

      const commands = this.extractCommands(response.content);
      if (commands.length > 0 && this.config.executor) {
        return response.content;
      }

      return response.content;
    }

    const lastResponse = await this.config.llmClient.chat(messages);
    return lastResponse.content;
  }

  private buildSystemPrompt(): string {
    let prompt = this.config.systemPrompt;
    if (this.config.extensionRegistry) {
      const capabilities = this.config.extensionRegistry.getCapabilityNames();
      if (capabilities.length > 0) {
        prompt = prompt + '\n\nAvailable Capabilities:\n' + capabilities.map(function(c) { return '- ' + c; }).join('\n');
        prompt = prompt + '\n\nTo use a capability, respond with:\n```capability\n{\n  "name": "capability_name",\n  "input": {...}\n}\n```';
      }
    }
    return prompt;
  }

  private extractCapabilityCall(content: string): { name: string; input: unknown } | null {
    const match = /```capability\s*\n([\s\S]*?)\n\s*```/.exec(content);
    if (match && match[1]) {
      try {
        const parsed = JSON.parse(match[1].trim());
        if (parsed.name && typeof parsed.name === 'string') {
          return { name: parsed.name, input: parsed.input || {} };
        }
      } catch (e) { /* ignore */ }
    }
    return null;
  }

  private extractCommands(content: string): string[] {
    const commands: string[] = [];
    const regex = /```(?:shell|bash|sh)\n([\s\S]*?)```/g;
    let match;
    while ((match = regex.exec(content)) !== null) {
      const cmd = match[1] && match[1].trim();
      if (cmd && !cmd.startsWith('#')) commands.push(cmd);
    }
    return commands;
  }

  private log(message: string): void {
    if (this.config.verbose) console.log('[TaskExecutor] ' + message);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(function(resolve) { setTimeout(resolve, ms); });
  }
}

export function createTaskExecutor(config: TaskExecutorConfig): TaskExecutor {
  return new TaskExecutor(config);
}
