/**
 * Task Planner
 *
 * Breaks down tasks into executable steps using LLM.
 *
 * @module @jclaw/core/planning/planner
 */

import type { LLMClient } from '../runtime/llm-client.js';
import type { Plan, Step, PlannerConfig, PlanAdjustment } from './types.js';

type StepWithRetryCount = Step & { retryCount?: number };

const PLANNING_PROMPT = `You are a task planner. Break down the given task into clear, sequential steps.

Available capabilities:
- file_read: Read file contents
- file_write: Write to file
- file_create: Create new file
- file_delete: Delete file
- dir_create: Create directory
- dir_list: List directory contents
- file_glob: Search files by pattern
- file_find: Find file by name

Task: {TASK}

{CONTEXT}

Output ONLY a JSON array of steps, each with:
- description: What to do (string)
- capability: Which capability to use (string, optional)

Example:
[
  {"description": "Read the configuration file", "capability": "file_read"},
  {"description": "Analyze the content and prepare modifications"},
  {"description": "Write the updated configuration", "capability": "file_write"}
]

Steps:`;

export class Planner {
  private readonly llmClient: LLMClient;
  private readonly config: Required<PlannerConfig>;

  constructor(llmClient: LLMClient, config: PlannerConfig = {}) {
    this.llmClient = llmClient;
    this.config = {
      maxSteps: config.maxSteps ?? 5,
      verbose: config.verbose ?? false,
    };
  }

  async plan(taskPrompt: string, relevantExperiences?: string): Promise<Plan> {
    const taskId = 'plan-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);

    // Build prompt
    let prompt = PLANNING_PROMPT.replace('{TASK}', taskPrompt);
    prompt = prompt.replace('{CONTEXT}', relevantExperiences 
      ? 'Relevant past experiences:\n' + relevantExperiences 
      : 'No relevant past experiences found.');

    try {
      // Get plan from LLM
      const response = await this.llmClient.chat([
        { role: 'user', content: prompt }
      ]);

      // Parse steps
      const steps = this.parseSteps(response.content);

      if (this.config.verbose) {
        console.log('[Planner] Created plan with ' + steps.length + ' steps');
      }

      return {
        taskId,
        taskPrompt,
        steps,
        currentStepIndex: 0,
        createdAt: Date.now(),
        relevantExperiences,
      };
    } catch (error) {
      // Fallback: single-step plan
      if (this.config.verbose) {
        console.log('[Planner] Using fallback single-step plan');
      }

      return {
        taskId,
        taskPrompt,
        steps: [{
          id: 'step-1',
          description: taskPrompt,
          status: 'pending',
        }],
        currentStepIndex: 0,
        createdAt: Date.now(),
        relevantExperiences,
      };
    }
  }

  async adjust(plan: Plan, failedStep: Step, error: string): Promise<PlanAdjustment> {
    // Simple adjustment logic
    const stepIndex = plan.steps.findIndex(s => s.id === failedStep.id);

    if (stepIndex === -1) {
      return { type: 'abort', reason: 'Step not found in plan' };
    }

    // Check if we should retry
    const retryCount = (failedStep as StepWithRetryCount).retryCount || 0;
    if (retryCount < 2) {
      return {
        type: 'retry',
        reason: 'Retrying failed step',
        newSteps: plan.steps.map(s => 
          s.id === failedStep.id 
            ? { ...s, retryCount: retryCount + 1 }
            : s
        ),
      };
    }

    // Check if we can skip
    if (plan.steps.length > stepIndex + 1) {
      return { type: 'skip', reason: 'Skipping failed step, continuing with next' };
    }

    return { type: 'abort', reason: error };
  }

  getNextStep(plan: Plan): Step | null {
    if (plan.currentStepIndex >= plan.steps.length) {
      return null;
    }
    return plan.steps[plan.currentStepIndex]!;
  }

  advanceStep(plan: Plan, output?: unknown): Plan {
    const updatedSteps = [...plan.steps];
    if (output !== undefined && plan.currentStepIndex < updatedSteps.length) {
      updatedSteps[plan.currentStepIndex] = {
        ...updatedSteps[plan.currentStepIndex],
        id: updatedSteps[plan.currentStepIndex]!.id,
        description: updatedSteps[plan.currentStepIndex]!.description,
        status: 'completed',
        output,
      };
    }

    return {
      ...plan,
      steps: updatedSteps,
      currentStepIndex: plan.currentStepIndex + 1,
      completedAt: plan.currentStepIndex + 1 >= plan.steps.length ? Date.now() : undefined,
    };
  }

  markStepFailed(plan: Plan, error: string): Plan {
    const updatedSteps = [...plan.steps];
    if (plan.currentStepIndex < updatedSteps.length) {
      updatedSteps[plan.currentStepIndex] = {
        ...updatedSteps[plan.currentStepIndex],
        id: updatedSteps[plan.currentStepIndex]!.id,
        description: updatedSteps[plan.currentStepIndex]!.description,
        status: 'failed',
        error,
      };
    }

    return {
      ...plan,
      steps: updatedSteps,
    };
  }

  isComplete(plan: Plan): boolean {
    return plan.currentStepIndex >= plan.steps.length;
  }

  private parseSteps(content: string): Step[] {
    try {
      // Try to extract JSON array from response
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        throw new Error('No JSON array found');
      }

      const parsed = JSON.parse(jsonMatch[0]);
      if (!Array.isArray(parsed)) {
        throw new Error('Parsed content is not an array');
      }

      return parsed.slice(0, this.config.maxSteps).map((step, i) => ({
        id: 'step-' + (i + 1),
        description: step.description || step,
        status: 'pending' as const,
        capability: step.capability,
        input: step.input,
      }));
    } catch {
      // Fallback: treat entire response as single step
      return [{
        id: 'step-1',
        description: content.slice(0, 200),
        status: 'pending' as const,
      }];
    }
  }
}

export function createPlanner(llmClient: LLMClient, config?: PlannerConfig): Planner {
  return new Planner(llmClient, config);
}
