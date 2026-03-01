/**
 * SkillDiscoveryEngine Tests
 *
 * Unit tests for SkillDiscoveryEngine class.
 */

import { jest } from '@jest/globals';
import {
  SkillDiscoveryEngine,
  createSkillDiscoveryEngine,
} from '../../src/skill-sh/discovery.js';
import type { LLMClient } from '../../src/runtime/llm-client.js';
import type { ExtensionRegistry } from '../../src/extension-system/registry.js';
import type { SkillShAdapter } from '../../src/skill-sh/adapter.js';
import type { SkillConverter } from '../../src/skill-sh/converter.js';
import type { AutoSkillGenerator } from '../../src/auto-skill/generator.js';
import type {
  SkillShResult,
  SkillDiscoveryResult,
} from '../../src/skill-sh/types.js';
import type { Extension } from '../../src/types.js';
type SkillShResultWithRelevanceScore = SkillShResult & { relevanceScore?: number };

describe('SkillDiscoveryEngine', () => {
  let mockLLMClient: jest.Mocked<LLMClient>;
  let mockRegistry: jest.Mocked<ExtensionRegistry>;
  let mockSkillShAdapter: jest.Mocked<SkillShAdapter>;
  let mockSkillConverter: jest.Mocked<SkillConverter>;
  let mockAutoSkillGenerator: jest.Mocked<AutoSkillGenerator> | undefined;
  let engine: SkillDiscoveryEngine;

  const mockSkillShResult: SkillShResult = {
    id: 'owner/repo1',
    name: 'test-skill',
    description: 'Test skill description',
    owner: 'owner',
    repo: 'repo1',
    stars: 150,
    downloads: 1200,
    updatedAt: '2024-01-01T00:00:00Z',
    version: '1.0.0',
    categories: ['test'],
    tags: ['test'],
    agents: ['jclaw'],
    quality: 85,
    rating: 4.5,
  };

  const mockExtension: Extension = {
    name: 'test-extension',
    description: 'Test extension',
    version: '1.0.0',
    capabilities: [],
    dependencies: [],
    optionalDependencies: [],
    install: async (runtime: unknown) => {},
    uninstall: async () => {},
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock console.log and console.error to keep test output clean
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});

    mockLLMClient = {
      chat: jest.fn(),
    } as any;

    mockRegistry = {
      getAll: jest.fn(),
    } as any;

    mockSkillShAdapter = {
      search: jest.fn(),
      installSkill: jest.fn(),
      getSkill: jest.fn(),
    } as any;

    mockSkillConverter = {
      convert: jest.fn(),
    } as any;

    mockAutoSkillGenerator = undefined;

    engine = new SkillDiscoveryEngine(
      mockLLMClient,
      mockRegistry,
      mockSkillShAdapter,
      mockSkillConverter,
      mockAutoSkillGenerator
    );
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('constructor', () => {
    it('should create engine with all dependencies', () => {
      expect(engine).toBeDefined();
      expect(engine).toBeInstanceOf(SkillDiscoveryEngine);
    });

    it('should create engine with optional autoSkillGenerator', () => {
      const engineWithGenerator = new SkillDiscoveryEngine(
        mockLLMClient,
        mockRegistry,
        mockSkillShAdapter,
        mockSkillConverter,
        mockAutoSkillGenerator
      );
      expect(engineWithGenerator).toBeDefined();
    });
  });

  describe('discover', () => {
    it('should discover skills from skill.sh and local registry', async () => {
      const query = 'test query';
      const mockSkillShResults = [mockSkillShResult];
      const mockLocalMatches: SkillShResult[] = [];

      mockSkillShAdapter.search.mockResolvedValue(mockSkillShResults);
      mockRegistry.getAll.mockReturnValue([]);

      const result = await engine.discover(query);

      expect(mockSkillShAdapter.search).toHaveBeenCalledWith({
        query,
        sortBy: 'quality',
        limit: 10,
      });
      expect(mockRegistry.getAll).toHaveBeenCalled();
      expect(result).toBeDefined();
      expect(result.query).toBe(query);
      expect(result.skillShResults).toHaveLength(1);
      expect(result.communityResults).toHaveLength(0);
      expect(result.recommended).toBeDefined();
      expect(result.confidence).toBeGreaterThanOrEqual(0);
      expect(result.source).toBe('skill.sh');
    });

    it('should prioritize local matches over skill.sh results', async () => {
      const query = 'test';
      const localSkill: SkillShResult = {
        ...mockSkillShResult,
        id: 'local/test',
        owner: 'local',
        stars: 0,
        downloads: 0,
        quality: 90,
      };

      mockSkillShAdapter.search.mockResolvedValue([mockSkillShResult]);
      mockRegistry.getAll.mockReturnValue([
        {
          name: 'test',
          description: 'Test extension',
          version: '1.0.0',
          capabilities: [],
          install: async (runtime: unknown) => {},
          uninstall: async () => {},
        },
      ]);

      const result = await engine.discover(query);

      expect(result.recommended).toBeDefined();
      expect(result.recommended?.owner).toBe('local');
      expect(result.confidence).toBe(0.95);
    });

    it('should handle empty results', async () => {
      const query = 'nonexistent query';

      mockSkillShAdapter.search.mockResolvedValue([]);
      mockRegistry.getAll.mockReturnValue([]);

      const result = await engine.discover(query);

      expect(result.skillShResults).toHaveLength(0);
      expect(result.communityResults).toHaveLength(0);
      expect(result.recommended).toBeUndefined();
      expect(result.confidence).toBe(0);
      expect(result.source).toBe('none');
    });

    it('should handle skill.sh search failure gracefully', async () => {
      const query = 'test';

      mockSkillShAdapter.search.mockRejectedValue(new Error('Network error'));
      mockRegistry.getAll.mockReturnValue([]);

      const result = await engine.discover(query);

      expect(result.skillShResults).toHaveLength(0);
      expect(result.communityResults).toHaveLength(0);
      expect(result.recommended).toBeUndefined();
      expect(result.confidence).toBe(0);
      expect(result.source).toBe('none');
    });
  });

  describe('installSkill', () => {
    it('should install skill successfully', async () => {
      const skill = mockSkillShResult;
      const mockInstallResult = {
        success: true,
        skill,
        installPath: '/path/to/skill',
        duration: 100,
      };

      mockSkillShAdapter.installSkill.mockResolvedValue(mockInstallResult);

      const result = await engine.installSkill(skill);

      expect(mockSkillShAdapter.installSkill).toHaveBeenCalledWith(skill.id);
      expect(result).toBe(true);
    });

    it('should return false when installation fails', async () => {
      const skill = mockSkillShResult;
      const mockInstallResult = {
        success: false,
        error: 'Installation failed',
        duration: 100,
      };

      mockSkillShAdapter.installSkill.mockResolvedValue(mockInstallResult);

      const result = await engine.installSkill(skill);

      expect(mockSkillShAdapter.installSkill).toHaveBeenCalledWith(skill.id);
      expect(result).toBe(false);
    });

    it('should return false on installation error', async () => {
      const skill = mockSkillShResult;

      mockSkillShAdapter.installSkill.mockRejectedValue(
        new Error('Install error')
      );

      const result = await engine.installSkill(skill);

      expect(mockSkillShAdapter.installSkill).toHaveBeenCalledWith(skill.id);
      expect(result).toBe(false);
    });
  });

  // Private method tests (tested indirectly through public methods)
  describe('ranking and selection', () => {
    it('should rank skills by relevance score', async () => {
      const query = 'test';
      const skills: SkillShResult[] = [
        {
          ...mockSkillShResult,
          name: 'Test Skill Exact',
          description: 'Test description',
        },
        {
          ...mockSkillShResult,
          name: 'Other Skill',
          description: 'Another description',
        },
      ];

      mockSkillShAdapter.search.mockResolvedValue(skills);
      mockRegistry.getAll.mockReturnValue([]);

      const result = await engine.discover(query);

      // First skill should be ranked higher because name contains 'Test' exactly
      expect(result.skillShResults[0]?.name).toBe('Test Skill Exact');
      const firstSkill = result.skillShResults[0] as SkillShResultWithRelevanceScore;
      const secondSkill = result.skillShResults[1] as SkillShResultWithRelevanceScore;
      expect(firstSkill.relevanceScore).toBeGreaterThan(secondSkill?.relevanceScore || 0);
    });

    it('should calculate confidence based on skill quality', async () => {
      const highQualitySkill: SkillShResult = {
        ...mockSkillShResult,
        stars: 500,
        downloads: 5000,
        quality: 95,
      };

      mockSkillShAdapter.search.mockResolvedValue([highQualitySkill]);
      mockRegistry.getAll.mockReturnValue([]);

      const result = await engine.discover('test');

      expect(result.confidence).toBeGreaterThan(0.7);
    });
  });

  describe('createSkillDiscoveryEngine', () => {
    it('should create engine instance', () => {
      const instance = createSkillDiscoveryEngine(
        mockLLMClient,
        mockRegistry,
        mockSkillShAdapter,
        mockSkillConverter,
        mockAutoSkillGenerator
      );
      expect(instance).toBeInstanceOf(SkillDiscoveryEngine);
    });
  });
});
