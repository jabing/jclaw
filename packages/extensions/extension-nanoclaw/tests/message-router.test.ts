/**
 * Message Router Tests
 */

import { MessageRouter } from '../src/message-router.js';
import type { Message } from '../src/adapter.js';

describe('MessageRouter', () => {
  let router: MessageRouter;

  beforeEach(() => {
    router = new MessageRouter();
  });

  describe('constructor', () => {
    it('should create router without options', () => {
      expect(router).toBeDefined();
      expect(router.getRuleCount()).toBe(0);
    });

    it('should accept default handler', () => {
      const defaultHandler = jest.fn();
      const customRouter = new MessageRouter({ defaultHandler });
      expect(customRouter).toBeDefined();
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
  });

  describe('removeRule', () => {
    it('should remove existing rule', () => {
      const pattern = 'hello';
      router.addRule({ pattern, handler: jest.fn() });
      const removed = router.removeRule(pattern);
      expect(removed).toBe(true);
      expect(router.getRuleCount()).toBe(0);
    });

    it('should return false for non-existing rule', () => {
      const removed = router.removeRule('nonexistent');
      expect(removed).toBe(false);
    });
  });

  describe('route', () => {
    it('should route message to matching handler', async () => {
      const handler = jest.fn();
      router.addRule({ pattern: 'test', handler });

      const message: Message = {
        from: 'user@example.com',
        content: 'this is a test message',
      };

      const routed = await router.route(message);
      expect(routed).toBe(true);
      expect(handler).toHaveBeenCalledWith(message);
    });

    it('should route message to regex handler', async () => {
      const handler = jest.fn();
      router.addRule({ pattern: /\d+/, handler });

      const message: Message = {
        from: 'user@example.com',
        content: 'message with 123 numbers',
      };

      const routed = await router.route(message);
      expect(routed).toBe(true);
      expect(handler).toHaveBeenCalled();
    });

    it('should use default handler when no match', async () => {
      const defaultHandler = jest.fn();
      const customRouter = new MessageRouter({ defaultHandler });

      const message: Message = {
        from: 'user@example.com',
        content: 'no matching pattern',
      };

      const routed = await customRouter.route(message);
      expect(routed).toBe(true);
      expect(defaultHandler).toHaveBeenCalledWith(message);
    });

    it('should return false when no handler matches', async () => {
      const message: Message = {
        from: 'user@example.com',
        content: 'no matching pattern',
      };

      const routed = await router.route(message);
      expect(routed).toBe(false);
    });
  });

  describe('clearRules', () => {
    it('should clear all rules', () => {
      router.addRule({ pattern: 'a', handler: jest.fn() });
      router.addRule({ pattern: 'b', handler: jest.fn() });
      expect(router.getRuleCount()).toBe(2);

      router.clearRules();
      expect(router.getRuleCount()).toBe(0);
    });
  });
});
