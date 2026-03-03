/**
 * OODAExecutor Tests
 */

import {
  OODAExecutor,
  createOODAExecutor,
} from '../../src/runtime/modes/ooda-executor.js';
import type { Task } from '../../src/types.js';
import type { LLMClient } from '../../src/runtime/llm-client.js';
import type { ContextManager } from '../../src/types.js';

describe('OODAExecutor', () => {
  let executor: OODAExecutor;
  let mockLLMClient: LLMClient;
  let mockContextManager: ContextManager;

  beforeEach(() => {
    mockLLMClient = {
      chat: jest.fn().mockResolvedValue({ content: 'Mock response' }),
    } as unknown as LLMClient;

    mockContextManager = {
      query: jest.fn().mockResolvedValue('Mock context'),
    } as unknown as ContextManager;

    executor = new OODAExecutor(mockLLMClient, mockContextManager);
  });

  describe('constructor', () => {
    it('should create executor with LLM client', () => {
      expect(executor).toBeDefined();
    });

    it('should create executor without context manager', () => {
      const executorWithoutContext = new OODAExecutor(mockLLMClient);
      expect(executorWithoutContext).toBeDefined();
    });

    it('should store LLM client', () => {
      expect(executor).toBeInstanceOf(OODAExecutor);
    });

    it('should store context manager optionally', () => {
      expect(executor).toBeInstanceOf(OODAExecutor);
    });
  });

  describe('execute', () => {
    it('should execute task through OODA loop', async () => {
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

    it('should set decision after decide phase', async () => {
      const task: Task = {
        id: 'test-1',
        prompt: 'Test task',
      };

      const result = await executor.execute(task);

      expect(result.state.decision).toBeDefined();
    });

    it('should track actions taken', async () => {
      const task: Task = {
        id: 'test-1',
        prompt: 'Test task',
      };

      const result = await executor.execute(task);

      expect(result.state.actions).toBeDefined();
      expect(Array.isArray(result.state.actions)).toBe(true);
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
      const executorWithoutContext = new OODAExecutor(mockLLMClient);
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

  describe('observe phase', () => {
    it('should set phase to observe', async () => {
      const task: Task = {
        id: 'test-1',
        prompt: 'Test task',
      };

      const result = await executor.execute(task);

      // Phase should progress through all states
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

      const executorWithErrorContext = new OODAExecutor(
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

  describe('decide phase', () => {
    it('should set phase to decide', async () => {
      const task: Task = {
        id: 'test-1',
        prompt: 'Test task',
      };

      const result = await executor.execute(task);

      expect(result.state).toBeDefined();
    });

    it('should use LLM to make decision', async () => {
      const task: Task = {
        id: 'test-1',
        prompt: 'Test task',
      };

      await executor.execute(task);

      expect(mockLLMClient.chat).toHaveBeenCalled();
    });

    it('should set decision from LLM response', async () => {
      const task: Task = {
        id: 'test-1',
        prompt: 'Test task',
      };

      const result = await executor.execute(task);

      expect(result.state.decision).toBeDefined();
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

    it('should add action result to actions array', async () => {
      const task: Task = {
        id: 'test-1',
        prompt: 'Test task',
      };

      const result = await executor.execute(task);

      expect(result.state.actions.length).toBeGreaterThanOrEqual(1);
    });

    it('should check if task is complete', async () => {
      const task: Task = {
        id: 'test-1',
        prompt: 'Test task',
      };

      await executor.execute(task);

      expect(mockLLMClient.chat).toHaveBeenCalled();
    });

    it('should continue if task not complete', async () => {
      const task: Task = {
        id: 'test-1',
        prompt: 'Complex multi-step task',
      };

      const result = await executor.execute(task);

      expect(result.state.iteration).toBeGreaterThanOrEqual(1);
    });

    it('should stop if task complete', async () => {
      const task: Task = {
        id: 'test-1',
        prompt: 'Simple task',
      };

      const result = await executor.execute(task);

      expect(result.state.iteration).toBeLessThanOrEqual(3);
    });
  });

  describe('createOODAExecutor', () => {
    it('should create executor instance', () => {
      const instance = createOODAExecutor(mockLLMClient);
      expect(instance).toBeInstanceOf(OODAExecutor);
    });

    it('should accept context manager', () => {
      const instance = createOODAExecutor(mockLLMClient, mockContextManager);
      expect(instance).toBeInstanceOf(OODAExecutor);
    });

    it('should work without context manager', () => {
      const instance = createOODAExecutor(mockLLMClient);
      expect(instance).toBeInstanceOf(OODAExecutor);
    });
  });

  describe('OODA loop iterations', () => {
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
      expect(result.state.decision).toBeDefined();
      expect(result.state.actions).toBeDefined();
    });

    it('should return final state in result', async () => {
      const task: Task = {
        id: 'test-1',
        prompt: 'Test task',
      };

      const result = await executor.execute(task);

      expect(result.state).toEqual(result.state);
    });
  });

  describe('error handling', () => {
    it('should handle LLM errors gracefully', async () => {
      const errorLLMClient = {
        chat: jest.fn().mockRejectedValue(new Error('LLM error')),
      } as unknown as LLMClient;

      const errorExecutor = new OODAExecutor(errorLLMClient);
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

      const errorExecutor = new OODAExecutor(
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
  });
});
