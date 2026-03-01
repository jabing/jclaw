/**
 * Task Executor Tests
 */

import { TaskExecutor, createTaskExecutor } from '../../src/runtime/task-executor.js';
import { LLMClient } from '../../src/runtime/llm-client.js';
import { MockClient } from '../../src/context/mock-client.js';
import type { Task } from '../../src/types.js';

describe('TaskExecutor', () => {
  let mockLLMClient: LLMClient;
  let mockContextClient: MockClient;

  beforeEach(() => {
    // Create mock LLM client
    mockLLMClient = new LLMClient({
      apiBase: 'https://api.test.com/v1',
      apiKey: 'test-key',
      model: 'test-model',
    });

    // Mock fetch for LLM calls
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: 'Task completed successfully' } }],
        model: 'test-model',
      }),
    });

    mockContextClient = new MockClient();
  });

  describe('constructor', () => {
    it('should create executor with config', () => {
      const executor = new TaskExecutor({
        llmClient: mockLLMClient,
      });
      expect(executor).toBeDefined();
    });

    it('should apply default values', () => {
      const executor = new TaskExecutor({
        llmClient: mockLLMClient,
      });
      expect(executor).toBeDefined();
    });
  });

  describe('createTaskExecutor', () => {
    it('should create executor instance', () => {
      const executor = createTaskExecutor({
        llmClient: mockLLMClient,
      });
      expect(executor).toBeInstanceOf(TaskExecutor);
    });
  });

  describe('execute', () => {
    let executor: TaskExecutor;
    const testTask: Task = {
      id: 'test-task-1',
      prompt: 'Test task prompt',
    };

    beforeEach(async () => {
      await mockContextClient.connect();
      executor = new TaskExecutor({
        llmClient: mockLLMClient,
        contextManager: mockContextClient,
        verbose: false,
      });
    });

    it('should execute task and return success result', async () => {
      const result = await executor.execute(testTask);

      expect(result.taskId).toBe('test-task-1');
      expect(result.success).toBe(true);
      expect(result.output).toBe('Task completed successfully');
      expect(result.duration).toBeGreaterThanOrEqual(0);
    });

    it('should include task context in execution', async () => {
      const taskWithContext: Task = {
        id: 'test-task-2',
        prompt: 'Test prompt',
        context: { foo: 'bar' },
      };

      const result = await executor.execute(taskWithContext);
      expect(result.success).toBe(true);
    });

    it('should handle LLM errors with retry', async () => {
      let callCount = 0;
      (global.fetch as jest.Mock).mockImplementation(async () => {
        callCount++;
        if (callCount < 3) {
          throw new Error('Network error');
        }
        return {
          ok: true,
          json: async () => ({
            choices: [{ message: { content: 'Success after retry' } }],
            model: 'test-model',
          }),
        };
      });

      const result = await executor.execute(testTask);

      expect(result.success).toBe(true);
      expect(callCount).toBeGreaterThanOrEqual(3);
    });

    it('should return failure after max retries', async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Persistent error'));

      const result = await executor.execute(testTask);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Persistent error');
    });
  });

  describe('with context manager', () => {
    let executor: TaskExecutor;

    beforeEach(async () => {
      await mockContextClient.connect();
      mockContextClient.setQueryResponse('Test query', 'Context response');

      executor = new TaskExecutor({
        llmClient: mockLLMClient,
        contextManager: mockContextClient,
      });
    });

    it('should query context manager for relevant context', async () => {
      const task: Task = {
        id: 'test-task-3',
        prompt: 'Test query',
      };

      const result = await executor.execute(task);
      expect(result.success).toBe(true);
    });
  });
});
