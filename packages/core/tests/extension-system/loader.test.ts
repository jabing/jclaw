/**
 * ExtensionLoader Tests
 *
 * Tests for the extension loader implementation.
 */

import { ExtensionRegistry } from '../../src/extension-system/registry.js';
import { ExtensionLoader } from '../../src/extension-system/loader.js';
import type { Extension } from '../../src/types.js';

describe('ExtensionLoader', () => {
  let registry: ExtensionRegistry;
  let loader: ExtensionLoader;

  // Helper to create a mock extension
  const createMockExtension = (
    name: string,
    options: {
      version?: string;
      description?: string;
      capabilities?: Array<{ name: string; description: string }>;
      dependencies?: string[];
      install?: () => Promise<void>;
      uninstall?: () => Promise<void>;
    } = {}
  ): Extension => ({
    name,
    version: options.version ?? '1.0.0',
    description: options.description ?? `Test extension ${name}`,
    capabilities: options.capabilities ?? [],
    dependencies: options.dependencies,
    install: options.install ?? (async () => {}),
    uninstall: options.uninstall ?? (async () => {}),
  });

  beforeEach(() => {
    registry = new ExtensionRegistry();
    loader = new ExtensionLoader(registry);
  });

  describe('load', () => {
    it('should load a valid extension', async () => {
      const extension = createMockExtension('test-ext');

      const result = await loader.load(extension);

      expect(result.success).toBe(true);
      expect(registry.has('test-ext')).toBe(true);
    });

    it('should call install lifecycle method', async () => {
      const installSpy = jest.fn();
      const extension = createMockExtension('test-ext', {
        install: installSpy,
      });

      await loader.load(extension);

      expect(installSpy).toHaveBeenCalledTimes(1);
    });

    it('should pass runtime to install method', async () => {
      const installSpy = jest.fn();
      const extension = createMockExtension('test-ext', {
        install: installSpy,
      });
      const runtime = { test: true };

      await loader.load(extension, runtime);

      expect(installSpy).toHaveBeenCalledWith(runtime);
    });

    it('should fail when extension already loaded', async () => {
      const extension = createMockExtension('test-ext');
      await loader.load(extension);

      const result = await loader.load(extension);

      expect(result.success).toBe(false);
      expect(result.error).toContain('already loaded');
    });

    it('should fail when missing required dependencies', async () => {
      const extension = createMockExtension('test-ext', {
        dependencies: ['missing-dep'],
      });

      const result = await loader.load(extension);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Missing required dependencies');
      expect(result.error).toContain('missing-dep');
    });

    it('should succeed when dependencies are satisfied', async () => {
      await loader.load(createMockExtension('dep-ext'));

      const extension = createMockExtension('test-ext', {
        dependencies: ['dep-ext'],
      });

      const result = await loader.load(extension);

      expect(result.success).toBe(true);
    });

    it('should skip dependency check with skipDependencies option', async () => {
      const extension = createMockExtension('test-ext', {
        dependencies: ['missing-dep'],
      });

      const result = await loader.load(extension, undefined, {
        skipDependencies: true,
      });

      expect(result.success).toBe(true);
    });

    it('should handle install errors', async () => {
      const extension = createMockExtension('test-ext', {
        install: async () => {
          throw new Error('Install failed');
        },
      });

      const result = await loader.load(extension);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Install failed');
    });

    it('should not register extension if install fails', async () => {
      const extension = createMockExtension('test-ext', {
        install: async () => {
          throw new Error('Install failed');
        },
      });

      await loader.load(extension);

      expect(registry.has('test-ext')).toBe(false);
    });
  });

  describe('unload', () => {
    it('should unload a loaded extension', async () => {
      const extension = createMockExtension('test-ext');
      await loader.load(extension);

      const result = await loader.unload('test-ext');

      expect(result.success).toBe(true);
      expect(registry.has('test-ext')).toBe(false);
    });

    it('should call uninstall lifecycle method', async () => {
      const uninstallSpy = jest.fn();
      const extension = createMockExtension('test-ext', {
        uninstall: uninstallSpy,
      });
      await loader.load(extension);

      await loader.unload('test-ext');

      expect(uninstallSpy).toHaveBeenCalledTimes(1);
    });

    it('should fail when extension not loaded', async () => {
      const result = await loader.unload('non-existent');

      expect(result.success).toBe(false);
      expect(result.error).toContain('not loaded');
    });

    it('should fail when other extensions depend on it', async () => {
      await loader.load(createMockExtension('base-ext'));
      await loader.load(
        createMockExtension('dependent-ext', { dependencies: ['base-ext'] })
      );

      const result = await loader.unload('base-ext');

      expect(result.success).toBe(false);
      expect(result.error).toContain('depend on');
    });

    it('should handle uninstall errors', async () => {
      const extension = createMockExtension('test-ext', {
        uninstall: async () => {
          throw new Error('Uninstall failed');
        },
      });
      await loader.load(extension);

      const result = await loader.unload('test-ext');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Uninstall failed');
    });
  });

  describe('loadAll', () => {
    it('should load multiple extensions', async () => {
      const extensions = [
        createMockExtension('ext1'),
        createMockExtension('ext2'),
        createMockExtension('ext3'),
      ];

      const results = await loader.loadAll(extensions);

      expect(results.size).toBe(3);
      expect(registry.size).toBe(3);
    });

    it('should load extensions in dependency order', async () => {
      const loadOrder: string[] = [];
      const createTrackedExtension = (
        name: string,
        deps?: string[]
      ): Extension =>
        createMockExtension(name, {
          dependencies: deps,
          install: async () => {
            loadOrder.push(name);
          },
        });

      const extensions = [
        createTrackedExtension('ext3', ['ext1', 'ext2']),
        createTrackedExtension('ext1'),
        createTrackedExtension('ext2', ['ext1']),
      ];

      await loader.loadAll(extensions);

      // ext1 should be loaded before ext2 and ext3
      // ext2 should be loaded before ext3
      expect(loadOrder.indexOf('ext1')).toBeLessThan(loadOrder.indexOf('ext2'));
      expect(loadOrder.indexOf('ext1')).toBeLessThan(loadOrder.indexOf('ext3'));
      expect(loadOrder.indexOf('ext2')).toBeLessThan(loadOrder.indexOf('ext3'));
    });
  });

  describe('unloadAll', () => {
    it('should unload all extensions', async () => {
      await loader.load(createMockExtension('ext1'));
      await loader.load(createMockExtension('ext2'));

      const results = await loader.unloadAll();

      expect(results.size).toBe(2);
      expect(registry.size).toBe(0);
    });
  });

  describe('validateExtension', () => {
    it('should accept valid extension', () => {
      const extension = createMockExtension('test');

      const error = loader.validateExtension(extension);

      expect(error).toBeNull();
    });

    it('should reject null/undefined', () => {
      expect(loader.validateExtension(null)).toBe(
        'Extension must be an object'
      );
      expect(loader.validateExtension(undefined)).toBe(
        'Extension must be an object'
      );
    });

    it('should reject missing name', () => {
      const extension = {
        version: '1.0.0',
        description: 'test',
        capabilities: [],
      };

      expect(loader.validateExtension(extension)).toBe(
        'Extension must have a string "name" property'
      );
    });

    it('should reject missing version', () => {
      const extension = { name: 'test', description: 'test', capabilities: [] };

      expect(loader.validateExtension(extension)).toBe(
        'Extension must have a string "version" property'
      );
    });

    it('should reject missing description', () => {
      const extension = { name: 'test', version: '1.0.0', capabilities: [] };

      expect(loader.validateExtension(extension)).toBe(
        'Extension must have a string "description" property'
      );
    });

    it('should reject missing capabilities', () => {
      const extension = { name: 'test', version: '1.0.0', description: 'test' };

      expect(loader.validateExtension(extension)).toBe(
        'Extension must have an array "capabilities" property'
      );
    });

    it('should reject invalid capability', () => {
      const extension = {
        name: 'test',
        version: '1.0.0',
        description: 'test',
        capabilities: [{ description: 'missing name' }],
      };

      expect(loader.validateExtension(extension)).toBe(
        'Capability at index 0 must have a string "name" property'
      );
    });

    it('should reject invalid dependencies type', () => {
      const extension = {
        name: 'test',
        version: '1.0.0',
        description: 'test',
        capabilities: [],
        dependencies: 'invalid',
      };

      expect(loader.validateExtension(extension)).toBe(
        'Extension "dependencies" must be an array of strings'
      );
    });
  });
});
