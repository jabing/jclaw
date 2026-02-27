/**
 * Tests for NanoClaw Extension
 *
 * @module @jclaw/extension-nanoclaw/tests
 */

import { nanoclawExtension, NANOCLAW_CAPABILITIES } from '../src/index';
import type { AgentRuntime } from '@jclaw/core';

describe('NanoClaw Extension', () => {
  describe('Extension Definition', () => {
    it('should have correct name', () => {
      expect(nanoclawExtension.name).toBe('nanoclaw');
    });

    it('should have correct version', () => {
      expect(nanoclawExtension.version).toBe('0.1.0');
    });

    it('should have a description', () => {
      expect(nanoclawExtension.description).toBe(
        'NanoClaw extension for WhatsApp messaging entry point'
      );
    });

    it('should have capabilities defined', () => {
      expect(nanoclawExtension.capabilities).toBeDefined();
      expect(Array.isArray(nanoclawExtension.capabilities)).toBe(true);
    });

    it('should have install method', () => {
      expect(typeof nanoclawExtension.install).toBe('function');
    });

    it('should have uninstall method', () => {
      expect(typeof nanoclawExtension.uninstall).toBe('function');
    });
  });

  describe('Capabilities', () => {
    it('should export NANOCLAW_CAPABILITIES array', () => {
      expect(NANOCLAW_CAPABILITIES).toBeDefined();
      expect(Array.isArray(NANOCLAW_CAPABILITIES)).toBe(true);
    });

    it('should have exactly 3 capabilities', () => {
      expect(NANOCLAW_CAPABILITIES).toHaveLength(3);
    });

    it('should include message_receive capability', () => {
      const messageReceive = NANOCLAW_CAPABILITIES.find(
        (c) => c.name === 'message_receive'
      );
      expect(messageReceive).toBeDefined();
      expect(messageReceive?.description).toBe(
        'Receive messages from WhatsApp via NanoClaw'
      );
      expect(messageReceive?.inputSchema).toBeDefined();
    });

    it('should include message_send capability', () => {
      const messageSend = NANOCLAW_CAPABILITIES.find(
        (c) => c.name === 'message_send'
      );
      expect(messageSend).toBeDefined();
      expect(messageSend?.description).toBe(
        'Send messages to WhatsApp via NanoClaw'
      );
      expect(messageSend?.inputSchema).toBeDefined();
    });

    it('should include task_trigger capability', () => {
      const taskTrigger = NANOCLAW_CAPABILITIES.find(
        (c) => c.name === 'task_trigger'
      );
      expect(taskTrigger).toBeDefined();
      expect(taskTrigger?.description).toBe(
        'Trigger JClaw tasks from messages'
      );
      expect(taskTrigger?.inputSchema).toBeDefined();
    });

    it('message_receive capability should have required input schema', () => {
      const messageReceive = NANOCLAW_CAPABILITIES.find(
        (c) => c.name === 'message_receive'
      );
      const schema = messageReceive?.inputSchema as {
        properties: Record<string, unknown>;
        required: string[];
      };

      expect(schema.properties.from).toBeDefined();
      expect(schema.properties.content).toBeDefined();
      expect(schema.properties.timestamp).toBeDefined();
      expect(schema.required).toContain('from');
      expect(schema.required).toContain('content');
    });

    it('message_send capability should have required input schema', () => {
      const messageSend = NANOCLAW_CAPABILITIES.find(
        (c) => c.name === 'message_send'
      );
      const schema = messageSend?.inputSchema as {
        properties: Record<string, unknown>;
        required: string[];
      };

      expect(schema.properties.to).toBeDefined();
      expect(schema.properties.content).toBeDefined();
      expect(schema.required).toContain('to');
      expect(schema.required).toContain('content');
    });

    it('task_trigger capability should have required input schema', () => {
      const taskTrigger = NANOCLAW_CAPABILITIES.find(
        (c) => c.name === 'task_trigger'
      );
      const schema = taskTrigger?.inputSchema as {
        properties: Record<string, unknown>;
        required: string[];
      };

      expect(schema.properties.prompt).toBeDefined();
      expect(schema.properties.context).toBeDefined();
      expect(schema.required).toContain('prompt');
    });
  });

  describe('Extension Lifecycle', () => {
    it('should install without errors', async () => {
      const mockRuntime: AgentRuntime = {
        execute: jest.fn(),
        start: jest.fn(),
        stop: jest.fn(),
        context: {} as never,
        executionMode: 'local',
      };

      await expect(
        nanoclawExtension.install(mockRuntime)
      ).resolves.not.toThrow();
    });

    it('should uninstall without errors', async () => {
      await expect(nanoclawExtension.uninstall()).resolves.not.toThrow();
    });
  });
});
