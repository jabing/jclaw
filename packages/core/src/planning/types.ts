/**
 * Planning Module Types
 *
 * @module @jclaw/core/planning/types
 */

export type StepStatus = 'pending' | 'running' | 'completed' | 'failed';

export interface Step {
  id: string;
  description: string;
  status: StepStatus;
  capability?: string;
  input?: unknown;
  output?: unknown;
  error?: string;
}

export interface Plan {
  taskId: string;
  taskPrompt: string;
  steps: Step[];
  currentStepIndex: number;
  createdAt: number;
  completedAt?: number;
  relevantExperiences?: string;
}

export interface PlannerConfig {
  maxSteps?: number;
  verbose?: boolean;
}

export interface PlanAdjustment {
  type: 'retry' | 'skip' | 'abort' | 'alternative';
  reason: string;
  newSteps?: Step[];
}
