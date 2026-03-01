/**
 * Mutation Generator
 *
 * Generates code and behavior mutations for evolution.
 *
 * @module @jclaw/core/evolution/mutation
 */

import type { EvolutionStrategy, Mutation } from './types.js';
import { LLMClient, type ChatMessage } from '../runtime/llm-client.js';

/**
 * Configuration for mutation generator
 */
export interface MutationGeneratorConfig {
  /** LLM client for generating mutations */
  llmClient: LLMClient;
  /** Enable verbose logging */
  verbose?: boolean;
}

/**
 * Prompt templates for different strategies
 */
const STRATEGY_PROMPTS: Record<EvolutionStrategy, string> = {
  repair: `You are a code repair specialist. Analyze the code and generate a repaired version that:
1. Fixes any bugs or errors
2. Maintains the original functionality
3. Improves code quality where possible
4. Keeps changes minimal and focused

Return ONLY the repaired code, no explanations.`,
  optimize: `You are a performance optimization specialist. Analyze the code and generate an optimized version that:
1. Improves performance and efficiency
2. Reduces complexity where possible
3. Maintains exact same functionality
4. Uses best practices and patterns

Return ONLY the optimized code, no explanations.`,
  innovate: `You are an innovation specialist. Analyze the code and generate an innovative version that:
1. Introduces new approaches or patterns
2. Explores alternative solutions
3. Adds new capabilities or features
4. Takes calculated risks while maintaining safety

Return ONLY the innovative code, no explanations.`,
};

/**
 * Mutation Generator
 *
 * Uses LLM to generate code mutations based on different strategies.
 *
 * @example
 * ```typescript
 * const generator = new MutationGenerator({ llmClient });
 * const mutations = await generator.generate(originalCode, ['repair', 'optimize']);
 * ```
 */
export class MutationGenerator {
  private readonly config: Required<Omit<MutationGeneratorConfig, 'llmClient'>> & {
    llmClient: LLMClient;
  };

  /**
   * Create a new mutation generator.
   *
   * @param config - Configuration options
   */
  constructor(config: MutationGeneratorConfig) {
    this.config = {
      verbose: false,
      ...config,
    };
  }

  /**
   * Generate mutations for the given code.
   *
   * @param code - The original code to mutate
   * @param strategies - Evolution strategies to use
   * @returns Array of generated mutations
   */
  async generate(code: string, strategies: EvolutionStrategy[]): Promise<Mutation[]> {
    const mutations: Mutation[] = [];

    for (const strategy of strategies) {
      try {
        const mutation = await this.generateSingle(code, strategy);
        mutations.push(mutation);
      } catch (error) {
        this.log(`Failed to generate ${strategy} mutation: ${error}`);
      }
    }

    return mutations;
  }

  /**
   * Generate a single mutation using a specific strategy.
   */
  private async generateSingle(code: string, strategy: EvolutionStrategy): Promise<Mutation> {
    const messages: ChatMessage[] = [
      { role: 'system', content: STRATEGY_PROMPTS[strategy] },
      { role: 'user', content: code },
    ];

    const response = await this.config.llmClient.chat(messages);
    const mutated = response.content;

    // Generate mutation description
    const description = await this.generateDescription(code, mutated, strategy);

    return {
      id: `mutation-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      strategy,
      original: code,
      mutated,
      description,
      createdAt: new Date(),
    };
  }

  /**
   * Generate a description for the mutation.
   */
  private async generateDescription(
    original: string,
    mutated: string,
    strategy: EvolutionStrategy
  ): Promise<string> {
    const messages: ChatMessage[] = [
      {
        role: 'system',
        content: 'You are a technical writer. Describe the changes between two code snippets in one concise sentence.',
      },
      {
        role: 'user',
        content: `Original:\n\`\`\`\n${original}\n\`\`\`\n\nMutated (${strategy}):\n\`\`\`\n${mutated}\n\`\`\`\n\nDescribe the changes:`,
      },
    ];

    try {
      const response = await this.config.llmClient.chat(messages);
      return response.content.trim();
    } catch {
      return `${strategy} mutation applied`;
    }
  }

  /**
   * Log message if verbose mode is enabled.
   */
  private log(message: string): void {
    if (this.config.verbose) {
      console.log(`[MutationGenerator] ${message}`);
    }
  }
}

/**
 * Create a new mutation generator.
 *
 * @param config - Configuration options
 * @returns New MutationGenerator instance
 */
export function createMutationGenerator(config: MutationGeneratorConfig): MutationGenerator {
  return new MutationGenerator(config);
}
