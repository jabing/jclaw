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
import { NanoClawAdapter } from './adapter.js';
import { MessageRouter } from './message-router.js';

// 创建适配器和路由器实例
let adapter: NanoClawAdapter | null = null;
let router: MessageRouter | null = null;

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
    adapter = new NanoClawAdapter();
    router = new MessageRouter();
    console.log('NanoClaw extension installed');
  },

  /**
   * Uninstall and cleanup the extension
   */
  async uninstall(): Promise<void> {
    adapter = null;
    router = null;
    console.log('NanoClaw extension uninstalled');
  },
};

// 导出适配器和路由器供外部使用
export function getAdapter(): NanoClawAdapter | null {
  return adapter;
}

export function getRouter(): MessageRouter | null {
  return router;
}

// Re-export for external use
export { NANOCLAW_CAPABILITIES, NanoClawAdapter, MessageRouter };

// Default export for convenience
export default nanoclawExtension;
