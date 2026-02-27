/**
 * Capability Router
 *
 * Routes capability requests to the appropriate extension.
 *
 * @module @jclaw/core/extension-system/capability-router
 */
/**
 * Capability Router
 *
 * Provides capability lookup and routing functionality.
 * Acts as a query interface over the extension registry.
 */
export class CapabilityRouter {
    registry;
    constructor(registry) {
        this.registry = registry;
    }
    /**
     * Resolve a capability by name
     *
     * @param capabilityName - Name of the capability to resolve
     * @returns Capability resolution or null if not found
     */
    resolve(capabilityName) {
        const registered = this.registry.getCapability(capabilityName);
        if (!registered)
            return null;
        return {
            extensionName: registered.extension,
            capability: registered.capability,
        };
    }
    /**
     * Check if a capability is available
     *
     * @param name - Capability name
     * @returns True if capability is registered
     */
    hasCapability(name) {
        return this.registry.hasCapability(name);
    }
    /**
     * Get all available capability names
     *
     * @returns Array of capability names
     */
    getAvailableCapabilities() {
        return this.registry.getCapabilityNames();
    }
    /**
     * Get all capabilities with their providers
     *
     * @returns Array of capability resolutions
     */
    getAllCapabilities() {
        return this.registry.getAllCapabilities().map((reg) => ({
            extensionName: reg.extension,
            capability: reg.capability,
        }));
    }
    /**
     * Get capabilities provided by a specific extension
     *
     * @param extensionName - Name of the extension
     * @returns Array of capabilities or empty array if extension not found
     */
    getCapabilitiesByExtension(extensionName) {
        return this.registry.getCapabilitiesByExtension(extensionName);
    }
    /**
     * Check if an extension provides a specific capability
     *
     * @param extensionName - Name of the extension
     * @param capabilityName - Name of the capability
     * @returns True if the extension provides the capability
     */
    extensionProvides(extensionName, capabilityName) {
        const registered = this.registry.getCapability(capabilityName);
        return registered?.extension === extensionName;
    }
    /**
     * Find capability by partial name match
     *
     * @param partial - Partial capability name to search for
     * @returns Array of matching capabilities
     */
    searchCapabilities(partial) {
        const lowerPartial = partial.toLowerCase();
        const results = [];
        for (const registered of this.registry.getAllCapabilities()) {
            if (registered.capability.name.toLowerCase().includes(lowerPartial)) {
                results.push({
                    extensionName: registered.extension,
                    capability: registered.capability,
                });
            }
        }
        return results;
    }
    /**
     * Get the extension name that provides a capability
     *
     * @param capabilityName - Name of the capability
     * @returns Extension name or undefined if not found
     */
    getProvider(capabilityName) {
        const registered = this.registry.getCapability(capabilityName);
        return registered?.extension;
    }
    /**
     * Validate capability input against its schema
     *
     * @param capabilityName - Name of the capability
     * @param input - Input to validate
     * @returns True if valid, false if invalid or no schema defined
     */
    validateInput(capabilityName, input) {
        const registered = this.registry.getCapability(capabilityName);
        if (!registered)
            return false;
        const schema = registered.capability.inputSchema;
        if (!schema)
            return true; // No schema means no validation required
        // Basic schema validation - in a real implementation,
        // this would use a proper JSON Schema validator
        return this.performBasicValidation(input, schema);
    }
    /**
     * Basic input validation against schema
     *
     * Note: This is a simplified validation. For production use,
     * integrate a proper JSON Schema validator like ajv.
     */
    performBasicValidation(input, schema) {
        if (!input || typeof input !== 'object') {
            return schema.type === 'null' || schema.type === undefined;
        }
        const schemaType = schema.type;
        if (schemaType === 'object') {
            const required = schema.required;
            if (required && Array.isArray(required)) {
                const inputObj = input;
                for (const field of required) {
                    if (!(field in inputObj)) {
                        return false;
                    }
                }
            }
        }
        return true;
    }
    /**
     * Get capability statistics
     */
    get stats() {
        const capabilitiesByExtension = new Map();
        for (const extension of this.registry.getAll()) {
            capabilitiesByExtension.set(extension.name, extension.capabilities.length);
        }
        return {
            totalCapabilities: this.registry.capabilityCount,
            capabilitiesByExtension,
        };
    }
}
//# sourceMappingURL=capability-router.js.map