/**
 * CapabilityRouter Tests
 *
 * Tests for the capability router implementation.
 */
import { ExtensionRegistry } from '../../src/extension-system/registry.js';
import { CapabilityRouter } from '../../src/extension-system/capability-router.js';
describe('CapabilityRouter', () => {
    let registry;
    let router;
    // Helper to create a mock extension
    const createMockExtension = (name, capabilities = []) => ({
        name,
        version: '1.0.0',
        description: `Test extension ${name}`,
        capabilities: capabilities.map((cap) => ({
            name: cap.name,
            description: cap.description,
            inputSchema: cap.inputSchema,
        })),
        install: async () => { },
        uninstall: async () => { },
    });
    beforeEach(() => {
        registry = new ExtensionRegistry();
        router = new CapabilityRouter(registry);
    });
    describe('resolve', () => {
        it('should resolve a registered capability', () => {
            registry.register(createMockExtension('test-ext', [
                { name: 'test-cap', description: 'Test capability' },
            ]));
            const result = router.resolve('test-cap');
            expect(result).not.toBeNull();
            expect(result?.extensionName).toBe('test-ext');
            expect(result?.capability.name).toBe('test-cap');
            expect(result?.capability.description).toBe('Test capability');
        });
        it('should return null for non-existent capability', () => {
            const result = router.resolve('non-existent');
            expect(result).toBeNull();
        });
    });
    describe('hasCapability', () => {
        it('should return true for registered capability', () => {
            registry.register(createMockExtension('ext', [{ name: 'test-cap', description: 'Test' }]));
            expect(router.hasCapability('test-cap')).toBe(true);
        });
        it('should return false for non-existent capability', () => {
            expect(router.hasCapability('non-existent')).toBe(false);
        });
    });
    describe('getAvailableCapabilities', () => {
        it('should return all capability names', () => {
            registry.register(createMockExtension('ext', [
                { name: 'cap1', description: 'Cap 1' },
                { name: 'cap2', description: 'Cap 2' },
            ]));
            const caps = router.getAvailableCapabilities();
            expect(caps).toContain('cap1');
            expect(caps).toContain('cap2');
        });
        it('should return empty array when no capabilities registered', () => {
            expect(router.getAvailableCapabilities()).toEqual([]);
        });
    });
    describe('getAllCapabilities', () => {
        it('should return all capabilities with their providers', () => {
            registry.register(createMockExtension('ext1', [{ name: 'cap1', description: 'Cap 1' }]));
            registry.register(createMockExtension('ext2', [{ name: 'cap2', description: 'Cap 2' }]));
            const allCaps = router.getAllCapabilities();
            expect(allCaps).toHaveLength(2);
            expect(allCaps.find((c) => c.capability.name === 'cap1')?.extensionName).toBe('ext1');
            expect(allCaps.find((c) => c.capability.name === 'cap2')?.extensionName).toBe('ext2');
        });
    });
    describe('getCapabilitiesByExtension', () => {
        it('should return capabilities for specific extension', () => {
            registry.register(createMockExtension('test-ext', [
                { name: 'cap1', description: 'Cap 1' },
                { name: 'cap2', description: 'Cap 2' },
            ]));
            const caps = router.getCapabilitiesByExtension('test-ext');
            expect(caps).toHaveLength(2);
        });
        it('should return empty array for non-existent extension', () => {
            expect(router.getCapabilitiesByExtension('non-existent')).toEqual([]);
        });
    });
    describe('extensionProvides', () => {
        beforeEach(() => {
            registry.register(createMockExtension('ext1', [{ name: 'cap1', description: 'Cap 1' }]));
        });
        it('should return true when extension provides capability', () => {
            expect(router.extensionProvides('ext1', 'cap1')).toBe(true);
        });
        it('should return false when extension does not provide capability', () => {
            expect(router.extensionProvides('ext1', 'cap2')).toBe(false);
        });
        it('should return false when capability from different extension', () => {
            registry.register(createMockExtension('ext2', [{ name: 'cap2', description: 'Cap 2' }]));
            expect(router.extensionProvides('ext1', 'cap2')).toBe(false);
        });
    });
    describe('searchCapabilities', () => {
        beforeEach(() => {
            registry.register(createMockExtension('ext', [
                { name: 'file-read', description: 'Read files' },
                { name: 'file-write', description: 'Write files' },
                { name: 'network-fetch', description: 'Fetch from network' },
            ]));
        });
        it('should find capabilities by partial name', () => {
            const results = router.searchCapabilities('file');
            expect(results).toHaveLength(2);
            expect(results.map((r) => r.capability.name)).toContain('file-read');
            expect(results.map((r) => r.capability.name)).toContain('file-write');
        });
        it('should be case insensitive', () => {
            const results = router.searchCapabilities('FILE');
            expect(results).toHaveLength(2);
        });
        it('should return empty array when no matches', () => {
            const results = router.searchCapabilities('xyz');
            expect(results).toEqual([]);
        });
    });
    describe('getProvider', () => {
        it('should return extension name that provides capability', () => {
            registry.register(createMockExtension('test-ext', [
                { name: 'test-cap', description: 'Test' },
            ]));
            expect(router.getProvider('test-cap')).toBe('test-ext');
        });
        it('should return undefined for non-existent capability', () => {
            expect(router.getProvider('non-existent')).toBeUndefined();
        });
    });
    describe('validateInput', () => {
        it('should return false for non-existent capability', () => {
            expect(router.validateInput('non-existent', {})).toBe(false);
        });
        it('should return true when no schema defined', () => {
            registry.register(createMockExtension('ext', [{ name: 'cap', description: 'No schema' }]));
            expect(router.validateInput('cap', {})).toBe(true);
        });
        it('should validate required fields', () => {
            registry.register(createMockExtension('ext', [
                {
                    name: 'cap',
                    description: 'With schema',
                    inputSchema: {
                        type: 'object',
                        required: ['name', 'value'],
                    },
                },
            ]));
            expect(router.validateInput('cap', { name: 'test', value: 123 })).toBe(true);
            expect(router.validateInput('cap', { name: 'test' })).toBe(false);
        });
    });
    describe('stats', () => {
        it('should return capability statistics', () => {
            registry.register(createMockExtension('ext1', [
                { name: 'cap1', description: 'Cap 1' },
                { name: 'cap2', description: 'Cap 2' },
            ]));
            registry.register(createMockExtension('ext2', [{ name: 'cap3', description: 'Cap 3' }]));
            const stats = router.stats;
            expect(stats.totalCapabilities).toBe(3);
            expect(stats.capabilitiesByExtension.get('ext1')).toBe(2);
            expect(stats.capabilitiesByExtension.get('ext2')).toBe(1);
        });
    });
});
//# sourceMappingURL=capability-router.test.js.map