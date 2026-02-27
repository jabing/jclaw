/**
 * Extension System Module
 *
 * Provides extension registration, loading, and capability routing.
 *
 * @module @jclaw/core/extension-system
 */

export { ExtensionRegistry, type RegisteredCapability } from './registry.js';
export {
  ExtensionLoader,
  type LoadOptions,
  type LoadResult,
} from './loader.js';
export {
  CapabilityRouter,
  type CapabilityResolution,
} from './capability-router.js';
