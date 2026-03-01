/**
 * Evolution Kernel Module
 *
 * Layer 0: Fixed kernel that cannot be evolved
 * Provides safety guarantees for the evolution system
 *
 * @module @jclaw/core/evolution/kernel
 */

export { SandboxIsolator, createSandboxIsolator } from './sandbox-isolator.js';
export type { IsolationResult, IsolationConfig } from './sandbox-isolator.js';

export { EmergencyBrake, createEmergencyBrake } from './emergency-brake.js';
export type { BrakeConfig, BrakeState } from './emergency-brake.js';

export { RollbackManager, createRollbackManager } from './rollback-manager.js';
export type { StateInfo, RollbackOptions } from './rollback-manager.js';
