/**
 * Mutation Generator Tests
 */

import { MutationGenerator, createMutationGenerator } from '../../src/evolution/mutation.js';
import { LLMClient } from '../../src/runtime/llm-client.js';

describe('MutationGenerator', () => {
  let mockLLMClient: LLMClient;
  let generator: MutationGenerator;

  beforeEach(() => {
    mockLLMClient = new LLMClient({
      apiBase: 'https://api.test.com/v1',
      apiKey: 'test-key',
      model: 'test-model',
    });

    // Mock fetch for LLM calls
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: 'Mutated code here' } }],
        model: 'test-model',
      }),
    });

    generator = new MutationGenerator({ llmClient: mockLLMClient });
  });

  describe('constructor', () => {
    it('should create generator with config', () => {
      expect(generator).toBeDefined();
    });
  });

  describe('createMutationGenerator', () => {
    it('should create generator instance', () => {
      const gen = createMutationGenerator({ llmClient: mockLLMClient });
      expect(gen).toBeInstanceOf(MutationGenerator);
    });
  });

  describe('generate', () => {
    const testCode = `
function add(a, b) {
  return a + b;
}
`;

    it('should generate mutations for all strategies', async () => {
      const mutations = await generator.generate(testCode, [
        'repair',
        'optimize',
        'innovate',
      ]);

      expect(mutations).toHaveLength(3);
      expect(mutations[0]!.strategy).toBe('repair');
      expect(mutations[1]!.strategy).toBe('optimize');
      expect(mutations[2]!.strategy).toBe('innovate');
    });

    it('should include original code in mutation', async () => {
      const mutations = await generator.generate(testCode, ['repair']);

      expect(mutations[0]!.original).toBe(testCode);
    });

    it('should set mutation id and timestamp', async () => {
      const mutations = await generator.generate(testCode, ['repair']);

      expect(mutations[0]!.id).toMatch(/^mutation-/);
      expect(mutations[0]!.createdAt).toBeInstanceOf(Date);
    });

    it('should handle LLM errors gracefully', async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error('LLM error'));

      const mutations = await generator.generate(testCode, ['repair']);

      // Should return empty array on error
      expect(mutations).toHaveLength(0);
    });
  });
});
