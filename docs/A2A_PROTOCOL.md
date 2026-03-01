# A2A Protocol

> Agent-to-Agent communication protocol for jclaw - enabling collaborative multi-agent systems.

## Overview

The A2A (Agent-to-Agent) protocol enables jclaw agents to communicate, share capabilities, and delegate tasks to each other.

## Architecture

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Agent A    │     │    A2A Hub   │     │   Agent B    │
│              │     │              │     │              │
│  A2AClient ──┼────►│  A2AServer   │◄────┤── A2AClient  │
│              │     │              │     │              │
└──────────────┘     └──────────────┘     └──────────────┘
                            │
                     ┌──────┴──────┐
                     │   Agent C   │
                     │             │
                     │─ A2AClient  │
                     └─────────────┘
```

## Components

### A2AClient

Client for connecting to an A2A hub:

```typescript
import { A2AClient } from '@jclaw/core/network';

const client = new A2AClient({
  hubUrl: 'ws://localhost:8080',
  agentId: 'agent-alice',
  agentInfo: {
    id: 'agent-alice',
    name: 'Alice',
    version: '1.0.0',
    capabilities: ['code-generation', 'testing'],
    endpoint: 'http://localhost:3000',
  },
});

await client.connect();
```

### A2AServer

Hub server for routing messages between agents:

```typescript
import { A2AServer } from '@jclaw/core/network';

const server = new A2AServer({
  port: 8080,
  host: '0.0.0.0',
});

await server.start();
```

### AgentDiscovery

Capability-based agent discovery:

```typescript
import { AgentDiscovery, A2AClient } from '@jclaw/core/network';

const discovery = new AgentDiscovery({
  client: client,
  cacheTimeout: 60000, // 1 minute cache
});

// Find agents with specific capabilities
const results = await discovery.findByCapability('code-generation');
// Returns: [{ agentId, agentInfo, matchScore, matchedCapabilities }]
```

## Message Types

| Type            | Description                           |
| --------------- | ------------------------------------- |
| `greeting`      | Agent introduction when connecting    |
| `heartbeat`     | Keep-alive signal                     |
| `gene_share`    | Share evolved genes with other agents |
| `gene_request`  | Request genes from other agents       |
| `gene_response` | Response to gene request              |
| `task_delegate` | Delegate a task to another agent      |
| `task_result`   | Result of a delegated task            |
| `goodbye`       | Agent disconnecting                   |

## Message Structure

```typescript
interface A2AMessage {
  version: string; // Protocol version
  type: A2AMessageType; // Message type
  from: string; // Sender agent ID
  to: string; // Recipient ID or 'broadcast'
  payload: unknown; // Message-specific payload
  timestamp: number; // Unix timestamp
  messageId: string; // Unique message ID
}
```

## Usage Examples

### Connecting to Hub

```typescript
import { A2AClient } from '@jclaw/core/network';

const client = new A2AClient({
  hubUrl: 'ws://hub.example.com:8080',
  agentId: 'my-agent',
  agentInfo: {
    id: 'my-agent',
    name: 'My Agent',
    version: '1.0.0',
    capabilities: ['analysis', 'reporting'],
    endpoint: 'http://localhost:3000',
  },
  reconnectInterval: 5000,
});

// Connect to hub
await client.connect();

// Check connection status
const status = client.getStatus();
console.log('Connected:', status.connected);
console.log('Last heartbeat:', status.lastHeartbeat);
```

### Sending Messages

```typescript
// Share genes with other agents
await client.sendGeneShare(
  [
    { id: 'gene-1', type: 'behavior', data: '...' },
    { id: 'gene-2', type: 'knowledge', data: '...' },
  ],
  true
); // requireAck

// Request genes
await client.requestGenes({
  types: ['behavior', 'skill'],
  minFitness: 0.8,
  limit: 10,
});

// Delegate task
await client.delegateTask({
  taskId: 'task-123',
  description: 'Analyze the codebase for security issues',
  requiredCapabilities: ['security-analysis'],
});
```

### Receiving Messages

```typescript
// Register message handlers
client.onMessage('gene_share', (message) => {
  console.log('Received genes from:', message.from);
  const genes = message.payload;
  // Process received genes
});

client.onMessage('task_delegate', (message) => {
  console.log('Task delegated:', message.payload);
  // Execute task and send result
});

client.onMessage('task_result', (message) => {
  console.log('Task result:', message.payload);
});

// Remove handler when done
client.offMessage('gene_share');
```

### Running a Hub Server

```typescript
import { A2AServer } from '@jclaw/core/network';

const server = new A2AServer({
  port: 8080,
  host: '0.0.0.0',
});

// Register custom message handlers
server.onMessage('custom_event', (message, sender) => {
  console.log(`Custom event from ${sender.id}:`, message.payload);
});

// Start server
await server.start();

// Get connected agents
const agents = server.getConnectedAgents();
console.log(`${agents.length} agents connected`);

// Stop server
await server.stop();
```

### Agent Discovery

```typescript
import { AgentDiscovery } from '@jclaw/core/network';

const discovery = new AgentDiscovery({
  client: client,
  cacheTimeout: 60000, // 1 minute
});

// Broadcast capabilities
await discovery.broadcastCapabilities();

// Find agents by capability
const analysts = await discovery.findByCapability('data-analysis');

for (const result of analysts) {
  console.log(`Agent: ${result.agentId}`);
  console.log(`  Match Score: ${result.matchScore}`);
  console.log(`  Capabilities: ${result.matchedCapabilities.join(', ')}`);
}
```

## Gene Exchange Protocol (GEP)

Agents can exchange evolved "genes" (learned behaviors, knowledge, skills):

```typescript
interface GEPPacket {
  version: string;
  geneId: string;
  geneType: 'behavior' | 'knowledge' | 'skill';
  data: string; // Compressed/encoded gene data
  metadata: {
    fitness: number; // Quality score
    generation: number; // Evolution generation
    parents: string[]; // Parent gene IDs
    checksum: string; // Data integrity
  };
}
```

## Connection Lifecycle

```
┌─────────┐    connect()    ┌─────────┐
│  Agent  │ ──────────────► │   Hub   │
└─────────┘                 └─────────┘
     │                           │
     │  greeting                 │
     │ ──────────────────────►   │
     │                           │
     │  heartbeat (every 30s)    │
     │ ──────────────────────►   │
     │                           │
     │  messages                 │
     │ ◄──────────────────────►  │
     │                           │
     │  goodbye                  │
     │ ──────────────────────►   │
     │                           │
     │  disconnect()             │
     │ ──────────────────────►   │
```

## Error Handling

```typescript
try {
  await client.connect();
} catch (error) {
  console.error('Failed to connect:', error);
  // Will auto-reconnect based on reconnectInterval
}

// Check connection status
if (!client.getStatus().connected) {
  console.log('Reconnecting...');
}
```

## Configuration

### A2AClientConfig

| Field               | Type     | Description                     |
| ------------------- | -------- | ------------------------------- |
| `hubUrl`            | string   | WebSocket URL of the hub        |
| `agentId`           | string   | Unique agent identifier         |
| `agentInfo`         | NodeInfo | Agent metadata and capabilities |
| `reconnectInterval` | number   | Reconnection interval (ms)      |

### A2AServerConfig

| Field  | Type   | Description                      |
| ------ | ------ | -------------------------------- |
| `port` | number | Server port                      |
| `host` | string | Server host (default: '0.0.0.0') |

## Security Considerations

1. **Authentication**: Implement agent authentication at the hub level
2. **Authorization**: Validate capabilities before allowing task delegation
3. **Encryption**: Use WSS (WebSocket Secure) for production
4. **Rate Limiting**: Implement message rate limits at the hub

## Performance

| Metric             | Typical Value |
| ------------------ | ------------- |
| Connection time    | ~50ms         |
| Message latency    | ~10ms         |
| Heartbeat interval | 30 seconds    |
| Max connections    | 1000+ agents  |

## API Reference

### A2AClient

| Method                             | Description           |
| ---------------------------------- | --------------------- |
| `connect()`                        | Connect to hub        |
| `disconnect()`                     | Disconnect from hub   |
| `sendMessage(message)`             | Send raw message      |
| `sendGeneShare(genes, requireAck)` | Share genes           |
| `requestGenes(request)`            | Request genes         |
| `delegateTask(task)`               | Delegate task         |
| `onMessage(type, handler)`         | Register handler      |
| `offMessage(type)`                 | Remove handler        |
| `getStatus()`                      | Get connection status |

### A2AServer

| Method                               | Description            |
| ------------------------------------ | ---------------------- |
| `start()`                            | Start server           |
| `stop()`                             | Stop server            |
| `onMessage(type, handler)`           | Register handler       |
| `getConnectedAgents()`               | List connected agents  |
| `getAgentById(id)`                   | Get specific agent     |
| `broadcast(message, excludeSender?)` | Broadcast to all       |
| `sendToAgent(agentId, message)`      | Send to specific agent |

## See Also

- [Evolution System](./EVOLUTION.md) - Gene evolution and sharing
- [Execution Modes](./EXECUTION_MODES.md) - Task execution strategies
