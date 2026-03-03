/**
 * Integration Tests for NanoClaw Extension
 */

import type { AgentRuntime } from '@jclaw/core';

// Mock the adapter module before importing the extension
jest.mock('../src/adapter.js', () => {
  const { EventEmitter } = require('events');
  
  class MockNanoClawAdapter extends EventEmitter {
    private connectionState: string = 'disconnected';
    
    async connect(): Promise<{ success: boolean; error?: string }> {
      this.connectionState = 'connected';
      return { success: true };
    }
    
    async stop(): Promise<void> {
      this.connectionState = 'disconnected';
    }
    
    async sendMessage(): Promise<{ success: boolean }> {
      return { success: true };
    }
    
    isConnected(): boolean {
      return this.connectionState === 'connected';
    }
    
    getConnectionState(): string {
      return this.connectionState;
    }
  }
  
  return {
    NanoClawAdapter: MockNanoClawAdapter,
    __esModule: true,
  };
});

import { nanoclawExtension, getAdapter, getRouter } from '../src/index.js';
import { NanoClawAdapter } from '../src/adapter.js';
import { MessageRouter } from '../src/router.js';

describe('NanoClaw Extension Integration', () => {
  describe('Extension Loading', () => {
    it('should have correct extension metadata', () => {
      expect(nanoclawExtension.name).toBe('nanoclaw');
      expect(nanoclawExtension.version).toBe('0.1.0');
      expect(nanoclawExtension.description).toContain('WhatsApp');
    });

    it('should have all required capabilities', () => {
      const capabilities = nanoclawExtension.capabilities;
      expect(capabilities).toHaveLength(3);

      const names = capabilities.map((c) => c.name);
      expect(names).toContain('message_receive');
      expect(names).toContain('message_send');
      expect(names).toContain('task_trigger');
    });

    it('should have install and uninstall lifecycle methods', () => {
      expect(typeof nanoclawExtension.install).toBe('function');
      expect(typeof nanoclawExtension.uninstall).toBe('function');
    });
  });

  describe('Adapter Integration', () => {
    it('should create adapter on install', async () => {
      await nanoclawExtension.install({} as AgentRuntime);
      const adapter = getAdapter();
      expect(adapter).toBeInstanceOf(NanoClawAdapter);
      await nanoclawExtension.uninstall();
    });

    it('should clear adapter on uninstall', async () => {
      await nanoclawExtension.install({} as AgentRuntime);
      await nanoclawExtension.uninstall();
      const adapter = getAdapter();
      expect(adapter).toBeNull();
    });
  });

  describe('Router Integration', () => {
    it('should create router on install', async () => {
      await nanoclawExtension.install({} as AgentRuntime);
      const router = getRouter();
      expect(router).toBeInstanceOf(MessageRouter);
      await nanoclawExtension.uninstall();
    });

    it('should clear router on uninstall', async () => {
      await nanoclawExtension.install({} as AgentRuntime);
      await nanoclawExtension.uninstall();
      const router = getRouter();
      expect(router).toBeNull();
    });
  });

  describe('Capability Integration', () => {
    it('should have message_receive capability with correct schema', () => {
      const cap = nanoclawExtension.capabilities.find(
        (c) => c.name === 'message_receive'
      );
      expect(cap).toBeDefined();
      expect(cap?.inputSchema).toBeDefined();
    });

    it('should have message_send capability with correct schema', () => {
      const cap = nanoclawExtension.capabilities.find(
        (c) => c.name === 'message_send'
      );
      expect(cap).toBeDefined();
      expect(cap?.inputSchema).toBeDefined();
    });

    it('should have task_trigger capability with correct schema', () => {
      const cap = nanoclawExtension.capabilities.find(
        (c) => c.name === 'task_trigger'
      );
      expect(cap).toBeDefined();
      expect(cap?.inputSchema).toBeDefined();
    });
  });

  describe('Runtime Compatibility', () => {
    it('should be compatible with AgentRuntime interface', () => {
      // Verify extension implements Extension interface correctly
      const ext = nanoclawExtension;
      expect(ext.name).toBeDefined();
      expect(ext.version).toBeDefined();
      expect(ext.description).toBeDefined();
      expect(ext.capabilities).toBeDefined();
      expect(ext.install).toBeDefined();
      expect(ext.uninstall).toBeDefined();
    });
  });

  describe('Default Export', () => {
    it('should export extension as default', () => {
      expect(nanoclawExtension).toBeDefined();
      expect(nanoclawExtension.name).toBe('nanoclaw');
    });
  });
});
