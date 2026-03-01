/**
 * Evolution Types
 *
 * Type definitions for the evolution engine.
 *
 * @module @jclaw/core/evolution/types
 */

/**
 * Evolution strategy types
 */
export type EvolutionStrategy = 'repair' | 'optimize' | 'innovate';

/**
 * Represents a mutation in the evolution process
 */
export interface Mutation {
  /** Unique identifier for the mutation */
  id: string;
  /** The strategy used to generate this mutation */
  strategy: EvolutionStrategy;
  /** Original code or behavior */
  original: string;
  /** Mutated code or behavior */
  mutated: string;
  /** Description of the change */
  description: string;
  /** Timestamp when mutation was created */
  createdAt: Date;
  /** Fitness score (if evaluated) */
  fitness?: number;
}

/**
 * Result of mutation validation in sandbox
 */
export interface ValidationResult {
  /** Whether the mutation passed validation */
  passed: boolean;
  /** Error messages if validation failed */
  errors: string[];
  /** Output from validation tests */
  output?: string;
  /** Duration of validation in milliseconds */
  duration: number;
}

/**
 * Configuration for evolution engine
 */
export interface EvolutionConfig {
  /** Maximum mutations per evolution cycle */
  maxMutations?: number;
  /** Minimum fitness threshold for accepting mutations */
  minFitness?: number;
  /** Enable sandbox validation */
  enableSandbox?: boolean;
  /** Timeout for sandbox validation in milliseconds */
  sandboxTimeout?: number;
  /** Strategies to use for evolution */
  strategies?: EvolutionStrategy[];
}

/**
 * Gene representation for EvoMap integration
 */
export interface Gene {
  /** Unique gene identifier */
  id: string;
  /** Gene type (behavior, knowledge, skill) */
  type: 'behavior' | 'knowledge' | 'skill';
  /** Gene content/code */
  content: string;
  /** Fitness score */
  fitness: number;
  /** Generation number */
  generation: number;
  /** Parent gene IDs */
  parents: string[];
  /** Creation timestamp */
  createdAt: Date;
}

/**
 * Evolution cycle result
 */
export interface EvolutionResult {
  /** Whether evolution produced any improvements */
  improved: boolean;
  /** Mutations generated in this cycle */
  mutations: Mutation[];
  /** Mutations that passed validation */
  validatedMutations: Mutation[];
  /** Best mutation (if any) */
  bestMutation?: Mutation;
  /** Duration of the evolution cycle */
  duration: number;
}
