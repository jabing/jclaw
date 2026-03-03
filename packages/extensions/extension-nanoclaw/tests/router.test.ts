/**
 * Comprehensive Message Router Tests
 *
 * Tests all public methods, error scenarios, and edge cases for router.ts
 */

import {
  MessageRouter,
  type RouteRule,
  type PatternType,
  type RouterOptions,
} from '../src/router.js';
import type { WhatsAppMessage } from '../src/adapter.js';

describe('MessageRouter - Comprehensive', () => {
  let router: MessageRouter;

  beforeEach(() => {
    router = new MessageRouter();
  });

  describe('constructor', () => {
    it('should create router without options', () => {
      const r = new MessageRouter();
      expect(r).toBeDefined();
      expect(r.getRuleCount()).toBe(0);
    });

    it('should accept default handler in options', () => {
      const defaultHandler = jest.fn();
      const r = new MessageRouter({ defaultHandler });
      expect(r).toBeDefined();
    });

    it('should accept empty options object', () => {
      const r = new MessageRouter({});
      expect(r).toBeDefined();
      expect(r.getRuleCount()).toBe(0);
    });
  });

  describe('addRule', () => {
    it('should add string pattern rule', () => {
      router.addRule({
        pattern: 'hello',
        handler: jest.fn(),
      });
      expect(router.getRuleCount()).toBe(1);
    });

    it('should add regex pattern rule', () => {
      router.addRule({
        pattern: /hello/i,
        handler: jest.fn(),
      });
      expect(router.getRuleCount()).toBe(1);
    });

    it('should add function pattern rule', () => {
      router.addRule({
        pattern: (msg) => msg.content.includes('test'),
        handler: jest.fn(),
      });
      expect(router.getRuleCount()).toBe(1);
    });

    it('should add rule with priority', () => {
      router.addRule({
        pattern: 'high',
        handler: jest.fn(),
        priority: 100,
      });
      router.addRule({
        pattern: 'low',
        handler: jest.fn(),
        priority: 1,
      });

      const rules = router.getRules();
      expect(rules[0].priority).toBe(100);
      expect(rules[1].priority).toBe(1);
    });

    it('should default priority to 0', () => {
      router.addRule({
        pattern: 'test',
        handler: jest.fn(),
      });

      const rules = router.getRules();
      expect(rules[0].priority).toBe(0);
    });

    it('should sort rules by priority (highest first)', () => {
      const handler1 = jest.fn();
      const handler2 = jest.fn();
      const handler3 = jest.fn();

      router.addRule({
        pattern: 'low',
        handler: handler1,
        priority: 1,
      });
      router.addRule({
        pattern: 'high',
        handler: handler2,
        priority: 100,
      });
      router.addRule({
        pattern: 'medium',
        handler: handler3,
        priority: 50,
      });

      const rules = router.getRules();
      expect(rules[0].priority).toBe(100);
      expect(rules[1].priority).toBe(50);
      expect(rules[2].priority).toBe(1);
    });

    it('should maintain stable sort for same priority', () => {
      const handler1 = jest.fn();
      const handler2 = jest.fn();

      router.addRule({
        pattern: 'first',
        handler: handler1,
        priority: 10,
      });
      router.addRule({
        pattern: 'second',
        handler: handler2,
        priority: 10,
      });

      const rules = router.getRules();
      expect(rules[0].pattern).toBe('first');
      expect(rules[1].pattern).toBe('second');
    });

    it('should handle negative priority', () => {
      router.addRule({
        pattern: 'negative',
        handler: jest.fn(),
        priority: -10,
      });

      const rules = router.getRules();
      expect(rules[0].priority).toBe(-10);
    });

    it('should add multiple rules', () => {
      router.addRule({ pattern: 'a', handler: jest.fn() });
      router.addRule({ pattern: 'b', handler: jest.fn() });
      router.addRule({ pattern: 'c', handler: jest.fn() });

      expect(router.getRuleCount()).toBe(3);
    });
  });

  describe('route', () => {
    it('should route message to matching string pattern handler', async () => {
      const handler = jest.fn();
      router.addRule({ pattern: 'test', handler });

      const message: WhatsAppMessage = {
        id: 'msg-1',
        from: 'user@s.whatsapp.net',
        content: 'this is a test message',
        timestamp: Date.now(),
      };

      const routed = await router.route(message);

      expect(routed).toBe(true);
      expect(handler).toHaveBeenCalledWith(message);
      expect(handler).toHaveBeenCalledTimes(1);
    });

    it('should route message to matching regex pattern handler', async () => {
      const handler = jest.fn();
      router.addRule({ pattern: /\d+/, handler });

      const message: WhatsAppMessage = {
        id: 'msg-1',
        from: 'user@s.whatsapp.net',
        content: 'message with 123 numbers',
        timestamp: Date.now(),
      };

      const routed = await router.route(message);

      expect(routed).toBe(true);
      expect(handler).toHaveBeenCalledWith(message);
    });

    it('should route message to matching function pattern handler', async () => {
      const handler = jest.fn();
      const patternFn = (msg: WhatsAppMessage) => msg.content.length > 20;

      router.addRule({ pattern: patternFn, handler });

      const message: WhatsAppMessage = {
        id: 'msg-1',
        from: 'user@s.whatsapp.net',
        content: 'this is a very long message that should match',
        timestamp: Date.now(),
      };

      const routed = await router.route(message);

      expect(routed).toBe(true);
      expect(handler).toHaveBeenCalledWith(message);
    });

    it('should not route to non-matching string pattern', async () => {
      const handler = jest.fn();
      router.addRule({ pattern: 'hello', handler });

      const message: WhatsAppMessage = {
        id: 'msg-1',
        from: 'user@s.whatsapp.net',
        content: 'goodbye world',
        timestamp: Date.now(),
      };

      const routed = await router.route(message);

      expect(routed).toBe(false);
      expect(handler).not.toHaveBeenCalled();
    });

    it('should not route to non-matching regex pattern', async () => {
      const handler = jest.fn();
      router.addRule({ pattern: /^start/, handler });

      const message: WhatsAppMessage = {
        id: 'msg-1',
        from: 'user@s.whatsapp.net',
        content: 'this does not start with the pattern',
        timestamp: Date.now(),
      };

      const routed = await router.route(message);

      expect(routed).toBe(false);
      expect(handler).not.toHaveBeenCalled();
    });

    it('should not route to non-matching function pattern', async () => {
      const handler = jest.fn();
      const patternFn = (msg: WhatsAppMessage) => msg.content.includes('magic');

      router.addRule({ pattern: patternFn, handler });

      const message: WhatsAppMessage = {
        id: 'msg-1',
        from: 'user@s.whatsapp.net',
        content: 'no magic word here',
        timestamp: Date.now(),
      };

      const routed = await router.route(message);

      expect(routed).toBe(false);
      expect(handler).not.toHaveBeenCalled();
    });

    it('should route to first matching rule only', async () => {
      const handler1 = jest.fn();
      const handler2 = jest.fn();
      const handler = jest.fn();
      const patternFn = (msg: WhatsAppMessage) => msg.content.includes('magic');

      router.addRule({ pattern: patternFn, handler });

      const message: WhatsAppMessage = {
        id: 'msg-1',
        from: 'user@s.whatsapp.net',
        content: 'no magic word here',
        timestamp: Date.now(),
      };

      const routed = await router.route(message);

      expect(routed).toBe(false);
      expect(handler).not.toHaveBeenCalled();
    });
      const handler = jest.fn();
      const patternFn = (msg: WhatsAppMessage) => msg.content.includes('magic');

      router.addRule({ pattern: patternFn, handler });

      const message: WhatsAppMessage = {
        id: 'msg-1',
        from: 'user@s.whatsapp.net',
        content: 'no magic word here',
        timestamp: Date.now(),
      };

      const routed = await router.route(message);

      expect(routed).toBe(false);
      expect(handler).not.toHaveBeenCalled();
    });

    it('should route to first matching rule only', async () => {
      const handler1 = jest.fn();
      const handler2 = jest.fn();

      router.addRule({ pattern: 'test', handler: handler1 });
      router.addRule({ pattern: /test/, handler: handler2 });

      const message: WhatsAppMessage = {
        id: 'msg-1',
        from: 'user@s.whatsapp.net',
        content: 'this is a test message',
        timestamp: Date.now(),
      };

      const routed = await router.route(message);

      expect(routed).toBe(true);
      expect(handler1).toHaveBeenCalled();
      expect(handler2).not.toHaveBeenCalled();
    });

    it('should respect priority order', async () => {
      const handler1 = jest.fn();
      const handler2 = jest.fn();

      router.addRule({
        pattern: 'test',
        handler: handler1,
        priority: 1,
      });
      router.addRule({
        pattern: 'test',
        handler: handler2,
        priority: 100,
      });

      const message: WhatsAppMessage = {
        id: 'msg-1',
        from: 'user@s.whatsapp.net',
        content: 'this is a test message',
        timestamp: Date.now(),
      };

      await router.route(message);

      expect(handler2).toHaveBeenCalled();
      expect(handler1).not.toHaveBeenCalled();
    });

    it('should route to default handler when no rule matches', async () => {
      const defaultHandler = jest.fn();
      const routerWithDefault = new MessageRouter({ defaultHandler });

      routerWithDefault.addRule({
        pattern: 'hello',
        handler: jest.fn(),
      });

      const message: WhatsAppMessage = {
        id: 'msg-1',
        from: 'user@s.whatsapp.net',
        content: 'no matching pattern here',
        timestamp: Date.now(),
      };

      const routed = await routerWithDefault.route(message);

      expect(routed).toBe(true);
      expect(defaultHandler).toHaveBeenCalledWith(message);
    });

    it('should return false when no rule matches and no default handler', async () => {
      router.addRule({
        pattern: 'hello',
        handler: jest.fn(),
      });

      const message: WhatsAppMessage = {
        id: 'msg-1',
        from: 'user@s.whatsapp.net',
        content: 'no matching pattern here',
        timestamp: Date.now(),
      };

      const routed = await router.route(message);

      expect(routed).toBe(false);
    });

    it('should return false when no rules exist', async () => {
      const message: WhatsAppMessage = {
        id: 'msg-1',
        from: 'user@s.whatsapp.net',
        content: 'any message',
        timestamp: Date.now(),
      };

      const routed = await router.route(message);

      expect(routed).toBe(false);
    });

    it('should handle async handlers', async () => {
      let completed = false;
      const handler = jest.fn().mockImplementation(async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
        completed = true;
      });

      router.addRule({ pattern: 'test', handler });

      const message: WhatsAppMessage = {
        id: 'msg-1',
        from: 'user@s.whatsapp.net',
        content: 'this is a test',
        timestamp: Date.now(),
      };

      const routed = await router.route(message);

      expect(routed).toBe(true);
      expect(completed).toBe(true);
    });

    it('should handle empty content', async () => {
      const handler = jest.fn();
      router.addRule({ pattern: '', handler });

      const message: WhatsAppMessage = {
        id: 'msg-1',
        from: 'user@s.whatsapp.net',
        content: '',
        timestamp: Date.now(),
      };

      const routed = await router.route(message);

      expect(routed).toBe(true);
      expect(handler).toHaveBeenCalledWith(message);
    });

    it('should handle case-sensitive string matching', async () => {
      const handlerLower = jest.fn();
      const handlerUpper = jest.fn();

      router.addRule({ pattern: 'hello', handler: handlerLower });
      router.addRule({ pattern: 'HELLO', handler: handlerUpper });

      const message1: WhatsAppMessage = {
        id: 'msg-1',
        from: 'user@s.whatsapp.net',
        content: 'Say hello to everyone',
        timestamp: Date.now(),
      };

      const message2: WhatsAppMessage = {
        id: 'msg-2',
        from: 'user@s.whatsapp.net',
        content: 'Say HELLO to everyone',
        timestamp: Date.now(),
      };

      await router.route(message1);
      expect(handlerLower).toHaveBeenCalled();
      expect(handlerUpper).not.toHaveBeenCalled();

      handlerLower.mockClear();

      await router.route(message2);
      expect(handlerLower).not.toHaveBeenCalled();
      expect(handlerUpper).toHaveBeenCalled();
    });

    it('should handle case-insensitive regex', async () => {
      const handler = jest.fn();
      router.addRule({ pattern: /hello/i, handler });

      const message: WhatsAppMessage = {
        id: 'msg-1',
        from: 'user@s.whatsapp.net',
        content: 'Say HELLO to everyone',
        timestamp: Date.now(),
      };

      const routed = await router.route(message);

      expect(routed).toBe(true);
      expect(handler).toHaveBeenCalled();
    });

    it('should handle complex regex patterns', async () => {
      const handler = jest.fn();
      router.addRule({ pattern: /@\w+/g, handler });

      const message: WhatsAppMessage = {
        id: 'msg-1',
        from: 'user@s.whatsapp.net',
        content: 'Hello @john and @jane',
        timestamp: Date.now(),
      };

      const routed = await router.route(message);

      expect(routed).toBe(true);
      expect(handler).toHaveBeenCalled();
    });

    it('should pass full message object to handler', async () => {
      const handler = jest.fn();
      router.addRule({ pattern: 'test', handler });

      const message: WhatsAppMessage = {
        id: 'msg-123',
        from: 'user@s.whatsapp.net',
        content: 'this is a test',
        timestamp: 1234567890,
        messageType: 'text',
        groupId: 'group-123@g.us',
        senderName: 'John Doe',
      };

      await router.route(message);

      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'msg-123',
          from: 'user@s.whatsapp.net',
          content: 'this is a test',
          timestamp: 1234567890,
          messageType: 'text',
          groupId: 'group-123@g.us',
          senderName: 'John Doe',
        })
      );
    });
  });

  describe('removeRule', () => {
    it('should remove existing string pattern rule', () => {
      const pattern = 'hello';
      router.addRule({ pattern, handler: jest.fn() });

      const removed = router.removeRule(pattern);

      expect(removed).toBe(true);
      expect(router.getRuleCount()).toBe(0);
    });

    it('should remove existing regex pattern rule', () => {
      const pattern = /hello/i;
      router.addRule({ pattern, handler: jest.fn() });

      const removed = router.removeRule(pattern);

      expect(removed).toBe(true);
      expect(router.getRuleCount()).toBe(0);
    });

    it('should remove existing function pattern rule by reference', () => {
      const patternFn = (msg: WhatsAppMessage) => msg.content.includes('test');
      router.addRule({ pattern: patternFn, handler: jest.fn() });

      const removed = router.removeRule(patternFn);

      expect(removed).toBe(true);
      expect(router.getRuleCount()).toBe(0);
    });

    it('should return false for non-existing rule', () => {
      const removed = router.removeRule('nonexistent');
      expect(removed).toBe(false);
    });

    it('should not remove different rules', () => {
      router.addRule({ pattern: 'hello', handler: jest.fn() });
      router.addRule({ pattern: 'world', handler: jest.fn() });

      const removed = router.removeRule('goodbye');

      expect(removed).toBe(false);
      expect(router.getRuleCount()).toBe(2);
    });

    it('should remove only first matching rule', () => {
      router.addRule({ pattern: 'test', handler: jest.fn() });
      router.addRule({ pattern: 'test', handler: jest.fn() });

      const removed = router.removeRule('test');

      expect(removed).toBe(true);
      expect(router.getRuleCount()).toBe(1);
    });

    it('should handle function comparison correctly', () => {
      const fn1 = (msg: WhatsAppMessage) => msg.content.includes('a');
      const fn2 = (msg: WhatsAppMessage) => msg.content.includes('b');

      router.addRule({ pattern: fn1, handler: jest.fn() });
      router.addRule({ pattern: fn2, handler: jest.fn() });

      const removed = router.removeRule(fn2);

      expect(removed).toBe(true);
      expect(router.getRuleCount()).toBe(1);
    });
  });

  describe('clearRules', () => {
    it('should clear all rules', () => {
      router.addRule({ pattern: 'a', handler: jest.fn() });
      router.addRule({ pattern: 'b', handler: jest.fn() });
      router.addRule({ pattern: 'c', handler: jest.fn() });

      expect(router.getRuleCount()).toBe(3);

      router.clearRules();

      expect(router.getRuleCount()).toBe(0);
    });

    it('should work when no rules exist', () => {
      expect(router.getRuleCount()).toBe(0);
      router.clearRules();
      expect(router.getRuleCount()).toBe(0);
    });

    it('should not affect default handler', async () => {
      const defaultHandler = jest.fn();
      const routerWithDefault = new MessageRouter({ defaultHandler });

      routerWithDefault.addRule({ pattern: 'test', handler: jest.fn() });
      routerWithDefault.clearRules();

      const message: WhatsAppMessage = {
        id: 'msg-1',
        from: 'user@s.whatsapp.net',
        content: 'anything',
        timestamp: Date.now(),
      };

      await routerWithDefault.route(message);

      expect(defaultHandler).toHaveBeenCalled();
    });
  });

  describe('getRuleCount', () => {
    it('should return 0 for new router', () => {
      expect(router.getRuleCount()).toBe(0);
    });

    it('should return correct count after adding rules', () => {
      router.addRule({ pattern: 'a', handler: jest.fn() });
      expect(router.getRuleCount()).toBe(1);

      router.addRule({ pattern: 'b', handler: jest.fn() });
      expect(router.getRuleCount()).toBe(2);
    });

    it('should return correct count after removing rules', () => {
      router.addRule({ pattern: 'a', handler: jest.fn() });
      router.addRule({ pattern: 'b', handler: jest.fn() });

      router.removeRule('a');
      expect(router.getRuleCount()).toBe(1);
    });

    it('should return 0 after clearing rules', () => {
      router.addRule({ pattern: 'a', handler: jest.fn() });
      router.clearRules();

      expect(router.getRuleCount()).toBe(0);
    });
  });

  describe('getRules', () => {
    it('should return empty array for new router', () => {
      const rules = router.getRules();
      expect(rules).toEqual([]);
    });

    it('should return copy of rules', () => {
      router.addRule({ pattern: 'test', handler: jest.fn() });

      const rules1 = router.getRules();
      const rules2 = router.getRules();

      expect(rules1).not.toBe(rules2);
      expect(rules1).toEqual(rules2);
    });

    it('should return rules in priority order', () => {
      router.addRule({ pattern: 'low', handler: jest.fn(), priority: 1 });
      router.addRule({ pattern: 'high', handler: jest.fn(), priority: 100 });

      const rules = router.getRules();

      expect(rules[0].pattern).toBe('high');
      expect(rules[1].pattern).toBe('low');
    });

    it('modifying returned array should not affect router', () => {
      router.addRule({ pattern: 'test', handler: jest.fn() });

      const rules = router.getRules();
      rules.pop();

      expect(router.getRuleCount()).toBe(1);
    });
  });

  describe('setDefaultHandler', () => {
    it('should set default handler', async () => {
      const defaultHandler = jest.fn();
      router.setDefaultHandler(defaultHandler);

      const message: WhatsAppMessage = {
        id: 'msg-1',
        from: 'user@s.whatsapp.net',
        content: 'no match',
        timestamp: Date.now(),
      };

      const routed = await router.route(message);

      expect(routed).toBe(true);
      expect(defaultHandler).toHaveBeenCalledWith(message);
    });

    it('should replace existing default handler', async () => {
      const handler1 = jest.fn();
      const handler2 = jest.fn();

      router.setDefaultHandler(handler1);
      router.setDefaultHandler(handler2);

      const message: WhatsAppMessage = {
        id: 'msg-1',
        from: 'user@s.whatsapp.net',
        content: 'no match',
        timestamp: Date.now(),
      };

      await router.route(message);

      expect(handler1).not.toHaveBeenCalled();
      expect(handler2).toHaveBeenCalled();
    });

    it('should work after clearing rules', async () => {
      const defaultHandler = jest.fn();
      router.setDefaultHandler(defaultHandler);
      router.addRule({ pattern: 'test', handler: jest.fn() });
      router.clearRules();

      const message: WhatsAppMessage = {
        id: 'msg-1',
        from: 'user@s.whatsapp.net',
        content: 'no match',
        timestamp: Date.now(),
      };

      await router.route(message);
      expect(defaultHandler).toHaveBeenCalled();
    });
  });

  describe('removeDefaultHandler', () => {
    it('should remove default handler', async () => {
      const defaultHandler = jest.fn();
      router.setDefaultHandler(defaultHandler);
      router.removeDefaultHandler();

      const message: WhatsAppMessage = {
        id: 'msg-1',
        from: 'user@s.whatsapp.net',
        content: 'no match',
        timestamp: Date.now(),
      };

      const routed = await router.route(message);

      expect(routed).toBe(false);
      expect(defaultHandler).not.toHaveBeenCalled();
    });

    it('should work when no default handler exists', () => {
      expect(() => router.removeDefaultHandler()).not.toThrow();
    });
  });

  describe('error handling', () => {
    it('should handle handler that throws', async () => {
      const errorHandler = jest
        .fn()
        .mockRejectedValue(new Error('Handler error'));
      router.addRule({ pattern: 'test', handler: errorHandler });

      const message: WhatsAppMessage = {
        id: 'msg-1',
        from: 'user@s.whatsapp.net',
        content: 'this is a test',
        timestamp: Date.now(),
      };

      await expect(router.route(message)).rejects.toThrow('Handler error');
    });

    it('should handle function pattern that throws', async () => {
      const handler = jest.fn();
      const throwingPattern = () => {
        throw new Error('Pattern error');
      };

      router.addRule({ pattern: throwingPattern, handler });

      const message: WhatsAppMessage = {
        id: 'msg-1',
        from: 'user@s.whatsapp.net',
        content: 'any content',
        timestamp: Date.now(),
      };

      // Should not match and not throw
      const routed = await router.route(message);

      expect(routed).toBe(false);
      expect(handler).not.toHaveBeenCalled();
    });

    it('should continue checking rules after non-matching function pattern throws', async () => {
      const handler = jest.fn();

      router.addRule({
        pattern: () => {
          throw new Error('Pattern error');
        },
        handler: jest.fn(),
      });
      router.addRule({ pattern: 'test', handler });

      const message: WhatsAppMessage = {
        id: 'msg-1',
        from: 'user@s.whatsapp.net',
        content: 'this is a test',
        timestamp: Date.now(),
      };

      const routed = await router.route(message);

      expect(routed).toBe(true);
      expect(handler).toHaveBeenCalled();
    });
  });

  describe('edge cases', () => {
    it('should handle special characters in string patterns', async () => {
      const handler = jest.fn();
      router.addRule({ pattern: '@jclaw', handler });

      const message: WhatsAppMessage = {
        id: 'msg-1',
        from: 'user@s.whatsapp.net',
        content: 'Hello @jclaw how are you?',
        timestamp: Date.now(),
      };

      const routed = await router.route(message);

      expect(routed).toBe(true);
      expect(handler).toHaveBeenCalled();
    });

    it('should handle unicode in content', async () => {
      const handler = jest.fn();
      router.addRule({ pattern: '🎉', handler });

      const message: WhatsAppMessage = {
        id: 'msg-1',
        from: 'user@s.whatsapp.net',
        content: 'Let us celebrate 🎉 today!',
        timestamp: Date.now(),
      };

      const routed = await router.route(message);

      expect(routed).toBe(true);
      expect(handler).toHaveBeenCalled();
    });

    it('should handle very long content', async () => {
      const handler = jest.fn();
      router.addRule({ pattern: 'needle', handler });

      const message: WhatsAppMessage = {
        id: 'msg-1',
        from: 'user@s.whatsapp.net',
        content: 'a'.repeat(10000) + 'needle' + 'b'.repeat(10000),
        timestamp: Date.now(),
      };

      const routed = await router.route(message);

      expect(routed).toBe(true);
      expect(handler).toHaveBeenCalled();
    });

    it('should handle message with only whitespace', async () => {
      const handler = jest.fn();
      router.addRule({ pattern: ' ', handler });

      const message: WhatsAppMessage = {
        id: 'msg-1',
        from: 'user@s.whatsapp.net',
        content: '   ',
        timestamp: Date.now(),
      };

      const routed = await router.route(message);

      expect(routed).toBe(true);
      expect(handler).toHaveBeenCalled();
    });

    it('should handle empty router with default handler', async () => {
      const defaultHandler = jest.fn();
      const routerWithDefault = new MessageRouter({ defaultHandler });

      const message: WhatsAppMessage = {
        id: 'msg-1',
        from: 'user@s.whatsapp.net',
        content: 'anything',
        timestamp: Date.now(),
      };

      const routed = await routerWithDefault.route(message);

      expect(routed).toBe(true);
      expect(defaultHandler).toHaveBeenCalled();
    });

    it('should handle multiple consecutive routes', async () => {
      const handler = jest.fn();
      router.addRule({ pattern: 'test', handler });

      const message: WhatsAppMessage = {
        id: 'msg-1',
        from: 'user@s.whatsapp.net',
        content: 'this is a test',
        timestamp: Date.now(),
      };

      await router.route(message);
      await router.route(message);
      await router.route(message);

      expect(handler).toHaveBeenCalledTimes(3);
    });

    it('should handle regex with special characters', async () => {
      const handler = jest.fn();
      router.addRule({ pattern: /\$\d+\.\d{2}/, handler });

      const message: WhatsAppMessage = {
        id: 'msg-1',
        from: 'user@s.whatsapp.net',
        content: 'The price is $49.99 today',
        timestamp: Date.now(),
      };

      const routed = await router.route(message);

      expect(routed).toBe(true);
      expect(handler).toHaveBeenCalled();
    });

    it('should handle complex routing scenario', async () => {
      const adminHandler = jest.fn();
      const helpHandler = jest.fn();
      const defaultHandler = jest.fn();

      const router = new MessageRouter({ defaultHandler });

      router.addRule({
        pattern: (msg) => msg.from.includes('admin'),
        handler: adminHandler,
        priority: 100,
      });
      router.addRule({
        pattern: /help|support/i,
        handler: helpHandler,
        priority: 50,
      });

      // Admin message
      const adminMessage: WhatsAppMessage = {
        id: 'msg-1',
        from: 'admin@s.whatsapp.net',
        content: 'I need help with something',
        timestamp: Date.now(),
      };

      await router.route(adminMessage);
      expect(adminHandler).toHaveBeenCalled();
      expect(helpHandler).not.toHaveBeenCalled();

      // Help message
      const helpMessage: WhatsAppMessage = {
        id: 'msg-2',
        from: 'user@s.whatsapp.net',
        content: 'Can someone help me?',
        timestamp: Date.now(),
      };

      await router.route(helpMessage);
      expect(helpHandler).toHaveBeenCalled();

      // Default message
      const defaultMessage: WhatsAppMessage = {
        id: 'msg-3',
        from: 'user@s.whatsapp.net',
        content: 'Just saying hello',
        timestamp: Date.now(),
      };

      await router.route(defaultMessage);
      expect(defaultHandler).toHaveBeenCalled();
    });
  });

  describe('type exports', () => {
    it('should have correct RouteRule interface', () => {
      const rule: RouteRule = {
        pattern: 'test',
        handler: jest.fn(),
        priority: 10,
      };

      expect(rule.pattern).toBe('test');
      expect(rule.priority).toBe(10);
    });

    it('should have correct PatternType', () => {
      const stringPattern: PatternType = 'test';
      const regexPattern: PatternType = /test/;
      const funcPattern: PatternType = (msg) => true;

      expect(stringPattern).toBe('test');
      expect(regexPattern).toBeInstanceOf(RegExp);
      expect(typeof funcPattern).toBe('function');
    });

    it('should have correct RouterOptions interface', () => {
      const options: RouterOptions = {
        defaultHandler: jest.fn(),
      };

      expect(options.defaultHandler).toBeDefined();
    });
  });
});
