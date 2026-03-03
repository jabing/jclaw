# JClaw Examples

Practical code examples and integration patterns, and common use cases.

## Table of Contents

- [Basic Examples](#basic-examples)
- [Memory System](#memory-system)
- [Self-Evolution](#self-evolution)
- [Extensions](#extensions)
- [Advanced Patterns](#advanced-patterns)
- [Error Handling](#error-handling)
- [Testing](#testing)

---

## Basic Examples

### Hello World

```typescript
import { createAgent, createSimpleMemoryClient } from '@jclaw/core';

async function main() {
  const agent = createAgent({
    llm: {
      apiBase: 'https://api.openai.com/v1',
      apiKey: process.env.OPENAI_API_KEY!,
      model: 'gpt-4',
    },
  });

  await agent.start();

  const result = await agent.execute({
    id: 'hello',
    prompt: 'Say hello and introduce yourself',
  });

  console.log(result.output);
  await agent.stop();
}

main();
```

### With Memory

```typescript
import { createAgent, createSimpleMemoryClient } from '@jclaw/core';

async function withMemory() {
  const memory = createSimpleMemoryClient({
    memoryPath: './data/memory',
    enableSynonyms: true,
    enableFuzzyMatch: true,
  });

  await memory.connect();

  const agent = createAgent({
    llm: {
      apiBase: 'https://api.openai.com/v1',
      apiKey: process.env.OPENAI_API_KEY!,
      model: 'gpt-4',
    },
    contextManager: memory,
    enableAutoSkill: true,
  });

  await agent.start();

  // First execution - saves to memory
  await agent.execute({
    id: 'task-1',
    prompt: 'Create a hello world function in TypeScript',
  });

  // Second execution - retrieves from memory
  const result = await agent.execute({
    id: 'task-2',
    prompt: 'Show me the hello world function we created earlier',
  });

  console.log(result.output); // Includes previous context

  await agent.stop();
}
```

### With Local Execution Restrictions

```typescript
import { createAgent, createLocalExecutor } from '@jclaw/core';

async function withRestrictions() {
  const executor = createLocalExecutor({
    restrictions: {
      allowedPaths: ['./src', './tests'],
      blockedCommands: ['rm -rf', 'npm publish'],
    },
  });

  const agent = createAgent({
    llm: {
      apiBase: 'https://api.openai.com/v1',
      apiKey: process.env.OPENAI_API_KEY!,
      model: 'gpt-4',
    },
    executionMode: 'local',
  });

  await agent.start();

  // Can only access allowed paths
  await agent.execute({
    id: 'safe-task',
    prompt: 'List files in ./src directory',
    context: {
      path: './src',
    },
  });

  await agent.stop();
}
```

---

## Memory System

### Save and Query

```typescript
import { createSimpleMemoryClient } from '@jclaw/core';

async function memoryExample() {
  const memory = createSimpleMemoryClient({
    memoryPath: './data/memory',
  });

  await memory.connect();

  // Save multiple memories
  await memory.saveMemory(
    'TypeScript best practices:\n1. Use strict mode\n2. Define types\n3. Document public APIs',
    'TypeScript Guide'
  );

  await memory.saveMemory(
    'React patterns:\n1. Functional components\n 2. Hooks\n 3. Context API',
    'React Guide'
  );

  // Query with different approaches
  const ts = await memory.query('typescript best practices');
  console.log('TypeScript memories:', ts);

  // Synonym search works too
  const react = await memory.query('react patterns');
  console.log('React memories:', react);

  // Fuzzy matching handles typos
  const result = await memory.query('typscript'); // Typo in "typescript"
  console.log('Fuzzy match:', result);

  // Check statistics
  const stats = memory.getStats();
  console.log('Memory stats:', stats);

  await memory.disconnect();
}
```

### Layer Management

```typescript
import { createSimpleMemoryClient } from '@jclaw/core';

async function layerExample() {
  const memory = createSimpleMemoryClient();
  await memory.connect();

  // Save many memories
  for (let i = 0; i < 100; i++) {
    await memory.saveMemory(`Memory item ${i}`, `Test ${i}`);
  }

  // Check initial distribution
  let stats = memory.getStats();
  console.log('Before compact:', stats);

  // Compact (promotes/demotes based on access)
  await memory.compact();

  // Check new distribution
  stats = memory.getStats();
  console.log('After compact:', stats);

  await memory.disconnect();
}
```

---

## Self-Evolution

### Basic AutoSkill

```typescript
import { createAgent, createSimpleMemoryClient } from '@jclaw/core';

async function autoSkillExample() {
  const agent = createAgent({
    llm: {
      apiBase: 'https://api.openai.com/v1',
      apiKey: process.env.OPENAI_API_KEY!,
      model: 'gpt-4',
    },
    enableAutoSkill: true,
    autoSkillConfig: {
      maxGenerationAttempts: 3,
      qualityThreshold: 0.7,
    },
  });

  await agent.start();

  // Execute task that may need a new skill
  const result = await agent.execute({
    id: 'http-task',
    prompt: 'Make an HTTP GET request to https://api.example.com/data',
  });

  // AutoSkill automatically:
  // 1. Detects missing capability
  // 2. Generates skill code
  // 3. Installs the skill
  // 4. Retries the task

  if (result.success) {
    console.log('Task succeeded with auto-generated skill!');
  }

  await agent.stop();
}
```

### With skill.sh Integration

```typescript
import { createAgent, createSimpleMemoryClient } from '@jclaw/core';

async function skillShExample() {
  const agent = createAgent({
    llm: {
      apiBase: 'https://api.openai.com/v1',
      apiKey: process.env.OPENAI_API_KEY!,
      model: 'gpt-4',
    },
    enableAutoSkill: true,
    skillShConfig: {
      apiBase: 'https://api.skills.sh/v1',
      enableCache: true,
      cacheTtl: 24 * 60 * 60 * 1000, // 24 hours
    },
  });

  await agent.start();

  // First tries skill.sh community
  // If not found, falls back to AutoSkill
  const result = await agent.execute({
    id: 'github-task',
    prompt: 'Create a GitHub issue with title "Bug Report"',
  });

  await agent.stop();
}
```

---

## Extensions

### OpenCode Extension

```typescript
import { createAgent, ExtensionRegistry } from '@jclaw/core';
import { opencodeExtension } from '@jclaw/extension-opencode';

async function openCodeExample() {
  const registry = new ExtensionRegistry();

  // Register OpenCode extension
  await registry.register(opencodeExtension);

  const agent = createAgent({
    llm: {
      apiBase: 'https://api.openai.com/v1',
      apiKey: process.env.OPENAI_API_KEY!,
      model: 'gpt-4',
    },
    extensionRegistry: registry,
  });

  await agent.start();

  // Use LSP-powered code editing
  const result = await agent.execute({
    id: 'refactor-task',
    prompt: 'Refactor the function to extract a reusable helper',
    context: {
      file: './src/utils.ts',
      code: 'function formatDate(date) { return date.toISOString(); }',
    },
  });

  await agent.stop();
}
```

### NanoClaw Extension

```typescript
import { createAgent, ExtensionRegistry } from '@jclaw/core';
import { nanoclawExtension, from '@jclaw/extension-nanoclaw';

async function nanoClawExample() {
  const registry = new ExtensionRegistry();

  // Register NanoClaw extension
  await registry.register(nanoclawExtension);

  const agent = createAgent({
    llm: {
      apiBase: 'https://api.openai.com/v1',
      apiKey: process.env.OPENAI_API_KEY!,
      model: 'gpt-4'
    },
    extensionRegistry: registry
  });

  await agent.start();

  // Agent can now receive tasks from WhatsApp
  // Messages starting with @jclaw will be processed

  await agent.stop();
}
```

### Custom Extension

```typescript
import {
  type Extension,
  type Capability,
  createAgent,
  ExtensionRegistry,
} from '@jclaw/core';

// Define custom extension
const myExtension: Extension = {
  name: 'my-custom-extension',
  version: '1.0.0',
  description: 'My custom extension for JClaw',

  capabilities: [
    {
      name: 'custom_action',
      description: 'Performs a custom action',
      handler: async (input) => {
        console.log('Custom action executed:', input);
        return { success: true };
      },
    },
  ],

  async install(runtime) {
    console.log('Extension installed');
  },

  async uninstall() {
    console.log('Extension uninstalled');
  },
};

async function customExtensionExample() {
  const registry = new ExtensionRegistry();

  // Register custom extension
  await registry.register(myExtension);

  const agent = createAgent({
    llm: {
      apiBase: 'https://api.openai.com/v1',
      apiKey: process.env.OPENAI_API_KEY!,
      model: 'gpt-4',
    },
    extensionRegistry: registry,
  });

  await agent.start();

  const result = await agent.execute({
    id: 'custom-task',
    prompt: 'Use the custom action to process data',
  });

  await agent.stop();
}
```

---

## Advanced Patterns

### Agent Pool

```typescript
import { createAgent } from '@jclaw/core';

class AgentPool {
  private agents = [];

  constructor(count: number, config: any) {
    for (let i = 0; i < count; i++) {
      this.agents.push(createAgent(config));
    }
  }

  async startAll() {
    await Promise.all(this.agents.map((a) => a.start()));
  }

  async stopAll() {
    await Promise.all(this.agents.map((a) => a.stop()));
  }

  async executeRoundRobin(task: any) {
    // Find available agent
    const agent = this.agents.find((a) => a.isRunning());
    if (!agent) throw new Error('No available agent');
    return agent.execute(task);
  }
}
```

### Task Queue

```typescript
import { createAgent } from '@jclaw/core';

class TaskQueue {
  private queue = [];
  private processing = false;

  constructor(private agent: any) {}

  enqueue(task: any) {
    this.queue.push(task);
    this.process();
  }

  private async process() {
    if (this.processing || this.queue.length === 0) return;

    this.processing = true;

    while (this.queue.length > 0) {
      const task = this.queue.shift()!;
      try {
        await this.agent.execute(task);
      } catch (error) {
        console.error('Task failed:', error);
      }
    }

    this.processing = false;
  }
}
```

### Event-Driven

```typescript
import { createAgent, createSimpleMemoryClient } from '@jclaw/core';
import { EventEmitter } from 'events';

class EventDrivenAgent extends EventEmitter {
  private agent;

  constructor(config: any) {
    super();
    this.agent = createAgent(config);
  }

  async start() {
    await this.agent.start();
    this.emit('started');
  }

  async execute(task: any) {
    this.emit('task:started', task);

    try {
      const result = await this.agent.execute(task);
      this.emit('task:completed', result);
      return result;
    } catch (error) {
      this.emit('task:failed', error);
      throw error;
    }
  }

  async stop() {
    await this.agent.stop();
    this.emit('stopped');
  }
}

// Usage
const eventAgent = new EventDrivenAgent(config);

eventAgent.on('task:completed', (result) => {
  console.log('Task completed:', result);
});

eventAgent.on('task:failed', (error) => {
  console.error('Task failed:', error);
});
```

---

## Error Handling

### Graceful Degradation

```typescript
import { createAgent } from '@jclaw/core';

async function robustExecution(task: any) {
  const agent = createAgent({
    llm: {
      /* config */
    },
  });

  try {
    await agent.start();

    const result = await agent.execute(task);

    if (!result.success) {
      // Task failed but agent handled it
      console.warn('Task failed:', result.error);
      return { fallback: true, error: result.error };
    }

    return result;
  } catch (error) {
    // Unexpected error
    console.error('Unexpected error:', error);
    return { fallback: true, error: error.message };
  } finally {
    try {
      await agent.stop();
    } catch (stopError) {
      console.warn('Failed to stop agent:', stopError);
    }
  }
}
```

### Retry Logic

```typescript
async function withRetry(task: any, maxRetries = 3) {
  let lastError;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const agent = createAgent(config);
      await agent.start();

      const result = await agent.execute(task);
      await agent.stop();

      if (result.success) {
        return result;
      }

      lastError = result.error;
      console.log(`Attempt ${attempt} failed, retrying...`);
    } catch (error) {
      lastError = error.message;
      console.log(`Attempt ${attempt} failed with error:`, error);
    }
  }

  throw new Error(
    `All ${maxRetries} attempts failed. Last error: ${lastError}`
  );
}
```

---

## Testing

### Unit Test Example

```typescript
import { createAgent, createSimpleMemoryClient } from '@jclaw/core';
import { MockClient } from '@jclaw/core';

describe('JClawAgent', () => {
  let agent;

  beforeEach(() => {
    agent = createAgent({
      llm: {
        apiBase: 'https://api.openai.com/v1',
        apiKey: 'test-key',
        model: 'gpt-4',
      },
      contextManager: new MockClient(),
    });
  });

  afterEach(async () => {
    if (agent.isRunning()) {
      await agent.stop();
    }
  });

  it('should start and stop successfully', async () => {
    await agent.start();
    expect(agent.isRunning()).toBe(true);

    await agent.stop();
    expect(agent.isRunning()).toBe(false);
  });

  it('should execute a task', async () => {
    await agent.start();

    const result = await agent.execute({
      id: 'test-1',
      prompt: 'Hello',
    });

    expect(result.taskId).toBe('test-1');
    expect(result).toHaveProperty('success');
  });
});
```

### Integration Test Example

```typescript
import { createAgent, createSimpleMemoryClient } from '@jclaw/core';

describe('Memory Integration', () => {
  it('should save and retrieve memories', async () => {
    const memory = createSimpleMemoryClient({
      memoryPath: './test-memory',
    });

    await memory.connect();

    const agent = createAgent({
      llm: {
        /* config */
      },
      contextManager: memory,
    });

    await agent.start();

    // First task saves to memory
    await agent.execute({
      id: 'task-1',
      prompt: 'Remember this: The answer is 42',
    });

    // Second task should have context
    const result = await agent.execute({
      id: 'task-2',
      prompt: 'What is the answer I told you about?',
    });

    expect(result.success).toBe(true);

    await agent.stop();
    await memory.disconnect();
  });
});
```
