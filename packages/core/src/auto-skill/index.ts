/**
 * AutoSkill Module
 * 
 * Automatic skill discovery, generation, and installation.
 * 
 * @module @jclaw/core/auto-skill
 */

export {
  AutoSkillGenerator,
  createAutoSkillGenerator,
} from './generator.js';

export {
  AutoSkillInstaller,
  createAutoSkillInstaller,
} from './installer.js';

export type {
  AutoSkillConfig,
  CapabilityGap,
  DiscoveryResult,
  GeneratedExtension,
  GenerationResult,
  GenerationStep,
  InstallationResult,
  SkillUsageStats,
  AutoSkillMetadata,
  SkillVersion,
} from './types.js';
