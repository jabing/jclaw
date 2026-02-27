/**
 * Extension Loader
 *
 * Handles loading, validating, and unloading extensions.
 *
 * @module @jclaw/core/extension-system/loader
 */

import type { Extension, Capability } from '../types.js';
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
export class ExtensionLoader {
  constructor(private readonly registry: ExtensionRegistry) {}

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
  async load(
    extension: Extension,
    runtime?: unknown,
    options?: LoadOptions
  ): Promise<LoadResult> {
    try {
      // Validate extension structure
      const validationError = this.validateExtension(extension);
      if (validationError) {
        return { success: false, error: validationError };
      }

      // Check for existing registration
      if (this.registry.has(extension.name)) {
        return {
          success: false,
          error: `Extension "${extension.name}" is already loaded`,
        };
      }

      // Check dependencies if not skipped
      if (!options?.skipDependencies && extension.dependencies) {
        const missingDeps = extension.dependencies.filter(
          (dep) => !this.registry.has(dep)
        );
        if (missingDeps.length > 0) {
          return {
            success: false,
            error: `Missing required dependencies: ${missingDeps.join(', ')}`,
          };
        }
      }

      // Call install lifecycle method
      if (extension.install) {
        await extension.install(runtime);
      }

      // Register the extension
      this.registry.register(extension);

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

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
  async unload(name: string): Promise<LoadResult> {
    try {
      const extension = this.registry.get(name);
      if (!extension) {
        return {
          success: false,
          error: `Extension "${name}" is not loaded`,
        };
      }

      // Check if other extensions depend on this one
      const dependents = this.findDependents(name);
      if (dependents.length > 0) {
        return {
          success: false,
          error: `Cannot unload: extensions [${dependents.join(', ')}] depend on "${name}"`,
        };
      }

      // Call uninstall lifecycle method
      if (extension.uninstall) {
        await extension.uninstall();
      }

      // Unregister the extension
      this.registry.unregister(name);

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Load multiple extensions in dependency order
   *
   * @param extensions - Extensions to load
   * @param runtime - Optional runtime context
   * @returns Map of extension names to load results
   */
  async loadAll(
    extensions: Extension[],
    runtime?: unknown
  ): Promise<Map<string, LoadResult>> {
    const results = new Map<string, LoadResult>();
    const sorted = this.sortByDependencies(extensions);

    for (const extension of sorted) {
      const result = await this.load(extension, runtime);
      results.set(extension.name, result);
    }

    return results;
  }

  /**
   * Unload all registered extensions
   *
   * @returns Map of extension names to unload results
   */
  async unloadAll(): Promise<Map<string, LoadResult>> {
    const results = new Map<string, LoadResult>();

    // Unload in reverse dependency order
    const names = [...this.registry.getNames()].reverse();

    for (const name of names) {
      const result = await this.unload(name);
      results.set(name, result);
    }

    return results;
  }

  /**
   * Validate an extension object
   *
   * @param extension - Extension to validate
   * @returns Error message or null if valid
   */
  validateExtension(extension: unknown): string | null {
    if (!extension || typeof extension !== 'object') {
      return 'Extension must be an object';
    }

    const ext = extension as Partial<Extension>;

    if (!ext.name || typeof ext.name !== 'string') {
      return 'Extension must have a string "name" property';
    }

    if (!ext.version || typeof ext.version !== 'string') {
      return 'Extension must have a string "version" property';
    }

    if (!ext.description || typeof ext.description !== 'string') {
      return 'Extension must have a string "description" property';
    }

    if (!Array.isArray(ext.capabilities)) {
      return 'Extension must have an array "capabilities" property';
    }

    // Validate each capability
    for (let i = 0; i < ext.capabilities.length; i++) {
      const capError = this.validateCapability(ext.capabilities[i], i);
      if (capError) return capError;
    }

    // Validate dependencies if present
    if (ext.dependencies !== undefined && !Array.isArray(ext.dependencies)) {
      return 'Extension "dependencies" must be an array of strings';
    }

    if (
      ext.optionalDependencies !== undefined &&
      !Array.isArray(ext.optionalDependencies)
    ) {
      return 'Extension "optionalDependencies" must be an array of strings';
    }

    return null;
  }

  /**
   * Validate a capability object
   */
  private validateCapability(
    capability: unknown,
    index: number
  ): string | null {
    if (!capability || typeof capability !== 'object') {
      return `Capability at index ${index} must be an object`;
    }

    const cap = capability as Partial<Capability>;

    if (!cap.name || typeof cap.name !== 'string') {
      return `Capability at index ${index} must have a string "name" property`;
    }

    if (!cap.description || typeof cap.description !== 'string') {
      return `Capability at index ${index} must have a string "description" property`;
    }

    return null;
  }

  /**
   * Find extensions that depend on a given extension
   */
  private findDependents(name: string): string[] {
    const dependents: string[] = [];

    for (const ext of this.registry.getAll()) {
      if (ext.dependencies?.includes(name)) {
        dependents.push(ext.name);
      }
    }

    return dependents;
  }

  /**
   * Sort extensions by their dependencies (topological sort)
   */
  private sortByDependencies(extensions: Extension[]): Extension[] {
    const sorted: Extension[] = [];
    const visited = new Set<string>();
    const visiting = new Set<string>();

    const visit = (extension: Extension): boolean => {
      if (visited.has(extension.name)) return true;
      if (visiting.has(extension.name)) return false; // Circular dependency

      visiting.add(extension.name);

      // Visit dependencies first
      if (extension.dependencies) {
        for (const depName of extension.dependencies) {
          const dep = extensions.find((e) => e.name === depName);
          if (dep && !visit(dep)) {
            return false;
          }
        }
      }

      visiting.delete(extension.name);
      visited.add(extension.name);
      sorted.push(extension);

      return true;
    };

    for (const extension of extensions) {
      if (!visited.has(extension.name)) {
        visit(extension);
      }
    }

    return sorted;
  }
}
