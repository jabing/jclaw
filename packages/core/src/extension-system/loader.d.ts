/**
 * Extension Loader
 *
 * Handles loading, validating, and unloading extensions.
 *
 * @module @jclaw/core/extension-system/loader
 */
import type { Extension } from '../types.js';
import { ExtensionRegistry } from './registry.js';
/**
 * Options for extension loading
 */
export interface LoadOptions {
    /** Skip dependency resolution */
    skipDependencies?: boolean;
}
/**
 * Result of extension loading
 */
export interface LoadResult {
    /** Whether loading succeeded */
    success: boolean;
    /** Error message if loading failed */
    error?: string;
}
/**
 * Extension Loader
 *
 * Responsible for loading and unloading extensions with lifecycle management.
 */
export declare class ExtensionLoader {
    private readonly registry;
    constructor(registry: ExtensionRegistry);
    /**
     * Load an extension into the registry
     *
     * This method:
     * 1. Validates the extension structure
     * 2. Calls the extension's install lifecycle method
     * 3. Registers the extension with the registry
     *
     * @param extension - The extension to load
     * @param runtime - Optional runtime context to pass to install
     * @param options - Loading options
     * @returns Load result indicating success or failure
     */
    load(extension: Extension, runtime?: unknown, options?: LoadOptions): Promise<LoadResult>;
    /**
     * Unload an extension from the registry
     *
     * This method:
     * 1. Calls the extension's uninstall lifecycle method
     * 2. Removes the extension from the registry
     *
     * @param name - Name of the extension to unload
     * @returns Load result indicating success or failure
     */
    unload(name: string): Promise<LoadResult>;
    /**
     * Load multiple extensions in dependency order
     *
     * @param extensions - Extensions to load
     * @param runtime - Optional runtime context
     * @returns Map of extension names to load results
     */
    loadAll(extensions: Extension[], runtime?: unknown): Promise<Map<string, LoadResult>>;
    /**
     * Unload all registered extensions
     *
     * @returns Map of extension names to unload results
     */
    unloadAll(): Promise<Map<string, LoadResult>>;
    /**
     * Validate an extension object
     *
     * @param extension - Extension to validate
     * @returns Error message or null if valid
     */
    validateExtension(extension: unknown): string | null;
    /**
     * Validate a capability object
     */
    private validateCapability;
    /**
     * Find extensions that depend on a given extension
     */
    private findDependents;
    /**
     * Sort extensions by their dependencies (topological sort)
     */
    private sortByDependencies;
}
//# sourceMappingURL=loader.d.ts.map