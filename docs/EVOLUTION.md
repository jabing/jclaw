# Evolution System

> Self-evolving architecture for jclaw - enabling continuous improvement through controlled mutation and selection.

## Overview

The jclaw evolution system implements a **Layered Meta-Evolution Architecture** that allows the system to improve itself over time while maintaining safety and stability.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    L2+ Capability Layer                      │
│         (User skills, extensions, application logic)         │
│                      ↓ CAN EVOLVE ↓                          │
├─────────────────────────────────────────────────────────────┤
│                    L1 Meta-Evolver Layer                     │
│     (EvolutionEngine, FitnessEvaluator, MutationOperators)   │
│                      ↓ CAN EVOLVE ↓                          │
├─────────────────────────────────────────────────────────────┤
│                    L0 Fixed Kernel Layer                     │
│    (SandboxIsolator, EmergencyBrake, RollbackManager)        │
│                      ↓ CANNOT EVOLVE ↓                       │
└─────────────────────────────────────────────────────────────┘
```

### Layer 0: Fixed Kernel (Immutable)

The fixed kernel provides safety guarantees and cannot be evolved:

- **SandboxIsolator**: Isolates code execution to prevent harmful mutations
- **EmergencyBrake**: Triggers when error rate exceeds 30%, halting evolution
- **RollbackManager**: Manages state snapshots for safe rollback

### Layer 1: Meta-Evolver

The meta-evolver manages the evolution process using the OOPS pattern:

```
Observe → Orient → Predict → Select → Act
```

### Layer 2+: Capability Layer

User-facing capabilities that can be evolved to improve performance.

## Evolution Triggers

Evolution is triggered by specific conditions, not continuously:

### 1. Failure Trigger

```typescript
// Triggered when failures exceed threshold
{
  type: 'failure',
  threshold: 3,      // 3 consecutive failures
  cooldown: 300000,  // 5 minute cooldown
  enabled: true
}
```

### 2. Degradation Trigger

```typescript
// Triggered on performance degradation
{
  type: 'degradation',
  threshold: 20,     // 20% performance drop
  cooldown: 600000,  // 10 minute cooldown
  enabled: true
}
```

### 3. Periodic Trigger

```typescript
// Triggered on schedule (disabled by default)
{
  type: 'periodic',
  interval: 3600000, // Every hour
  enabled: false
}
```

## Budget Controls

Prevent over-evolution with budget controls:

```typescript
const budget: EvolutionBudget = {
  dailyQuota: 100, // Max 100 evolutions per day
  cooldownPeriod: 60000, // 1 minute between evolutions
  maxMutationsPerCycle: 10, // Max 10 mutations per cycle
  convergence: {
    improvementThreshold: 0.01, // 1% improvement required
    patienceCycles: 5, // Wait 5 cycles before convergence
  },
};
```

## Convergence Detection

Evolution stops when improvements plateau:

```typescript
const convergence: ConvergenceConfig = {
  improvementThreshold: 0.01, // Minimum improvement to continue
  patienceCycles: 5, // Cycles below threshold before stop
  minImprovementDelta: 0.005, // Reset patience if improvement > delta
  useRollingAverage: true, // Use rolling average for smoothing
  rollingWindowSize: 10, // Window size for rolling average
};
```

## Usage

### Basic Setup

```typescript
import {
  EvolutionTriggerEngine,
  BudgetController,
} from '@jclaw/core/evolution';

const triggerEngine = new EvolutionTriggerEngine([
  { type: 'failure', threshold: 3, enabled: true },
  { type: 'degradation', threshold: 20, enabled: true },
]);

const budgetController = new BudgetController({
  dailyQuota: 100,
  cooldownPeriod: 60000,
});
```

### Recording Results

```typescript
// Record task result (triggers failure detection)
triggerEngine.recordResult(success);

// Record performance metric (triggers degradation detection)
triggerEngine.recordPerformance(85);
```

### Checking Triggers

```typescript
// Check if failure trigger activated
const failureResult = triggerEngine.checkFailureTrigger();
if (failureResult.shouldTrigger) {
  console.log(`Evolution triggered: ${failureResult.reason}`);
}

// Check if performance degradation trigger activated
const degradationResult =
  triggerEngine.checkDegradationTrigger(currentPerformance);
if (degradationResult.shouldTrigger) {
  console.log(`Performance drop detected: ${degradationResult.reason}`);
}
```

### Evolution Budget

```typescript
// Check if evolution is allowed
if (budgetController.checkQuota() && !budgetController.isInCooldown()) {
  // Execute evolution
  const improvement = await executeEvolution();

  // Record the evolution
  budgetController.recordEvolution(true, improvement);

  // Check for convergence
  if (budgetController.checkConvergence()) {
    console.log('Evolution converged - improvements plateaued');
  }
}
```

## Safety Mechanisms

### Emergency Brake

The emergency brake halts evolution when error rate exceeds 30%:

```typescript
import { EmergencyBrake } from '@jclaw/core/evolution/kernel';

const brake = new EmergencyBrake({
  errorRateThreshold: 0.3,
  windowSize: 100,
});

// Check before evolving
if (brake.shouldActivate(totalOperations, errorCount)) {
  console.log('Emergency brake activated - halting evolution');
  return;
}
```

### Rollback Manager

Maintains snapshots for safe rollback:

```typescript
import { RollbackManager } from '@jclaw/core/evolution/kernel';

const rollbackManager = new RollbackManager();

// Create snapshot before evolution
const snapshotId = await rollbackManager.createSnapshot('before-evolution');

// If evolution fails, rollback
if (!evolutionSuccess) {
  await rollbackManager.rollback(snapshotId);
}
```

## Philosophy

> **Evolution is a means, not an end.** The system should evolve as little as possible, only when necessary.

Key principles:

1. **Trigger-based evolution** - Not continuous loops
2. **Convergence-based stopping** - Stop when improvements plateau
3. **Budget controls** - Prevent resource exhaustion
4. **Safety first** - Fixed kernel cannot be evolved
5. **Rollback capability** - Always able to revert changes

## API Reference

### EvolutionTriggerEngine

| Method                                     | Description                  |
| ------------------------------------------ | ---------------------------- |
| `recordResult(success: boolean)`           | Record task success/failure  |
| `recordPerformance(value: number)`         | Record performance metric    |
| `checkFailureTrigger()`                    | Check failure trigger status |
| `checkDegradationTrigger(current: number)` | Check degradation trigger    |

### BudgetController

| Method                                  | Description                    |
| --------------------------------------- | ------------------------------ |
| `checkQuota()`                          | Check if daily quota available |
| `isInCooldown()`                        | Check if in cooldown period    |
| `recordEvolution(success, improvement)` | Record evolution result        |
| `checkConvergence()`                    | Check if converged             |
| `getStatus()`                           | Get current budget status      |

## See Also

- [Execution Modes](./EXECUTION_MODES.md) - Task execution strategies
- [A2A Protocol](./A2A_PROTOCOL.md) - Agent-to-agent communication
