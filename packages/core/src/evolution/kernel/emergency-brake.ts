/**
 * Emergency Brake
 *
 * Monitors system health and triggers emergency rollback
 * when error rate exceeds threshold
 *
 * @module @jclaw/core/evolution/kernel
 */

export interface BrakeConfig {
  errorRateThreshold: number; // Percentage (0-100)
  windowSize: number; // Number of operations to consider
  cooldownPeriod: number; // Milliseconds to wait after triggering
}

export interface BrakeState {
  triggered: boolean;
  triggeredAt?: Date;
  cooldownUntil?: Date;
  errorRate: number;
}

export class EmergencyBrake {
  private readonly config: BrakeConfig;
  private state: BrakeState;
  private errorHistory: boolean[] = [];

  constructor(config?: Partial<BrakeConfig>) {
    this.config = {
      errorRateThreshold: 30, // 30% error rate triggers brake
      windowSize: 100, // Last 100 operations
      cooldownPeriod: 86400000, // 24 hours
      ...config,
    };
    this.state = {
      triggered: false,
      errorRate: 0,
    };
  }

  /**
   * Record an operation result
   */
  record(success: boolean): void {
    this.errorHistory.push(!success);

    // Keep only the last N operations
    if (this.errorHistory.length > this.config.windowSize) {
      this.errorHistory.shift();
    }

    this.updateState();
  }

  /**
   * Check if brake should be triggered
   */
  check(): boolean {
    // If in cooldown, don't trigger again
    if (this.state.cooldownUntil && new Date() < this.state.cooldownUntil) {
      return true;
    }

    return this.state.triggered;
  }

  /**
   * Trigger emergency brake
   */
  async trigger(): Promise<void> {
    this.state.triggered = true;
    this.state.triggeredAt = new Date();
    this.state.cooldownUntil = new Date(
      Date.now() + this.config.cooldownPeriod
    );

    // In production, this would:
    // 1. Stop all evolution
    // 2. Rollback to last stable state
    // 3. Notify monitoring system
    console.error(
      '[EmergencyBrake] Triggered! Error rate:',
      this.state.errorRate
    );
  }

  /**
   * Reset brake state (after cooldown or manual reset)
   */
  reset(): void {
    this.state = {
      triggered: false,
      errorRate: 0,
    };
    this.errorHistory = [];
  }

  /**
   * Get current brake state
   */
  getState(): BrakeState {
    return { ...this.state };
  }

  private updateState(): void {
    const errorCount = this.errorHistory.filter((e) => e).length;
    this.state.errorRate = (errorCount / this.errorHistory.length) * 100;

    // Trigger if error rate exceeds threshold
    if (this.state.errorRate >= this.config.errorRateThreshold) {
      this.trigger();
    }
  }
}

export function createEmergencyBrake(
  config?: Partial<BrakeConfig>
): EmergencyBrake {
  return new EmergencyBrake(config);
}
