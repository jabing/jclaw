/**
 * Evolution Module
 */

// Core evolution types
export type {
  EvolutionStrategy,
  Mutation,
  ValidationResult,
  EvolutionConfig,
  Gene,
  EvolutionResult,
} from './types.js';

export { MutationGenerator, createMutationGenerator, type MutationGeneratorConfig } from './mutation.js';
export { SandboxValidator, createSandbox, type SandboxConfig } from './sandbox.js';
export { EvolutionEngine, createEvolutionEngine } from './engine.js';
export { EvolverAdapter, createEvolverAdapter, type EvolverAdapterConfig, type EvolverResult } from './evolver-adapter.js';

// Protocol types
export type {
  EvolutionTrigger,
  TriggerConfig,
  ConvergenceConfig,
  EvolutionBudget,
  EvolutionProtocol,
  ProtocolValidationResult,
  ProtocolState,
} from './protocol.js';

export {
  DEFAULT_CONVERGENCE_CONFIG,
  DEFAULT_EVOLUTION_BUDGET,
  DEFAULT_TRIGGER_CONFIGS,
} from './protocol.js';

// Kernel (Layer 0) - Fixed components
export { SandboxIsolator, createSandboxIsolator } from './kernel/index.js';
export type { IsolationResult, IsolationConfig } from './kernel/index.js';

export { EmergencyBrake, createEmergencyBrake } from './kernel/index.js';
export type { BrakeConfig, BrakeState } from './kernel/index.js';

export { RollbackManager, createRollbackManager } from './kernel/index.js';
export type { StateInfo, RollbackOptions } from './kernel/index.js';

// Trigger Engine
export { EvolutionTriggerEngine, createEvolutionTriggerEngine } from './trigger.js';
export type { TriggerResult } from './trigger.js';

// Budget Controller
export { BudgetController, createBudgetController } from './budget.js';
export type { BudgetStatus } from './budget.js';
