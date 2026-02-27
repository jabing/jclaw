/**
 * Extension Registry
 *
 * Manages registration and lookup of extensions and their capabilities.
 *
 * @module @jclaw/core/extension-system/registry
 */
/**
 * Extension Registry
 *
 * Central registry for managing extensions and their capabilities.
 * Provides O(1) lookup for both extensions and capabilities.
 */
export class ExtensionRegistry {
    extensions = new Map();
    capabilities = new Map();
    /**
     * Register an extension and all its capabilities
     *
     * @param extension - The extension to register
     * @throws Error if extension with same name is already registered
     */
    register(extension) {
        if (this.extensions.has(extension.name)) {
            throw new Error(`Extension "${extension.name}" is already registered`);
        }
        // Register the extension
        this.extensions.set(extension.name, extension);
        // Register all capabilities
        for (const capability of extension.capabilities) {
            if (this.capabilities.has(capability.name)) {
                // Rollback on conflict
                for (const cap of extension.capabilities) {
                    if (cap === capability)
                        break;
                    this.capabilities.delete(cap.name);
                }
                this.extensions.delete(extension.name);
                throw new Error(`Capability "${capability.name}" is already registered by another extension`);
            }
            this.capabilities.set(capability.name, {
                extension: extension.name,
                capability,
            });
        }
    }
    /**
     * Unregister an extension and all its capabilities
     *
     * @param name - Name of the extension to unregister
     */
    unregister(name) {
        const extension = this.extensions.get(name);
        if (!extension)
            return;
        // Remove all capabilities
        for (const capability of extension.capabilities) {
            this.capabilities.delete(capability.name);
        }
        // Remove the extension
        this.extensions.delete(name);
    }
    /**
     * Get an extension by name
     *
     * @param name - Extension name
     * @returns The extension or undefined if not found
     */
    get(name) {
        return this.extensions.get(name);
    }
    /**
     * Check if an extension is registered
     *
     * @param name - Extension name
     * @returns True if extension is registered
     */
    has(name) {
        return this.extensions.has(name);
    }
    /**
     * Get all registered extensions
     *
     * @returns Array of all extensions
     */
    getAll() {
        return Array.from(this.extensions.values());
    }
    /**
     * Get all extension names
     *
     * @returns Array of extension names
     */
    getNames() {
        return Array.from(this.extensions.keys());
    }
    /**
     * Get a registered capability by name
     *
     * @param name - Capability name
     * @returns The registered capability or undefined if not found
     */
    getCapability(name) {
        return this.capabilities.get(name);
    }
    /**
     * Check if a capability is registered
     *
     * @param name - Capability name
     * @returns True if capability is registered
     */
    hasCapability(name) {
        return this.capabilities.has(name);
    }
    /**
     * Get all registered capabilities
     *
     * @returns Array of all registered capabilities
     */
    getAllCapabilities() {
        return Array.from(this.capabilities.values());
    }
    /**
     * Get all capability names
     *
     * @returns Array of capability names
     */
    getCapabilityNames() {
        return Array.from(this.capabilities.keys());
    }
    /**
     * Get capabilities provided by a specific extension
     *
     * @param extensionName - Name of the extension
     * @returns Array of capabilities or empty array if extension not found
     */
    getCapabilitiesByExtension(extensionName) {
        const extension = this.extensions.get(extensionName);
        return extension ? [...extension.capabilities] : [];
    }
    /**
     * Clear all registered extensions and capabilities
     */
    clear() {
        this.capabilities.clear();
        this.extensions.clear();
    }
    /**
     * Get the number of registered extensions
     */
    get size() {
        return this.extensions.size;
    }
    /**
     * Get the number of registered capabilities
     */
    get capabilityCount() {
        return this.capabilities.size;
    }
}
//# sourceMappingURL=registry.js.map