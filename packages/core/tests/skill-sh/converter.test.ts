/**
 * SkillConverter Tests
 *
 * Unit tests for SkillConverter class.
 */

import { jest } from '@jest/globals';
import {
  SkillConverter,
  createSkillConverter,
} from '../../src/skill-sh/converter.js';
import type { LLMClient } from '../../src/runtime/llm-client.js';
import type {
  SkillShResult,
  ConvertedSkill,
  SkillFrontmatter,
} from '../../src/skill-sh/types.js';
import type { Extension, Capability } from '../../src/types.js';

describe('SkillConverter', () => {
  let mockLLMClient: jest.Mocked<LLMClient>;
  let converter: SkillConverter;

  const mockSkill: SkillShResult = {
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

  const sampleSkillMd = `---
name: Test Skill
description: A test skill for demonstration
version: 1.0.0
author: Test Author
categories: [test, utility]
---

# Test Skill

This is a test skill for demonstration purposes.

## Usage

\`\`\`typescript
// Example usage
const result = await skill.execute({ input: 'test' });
\`\`\`

## API

- **execute**: Main execution function
`;

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock console.error to keep test output clean
    jest.spyOn(console, 'error').mockImplementation(() => {});

    mockLLMClient = {
      chat: jest.fn(),
    } as any;

    converter = new SkillConverter(mockLLMClient);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('constructor', () => {
    it('should create converter with LLM client', () => {
      expect(converter).toBeDefined();
      expect(converter).toBeInstanceOf(SkillConverter);
    });
  });

  describe('convert', () => {
    it('should convert skill with valid frontmatter', async () => {
      const result = await converter.convert(mockSkill, sampleSkillMd);

      expect(result).toBeDefined();
      expect(result.original).toEqual(mockSkill);
      expect(result.extension).toBeDefined();
      expect(result.extension.name).toBe(`skill-${mockSkill.name}`);
      expect(result.extension.version).toBe(mockSkill.version);
      expect(result.quality).toBeGreaterThanOrEqual(50);
      expect(Array.isArray(result.warnings)).toBe(true);
    });

    it('should handle skill without frontmatter', async () => {
      const skillMdWithoutFrontmatter = `# No Frontmatter Skill

Just a simple skill without frontmatter.`;

      const result = await converter.convert(
        mockSkill,
        skillMdWithoutFrontmatter
      );

      expect(result).toBeDefined();
      expect(result.warnings).toContain('Failed to parse SKILL.md frontmatter');
      expect(result.extension.description).toContain('Skill.sh:');
    });

    it('should include warnings when no capabilities generated', async () => {
      // Mock LLM to return empty capabilities
      mockLLMClient.chat.mockResolvedValue({
        content: '[]', // Empty array
      } as any);

      const result = await converter.convert(mockSkill, sampleSkillMd);

      expect(result.warnings).toContain('No capabilities could be generated');
      expect(result.extension.capabilities).toHaveLength(0);
    });

    it('should generate capabilities from LLM response', async () => {
      const mockCapabilities = JSON.stringify([
        {
          name: 'test_capability',
          description: 'Test capability',
          inputSchema: { type: 'object', properties: {} },
          outputSchema: { type: 'object' },
        },
      ]);

      mockLLMClient.chat.mockResolvedValue({
        content: `Here are the capabilities: ${mockCapabilities}`,
      } as any);

      const result = await converter.convert(mockSkill, sampleSkillMd);

      expect(result.extension.capabilities).toHaveLength(1);
      const capability = result.extension.capabilities[0];
      expect(capability).toBeDefined();
      expect(capability!.name).toBe('test_capability');
      expect(capability!.description).toBe('Test capability');
    });

    it('should handle LLM errors gracefully', async () => {
      mockLLMClient.chat.mockRejectedValue(new Error('LLM error'));

      const result = await converter.convert(mockSkill, sampleSkillMd);

      expect(result.extension.capabilities).toHaveLength(0);
      expect(result.warnings).toContain('No capabilities could be generated');
    });
  });

  describe('parseFrontmatter', () => {
    // Note: parseFrontmatter is private, so we test it indirectly through convert
    it('should parse valid frontmatter', async () => {
      const result = await converter.convert(mockSkill, sampleSkillMd);

      // The extension description should use the frontmatter description
      expect(result.extension.description).toBe(
        'A test skill for demonstration'
      );
    });

    it('should handle malformed frontmatter', async () => {
      const malformedSkillMd = `---
name: Test
description: "Test`;  // No closing ---, should fail to parse

      // Mock LLM to return empty capabilities
      mockLLMClient.chat.mockResolvedValue({
        content: '[]',
      } as any);

      const result = await converter.convert(mockSkill, malformedSkillMd);

      expect(result.warnings).toContain('Failed to parse SKILL.md frontmatter');
    });

    it('should parse array values in frontmatter', async () => {
      const arraySkillMd = `---
name: Array Test
description: Test with arrays
categories: [cat1, cat2, "cat3"]
tags: ["tag1", tag2]
---`;

      const result = await converter.convert(mockSkill, arraySkillMd);

      expect(result.extension.description).toBe('Test with arrays');
    });
  });

  describe('assessQuality', () => {
    // Note: assessQuality is private, so we test it indirectly through convert
    it('should calculate quality score based on skill metrics', async () => {
      const highQualitySkill: SkillShResult = {
        ...mockSkill,
        stars: 500,
        downloads: 5000,
      };

      const result = await converter.convert(highQualitySkill, sampleSkillMd);

      expect(result.quality).toBeGreaterThan(70); // Should be high due to stars and downloads
    });

    it('should cap quality score at 100', async () => {
      const maxQualitySkill: SkillShResult = {
        ...mockSkill,
        stars: 1000,
        downloads: 10000,
      };

      const longSkillMd = sampleSkillMd + '\n' + '#'.repeat(5000); // Make it very long

      const result = await converter.convert(maxQualitySkill, longSkillMd);

      expect(result.quality).toBeLessThanOrEqual(100);
    });

    it('should award bonuses for documentation sections', async () => {
      const wellDocumentedSkillMd = `---
name: Well Documented
description: Well documented skill
---

# Well Documented

## Usage
Example usage here.

## Example
More examples.

## API
API documentation.
`;

      const result = await converter.convert(mockSkill, wellDocumentedSkillMd);

      expect(result.quality).toBeGreaterThan(60); // Should get bonuses for sections
    });
  });

  describe('createSkillConverter', () => {
    it('should create converter instance', () => {
      const instance = createSkillConverter(mockLLMClient);
      expect(instance).toBeInstanceOf(SkillConverter);
    });
  });
});
