/**
 * Planner Tests
 *
 * Unit tests for Planner class.
 */

import { jest } from '@jest/globals';
import { Planner, createPlanner } from '../../src/planning/planner.js';
import type { LLMClient } from '../../src/runtime/llm-client.js';
import type { Plan, Step, PlanAdjustment } from '../../src/planning/types.js';

describe('Planner', () => {
  let mockLLMClient: jest.Mocked<LLMClient>;
  let planner: Planner;

  beforeEach(() => {
    mockLLMClient = {
      chat: jest.fn(),
    } as any;
    planner = new Planner(mockLLMClient);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('constructor', () => {
    it('should create planner with default config', () => {
      expect(planner).toBeDefined();
    });

    it('should create planner with custom config', () => {
      const customPlanner = new Planner(mockLLMClient, {
        maxSteps: 10,
        verbose: true,
      });
      expect(customPlanner).toBeDefined();
    });
  });

  describe('plan', () => {
    it('should create plan from LLM response', async () => {
      const mockResponse = {
        content: `[
          {"description": "Read config file", "capability": "file_read"},
          {"description": "Analyze content"},
          {"description": "Write updates", "capability": "file_write"}
        ]`,
      };
      mockLLMClient.chat.mockResolvedValue(mockResponse);

      const plan = await planner.plan('Test task', 'Past experience');

      expect(plan).toBeDefined();
      expect(plan.taskPrompt).toBe('Test task');
      expect(plan.steps).toHaveLength(3);
      expect(plan.steps[0]!.description).toBe('Read config file');
      expect(plan.steps[0]!.capability).toBe('file_read');
      expect(plan.steps[1]!.capability).toBeUndefined();
      expect(plan.currentStepIndex).toBe(0);
      expect(mockLLMClient.chat).toHaveBeenCalledTimes(1);
    });

    it('should handle LLM error and return fallback single-step plan', async () => {
      mockLLMClient.chat.mockRejectedValue(new Error('LLM error'));

      const plan = await planner.plan('Test task');

      expect(plan).toBeDefined();
      expect(plan.steps).toHaveLength(1);
      expect(plan.steps[0]!.description).toBe('Test task');
      expect(plan.steps[0]!.status).toBe('pending');
    });

    it('should parse steps up to maxSteps limit', async () => {
      const mockResponse = {
        content: `[
          {"description": "Step 1"},
          {"description": "Step 2"},
          {"description": "Step 3"},
          {"description": "Step 4"},
          {"description": "Step 5"},
          {"description": "Step 6"}
        ]`,
      };
      mockLLMClient.chat.mockResolvedValue(mockResponse);
      const customPlanner = new Planner(mockLLMClient, { maxSteps: 3 });

      const plan = await customPlanner.plan('Task');

      expect(plan.steps).toHaveLength(3); // limited to maxSteps
      expect(plan.steps[2]!.description).toBe('Step 3');
    });

    it('should handle invalid JSON response', async () => {
      const mockResponse = { content: 'Not JSON' };
      mockLLMClient.chat.mockResolvedValue(mockResponse);

      const plan = await planner.plan('Task');

      expect(plan.steps).toHaveLength(1);
      expect(plan.steps[0]!.description).toBe('Not JSON'.slice(0, 200));
    });
  });

  describe('adjust', () => {
    const mockPlan: Plan = {
      taskId: 'plan-1',
      taskPrompt: 'Test',
      steps: [
        { id: 'step-1', description: 'Step 1', status: 'pending' },
        { id: 'step-2', description: 'Step 2', status: 'pending' },
      ],
      currentStepIndex: 0,
      createdAt: Date.now(),
    };

    it('should retry step with retry count < 2', async () => {
      const failedStep = mockPlan.steps[0]!;
      const adjustment = await planner.adjust(mockPlan, failedStep, 'Error');

      expect(adjustment.type).toBe('retry');
      expect(adjustment.reason).toBe('Retrying failed step');
      expect((adjustment as any).newSteps[0]!.retryCount).toBe(1);
    });

    it('should skip step after max retries', async () => {
      const failedStep = { ...mockPlan.steps[0]!, retryCount: 2 };
      const adjustment = await planner.adjust(mockPlan, failedStep, 'Error');

      expect(adjustment.type).toBe('skip');
      expect(adjustment.reason).toBe(
        'Skipping failed step, continuing with next'
      );
    });

    it('should abort when step not found', async () => {
      const failedStep = {
        id: 'step-nonexistent',
        description: 'Missing',
        status: 'pending' as const,
      };
      const adjustment = await planner.adjust(mockPlan, failedStep, 'Error');

      expect(adjustment.type).toBe('abort');
      expect(adjustment.reason).toBe('Step not found in plan');
    });

    it('should abort when retryCount >=2 and no more steps', async () => {
      const failedStep = { ...mockPlan.steps[1]!, retryCount: 2 };
      const adjustment = await planner.adjust(mockPlan, failedStep, 'Error');

      expect(adjustment.type).toBe('abort');
      expect(adjustment.reason).toBe('Error');
    });
  });

  describe('getNextStep', () => {
    const mockPlan: Plan = {
      taskId: 'plan-1',
      taskPrompt: 'Test',
      steps: [
        { id: 'step-1', description: 'Step 1', status: 'pending' },
        { id: 'step-2', description: 'Step 2', status: 'pending' },
      ],
      currentStepIndex: 0,
      createdAt: Date.now(),
    };

    it('should return current step', () => {
      const step = planner.getNextStep(mockPlan);
      expect(step).toEqual(mockPlan.steps[0]);
    });

    it('should return null when plan complete', () => {
      const completePlan = { ...mockPlan, currentStepIndex: 2 };
      const step = planner.getNextStep(completePlan);
      expect(step).toBeNull();
    });
  });

  describe('advanceStep', () => {
    const mockPlan: Plan = {
      taskId: 'plan-1',
      taskPrompt: 'Test',
      steps: [
        { id: 'step-1', description: 'Step 1', status: 'pending' },
        { id: 'step-2', description: 'Step 2', status: 'pending' },
      ],
      currentStepIndex: 0,
      createdAt: Date.now(),
    };

    it('should advance step and mark completed', () => {
      const updated = planner.advanceStep(mockPlan, 'output');

      expect(updated.currentStepIndex).toBe(1);
      expect(updated.steps[0]!.status).toBe('completed');
      expect(updated.steps[0]!.output).toBe('output');
      expect(updated.completedAt).toBeUndefined();
    });

    it('should set completedAt when last step', () => {
      const lastStepPlan = { ...mockPlan, currentStepIndex: 1 };
      const updated = planner.advanceStep(lastStepPlan, 'output');

      expect(updated.currentStepIndex).toBe(2);
      expect(updated.completedAt).toBeDefined();
    });
  });

  describe('markStepFailed', () => {
    const mockPlan: Plan = {
      taskId: 'plan-1',
      taskPrompt: 'Test',
      steps: [{ id: 'step-1', description: 'Step 1', status: 'pending' }],
      currentStepIndex: 0,
      createdAt: Date.now(),
    };

    it('should mark step as failed with error', () => {
      const updated = planner.markStepFailed(mockPlan, 'Error message');

      expect(updated.steps[0]!.status).toBe('failed');
      expect(updated.steps[0]!.error).toBe('Error message');
      expect(updated.currentStepIndex).toBe(0); // unchanged
    });
  });

  describe('isComplete', () => {
    const mockPlan: Plan = {
      taskId: 'plan-1',
      taskPrompt: 'Test',
      steps: [{ id: 'step-1', description: 'Step 1', status: 'pending' }],
      currentStepIndex: 0,
      createdAt: Date.now(),
    };

    it('should return false when steps remain', () => {
      expect(planner.isComplete(mockPlan)).toBe(false);
    });

    it('should return true when all steps processed', () => {
      const completePlan = { ...mockPlan, currentStepIndex: 1 };
      expect(planner.isComplete(completePlan)).toBe(true);
    });
  });
});

describe('createPlanner', () => {
  it('should create planner instance', () => {
    const mockLLMClient = {} as LLMClient;
    const planner = createPlanner(mockLLMClient);
    expect(planner).toBeDefined();
    expect(planner).toBeInstanceOf(Planner);
  });
});
