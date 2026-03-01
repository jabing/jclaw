/**
 * Evolution Protocol Types
 *
 * Defines the fixed kernel protocol (Layer 0) that cannot be evolved,
 * along with triggers, budget controls, and convergence conditions.
 *
 * @module @jclaw/core/evolution/protocol
 */

/**
 * Types of events that can trigger evolution
 * - failure: Evolution triggered by system failure or error
 * - degradation: Evolution triggered by performance degradation
 * - periodic: Evolution triggered on a scheduled interval
 */
export type EvolutionTrigger = 'failure' | 'degradation' | 'periodic';

/**
 * Configuration for evolution triggers
 * Defines when and how evolution should be initiated
 */
export interface TriggerConfig {
  /** Type of trigger that initiates evolution */
  type: EvolutionTrigger;

  /** Threshold for triggering (e.g., error count, performance drop percentage) */
  threshold?: number;

  /** Time interval for periodic triggers (in milliseconds) */
  interval?: number;

  /** Minimum time between trigger activations (cooldown in milliseconds) */
  cooldown?: number;

  /** Whether this trigger is enabled */
  enabled: boolean;

  /** Additional trigger-specific configuration */
  metadata?: Record<string, unknown>;
}

/**
 * Configuration for convergence detection
 * Determines when evolution should stop due to plateau
 */
export interface ConvergenceConfig {
  /** Minimum improvement threshold to continue evolution (0.0 to 1.0) */
  improvementThreshold: number;

  /** Number of consecutive cycles below threshold before convergence */
  patienceCycles: number;

  /** Maximum fitness score to consider as converged (optional) */
  targetFitness?: number;

  /** Minimum fitness improvement to reset patience counter */
  minImprovementDelta?: number;

  /** Whether to use rolling average for improvement calculation */
  useRollingAverage?: boolean;

  /** Window size for rolling average (number of cycles) */
  rollingWindowSize?: number;
}

/**
 * Budget controls for evolution
 * Prevents over-evolution and resource exhaustion
 */
export interface EvolutionBudget {
  /** Maximum number of evolution cycles per day */
  dailyQuota: number;

  /** Minimum time between evolution cycles (in milliseconds) */
  cooldownPeriod: number;

  /** Maximum mutations per single evolution cycle */
  maxMutationsPerCycle: number;

  /** Maximum total compute time per day (in milliseconds) */
  maxComputeTimePerDay?: number;

  /** Convergence configuration */
  convergence: ConvergenceConfig;

  /** Current usage tracking */
  usage?: {
    /** Cycles used today */
    cyclesToday: number;
    /** Last evolution timestamp */
    lastEvolution: Date | null;
    /** Total compute time used today (ms) */
    computeTimeToday: number;
  };
}

/**
 * Fixed kernel protocol (Layer 0)
 * Defines the immutable core that cannot be evolved
 */
export interface EvolutionProtocol {
  /** Protocol version for compatibility checking */
  version: string;

  /** Protocol identifier */
  id: string;

  /** Human-readable protocol name */
  name: string;

  /** Protocol description */
  description?: string;

  /** List of protected kernel components that cannot be modified */
  protectedComponents: string[];

  /** Trigger configurations */
  triggers: TriggerConfig[];

  /** Budget configuration */
  budget: EvolutionBudget;

  /** Protocol creation timestamp */
  createdAt: Date;

  /** Last protocol update timestamp */
  updatedAt: Date;

  /** Whether the protocol is currently active */
  active: boolean;

  /** Protocol metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Protocol validation result
 */
export interface ProtocolValidationResult {
  /** Whether the protocol is valid */
  valid: boolean;

  /** Validation errors if invalid */
  errors: string[];

  /** Validation warnings */
  warnings: string[];
}

/**
 * Protocol state for tracking evolution progress
 */
export interface ProtocolState {
  /** Associated protocol ID */
  protocolId: string;

  /** Current evolution generation */
  generation: number;

  /** Total mutations applied */
  totalMutations: number;

  /** Current best fitness score */
  currentFitness: number;

  /** Fitness history for convergence detection */
  fitnessHistory: number[];

  /** Consecutive cycles below improvement threshold */
  cyclesBelowThreshold: number;

  /** Whether convergence has been reached */
  converged: boolean;

  /** Last state update timestamp */
  lastUpdated: Date;
}

/**
 * Default convergence configuration
 */
export const DEFAULT_CONVERGENCE_CONFIG: ConvergenceConfig = {
  improvementThreshold: 0.01,
  patienceCycles: 5,
  minImprovementDelta: 0.005,
  useRollingAverage: true,
  rollingWindowSize: 10,
};

/**
 * Default evolution budget
 */
export const DEFAULT_EVOLUTION_BUDGET: Omit<EvolutionBudget, 'usage'> = {
  dailyQuota: 100,
  cooldownPeriod: 60000, // 1 minute
  maxMutationsPerCycle: 10,
  convergence: DEFAULT_CONVERGENCE_CONFIG,
};

/**
 * Default trigger configurations
 */
export const DEFAULT_TRIGGER_CONFIGS: TriggerConfig[] = [
  {
    type: 'failure',
    threshold: 3,
    cooldown: 300000, // 5 minutes
    enabled: true,
  },
  {
    type: 'degradation',
    threshold: 0.2, // 20% performance drop
    cooldown: 600000, // 10 minutes
    enabled: true,
  },
  {
    type: 'periodic',
    interval: 3600000, // 1 hour
    enabled: false,
  },
];
