/**
 * Skill.sh Integration Module
 * 
 * Integration with skill.sh ecosystem for skill discovery and installation
 * 
 * @module @jclaw/core/skill-sh
 */

export * from './types.js';
export * from './adapter.js';
export * from './converter.js';
export * from './discovery.js';
export * from './quality.js';
export * from './registry.js';

// Re-export factory functions for convenience
export {
  createSkillShAdapter,
} from './adapter.js';

export {
  createSkillConverter,
} from './converter.js';

export {
  createSkillDiscoveryEngine,
} from './discovery.js';

export {
  createQualityAssessor,
} from './quality.js';

export {
  createSkillRegistry,
} from './registry.js';
