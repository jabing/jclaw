/**
 * ExtensionRegistry Tests
 *
 * Tests for the extension registry implementation.
 */
import { ExtensionRegistry } from '../../src/extension-system/registry.js';
describe('ExtensionRegistry', () => {
    let registry;
    // Helper to create a mock extension
    const createMockExtension = (name, capabilities = []) => ({
        name,
        version: '1.0.0',
        description: `Test extension ${name}`,
        capabilities: capabilities.map((cap) => ({
            name: cap.name,
            description: cap.description,
        })),
        install: async () => { },
        uninstall: async () => { },
    });
    beforeEach(() => {
        registry = new ExtensionRegistry();
    });
    describe('register', () => {
        it('should register an extension successfully', () => {
            const extension = createMockExtension('test-ext', [
                { name: 'test-cap', description: 'Test capability' },
            ]);
            registry.register(extension);
            expect(registry.has('test-ext')).toBe(true);
            expect(registry.get('test-ext')).toBe(extension);
        });
        it('should throw error when registering duplicate extension', () => {
            const extension = createMockExtension('test-ext');
            registry.register(extension);
            expect(() => registry.register(extension)).toThrow('Extension "test-ext" is already registered');
        });
        it('should register all capabilities from extension', () => {
            const extension = createMockExtension('test-ext', [
                { name: 'cap1', description: 'Capability 1' },
                { name: 'cap2', description: 'Capability 2' },
            ]);
            registry.register(extension);
            expect(registry.hasCapability('cap1')).toBe(true);
            expect(registry.hasCapability('cap2')).toBe(true);
        });
        it('should throw error when capability is already registered', () => {
            const ext1 = createMockExtension('ext1', [
                { name: 'shared-cap', description: 'Shared capability' },
            ]);
            const ext2 = createMockExtension('ext2', [
                { name: 'shared-cap', description: 'Another shared capability' },
            ]);
            registry.register(ext1);
            expect(() => registry.register(ext2)).toThrow('Capability "shared-cap" is already registered by another extension');
        });
        it('should rollback on capability conflict', () => {
            const ext1 = createMockExtension('ext1', [
                { name: 'cap1', description: 'Capability 1' },
            ]);
            const ext2 = createMockExtension('ext2', [
                { name: 'cap1', description: 'Conflict capability' },
            ]);
            registry.register(ext1);
            expect(() => registry.register(ext2)).toThrow();
            // ext2 should not be registered
            expect(registry.has('ext2')).toBe(false);
        });
    });
    describe('unregister', () => {
        it('should unregister an extension', () => {
            const extension = createMockExtension('test-ext', [
                { name: 'test-cap', description: 'Test capability' },
            ]);
            registry.register(extension);
            registry.unregister('test-ext');
            expect(registry.has('test-ext')).toBe(false);
            expect(registry.hasCapability('test-cap')).toBe(false);
        });
        it('should do nothing when unregistering non-existent extension', () => {
            expect(() => registry.unregister('non-existent')).not.toThrow();
        });
        it('should remove all capabilities when unregistering', () => {
            const extension = createMockExtension('test-ext', [
                { name: 'cap1', description: 'Capability 1' },
                { name: 'cap2', description: 'Capability 2' },
            ]);
            registry.register(extension);
            registry.unregister('test-ext');
            expect(registry.hasCapability('cap1')).toBe(false);
            expect(registry.hasCapability('cap2')).toBe(false);
        });
    });
    describe('get', () => {
        it('should return extension by name', () => {
            const extension = createMockExtension('test-ext');
            registry.register(extension);
            expect(registry.get('test-ext')).toBe(extension);
        });
        it('should return undefined for non-existent extension', () => {
            expect(registry.get('non-existent')).toBeUndefined();
        });
    });
    describe('has', () => {
        it('should return true for registered extension', () => {
            const extension = createMockExtension('test-ext');
            registry.register(extension);
            expect(registry.has('test-ext')).toBe(true);
        });
        it('should return false for non-existent extension', () => {
            expect(registry.has('non-existent')).toBe(false);
        });
    });
    describe('getAll', () => {
        it('should return all registered extensions', () => {
            const ext1 = createMockExtension('ext1');
            const ext2 = createMockExtension('ext2');
            registry.register(ext1);
            registry.register(ext2);
            const all = registry.getAll();
            expect(all).toHaveLength(2);
            expect(all).toContain(ext1);
            expect(all).toContain(ext2);
        });
        it('should return empty array when no extensions registered', () => {
            expect(registry.getAll()).toEqual([]);
        });
    });
    describe('getNames', () => {
        it('should return all extension names', () => {
            registry.register(createMockExtension('ext1'));
            registry.register(createMockExtension('ext2'));
            const names = registry.getNames();
            expect(names).toContain('ext1');
            expect(names).toContain('ext2');
        });
    });
    describe('getCapability', () => {
        it('should return capability with extension name', () => {
            const extension = createMockExtension('test-ext', [
                { name: 'test-cap', description: 'Test capability' },
            ]);
            registry.register(extension);
            const cap = registry.getCapability('test-cap');
            expect(cap).toBeDefined();
            expect(cap?.extension).toBe('test-ext');
            expect(cap?.capability.name).toBe('test-cap');
        });
        it('should return undefined for non-existent capability', () => {
            expect(registry.getCapability('non-existent')).toBeUndefined();
        });
    });
    describe('hasCapability', () => {
        it('should return true for registered capability', () => {
            const extension = createMockExtension('test-ext', [
                { name: 'test-cap', description: 'Test capability' },
            ]);
            registry.register(extension);
            expect(registry.hasCapability('test-cap')).toBe(true);
        });
        it('should return false for non-existent capability', () => {
            expect(registry.hasCapability('non-existent')).toBe(false);
        });
    });
    describe('getAllCapabilities', () => {
        it('should return all registered capabilities', () => {
            registry.register(createMockExtension('ext1', [{ name: 'cap1', description: 'Cap 1' }]));
            registry.register(createMockExtension('ext2', [{ name: 'cap2', description: 'Cap 2' }]));
            const allCaps = registry.getAllCapabilities();
            expect(allCaps).toHaveLength(2);
        });
    });
    describe('getCapabilityNames', () => {
        it('should return all capability names', () => {
            registry.register(createMockExtension('ext', [
                { name: 'cap1', description: 'Cap 1' },
                { name: 'cap2', description: 'Cap 2' },
            ]));
            const names = registry.getCapabilityNames();
            expect(names).toContain('cap1');
            expect(names).toContain('cap2');
        });
    });
    describe('getCapabilitiesByExtension', () => {
        it('should return capabilities for specific extension', () => {
            const extension = createMockExtension('test-ext', [
                { name: 'cap1', description: 'Cap 1' },
                { name: 'cap2', description: 'Cap 2' },
            ]);
            registry.register(extension);
            const caps = registry.getCapabilitiesByExtension('test-ext');
            expect(caps).toHaveLength(2);
            expect(caps[0].name).toBe('cap1');
            expect(caps[1].name).toBe('cap2');
        });
        it('should return empty array for non-existent extension', () => {
            expect(registry.getCapabilitiesByExtension('non-existent')).toEqual([]);
        });
    });
    describe('clear', () => {
        it('should clear all extensions and capabilities', () => {
            registry.register(createMockExtension('ext1', [{ name: 'cap1', description: 'Cap 1' }]));
            registry.register(createMockExtension('ext2', [{ name: 'cap2', description: 'Cap 2' }]));
            registry.clear();
            expect(registry.size).toBe(0);
            expect(registry.capabilityCount).toBe(0);
        });
    });
    describe('size and capabilityCount', () => {
        it('should return correct counts', () => {
            expect(registry.size).toBe(0);
            expect(registry.capabilityCount).toBe(0);
            registry.register(createMockExtension('ext', [
                { name: 'cap1', description: 'Cap 1' },
                { name: 'cap2', description: 'Cap 2' },
            ]));
            expect(registry.size).toBe(1);
            expect(registry.capabilityCount).toBe(2);
        });
    });
});
//# sourceMappingURL=registry.test.js.map