/**
 * Agent Runtime Tests
 */

import { JClawAgent, createAgent } from '../../src/runtime/agent.js';
import { MockClient } from '../../src/context/mock-client.js';
import type { Task } from '../../src/types.js';

describe('JClawAgent', () => {
  const mockLLMConfig = {
    apiBase: 'https://api.test.com/v1',
    apiKey: 'test-key',
    model: 'test-model',
  };

  beforeEach(() => {
    // Mock fetch for LLM calls
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: 'Agent response' } }],
        model: 'test-model',
      }),
    });
  });

  describe('constructor', () => {
    it('should create agent with default config', () => {
      const agent = new JClawAgent();
      expect(agent).toBeDefined();
      expect(agent.name).toBe('jclaw-agent');
      expect(agent.version).toBe('0.1.0');
      expect(agent.executionMode).toBe('local');
    });

    it('should create agent with custom config', () => {
      const agent = new JClawAgent({
        name: 'custom-agent',
        version: '1.0.0',
        executionMode: 'docker',
      });

      expect(agent.name).toBe('custom-agent');
      expect(agent.version).toBe('1.0.0');
      expect(agent.executionMode).toBe('docker');
    });
  });

  describe('createAgent', () => {
    it('should create agent instance', () => {
      const agent = createAgent();
      expect(agent).toBeInstanceOf(JClawAgent);
    });

    it('should create agent with config', () => {
      const agent = createAgent({ name: 'test-agent' });
      expect(agent.name).toBe('test-agent');
    });
  });

  describe('start and stop', () => {
    it('should fail to start without LLM config', async () => {
      const agent = new JClawAgent();

      await expect(agent.start()).rejects.toThrow('LLM configuration is required');
    });

    it('should start with LLM config', async () => {
      const agent = new JClawAgent({ llm: mockLLMConfig });

      await agent.start();
      expect(agent.isRunning()).toBe(true);

      await agent.stop();
      expect(agent.isRunning()).toBe(false);
    });

    it('should connect to context manager on start', async () => {
      const contextManager = new MockClient();
      const agent = new JClawAgent({
        llm: mockLLMConfig,
        contextManager,
      });

      await agent.start();
      expect(contextManager.isConnected()).toBe(true);

      await agent.stop();
      expect(contextManager.isConnected()).toBe(false);
    });

    it('should handle multiple start/stop calls', async () => {
      const agent = new JClawAgent({ llm: mockLLMConfig });

      await agent.start();
      await agent.start(); // Should not throw

      await agent.stop();
      await agent.stop(); // Should not throw
    });
  });

  describe('execute', () => {
    let agent: JClawAgent;
    const testTask: Task = {
      id: 'test-task',
      prompt: 'Test prompt',
    };

    beforeEach(async () => {
      agent = new JClawAgent({ llm: mockLLMConfig });
      await agent.start();
    });

    afterEach(async () => {
      await agent.stop();
    });

    it('should execute task when running', async () => {
      const result = await agent.execute(testTask);

      expect(result.taskId).toBe('test-task');
      expect(result.success).toBe(true);
      expect(result.output).toBe('Agent response');
    });

    it('should throw if not started', async () => {
      const stoppedAgent = new JClawAgent({ llm: mockLLMConfig });

      await expect(stoppedAgent.execute(testTask)).rejects.toThrow(
        'Agent not started. Call start() first.'
      );
    });
  });

  describe('context', () => {
    it('should return context manager when configured', () => {
      const contextManager = new MockClient();
      const agent = new JClawAgent({
        llm: mockLLMConfig,
        contextManager,
      });

      expect(agent.context).toBe(contextManager);
    });

    it('should throw if context manager not configured', () => {
      const agent = new JClawAgent({ llm: mockLLMConfig });

      expect(() => agent.context).toThrow('Context manager not configured');
    });
  });
});
