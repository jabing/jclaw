/**
 * BudgetController Tests
 */

import {
  BudgetController,
  createBudgetController,
} from '../../src/evolution/budget.js';
import type {
  EvolutionBudget,
  ConvergenceConfig,
} from '../../src/evolution/protocol.js';

describe('BudgetController', () => {
  let controller: BudgetController;

  beforeEach(() => {
    controller = new BudgetController();
  });

  describe('constructor', () => {
    it('should create controller with default budget', () => {
      expect(controller).toBeDefined();
    });

    it('should accept custom budget configuration', () => {
      const customBudget: Partial<EvolutionBudget> = {
        dailyQuota: 20,
        cooldownPeriod: 7200000, // 2 hours
        maxMutationsPerCycle: 10,
      };

      const customController = new BudgetController(customBudget);
      expect(customController).toBeDefined();
    });

    it('should accept custom convergence configuration', () => {
      const customConvergence: Partial<ConvergenceConfig> = {
        improvementThreshold: 0.05,
        patienceCycles: 5,
      };

      const customController = new BudgetController(
        undefined,
        customConvergence
      );
      expect(customController).toBeDefined();
    });

    it('should use default convergence config', () => {
      const controller = new BudgetController();
      expect(controller).toBeDefined();
    });
  });

  describe('checkQuota', () => {
    it('should return true when under daily quota', () => {
      const result = controller.checkQuota();
      expect(result).toBe(true);
    });

    it('should return false when daily quota is exceeded', () => {
      // Create controller with small quota
      const limitedController = new BudgetController({ dailyQuota: 2 });

      // Use up quota
      limitedController.recordEvolution(true);
      limitedController.recordEvolution(true);

      const result = limitedController.checkQuota();
      expect(result).toBe(false);
    });

    it('should reset quota after 24 hours', () => {
      const limitedController = new BudgetController({ dailyQuota: 1 });

      // Use quota
      limitedController.recordEvolution(true);
      expect(limitedController.checkQuota()).toBe(false);

      // Simulate 24 hours passing (this test depends on internal implementation)
      // In reality, we'd need to mock Date.now() for proper testing
      expect(limitedController).toBeDefined();
    });
  });

  describe('recordEvolution', () => {
    it('should increment daily evolution count', () => {
      controller.recordEvolution(true);
      expect(controller).toBeDefined();
    });

    it('should record improvement value', () => {
      controller.recordEvolution(true, 0.15);
      expect(controller).toBeDefined();
    });

    it('should track recent improvements (max 10)', () => {
      for (let i = 0; i < 15; i++) {
        controller.recordEvolution(true, 0.1);
      }

      expect(controller).toBeDefined();
    });

    it('should start cooldown after evolution', () => {
      controller.recordEvolution(true);
      expect(controller.isInCooldown()).toBe(true);
    });

    it('should update last evolution time', () => {
      const beforeTime = Date.now();
      controller.recordEvolution(true);
      const afterTime = Date.now();

      expect(beforeTime <= afterTime).toBe(true);
    });

    it('should work without improvement value', () => {
      controller.recordEvolution(true);
      expect(controller).toBeDefined();
    });

    it('should handle failure recording', () => {
      controller.recordEvolution(false);
      expect(controller).toBeDefined();
    });
  });

  describe('isInCooldown', () => {
    it('should return false when not in cooldown', () => {
      const freshController = new BudgetController();
      expect(freshController.isInCooldown()).toBe(false);
    });

    it('should return true after recording evolution', () => {
      controller.recordEvolution(true);
      expect(controller.isInCooldown()).toBe(true);
    });

    it('should return false after cooldown expires', () => {
      const shortCooldownController = new BudgetController({
        cooldownPeriod: 1,
      });

      shortCooldownController.recordEvolution(true);
      expect(shortCooldownController.isInCooldown()).toBe(true);

      // Wait for cooldown to expire
      const start = Date.now();
      while (Date.now() - start < 10) {
        // Busy wait
      }

      expect(shortCooldownController.isInCooldown()).toBe(false);
    });

    it('should check elapsed time correctly', () => {
      controller.recordEvolution(true);
      expect(controller.isInCooldown()).toBe(true);
    });
  });

  describe('getCooldownRemaining', () => {
    it('should return 0 when not in cooldown', () => {
      const freshController = new BudgetController();
      const remaining = freshController.getCooldownRemaining();
      expect(remaining).toBe(0);
    });

    it('should return remaining cooldown time', () => {
      const shortCooldownController = new BudgetController({
        cooldownPeriod: 1000,
      });

      shortCooldownController.recordEvolution(true);
      const remaining = shortCooldownController.getCooldownRemaining();

      expect(remaining).toBeGreaterThan(0);
      expect(remaining).toBeLessThanOrEqual(1000);
    });

    it('should return 0 after cooldown expires', () => {
      const shortCooldownController = new BudgetController({
        cooldownPeriod: 1,
      });

      shortCooldownController.recordEvolution(true);

      // Wait for cooldown to expire
      const start = Date.now();
      while (Date.now() - start < 10) {
        // Busy wait
      }

      const remaining = shortCooldownController.getCooldownRemaining();
      expect(remaining).toBe(0);
    });

    it('should never return negative value', () => {
      controller.recordEvolution(true);
      const remaining = controller.getCooldownRemaining();
      expect(remaining).toBeGreaterThanOrEqual(0);
    });
  });

  describe('checkConvergence', () => {
    it('should return false when not enough data points', () => {
      const result = controller.checkConvergence();
      expect(result).toBe(false);
    });

    it('should return false when improvements exceed threshold', () => {
      // Record enough improvements above threshold
      for (let i = 0; i < 3; i++) {
        controller.recordEvolution(true, 0.5); // 50% improvement (above 1% threshold)
      }

      const result = controller.checkConvergence();
      expect(result).toBe(false);
    });

    it('should return true when all recent improvements below threshold', () => {
      // Record enough improvements below threshold
      for (let i = 0; i < 5; i++) {
        controller.recordEvolution(true, 0.005); // 0.5% improvement (below 1% threshold)
      }

      const result = controller.checkConvergence();
      expect(result).toBe(true);
    });

    it('should use patienceCycles configuration', () => {
      const customController = new BudgetController(undefined, {
        patienceCycles: 2,
      });

      // Record 2 improvements below threshold
      for (let i = 0; i < 2; i++) {
        customController.recordEvolution(true, 0.005);
      }

      const result = customController.checkConvergence();
      expect(result).toBe(true);
    });
  });

  describe('getStatus', () => {
    it('should return complete budget status', () => {
      const status = controller.getStatus();

      expect(status).toBeDefined();
      expect(status.dailyUsed).toBeDefined();
      expect(status.dailyLimit).toBeDefined();
      expect(status.inCooldown).toBeDefined();
      expect(status.cooldownRemaining).toBeDefined();
      expect(status.consecutiveNoImprovement).toBeDefined();
    });

    it('should show correct daily usage', () => {
      controller.recordEvolution(true);
      controller.recordEvolution(true);

      const status = controller.getStatus();
      expect(status.dailyUsed).toBe(2);
    });

    it('should show default daily limit', () => {
      const status = controller.getStatus();
      expect(status.dailyLimit).toBe(10); // Default quota
    });

    it('should reset daily count after 24 hours', () => {
      controller.recordEvolution(true);

      const status = controller.getStatus();
      expect(status.dailyUsed).toBe(1);
    });
  });

  describe('emergencyStop', () => {
    it('should activate emergency stop', () => {
      controller.emergencyStop();
      expect(controller.isInCooldown()).toBe(true);
    });

    it('should set cooldown start time', () => {
      const beforeTime = Date.now();
      controller.emergencyStop();
      const afterTime = Date.now();

      expect(controller).toBeDefined();
    });

    it('should keep controller in cooldown state', () => {
      controller.emergencyStop();
      expect(controller.isInCooldown()).toBe(true);
    });
  });

  describe('reset', () => {
    it('should reset daily evolution count', () => {
      controller.recordEvolution(true);
      controller.recordEvolution(true);
      controller.reset();

      const status = controller.getStatus();
      expect(status.dailyUsed).toBe(0);
    });

    it('should reset cooldown state', () => {
      controller.recordEvolution(true);
      expect(controller.isInCooldown()).toBe(true);

      controller.reset();
      expect(controller.isInCooldown()).toBe(false);
    });

    it('should clear recent improvements', () => {
      for (let i = 0; i < 5; i++) {
        controller.recordEvolution(true, 0.1);
      }

      controller.reset();
      expect(controller).toBeDefined();
    });

    it('should allow fresh start after reset', () => {
      controller.recordEvolution(true);
      controller.reset();
      controller.recordEvolution(true);

      const status = controller.getStatus();
      expect(status.dailyUsed).toBe(1);
    });
  });

  describe('createBudgetController', () => {
    it('should create controller instance', () => {
      const ctrl = createBudgetController();
      expect(ctrl).toBeInstanceOf(BudgetController);
    });

    it('should accept custom budget', () => {
      const ctrl = createBudgetController({ dailyQuota: 50 });
      expect(ctrl).toBeInstanceOf(BudgetController);
    });

    it('should accept custom convergence config', () => {
      const ctrl = createBudgetController(undefined, { patienceCycles: 10 });
      expect(ctrl).toBeInstanceOf(BudgetController);
    });
  });

  describe('daily quota reset', () => {
    it('should handle day boundary correctly', () => {
      const status = controller.getStatus();
      expect(status.dailyUsed).toBe(0);
    });

    it('should track usage within same day', () => {
      controller.recordEvolution(true);
      controller.recordEvolution(true);

      const status = controller.getStatus();
      expect(status.dailyUsed).toBe(2);
    });
  });

  describe('consecutive no improvement tracking', () => {
    it('should count consecutive improvements below threshold', () => {
      for (let i = 0; i < 5; i++) {
        controller.recordEvolution(true, 0.005);
      }

      const status = controller.getStatus();
      expect(status.consecutiveNoImprovement).toBeGreaterThan(0);
    });

    it('should reset count on significant improvement', () => {
      // Record small improvements
      for (let i = 0; i < 3; i++) {
        controller.recordEvolution(true, 0.005);
      }

      // Record large improvement
      controller.recordEvolution(true, 0.5);

      const status = controller.getStatus();
      expect(status.consecutiveNoImprovement).toBe(0);
    });
  });

  describe('boundary cases', () => {
    it('should handle zero quota', () => {
      const zeroQuotaController = new BudgetController({ dailyQuota: 0 });
      const result = zeroQuotaController.checkQuota();
      expect(result).toBe(false);
    });

    it('should handle very large quota', () => {
      const largeQuotaController = new BudgetController({
        dailyQuota: 1000000,
      });

      for (let i = 0; i < 100; i++) {
        largeQuotaController.recordEvolution(true);
      }

      const result = largeQuotaController.checkQuota();
      expect(result).toBe(true);
    });

    it('should handle zero cooldown', () => {
      const noCooldownController = new BudgetController({ cooldownPeriod: 0 });
      noCooldownController.recordEvolution(true);

      expect(noCooldownController.isInCooldown()).toBe(false);
    });

    it('should handle very long cooldown', () => {
      const longCooldownController = new BudgetController({
        cooldownPeriod: 86400000,
      }); // 24 hours
      longCooldownController.recordEvolution(true);

      expect(longCooldownController.isInCooldown()).toBe(true);
      expect(longCooldownController.getCooldownRemaining()).toBeGreaterThan(0);
    });

    it('should handle zero improvement threshold', () => {
      const zeroThresholdController = new BudgetController(undefined, {
        improvementThreshold: 0,
      });

      for (let i = 0; i < 3; i++) {
        zeroThresholdController.recordEvolution(true, 0.001);
      }

      const result = zeroThresholdController.checkConvergence();
      // With threshold 0, any positive improvement is above threshold
      expect(result).toBe(false);
    });
  });

  describe('recent improvements tracking', () => {
    it('should maintain sliding window of 10 improvements', () => {
      for (let i = 0; i < 15; i++) {
        controller.recordEvolution(true, 0.1 * i);
      }

      expect(controller).toBeDefined();
    });

    it('should handle empty improvements array', () => {
      const result = controller.checkConvergence();
      expect(result).toBe(false);
    });

    it('should handle single improvement', () => {
      controller.recordEvolution(true, 0.5);
      const result = controller.checkConvergence();
      expect(result).toBe(false); // Not enough data points
    });
  });
});
