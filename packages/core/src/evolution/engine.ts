/**
 * Evolution Engine
 *
 * Core engine for managing the evolution process.
 *
 * @module @jclaw/core/evolution/engine
 */

import type { Executor } from '../types.js';
import { LLMClient } from '../runtime/llm-client.js';
import { MutationGenerator } from './mutation.js';
import { SandboxValidator } from './sandbox.js';
import type {
  EvolutionStrategy,
  EvolutionConfig,
  Mutation,
  EvolutionResult,
  Gene,
} from './types.js';

/**
 * Default evolution configuration
 */
const DEFAULT_CONFIG: Required<EvolutionConfig> = {
  maxMutations: 5,
  minFitness: 0.7,
  enableSandbox: true,
  sandboxTimeout: 30000,
  strategies: ['repair', 'optimize', 'innovate'],
};

/**
 * Evolution Engine
 *
 * Manages the evolution cycle for self-improvement.
 *
 * @example
 * ```typescript
 * const engine = new EvolutionEngine({
 *   llmClient,
 *   executor: localExecutor
 * });
 *
 * const result = await engine.evolve(code, {
 *   strategies: ['optimize']
 * });
 *
 * if (result.improved) {
 *   console.log('Best mutation:', result.bestMutation);
 * }
 * ```
 */
export class EvolutionEngine {
  private readonly config: Required<EvolutionConfig>;
  private readonly llmClient: LLMClient;
  private readonly executor: Executor;
  private mutationGenerator: MutationGenerator;
  private sandboxValidator: SandboxValidator;

  /**
   * Create a new evolution engine.
   *
   * @param options - Engine options
   */
  constructor(options: {
    llmClient: LLMClient;
    executor: Executor;
    config?: EvolutionConfig;
  }) {
    this.llmClient = options.llmClient;
    this.executor = options.executor;
    this.config = { ...DEFAULT_CONFIG, ...options.config };

    // Initialize components
    this.mutationGenerator = new MutationGenerator({
      llmClient: this.llmClient,
    });

    this.sandboxValidator = new SandboxValidator({
      executor: this.executor,
      timeout: this.config.sandboxTimeout,
    });
  }

  /**
   * Run an evolution cycle on the given code.
   *
   * @param code - The code to evolve
   * @param options - Optional overrides for this cycle
   * @returns Evolution result
   */
  async evolve(
    code: string,
    options?: Partial<EvolutionConfig>
  ): Promise<EvolutionResult> {
    const startTime = Date.now();
    const strategies = options?.strategies ?? this.config.strategies;

    // Generate mutations
    const mutations = await this.mutationGenerator.generate(code, strategies);
    const validatedMutations: Mutation[] = [];

    // Validate mutations if sandbox is enabled
    if (this.config.enableSandbox) {
      for (const mutation of mutations) {
        const result = await this.sandboxValidator.validate(mutation);
        if (result.passed) {
          mutation.fitness = this.calculateFitness(mutation, result);
          validatedMutations.push(mutation);
        }
      }
    } else {
      // Without sandbox, estimate fitness
      for (const mutation of mutations) {
        mutation.fitness = this.estimateFitness(mutation);
        validatedMutations.push(mutation);
      }
    }

    // Find best mutation
    const bestMutation = this.findBestMutation(validatedMutations);

    return {
      improved: bestMutation !== undefined && (bestMutation.fitness ?? 0) >= this.config.minFitness,
      mutations,
      validatedMutations,
      bestMutation,
      duration: Date.now() - startTime,
    };
  }

  /**
   * Evolve code with a specific strategy.
   *
   * @param code - The code to evolve
   * @param strategy - The evolution strategy to use
   * @returns Evolution result
   */
  async evolveWithStrategy(code: string, strategy: EvolutionStrategy): Promise<EvolutionResult> {
    return this.evolve(code, { strategies: [strategy] });
  }

  /**
   * Convert a mutation to a gene for EvoMap.
   *
   * @param mutation - The mutation to convert
   * @param generation - The generation number
   * @param parents - Parent gene IDs
   * @returns Gene representation
   */
  toGene(mutation: Mutation, generation: number, parents: string[] = []): Gene {
    return {
      id: mutation.id,
      type: 'behavior',
      content: mutation.mutated,
      fitness: mutation.fitness ?? 0,
      generation,
      parents,
      createdAt: mutation.createdAt,
    };
  }

  /**
   * Calculate fitness score based on validation result.
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private calculateFitness(mutation: Mutation, _validationResult: unknown): number {
    // Base fitness on mutation strategy
    const strategyWeights: Record<EvolutionStrategy, number> = {
      repair: 0.8,
      optimize: 0.9,
      innovate: 0.7,
    };

    const baseWeight = strategyWeights[mutation.strategy] ?? 0.7;

    // Factor in code length change (shorter is often better)
    const lengthRatio = mutation.mutated.length / Math.max(mutation.original.length, 1);
    const lengthFactor = lengthRatio < 1 ? 1.1 : Math.max(0.9, 2 - lengthRatio);

    // Combine factors
    return Math.min(1, baseWeight * lengthFactor);
  }

  /**
   * Estimate fitness without sandbox validation.
   */
  private estimateFitness(mutation: Mutation): number {
    // Simple heuristic based on strategy
    const strategyScores: Record<EvolutionStrategy, number> = {
      repair: 0.75,
      optimize: 0.8,
      innovate: 0.65,
    };

    return strategyScores[mutation.strategy] ?? 0.5;
  }

  /**
   * Find the best mutation based on fitness.
   */
  private findBestMutation(mutations: Mutation[]): Mutation | undefined {
    if (mutations.length === 0) {
      return undefined;
    }

    return mutations.reduce((best, current) => {
      const bestFitness = best.fitness ?? 0;
      const currentFitness = current.fitness ?? 0;
      return currentFitness > bestFitness ? current : best;
    });
  }
}

/**
 * Create a new evolution engine.
 *
 * @param options - Engine options
 * @returns New EvolutionEngine instance
 */
export function createEvolutionEngine(options: {
  llmClient: LLMClient;
  executor: Executor;
  config?: EvolutionConfig;
}): EvolutionEngine {
  return new EvolutionEngine(options);
}
