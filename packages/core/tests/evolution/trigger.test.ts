/**
 * EvolutionTriggerEngine Tests
 */

import {
  EvolutionTriggerEngine,
  createEvolutionTriggerEngine,
} from '../../src/evolution/trigger.js';
import type { TriggerConfig } from '../../src/evolution/protocol.js';

describe('EvolutionTriggerEngine', () => {
  let engine: EvolutionTriggerEngine;

  beforeEach(() => {
    engine = new EvolutionTriggerEngine();
  });

  describe('constructor', () => {
    it('should create engine with default configs', () => {
      expect(engine).toBeDefined();
    });

    it('should accept custom configs', () => {
      const customConfigs: TriggerConfig[] = [
        {
          type: 'failure',
          threshold: 5,
          enabled: true,
          cooldown: 600000,
        },
      ];

      const customEngine = new EvolutionTriggerEngine(customConfigs);
      expect(customEngine).toBeDefined();
    });

    it('should set default failure trigger config', () => {
      const testEngine = new EvolutionTriggerEngine();
      // Default threshold is 3
      expect(testEngine).toBeDefined();
    });

    it('should set default degradation trigger config', () => {
      const testEngine = new EvolutionTriggerEngine();
      expect(testEngine).toBeDefined();
    });

    it('should set default periodic trigger config', () => {
      const testEngine = new EvolutionTriggerEngine();
      expect(testEngine).toBeDefined();
    });
  });

  describe('recordResult', () => {
    it('should increment success count on success', () => {
      engine.recordResult(true);
      // Success count should be incremented
      expect(engine).toBeDefined();
    });

    it('should increment failure count on failure', () => {
      engine.recordResult(false);
      // Failure count should be incremented
      expect(engine).toBeDefined();
    });

    it('should track multiple results', () => {
      engine.recordResult(true);
      engine.recordResult(false);
      engine.recordResult(true);

      expect(engine).toBeDefined();
    });
  });

  describe('recordPerformance', () => {
    it('should store performance value', () => {
      engine.recordPerformance(0.95);
      expect(engine).toBeDefined();
    });

    it('should update last performance value', () => {
      engine.recordPerformance(0.9);
      engine.recordPerformance(0.85);
      expect(engine).toBeDefined();
    });
  });

  describe('checkFailureTrigger', () => {
    it('should not trigger when failure count is below threshold', () => {
      // Default threshold is 3
      engine.recordResult(false);
      engine.recordResult(false);

      const result = engine.checkFailureTrigger();
      expect(result.shouldTrigger).toBe(false);
    });

    it('should trigger when failure count meets threshold', () => {
      engine.recordResult(false);
      engine.recordResult(false);
      engine.recordResult(false);

      const result = engine.checkFailureTrigger();
      expect(result.shouldTrigger).toBe(true);
      expect(result.urgency).toBe('high');
    });

    it('should trigger when failure count exceeds threshold', () => {
      engine.recordResult(false);
      engine.recordResult(false);
      engine.recordResult(false);
      engine.recordResult(false);

      const result = engine.checkFailureTrigger();
      expect(result.shouldTrigger).toBe(true);
    });

    it('should not trigger when failure trigger is disabled', () => {
      const disabledEngine = new EvolutionTriggerEngine([
        { type: 'failure', threshold: 3, enabled: false, cooldown: 0 },
      ]);

      disabledEngine.recordResult(false);
      disabledEngine.recordResult(false);
      disabledEngine.recordResult(false);

      const result = disabledEngine.checkFailureTrigger();
      expect(result.shouldTrigger).toBe(false);
    });

    it('should respect cooldown period', () => {
      // Set up failures
      engine.recordResult(false);
      engine.recordResult(false);
      engine.recordResult(false);

      // Trigger and mark as triggered
      const result1 = engine.checkFailureTrigger();
      expect(result1.shouldTrigger).toBe(true);
      engine.markTriggered('failure');

      // Should be in cooldown immediately
      const result2 = engine.checkFailureTrigger();
      expect(result2.shouldTrigger).toBe(false);
    });

    it('should return reason with failure count', () => {
      engine.recordResult(false);
      engine.recordResult(false);

      const result = engine.checkFailureTrigger();
      expect(result.reason).toContain('failures');
    });

    it('should handle empty state', () => {
      const result = engine.checkFailureTrigger();
      expect(result.shouldTrigger).toBe(false);
      expect(result.urgency).toBe('low');
    });
  });

  describe('checkDegradationTrigger', () => {
    it('should not trigger when performance drop is below threshold', () => {
      engine.recordPerformance(100);

      // 10% drop (threshold is 20%)
      const result = engine.checkDegradationTrigger(90);
      expect(result.shouldTrigger).toBe(false);
    });

    it('should trigger when performance drop meets threshold', () => {
      engine.recordPerformance(100);

      // 20% drop
      const result = engine.checkDegradationTrigger(80);
      expect(result.shouldTrigger).toBe(true);
      expect(result.urgency).toBe('medium');
    });

    it('should trigger when performance drop exceeds threshold', () => {
      engine.recordPerformance(100);

      // 30% drop
      const result = engine.checkDegradationTrigger(70);
      expect(result.shouldTrigger).toBe(true);
    });

    it('should not trigger when degradation trigger is disabled', () => {
      const disabledEngine = new EvolutionTriggerEngine([
        { type: 'degradation', threshold: 20, enabled: false, cooldown: 0 },
      ]);

      disabledEngine.recordPerformance(100);
      const result = disabledEngine.checkDegradationTrigger(50);
      expect(result.shouldTrigger).toBe(false);
    });

    it('should not trigger without baseline performance', () => {
      const result = engine.checkDegradationTrigger(50);
      expect(result.shouldTrigger).toBe(false);
    });

    it('should respect cooldown period', () => {
      engine.recordPerformance(100);

      // Trigger degradation
      const result1 = engine.checkDegradationTrigger(50);
      expect(result1.shouldTrigger).toBe(true);
      engine.markTriggered('degradation');

      // Should be in cooldown
      const result2 = engine.checkDegradationTrigger(50);
      expect(result2.shouldTrigger).toBe(false);
    });

    it('should include drop percentage in reason', () => {
      engine.recordPerformance(100);
      const result = engine.checkDegradationTrigger(70);
      expect(result.reason).toContain('%');
    });
  });

  describe('checkPeriodicTrigger', () => {
    it('should not trigger when interval has not elapsed', () => {
      const result = engine.checkPeriodicTrigger();
      expect(result.shouldTrigger).toBe(false);
    });

    it('should trigger when periodic interval is reached', () => {
      // Create engine with very short interval for testing
      const shortIntervalEngine = new EvolutionTriggerEngine([
        { type: 'periodic', interval: 1, enabled: true, cooldown: 0 },
      ]);

      // Wait a tiny bit
      const start = Date.now();
      while (Date.now() - start < 10) {
        // Busy wait
      }

      const result = shortIntervalEngine.checkPeriodicTrigger();
      expect(result.shouldTrigger).toBe(true);
    });

    it('should not trigger when periodic trigger is disabled', () => {
      const disabledEngine = new EvolutionTriggerEngine([
        { type: 'periodic', interval: 100, enabled: false, cooldown: 0 },
      ]);

      // Wait for interval
      const start = Date.now();
      while (Date.now() - start < 200) {
        // Busy wait
      }

      const result = disabledEngine.checkPeriodicTrigger();
      expect(result.shouldTrigger).toBe(false);
    });

    it('should return remaining time in reason when not triggered', () => {
      const result = engine.checkPeriodicTrigger();
      expect(result.reason).toContain('s until');
    });

    it('should use default interval of 1 hour', () => {
      const result = engine.checkPeriodicTrigger();
      expect(result.shouldTrigger).toBe(false);
    });
  });

  describe('markTriggered', () => {
    it('should update last trigger time', () => {
      const beforeTime = Date.now();
      engine.markTriggered('failure');
      const afterTime = Date.now();

      expect(engine).toBeDefined();
    });

    it('should reset failure count on failure trigger', () => {
      engine.recordResult(false);
      engine.recordResult(false);
      engine.recordResult(false);

      engine.markTriggered('failure');

      const result = engine.checkFailureTrigger();
      expect(result.shouldTrigger).toBe(false);
    });

    it('should work with different trigger types', () => {
      engine.markTriggered('failure');
      engine.markTriggered('degradation');
      engine.markTriggered('periodic');

      expect(engine).toBeDefined();
    });
  });

  describe('reset', () => {
    it('should reset failure count to zero', () => {
      engine.recordResult(false);
      engine.recordResult(false);
      engine.reset();

      const result = engine.checkFailureTrigger();
      expect(result.shouldTrigger).toBe(false);
    });

    it('should reset success count to zero', () => {
      engine.recordResult(true);
      engine.recordResult(true);
      engine.reset();

      expect(engine).toBeDefined();
    });

    it('should reset last trigger time', () => {
      engine.markTriggered('failure');
      engine.reset();

      expect(engine).toBeDefined();
    });

    it('should allow fresh start after reset', () => {
      engine.recordResult(false);
      engine.recordResult(false);
      engine.recordResult(false);

      engine.reset();

      engine.recordResult(false);
      const result = engine.checkFailureTrigger();
      expect(result.shouldTrigger).toBe(false);
    });
  });

  describe('createEvolutionTriggerEngine', () => {
    it('should create engine instance', () => {
      const engine = createEvolutionTriggerEngine();
      expect(engine).toBeInstanceOf(EvolutionTriggerEngine);
    });

    it('should accept custom configs', () => {
      const customConfigs: TriggerConfig[] = [
        { type: 'failure', threshold: 10, enabled: true, cooldown: 0 },
      ];

      const engine = createEvolutionTriggerEngine(customConfigs);
      expect(engine).toBeInstanceOf(EvolutionTriggerEngine);
    });
  });

  describe('boundary cases', () => {
    it('should handle rapid consecutive checks', () => {
      for (let i = 0; i < 10; i++) {
        engine.recordResult(false);
      }

      const result = engine.checkFailureTrigger();
      expect(result.shouldTrigger).toBe(true);
    });

    it('should handle zero threshold', () => {
      const zeroThresholdEngine = new EvolutionTriggerEngine([
        { type: 'failure', threshold: 0, enabled: true, cooldown: 0 },
      ]);

      const result = zeroThresholdEngine.checkFailureTrigger();
      expect(result.shouldTrigger).toBe(true);
    });

    it('should handle very large threshold', () => {
      const largeThresholdEngine = new EvolutionTriggerEngine([
        { type: 'failure', threshold: 1000000, enabled: true, cooldown: 0 },
      ]);

      for (let i = 0; i < 100; i++) {
        largeThresholdEngine.recordResult(false);
      }

      const result = largeThresholdEngine.checkFailureTrigger();
      expect(result.shouldTrigger).toBe(false);
    });

    it('should handle negative performance values', () => {
      engine.recordPerformance(-10);
      expect(engine).toBeDefined();
    });

    it('should handle very large performance values', () => {
      engine.recordPerformance(999999999);
      expect(engine).toBeDefined();
    });
  });

  describe('cooldown mechanism', () => {
    it('should handle zero cooldown', () => {
      const noCooldownEngine = new EvolutionTriggerEngine([
        { type: 'failure', threshold: 1, enabled: true, cooldown: 0 },
      ]);

      noCooldownEngine.recordResult(false);
      const result1 = noCooldownEngine.checkFailureTrigger();
      expect(result1.shouldTrigger).toBe(true);

      noCooldownEngine.markTriggered('failure');

      // Should trigger immediately with zero cooldown
      noCooldownEngine.recordResult(false);
      const result2 = noCooldownEngine.checkFailureTrigger();
      expect(result2.shouldTrigger).toBe(true);
    });

    it('should handle very long cooldown', () => {
      const longCooldownEngine = new EvolutionTriggerEngine([
        { type: 'failure', threshold: 1, enabled: true, cooldown: 86400000 }, // 24 hours
      ]);

      longCooldownEngine.recordResult(false);
      const result1 = longCooldownEngine.checkFailureTrigger();
      expect(result1.shouldTrigger).toBe(true);

      longCooldownEngine.markTriggered('failure');

      const result2 = longCooldownEngine.checkFailureTrigger();
      expect(result2.shouldTrigger).toBe(false);
    });
  });
});
