/**
 * OpenCode Extension Capabilities
 *
 * Defines the capabilities provided by the OpenCode extension.
 * Each capability represents a distinct feature that can be invoked.
 *
 * @module @jclaw/extension-opencode/capabilities
 */

import type { Capability } from '@jclaw/core';
import type { LSPBridge } from './lsp-bridge.js';
import type { OpenCodeAdapter } from './adapter.js';
import { handleCodeEdit } from './handlers/code-edit.js';
import { handleRefactor } from './handlers/refactor.js';
import { handleAnalyze } from './handlers/analyze.js';

/**
 * Dependencies required for OpenCode capability handlers
 */
export interface OpenCodeHandlerDeps {
  lspBridge: LSPBridge;
  openCodeAdapter: OpenCodeAdapter;
}

/**
 * Create the code_edit capability with bound dependencies
 */
export function createCodeEditCapability(
  deps: OpenCodeHandlerDeps
): Capability {
  return {
    name: 'code_edit',
    description: 'Edit code using AI with LSP context',
    inputSchema: {
      type: 'object',
      properties: {
        file: { type: 'string', description: 'Path to the file to edit' },
        instruction: {
          type: 'string',
          description: 'Natural language instruction for the edit',
        },
      },
      required: ['file', 'instruction'],
    },
    handler: async (input: unknown) => {
      return handleCodeEdit(
        input as Parameters<typeof handleCodeEdit>[0],
        deps.lspBridge,
        deps.openCodeAdapter
      );
    },
  };
}

/**
 * Create the refactor capability with bound dependencies
 */
export function createRefactorCapability(
  deps: OpenCodeHandlerDeps
): Capability {
  return {
    name: 'refactor',
    description: 'Refactor code using AI',
    inputSchema: {
      type: 'object',
      properties: {
        target: {
          type: 'string',
          description: 'Target code element to refactor',
        },
        strategy: {
          type: 'string',
          enum: ['extract', 'inline', 'rename'],
          description: 'Refactoring strategy to apply',
        },
        newName: {
          type: 'string',
          description: 'New name for rename strategy',
        },
        file: {
          type: 'string',
          description: 'File path (if target is a symbol within a file)',
        },
        line: {
          type: 'number',
          description: 'Line number (0-indexed)',
        },
        character: {
          type: 'number',
          description: 'Character position (0-indexed)',
        },
      },
      required: ['target'],
    },
    handler: async (input: unknown) => {
      return handleRefactor(
        input as Parameters<typeof handleRefactor>[0],
        deps.lspBridge,
        deps.openCodeAdapter
      );
    },
  };
}

/**
 * Create the analyze capability with bound dependencies
 */
export function createAnalyzeCapability(deps: OpenCodeHandlerDeps): Capability {
  return {
    name: 'analyze',
    description: 'Analyze code structure and patterns',
    inputSchema: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'Path to analyze' },
        depth: { type: 'number', description: 'Analysis depth level' },
      },
      required: ['path'],
    },
    handler: async (input: unknown) => {
      return handleAnalyze(
        input as Parameters<typeof handleAnalyze>[0],
        deps.lspBridge,
        deps.openCodeAdapter
      );
    },
  };
}

/**
 * Create all capabilities with bound dependencies
 */
export function createOpenCodeCapabilities(
  deps: OpenCodeHandlerDeps
): Capability[] {
  return [
    createCodeEditCapability(deps),
    createRefactorCapability(deps),
    createAnalyzeCapability(deps),
  ];
}

/**
 * Handler map with proper types
 * Maps capability names to their handler functions
 */
export const OPENCODE_HANDLERS = {
  code_edit: handleCodeEdit,
  refactor: handleRefactor,
  analyze: handleAnalyze,
} as const;

/**
 * Type for OpenCode capability names
 */
export type OpenCodeCapabilityName = keyof typeof OPENCODE_HANDLERS;

/**
 * Static capability metadata without handlers (for reference)
 */
export const CODE_EDIT_CAPABILITY = {
  name: 'code_edit',
  description: 'Edit code using AI with LSP context',
  inputSchema: {
    type: 'object',
    properties: {
      file: { type: 'string', description: 'Path to the file to edit' },
      instruction: {
        type: 'string',
        description: 'Natural language instruction for the edit',
      },
    },
    required: ['file', 'instruction'],
  },
};

export const REFACTOR_CAPABILITY = {
  name: 'refactor',
  description: 'Refactor code using AI',
  inputSchema: {
    type: 'object',
    properties: {
      target: {
        type: 'string',
        description: 'Target code element to refactor',
      },
      strategy: {
        type: 'string',
        enum: ['extract', 'inline', 'rename'],
        description: 'Refactoring strategy to apply',
      },
      newName: {
        type: 'string',
        description: 'New name for rename strategy',
      },
      file: {
        type: 'string',
        description: 'File path (if target is a symbol within a file)',
      },
      line: {
        type: 'number',
        description: 'Line number (0-indexed)',
      },
      character: {
        type: 'number',
        description: 'Character position (0-indexed)',
      },
    },
    required: ['target'],
  },
};

export const ANALYZE_CAPABILITY = {
  name: 'analyze',
  description: 'Analyze code structure and patterns',
  inputSchema: {
    type: 'object',
    properties: {
      path: { type: 'string', description: 'Path to analyze' },
      depth: { type: 'number', description: 'Analysis depth level' },
    },
    required: ['path'],
  },
};

/**
 * All static capability metadata (without handlers)
 */
export const OPENCODE_CAPABILITIES = [
  CODE_EDIT_CAPABILITY,
  REFACTOR_CAPABILITY,
  ANALYZE_CAPABILITY,
];
