/**
 * OOPS Execution Mode
 *
 * Observe → Orient → Predict → Select → Act
 *
 * @module @jclaw/core/runtime/modes/oops
 */

import type { Task, ContextManager } from '../../types.js';
import type { LLMClient, ChatMessage } from '../llm-client.js';

export interface Prediction {
  id: string;
  description: string;
  pros: string[];
  cons: string[];
  estimatedSuccess: number; // 0-1
}

export interface OOPSState {
  phase: 'observe' | 'orient' | 'predict' | 'select' | 'act';
  observations: string[];
  orientation: string;
  predictions: Prediction[];
  selectedPrediction: Prediction | null;
  result: string;
  iteration: number;
}

export interface OOPSResult {
  success: boolean;
  output: string;
  state: OOPSState;
  duration: number;
}

export class OOPSExecutor {
  constructor(
    private llmClient: LLMClient,
    private contextManager?: ContextManager
  ) {}

  async execute(task: Task): Promise<OOPSResult> {
    const startTime = Date.now();
    const state: OOPSState = {
      phase: 'observe',
      observations: [],
      orientation: '',
      predictions: [],
      selectedPrediction: null,
      result: '',
      iteration: 0,
    };

    const maxIterations = 3;

    while (state.iteration < maxIterations) {
      state.iteration++;

      // OOPS Loop
      await this.observe(task, state);
      await this.orient(task, state);
      await this.predict(task, state);
      await this.select(task, state);
      const shouldContinue = await this.act(task, state);

      if (!shouldContinue) {
        break;
      }
    }

    return {
      success: true,
      output: state.result,
      state,
      duration: Date.now() - startTime,
    };
  }

  private async observe(task: Task, state: OOPSState): Promise<void> {
    state.phase = 'observe';

    let observations: string[] = [`Task: ${task.prompt}`];

    if (this.contextManager) {
      try {
        const context = await this.contextManager.query(task.prompt, { topK: 5 });
        if (context) {
          observations.push(`Relevant context: ${context}`);
        }
      } catch {
        // Ignore context errors
      }
    }

    if (task.context) {
      observations.push(`Additional context: ${JSON.stringify(task.context)}`);
    }

    state.observations = observations;
  }

  private async orient(task: Task, state: OOPSState): Promise<void> {
    state.phase = 'orient';

    const messages: ChatMessage[] = [
      {
        role: 'system',
        content: 'You are an AI assistant using OOPS (Observe-Orient-Predict-Select-Act) methodology. Analyze the situation comprehensively.',
      },
      {
        role: 'user',
        content: `Observations:\n${state.observations.join('\n')}\n\nAnalyze and provide orientation.`,
      },
    ];

    const response = await this.llmClient.chat(messages);
    state.orientation = response.content;
  }

  private async predict(task: Task, state: OOPSState): Promise<void> {
    state.phase = 'predict';

    const messages: ChatMessage[] = [
      {
        role: 'system',
        content: `Generate 3 different approaches to solve the task. For each, provide:
- A brief description
- 2 pros
- 2 cons  
- Estimated success rate (0-1)

Format as JSON array with keys: id, description, pros, cons, estimatedSuccess`,
      },
      {
        role: 'user',
        content: `Task: ${task.prompt}\nOrientation: ${state.orientation}\n\nGenerate approaches.`,
      },
    ];

    const response = await this.llmClient.chat(messages);

    try {
      const jsonMatch = response.content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        state.predictions = JSON.parse(jsonMatch[0]);
      } else {
        // Default prediction if parsing fails
        state.predictions = [{
          id: '1',
          description: 'Standard approach',
          pros: ['Straightforward', 'Reliable'],
          cons: ['May be slow', 'Not optimized'],
          estimatedSuccess: 0.7,
        }];
      }
    } catch {
      state.predictions = [{
        id: '1',
        description: 'Default approach',
        pros: ['Simple'],
        cons: ['Unknown effectiveness'],
        estimatedSuccess: 0.5,
      }];
    }
  }

  private async select(task: Task, state: OOPSState): Promise<void> {
    state.phase = 'select';

    // Select best prediction based on success rate
    if (state.predictions.length > 0) {
      state.selectedPrediction = state.predictions.reduce((best, current) =>
        current.estimatedSuccess > best.estimatedSuccess ? current : best
      );
    }
  }

  private async act(task: Task, state: OOPSState): Promise<boolean> {
    state.phase = 'act';

    const selectedApproach = state.selectedPrediction || state.predictions[0];

    const messages: ChatMessage[] = [
      {
        role: 'system',
        content: 'Execute the selected approach and provide the result.',
      },
      {
        role: 'user',
        content: `Selected approach: ${JSON.stringify(selectedApproach, null, 2)}\n\nExecute it.`,
      },
    ];

    const response = await this.llmClient.chat(messages);
    state.result = response.content;

    // Check if task is complete
    const completionCheck = await this.llmClient.chat([
      {
        role: 'system',
        content: 'Determine if the task is complete. Reply with YES or NO.',
      },
      {
        role: 'user',
        content: `Task: ${task.prompt}\nResult: ${state.result}\n\nIs the task complete?`,
      },
    ]);

    return !completionCheck.content.toLowerCase().includes('yes');
  }
}

export function createOOPSExecutor(
  llmClient: LLMClient,
  contextManager?: ContextManager
): OOPSExecutor {
  return new OOPSExecutor(llmClient, contextManager);
}
