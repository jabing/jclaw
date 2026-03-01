/**
 * Skill.sh Adapter Tests
 */

import { jest } from '@jest/globals';

import {
  SkillShAdapter,
  createSkillShAdapter,
  searchSkillShAPI,
  SkillShSearchResponse,
} from '../../src/skill-sh/adapter.js';
import type {
  SkillShResult,
  SkillShDetail,
  SkillSearchOptions,
} from '../../src/skill-sh/types.js';
import type { LLMClient } from '../../src/runtime/llm-client.js';

describe('SkillShAdapter', () => {
  const mockLLMClient = {
    chat: jest.fn(),
  } as unknown as LLMClient;

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('constructor', () => {
    it('should create adapter with default config', () => {
      const adapter = new SkillShAdapter(mockLLMClient);

      expect(adapter).toBeDefined();
      // Check default config values
    });

    it('should create adapter with custom config', () => {
      const customConfig = {
        apiBase: 'https://api.custom.com/v1',
        cacheDir: './custom-cache',
        enableCache: false,
        timeout: 60000,
      };

      const adapter = new SkillShAdapter(mockLLMClient, customConfig);

      expect(adapter).toBeDefined();
      // Check custom config values
    });
  });

  describe('search', () => {
    let adapter: SkillShAdapter;

    beforeEach(() => {
      adapter = new SkillShAdapter(mockLLMClient);
    });

    it('should return cached results when available', async () => {
      const searchOptions: SkillSearchOptions = { query: 'test' };

      // Mock fetch to return test data
      // @ts-expect-error
      (global.fetch as jest.Mock) = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ([
          {
            id: 'owner/repo1',
            name: 'Test Skill 1',
            description: 'Test description 1',
            owner: 'owner',
            repo: 'repo1',
            stars: 100,
            downloads: 1000,
            updatedAt: '2024-01-01T00:00:00Z',
            version: '1.0.0',
            categories: ['test'],
            tags: ['test'],
            agents: ['jclaw'],
            quality: 85,
            rating: 4.5,
          },
        ]),
      });

      const firstResult = await adapter.search(searchOptions);
      expect(firstResult).toHaveLength(1);
      expect(firstResult[0]!.id).toBe('owner/repo1');

      // Second call should use cache
      const secondResult = await adapter.search(searchOptions);
      expect(secondResult).toHaveLength(1);
      expect(fetch).toHaveBeenCalledTimes(1); // Only called once due to caching
    });

    it('should handle API errors gracefully', async () => {
      // @ts-expect-error
      (global.fetch as jest.Mock) = jest.fn().mockRejectedValue(new Error('Network error'));

      const searchOptions: SkillSearchOptions = { query: 'test' };

      const result = await adapter.search(searchOptions);
      expect(result).toEqual([]);
    });
  });

  describe('getSkill', () => {
    let adapter: SkillShAdapter;

    beforeEach(() => {
      adapter = new SkillShAdapter(mockLLMClient);
    });

    it('should return skill detail when found', async () => {
      const skillId = 'owner/repo';
      // @ts-expect-error
      (global.fetch as jest.Mock) = jest.fn().mockResolvedValue({
          ok: true,
          json: async () => ({
            id: skillId,
            name: 'Test Skill',
            description: 'Test description',
            owner: 'owner',
            repo: 'repo',
            stars: 100,
            downloads: 1000,
            updatedAt: '2024-01-01T00:00:00Z',
            version: '1.0.0',
            categories: ['test'],
            tags: ['test'],
            agents: ['jclaw'],
            quality: 85,
            rating: 4.5,
            readme: '# Test Skill\n\nDescription',
            skillMd: '---\nname: Test Skill\n---',
            examples: ['example usage'],
            permissions: ['read'],
            dependencies: ['dependency'],
            installCommand: 'npx skills add owner/repo',
            size: 1024,
            license: 'MIT',
          }),
        });

      const result = await adapter.getSkill(skillId);

      expect(result).toBeDefined();
      expect(result!.id).toBe(skillId);
      expect(result!.readme).toBe('# Test Skill\n\nDescription');
    });

    it('should return null for non-existent skill', async () => {
      // @ts-expect-error
      (global.fetch as jest.Mock) = jest.fn().mockResolvedValue({
        ok: false,
        status: 404,
      });

      const result = await adapter.getSkill('owner/nonexistent');
      expect(result).toBeNull();
    });
  });

  describe('installSkill', () => {
    let adapter: SkillShAdapter;

    beforeEach(() => {
      adapter = new SkillShAdapter(mockLLMClient);
    });

    it('should return successful installation result', async () => {
      const skillId = 'owner/repo';
      const mockExecSync = jest.fn().mockReturnValue('Installation successful');

      // Mock execSync
      const originalExecSync = require('child_process').execSync;
      require('child_process').execSync = mockExecSync;

      // Mock getSkill to return skill details
      jest.spyOn(adapter, 'getSkill').mockResolvedValue({
        id: skillId,
        name: 'Test Skill',
        description: 'Test description',
        owner: 'owner',
        repo: 'repo',
        stars: 100,
        downloads: 1000,
        updatedAt: '2024-01-01T00:00:00Z',
        version: '1.0.0',
        categories: ['test'],
        tags: ['test'],
        agents: ['jclaw'],
        quality: 85,
        rating: 4.5,
        readme: '# Test Skill',
        skillMd: '---\nname: Test Skill\n---',
        examples: [],
        permissions: [],
        dependencies: [],
        installCommand: 'npx skills add owner/repo',
        size: 1024,
        license: 'MIT',
      });

      const result = await adapter.installSkill(skillId);

      expect(result.success).toBe(true);
      expect(result.skill).toBeDefined();
      expect(result.skill!.id).toBe(skillId);
      expect(result.duration).toBeGreaterThanOrEqual(0);

      // Restore original execSync
      require('child_process').execSync = originalExecSync;
    });

    it('should handle installation errors', async () => {
      const skillId = 'owner/repo';
      const mockExecSync = jest.fn().mockImplementation(() => {
        throw new Error('Installation failed');
      });

      const originalExecSync = require('child_process').execSync;
      require('child_process').execSync = mockExecSync;

      const result = await adapter.installSkill(skillId);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Installation failed');
      expect(result.duration).toBeGreaterThanOrEqual(0);

      require('child_process').execSync = originalExecSync;
    });
  });

  describe('parseFrontmatter', () => {
    let adapter: SkillShAdapter;

    beforeEach(() => {
      adapter = new SkillShAdapter(mockLLMClient);
    });

    it('should parse valid frontmatter', () => {
      const content = `---
name: Test Skill
description: A test skill for JClaw
version: 1.0.0
categories: [test, utility]
tags: [test, example]
agents: [jclaw]
permissions: [read]
minJClawVersion: 0.8.0
---

# Skill content
`;

      const result = adapter.parseFrontmatter(content);

      expect(result).toBeDefined();
      expect(result!.name).toBe('Test Skill');
      expect(result!.description).toBe('A test skill for JClaw');
      expect(result!.version).toBe('1.0.0');
      expect(result!.categories).toEqual(['test', 'utility']);
      expect(result!.tags).toEqual(['test', 'example']);
      expect(result!.agents).toEqual(['jclaw']);
    });

    it('should return null for content without frontmatter', () => {
      const content = '# No frontmatter here\nJust regular content';

      const result = adapter.parseFrontmatter(content);
      expect(result).toBeNull();
    });

    it('should handle invalid frontmatter gracefully', () => {
      const content = `---
invalid yaml: : :
---

Content`;

      const result = adapter.parseFrontmatter(content);
      expect(result).toEqual({ "invalid yaml": ": :" });
    });
  });
});

describe('createSkillShAdapter', () => {
  const mockLLMClient = {
    chat: jest.fn(),
  } as unknown as LLMClient;

  it('should create adapter instance', () => {
    const adapter = createSkillShAdapter(mockLLMClient);

    expect(adapter).toBeDefined();
    expect(adapter).toBeInstanceOf(SkillShAdapter);
  });

  it('should create adapter with config', () => {
    const config = { timeout: 50000 };
    const adapter = createSkillShAdapter(mockLLMClient, config);

    expect(adapter).toBeDefined();
  });
});

describe('searchSkillShAPI', () => {
  it('should make API request with correct parameters', async () => {
    // @ts-expect-error
    const mockFetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ results: [] }),
    });

    (global.fetch as jest.Mock) = mockFetch;

    const options: SkillSearchOptions = {
      query: 'test query',
      category: 'utility',
      minQuality: 70,
      limit: 10,
    };

    await searchSkillShAPI(options.query, { limit: options.limit });

    expect(mockFetch).toHaveBeenCalled();
    const callUrl = mockFetch.mock.calls[0]![0];
    expect(callUrl).toContain('api.skills.sh');
    expect(callUrl).toMatch(/test[%20+]query/);
  });

  it('should handle API errors', async () => {
    // @ts-expect-error
    (global.fetch as jest.Mock) = jest.fn().mockRejectedValue(new Error('API error'));

    const options: SkillSearchOptions = { query: 'test' };
    const result = await searchSkillShAPI(options.query);

    expect(result).toEqual({ results: [], total: 0, page: 1, hasMore: false });
  });
});
