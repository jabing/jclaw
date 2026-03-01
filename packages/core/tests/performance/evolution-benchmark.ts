/**
 * Performance Benchmarks: Evolution System
 *
 * Benchmarks for evolution operations to track performance over time.
 *
 * Run with: bun test packages/core/tests/performance/evolution-benchmark.ts
 *
 * @module @jclaw/core/tests/performance/evolution-benchmark
 */

import { EvolutionTriggerEngine } from '../../src/evolution/trigger.js';
import { BudgetController } from '../../src/evolution/budget.js';
import { ComplexityAssessor } from '../../src/runtime/complexity-assessor.js';

// Simple benchmark utility
function measureTime<T>(
  name: string,
  iterations: number,
  fn: () => T
): {
  name: string;
  iterations: number;
  totalTimeMs: number;
  avgTimeMs: number;
} {
  const start = performance.now();

  for (let i = 0; i < iterations; i++) {
    fn();
  }

  const end = performance.now();
  const totalTimeMs = end - start;

  return {
    name,
    iterations,
    totalTimeMs: Math.round(totalTimeMs * 1000) / 1000,
    avgTimeMs: Math.round((totalTimeMs / iterations) * 1000000) / 1000, // microseconds
  };
}

describe('Performance Benchmarks: Evolution System', () => {
  const ITERATIONS = 10000;

  describe('Trigger Engine Performance', () => {
    it('should efficiently record results', () => {
      const engine = new EvolutionTriggerEngine();

      const result = measureTime('recordResult', ITERATIONS, () => {
        engine.recordResult(Math.random() > 0.3);
      });

      console.log(
        `[Benchmark] ${result.name}: ${result.avgTimeMs}μs/op (${result.iterations} iterations)`
      );

      // Should be under 10 microseconds per operation
      expect(result.avgTimeMs).toBeLessThan(10);
    });

    it('should efficiently check failure trigger', () => {
      const engine = new EvolutionTriggerEngine();

      // Prime with some failures
      for (let i = 0; i < 5; i++) {
        engine.recordResult(false);
      }

      const result = measureTime('checkFailureTrigger', ITERATIONS, () => {
        engine.checkFailureTrigger();
      });

      console.log(
        `[Benchmark] ${result.name}: ${result.avgTimeMs}μs/op (${result.iterations} iterations)`
      );

      // Should be under 50 microseconds per check
      expect(result.avgTimeMs).toBeLessThan(50);
    });
  });

  describe('Budget Controller Performance', () => {
    it('should efficiently check quota', () => {
      const controller = new BudgetController();

      const result = measureTime('checkQuota', ITERATIONS, () => {
        controller.checkQuota();
      });

      console.log(
        `[Benchmark] ${result.name}: ${result.avgTimeMs}μs/op (${result.iterations} iterations)`
      );

      // Should be under 10 microseconds per check
      expect(result.avgTimeMs).toBeLessThan(10);
    });

    it('should efficiently record evolution', () => {
      const controller = new BudgetController({ dailyQuota: ITERATIONS + 100 });

      const result = measureTime('recordEvolution', ITERATIONS, () => {
        controller.recordEvolution(true, Math.random() * 0.1);
      });

      console.log(
        `[Benchmark] ${result.name}: ${result.avgTimeMs}μs/op (${result.iterations} iterations)`
      );

      // Should be under 20 microseconds per record
      expect(result.avgTimeMs).toBeLessThan(20);
    });

    it('should efficiently check convergence', () => {
      const controller = new BudgetController();

      // Prime with some data
      for (let i = 0; i < 10; i++) {
        controller.recordEvolution(true, 0.05);
      }

      const result = measureTime('checkConvergence', ITERATIONS, () => {
        controller.checkConvergence();
      });

      console.log(
        `[Benchmark] ${result.name}: ${result.avgTimeMs}μs/op (${result.iterations} iterations)`
      );

      // Should be under 20 microseconds per check
      expect(result.avgTimeMs).toBeLessThan(20);
    });
  });

  describe('Complexity Assessor Performance', () => {
    it('should efficiently assess short prompts', () => {
      const assessor = new ComplexityAssessor();
      const shortPrompt = 'fix typo';

      const result = measureTime('assess (short)', ITERATIONS, () => {
        assessor.assess(shortPrompt);
      });

      console.log(
        `[Benchmark] ${result.name}: ${result.avgTimeMs}μs/op (${result.iterations} iterations)`
      );

      // Should be under 100 microseconds for short prompts
      expect(result.avgTimeMs).toBeLessThan(100);
    });

    it('should efficiently assess long prompts', () => {
      const assessor = new ComplexityAssessor();
      const longPrompt = `
        Refactor the entire authentication system to use OAuth2 with PKCE flow.
        This involves:
        1. Migrating all existing users to the new system
        2. Creating backup procedures for production database
        3. Implementing security measures and rate limiting
        4. Updating all API endpoints to use JWT tokens
        5. Creating comprehensive test coverage
        This is a critical production change that requires careful planning.
      `.trim();

      const result = measureTime('assess (long)', ITERATIONS, () => {
        assessor.assess(longPrompt);
      });

      console.log(
        `[Benchmark] ${result.name}: ${result.avgTimeMs}μs/op (${result.iterations} iterations)`
      );

      // Should be under 200 microseconds for long prompts
      expect(result.avgTimeMs).toBeLessThan(200);
    });
  });

  describe('Memory Usage', () => {
    it('should maintain stable memory for trigger engine', () => {
      const engine = new EvolutionTriggerEngine();
      const initialMemory = process.memoryUsage().heapUsed;

      // Perform many operations
      for (let i = 0; i < 100000; i++) {
        engine.recordResult(Math.random() > 0.3);
        engine.checkFailureTrigger();
      }

      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;

      console.log(
        `[Benchmark] Memory increase: ${(memoryIncrease / 1024 / 1024).toFixed(2)}MB after 100k operations`
      );

      // Memory increase should be minimal (under 5MB for 100k operations)
      expect(memoryIncrease).toBeLessThan(5 * 1024 * 1024);
    });

    it('should maintain stable memory for complexity assessor', () => {
      const assessor = new ComplexityAssessor();
      const initialMemory = process.memoryUsage().heapUsed;

      // Perform many assessments
      for (let i = 0; i < 10000; i++) {
        assessor.assess(`Test prompt number ${i} with some content to analyze`);
        assessor.recordResult(`Test prompt ${i % 100}`, Math.random() > 0.3);
      }

      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;

      console.log(
        `[Benchmark] Memory increase: ${(memoryIncrease / 1024 / 1024).toFixed(2)}MB after 10k assessments`
      );

      // Memory increase should be reasonable (under 10MB for 10k operations)
      expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024);
    });
  });
});

// Summary output
afterAll(() => {
  console.log('\n========================================');
  console.log('Evolution System Performance Benchmarks');
  console.log('========================================');
  console.log('All benchmarks completed successfully.');
  console.log('Performance thresholds are set conservatively');
  console.log('to catch significant regressions.\n');
});
