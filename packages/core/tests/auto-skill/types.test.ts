/**
 * AutoSkill Types Tests
 *
 * Unit tests for type validation.
 */

import type {
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
  SkillShAdapterConfig,
} from '../../src/auto-skill/types.js';

describe('AutoSkill Types', () => {
  // Type validation tests - ensure interfaces are correctly defined
  // This is a compile-time test; if the file compiles, types are valid.

  it('should have required properties for CapabilityGap', () => {
    const gap: CapabilityGap = {
      capability: 'test',
      description: 'test',
      complexity: 'simple',
      reasoning: 'test',
    };
    expect(gap).toBeDefined();
  });

  it('should have required properties for GeneratedExtension', () => {
    const extension: GeneratedExtension = {
      name: 'test',
      code: 'export {}',
      gap: {
        capability: 'test',
        description: 'test',
        complexity: 'simple',
        reasoning: 'test',
      },
      version: '1.0.0',
      generatedAt: new Date(),
      model: 'gpt-4o',
    };
    expect(extension).toBeDefined();
  });

  it('should have required properties for DiscoveryResult', () => {
    const result: DiscoveryResult = {
      taskAnalysis: 'test',
      gaps: [],
      suggestedCapabilities: [],
    };
    expect(result).toBeDefined();
  });

  it('should have required properties for GenerationResult', () => {
    const result: GenerationResult = {
      success: true,
      steps: [],
    };
    expect(result).toBeDefined();
  });

  it('should have required properties for InstallationResult', () => {
    const result: InstallationResult = {
      success: true,
      extensionName: 'test',
      installPath: '/tmp',
    };
    expect(result).toBeDefined();
  });

  it('should have required properties for SkillUsageStats', () => {
    const stats: SkillUsageStats = {
      skillName: 'test',
      usageCount: 0,
      successCount: 0,
      avgExecutionTime: 0,
    };
    expect(stats).toBeDefined();
  });

  it('should have required properties for AutoSkillMetadata', () => {
    const metadata: AutoSkillMetadata = {
      id: 'test',
      name: 'test',
      capability: {
        name: 'test',
        description: 'test',
      },
      sourceCode: 'export {}',
      generationReason: 'test',
      versions: [],
      usageStats: {
        skillName: 'test',
        usageCount: 0,
        successCount: 0,
        avgExecutionTime: 0,
      },
      isValidated: false,
    };
    expect(metadata).toBeDefined();
  });

  it('should have required properties for SkillVersion', () => {
    const version: SkillVersion = {
      version: '1.0.0',
      code: 'export {}',
      changes: 'initial',
      fitness: 0.5,
      createdAt: new Date(),
    };
    expect(version).toBeDefined();
  });

  it('should have required properties for SkillShAdapterConfig', () => {
    const config: SkillShAdapterConfig = {
      apiBase: 'https://api.skills.sh',
      apiKey: 'key',
      timeout: 5000,
      enableCache: true,
      cacheTtl: 3600,
    };
    expect(config).toBeDefined();
  });

  it('should have required properties for AutoSkillConfig', () => {
    const config: AutoSkillConfig = {
      enabled: true,
      maxGenerationAttempts: 3,
      storageDir: './.jclaw/auto-skills',
      autoInstall: true,
      minFitness: 0.7,
      generationTimeout: 120000,
      enableEvolution: true,
    };
    expect(config).toBeDefined();
  });
});
