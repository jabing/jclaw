import type { AgentRuntime, Task, TaskResult, ContextManager } from '../types.js';
import { TaskExecutor } from './task-executor.js';
import { LLMClient, type LLMClientConfig } from './llm-client.js';
import { ExtensionRegistry } from '../extension-system/registry.js';
import { EvolutionEngine } from '../evolution/engine.js';
import { AutoSkillGenerator, createAutoSkillGenerator } from '../auto-skill/generator.js';
import { AutoSkillInstaller, createAutoSkillInstaller } from '../auto-skill/installer.js';
import { SkillDiscoveryEngine, createSkillDiscoveryEngine } from '../skill-sh/discovery.js';
import { createSkillShAdapter } from '../skill-sh/adapter.js';
import { createSkillConverter } from '../skill-sh/converter.js';
import type { AutoSkillConfig, SkillShAdapterConfig } from '../auto-skill/types.js';
import { fileOperationsExtension } from '../extensions/built-in/file-operations.js';
import { Planner, createPlanner } from '../planning/index.js';

export interface AgentConfig {
  name?: string;
  version?: string;
  executionMode?: 'local' | 'docker' | 'hybrid';
  llm?: LLMClientConfig;
  contextManager?: ContextManager;
  systemPrompt?: string;
  verbose?: boolean;
  enableAutoSkill?: boolean;
  enablePlanning?: boolean;
  autoSkillConfig?: Partial<AutoSkillConfig>;
  skillShConfig?: Partial<SkillShAdapterConfig>;
  extensionRegistry?: ExtensionRegistry;
}

export class JClawAgent implements AgentRuntime {
  readonly executionMode: 'local' | 'docker' | 'hybrid';
  private readonly config: AgentConfig;
  private llmClient?: LLMClient;
  private taskExecutor?: TaskExecutor;
  private planner?: Planner;
  private running = false;
  private autoSkillGenerator?: AutoSkillGenerator;
  private autoSkillInstaller?: AutoSkillInstaller;
  private skillDiscovery?: SkillDiscoveryEngine;
  private evolutionEngine?: EvolutionEngine;
  private extensionRegistry?: ExtensionRegistry;

  constructor(config: AgentConfig = {}) {
    this.config = {
      name: 'jclaw-agent',
      version: '0.1.0',
      executionMode: 'local',
      systemPrompt: 'You are JClaw, a self-evolving AI agent.',
      verbose: false,
      enableAutoSkill: false,
      enablePlanning: true,
      ...config,
    };
    this.executionMode = config.executionMode ?? 'local';
  }

  get name(): string {
    return this.config.name!;
  }

  get version(): string {
    return this.config.version!;
  }

  isRunning(): boolean {
    return this.running;
  }

  get context(): ContextManager {
    if (!this.config.contextManager) throw new Error('Context manager not configured');
    return this.config.contextManager;
  }

  async start(): Promise<void> {
    if (this.running) return;
    if (!this.config.llm) throw new Error('LLM configuration is required');
    console.log("Starting " + this.config.name + " v" + this.config.version + "...");
    if (this.config.contextManager) await this.config.contextManager.connect();
    if (this.config.llm) {
      this.llmClient = new LLMClient(this.config.llm);
      console.log("LLM client initialized");
    }

    this.extensionRegistry = this.config.extensionRegistry ?? new ExtensionRegistry();

    try {
      this.extensionRegistry!.register(fileOperationsExtension);
      console.log("Built-in file operations registered");
    } catch (error) {
      console.warn("Failed to register file operations:", error);
    }

    if (this.llmClient) {
      this.planner = createPlanner(this.llmClient, { verbose: this.config.verbose });
      console.log("Planner initialized");
    }

    this.taskExecutor = new TaskExecutor({
      llmClient: this.llmClient!,
      contextManager: this.config.contextManager,
      extensionRegistry: this.extensionRegistry,
      verbose: this.config.verbose,
    });

    if (this.config.enableAutoSkill) {
      console.log("AutoSkill enabled - initializing...");
      this.evolutionEngine = new EvolutionEngine({ llmClient: this.llmClient!, executor: { mode: 'local', execute: async () => ({ stdout: '', stderr: '', exitCode: 0, duration: 0 }) }, config: { maxMutations: 10, minFitness: 0.5 } });
      const skillShAdapter = createSkillShAdapter(this.llmClient!, this.config.skillShConfig);
      const skillConverter = createSkillConverter(this.llmClient!);
      this.autoSkillGenerator = createAutoSkillGenerator(this.llmClient!, this.extensionRegistry, this.evolutionEngine, this.config.autoSkillConfig);
      this.autoSkillInstaller = createAutoSkillInstaller(this.extensionRegistry, this.config.autoSkillConfig?.storageDir);
      this.skillDiscovery = createSkillDiscoveryEngine(this.llmClient!, this.extensionRegistry, skillShAdapter, skillConverter, this.autoSkillGenerator);
      console.log("AutoSkill components initialized");
    }

    this.running = true;
    console.log("Agent started");
  }

  async stop(): Promise<void> {
    if (!this.running) return;
    console.log("Stopping agent...");
    if (this.config.contextManager) await this.config.contextManager.disconnect();
    this.running = false;
    console.log("Agent stopped");
  }

  async execute(task: Task): Promise<TaskResult> {
    if (!this.running) throw new Error('Agent not started. Call start() first.');
    if (!this.taskExecutor) throw new Error('Task executor not initialized');
    if (this.config.verbose) console.log("Executing task: " + task.prompt);

    // Step 2: Retrieve relevant experiences
    let relevantExperiences = '';
    if (this.config.contextManager) {
      try {
        relevantExperiences = await this.config.contextManager.query(task.prompt, { topK: 3 });
        if (relevantExperiences && this.config.verbose) {
          console.log("Retrieved relevant experiences");
        }
      } catch (error) {
        if (this.config.verbose) console.log("Failed to retrieve experiences");
      }
    }

    // Execute task
    let result: TaskResult;
    if (this.config.enableAutoSkill) {
      result = await this.executeWithAutoSkill(task);
    } else {
      result = await this.taskExecutor.execute(task);
    }

    // Step 8: Store experience (only if successful)
    if (result.success && this.config.contextManager) {
      await this.storeExperience(task, result);
    }

    return result;
  }

  private async executeWithAutoSkill(task: Task): Promise<TaskResult> {
    if (!this.taskExecutor) throw new Error('Task executor not initialized');
    const maxAttempts = this.config.autoSkillConfig?.maxGenerationAttempts || 3;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        console.log("Attempt " + attempt + "/" + maxAttempts);
        const result = await this.taskExecutor.execute(task);
        if (result.success) {
          console.log("Task completed successfully");
          return result;
        }
        console.log("Task failed: " + result.error);
        if (!this.skillDiscovery || !this.autoSkillInstaller) {
          console.log("AutoSkill components not available");
          return result;
        }
        console.log("Analyzing missing capabilities...");
        const discovery = await this.skillDiscovery.discover(task.prompt);
        if (discovery.recommended && discovery.confidence > 0.5) {
          console.log("Found skill: " + discovery.recommended.name);
          console.log("Source: " + discovery.source);
          console.log("Confidence: " + (discovery.confidence * 100).toFixed(0) + "%");
          console.log("Installing skill...");
          const installed = await this.skillDiscovery.installSkill(discovery.recommended);
          if (installed) {
            console.log("Skill installed successfully");
            console.log("Retrying task with new capability...");
            continue;
          }
        }
        if (attempt >= maxAttempts) {
          return { taskId: task.id, success: false, output: '', error: "Task failed after " + maxAttempts + " attempts. Last error: " + result.error, duration: 0 };
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.log("Attempt " + attempt + " failed: " + errorMessage);
        if (attempt >= maxAttempts) {
          return { taskId: task.id, success: false, output: '', error: "Task failed after " + maxAttempts + " attempts. Last error: " + errorMessage, duration: 0 };
        }
      }
    }
    return { taskId: task.id, success: false, output: '', error: "Task failed after " + maxAttempts + " attempts", duration: 0 };
  }

  private async storeExperience(task: Task, result: TaskResult): Promise<void> {
    if (!this.config.contextManager) return;

    try {
      const title = "Experience: " + task.prompt.slice(0, 50);
      const content = "## Task\n" + task.prompt + "\n\n## Result\n" + (result.output || "") + "\n\n## Tags\n#experience";
      await this.config.contextManager.saveMemory?.(content, title);
      if (this.config.verbose) {
        console.log("Experience stored successfully");
      }
    } catch (error) {
      if (this.config.verbose) {
        console.log("Failed to store experience");
      }
    }
  }
}

export function createAgent(config?: AgentConfig): JClawAgent {
  return new JClawAgent(config);
}
