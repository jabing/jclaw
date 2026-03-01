# Execution Modes

> Dynamic task execution strategies for jclaw - selecting the right approach based on task complexity.

## Overview

jclaw supports multiple execution modes, automatically selecting the most appropriate strategy based on task complexity:

| Complexity | Score     | Mode  | Description                           |
| ---------- | --------- | ----- | ------------------------------------- |
| Simple     | < 0.3     | ReAct | Fast, direct execution                |
| Medium     | 0.3 - 0.7 | OODA  | Context-aware decision making         |
| Complex    | > 0.7     | OOPS  | Multi-option prediction and selection |

## Mode Details

### ReAct (Reason + Act)

Best for simple, straightforward tasks.

```
Thought → Action → Observation → Thought → ...
```

**When to use:**

- Single-step operations
- Low-risk changes
- Clear, unambiguous prompts

**Example:**

```typescript
// Complexity score: 0.15
const result = await executor.execute({
  prompt: 'fix typo in readme.md',
});
// Uses ReAct mode automatically
```

### OODA (Observe-Orient-Decide-Act)

Best for medium-complexity tasks requiring context awareness.

```
Observe → Orient → Decide → Act
   ↑                              │
   └──────────────────────────────┘
```

**When to use:**

- Multi-step operations
- Requires context retrieval
- Moderate risk

**Example:**

```typescript
// Complexity score: 0.55
const result = await executor.execute({
  prompt: 'Add authentication middleware to protect API endpoints',
});
// Uses OODA mode automatically
```

**OODA Steps:**

1. **Observe**: Gather context and relevant information
2. **Orient**: Analyze the situation and identify options
3. **Decide**: Choose the best approach
4. **Act**: Execute the decision

### OOPS (Observe-Orient-Predict-Select)

Best for complex, high-risk tasks.

```
Observe → Orient → Predict → Select → Act
   ↑                                     │
   └─────────────────────────────────────┘
```

**When to use:**

- High-risk operations
- Multiple possible approaches
- Requires prediction of outcomes

**Example:**

```typescript
// Complexity score: 0.85
const result = await executor.execute({
  prompt:
    'Refactor production authentication system, migrate all users to OAuth2',
});
// Uses OOPS mode automatically
```

**OOPS Steps:**

1. **Observe**: Gather comprehensive context
2. **Orient**: Analyze constraints and requirements
3. **Predict**: Generate multiple solution options with predicted outcomes
4. **Select**: Choose the best option based on predictions
5. **Act**: Execute the selected approach

## Complexity Assessment

### Factors Evaluated

```typescript
interface ComplexityFactors {
  descriptionLength: number; // 0-1 based on prompt length
  fileCount: number; // 0-1 based on affected files
  hasRiskKeywords: boolean; // True if risky words present
  hasMultiSteps: boolean; // True if multi-step indicators
  historicalFailureRate: number; // 0-1 based on past failures
}
```

### Risk Keywords

These keywords increase complexity score:

```
delete, remove, drop, truncate, destroy
production, live, critical, 紧急, 重要
重构, refactor, migrate, migration
安全, security, 密码, password, secret
备份, backup, restore, 恢复
```

### Multi-Step Indicators

These patterns indicate multi-step tasks:

```
然后, 之后, 接着, 最后, 并且
then, after, next, finally, also
第一步, 第二步, step 1, step 2
first, second, third
```

## Usage

### Basic Usage

```typescript
import { ComplexityAssessor } from '@jclaw/core/runtime';

const assessor = new ComplexityAssessor();

// Assess task complexity
const result = assessor.assess('Your task prompt here');

console.log(`Score: ${result.score}`);
console.log(`Level: ${result.level}`);
console.log(`Recommended Mode: ${result.recommendedMode}`);
```

### With Context

```typescript
const result = assessor.assess('Refactor the API', {
  files: ['api.ts', 'auth.ts', 'middleware.ts'],
  riskLevel: 'high',
});
```

### Recording Results

Improve future assessments by recording task results:

```typescript
// After task execution
assessor.recordResult('fix authentication bug', success);

// Future similar tasks will have adjusted complexity
const futureResult = assessor.assess('fix auth issue');
// higher failure rate → higher complexity score
```

## Mode Selection Logic

```typescript
function selectMode(score: number): ExecutionMode {
  if (score < 0.3) {
    return 'react'; // Simple tasks
  } else if (score < 0.7) {
    return 'ooda'; // Medium tasks
  } else {
    return 'oops'; // Complex tasks
  }
}
```

## Executors

### OODAExecutor

```typescript
import { OODAExecutor } from '@jclaw/core/runtime/modes';

const executor = new OODAExecutor({
  contextManager: memoryClient,
  llm: llmClient,
});

const result = await executor.execute({
  prompt: 'Add rate limiting to the API',
  context: { files: ['api.ts'] },
});
```

### OOPSExecutor

```typescript
import { OOPSExecutor } from '@jclaw/core/runtime/modes';

const executor = new OOPSExecutor({
  contextManager: memoryClient,
  llm: llmClient,
  maxOptions: 3, // Generate 3 options to choose from
});

const result = await executor.execute({
  prompt: 'Migrate authentication to OAuth2',
  context: { riskLevel: 'high' },
});
```

## Performance Comparison

| Mode  | Avg Latency | Context Usage | Best For          |
| ----- | ----------- | ------------- | ----------------- |
| ReAct | ~100ms      | None          | Simple fixes      |
| OODA  | ~500ms      | Moderate      | Feature additions |
| OOPS  | ~2000ms     | Extensive     | Major refactors   |

## Best Practices

1. **Let the system decide** - Trust the complexity assessment
2. **Record results** - Improve future assessments with feedback
3. **Add context** - Provide file lists and metadata for better assessment
4. **Monitor mode usage** - Track which modes are used most frequently

## API Reference

### ComplexityAssessor

| Method                          | Description                     |
| ------------------------------- | ------------------------------- |
| `assess(prompt, context?)`      | Assess task complexity          |
| `recordResult(prompt, success)` | Record task result for learning |

### ComplexityResult

| Field             | Type   | Description                       |
| ----------------- | ------ | --------------------------------- |
| `score`           | number | Complexity score (0-1)            |
| `level`           | string | 'simple' \| 'medium' \| 'complex' |
| `factors`         | object | Individual factor scores          |
| `recommendedMode` | string | 'react' \| 'ooda' \| 'oops'       |

## See Also

- [Evolution System](./EVOLUTION.md) - Self-evolution architecture
- [A2A Protocol](./A2A_PROTOCOL.md) - Agent-to-agent communication
