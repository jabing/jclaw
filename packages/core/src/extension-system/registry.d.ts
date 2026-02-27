/**
 * Extension Registry
 *
 * Manages registration and lookup of extensions and their capabilities.
 *
 * @module @jclaw/core/extension-system/registry
 */
import type { Extension, Capability } from '../types.js';
/**
 * Represents a registered capability with its source extension
 */
export interface RegisteredCapability {
    /** Name of the extension providing this capability */
    extension: string;
    /** The capability definition */
    capability: Capability;
}
/**
 * Extension Registry
 *
 * Central registry for managing extensions and their capabilities.
 * Provides O(1) lookup for both extensions and capabilities.
 */
export declare class ExtensionRegistry {
    private readonly extensions;
    private readonly capabilities;
    /**
     * Register an extension and all its capabilities
     *
     * @param extension - The extension to register
     * @throws Error if extension with same name is already registered
     */
    register(extension: Extension): void;
    /**
     * Unregister an extension and all its capabilities
     *
     * @param name - Name of the extension to unregister
     */
    unregister(name: string): void;
    /**
     * Get an extension by name
     *
     * @param name - Extension name
     * @returns The extension or undefined if not found
     */
    get(name: string): Extension | undefined;
    /**
     * Check if an extension is registered
     *
     * @param name - Extension name
     * @returns True if extension is registered
     */
    has(name: string): boolean;
    /**
     * Get all registered extensions
     *
     * @returns Array of all extensions
     */
    getAll(): Extension[];
    /**
     * Get all extension names
     *
     * @returns Array of extension names
     */
    getNames(): string[];
    /**
     * Get a registered capability by name
     *
     * @param name - Capability name
     * @returns The registered capability or undefined if not found
     */
    getCapability(name: string): RegisteredCapability | undefined;
    /**
     * Check if a capability is registered
     *
     * @param name - Capability name
     * @returns True if capability is registered
     */
    hasCapability(name: string): boolean;
    /**
     * Get all registered capabilities
     *
     * @returns Array of all registered capabilities
     */
    getAllCapabilities(): RegisteredCapability[];
    /**
     * Get all capability names
     *
     * @returns Array of capability names
     */
    getCapabilityNames(): string[];
    /**
     * Get capabilities provided by a specific extension
     *
     * @param extensionName - Name of the extension
     * @returns Array of capabilities or empty array if extension not found
     */
    getCapabilitiesByExtension(extensionName: string): Capability[];
    /**
     * Clear all registered extensions and capabilities
     */
    clear(): void;
    /**
     * Get the number of registered extensions
     */
    get size(): number;
    /**
     * Get the number of registered capabilities
     */
    get capabilityCount(): number;
}
//# sourceMappingURL=registry.d.ts.map