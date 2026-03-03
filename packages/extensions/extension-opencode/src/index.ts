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
import { LSPBridge } from './lsp-bridge.js';
import { handleCodeEdit } from './handlers/code-edit.js';
import { handleRefactor } from './handlers/refactor.js';
import { handleAnalyze } from './handlers/analyze.js';

/**
 * Extension state for managing instances
 */
interface ExtensionState {
  adapter: OpenCodeAdapter;
  lspBridge: LSPBridge | null;
}

/**
 * Singleton state instance
 */
let state: ExtensionState | null = null;

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
    // Create adapter and LSP bridge
    const adapter = new OpenCodeAdapter();
    const lspBridge = new LSPBridge({
      command: 'typescript-language-server',
      args: ['--stdio'],
      requestTimeout: 30000,
    });

    // Store state
    state = { adapter, lspBridge };

    try {
      // Initialize LSP bridge
      await lspBridge.initialize();
      console.log('OpenCode extension installed with LSP bridge initialized');
    } catch (error) {
      console.warn(
        'Failed to initialize LSP bridge, continuing without LSP:',
        error
      );
    }
  },

  /**
   * Uninstall and cleanup the extension
   */
  async uninstall(): Promise<void> {
    if (state) {
      // Shutdown LSP bridge
      if (state.lspBridge) {
        try {
          await state.lspBridge.shutdown();
        } catch (error) {
          console.warn('Error during LSP bridge shutdown:', error);
        }
      }

      // Clear state
      state = null;
    }

    console.log('OpenCode extension uninstalled');
  },
};

/**
 * Get the extension state
 * @returns The extension state or null if extension not installed
 */
export function getState(): ExtensionState | null {
  return state;
}

/**
 * Get the adapter instance
 * @returns The OpenCodeAdapter instance or null if extension not installed
 */
export function getAdapter(): OpenCodeAdapter | null {
  return state?.adapter ?? null;
}

/**
 * Get the LSP bridge instance
 * @returns The LSPBridge instance or null if extension not installed
 */
export function getLSPBridge(): LSPBridge | null {
  return state?.lspBridge ?? null;
}

// Re-export handlers
export { handleCodeEdit, handleRefactor, handleAnalyze };

// Re-export for external use
export { OPENCODE_CAPABILITIES, OpenCodeAdapter };
export {
  LSPBridge,
  LSPBridgeOptions,
  LSPConnectionState,
  LSPError,
} from './lsp-bridge.js';

// Default export for convenience
export default opencodeExtension;
