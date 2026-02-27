/**
 * Integration Tests for OpenCode Extension with JClaw Core
 *
 * Tests the integration between the OpenCode extension and the JClaw core
 * framework, verifying that the extension can be properly loaded and
 * the adapter is correctly initialized.
 *
 * @module @jclaw/extension-opencode/tests/integration
 */

import {
  opencodeExtension,
  OPENCODE_CAPABILITIES,
  getAdapter,
  OpenCodeAdapter,
} from '../src/index';

describe('OpenCode Extension Integration', () => {
  // Mock runtime
  const mockRuntime = {
    execute: jest.fn(),
    start: jest.fn(),
    stop: jest.fn(),
    context: {} as never,
    executionMode: 'local' as const,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Extension Loading', () => {
    it('should export the extension object', () => {
      expect(opencodeExtension).toBeDefined();
      expect(opencodeExtension.name).toBe('opencode');
    });

    it('should export capabilities array', () => {
      expect(OPENCODE_CAPABILITIES).toBeDefined();
      expect(Array.isArray(OPENCODE_CAPABILITIES)).toBe(true);
      expect(OPENCODE_CAPABILITIES.length).toBeGreaterThan(0);
    });

    it('should export the OpenCodeAdapter class', () => {
      expect(OpenCodeAdapter).toBeDefined();
      expect(typeof OpenCodeAdapter).toBe('function');
    });

    it('should export getAdapter function', () => {
      expect(getAdapter).toBeDefined();
      expect(typeof getAdapter).toBe('function');
    });
  });

  describe('Adapter Lifecycle Integration', () => {
    it('should have null adapter before installation', async () => {
      // After previous tests, adapter might be set, so we uninstall first
      await opencodeExtension.uninstall();
      expect(getAdapter()).toBeNull();
    });

    it('should create adapter on installation', async () => {
      await opencodeExtension.install(mockRuntime);

      const adapter = getAdapter();
      expect(adapter).not.toBeNull();
      expect(adapter).toBeInstanceOf(OpenCodeAdapter);
    });

    it('should clear adapter on uninstallation', async () => {
      await opencodeExtension.install(mockRuntime);
      expect(getAdapter()).not.toBeNull();

      await opencodeExtension.uninstall();
      expect(getAdapter()).toBeNull();
    });

    it('should recreate adapter on re-installation', async () => {
      await opencodeExtension.install(mockRuntime);
      const firstAdapter = getAdapter();

      await opencodeExtension.uninstall();
      expect(getAdapter()).toBeNull();

      await opencodeExtension.install(mockRuntime);
      const secondAdapter = getAdapter();

      expect(secondAdapter).not.toBeNull();
      expect(secondAdapter).toBeInstanceOf(OpenCodeAdapter);
      // Should be a new instance
      expect(secondAdapter).not.toBe(firstAdapter);
    });
  });

  describe('Capability Integration', () => {
    it('should provide all required capabilities', () => {
      const capabilityNames = OPENCODE_CAPABILITIES.map((c) => c.name);

      expect(capabilityNames).toContain('code_edit');
      expect(capabilityNames).toContain('refactor');
      expect(capabilityNames).toContain('analyze');
    });

    it('should match extension capabilities with exported capabilities', () => {
      expect(opencodeExtension.capabilities).toBe(OPENCODE_CAPABILITIES);
    });

    it('should have valid capability schemas', () => {
      for (const capability of OPENCODE_CAPABILITIES) {
        expect(capability.name).toBeDefined();
        expect(typeof capability.name).toBe('string');
        expect(capability.description).toBeDefined();
        expect(typeof capability.description).toBe('string');

        if (capability.inputSchema) {
          expect(capability.inputSchema.type).toBe('object');
        }
      }
    });
  });

  describe('Runtime Compatibility', () => {
    it('should be compatible with AgentRuntime interface', async () => {
      // Should not throw when passed a valid runtime
      await expect(
        opencodeExtension.install(mockRuntime)
      ).resolves.not.toThrow();
    });

    it('should handle runtime with docker execution mode', async () => {
      const dockerRuntime = {
        ...mockRuntime,
        executionMode: 'docker' as const,
      };

      await expect(
        opencodeExtension.install(dockerRuntime)
      ).resolves.not.toThrow();
    });

    it('should handle runtime with hybrid execution mode', async () => {
      const hybridRuntime = {
        ...mockRuntime,
        executionMode: 'hybrid' as const,
      };

      await expect(
        opencodeExtension.install(hybridRuntime)
      ).resolves.not.toThrow();
    });
  });

  describe('Default Export', () => {
    it('should have default export', async () => {
      const { default: defaultExport } = await import('../src/index');

      expect(defaultExport).toBe(opencodeExtension);
      expect(defaultExport.name).toBe('opencode');
    });
  });
});
