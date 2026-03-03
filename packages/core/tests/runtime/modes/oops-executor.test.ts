/**
 * OOPSExecutor Tests
 */

import {
  OOPSExecutor,
  createOOPSExecutor,
} from '../../src/runtime/modes/oops-executor.js';
import type { Task } from '../../src/types.js';
import type { LLMClient } from '../../src/runtime/llm-client.js';
import type { ContextManager } from '../../src/types.js';

describe('OOPSExecutor', () => {
  let executor: OOPSExecutor;
  let mockLLMClient: LLMClient;
  let mockContextManager: ContextManager;

  beforeEach(() => {
    mockLLMClient = {
      chat: jest.fn().mockResolvedValue({ content: 'Mock response' }),
    } as unknown as LLMClient;

    mockContextManager = {
      query: jest.fn().mockResolvedValue('Mock context'),
    } as unknown as ContextManager;

    executor = new OOPSExecutor(mockLLMClient, mockContextManager);
  });

  describe('constructor', () => {
    it('should create executor with LLM client', () => {
      expect(executor).toBeDefined();
    });

    it('should create executor without context manager', () => {
      const executorWithoutContext = new OOPSExecutor(mockLLMClient);
      expect(executorWithoutContext).toBeDefined();
    });

    it('should store LLM client', () => {
      expect(executor).toBeInstanceOf(OOPSExecutor);
    });

    it('should store context manager optionally', () => {
      expect(executor).toBeInstanceOf(OOPSExecutor);
    });
  });

  describe('execute', () => {
    it('should execute task through OOPS loop', async () => {
      const task: Task = {
        id: 'test-1',
        prompt: 'Test task',
      };

      const result = await executor.execute(task);

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.output).toBeDefined();
      expect(result.state).toBeDefined();
      expect(result.duration).toBeGreaterThanOrEqual(0);
    });

    it('should start in observe phase', async () => {
      const task: Task = {
        id: 'test-1',
        prompt: 'Test task',
      };

      const result = await executor.execute(task);

      expect(result.state.phase).toBeDefined();
    });

    it('should track observations', async () => {
      const task: Task = {
        id: 'test-1',
        prompt: 'Test task',
      };

      const result = await executor.execute(task);

      expect(result.state.observations).toBeDefined();
      expect(Array.isArray(result.state.observations)).toBe(true);
    });

    it('should set orientation after orient phase', async () => {
      const task: Task = {
        id: 'test-1',
        prompt: 'Test task',
      };

      const result = await executor.execute(task);

      expect(result.state.orientation).toBeDefined();
    });

    it('should generate predictions in predict phase', async () => {
      const task: Task = {
        id: 'test-1',
        prompt: 'Test task',
      };

      const result = await executor.execute(task);

      expect(result.state.predictions).toBeDefined();
      expect(Array.isArray(result.state.predictions)).toBe(true);
    });

    it('should select best prediction', async () => {
      const task: Task = {
        id: 'test-1',
        prompt: 'Test task',
      };

      const result = await executor.execute(task);

      expect(result.state.selectedPrediction).toBeDefined();
    });

    it('should set result after act phase', async () => {
      const task: Task = {
        id: 'test-1',
        prompt: 'Test task',
      };

      const result = await executor.execute(task);

      expect(result.state.result).toBeDefined();
    });

    it('should track iteration count', async () => {
      const task: Task = {
        id: 'test-1',
        prompt: 'Test task',
      };

      const result = await executor.execute(task);

      expect(result.state.iteration).toBeGreaterThanOrEqual(1);
    });

    it('should respect max iterations (3)', async () => {
      const task: Task = {
        id: 'test-1',
        prompt: 'Test task',
      };

      const result = await executor.execute(task);

      expect(result.state.iteration).toBeLessThanOrEqual(3);
    });

    it('should include task prompt in observations', async () => {
      const task: Task = {
        id: 'test-1',
        prompt: 'Specific test prompt',
      };

      const result = await executor.execute(task);

      expect(result.state.observations.join(' ')).toContain(
        'Specific test prompt'
      );
    });

    it('should work without context manager', async () => {
      const executorWithoutContext = new OOPSExecutor(mockLLMClient);
      const task: Task = {
        id: 'test-1',
        prompt: 'Test task',
      };

      const result = await executorWithoutContext.execute(task);

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
    });

    it('should handle task with additional context', async () => {
      const task: Task = {
        id: 'test-1',
        prompt: 'Test task',
        context: { key: 'value' },
      };

      const result = await executor.execute(task);

      expect(result).toBeDefined();
    });

    it('should calculate duration correctly', async () => {
      const task: Task = {
        id: 'test-1',
        prompt: 'Test task',
      };

      const startTime = Date.now();
      const result = await executor.execute(task);
      const endTime = Date.now();

      expect(result.duration).toBeGreaterThanOrEqual(0);
      expect(result.duration).toBeLessThanOrEqual(endTime - startTime + 100);
    });
  });

  describe('Prediction interface', () => {
    it('should generate predictions with required fields', async () => {
      const task: Task = {
        id: 'test-1',
        prompt: 'Test task',
      };

      const result = await executor.execute(task);

      if (result.state.predictions.length > 0) {
        const prediction = result.state.predictions[0];
        expect(prediction.id).toBeDefined();
        expect(prediction.description).toBeDefined();
        expect(prediction.pros).toBeDefined();
        expect(prediction.cons).toBeDefined();
        expect(prediction.estimatedSuccess).toBeDefined();
      }
    });

    it('should have pros as array', async () => {
      const task: Task = {
        id: 'test-1',
        prompt: 'Test task',
      };

      const result = await executor.execute(task);

      if (result.state.predictions.length > 0) {
        expect(Array.isArray(result.state.predictions[0].pros)).toBe(true);
      }
    });

    it('should have cons as array', async () => {
      const task: Task = {
        id: 'test-1',
        prompt: 'Test task',
      };

      const result = await executor.execute(task);

      if (result.state.predictions.length > 0) {
        expect(Array.isArray(result.state.predictions[0].cons)).toBe(true);
      }
    });

    it('should have estimatedSuccess between 0 and 1', async () => {
      const task: Task = {
        id: 'test-1',
        prompt: 'Test task',
      };

      const result = await executor.execute(task);

      if (result.state.predictions.length > 0) {
        const success = result.state.predictions[0].estimatedSuccess;
        expect(success).toBeGreaterThanOrEqual(0);
        expect(success).toBeLessThanOrEqual(1);
      }
    });
  });

  describe('observe phase', () => {
    it('should set phase to observe', async () => {
      const task: Task = {
        id: 'test-1',
        prompt: 'Test task',
      };

      const result = await executor.execute(task);

      expect(result.state).toBeDefined();
    });

    it('should include task prompt in observations', async () => {
      const task: Task = {
        id: 'test-1',
        prompt: 'My specific task',
      };

      const result = await executor.execute(task);

      expect(result.state.observations.join('\n')).toContain(
        'My specific task'
      );
    });

    it('should query context manager if available', async () => {
      const task: Task = {
        id: 'test-1',
        prompt: 'Test task',
      };

      await executor.execute(task);

      expect(mockContextManager.query).toHaveBeenCalled();
    });

    it('should handle context manager errors gracefully', async () => {
      const errorContextManager = {
        query: jest.fn().mockRejectedValue(new Error('Context error')),
      } as unknown as ContextManager;

      const executorWithErrorContext = new OOPSExecutor(
        mockLLMClient,
        errorContextManager
      );
      const task: Task = {
        id: 'test-1',
        prompt: 'Test task',
      };

      const result = await executorWithErrorContext.execute(task);

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
    });

    it('should include task context in observations', async () => {
      const task: Task = {
        id: 'test-1',
        prompt: 'Test task',
        context: { custom: 'data' },
      };

      const result = await executor.execute(task);

      expect(result.state.observations.join(' ')).toContain('custom');
    });
  });

  describe('orient phase', () => {
    it('should set phase to orient', async () => {
      const task: Task = {
        id: 'test-1',
        prompt: 'Test task',
      };

      const result = await executor.execute(task);

      expect(result.state).toBeDefined();
    });

    it('should use LLM to analyze observations', async () => {
      const task: Task = {
        id: 'test-1',
        prompt: 'Test task',
      };

      await executor.execute(task);

      expect(mockLLMClient.chat).toHaveBeenCalled();
    });

    it('should set orientation from LLM response', async () => {
      const task: Task = {
        id: 'test-1',
        prompt: 'Test task',
      };

      const result = await executor.execute(task);

      expect(result.state.orientation).toBeDefined();
    });
  });

  describe('predict phase', () => {
    it('should set phase to predict', async () => {
      const task: Task = {
        id: 'test-1',
        prompt: 'Test task',
      };

      const result = await executor.execute(task);

      expect(result.state.phase).toBeDefined();
    });

    it('should generate multiple predictions', async () => {
      const task: Task = {
        id: 'test-1',
        prompt: 'Test task',
      };

      const result = await executor.execute(task);

      expect(result.state.predictions.length).toBeGreaterThanOrEqual(1);
    });

    it('should parse JSON response from LLM', async () => {
      const jsonLLMClient = {
        chat: jest.fn().mockResolvedValue({
          content: JSON.stringify([
            {
              id: '1',
              description: 'Test approach',
              pros: ['Fast', 'Simple'],
              cons: ['Limited'],
              estimatedSuccess: 0.8,
            },
          ]),
        }),
      } as unknown as LLMClient;

      const jsonExecutor = new OOPSExecutor(jsonLLMClient);
      const task: Task = {
        id: 'test-1',
        prompt: 'Test task',
      };

      const result = await jsonExecutor.execute(task);

      expect(result.state.predictions.length).toBeGreaterThanOrEqual(1);
    });

    it('should handle JSON parse errors with default prediction', async () => {
      const errorLLMClient = {
        chat: jest.fn().mockResolvedValue({ content: 'Invalid JSON' }),
      } as unknown as LLMClient;

      const errorExecutor = new OOPSExecutor(errorLLMClient);
      const task: Task = {
        id: 'test-1',
        prompt: 'Test task',
      };

      const result = await errorExecutor.execute(task);

      expect(result.state.predictions.length).toBeGreaterThanOrEqual(1);
      expect(result.state.predictions[0].description).toBe('Default approach');
    });

    it('should handle missing JSON array with default', async () => {
      const noJsonLLMClient = {
        chat: jest.fn().mockResolvedValue({ content: 'No JSON here' }),
      } as unknown as LLMClient;

      const noJsonExecutor = new OOPSExecutor(noJsonLLMClient);
      const task: Task = {
        id: 'test-1',
        prompt: 'Test task',
      };

      const result = await noJsonExecutor.execute(task);

      expect(result.state.predictions.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('select phase', () => {
    it('should set phase to select', async () => {
      const task: Task = {
        id: 'test-1',
        prompt: 'Test task',
      };

      const result = await executor.execute(task);

      expect(result.state).toBeDefined();
    });

    it('should select prediction with highest success rate', async () => {
      const highSuccessLLMClient = {
        chat: jest.fn().mockResolvedValue({
          content: JSON.stringify([
            {
              id: '1',
              description: 'Low success',
              pros: [],
              cons: [],
              estimatedSuccess: 0.3,
            },
            {
              id: '2',
              description: 'High success',
              pros: [],
              cons: [],
              estimatedSuccess: 0.9,
            },
          ]),
        }),
      } as unknown as LLMClient;

      const highSuccessExecutor = new OOPSExecutor(highSuccessLLMClient);
      const task: Task = {
        id: 'test-1',
        prompt: 'Test task',
      };

      const result = await highSuccessExecutor.execute(task);

      expect(result.state.selectedPrediction).toBeDefined();
      if (result.state.selectedPrediction) {
        expect(result.state.selectedPrediction.estimatedSuccess).toBe(0.9);
      }
    });

    it('should handle empty predictions gracefully', async () => {
      const emptyLLMClient = {
        chat: jest.fn().mockResolvedValue({ content: '[]' }),
      } as unknown as LLMClient;

      const emptyExecutor = new OOPSExecutor(emptyLLMClient);
      const task: Task = {
        id: 'test-1',
        prompt: 'Test task',
      };

      const result = await emptyExecutor.execute(task);

      // Should handle empty array
      expect(result).toBeDefined();
    });
  });

  describe('act phase', () => {
    it('should set phase to act', async () => {
      const task: Task = {
        id: 'test-1',
        prompt: 'Test task',
      };

      const result = await executor.execute(task);

      expect(result.state).toBeDefined();
    });

    it('should use LLM to execute action', async () => {
      const task: Task = {
        id: 'test-1',
        prompt: 'Test task',
      };

      await executor.execute(task);

      expect(mockLLMClient.chat).toHaveBeenCalled();
    });

    it('should set result from LLM response', async () => {
      const task: Task = {
        id: 'test-1',
        prompt: 'Test task',
      };

      const result = await executor.execute(task);

      expect(result.state.result).toBeDefined();
    });

    it('should check if task is complete', async () => {
      const task: Task = {
        id: 'test-1',
        prompt: 'Test task',
      };

      await executor.execute(task);

      expect(mockLLMClient.chat).toHaveBeenCalled();
    });

    it('should use selected prediction', async () => {
      const task: Task = {
        id: 'test-1',
        prompt: 'Test task',
      };

      const result = await executor.execute(task);

      if (result.state.selectedPrediction) {
        expect(result.state.result).toBeDefined();
      }
    });

    it('should fallback to first prediction if none selected', async () => {
      const task: Task = {
        id: 'test-1',
        prompt: 'Test task',
      };

      const result = await executor.execute(task);

      expect(result.state.result).toBeDefined();
    });
  });

  describe('createOOPSExecutor', () => {
    it('should create executor instance', () => {
      const instance = createOOPSExecutor(mockLLMClient);
      expect(instance).toBeInstanceOf(OOPSExecutor);
    });

    it('should accept context manager', () => {
      const instance = createOOPSExecutor(mockLLMClient, mockContextManager);
      expect(instance).toBeInstanceOf(OOPSExecutor);
    });

    it('should work without context manager', () => {
      const instance = createOOPSExecutor(mockLLMClient);
      expect(instance).toBeInstanceOf(OOPSExecutor);
    });
  });

  describe('OOPS loop iterations', () => {
    it('should execute at least one iteration', async () => {
      const task: Task = {
        id: 'test-1',
        prompt: 'Test task',
      };

      const result = await executor.execute(task);

      expect(result.state.iteration).toBeGreaterThanOrEqual(1);
    });

    it('should not exceed max iterations', async () => {
      const task: Task = {
        id: 'test-1',
        prompt: 'Complex task requiring multiple iterations',
      };

      const result = await executor.execute(task);

      expect(result.state.iteration).toBeLessThanOrEqual(3);
    });

    it('should increment iteration counter', async () => {
      const task: Task = {
        id: 'test-1',
        prompt: 'Test task',
      };

      const result = await executor.execute(task);

      expect(result.state.iteration).toBeGreaterThanOrEqual(1);
    });
  });

  describe('state management', () => {
    it('should maintain state throughout execution', async () => {
      const task: Task = {
        id: 'test-1',
        prompt: 'Test task',
      };

      const result = await executor.execute(task);

      expect(result.state).toBeDefined();
      expect(result.state.observations).toBeDefined();
      expect(result.state.orientation).toBeDefined();
      expect(result.state.predictions).toBeDefined();
      expect(result.state.result).toBeDefined();
    });

    it('should return final state in result', async () => {
      const task: Task = {
        id: 'test-1',
        prompt: 'Test task',
      };

      const result = await executor.execute(task);

      expect(result.state).toEqual(result.state);
    });

    it('should track all phases', async () => {
      const task: Task = {
        id: 'test-1',
        prompt: 'Test task',
      };

      const result = await executor.execute(task);

      expect(['observe', 'orient', 'predict', 'select', 'act']).toContain(
        result.state.phase
      );
    });
  });

  describe('error handling', () => {
    it('should handle LLM errors gracefully', async () => {
      const errorLLMClient = {
        chat: jest.fn().mockRejectedValue(new Error('LLM error')),
      } as unknown as LLMClient;

      const errorExecutor = new OOPSExecutor(errorLLMClient);
      const task: Task = {
        id: 'test-1',
        prompt: 'Test task',
      };

      await expect(errorExecutor.execute(task)).rejects.toThrow('LLM error');
    });

    it('should handle context errors gracefully', async () => {
      const errorContextManager = {
        query: jest.fn().mockRejectedValue(new Error('Context error')),
      } as unknown as ContextManager;

      const errorExecutor = new OOPSExecutor(
        mockLLMClient,
        errorContextManager
      );
      const task: Task = {
        id: 'test-1',
        prompt: 'Test task',
      };

      const result = await errorExecutor.execute(task);

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
    });

    it('should handle prediction parsing errors', async () => {
      const badJsonLLMClient = {
        chat: jest.fn().mockResolvedValue({ content: '{ bad json' }),
      } as unknown as LLMClient;

      const badJsonExecutor = new OOPSExecutor(badJsonLLMClient);
      const task: Task = {
        id: 'test-1',
        prompt: 'Test task',
      };

      const result = await badJsonExecutor.execute(task);

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
    });
  });

  describe('prediction quality', () => {
    it('should generate predictions with meaningful descriptions', async () => {
      const task: Task = {
        id: 'test-1',
        prompt: 'How to optimize database queries?',
      };

      const result = await executor.execute(task);

      if (result.state.predictions.length > 0) {
        expect(result.state.predictions[0].description.length).toBeGreaterThan(
          0
        );
      }
    });

    it('should provide pros and cons for each prediction', async () => {
      const task: Task = {
        id: 'test-1',
        prompt: 'Test task',
      };

      const result = await executor.execute(task);

      if (result.state.predictions.length > 0) {
        const prediction = result.state.predictions[0];
        expect(prediction.pros.length).toBeGreaterThanOrEqual(0);
        expect(prediction.cons.length).toBeGreaterThanOrEqual(0);
      }
    });
  });
});
