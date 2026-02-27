/**
 * Capability Router
 *
 * Routes capability requests to the appropriate extension.
 *
 * @module @jclaw/core/extension-system/capability-router
 */
import type { Capability } from '../types.js';
import { ExtensionRegistry } from './registry.js';
/**
 * Capability resolution result
 */
export interface CapabilityResolution {
    /** Name of the extension providing the capability */
    extensionName: string;
    /** The resolved capability */
    capability: Capability;
}
/**
 * Capability Router
 *
 * Provides capability lookup and routing functionality.
 * Acts as a query interface over the extension registry.
 */
export declare class CapabilityRouter {
    private readonly registry;
    constructor(registry: ExtensionRegistry);
    /**
     * Resolve a capability by name
     *
     * @param capabilityName - Name of the capability to resolve
     * @returns Capability resolution or null if not found
     */
    resolve(capabilityName: string): CapabilityResolution | null;
    /**
     * Check if a capability is available
     *
     * @param name - Capability name
     * @returns True if capability is registered
     */
    hasCapability(name: string): boolean;
    /**
     * Get all available capability names
     *
     * @returns Array of capability names
     */
    getAvailableCapabilities(): string[];
    /**
     * Get all capabilities with their providers
     *
     * @returns Array of capability resolutions
     */
    getAllCapabilities(): CapabilityResolution[];
    /**
     * Get capabilities provided by a specific extension
     *
     * @param extensionName - Name of the extension
     * @returns Array of capabilities or empty array if extension not found
     */
    getCapabilitiesByExtension(extensionName: string): Capability[];
    /**
     * Check if an extension provides a specific capability
     *
     * @param extensionName - Name of the extension
     * @param capabilityName - Name of the capability
     * @returns True if the extension provides the capability
     */
    extensionProvides(extensionName: string, capabilityName: string): boolean;
    /**
     * Find capability by partial name match
     *
     * @param partial - Partial capability name to search for
     * @returns Array of matching capabilities
     */
    searchCapabilities(partial: string): CapabilityResolution[];
    /**
     * Get the extension name that provides a capability
     *
     * @param capabilityName - Name of the capability
     * @returns Extension name or undefined if not found
     */
    getProvider(capabilityName: string): string | undefined;
    /**
     * Validate capability input against its schema
     *
     * @param capabilityName - Name of the capability
     * @param input - Input to validate
     * @returns True if valid, false if invalid or no schema defined
     */
    validateInput(capabilityName: string, input: unknown): boolean;
    /**
     * Basic input validation against schema
     *
     * Note: This is a simplified validation. For production use,
     * integrate a proper JSON Schema validator like ajv.
     */
    private performBasicValidation;
    /**
     * Get capability statistics
     */
    get stats(): {
        totalCapabilities: number;
        capabilitiesByExtension: Map<string, number>;
    };
}
//# sourceMappingURL=capability-router.d.ts.map