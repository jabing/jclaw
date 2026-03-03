/**
 * Rollback Manager
 *
 * Manages system states and provides rollback capability
 * for recovering from failed evolutions
 *
 * @module @jclaw/core/evolution/kernel
 */

export interface StateInfo {
  id: string;
  name: string;
  createdAt: Date;
  description: string;
}

export interface RollbackOptions {
  force?: boolean;
}

export class RollbackManager {
  private states: Map<string, StateInfo> = new Map();
  private currentStateId?: string;

  /**
   * Save current system state
   */
  async saveState(name: string, description: string): Promise<string> {
    const stateId = `state-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    const stateInfo: StateInfo = {
      id: stateId,
      name,
      createdAt: new Date(),
      description,
    };

    this.states.set(stateId, stateInfo);
    this.currentStateId = stateId;

    // In production, this would save to persistent storage
    console.log(`[RollbackManager] Saved state: ${stateId} - ${name}`);

    return stateId;
  }

  /**
   * Rollback to a previous state
   */
  async rollback(stateId: string, options?: RollbackOptions): Promise<boolean> {
    const state = this.states.get(stateId);

    if (!state) {
      console.error(`[RollbackManager] State not found: ${stateId}`);
      return false;
    }

    // In production, this would:
    // 1. Restore code from state
    // 2. Restore configuration
    // 3. Restart affected services
    console.log(
      `[RollbackManager] Rolling back to: ${stateId} - ${state.name}`
    );

    this.currentStateId = stateId;
    return true;
  }

  /**
   * Get current state
   */
  getCurrentState(): StateInfo | undefined {
    if (!this.currentStateId) {
      return undefined;
    }
    return this.states.get(this.currentStateId);
  }

  /**
   * List all available states
   */
  listStates(): StateInfo[] {
    const states: StateInfo[] = Array.from(this.states.values());
    return states.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  /**
   * Delete old states (cleanup)
   */
  async cleanup(olderThan?: Date): Promise<number> {
    const cutoff = olderThan || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // 7 days default
    let deleted = 0;

    const entries = Array.from(this.states.entries());
    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i];
      if (entry === undefined) continue;
      const [id, state] = entry;
      if (state.createdAt < cutoff) {
        this.states.delete(id);
        deleted++;
      }
    }

    console.log(`[RollbackManager] Cleaned up ${deleted} old states`);
    return deleted;
  }
}

export function createRollbackManager(): RollbackManager {
  return new RollbackManager();
}
