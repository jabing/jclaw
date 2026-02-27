/**
 * Tests for OpenCode Extension
 *
 * @module @jclaw/extension-opencode/tests
 */

import { opencodeExtension, OPENCODE_CAPABILITIES } from '../src/index';
import type { AgentRuntime } from '@jclaw/core';

describe('OpenCode Extension', () => {
  describe('Extension Definition', () => {
    it('should have correct name', () => {
      expect(opencodeExtension.name).toBe('opencode');
    });

    it('should have correct version', () => {
      expect(opencodeExtension.version).toBe('0.1.0');
    });

    it('should have a description', () => {
      expect(opencodeExtension.description).toBe(
        'OpenCode extension for professional coding with LSP support'
      );
    });

    it('should have capabilities defined', () => {
      expect(opencodeExtension.capabilities).toBeDefined();
      expect(Array.isArray(opencodeExtension.capabilities)).toBe(true);
    });

    it('should have install method', () => {
      expect(typeof opencodeExtension.install).toBe('function');
    });

    it('should have uninstall method', () => {
      expect(typeof opencodeExtension.uninstall).toBe('function');
    });
  });

  describe('Capabilities', () => {
    it('should export OPENCODE_CAPABILITIES array', () => {
      expect(OPENCODE_CAPABILITIES).toBeDefined();
      expect(Array.isArray(OPENCODE_CAPABILITIES)).toBe(true);
    });

    it('should have exactly 3 capabilities', () => {
      expect(OPENCODE_CAPABILITIES).toHaveLength(3);
    });

    it('should include code_edit capability', () => {
      const codeEdit = OPENCODE_CAPABILITIES.find(
        (c) => c.name === 'code_edit'
      );
      expect(codeEdit).toBeDefined();
      expect(codeEdit?.description).toBe('Edit code using AI with LSP context');
      expect(codeEdit?.inputSchema).toBeDefined();
    });

    it('should include refactor capability', () => {
      const refactor = OPENCODE_CAPABILITIES.find((c) => c.name === 'refactor');
      expect(refactor).toBeDefined();
      expect(refactor?.description).toBe('Refactor code using AI');
      expect(refactor?.inputSchema).toBeDefined();
    });

    it('should include analyze capability', () => {
      const analyze = OPENCODE_CAPABILITIES.find((c) => c.name === 'analyze');
      expect(analyze).toBeDefined();
      expect(analyze?.description).toBe('Analyze code structure and patterns');
      expect(analyze?.inputSchema).toBeDefined();
    });

    it('code_edit capability should have required input schema', () => {
      const codeEdit = OPENCODE_CAPABILITIES.find(
        (c) => c.name === 'code_edit'
      );
      const schema = codeEdit?.inputSchema as {
        properties: Record<string, unknown>;
        required: string[];
      };

      expect(schema.properties.file).toBeDefined();
      expect(schema.properties.instruction).toBeDefined();
      expect(schema.required).toContain('file');
      expect(schema.required).toContain('instruction');
    });

    it('refactor capability should have strategy enum', () => {
      const refactor = OPENCODE_CAPABILITIES.find((c) => c.name === 'refactor');
      const schema = refactor?.inputSchema as {
        properties: { strategy: { enum: string[] } };
      };

      expect(schema.properties.strategy.enum).toContain('extract');
      expect(schema.properties.strategy.enum).toContain('inline');
      expect(schema.properties.strategy.enum).toContain('rename');
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
        opencodeExtension.install(mockRuntime)
      ).resolves.not.toThrow();
    });

    it('should uninstall without errors', async () => {
      await expect(opencodeExtension.uninstall()).resolves.not.toThrow();
    });
  });
});
