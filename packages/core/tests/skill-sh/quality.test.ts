/**
 * QualityAssessor Tests
 *
 * Unit tests for QualityAssessor class.
 */

import { jest } from '@jest/globals';
import {
  QualityAssessor,
  createQualityAssessor,
} from '../../src/skill-sh/quality.js';
import type {
  SkillShResult,
  SkillQualityAssessment,
} from '../../src/skill-sh/types.js';

describe('QualityAssessor', () => {
  let assessor: QualityAssessor;

  const mockSkill: SkillShResult = {
    id: 'owner/repo1',
    name: 'test-skill',
    description:
      'Test skill description with enough length to pass length checks',
    owner: 'owner',
    repo: 'repo1',
    stars: 150,
    downloads: 1200,
    updatedAt: new Date().toISOString(), // recent
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
---

# Test Skill

This is a test skill for demonstration purposes.

## Usage

\`\`\`typescript
// Example usage
const result = await skill.execute({ input: 'test' });
\`\`\`

## Example

More examples here.

## API

- **execute**: Main execution function

## Test

This skill includes tests.
`;

  beforeEach(() => {
    jest.clearAllMocks();
    assessor = new QualityAssessor();
  });

  describe('constructor', () => {
    it('should create assessor instance', () => {
      expect(assessor).toBeDefined();
      expect(assessor).toBeInstanceOf(QualityAssessor);
    });
  });

  describe('assess', () => {
    it('should return comprehensive quality assessment', async () => {
      const result = await assessor.assess(mockSkill, sampleSkillMd);

      expect(result).toBeDefined();
      expect(result).toHaveProperty('score');
      expect(result).toHaveProperty('codeQuality');
      expect(result).toHaveProperty('documentation');
      expect(result).toHaveProperty('testCoverage');
      expect(result).toHaveProperty('community');
      expect(result).toHaveProperty('security');
      expect(result).toHaveProperty('details');

      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(100);
      expect(result.codeQuality).toBeGreaterThanOrEqual(0);
      expect(result.codeQuality).toBeLessThanOrEqual(100);
      expect(result.documentation).toBeGreaterThanOrEqual(0);
      expect(result.documentation).toBeLessThanOrEqual(100);
      expect(result.testCoverage).toBeGreaterThanOrEqual(0);
      expect(result.testCoverage).toBeLessThanOrEqual(100);
      expect(result.community).toBeGreaterThanOrEqual(0);
      expect(result.community).toBeLessThanOrEqual(100);
      expect(result.security).toBeGreaterThanOrEqual(0);
      expect(result.security).toBeLessThanOrEqual(100);
    });

    it('should calculate higher score for high-quality skill', async () => {
      const highQualitySkill: SkillShResult = {
        ...mockSkill,
        stars: 500,
        downloads: 5000,
        description:
          'A very detailed description that exceeds one hundred characters easily, providing comprehensive information about the skill.',
      };
      const highQualitySkillMd =
        sampleSkillMd + '\n\n## Additional Documentation\nMore details.';

      const result = await assessor.assess(
        highQualitySkill,
        highQualitySkillMd
      );

      expect(result.score).toBeGreaterThan(70);
      expect(result.community).toBeGreaterThan(70);
      expect(result.documentation).toBeGreaterThan(70);
    });

    it('should calculate lower score for low-quality skill', async () => {
      const lowQualitySkill: SkillShResult = {
        ...mockSkill,
        stars: 2,
        downloads: 10,
        description: 'Short',
        updatedAt: '2020-01-01T00:00:00Z', // old
      };
      const lowQualitySkillMd = '# No content';

      const result = await assessor.assess(lowQualitySkill, lowQualitySkillMd);

      expect(result.score).toBeLessThan(70);
      expect(result.community).toBeLessThan(70);
      expect(result.documentation).toBeLessThan(70);
    });

    it('should handle missing skillMd gracefully', async () => {
      const result = await assessor.assess(mockSkill);

      expect(result).toBeDefined();
      expect(result.details.hasTests).toBe(false);
      expect(result.details.hasExamples).toBe(false);
      expect(result.details.hasDocumentation).toBe(false);
      expect(result.details.linesOfCode).toBe(0);
      expect(result.testCoverage).toBe(30); // default when no tests
    });

    it('should detect recently updated skills', async () => {
      const recentSkill: SkillShResult = {
        ...mockSkill,
        updatedAt: new Date().toISOString(),
      };

      const result = await assessor.assess(recentSkill, sampleSkillMd);

      expect(result.details.recentlyUpdated).toBe(true);
      expect(result.security).toBeGreaterThan(70);
    });

    it('should detect old skills as not recently updated', async () => {
      const oldSkill: SkillShResult = {
        ...mockSkill,
        updatedAt: '2020-01-01T00:00:00Z',
      };

      const result = await assessor.assess(oldSkill, sampleSkillMd);

      expect(result.details.recentlyUpdated).toBe(false);
    });

    it('should detect tests in skillMd', async () => {
      const skillMdWithTests =
        sampleSkillMd + '\n\n## Test Suite\nUnit tests included.';

      const result = await assessor.assess(mockSkill, skillMdWithTests);

      expect(result.details.hasTests).toBe(true);
      expect(result.testCoverage).toBe(70);
    });

    it('should detect examples in skillMd', async () => {
      const skillMdWithExamples = sampleSkillMd; // already includes ## Example

      const result = await assessor.assess(mockSkill, skillMdWithExamples);

      expect(result.details.hasExamples).toBe(true);
    });

    it('should detect documentation in skillMd', async () => {
      const longSkillMd = '# Documentation\n' + 'x\n'.repeat(600); // >500 lines

      const result = await assessor.assess(mockSkill, longSkillMd);

      expect(result.details.hasDocumentation).toBe(true);
    });
  });

  describe('createQualityAssessor', () => {
    it('should create assessor instance', () => {
      const instance = createQualityAssessor();
      expect(instance).toBeInstanceOf(QualityAssessor);
    });
  });
});
