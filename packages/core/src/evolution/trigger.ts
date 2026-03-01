/**
 * Evolution Triggers
 *
 * Implements various triggers that initiate evolution cycles
 *
 * @module @jclaw/core/evolution/trigger
 */

import type { TriggerConfig, EvolutionTrigger } from './protocol.js';

export interface TriggerResult {
  shouldTrigger: boolean;
  reason: string;
  urgency: 'low' | 'medium' | 'high';
}

export class EvolutionTriggerEngine {
  private failureCount = 0;
  private successCount = 0;
  private lastPerformance: number | null = null;
  private lastTriggerTime = 0;
  private configs: Map<EvolutionTrigger, TriggerConfig> = new Map();

  constructor(configs?: TriggerConfig[]) {
    if (configs) {
      for (const config of configs) {
        this.configs.set(config.type, config);
      }
    }

    // Set defaults if not provided
    if (!this.configs.has('failure')) {
      this.configs.set('failure', {
        type: 'failure',
        threshold: 3,
        enabled: true,
        cooldown: 300000, // 5 minutes
      });
    }
    if (!this.configs.has('degradation')) {
      this.configs.set('degradation', {
        type: 'degradation',
        threshold: 20, // 20% drop
        enabled: true,
        cooldown: 600000, // 10 minutes
      });
    }
    if (!this.configs.has('periodic')) {
      this.configs.set('periodic', {
        type: 'periodic',
        interval: 3600000, // 1 hour
        enabled: true,
        cooldown: 3600000,
      });
    }
  }

  recordResult(success: boolean): void {
    if (success) {
      this.successCount++;
    } else {
      this.failureCount++;
    }
  }

  recordPerformance(value: number): void {
    this.lastPerformance = value;
  }

  checkFailureTrigger(): TriggerResult {
    const config = this.configs.get('failure');
    if (!config || !config.enabled) {
      return { shouldTrigger: false, reason: 'Failure trigger disabled', urgency: 'low' };
    }

    if (this.isInCooldown('failure', config)) {
      return { shouldTrigger: false, reason: 'Failure trigger in cooldown', urgency: 'low' };
    }

    if (this.failureCount >= (config.threshold || 3)) {
      return { shouldTrigger: true, reason: `${this.failureCount} failures exceeded threshold`, urgency: 'high' };
    }

    return { shouldTrigger: false, reason: `Only ${this.failureCount} failures`, urgency: 'low' };
  }

  checkDegradationTrigger(currentPerformance: number): TriggerResult {
    const config = this.configs.get('degradation');
    if (!config || !config.enabled || this.lastPerformance === null) {
      return { shouldTrigger: false, reason: 'Degradation trigger disabled or no baseline', urgency: 'low' };
    }

    if (this.isInCooldown('degradation', config)) {
      return { shouldTrigger: false, reason: 'Degradation trigger in cooldown', urgency: 'low' };
    }

    const drop = ((this.lastPerformance - currentPerformance) / this.lastPerformance) * 100;
    if (drop >= (config.threshold || 20)) {
      return { shouldTrigger: true, reason: `Performance dropped ${drop.toFixed(1)}%`, urgency: 'medium' };
    }

    return { shouldTrigger: false, reason: `Only ${drop.toFixed(1)}% drop`, urgency: 'low' };
  }

  checkPeriodicTrigger(): TriggerResult {
    const config = this.configs.get('periodic');
    if (!config || !config.enabled) {
      return { shouldTrigger: false, reason: 'Periodic trigger disabled', urgency: 'low' };
    }

    const now = Date.now();
    const interval = config.interval || 3600000;

    if (now - this.lastTriggerTime >= interval) {
      return { shouldTrigger: true, reason: 'Periodic interval reached', urgency: 'low' };
    }

    const remaining = interval - (now - this.lastTriggerTime);
    return { shouldTrigger: false, reason: `${remaining / 1000}s until next check`, urgency: 'low' };
  }

  markTriggered(type: EvolutionTrigger): void {
    const config = this.configs.get(type);
    if (config) {
      this.lastTriggerTime = Date.now();
    }

    // Reset counters on trigger
    if (type === 'failure') {
      this.failureCount = 0;
      this.successCount = 0;
    }
  }

  private isInCooldown(type: EvolutionTrigger, config: TriggerConfig): boolean {
    const cooldown = config.cooldown || 0;
    if (cooldown === 0) return false;
    return Date.now() - this.lastTriggerTime < cooldown;
  }

  reset(): void {
    this.failureCount = 0;
    this.successCount = 0;
    this.lastTriggerTime = 0;
  }
}

export function createEvolutionTriggerEngine(configs?: TriggerConfig[]): EvolutionTriggerEngine {
  return new EvolutionTriggerEngine(configs);
}
