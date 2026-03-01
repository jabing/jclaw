/**
 * OODA Execution Mode
 *
 * Observe → Orient → Decide → Act
 *
 * @module @jclaw/core/runtime/modes/ooda
 */

import type { Task, ContextManager } from '../../types.js';
import type { LLMClient, ChatMessage } from '../llm-client.js';

export interface OODAState {
  phase: 'observe' | 'orient' | 'decide' | 'act';
  observations: string[];
  orientation: string;
  decision: string;
  actions: string[];
  iteration: number;
}

export interface OODAResult {
  success: boolean;
  output: string;
  state: OODAState;
  duration: number;
}

export class OODAExecutor {
  constructor(
    private llmClient: LLMClient,
    private contextManager?: ContextManager
  ) {}

  async execute(task: Task): Promise<OODAResult> {
    const startTime = Date.now();
    const state: OODAState = {
      phase: 'observe',
      observations: [],
      orientation: '',
      decision: '',
      actions: [],
      iteration: 0,
    };

    const maxIterations = 3;

    while (state.iteration < maxIterations) {
      state.iteration++;

      // OODA Loop
      await this.observe(task, state);
      await this.orient(task, state);
      await this.decide(task, state);
      const shouldContinue = await this.act(task, state);

      if (!shouldContinue) {
        break;
      }
    }

    return {
      success: true,
      output: state.actions.join('\n'),
      state,
      duration: Date.now() - startTime,
    };
  }

  private async observe(task: Task, state: OODAState): Promise<void> {
    state.phase = 'observe';

    // Gather context
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

  private async orient(task: Task, state: OODAState): Promise<void> {
    state.phase = 'orient';

    const messages: ChatMessage[] = [
      {
        role: 'system',
        content: 'You are an AI assistant using OODA (Observe-Orient-Decide-Act) methodology. In the Orient phase, analyze the observations and understand the context.',
      },
      {
        role: 'user',
        content: `Observations:\n${state.observations.join('\n')}\n\nAnalyze and orient yourself to understand what needs to be done.`,
      },
    ];

    const response = await this.llmClient.chat(messages);
    state.orientation = response.content;
  }

  private async decide(task: Task, state: OODAState): Promise<void> {
    state.phase = 'decide';

    const messages: ChatMessage[] = [
      {
        role: 'system',
        content: 'You are in the Decide phase of OODA. Based on your orientation, decide on the best course of action.',
      },
      {
        role: 'user',
        content: `Orientation: ${state.orientation}\n\nDecide on the action to take.`,
      },
    ];

    const response = await this.llmClient.chat(messages);
    state.decision = response.content;
  }

  private async act(task: Task, state: OODAState): Promise<boolean> {
    state.phase = 'act';

    const messages: ChatMessage[] = [
      {
        role: 'system',
        content: 'You are in the Act phase of OODA. Execute the decided action and provide the result.',
      },
      {
        role: 'user',
        content: `Decision: ${state.decision}\n\nExecute the action.`,
      },
    ];

    const response = await this.llmClient.chat(messages);
    state.actions.push(response.content);

    // Check if task is complete
    const completionCheck = await this.llmClient.chat([
      {
        role: 'system',
        content: 'Determine if the task is complete. Reply with YES or NO.',
      },
      {
        role: 'user',
        content: `Task: ${task.prompt}\nAction taken: ${response.content}\n\nIs the task complete?`,
      },
    ]);

    return !completionCheck.content.toLowerCase().includes('yes');
  }
}

export function createOODAExecutor(
  llmClient: LLMClient,
  contextManager?: ContextManager
): OODAExecutor {
  return new OODAExecutor(llmClient, contextManager);
}
