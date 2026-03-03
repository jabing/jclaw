/**
 * NanoClaw Extension Entry Point
 *
 * Main entry file for the NanoClaw extension that provides
 * WhatsApp messaging capabilities for JClaw.
 *
 * @module @jclaw/extension-nanoclaw
 */

import type { Extension, AgentRuntime } from '@jclaw/core';
import { NANOCLAW_CAPABILITIES } from './capabilities.js';
import { NanoClawAdapter, type WhatsAppMessage } from './adapter.js';
import { MessageRouter } from './router.js';
import { TaskTrigger, createTaskTrigger } from './trigger.js';
import {
  MessageFormatter,
  createMessageFormatter,
  type MessageFormatterConfig,
  type FormattedSegment,
} from './formatter.js';

// Component instances
let adapter: NanoClawAdapter | null = null;
let router: MessageRouter | null = null;
let trigger: TaskTrigger | null = null;
let runtime: AgentRuntime | null = null;

/**
 * NanoClaw Extension
 *
 * Provides WhatsApp messaging entry point for JClaw including:
 * - Message receiving from WhatsApp
 * - Message sending to WhatsApp
 * - Task triggering from messages
 */
export const nanoclawExtension: Extension = {
  name: 'nanoclaw',
  version: '0.1.0',
  description: 'NanoClaw extension for WhatsApp messaging entry point',
  capabilities: NANOCLAW_CAPABILITIES,

  /**
   * Install the extension into the runtime
   * @param _runtime - The agent runtime instance
   */
  async install(_runtime: AgentRuntime): Promise<void> {
    runtime = _runtime;

    // 1. Create adapter
    adapter = new NanoClawAdapter();

    // 2. Create router
    router = new MessageRouter();

    // 3. Create trigger
    trigger = createTaskTrigger(_runtime, {
      commandPrefix: '@jclaw',
      requirePrefix: true,
      defaultTimeout: 60000,
    });

    // 4. Set up routing rule for @jclaw messages
    router.addRule({
      pattern: '@jclaw',
      handler: async (message: WhatsAppMessage) => {
        if (!trigger) return;

        try {
          const result = await trigger.executeTask(message);

          if (result.triggered && adapter) {
            // Send response back to WhatsApp
            const responseContent = result.result?.success
              ? `✅ Task completed:\n${result.result.output || 'Done'}`
              : `❌ Task failed:\n${result.error || 'Unknown error'}`;

            await adapter.sendMessage({
              to: message.from,
              content: responseContent,
            });
          }
        } catch (error) {
          console.error('Error handling @jclaw message:', error);

          // Send error response
          if (adapter) {
            await adapter.sendMessage({
              to: message.from,
              content: '❌ Error processing your request. Please try again.',
            });
          }
        }
      },
      priority: 100, // High priority for @jclaw messages
    });

    // 5. Connect adapter to router
    adapter.on('message', async (message: WhatsAppMessage) => {
      if (router) {
        await router.route(message);
      }
    });

    // 6. Start adapter connection
    const connectResult = await adapter.connect();
    if (!connectResult.success) {
      console.warn('NanoClaw adapter connection failed:', connectResult.error);
    }

    console.log('NanoClaw extension installed');
  },

  /**
   * Uninstall and cleanup the extension
   */
  async uninstall(): Promise<void> {
    // Stop adapter and disconnect
    if (adapter) {
      await adapter.stop();
      adapter = null;
    }

    // Clear router rules
    if (router) {
      router.clearRules();
      router = null;
    }

    // Clear trigger reference
    trigger = null;

    // Clear runtime reference
    runtime = null;

    console.log('NanoClaw extension uninstalled');
  },
};

// Export accessor functions
export function getAdapter(): NanoClawAdapter | null {
  return adapter;
}

export function getRouter(): MessageRouter | null {
  return router;
}

export function getTrigger(): TaskTrigger | null {
  return trigger;
}

export function getRuntime(): AgentRuntime | null {
  return runtime;
}

// Re-export for external use
export {
  NANOCLAW_CAPABILITIES,
  NanoClawAdapter,
  MessageRouter,
  TaskTrigger,
  createTaskTrigger,
  MessageFormatter,
  createMessageFormatter,
  type WhatsAppMessage,
};

export type { TaskTriggerConfig, TaskTriggerResult } from './trigger.js';

export type { MessageFormatterConfig, FormattedSegment } from './formatter.js';

export type { RouteRule, PatternType, RouterOptions } from './router.js';

export type {
  NanoClawOptions,
  NanoClawConnectionConfig,
  ConnectionType,
  SendMessageOptions,
  NanoClawResult,
} from './adapter.js';

// Default export for convenience
export default nanoclawExtension;
