/**
 * Comprehensive Task Trigger Tests
 *
 * Tests all public methods, error scenarios, and edge cases for trigger.ts
 */

import {
  TaskTrigger,
  createTaskTrigger,
  type TaskTriggerConfig,
  type TaskTriggerResult,
} from '../src/trigger.js';
import type { WhatsAppMessage } from '../src/adapter.js';
import type { AgentRuntime, Task, TaskResult } from '@jclaw/core';

describe('TaskTrigger - Comprehensive', () => {
  let mockAgent: jest.Mocked<AgentRuntime>;
  let trigger: TaskTrigger;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();

    mockAgent = {
      execute: jest.fn(),
      start: jest.fn(),
      stop: jest.fn(),
      context: {} as never,
      executionMode: 'local',
    } as unknown as jest.Mocked<AgentRuntime>;

    trigger = new TaskTrigger(mockAgent);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('constructor', () => {
    it('should create trigger with default options', () => {
      const t = new TaskTrigger(mockAgent);
      expect(t).toBeDefined();
    });

    it('should accept custom defaultTimeout', () => {
      const t = new TaskTrigger(mockAgent, {
        defaultTimeout: 120000,
      });
      expect(t).toBeDefined();
    });

    it('should accept custom commandPrefix', () => {
      const t = new TaskTrigger(mockAgent, {
        commandPrefix: '@bot',
      });
      expect(t).toBeDefined();
    });

    it('should accept custom requirePrefix', () => {
      const t = new TaskTrigger(mockAgent, {
        requirePrefix: false,
      });
      expect(t).toBeDefined();
    });

    it('should accept complete custom config', () => {
      const t = new TaskTrigger(mockAgent, {
        defaultTimeout: 90000,
        commandPrefix: '@assistant',
        requirePrefix: false,
      });
      expect(t).toBeDefined();
    });

    it('should use default values when config is empty', () => {
      const t = new TaskTrigger(mockAgent, {});
      expect(t).toBeDefined();
    });
  });

  describe('extractTask', () => {
    it('should extract task from message with default prefix', () => {
      const content = '@jclaw check my emails';
      const task = trigger.extractTask(content);

      expect(task).toBe('check my emails');
    });

    it('should extract task with custom prefix', () => {
      const customTrigger = new TaskTrigger(mockAgent, {
        commandPrefix: '@bot',
      });

      const content = '@bot do something';
      const task = customTrigger.extractTask(content);

      expect(task).toBe('do something');
    });

    it('should be case-insensitive for prefix', () => {
      const content1 = '@JCLAW task one';
      const content2 = '@JClaw task two';
      const content3 = '@jClAw task three';

      expect(trigger.extractTask(content1)).toBe('task one');
      expect(trigger.extractTask(content2)).toBe('task two');
      expect(trigger.extractTask(content3)).toBe('task three');
    });

    it('should handle extra spaces after prefix', () => {
      const content1 = '@jclaw    task with spaces';
      const content2 = '@jclaw\ttask with tab';

      expect(trigger.extractTask(content1)).toBe('task with spaces');
      expect(trigger.extractTask(content2)).toBe('task with tab');
    });

    it('should return null for message without prefix when prefix is required', () => {
      const content = 'just a regular message';
      const task = trigger.extractTask(content);

      expect(task).toBeNull();
    });

    it('should return entire message when prefix not required', () => {
      const customTrigger = new TaskTrigger(mockAgent, {
        requirePrefix: false,
      });

      const content = 'just a regular message';
      const task = customTrigger.extractTask(content);

      expect(task).toBe('just a regular message');
    });

    it('should return null for empty message when prefix not required', () => {
      const customTrigger = new TaskTrigger(mockAgent, {
        requirePrefix: false,
      });

      expect(customTrigger.extractTask('')).toBeNull();
      expect(customTrigger.extractTask('   ')).toBeNull();
      expect(customTrigger.extractTask('\t\n')).toBeNull();
    });

    it('should return null for empty task after prefix', () => {
      const content1 = '@jclaw';
      const content2 = '@jclaw   ';
      const content3 = '@jclaw\t\n';

      expect(trigger.extractTask(content1)).toBeNull();
      expect(trigger.extractTask(content2)).toBeNull();
      expect(trigger.extractTask(content3)).toBeNull();
    });

    it('should trim whitespace from extracted task', () => {
      const content = '  @jclaw   do something important   ';
      const task = trigger.extractTask(content);

      expect(task).toBe('do something important');
    });

    it('should handle special characters in task', () => {
      const content = '@jclaw run command --flag "arg with spaces"';
      const task = trigger.extractTask(content);

      expect(task).toBe('run command --flag "arg with spaces"');
    });

    it('should handle unicode in task', () => {
      const content = '@jclaw send 🎉 celebration message';
      const task = trigger.extractTask(content);

      expect(task).toBe('send 🎉 celebration message');
    });

    it('should handle prefix at different positions (only matches start)', () => {
      const content1 = '@jclaw at start';
      const content2 = 'middle @jclaw middle';
      const content3 = 'end @jclaw';

      expect(trigger.extractTask(content1)).toBe('at start');
      expect(trigger.extractTask(content2)).toBeNull();
      expect(trigger.extractTask(content3)).toBeNull();
    });

    it('should handle prefix with special regex characters', () => {
      const customTrigger = new TaskTrigger(mockAgent, {
        commandPrefix: '@bot.dev',
      });

      const content = '@bot.dev do something';
      const task = customTrigger.extractTask(content);

      expect(task).toBe('do something');
    });

    it('should handle prefix with brackets', () => {
      const customTrigger = new TaskTrigger(mockAgent, {
        commandPrefix: '[bot]',
      });

      const content = '[bot] do something';
      const task = customTrigger.extractTask(content);

      expect(task).toBe('do something');
    });
  });

  describe('hasCommandPrefix', () => {
    it('should return true for message with prefix', () => {
      const content = '@jclaw do something';
      expect(trigger.hasCommandPrefix(content)).toBe(true);
    });

    it('should return false for message without prefix', () => {
      const content = 'do something';
      expect(trigger.hasCommandPrefix(content)).toBe(false);
    });

    it('should be case-insensitive', () => {
      expect(trigger.hasCommandPrefix('@JCLAW test')).toBe(true);
      expect(trigger.hasCommandPrefix('@JClaw test')).toBe(true);
      expect(trigger.hasCommandPrefix('@jClAw test')).toBe(true);
    });

    it('should handle custom prefix', () => {
      const customTrigger = new TaskTrigger(mockAgent, {
        commandPrefix: '@bot',
      });

      expect(customTrigger.hasCommandPrefix('@bot test')).toBe(true);
      expect(customTrigger.hasCommandPrefix('@jclaw test')).toBe(false);
    });

    it('should trim whitespace before checking', () => {
      expect(trigger.hasCommandPrefix('  @jclaw test')).toBe(true);
      expect(trigger.hasCommandPrefix('@jclaw test  ')).toBe(true);
    });

    it('should return false for empty string', () => {
      expect(trigger.hasCommandPrefix('')).toBe(false);
      expect(trigger.hasCommandPrefix('   ')).toBe(false);
    });
  });

  describe('executeTask', () => {
    it('should execute task successfully', async () => {
      const mockResult: TaskResult = {
        taskId: 'task-123',
        success: true,
        output: 'Task completed successfully',
        duration: 1500,
      };

      mockAgent.execute.mockResolvedValue(mockResult);

      const message: WhatsAppMessage = {
        id: 'msg-1',
        from: 'user@s.whatsapp.net',
        content: '@jclaw check emails',
        timestamp: 1234567890,
      };

      const result = await trigger.executeTask(message);

      expect(result.triggered).toBe(true);
      expect(result.taskId).toBeDefined();
      expect(result.hasPrefix).toBe(true);
      expect(result.result).toEqual(mockResult);
      expect(mockAgent.execute).toHaveBeenCalled();
    });

    it('should not trigger for message without prefix', async () => {
      const message: WhatsAppMessage = {
        id: 'msg-1',
        from: 'user@s.whatsapp.net',
        content: 'regular message',
        timestamp: 1234567890,
      };

      const result = await trigger.executeTask(message);

      expect(result.triggered).toBe(false);
      expect(result.hasPrefix).toBe(false);
      expect(result.error).toBe('No command prefix found');
      expect(mockAgent.execute).not.toHaveBeenCalled();
    });

    it('should not trigger for empty task', async () => {
      const message: WhatsAppMessage = {
        id: 'msg-1',
        from: 'user@s.whatsapp.net',
        content: '@jclaw   ',
        timestamp: 1234567890,
      };

      const result = await trigger.executeTask(message);

      expect(result.triggered).toBe(false);
      expect(result.hasPrefix).toBe(true);
      expect(result.error).toBe('Empty task prompt');
      expect(mockAgent.execute).not.toHaveBeenCalled();
    });

    it('should create task with correct structure', async () => {
      const mockResult: TaskResult = {
        taskId: 'task-123',
        success: true,
        output: 'Done',
        duration: 1000,
      };

      mockAgent.execute.mockResolvedValue(mockResult);

      const message: WhatsAppMessage = {
        id: 'msg-1',
        from: 'user@s.whatsapp.net',
        content: '@jclaw do something',
        timestamp: 1234567890,
        senderName: 'John Doe',
        groupId: 'group-123@g.us',
      };

      await trigger.executeTask(message);

      expect(mockAgent.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          id: expect.stringMatching(/^task_/),
          prompt: 'do something',
          context: expect.objectContaining({
            source: 'whatsapp',
            messageId: 'msg-1',
            from: 'user@s.whatsapp.net',
            senderName: 'John Doe',
            groupId: 'group-123@g.us',
            timestamp: 1234567890,
          }),
        })
      );
    });

    it('should use custom timeout', async () => {
      const mockResult: TaskResult = {
        taskId: 'task-123',
        success: true,
        output: 'Done',
        duration: 1000,
      };

      mockAgent.execute.mockResolvedValue(mockResult);

      const message: WhatsAppMessage = {
        id: 'msg-1',
        from: 'user@s.whatsapp.net',
        content: '@jclaw long task',
        timestamp: 1234567890,
      };

      // Start execution with custom timeout
      const executePromise = trigger.executeTask(message, 5000);

      // Should not timeout
      jest.advanceTimersByTime(100);

      const result = await executePromise;
      expect(result.triggered).toBe(true);
    });

    it('should handle task timeout', async () => {
      mockAgent.execute.mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 100000))
      );

      const triggerWithShortTimeout = new TaskTrigger(mockAgent, {
        defaultTimeout: 100,
      });

      const message: WhatsAppMessage = {
        id: 'msg-1',
        from: 'user@s.whatsapp.net',
        content: '@jclaw slow task',
        timestamp: 1234567890,
      };

      const executePromise = triggerWithShortTimeout.executeTask(message);

      // Fast-forward past timeout
      jest.advanceTimersByTime(150);

      const result = await executePromise;

      expect(result.triggered).toBe(true);
      expect(result.error).toContain('timeout');
      expect(result.result?.success).toBe(false);
    });

    it('should handle agent execution error', async () => {
      mockAgent.execute.mockRejectedValue(new Error('Agent crashed'));

      const message: WhatsAppMessage = {
        id: 'msg-1',
        from: 'user@s.whatsapp.net',
        content: '@jclaw failing task',
        timestamp: 1234567890,
      };

      const result = await trigger.executeTask(message);

      expect(result.triggered).toBe(true);
      expect(result.error).toBe('Agent crashed');
      expect(result.result?.success).toBe(false);
    });

    it('should handle non-Error exceptions', async () => {
      mockAgent.execute.mockRejectedValue('String error');

      const message: WhatsAppMessage = {
        id: 'msg-1',
        from: 'user@s.whatsapp.net',
        content: '@jclaw task',
        timestamp: 1234567890,
      };

      const result = await trigger.executeTask(message);

      expect(result.triggered).toBe(true);
      expect(result.error).toBe('String error');
    });

    it('should generate unique task IDs', async () => {
      const mockResult: TaskResult = {
        taskId: 'task-123',
        success: true,
        output: 'Done',
        duration: 1000,
      };

      mockAgent.execute.mockResolvedValue(mockResult);

      const message: WhatsAppMessage = {
        id: 'msg-1',
        from: 'user@s.whatsapp.net',
        content: '@jclaw task',
        timestamp: 1234567890,
      };

      const result1 = await trigger.executeTask(message);
      const result2 = await trigger.executeTask(message);

      expect(result1.taskId).not.toBe(result2.taskId);
    });

    it('should include task ID in error result', async () => {
      mockAgent.execute.mockRejectedValue(new Error('Failed'));

      const message: WhatsAppMessage = {
        id: 'msg-1',
        from: 'user@s.whatsapp.net',
        content: '@jclaw task',
        timestamp: 1234567890,
      };

      const result = await trigger.executeTask(message);

      expect(result.result?.taskId).toBe(result.taskId);
    });
  });

  describe('createTaskTrigger factory', () => {
    it('should create TaskTrigger instance', () => {
      const t = createTaskTrigger(mockAgent);
      expect(t).toBeInstanceOf(TaskTrigger);
    });

    it('should pass config to TaskTrigger', () => {
      const t = createTaskTrigger(mockAgent, {
        commandPrefix: '@bot',
        requirePrefix: false,
      });

      expect(t.extractTask('hello')).toBe('hello');
    });

    it('should work without config', () => {
      const t = createTaskTrigger(mockAgent);
      expect(t).toBeInstanceOf(TaskTrigger);
    });
  });

  describe('edge cases', () => {
    it('should handle very long task prompt', async () => {
      const mockResult: TaskResult = {
        taskId: 'task-123',
        success: true,
        output: 'Done',
        duration: 1000,
      };

      mockAgent.execute.mockResolvedValue(mockResult);

      const longPrompt = 'a'.repeat(10000);
      const message: WhatsAppMessage = {
        id: 'msg-1',
        from: 'user@s.whatsapp.net',
        content: `@jclaw ${longPrompt}`,
        timestamp: 1234567890,
      };

      const result = await trigger.executeTask(message);

      expect(result.triggered).toBe(true);
      expect(mockAgent.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          prompt: longPrompt,
        })
      );
    });

    it('should handle message with only prefix variations', () => {
      expect(trigger.extractTask('@jclaw')).toBeNull();
      expect(trigger.extractTask('@jclaw ')).toBeNull();
      expect(trigger.extractTask('@jclaw\n')).toBeNull();
      expect(trigger.extractTask('@jclaw\t')).toBeNull();
    });

    it('should handle messages from groups', async () => {
      const mockResult: TaskResult = {
        taskId: 'task-123',
        success: true,
        output: 'Done',
        duration: 1000,
      };

      mockAgent.execute.mockResolvedValue(mockResult);

      const message: WhatsAppMessage = {
        id: 'msg-1',
        from: 'user@s.whatsapp.net',
        content: '@jclaw group task',
        timestamp: 1234567890,
        groupId: 'group-123@g.us',
        senderName: 'John in Group',
      };

      const result = await trigger.executeTask(message);

      expect(result.triggered).toBe(true);
      expect(mockAgent.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          context: expect.objectContaining({
            groupId: 'group-123@g.us',
            senderName: 'John in Group',
          }),
        })
      );
    });

    it('should handle undefined optional fields', async () => {
      const mockResult: TaskResult = {
        taskId: 'task-123',
        success: true,
        output: 'Done',
        duration: 1000,
      };

      mockAgent.execute.mockResolvedValue(mockResult);

      const message: WhatsAppMessage = {
        id: 'msg-1',
        from: 'user@s.whatsapp.net',
        content: '@jclaw simple task',
        timestamp: 1234567890,
        // groupId and senderName not provided
      };

      const result = await trigger.executeTask(message);

      expect(result.triggered).toBe(true);
      expect(mockAgent.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          context: expect.objectContaining({
            groupId: undefined,
            senderName: undefined,
          }),
        })
      );
    });

    it('should handle prefix-only messages with requirePrefix false', () => {
      const customTrigger = new TaskTrigger(mockAgent, {
        commandPrefix: '@bot',
        requirePrefix: false,
      });

      // When requirePrefix is false and no prefix matches, return the content
      expect(customTrigger.extractTask('@jclaw')).toBe('@jclaw');
      expect(customTrigger.extractTask('hello world')).toBe('hello world');
    });
      const customTrigger = new TaskTrigger(mockAgent, {
        requirePrefix: false,
      });

      expect(customTrigger.extractTask('@jclaw')).toBe('@jclaw');
      expect(customTrigger.extractTask('@bot')).toBe('@bot');
    });

    it('should handle multiline messages', () => {
      const content = `@jclaw first line
second line
third line`;

      const task = trigger.extractTask(content);

      expect(task).toBe('first line\nsecond line\nthird line');
    });

    it('should handle multiple prefixes in message', () => {
      const content = '@jclaw first task @jclaw second task';

      const task = trigger.extractTask(content);

      // Should only remove the first prefix
      expect(task).toBe('first task @jclaw second task');
    });

    it('should handle task with code', async () => {
      const mockResult: TaskResult = {
        taskId: 'task-123',
        success: true,
        output: 'Done',
        duration: 1000,
      };

      mockAgent.execute.mockResolvedValue(mockResult);

      const code = 'const x = 1;\nconsole.log(x);';
      const message: WhatsAppMessage = {
        id: 'msg-1',
        from: 'user@s.whatsapp.net',
        content: `@jclaw ${code}`,
        timestamp: 1234567890,
      };

      const result = await trigger.executeTask(message);

      expect(result.triggered).toBe(true);
      expect(mockAgent.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          prompt: code,
        })
      );
    });

    it('should handle zero timestamp', async () => {
      const mockResult: TaskResult = {
        taskId: 'task-123',
        success: true,
        output: 'Done',
        duration: 1000,
      };

      mockAgent.execute.mockResolvedValue(mockResult);

      const message: WhatsAppMessage = {
        id: 'msg-1',
        from: 'user@s.whatsapp.net',
        content: '@jclaw task',
        timestamp: 0,
      };

      const result = await trigger.executeTask(message);

      expect(result.triggered).toBe(true);
    });

    it('should handle unicode command prefix', () => {
      const customTrigger = new TaskTrigger(mockAgent, {
        commandPrefix: '🤖',
      });

      const content = '🤖 do something';
      const task = customTrigger.extractTask(content);

      expect(task).toBe('do something');
    });
  });

  describe('type exports', () => {
    it('should have correct TaskTriggerConfig interface', () => {
      const config: TaskTriggerConfig = {
        defaultTimeout: 60000,
        commandPrefix: '@jclaw',
        requirePrefix: true,
      };

      expect(config.defaultTimeout).toBe(60000);
      expect(config.commandPrefix).toBe('@jclaw');
      expect(config.requirePrefix).toBe(true);
    });

    it('should have correct TaskTriggerResult interface for successful execution', () => {
      const result: TaskTriggerResult = {
        triggered: true,
        taskId: 'task-123',
        result: {
          taskId: 'task-123',
          success: true,
          output: 'Done',
          duration: 1000,
        },
        hasPrefix: true,
      };

      expect(result.triggered).toBe(true);
      expect(result.taskId).toBe('task-123');
    });

    it('should have correct TaskTriggerResult interface for failed execution', () => {
      const result: TaskTriggerResult = {
        triggered: false,
        hasPrefix: false,
        error: 'No command prefix found',
      };

      expect(result.triggered).toBe(false);
      expect(result.hasPrefix).toBe(false);
      expect(result.error).toBe('No command prefix found');
    });

    it('should have correct TaskTriggerResult with error', () => {
      const result: TaskTriggerResult = {
        triggered: true,
        taskId: 'task-123',
        hasPrefix: true,
        error: 'Execution failed',
        result: {
          taskId: 'task-123',
          success: false,
          error: 'Execution failed',
          duration: 0,
        },
      };

      expect(result.triggered).toBe(true);
      expect(result.error).toBe('Execution failed');
      expect(result.result?.success).toBe(false);
    });
  });
});
