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
export class CapabilityRouter {
  constructor(private readonly registry: ExtensionRegistry) {}

  /**
   * Resolve a capability by name
   *
   * @param capabilityName - Name of the capability to resolve
   * @returns Capability resolution or null if not found
   */
  resolve(capabilityName: string): CapabilityResolution | null {
    const registered = this.registry.getCapability(capabilityName);
    if (!registered) return null;

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
  hasCapability(name: string): boolean {
    return this.registry.hasCapability(name);
  }

  /**
   * Get all available capability names
   *
   * @returns Array of capability names
   */
  getAvailableCapabilities(): string[] {
    return this.registry.getCapabilityNames();
  }

  /**
   * Get all capabilities with their providers
   *
   * @returns Array of capability resolutions
   */
  getAllCapabilities(): CapabilityResolution[] {
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
  getCapabilitiesByExtension(extensionName: string): Capability[] {
    return this.registry.getCapabilitiesByExtension(extensionName);
  }

  /**
   * Check if an extension provides a specific capability
   *
   * @param extensionName - Name of the extension
   * @param capabilityName - Name of the capability
   * @returns True if the extension provides the capability
   */
  extensionProvides(extensionName: string, capabilityName: string): boolean {
    const registered = this.registry.getCapability(capabilityName);
    return registered?.extension === extensionName;
  }

  /**
   * Find capability by partial name match
   *
   * @param partial - Partial capability name to search for
   * @returns Array of matching capabilities
   */
  searchCapabilities(partial: string): CapabilityResolution[] {
    const lowerPartial = partial.toLowerCase();
    const results: CapabilityResolution[] = [];

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
  getProvider(capabilityName: string): string | undefined {
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
  validateInput(capabilityName: string, input: unknown): boolean {
    const registered = this.registry.getCapability(capabilityName);
    if (!registered) return false;

    const schema = registered.capability.inputSchema;
    if (!schema) return true; // No schema means no validation required

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
  private performBasicValidation(
    input: unknown,
    schema: Record<string, unknown>
  ): boolean {
    if (!input || typeof input !== 'object') {
      return schema.type === 'null' || schema.type === undefined;
    }

    const schemaType = schema.type as string | undefined;

    if (schemaType === 'object') {
      const required = schema.required as string[] | undefined;
      if (required && Array.isArray(required)) {
        const inputObj = input as Record<string, unknown>;
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
  get stats(): {
    totalCapabilities: number;
    capabilitiesByExtension: Map<string, number>;
  } {
    const capabilitiesByExtension = new Map<string, number>();

    for (const extension of this.registry.getAll()) {
      capabilitiesByExtension.set(
        extension.name,
        extension.capabilities.length
      );
    }

    return {
      totalCapabilities: this.registry.capabilityCount,
      capabilitiesByExtension,
    };
  }
}
