/**
 * OpenCode Extension Entry Point
 *
 * Main entry file for the OpenCode extension that provides
 * professional coding capabilities with LSP support.
 *
 * @module @jclaw/extension-opencode
 */

import type { Extension, AgentRuntime } from '@jclaw/core';
import { OPENCODE_CAPABILITIES } from './capabilities.js';
import { OpenCodeAdapter } from './adapter.js';

/**
 * Singleton adapter instance
 */
let adapter: OpenCodeAdapter | null = null;

/**
 * OpenCode Extension
 *
 * Provides AI-powered coding capabilities including:
 * - Code editing with LSP context
 * - Refactoring operations
 * - Code analysis and pattern detection
 */
export const opencodeExtension: Extension = {
  name: 'opencode',
  version: '0.1.0',
  description: 'OpenCode extension for professional coding with LSP support',
  capabilities: OPENCODE_CAPABILITIES,

  /**
   * Install the extension into the runtime
   * @param _runtime - The agent runtime instance
   */
  async install(_runtime: AgentRuntime): Promise<void> {
    adapter = new OpenCodeAdapter();
    console.log('OpenCode extension installed');
  },

  /**
   * Uninstall and cleanup the extension
   */
  async uninstall(): Promise<void> {
    adapter = null;
    console.log('OpenCode extension uninstalled');
  },
};

/**
 * Get the adapter instance
 * @returns The OpenCodeAdapter instance or null if extension not installed
 */
export function getAdapter(): OpenCodeAdapter | null {
  return adapter;
}

// Re-export for external use
export { OPENCODE_CAPABILITIES, OpenCodeAdapter };

// Default export for convenience
export default opencodeExtension;
