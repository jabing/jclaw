/**
 * Simple Skill.sh Adapter Tests
 */

import {
  SkillShAdapter,
  createSkillShAdapter,
} from '../../src/skill-sh/adapter.js';

// Mock LLMClient
const mockLLMClient = {
  chat: jest.fn(),
};

describe('SkillShAdapter - Simple Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should create adapter instance', () => {
      const adapter = new SkillShAdapter(mockLLMClient as any);
      expect(adapter).toBeDefined();
    });

    it('should accept custom configuration', () => {
      const config = {
        apiBase: 'https://custom.api.com/v1',
        timeout: 60000,
      };
      const adapter = new SkillShAdapter(mockLLMClient as any, config);
      expect(adapter).toBeDefined();
    });
  });

  describe('parseFrontmatter', () => {
    let adapter: SkillShAdapter;

    beforeEach(() => {
      adapter = new SkillShAdapter(mockLLMClient as any);
    });

    it('should parse simple frontmatter', () => {
      const content = `---
name: Test Skill
description: Test description
version: 1.0.0
---

Content here`;

      const result = adapter.parseFrontmatter(content);
      expect(result).toEqual({
        name: 'Test Skill',
        description: 'Test description',
        version: '1.0.0',
      });
    });

    it('should parse arrays in frontmatter', () => {
      const content = `---
name: Test Skill
categories: [test, utility]
tags: [tag1, tag2]
agents: [jclaw]
---

Content`;

      const result = adapter.parseFrontmatter(content);
      expect(result).toEqual({
        name: 'Test Skill',
        categories: ['test', 'utility'],
        tags: ['tag1', 'tag2'],
        agents: ['jclaw'],
      });
    });

    it('should return null for invalid frontmatter', () => {
      const content = 'No frontmatter here';
      const result = adapter.parseFrontmatter(content);
      expect(result).toBeNull();
    });
  });
});

describe('createSkillShAdapter', () => {
  it('should create adapter instance', () => {
    const adapter = createSkillShAdapter(mockLLMClient as any);
    expect(adapter).toBeDefined();
    expect(adapter).toBeInstanceOf(SkillShAdapter);
  });
});
