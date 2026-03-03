# JClaw Usage Guide

Installation, configuration, and practical usage examples.

## Table of Contents

- [Installation](#installation)
- [Quick Start](#quick-start)
- [Configuration](#configuration)
- [Basic Usage](#basic-usage)
- [Advanced Usage](#advanced-usage)
- [CLI Reference](#cli-reference)

- [Troubleshooting](#troubleshooting)

---

## Installation

### Prerequisites

- Node.js >= 20.0.0
- npm >= 10.0.0
- OpenAI API key (or compatible LLM)

### Install Core Package

```bash
# Install JClaw core
npm install @jclaw/core

# For TypeScript support
npm install -D typescript @types/node
```

### Install with Extensions

```bash
# Core + OpenCode extension (for coding)
npm install @jclaw/core @jclaw/extension-opencode

# Core + NanoClaw extension (for WhatsApp)
npm install @jclaw/core @jclaw/extension-nanoclaw

# Full installation
npm install @jclaw/core @jclaw/extension-opencode @jclaw/extension-nanoclaw
```

---

## Quick Start

### Minimal Setup (30 seconds)

```typescript
import { createAgent, createSimpleMemoryClient } from '@jclaw/core';

const agent = createAgent({
  name: 'my-agent',
  llm: {
    apiBase: 'https://api.openai.com/v1',
    apiKey: process.env.OPENAI_API_KEY!,
    model: 'gpt-4',
  },
});

await agent.start();

const result = await agent.execute({
  id: 'task-1',
  prompt: 'Hello, JClaw!',
});

console.log(result.output);
await agent.stop();
```

### With Memory System

```typescript
import { createAgent, createSimpleMemoryClient } from '@jclaw/core';

const agent = createAgent({
  llm: {
    apiBase: 'https://api.openai.com/v1',
    apiKey: process.env.OPENAI_API_KEY!,
    model: 'gpt-4',
  },
  contextManager: createSimpleMemoryClient({
    memoryPath: './data/memory',
    enableSynonyms: true,
    enableFuzzyMatch: true,
  }),
});

await agent.start();

// The memory is saved automatically after successful tasks
const result = await agent.execute({
  id: 'task-1',
  prompt: 'Remember: I prefer TypeScript over JavaScript',
});

console.log(result.output);
await agent.stop();
```

### With Self-Evolution (AutoSkill)

```typescript
import { createAgent, createSimpleMemoryClient } from '@jclaw/core';

const agent = createAgent({
  enableAutoSkill: true,
  llm: {
    apiBase: 'https://api.openai.com/v1',
    apiKey: process.env.OPENAI_API_KEY!,
    model: 'gpt-4',
  },
  contextManager: createSimpleMemoryClient(),
  autoSkillConfig: {
    maxGenerationAttempts: 3,
    qualityThreshold: 0.7,
  },
});

await agent.start();

// AutoSkill will discover missing capabilities and generate skills
const result = await agent.execute({
  id: 'task-1',
  prompt: 'Send an HTTP request to https://api.example.com/data',
});

console.log(result.output);
await agent.stop();
```

---

## Configuration

### Environment Variables

```bash
# Required
export OPENAI_API_KEY=sk-your-api-key

# Optional
export JCLAW_LLM_BASE=https://api.openai.com/v1
export JCLAW_MODEL=gpt-4
```

### Configuration File (jclaw.yaml)

```yaml
agent:
  name: 'jclaw-agent'
  version: '0.1.0'

execution:
  mode: 'local'
  local:
    restrictions:
      allowed_paths:
        - './projects'
        - './data'
      blocked_commands:
        - 'rm -rf /'
      timeout_seconds: 300

llm:
  api_base: 'https://api.openai.com/v1'
  model: 'gpt-4'

memory:
  provider: 'simple'
  path: './data/memory'
  enable_synonyms: true
  enable_fuzzy_match: true

autoskill:
  enabled: true
  max_attempts: 3
  quality_threshold: 0.7
```

### Programmatic Configuration

```typescript
import {
  JClawAgent,
  createSimpleMemoryClient,
  type AgentConfig,
} from '@jclaw/core';

const config: AgentConfig = {
  name: 'my-agent',
  executionMode: 'local',
  llm: {
    apiBase: process.env.OPENAI_LLM_BASE || 'https://api.openai.com/v1',
    apiKey: process.env.OPENAI_API_KEY!,
    model: process.env.JCLAW_MODEL || 'gpt-4',
  },
  contextManager: createSimpleMemoryClient({
    memoryPath: './data/memory',
    enableSynonyms: true,
    enableFuzzyMatch: true,
  }),
  enableAutoSkill: true,
  verbose: process.env.NODE_ENV === 'development',
};

const agent = new JClawAgent(config);
```

---

## Basic Usage

### Execute a Simple Task

```typescript
const result = await agent.execute({
  id: 'task-' + Date.now(),
  prompt: 'Analyze the project structure and suggest improvements',
});

if (result.success) {
  console.log('Output:', result.output);
} else {
  console.error('Error:', result.error);
}
```

### Add Context to Tasks

```typescript
const result = await agent.execute({
  id: 'task-with-context',
  prompt: 'Refactor the function',
  context: {
    file: './src/utils.ts',
    function: 'formatDate',
    requirements: ['Add input validation', 'Improve performance'],
  },
});
```

### Query Memory

```typescript
if (agent.context.isConnected()) {
  const memories = await agent.context.query('previous decisions', { topK: 5 });
  console.log('Relevant memories:', memories);
}
```

### Save to Memory

```typescript
await agent.context.saveMemory(
  'Learned: Use composition pattern for React components',
  'React Best Practice'
);
```

---

## Advanced Usage

### With OpenCode Extension

```typescript
import { createAgent } from '@jclaw/core';
import { opencodeExtension } from '@jclaw/extension-opencode';
import { ExtensionRegistry } from '@jclaw/core';

const registry = new ExtensionRegistry();
await registry.register(opencodeExtension);

const agent = createAgent({
  llm: {
    /* ... */
  },
  extensionRegistry: registry,
});

await agent.start();

// Now you can use LSP-powered coding capabilities
const result = await agent.execute({
  id: 'refactor-task',
  prompt: 'Refactor UserService to use dependency injection',
});
```

### With NanoClaw Extension

```typescript
import { createAgent } from '@jclaw/core';
import { nanoclawExtension } from '@jclaw/extension-nanoclaw';
import { ExtensionRegistry } from '@jclaw/core';

const registry = new ExtensionRegistry();
await registry.register(nanoclawExtension);

const agent = createAgent({
  llm: {
    /* ... */
  },
  extensionRegistry: registry,
});

await agent.start();

// Agent can now receive WhatsApp messages and respond
```

### Custom Execution Modes

```typescript
// Local mode (default)
const agent = createAgent({
  executionMode: 'local',
  // ... other config
});

// Docker mode (requires Docker)
const agent = createAgent({
  executionMode: 'docker',
  // ... other config
});

// Hybrid mode (switch per task)
const agent = createAgent({
  executionMode: 'hybrid',
  // ... other config
});

// Override mode per task
const result = await agent.execute({
  id: 'untrusted-task',
  prompt: 'Run untrusted code',
  executionMode: 'docker', // Use Docker for this task
});
```

### Using Memory Layers

```typescript
const memory = createSimpleMemoryClient({
  memoryPath: './data/memory',
});

await memory.connect();

// Check layer distribution
const stats = memory.getStats();
console.log(`L0: ${stats.L0}, L1: ${stats.L1}, L2: ${stats.L2}`);

// Compact old memories
await memory.compact();
```

---

## CLI Reference

### Installation

```bash
npm install -g @jclaw/core
```

### Commands

```bash
# Execute a task
jclaw exec "Your task description here"

# Use specific model
jclaw exec --model gpt-4 "Your task"

# With context file
jclaw exec --context ./project "Analyze the project"

# Verbose output
jclaw exec --verbose "Debug the issue"
```

### Options

| Option      | Description             | Default      |
| ----------- | ----------------------- | ------------ |
| `--model`   | LLM model to use        | gpt-4        |
| `--context` | Project context path    | ./           |
| `--verbose` | Enable verbose logging  | false        |
| `--config`  | Configuration file path | ./jclaw.yaml |

---

## Troubleshooting

### Common Issues

#### "Agent not started"

``typescript
// Solution: Call start() first
await agent.start();
const result = await agent.execute(task);

````
#### "LLM configuration is required"
```typescript
// Solution: Provide LLM config
const agent = createAgent({
  llm: {
    apiBase: 'https://api.openai.com/v1',
    apiKey: process.env.OPENAI_API_KEY,
    model: 'gpt-4'
  }
});
````

#### "Context manager not configured"

```typescript
// Solution: Provide context manager
import { createSimpleMemoryClient } from '@jclaw/core';

const agent = createAgent({
  contextManager: createSimpleMemoryClient(),
});
```

#### "Task failed after max attempts"

```typescript
// Solution: Increase max attempts or improve task clarity
const agent = createAgent({
  enableAutoSkill: true,
  autoSkillConfig: {
    maxGenerationAttempts: 5,
  },
});
```

### Debug Mode

Enable verbose logging for debugging:

```typescript
const agent = createAgent({
  verbose: true,
});
```

Or with environment variable:

```bash
NODE_ENV=development jclaw exec "task"
```
