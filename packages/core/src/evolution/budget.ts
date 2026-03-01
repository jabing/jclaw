/**
 * Evolution Budget Controller
 *
 * Controls resource limits for evolution to prevent over-evolution
 *
 * @module @jclaw/core/evolution/budget
 */

import type { EvolutionBudget, ConvergenceConfig } from './protocol.js';

export interface BudgetStatus {
  dailyUsed: number;
  dailyLimit: number;
  inCooldown: boolean;
  cooldownRemaining: number;
  consecutiveNoImprovement: number;
}

export class BudgetController {
  private readonly budget: EvolutionBudget;
  private readonly convergence: ConvergenceConfig;
  
  private dailyEvolutionCount = 0;
  private lastEvolutionTime = 0;
  private cooldownStartTime = 0;
  private isInCooldownState = false;
  private recentImprovements: number[] = [];

  constructor(budget?: Partial<EvolutionBudget>, convergence?: Partial<ConvergenceConfig>) {
    this.convergence = {
      improvementThreshold: 0.01,
      patienceCycles: 3,
      ...convergence,
    };

    this.budget = {
      dailyQuota: 10,
      cooldownPeriod: 3600000, // 1 hour
      maxMutationsPerCycle: 5,
      convergence: this.convergence,
      ...budget,
    };
  }

  checkQuota(): boolean {
    this.resetDailyIfNeeded();
    return this.dailyEvolutionCount < this.budget.dailyQuota;
  }

  recordEvolution(success: boolean, improvement?: number): void {
    this.dailyEvolutionCount++;
    this.lastEvolutionTime = Date.now();

    if (improvement !== undefined) {
      this.recentImprovements.push(improvement);
      if (this.recentImprovements.length > 10) {
        this.recentImprovements.shift();
      }
    }

    this.startCooldown(this.budget.cooldownPeriod);
  }

  isInCooldown(): boolean {
    if (!this.isInCooldownState) return false;

    const elapsed = Date.now() - this.cooldownStartTime;
    
    if (elapsed >= this.budget.cooldownPeriod) {
      this.isInCooldownState = false;
      return false;
    }

    return true;
  }

  getCooldownRemaining(): number {
    if (!this.isInCooldownState) return 0;
    
    const elapsed = Date.now() - this.cooldownStartTime;
    const remaining = this.budget.cooldownPeriod - elapsed;
    
    return Math.max(0, remaining);
  }

  checkConvergence(): boolean {
    if (this.recentImprovements.length < this.convergence.patienceCycles) {
      return false;
    }

    const recent = this.recentImprovements.slice(-this.convergence.patienceCycles);
    const allBelowThreshold = recent.every(imp => imp < this.convergence.improvementThreshold);

    return allBelowThreshold;
  }

  getStatus(): BudgetStatus {
    this.resetDailyIfNeeded();
    
    return {
      dailyUsed: this.dailyEvolutionCount,
      dailyLimit: this.budget.dailyQuota,
      inCooldown: this.isInCooldown(),
      cooldownRemaining: this.getCooldownRemaining(),
      consecutiveNoImprovement: this.countConsecutiveNoImprovement(),
    };
  }

  emergencyStop(): void {
    this.cooldownStartTime = Date.now();
    this.isInCooldownState = true;
  }

  reset(): void {
    this.dailyEvolutionCount = 0;
    this.isInCooldownState = false;
    this.recentImprovements = [];
  }

  private startCooldown(duration: number): void {
    this.cooldownStartTime = Date.now();
    this.isInCooldownState = true;
  }

  private resetDailyIfNeeded(): void {
    const now = Date.now();
    const dayMs = 24 * 60 * 60 * 1000;
    
    if (now - this.lastEvolutionTime > dayMs) {
      this.dailyEvolutionCount = 0;
    }
  }

  private countConsecutiveNoImprovement(): number {
    let count = 0;
    for (let i = this.recentImprovements.length - 1; i >= 0; i--) {
      if (this.recentImprovements[i] < this.convergence.improvementThreshold) {
        count++;
      } else {
        break;
      }
    }
    return count;
  }
}

export function createBudgetController(
  budget?: Partial<EvolutionBudget>,
  convergence?: Partial<ConvergenceConfig>
): BudgetController {
  return new BudgetController(budget, convergence);
}
