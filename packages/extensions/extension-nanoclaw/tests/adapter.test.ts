/**
 * NanoClaw Adapter Tests
 */

import { NanoClawAdapter } from '../src/adapter.js';

describe('NanoClawAdapter', () => {
  let adapter: NanoClawAdapter;

  beforeEach(() => {
    adapter = new NanoClawAdapter();
  });

  describe('constructor', () => {
    it('should create adapter with default options', () => {
      expect(adapter).toBeDefined();
    });

    it('should accept custom options', () => {
      const customAdapter = new NanoClawAdapter({
        nanoclawPath: '/custom/nanoclaw',
        timeout: 60000,
      });
      expect(customAdapter).toBeDefined();
    });
  });

  describe('sendMessage', () => {
    it('should return success result', async () => {
      const result = await adapter.sendMessage({
        to: 'test@example.com',
        content: 'Hello',
      });
      expect(result.success).toBe(true);
    });
  });

  describe('receiveMessages', () => {
    it('should return empty array by default', async () => {
      const messages = await adapter.receiveMessages();
      expect(Array.isArray(messages)).toBe(true);
    });
  });

  describe('isAvailable', () => {
    it('should return true for stub implementation', async () => {
      const available = await adapter.isAvailable();
      expect(available).toBe(true);
    });
  });

  describe('start', () => {
    it('should return success result', async () => {
      const result = await adapter.start();
      expect(result.success).toBe(true);
    });
  });

  describe('stop', () => {
    it('should return success result', async () => {
      const result = await adapter.stop();
      expect(result.success).toBe(true);
    });
  });
});
