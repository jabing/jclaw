/**
 * Planning Types Tests
 *
 * Validation tests for planning module type definitions.
 */

import type {
  StepStatus,
  Step,
  Plan,
  PlannerConfig,
  PlanAdjustment,
} from '../../src/planning/types.js';

describe('Planning Types', () => {
  describe('StepStatus', () => {
    it('should have valid status values', () => {
      // Test that StepStatus values are correct
      const validStatuses: StepStatus[] = [
        'pending',
        'running',
        'completed',
        'failed',
      ];
      expect(validStatuses).toHaveLength(4);
      expect(validStatuses).toContain('pending');
      expect(validStatuses).toContain('running');
      expect(validStatuses).toContain('completed');
      expect(validStatuses).toContain('failed');
    });
  });

  describe('Step interface', () => {
    it('should allow valid Step objects', () => {
      const step: Step = {
        id: 'step-1',
        description: 'Test step',
        status: 'pending',
      };
      expect(step.id).toBe('step-1');
      expect(step.description).toBe('Test step');
      expect(step.status).toBe('pending');

      const stepWithExtras: Step = {
        id: 'step-2',
        description: 'Another step',
        status: 'completed',
        capability: 'file_read',
        input: { filename: 'test.txt' },
        output: { content: 'Hello' },
        error: undefined,
      };
      expect(stepWithExtras.capability).toBe('file_read');
      expect((stepWithExtras.input as any).filename).toBe('test.txt');
    });

    it('should require id, description, and status', () => {
      // TypeScript will enforce this at compile time
      // This test is just for documentation
      const requiredFields = ['id', 'description', 'status'];
      expect(requiredFields).toEqual(['id', 'description', 'status']);
    });
  });

  describe('Plan interface', () => {
    it('should allow valid Plan objects', () => {
      const plan: Plan = {
        taskId: 'task-123',
        taskPrompt: 'Do something',
        steps: [
          {
            id: 'step-1',
            description: 'First step',
            status: 'pending',
          },
        ],
        currentStepIndex: 0,
        createdAt: Date.now(),
      };
      expect(plan.taskId).toBe('task-123');
      expect(plan.steps).toHaveLength(1);
      expect(plan.currentStepIndex).toBe(0);
      expect(typeof plan.createdAt).toBe('number');

      const completePlan: Plan = {
        taskId: 'task-456',
        taskPrompt: 'Another task',
        steps: [],
        currentStepIndex: 0,
        createdAt: Date.now(),
        completedAt: Date.now() + 1000,
        relevantExperiences: 'Past experience',
      };
      expect(completePlan.completedAt).toBeDefined();
      expect(completePlan.relevantExperiences).toBe('Past experience');
    });
  });

  describe('PlannerConfig interface', () => {
    it('should allow valid config objects', () => {
      const defaultConfig: PlannerConfig = {};
      expect(defaultConfig).toEqual({});

      const fullConfig: PlannerConfig = {
        maxSteps: 10,
        verbose: true,
      };
      expect(fullConfig.maxSteps).toBe(10);
      expect(fullConfig.verbose).toBe(true);
    });
  });

  describe('PlanAdjustment interface', () => {
    it('should allow valid adjustment objects', () => {
      const retryAdjustment: PlanAdjustment = {
        type: 'retry',
        reason: 'Retrying failed step',
        newSteps: [
          {
            id: 'step-1',
            description: 'Retry step',
            status: 'pending',
          },
        ],
      };
      expect(retryAdjustment.type).toBe('retry');
      expect(retryAdjustment.newSteps).toHaveLength(1);

      const skipAdjustment: PlanAdjustment = {
        type: 'skip',
        reason: 'Skipping step',
      };
      expect(skipAdjustment.type).toBe('skip');
      expect(skipAdjustment.newSteps).toBeUndefined();

      const abortAdjustment: PlanAdjustment = {
        type: 'abort',
        reason: 'Fatal error',
      };
      expect(abortAdjustment.type).toBe('abort');

      const alternativeAdjustment: PlanAdjustment = {
        type: 'alternative',
        reason: 'Trying alternative approach',
        newSteps: [
          {
            id: 'step-alt',
            description: 'Alternative step',
            status: 'pending',
          },
        ],
      };
      expect(alternativeAdjustment.type).toBe('alternative');
    });
  });
});
