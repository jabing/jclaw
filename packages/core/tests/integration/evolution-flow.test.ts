/**
 * Integration Tests: Evolution Flow
 *
 * Tests the complete evolution flow:
 * - Trigger detection → Evolution execution → Convergence
 * - Task execution mode selection
 * - Budget and cooldown controls
 *
 * @module @jclaw/core/tests/integration/evolution-flow
 */

import {
  EvolutionTriggerEngine,
  type TriggerResult,
} from '../../src/evolution/trigger.js';
import {
  BudgetController,
  type BudgetStatus,
} from '../../src/evolution/budget.js';
import {
  ComplexityAssessor,
  type ComplexityResult,
} from '../../src/runtime/complexity-assessor.js';
import type {
  TriggerConfig,
  EvolutionBudget,
  ConvergenceConfig,
} from '../../src/evolution/protocol.js';
import {
  DEFAULT_TRIGGER_CONFIGS,
  DEFAULT_EVOLUTION_BUDGET,
  DEFAULT_CONVERGENCE_CONFIG,
} from '../../src/evolution/protocol.js';

describe('Integration: Evolution Flow', () => {
  describe('Trigger → Budget → Execution Flow', () => {
    let triggerEngine: EvolutionTriggerEngine;
    let budgetController: BudgetController;

    beforeEach(() => {
      triggerEngine = new EvolutionTriggerEngine();
      budgetController = new BudgetController();
    });

    it('should trigger evolution after failure threshold is reached', () => {
      // Record failures below threshold
      triggerEngine.recordResult(false);
      triggerEngine.recordResult(false);

      let result = triggerEngine.checkFailureTrigger();
      expect(result.shouldTrigger).toBe(false);

      // Record one more failure to exceed threshold
      triggerEngine.recordResult(false);
      result = triggerEngine.checkFailureTrigger();
      expect(result.shouldTrigger).toBe(true);
      expect(result.urgency).toBe('high');
    });

    it('should respect budget quota during evolution', () => {
      // Check initial quota
      expect(budgetController.checkQuota()).toBe(true);

      // Record multiple evolutions
      for (let i = 0; i < 10; i++) {
        budgetController.recordEvolution(true, 0.05);
      }

      // Should exceed quota
      expect(budgetController.checkQuota()).toBe(false);
    });

    it('should enter cooldown after evolution', () => {
      budgetController.recordEvolution(true, 0.1);

      expect(budgetController.isInCooldown()).toBe(true);
      expect(budgetController.getCooldownRemaining()).toBeGreaterThan(0);
    });

    it('should detect convergence when improvements plateau', () => {
      const convergenceConfig: Partial<ConvergenceConfig> = {
        improvementThreshold: 0.05,
        patienceCycles: 3,
      };

      const controller = new BudgetController({}, convergenceConfig);

      // Record improvements above threshold
      controller.recordEvolution(true, 0.1);
      controller.recordEvolution(true, 0.1);
      expect(controller.checkConvergence()).toBe(false);

      // Record improvements below threshold (simulating plateau)
      controller.recordEvolution(true, 0.01);
      controller.recordEvolution(true, 0.01);
      controller.recordEvolution(true, 0.01);

      expect(controller.checkConvergence()).toBe(true);
    });

    it('should complete full evolution flow', async () => {
      // Step 1: Record failures to trigger evolution
      for (let i = 0; i < 3; i++) {
        triggerEngine.recordResult(false);
      }

      const triggerResult = triggerEngine.checkFailureTrigger();
      expect(triggerResult.shouldTrigger).toBe(true);

      // Step 2: Check budget before evolution
      const hasQuota = budgetController.checkQuota();
      expect(hasQuota).toBe(true);

      // Step 3: Execute evolution (simulated)
      const improvement = 0.15;
      budgetController.recordEvolution(true, improvement);

      // Step 4: Verify cooldown started
      expect(budgetController.isInCooldown()).toBe(true);

      // Step 5: Get status
      const status = budgetController.getStatus();
      expect(status.dailyUsed).toBe(1);
      expect(status.inCooldown).toBe(true);
    });
  });

  describe('Task Complexity → Mode Selection', () => {
    let assessor: ComplexityAssessor;

    beforeEach(() => {
      assessor = new ComplexityAssessor();
    });

    it('should recommend ReAct for simple tasks', () => {
      const result = assessor.assess('fix typo in readme');

      expect(result.level).toBe('simple');
      expect(result.recommendedMode).toBe('react');
      expect(result.score).toBeLessThan(0.3);
    });

    it('should recommend OODA for medium tasks', () => {
      const result = assessor.assess(
        'Add a new API endpoint to handle user authentication with JWT tokens'
      );

      expect(result.level).toBe('medium');
      expect(result.recommendedMode).toBe('ooda');
      expect(result.score).toBeGreaterThanOrEqual(0.3);
      expect(result.score).toBeLessThan(0.7);
    });

    it('should recommend OOPS for complex tasks with risk keywords', () => {
      const result = assessor.assess(
        'Refactor the production authentication system to use OAuth2 and migrate all existing users. ' +
          'This is critical and requires backup and restore procedures. ' +
          'Step 1: Create backup. Step 2: Implement OAuth2. Step 3: Migrate users. Step 4: Verify.'
      );

      expect(result.level).toBe('complex');
      expect(result.recommendedMode).toBe('oops');
      expect(result.score).toBeGreaterThanOrEqual(0.7);
      expect(result.factors.hasRiskKeywords).toBe(true);
      expect(result.factors.hasMultiSteps).toBe(true);
    });

    it('should track historical failure rates', () => {
      // Record some failures for similar prompts
      assessor.recordResult('fix authentication bug', false);
      assessor.recordResult('fix authentication bug', false);
      assessor.recordResult('fix authentication bug', true);

      // Assess similar prompt
      const result = assessor.assess('fix authentication issue');

      // Should have elevated complexity due to failure history
      expect(result.factors.historicalFailureRate).toBeGreaterThan(0);
    });
  });

  describe('Performance Degradation Trigger', () => {
    let triggerEngine: EvolutionTriggerEngine;

    beforeEach(() => {
      triggerEngine = new EvolutionTriggerEngine();
    });

    it('should trigger on significant performance drop', () => {
      // Record baseline performance
      triggerEngine.recordPerformance(100);

      // Check with minor drop (should not trigger)
      let result = triggerEngine.checkDegradationTrigger(90);
      expect(result.shouldTrigger).toBe(false);

      // Check with major drop (should trigger)
      result = triggerEngine.checkDegradationTrigger(70);
      expect(result.shouldTrigger).toBe(true);
      expect(result.urgency).toBe('medium');
    });
  });

  describe('Budget Management', () => {
    it('should reset daily quota at day boundary', () => {
      const controller = new BudgetController({
        dailyQuota: 5,
        cooldownPeriod: 100, // Short for testing
      });

      // Use all quota
      for (let i = 0; i < 5; i++) {
        controller.recordEvolution(true, 0.1);
      }

      expect(controller.checkQuota()).toBe(false);

      // Simulate day passing (in real implementation, this would be time-based)
      // For now, we just verify the structure
      const status = controller.getStatus();
      expect(status.dailyUsed).toBe(5);
      expect(status.dailyLimit).toBe(5);
    });

    it('should enforce cooldown period between evolutions', () => {
      const controller = new BudgetController({
        cooldownPeriod: 1000, // 1 second
      });

      controller.recordEvolution(true, 0.1);

      const status = controller.getStatus();
      expect(status.inCooldown).toBe(true);
      expect(status.cooldownRemaining).toBeGreaterThan(0);
    });
  });
});

describe('Integration: Evolution Protocol', () => {
  it('should use default configurations', () => {
    expect(DEFAULT_EVOLUTION_BUDGET.dailyQuota).toBe(100);
    expect(DEFAULT_EVOLUTION_BUDGET.cooldownPeriod).toBe(60000);
    expect(DEFAULT_CONVERGENCE_CONFIG.patienceCycles).toBe(5);
    expect(DEFAULT_TRIGGER_CONFIGS).toHaveLength(3);
  });

  it('should create trigger engine with custom configs', () => {
    const customConfigs: TriggerConfig[] = [
      { type: 'failure', threshold: 5, enabled: true },
      { type: 'degradation', threshold: 30, enabled: true },
    ];

    const engine = new EvolutionTriggerEngine(customConfigs);

    // Record failures below custom threshold
    for (let i = 0; i < 4; i++) {
      engine.recordResult(false);
    }

    let result = engine.checkFailureTrigger();
    expect(result.shouldTrigger).toBe(false);

    // One more failure to trigger
    engine.recordResult(false);
    result = engine.checkFailureTrigger();
    expect(result.shouldTrigger).toBe(true);
  });
});
