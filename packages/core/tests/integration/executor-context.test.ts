/**
 * Integration Tests: Executor + Context + Extension System
 *
 * Tests the integration between:
 * - LocalExecutor (command execution)
 * - MockClient (context management)
 * - ExtensionRegistry, ExtensionLoader, CapabilityRouter (extension system)
 *
 * @module @jclaw/core/tests/integration
 */

import { LocalExecutor } from '../../src/executor/local.js';
import { MockClient } from '../../src/context/mock-client.js';
import {
  ExtensionRegistry,
  ExtensionLoader,
  CapabilityRouter,
} from '../../src/extension-system/index.js';
import type { Extension } from '../../src/types.js';

describe('Integration: Executor + Context + Extension', () => {
  describe('Executor with MockClient', () => {
    it('should execute command and store result in context', async () => {
      const executor = new LocalExecutor();
      const context = new MockClient();

      await context.connect();

      // Execute a command
      const result = await executor.execute('echo integration-test');
      expect(result.stdout.trim()).toBe('integration-test');

      // Add result to context
      const resourceId = await context.addResource('/test/result.txt');
      expect(resourceId).toBeDefined();
      expect(resourceId).toMatch(/^mock-/);

      await context.disconnect();
    });

    it('should allow querying context with custom responses', async () => {
      const context = new MockClient();

      await context.connect();

      // Set custom response
      context.setQueryResponse(
        'What is JClaw?',
        'JClaw is a self-evolving agent framework'
      );

      // Query context
      const response = await context.query('What is JClaw?');
      expect(response).toBe('JClaw is a self-evolving agent framework');

      // Verify default response for unknown queries
      const defaultResponse = await context.query('Unknown query');
      expect(defaultResponse).toContain('Mock response for:');

      await context.disconnect();
    });

    it('should track resources added to context', async () => {
      const context = new MockClient();

      await context.connect();

      // Add multiple resources
      const id1 = await context.addResource('/file1.txt');
      await context.addResource('/file2.txt');

      // Verify resources are tracked
      const resources = context.getResources();
      expect(resources).toHaveLength(2);
      expect(resources.map((r) => r.path)).toContain('/file1.txt');
      expect(resources.map((r) => r.path)).toContain('/file2.txt');

      // Verify retrieval by ID
      const resource1 = context.getResourceById(id1);
      expect(resource1?.path).toBe('/file1.txt');

      await context.disconnect();
    });

    it('should handle execution errors and store in context', async () => {
      const executor = new LocalExecutor();
      const context = new MockClient();

      await context.connect();

      // Execute failing command
      const result = await executor.execute('exit 42');

      expect(result.exitCode).toBe(42);
      expect(result.duration).toBeGreaterThanOrEqual(0);

      // Still able to use context after error
      const id = await context.addResource('/error/log.txt');
      expect(id).toBeDefined();

      await context.disconnect();
    });
  });

  describe('Extension System Integration', () => {
    it('should register extension and resolve capability', async () => {
      const registry = new ExtensionRegistry();
      const loader = new ExtensionLoader(registry);
      const router = new CapabilityRouter(registry);

      // Create a mock extension
      const mockExtension: Extension = {
        name: 'test-extension',
        version: '1.0.0',
        description: 'Test extension',
        capabilities: [
          { name: 'test-capability', description: 'A test capability' },
        ],
        install: async () => {},
        uninstall: async () => {},
      };

      const result = await loader.load(mockExtension);

      expect(result.success).toBe(true);

      // Verify capability is registered
      expect(router.hasCapability('test-capability')).toBe(true);

      const resolved = router.resolve('test-capability');
      expect(resolved?.extensionName).toBe('test-extension');
      expect(resolved?.capability.name).toBe('test-capability');
    });

    it('should handle extension with multiple capabilities', async () => {
      const registry = new ExtensionRegistry();
      const loader = new ExtensionLoader(registry);
      const router = new CapabilityRouter(registry);

      const multiCapExtension: Extension = {
        name: 'multi-cap-extension',
        version: '1.0.0',
        description: 'Extension with multiple capabilities',
        capabilities: [
          { name: 'read-file', description: 'Read file content' },
          { name: 'write-file', description: 'Write file content' },
          { name: 'delete-file', description: 'Delete file' },
        ],
        install: async () => {},
        uninstall: async () => {},
      };

      await loader.load(multiCapExtension);

      // Verify all capabilities are available
      expect(router.hasCapability('read-file')).toBe(true);
      expect(router.hasCapability('write-file')).toBe(true);
      expect(router.hasCapability('delete-file')).toBe(true);

      // Get all capabilities for this extension
      const caps = router.getCapabilitiesByExtension('multi-cap-extension');
      expect(caps).toHaveLength(3);
    });

    it('should enforce dependency order when loading extensions', async () => {
      const registry = new ExtensionRegistry();
      const loader = new ExtensionLoader(registry);

      const baseExtension: Extension = {
        name: 'base-extension',
        version: '1.0.0',
        description: 'Base extension',
        capabilities: [{ name: 'base-cap', description: 'Base capability' }],
        install: async () => {},
        uninstall: async () => {},
      };

      const dependentExtension: Extension = {
        name: 'dependent-extension',
        version: '1.0.0',
        description: 'Dependent extension',
        dependencies: ['base-extension'],
        capabilities: [
          { name: 'dependent-cap', description: 'Dependent capability' },
        ],
        install: async () => {},
        uninstall: async () => {},
      };

      // Loading dependent before base should fail
      const failResult = await loader.load(dependentExtension);
      expect(failResult.success).toBe(false);
      expect(failResult.error).toContain('Missing required dependencies');

      // Load base first
      const baseResult = await loader.load(baseExtension);
      expect(baseResult.success).toBe(true);

      // Now dependent should load successfully
      const depResult = await loader.load(dependentExtension);
      expect(depResult.success).toBe(true);
    });

    it('should prevent duplicate extension registration', async () => {
      const registry = new ExtensionRegistry();
      const loader = new ExtensionLoader(registry);

      const extension: Extension = {
        name: 'duplicate-test',
        version: '1.0.0',
        description: 'Test extension',
        capabilities: [{ name: 'dup-cap', description: 'Capability' }],
        install: async () => {},
        uninstall: async () => {},
      };

      // First load should succeed
      const firstResult = await loader.load(extension);
      expect(firstResult.success).toBe(true);

      // Second load should fail
      const secondResult = await loader.load(extension);
      expect(secondResult.success).toBe(false);
      expect(secondResult.error).toContain('already loaded');
    });

    it('should unload extension and clean up capabilities', async () => {
      const registry = new ExtensionRegistry();
      const loader = new ExtensionLoader(registry);
      const router = new CapabilityRouter(registry);

      const extension: Extension = {
        name: 'unloadable-extension',
        version: '1.0.0',
        description: 'Extension to be unloaded',
        capabilities: [
          { name: 'temp-capability', description: 'Temporary capability' },
        ],
        install: async () => {},
        uninstall: async () => {},
      };

      await loader.load(extension);
      expect(router.hasCapability('temp-capability')).toBe(true);

      // Unload the extension
      const unloadResult = await loader.unload('unloadable-extension');
      expect(unloadResult.success).toBe(true);

      // Capability should no longer be available
      expect(router.hasCapability('temp-capability')).toBe(false);
      expect(registry.has('unloadable-extension')).toBe(false);
    });
  });

  describe('Full Workflow', () => {
    it('should execute command, store in context, via extension', async () => {
      const executor = new LocalExecutor();
      const context = new MockClient();
      const registry = new ExtensionRegistry();
      const router = new CapabilityRouter(registry);

      await context.connect();

      // Execute command
      const result = await executor.execute('echo workflow-test');
      expect(result.exitCode).toBe(0);
      expect(result.stdout.trim()).toBe('workflow-test');

      // Store in context
      await context.addResource('/workflow/output.txt');

      // Verify context state
      expect(context.isConnected()).toBe(true);
      expect(context.getResources()).toHaveLength(1);

      // Register an extension
      const workflowExtension: Extension = {
        name: 'workflow-extension',
        version: '1.0.0',
        description: 'Workflow management extension',
        capabilities: [
          {
            name: 'execute-and-store',
            description: 'Execute command and store result',
            inputSchema: {
              type: 'object',
              properties: {
                command: { type: 'string' },
                path: { type: 'string' },
              },
              required: ['command', 'path'],
            },
          },
        ],
        install: async () => {},
        uninstall: async () => {},
      };

      registry.register(workflowExtension);

      // Verify capability is available
      expect(router.hasCapability('execute-and-store')).toBe(true);

      // Validate input against schema
      const validInput = { command: 'echo test', path: '/test.txt' };
      const invalidInput = { command: 'echo test' }; // missing path

      expect(router.validateInput('execute-and-store', validInput)).toBe(true);
      expect(router.validateInput('execute-and-store', invalidInput)).toBe(
        false
      );

      await context.disconnect();
    });

    it('should handle complex multi-component workflow', async () => {
      // Setup all components
      const executor = new LocalExecutor();
      const context = new MockClient();
      const registry = new ExtensionRegistry();
      const loader = new ExtensionLoader(registry);
      const router = new CapabilityRouter(registry);

      await context.connect();

      // Define multiple extensions
      const commandExtension: Extension = {
        name: 'command-runner',
        version: '1.0.0',
        description: 'Command execution extension',
        capabilities: [
          { name: 'run-command', description: 'Run shell command' },
        ],
        install: async () => {},
        uninstall: async () => {},
      };

      const storageExtension: Extension = {
        name: 'context-storage',
        version: '1.0.0',
        description: 'Context storage extension',
        dependencies: ['command-runner'],
        capabilities: [
          { name: 'store-result', description: 'Store execution result' },
        ],
        install: async () => {},
        uninstall: async () => {},
      };

      // Load extensions in order
      const results = await loader.loadAll([
        commandExtension,
        storageExtension,
      ]);

      expect(results.get('command-runner')?.success).toBe(true);
      expect(results.get('context-storage')?.success).toBe(true);

      // Execute and store workflow
      const cmdResult = await executor.execute('echo complex-workflow');
      expect(cmdResult.stdout.trim()).toBe('complex-workflow');

      const resourceId = await context.addResource('/results/complex.txt');
      expect(resourceId).toBeDefined();

      // Verify all capabilities are available
      expect(router.getAvailableCapabilities()).toContain('run-command');
      expect(router.getAvailableCapabilities()).toContain('store-result');

      // Verify extension statistics
      const stats = router.stats;
      expect(stats.totalCapabilities).toBe(2);
      expect(stats.capabilitiesByExtension.get('command-runner')).toBe(1);
      expect(stats.capabilitiesByExtension.get('context-storage')).toBe(1);

      // Search for capabilities
      const searchResults = router.searchCapabilities('command');
      expect(searchResults).toHaveLength(1);
      expect(searchResults[0]?.capability.name).toBe('run-command');

      // Cleanup
      await context.disconnect();
      const unloadResults = await loader.unloadAll();

      expect(unloadResults.get('command-runner')?.success).toBe(true);
      expect(unloadResults.get('context-storage')?.success).toBe(true);
    });

    it('should maintain isolation between different context instances', async () => {
      const context1 = new MockClient();
      const context2 = new MockClient();

      await context1.connect();
      await context2.connect();

      // Set different query responses
      context1.setQueryResponse('test', 'Response from context 1');
      context2.setQueryResponse('test', 'Response from context 2');

      // Add different resources
      await context1.addResource('/context1/file.txt');
      await context2.addResource('/context2/file.txt');

      // Verify isolation
      expect(context1.getResources()).toHaveLength(1);
      expect(context2.getResources()).toHaveLength(1);

      expect(context1.getResources()[0]?.path).toBe('/context1/file.txt');
      expect(context2.getResources()[0]?.path).toBe('/context2/file.txt');

      const response1 = await context1.query('test');
      const response2 = await context2.query('test');

      expect(response1).toBe('Response from context 1');
      expect(response2).toBe('Response from context 2');

      await context1.disconnect();
      await context2.disconnect();
    });
  });

  describe('Error Handling', () => {
    it('should handle disconnected context operations gracefully', async () => {
      const context = new MockClient();

      // Should throw when not connected
      await expect(context.query('test')).rejects.toThrow(
        'Client not connected'
      );
      await expect(context.addResource('/test.txt')).rejects.toThrow(
        'Client not connected'
      );
    });

    it('should handle capability conflicts between extensions', async () => {
      const registry = new ExtensionRegistry();

      const ext1: Extension = {
        name: 'ext-with-cap',
        version: '1.0.0',
        description: 'First extension',
        capabilities: [
          { name: 'shared-capability', description: 'Shared capability' },
        ],
        install: async () => {},
        uninstall: async () => {},
      };

      const ext2: Extension = {
        name: 'ext-with-dup-cap',
        version: '1.0.0',
        description: 'Second extension with duplicate capability',
        capabilities: [
          { name: 'shared-capability', description: 'Duplicate capability' },
        ],
        install: async () => {},
        uninstall: async () => {},
      };

      // First registration should succeed
      registry.register(ext1);

      // Second should fail due to capability conflict
      expect(() => registry.register(ext2)).toThrow(
        'Capability "shared-capability" is already registered'
      );
    });

    it('should handle invalid extension validation', async () => {
      const registry = new ExtensionRegistry();
      const loader = new ExtensionLoader(registry);

      // Invalid extension (missing required properties)
      const invalidExtension = {
        name: 'invalid',
        // missing version, description, capabilities
      } as unknown as Extension;

      const result = await loader.load(invalidExtension);

      expect(result.success).toBe(false);
      expect(result.error).toContain('must have');
    });
  });
});
