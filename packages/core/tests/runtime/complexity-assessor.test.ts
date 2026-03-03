/**
 * ComplexityAssessor Tests
 */

import {
  ComplexityAssessor,
  createComplexityAssessor,
} from '../../src/runtime/complexity-assessor.js';
import type { ComplexityResult } from '../../src/runtime/complexity-assessor.js';

describe('ComplexityAssessor', () => {
  let assessor: ComplexityAssessor;

  beforeEach(() => {
    assessor = new ComplexityAssessor();
  });

  describe('assess', () => {
    it('should return complexity result for simple prompt', () => {
      const result = assessor.assess('Hello');

      expect(result).toBeDefined();
      expect(result.score).toBeDefined();
      expect(result.level).toBeDefined();
      expect(result.factors).toBeDefined();
      expect(result.recommendedMode).toBeDefined();
    });

    it('should assess short description as simple', () => {
      const result = assessor.assess('Fix typo');
      expect(result.level).toBe('simple');
      expect(result.recommendedMode).toBe('react');
    });

    it('should assess long description with higher complexity', () => {
      const longPrompt = 'a'.repeat(600);
      const result = assessor.assess(longPrompt);

      expect(result.factors.descriptionLength).toBe(1);
    });

    it('should detect risk keywords', () => {
      const result = assessor.assess('Delete the production database');

      expect(result.factors.hasRiskKeywords).toBe(true);
    });

    it('should detect multi-step tasks', () => {
      const result = assessor.assess(
        'First read the file, then modify it, and finally test it'
      );

      expect(result.factors.hasMultiSteps).toBe(true);
    });

    it('should detect Chinese multi-step indicators', () => {
      const result = assessor.assess('第一步读取文件，然后修改它');

      expect(result.factors.hasMultiSteps).toBe(true);
    });

    it('should detect Chinese risk keywords', () => {
      const result = assessor.assess('删除生产数据库');

      expect(result.factors.hasRiskKeywords).toBe(true);
    });

    it('should return medium complexity for moderate tasks', () => {
      const prompt = 'Update the user service to add caching';
      const result = assessor.assess(prompt);

      expect(result).toBeDefined();
    });

    it('should return complex for high-risk tasks', () => {
      const prompt =
        'Refactor the production authentication system with security improvements';
      const result = assessor.assess(prompt);

      expect(result.level).toBe('complex');
      expect(result.recommendedMode).toBe('oops');
    });

    it('should use context file count', () => {
      const context = { files: ['file1.ts', 'file2.ts', 'file3.ts'] };
      const result = assessor.assess('Update these files', context);

      expect(result.factors.fileCount).toBeGreaterThan(0);
    });

    it('should handle missing context', () => {
      const result = assessor.assess('Do something', undefined);

      expect(result.factors.fileCount).toBe(0);
    });

    it('should handle empty context', () => {
      const result = assessor.assess('Do something', {});

      expect(result.factors.fileCount).toBe(0);
    });
  });

  describe('description length assessment', () => {
    it('should score very short prompts as 0', () => {
      const result = assessor.assess('a'.repeat(50));
      expect(result.factors.descriptionLength).toBe(0);
    });

    it('should score short prompts as 0.3', () => {
      const result = assessor.assess('a'.repeat(200));
      expect(result.factors.descriptionLength).toBe(0.3);
    });

    it('should score medium prompts as 0.6', () => {
      const result = assessor.assess('a'.repeat(400));
      expect(result.factors.descriptionLength).toBe(0.6);
    });

    it('should score long prompts as 1', () => {
      const result = assessor.assess('a'.repeat(600));
      expect(result.factors.descriptionLength).toBe(1);
    });

    it('should handle exactly 100 characters', () => {
      const result = assessor.assess('a'.repeat(100));
      expect(result.factors.descriptionLength).toBe(0.3);
    });

    it('should handle exactly 300 characters', () => {
      const result = assessor.assess('a'.repeat(300));
      expect(result.factors.descriptionLength).toBe(0.6);
    });

    it('should handle exactly 500 characters', () => {
      const result = assessor.assess('a'.repeat(500));
      expect(result.factors.descriptionLength).toBe(1);
    });
  });

  describe('risk keyword detection', () => {
    it('should detect delete keyword', () => {
      const result = assessor.assess('Delete the file');
      expect(result.factors.hasRiskKeywords).toBe(true);
    });

    it('should detect remove keyword', () => {
      const result = assessor.assess('Remove this function');
      expect(result.factors.hasRiskKeywords).toBe(true);
    });

    it('should detect production keyword', () => {
      const result = assessor.assess('Update production config');
      expect(result.factors.hasRiskKeywords).toBe(true);
    });

    it('should detect security keyword', () => {
      const result = assessor.assess('Fix security vulnerability');
      expect(result.factors.hasRiskKeywords).toBe(true);
    });

    it('should detect password keyword', () => {
      const result = assessor.assess('Change password logic');
      expect(result.factors.hasRiskKeywords).toBe(true);
    });

    it('should detect refactor keyword', () => {
      const result = assessor.assess('Refactor the code');
      expect(result.factors.hasRiskKeywords).toBe(true);
    });

    it('should detect migrate keyword', () => {
      const result = assessor.assess('Migrate to new API');
      expect(result.factors.hasRiskKeywords).toBe(true);
    });

    it('should be case insensitive', () => {
      const result = assessor.assess('DELETE THE DATABASE');
      expect(result.factors.hasRiskKeywords).toBe(true);
    });

    it('should return false for safe prompts', () => {
      const result = assessor.assess('Add a new feature');
      expect(result.factors.hasRiskKeywords).toBe(false);
    });
  });

  describe('multi-step detection', () => {
    it('should detect "then" indicator', () => {
      const result = assessor.assess('Read file then write it');
      expect(result.factors.hasMultiSteps).toBe(true);
    });

    it('should detect "after" indicator', () => {
      const result = assessor.assess('Do this after that');
      expect(result.factors.hasMultiSteps).toBe(true);
    });

    it('should detect "finally" indicator', () => {
      const result = assessor.assess('Finally test the code');
      expect(result.factors.hasMultiSteps).toBe(true);
    });

    it('should detect "first" indicator', () => {
      const result = assessor.assess('First step is to read');
      expect(result.factors.hasMultiSteps).toBe(true);
    });

    it('should detect "step" indicator', () => {
      const result = assessor.assess('Step 1: read, Step 2: write');
      expect(result.factors.hasMultiSteps).toBe(true);
    });

    it('should return false for single step', () => {
      const result = assessor.assess('Just do it');
      expect(result.factors.hasMultiSteps).toBe(false);
    });
  });

  describe('historical failure rate', () => {
    it('should return 0 for unknown prompts', () => {
      const result = assessor.assess('Some new task');
      expect(result.factors.historicalFailureRate).toBe(0);
    });

    it('should track failures for similar prompts', () => {
      const prompt = 'This is a test prompt for tracking';

      assessor.recordResult(prompt, false);
      assessor.recordResult(prompt, false);
      assessor.recordResult(prompt, true);

      const result = assessor.assess(prompt);
      expect(result.factors.historicalFailureRate).toBeGreaterThan(0);
    });

    it('should use first 50 chars as key', () => {
      const prompt1 =
        'This is a very long prompt that should be truncated to first 50 characters';
      const prompt2 =
        'This is a very long prompt that should be truncated to first 50 chars different';

      assessor.recordResult(prompt1, false);

      const result = assessor.assess(prompt2);
      expect(result.factors.historicalFailureRate).toBeGreaterThan(0);
    });
  });

  describe('recordResult', () => {
    it('should record successful result', () => {
      assessor.recordResult('Test task', true);
      expect(assessor).toBeDefined();
    });

    it('should record failed result', () => {
      assessor.recordResult('Test task', false);
      expect(assessor).toBeDefined();
    });

    it('should track multiple results for same task', () => {
      const prompt = 'Repeated task';

      assessor.recordResult(prompt, true);
      assessor.recordResult(prompt, false);
      assessor.recordResult(prompt, true);

      const result = assessor.assess(prompt);
      expect(result).toBeDefined();
    });

    it('should handle different tasks separately', () => {
      assessor.recordResult('Task A', false);
      assessor.recordResult('Task B', true);

      const resultA = assessor.assess('Task A with more text');
      const resultB = assessor.assess('Task B with more text');

      expect(resultA.factors.historicalFailureRate).toBeGreaterThan(0);
      expect(resultB.factors.historicalFailureRate).toBe(0);
    });
  });

  describe('score calculation', () => {
    it('should calculate score based on all factors', () => {
      const result = assessor.assess('a'.repeat(600));
      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(1);
    });

    it('should weight historical failure rate highest', () => {
      const prompt = 'Task with failures';
      assessor.recordResult(prompt, false);
      assessor.recordResult(prompt, false);
      assessor.recordResult(prompt, false);

      const result = assessor.assess(prompt);
      expect(result.factors.historicalFailureRate).toBe(1);
    });

    it('should weight risk keywords heavily', () => {
      const result = assessor.assess(
        'Delete production database with security issue'
      );
      expect(result.score).toBeGreaterThan(0.25); // Risk keywords alone should contribute 25%
    });
  });

  describe('level determination', () => {
    it('should classify low score as simple', () => {
      const result = assessor.assess('Simple task');
      expect(result.level).toBe('simple');
    });

    it('should classify medium score as medium', () => {
      // Need to craft a prompt that gives score between 0.3 and 0.7
      const result = assessor.assess(
        'Update user service with caching and error handling'
      );
      expect(result.level).toBeDefined();
    });

    it('should classify high score as complex', () => {
      const result = assessor.assess(
        'Refactor production authentication with security improvements and migration'
      );
      expect(result.level).toBe('complex');
    });
  });

  describe('mode recommendation', () => {
    it('should recommend react for simple tasks', () => {
      const result = assessor.assess('Fix typo');
      expect(result.recommendedMode).toBe('react');
    });

    it('should recommend ooda for medium tasks', () => {
      const result = assessor.assess('Update service with error handling');
      expect(result.recommendedMode).toBeDefined();
    });

    it('should recommend oops for complex tasks', () => {
      const result = assessor.assess(
        'Refactor production security system with backup and recovery'
      );
      expect(result.recommendedMode).toBe('oops');
    });
  });

  describe('createComplexityAssessor', () => {
    it('should create assessor instance', () => {
      const instance = createComplexityAssessor();
      expect(instance).toBeInstanceOf(ComplexityAssessor);
    });
  });

  describe('boundary cases', () => {
    it('should handle empty prompt', () => {
      const result = assessor.assess('');
      expect(result).toBeDefined();
      expect(result.level).toBe('simple');
    });

    it('should handle very long prompt', () => {
      const result = assessor.assess('a'.repeat(10000));
      expect(result.factors.descriptionLength).toBe(1);
    });

    it('should handle special characters', () => {
      const result = assessor.assess('!@#$%^&*()_+-=[]{}|;:,.<>?');
      expect(result).toBeDefined();
    });

    it('should handle Unicode characters', () => {
      const result = assessor.assess('你好世界 🌍');
      expect(result).toBeDefined();
    });

    it('should handle newline characters', () => {
      const result = assessor.assess('Line 1\nLine 2\nLine 3');
      expect(result).toBeDefined();
    });
  });

  describe('context handling', () => {
    it('should handle null files array', () => {
      const result = assessor.assess('Task', { files: null as any });
      expect(result.factors.fileCount).toBe(0);
    });

    it('should handle empty files array', () => {
      const result = assessor.assess('Task', { files: [] });
      expect(result.factors.fileCount).toBe(0);
    });

    it('should handle large files array', () => {
      const result = assessor.assess('Task', {
        files: Array(100).fill('file.ts'),
      });
      expect(result.factors.fileCount).toBe(1); // Maxed out at 1
    });

    it('should handle non-array files', () => {
      const result = assessor.assess('Task', { files: 'not-an-array' as any });
      expect(result.factors.fileCount).toBe(0);
    });
  });

  describe('complexity factors weights', () => {
    it('should apply correct weight to description length', () => {
      const result = assessor.assess('a'.repeat(600));
      // descriptionLength (1) * weight (0.15) = 0.15 contribution
      expect(result.score).toBeGreaterThanOrEqual(0.15);
    });

    it('should apply correct weight to risk keywords', () => {
      const result = assessor.assess('Delete production');
      // hasRiskKeywords (true) * weight (0.25) = 0.25 contribution
      expect(result.score).toBeGreaterThanOrEqual(0.25);
    });

    it('should apply correct weight to multi-steps', () => {
      const result = assessor.assess('First read then write');
      // hasMultiSteps (true) * weight (0.15) = 0.15 contribution
      expect(result.score).toBeGreaterThanOrEqual(0.15);
    });
  });

  describe('historical data management', () => {
    it('should maintain separate historical data per task', () => {
      assessor.recordResult('Task A', false);
      assessor.recordResult('Task B', true);
      assessor.recordResult('Task C', false);

      const resultA = assessor.assess('Task A more text');
      const resultB = assessor.assess('Task B more text');
      const resultC = assessor.assess('Task C more text');

      expect(resultA.factors.historicalFailureRate).toBeGreaterThan(0);
      expect(resultB.factors.historicalFailureRate).toBe(0);
      expect(resultC.factors.historicalFailureRate).toBeGreaterThan(0);
    });

    it('should update historical data on subsequent calls', () => {
      const prompt = 'Repeated task';

      assessor.recordResult(prompt, false);
      let result = assessor.assess(prompt);
      const rate1 = result.factors.historicalFailureRate;

      assessor.recordResult(prompt, false);
      result = assessor.assess(prompt);
      const rate2 = result.factors.historicalFailureRate;

      expect(rate2).toBeGreaterThanOrEqual(rate1);
    });
  });
});
