/**
 * JClaw Core
 */

// Core types
export type {
  Task,
  TaskResult,
  ExecuteOptions,
  ExecuteResult,
  Executor,
  ContextManager,
  Capability,
  Extension,
  AgentRuntime,
} from './types.js';

// Executor
export { LocalExecutor, createLocalExecutor } from './executor/local.js';

// Context (使用 SimpleMemory，纯 JavaScript，零依赖)
export {
  SimpleMemoryClient,
  type SimpleMemoryConfig,
  createSimpleMemoryClient,
  MockClient,
} from './context/index.js';

// Extension system
export { ExtensionRegistry } from './extension-system/registry.js';
export { ExtensionLoader } from './extension-system/loader.js';
export { CapabilityRouter } from './extension-system/capability-router.js';

// Runtime
export {
  LLMClient,
  createLLMClient,
  type LLMClientConfig,
  type ChatMessage,
  type LLMResponse,
  TaskExecutor,
  createTaskExecutor,
  type TaskExecutorConfig,
  JClawAgent,
  createAgent,
  type AgentConfig,
} from './runtime/index.js';

// Evolution
export {
  MutationGenerator,
  createMutationGenerator,
  type MutationGeneratorConfig,
  SandboxValidator,
  createSandbox,
  type SandboxConfig,
  EvolutionEngine,
  createEvolutionEngine,
  type EvolutionStrategy,
  type Mutation,
  type ValidationResult,
  type EvolutionConfig,
  type Gene,
  type EvolutionResult,
  EvolverAdapter,
  createEvolverAdapter,
  type EvolverAdapterConfig,
  type EvolverResult,
} from './evolution/index.js';

// AutoSkill (自生成技能系统)
export {
  AutoSkillGenerator,
  createAutoSkillGenerator,
  AutoSkillInstaller,
  createAutoSkillInstaller,
  type AutoSkillConfig,
  type CapabilityGap,
  type DiscoveryResult,
  type GeneratedExtension,
  type GenerationResult,
  type GenerationStep,
  type InstallationResult,
  type SkillUsageStats,
  type AutoSkillMetadata,
  type SkillVersion,
} from './auto-skill/index.js';

// Network
export {
  A2AProtocol,
  GEPProtocol,
  type A2AMessage,
  type A2AMessageType,
  type GEPPacket,
  type NodeInfo,
  type GeneSharePayload,
  type GeneRequestPayload,
  type TaskDelegatePayload,
  EvoMapClient,
  createEvoMapClient,
  type EvoMapConfig,
  type GeneResponse,
} from './network/index.js';
export { fileOperationsExtension } from './extensions/built-in/file-operations.js';

// Planning Module (任务规划)
export {
  Planner,
  createPlanner,
  type Step,
  type StepStatus,
  type Plan,
  type PlannerConfig,
  type PlanAdjustment,
} from './planning/index.js';
