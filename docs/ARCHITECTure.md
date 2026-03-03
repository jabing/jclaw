# JClaw Architecture

System architecture, design patterns, and technical specifications.

## Table of Contents

- [System Overview](#system-overview)
- [Architecture Diagram](#architecture-diagram)
- [Package Structure](#package-structure)
- [Core Components](#core-components)
- [Data Flow](#data-flow)
- [Extension System](#extension-system)
- [Design Decisions](#design-decisions)

- [Security Model](#security-model)

---

## System Overview

JClaw is a universal self-evolving agent framework built on three core principles:

1. **Core Independence** - Zero mandatory external dependencies
2. **Persistent Memory** - Hierarchical context management (L0/L1/L2)
3. **Self-Evolution** - Automatic capability discovery and skill generation

### Key Characteristics

| Feature           | Description                              |
| ----------------- | ---------------------------------------- |
| Zero Dependencies | Core runs with Node.js only              |
| Cross-Platform    | Windows, macOS, Linux                    |
| Self-Evolving     | AutoSkill discovers and generates skills |
| Extensible        | Plugin-based extension system            |
| Memory Management | SimpleMemory with synonym/fuzzy search   |

---

## Architecture Diagram

```
+-------------------------------------------------------------------+
|                        JClaw Architecture                        |
+-------------------------------------------------------------------+
|                                                                   |
|  +-------------------------+    +-----------------------------+  |
|  |    User Interface       |    |      Extensions Layer       |  |
|  +-------------------------+    +-----------------------------+  |
|            |                        |                     |              |
|            v                        v                     v              |
|  +-------------------------+    +-----------------------------+  |
|  |     JClawAgent (Core)    |    |   OpenCode | NanoClaw    |  |
|  +-------------------------+    +-----------------------------+  |
|            |                        |                     |              |
|            v                        v                     v              |
|  +-------------------------+    +-----------------------------+  |
|  |   Runtime Services      |    |      Extension API          |  |
|  |  +-----------------+    |    +------------------------+ |  |
|  |  | LLMClient       |    |    |  ExtensionRegistry   | |  |
|  |  | TaskExecutor    |    |    |  CapabilityRouter   | |  |
|  |  | Planner         |    |    +------------------------+ |  |
|  |  +-----------------+    +-----------------------------+  |
|            |                        |                                  |
|            v                        v                                  |
|  +-------------------------+    +-----------------------------+  |
|  |   Evolution Layer       |    |      Memory Layer             |  |
|  |  +-----------------+    |    +------------------------+ |  |
|  |  | EvolutionEngine  |    |    |  SimpleMemoryClient   | |  |
|  |  | AutoSkill      |    |    |  (L0/L1/L2 Layers)    | |  |
|  |  | SkillDiscovery  |    |    +------------------------+ |  |
|  |  +-----------------+    +-----------------------------+  |
|            |                        |                                  |
|            v                        v                                  |
|  +-------------------------+    +-----------------------------+  |
|  |   Execution Layer        |    |      External Services        |  |
|  |  +-----------------+    |    +------------------------+ |  |
|  |  | LocalExecutor   |    |    |  skill.sh API           | |  |
|  |  | (Docker - opt)   |    |    |  EvoMap Network         | |  |
|  |  +-----------------+    +-----------------------------+  |
|                                                                   |
+-------------------------------------------------------------------+
```

---

## Package Structure

```
jclaw/
+-- packages/
|   +-- core/                          # @jclaw/core
|   |   +-- src/
|   |   |   +-- runtime/           # Agent runtime, LLM client
|   |   |   +-- executor/         # Command execution
|   |   |   +-- context/          # Memory management
|   |   |   +-- evolution/        # Self-evolution engine
|   |   |   +-- auto-skill/        # Skill generation
|   |   |   +-- skill-sh/         # skill.sh integration
|   |   |   +-- extension-system/  # Extension loading
|   |   |   +-- planning/         # Task planning
|   |   |   +-- network/          # A2A protocol, EvoMap
|   |   +-- cli/              # Command line interface
|   |   +-- extensions/
|   |   +-- extension-opencode/  # @jclaw/extension-opencode
|   |   |   +-- src/
|   |   |   |   +-- handlers/      # Code edit, refactor, analyze
|   |   |   |   +-- lsp-bridge.ts   # LSP integration
|   |   |   |   +-- adapter.ts    # OpenCode adapter
|   |   +-- extension-nanoclaw/  # @jclaw/extension-nanoclaw
|   |   |   +-- src/
|   |   |   |   +-- adapter.ts    # WhatsApp adapter
|   |   |   |   +-- router.ts      # Message routing
|   |   |   |   +-- trigger.ts     # Task triggering
|   |   |   |   +-- formatter.ts  # Message formatting
```

---

## Core Components

### Runtime Layer

- **JClawAgent**: Main orchestrator
- **LLMClient**: OpenAI-compatible API client
- **TaskExecutor**: Task execution engine
- **Planner**: Task decomposition and planning

### Memory Layer

- **SimpleMemoryClient**: Zero-dependency memory system
- **L0/L1/L2 Layers**: Hierarchical storage
- **Synonym Search**: Cross-language matching
- **Fuzzy Matching**: Typo-tolerant queries

### Evolution Layer

- **EvolutionEngine**: Code mutation and validation
- **AutoSkillGenerator**: Skill code generation
- **SkillDiscoveryEngine**: skill.sh integration
- **AutoSkillInstaller**: Skill installation

### Execution Layer

- **LocalExecutor**: Direct command execution
- **DockerExecutor**: Containerized execution (optional)
- **HybridExecutor**: Mixed mode execution (optional)

---

## Data Flow

### Task Execution Flow

```
+-----------+     +-----------+     +-----------+     +-----------+
|   User    | --> |  JClaw   | --> |  Planner  | --> |   LLM    |
|  Request  |     |  Agent    |     |           |     |  Client   |
+-----------+     +-----------+     +-----------+     +-----------+
                                          |                   |
                                          v                   v
                                  +-----------+     +-----------+
                                  |   Memory  | <-- |  Context  |
                                  |   Query   |     |  Manager |
                                  +-----------+     +-----------+
                                          |
                                          v
                                  +-----------+     +-----------+
                                  |   Task    | --> | Executor  |
                                  | Executor  |     |           |
                                  +-----------+     +-----------+
                                          |
                                          v
                                  +-----------+     +-----------+
                                  |  Result   | --> |  Store    |
                                  |           |     | Experience|
                                  +-----------+     +-----------+
```

### Self-Evolution Flow

```
+-----------+     +-----------+     +-----------+
|   Task    | --> |  Detect   | --> |  Skill    |
|  Failure  |     |   Gap     |     |  Search   |
+-----------+     +-----------+     +-----------+
                                          |
                                          v
                                  +-----------+     +-----------+
                                  |  Found?   | --> |  Install  |
                                  |  Yes/No   |     |  Skill    |
                                  +-----------+     +-----------+
                                          | No
                                          v
                                  +-----------+     +-----------+
                                  | Generate  | --> |  Install  |
                                  |   Skill   |     |   Skill   |
                                  +-----------+     +-----------+
                                          |
                                          v
                                  +-----------+
                                  |   Retry   |
                                  |   Task    |
                                  +-----------+
```

---

## Extension System

### Extension Interface

```typescript
interface Extension {
  name: string; // Unique identifier
  version: string; // Semantic version
  description: string; // Human-readable description
  capabilities: Capability[]; // Provided capabilities
  dependencies?: string[]; // Required dependencies
  optionalDependencies?: string[]; // Optional dependencies

  install(runtime: AgentRuntime): Promise<void>;
  uninstall(): Promise<void>;
}
```

### Extension Registry

- **ExtensionRegistry**: Manages extension lifecycle
- **ExtensionLoader**: Loads extensions from packages
- **CapabilityRouter**: Routes requests to extensions

### Capability Routing

```
+-----------+     +-----------------+     +-----------+
|   User    | --> |  CapabilityRouter | --> | Extension |
|  Request  |     |                 |     |  Handler  |
+-----------+     +-----------------+     +-----------+
                          |
                          v
                  +-----------+
                  |  Execute  |
                  |  Handler  |
                  +-----------+
```

---

## Design Decisions

### Why SimpleMemory vs Vector DB?

| Aspect                 | SimpleMemory | Vector DB             |
| ---------------------- | ------------ | --------------------- |
| Dependencies           | Zero         | Many (pinecone, etc.) |
| Setup                  | None         | Complex               |
| Performance (1k items) | <50ms        | <10ms                 |
| Semantic Search        | No           | Yes                   |
| Cross-Platform         | Perfect      | Varies                |

**Decision**: SimpleMemory for simplicity, portability. Use external vector DB if semantic search is critical.

### Why AutoSkill vs Manual Skills?

| Aspect      | AutoSkill          | Manual Skills    |
| ----------- | ------------------ | ---------------- |
| Discovery   | Automatic          | Manual           |
| Quality     | Template-based     | Varies           |
| Speed       | Fast generation    | Slow development |
| Maintenance | Self-updating      | Manual updates   |
| Learning    | Improves over time | Static           |

**Decision**: AutoSkill for rapid capability acquisition. Manual skills for complex, unique requirements.

### Why Local Execution by Default?

| Aspect    | Local   | Docker                  |
| --------- | ------- | ----------------------- |
| Speed     | Fast    | Slow                    |
| Setup     | None    | Complex                 |
| Windows   | Perfect | Requires Docker Desktop |
| Isolation | None    | Complete                |

## **Decision**: Local execution for developer convenience. Docker for untrusted code execution.

## Security Model

### Execution Security

```typescript
// Local executor restrictions
restrictions: {
  allowedPaths: ['./project'],    // Only access project directory
  blockedCommands: ['rm -rf', 'format'],  // Block destructive commands
  timeout: 30000                        // 30 second timeout
}
```

### Extension Security

- **Sandboxed Execution**: Extensions run in isolated context
- **Capability Declaration**: Extensions declare capabilities explicitly
- **Dependency Validation**: Dependencies checked at load time

### Data Security

- **Memory Isolation**: Each agent has isolated memory
- **API Key Protection**: Never logged or exposed
- **Resource Access**: Controlled via allowedPaths
