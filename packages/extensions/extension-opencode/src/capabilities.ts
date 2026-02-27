/**
 * OpenCode Extension Capabilities
 *
 * Defines the capabilities provided by the OpenCode extension.
 * Each capability represents a distinct feature that can be invoked.
 *
 * @module @jclaw/extension-opencode/capabilities
 */

import type { Capability } from '@jclaw/core';

/**
 * Code editing capability using AI with LSP context
 */
export const CODE_EDIT_CAPABILITY: Capability = {
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

/**
 * Refactoring capability for code transformation
 */
export const REFACTOR_CAPABILITY: Capability = {
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
    },
    required: ['target'],
  },
};

/**
 * Code analysis capability for structure and patterns
 */
export const ANALYZE_CAPABILITY: Capability = {
  name: 'analyze',
  description: 'Analyze code structure and patterns',
  inputSchema: {
    type: 'object',
    properties: {
      path: { type: 'string', description: 'Path to analyze' },
      depth: { type: 'number', description: 'Analysis depth level' },
    },
  },
};

/**
 * All capabilities provided by the OpenCode extension
 */
export const OPENCODE_CAPABILITIES: Capability[] = [
  CODE_EDIT_CAPABILITY,
  REFACTOR_CAPABILITY,
  ANALYZE_CAPABILITY,
];
