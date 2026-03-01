/**
 * Evolution Engine Tests
 */

import { EvolutionEngine, createEvolutionEngine } from '../../src/evolution/engine.js';
import { LLMClient } from '../../src/runtime/llm-client.js';
import { LocalExecutor } from '../../src/executor/local.js';

describe('EvolutionEngine', () => {
  let mockLLMClient: LLMClient;
  let mockExecutor: LocalExecutor;

  beforeEach(() => {
    mockLLMClient = new LLMClient({
      apiBase: 'https://api.test.com/v1',
      apiKey: 'test-key',
      model: 'test-model',
    });

    mockExecutor = new LocalExecutor();

    // Mock fetch for LLM calls
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: 'Optimized code' } }],
        model: 'test-model',
      }),
    });
  });

  describe('constructor', () => {
    it('should create engine with config', () => {
      const engine = new EvolutionEngine({
        llmClient: mockLLMClient,
        executor: mockExecutor,
      });

      expect(engine).toBeDefined();
    });

    it('should apply default config', () => {
      const engine = new EvolutionEngine({
        llmClient: mockLLMClient,
        executor: mockExecutor,
      });

      expect(engine).toBeDefined();
    });
  });

  describe('createEvolutionEngine', () => {
    it('should create engine instance', () => {
      const engine = createEvolutionEngine({
        llmClient: mockLLMClient,
        executor: mockExecutor,
      });

      expect(engine).toBeInstanceOf(EvolutionEngine);
    });
  });

  describe('evolve', () => {
    let engine: EvolutionEngine;
    const testCode = 'function test() { return 1; }';

    beforeEach(() => {
      engine = new EvolutionEngine({
        llmClient: mockLLMClient,
        executor: mockExecutor,
        config: {
          enableSandbox: false, // Disable sandbox for unit tests
        },
      });
    });

    it('should run evolution cycle', async () => {
      const result = await engine.evolve(testCode);

      expect(result.mutations).toBeDefined();
      expect(result.duration).toBeGreaterThanOrEqual(0);
    });

    it('should use specified strategies', async () => {
      const result = await engine.evolve(testCode, {
        strategies: ['optimize'],
      });

      expect(result.mutations).toHaveLength(1);
      expect(result.mutations[0]!.strategy).toBe('optimize');
    });

    it('should calculate fitness for mutations', async () => {
      const result = await engine.evolve(testCode, {
        strategies: ['repair'],
      });

      expect(result.mutations[0]!.fitness).toBeDefined();
      expect(result.mutations[0]!.fitness).toBeGreaterThan(0);
    });

    it('should find best mutation', async () => {
      const result = await engine.evolve(testCode, {
        strategies: ['repair', 'optimize'],
      });

      expect(result.bestMutation).toBeDefined();
    });
  });

  describe('evolveWithStrategy', () => {
    let engine: EvolutionEngine;

    beforeEach(() => {
      engine = new EvolutionEngine({
        llmClient: mockLLMClient,
        executor: mockExecutor,
        config: { enableSandbox: false },
      });
    });

    it('should evolve with specific strategy', async () => {
      const result = await engine.evolveWithStrategy(
        'function test() {}',
        'innovate'
      );

      expect(result.mutations).toHaveLength(1);
      expect(result.mutations[0]!.strategy).toBe('innovate');
    });
  });

  describe('toGene', () => {
    let engine: EvolutionEngine;

    beforeEach(() => {
      engine = new EvolutionEngine({
        llmClient: mockLLMClient,
        executor: mockExecutor,
      });
    });

    it('should convert mutation to gene', async () => {
      const result = await engine.evolve('code', {
        strategies: ['repair'],
      });

      const mutation = result.mutations[0];
      expect(mutation).toBeDefined();
      
      if (mutation) {
        const gene = engine.toGene(mutation, 1, ['parent-1']);

        expect(gene.id).toBe(mutation.id);
        expect(gene.type).toBe('behavior');
        expect(gene.content).toBe(mutation.mutated);
        expect(gene.generation).toBe(1);
        expect(gene.parents).toContain('parent-1');
      }
    });
  });
});
