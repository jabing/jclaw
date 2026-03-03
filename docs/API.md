# JClaw API Reference

Complete API documentation for JClaw core and extensions.

## Table of Contents

- [Core API (@jclaw/core)](#core-api-jclawcore)
  - [JClawAgent](#jclawagent)
  - [Task and TaskResult](#task-and-taskresult)
  - [SimpleMemoryClient](#simplememoryclient)
  - [EvolutionEngine](#evolutionengine)
  - [AutoSkillGenerator](#autoskillgenerator)
  - [Executor](#executor)
- [Extension API](#extension-api)
  - [OpenCode Extension](#opencode-extension)
  - [NanoClaw Extension](#nanoclaw-extension)
- [Configuration](#configuration)

---

## Core API (@jclaw/core)

### JClawAgent

The main agent class that orchestrates task execution, memory management, and self-evolution.

```typescript
import { JClawAgent, createAgent } from '@jclaw/core';

// Create agent with factory function
const agent = createAgent(config);

// Or use class directly
const agent = new JClawAgent(config);
```

#### AgentConfig

```typescript
interface AgentConfig {
  // Agent identity
  name?: string; // Default: 'jclaw-agent'
  version?: string; // Default: '0.1.0'

  // Execution settings
  executionMode?: 'local' | 'docker' | 'hybrid'; // Default: 'local'

  // LLM configuration (required)
  llm?: LLMClientConfig;

  // Memory system
  contextManager?: ContextManager;

  // Behavior settings
  systemPrompt?: string; // Default: 'You are JClaw...'
  verbose?: boolean; // Default: false

  // Self-evolution
  enableAutoSkill?: boolean; // Default: false
  enablePlanning?: boolean; // Default: true
  autoSkillConfig?: Partial<AutoSkillConfig>;
  skillShConfig?: Partial<SkillShAdapterConfig>;

  // Extensions
  extensionRegistry?: ExtensionRegistry;
}
```

#### Methods

```typescript
// Lifecycle
await agent.start(): Promise<void>
await agent.stop(): Promise<void>
agent.isRunning(): boolean

// Task execution
await agent.execute(task: Task): Promise<TaskResult>

// Properties
agent.name: string
agent.version: string
agent.context: ContextManager
agent.executionMode: 'local' | 'docker' | 'hybrid'
```

#### Example

```typescript
import { JClawAgent, createSimpleMemoryClient } from '@jclaw/core';

const agent = new JClawAgent({
  name: 'my-agent',
  enableAutoSkill: true,
  llm: {
    apiBase: 'https://api.openai.com/v1',
    apiKey: process.env.OPENAI_API_KEY,
    model: 'gpt-4',
  },
  contextManager: createSimpleMemoryClient({
    enableSynonyms: true,
    enableFuzzyMatch: true,
  }),
});

await agent.start();

const result = await agent.execute({
  id: 'task-1',
  prompt: 'Analyze the project structure',
});

console.log(result.success ? result.output : result.error);

await agent.stop();
```

---

### Task and TaskResult

#### Task

```typescript
interface Task {
  id: string; // Unique task identifier
  prompt: string; // Task instruction
  context?: Record<string, unknown>; // Additional context
  executionMode?: 'local' | 'docker'; // Override execution mode
}
```

#### TaskResult

```typescript
interface TaskResult {
  taskId: string; // ID of executed task
  success: boolean; // Completion status
  output?: string; // Result output (if successful)
  error?: string; // Error message (if failed)
  duration: number; // Execution time in ms
}
```

---

### SimpleMemoryClient

Lightweight, zero-dependency memory system with enhanced search capabilities.

```typescript
import {
  SimpleMemoryClient,
  createSimpleMemoryClient,
  type SimpleMemoryConfig,
} from '@jclaw/core';
```

#### SimpleMemoryConfig

```typescript
interface SimpleMemoryConfig {
  memoryPath?: string; // Storage path (default: './.jclaw/memory')
  verbose?: boolean; // Enable logging
  enableSynonyms?: boolean; // Enable synonym search (default: true)
  enableFuzzyMatch?: boolean; // Enable fuzzy matching (default: true)
  fuzzyThreshold?: number; // Similarity threshold (default: 0.7)
}
```

#### Methods

```typescript
// Lifecycle
await memory.connect(): Promise<void>
await memory.disconnect(): Promise<void>
memory.isConnected(): boolean

// Memory operations
await memory.saveMemory(content: string, title?: string): Promise<void>
await memory.addResource(resourcePath: string): Promise<string>
await memory.query(question: string, options?: { topK?: number }): Promise<string>

// Statistics
memory.getStats(): { total: number; L0: number; L1: number; L2: number }
await memory.compact(): Promise<void>
```

#### Example

```typescript
const memory = createSimpleMemoryClient({
  memoryPath: './data/memory',
  enableSynonyms: true,
  enableFuzzyMatch: true,
  fuzzyThreshold: 0.7,
});

await memory.connect();

// Save memory
await memory.saveMemory(
  'TypeScript best practices include strict mode',
  'TypeScript Guide'
);

// Query with synonym support
const result = await memory.query('ts practices'); // Finds "TypeScript"

// Check stats
console.log(memory.getStats());
// { total: 1, L0: 1, L1: 0, L2: 0 }

await memory.disconnect();
```

---

### EvolutionEngine

Manages code mutations and fitness evaluation for self-evolution.

```typescript
import {
  EvolutionEngine,
  createEvolutionEngine,
  type EvolutionConfig,
} from '@jclaw/core';
```

#### EvolutionConfig

```typescript
interface EvolutionConfig {
  maxMutations?: number; // Max mutations per cycle (default: 10)
  minFitness?: number; // Minimum fitness threshold (default: 0.5)
  strategy?: EvolutionStrategy; // Evolution strategy
}

type EvolutionStrategy = 'random' | 'guided' | 'hybrid';
```

#### Methods

```typescript
await engine.evolve(code: string, context: EvolutionContext): Promise<EvolutionResult>
await engine.validate(mutation: Mutation): Promise<ValidationResult>
engine.getFitness(code: string): number
```

---

### AutoSkillGenerator

Generates and installs skills automatically based on capability gaps.

```typescript
import {
  AutoSkillGenerator,
  createAutoSkillGenerator,
  type AutoSkillConfig,
} from '@jclaw/core';
```

#### AutoSkillConfig

```typescript
interface AutoSkillConfig {
  storageDir?: string; // Skill storage directory
  templatesDir?: string; // Code templates directory
  maxGenerationAttempts?: number; // Max generation retries (default: 3)
  enableEvolution?: boolean; // Use EvolutionEngine (default: true)
  qualityThreshold?: number; // Min quality score (default: 0.7)
}
```

#### Methods

```typescript
await generator.discoverCapabilities(task: Task): Promise<CapabilityGap[]>
await generator.generateExtension(gap: CapabilityGap): Promise<GenerationResult>
await generator.optimizeCode(code: string, gap: CapabilityGap): Promise<string>
await generator.validateCode(code: string): Promise<{ valid: boolean; score: number }>
```

---

### Executor

Command execution with support for local and Docker modes.

```typescript
import { LocalExecutor, createLocalExecutor } from '@jclaw/core';
```

#### ExecuteOptions

```typescript
interface ExecuteOptions {
  mode?: 'local' | 'docker';
  timeout?: number; // Timeout in milliseconds
  cwd?: string; // Working directory
  env?: Record<string, string>; // Environment variables

  // Local mode restrictions
  restrictions?: {
    allowedPaths?: string[];
    blockedCommands?: string[];
  };

  // Docker mode configuration
  container?: {
    image?: string;
    memory?: string;
    cpu?: string;
  };
}
```

#### Methods

```typescript
await executor.execute(command: string, options?: ExecuteOptions): Promise<ExecuteResult>
executor.mode: 'local' | 'docker' | 'hybrid'
```

#### Example

```typescript
const executor = createLocalExecutor();

const result = await executor.execute('npm test', {
  cwd: './my-project',
  timeout: 60000,
  restrictions: {
    allowedPaths: ['./my-project'],
    blockedCommands: ['rm -rf'],
  },
});

console.log(result.stdout);
console.log('Exit code:', result.exitCode);
```

---

## Extension API

### OpenCode Extension

Professional coding capabilities with LSP support.

```typescript
import {
  opencodeExtension,
  OpenCodeAdapter,
  LSPBridge,
  handleCodeEdit,
  handleRefactor,
  handleAnalyze,
} from '@jclaw/extension-opencode';
```

#### Capabilities

| Capability  | Description                             |
| ----------- | --------------------------------------- |
| `code_edit` | Edit code with AI and LSP context       |
| `refactor`  | Refactor code (extract, inline, rename) |
| `analyze`   | Analyze code structure and patterns     |

#### OpenCodeAdapter

```typescript
const adapter = new OpenCodeAdapter();

// Execute coding commands
const result = await adapter.run('Explain this function');
const editResult = await adapter.run('Add error handling to this code');
```

#### LSPBridge

```typescript
const bridge = new LSPBridge({
  command: 'typescript-language-server',
  args: ['--stdio'],
  requestTimeout: 30000,
});

await bridge.initialize();

// Get LSP features
const definitions = await bridge.gotoDefinition(uri, position);
const references = await bridge.findReferences(uri, position);
const symbols = await bridge.getDocumentSymbols(uri);

await bridge.shutdown();
```

---

### NanoClaw Extension

WhatsApp messaging entry point for JClaw.

```typescript
import {
  nanoclawExtension,
  NanoClawAdapter,
  MessageRouter,
  TaskTrigger,
  createTaskTrigger,
} from '@jclaw/extension-nanoclaw';
```

#### Capabilities

| Capability        | Description                       |
| ----------------- | --------------------------------- |
| `message_receive` | Receive messages from WhatsApp    |
| `message_send`    | Send messages to WhatsApp         |
| `task_trigger`    | Trigger JClaw tasks from messages |

#### NanoClawAdapter

```typescript
const adapter = new NanoClawAdapter();

// Connect to WhatsApp
const result = await adapter.connect();
if (!result.success) {
  console.error('Connection failed:', result.error);
}

// Send message
await adapter.sendMessage({
  to: 'user@s.whatsapp.net',
  content: 'Hello from JClaw!',
});

// Listen for messages
adapter.on('message', (message) => {
  console.log('Received:', message.content);
});

await adapter.stop();
```

#### MessageRouter

```typescript
const router = new MessageRouter();

// Add routing rules
router.addRule({
  pattern: '@jclaw', // String pattern
  handler: async (message) => {
    console.log('JClaw command:', message.content);
  },
  priority: 100,
});

router.addRule({
  pattern: /\d+/, // Regex pattern
  handler: async (message) => {
    console.log('Contains number');
  },
});

// Route messages
await router.route(incomingMessage);
```

#### TaskTrigger

```typescript
const trigger = createTaskTrigger(runtime, {
  commandPrefix: '@jclaw',
  requirePrefix: true,
  defaultTimeout: 60000,
});

const result = await trigger.executeTask(message);
if (result.triggered) {
  console.log('Task result:', result.result);
}
```

---

## Configuration

### LLMClientConfig

```typescript
interface LLMClientConfig {
  apiBase: string; // API endpoint URL
  apiKey: string; // API key
  model: string; // Model identifier
  temperature?: number; // Sampling temperature (0-1)
  maxTokens?: number; // Max response tokens
  timeout?: number; // Request timeout in ms
}
```

### SkillShAdapterConfig

```typescript
interface SkillShAdapterConfig {
  apiBase?: string; // API endpoint (default: skill.sh)
  enableCache?: boolean; // Enable caching (default: true)
  cacheTtl?: number; // Cache TTL in ms (default: 24h)
  timeout?: number; // Request timeout in ms
}
```

---

## Error Handling

All async methods may throw errors. Use try-catch for robust handling:

```typescript
try {
  const result = await agent.execute(task);
  if (!result.success) {
    console.error('Task failed:', result.error);
  }
} catch (error) {
  console.error('Execution error:', error);
}
```

Common error types:

- `Error: Agent not started. Call start() first.`
- `Error: LLM configuration is required`
- `Error: Client not initialized`

---

## Type Exports

All types are exported from `@jclaw/core`:

```typescript
export type {
  Task,
  TaskResult,
  ExecuteOptions,
  ExecuteResult,
  Executor,
  ContextManager,
  Capability,
  Extension,
  AgentRuntime,
} from '@jclaw/core';
```
