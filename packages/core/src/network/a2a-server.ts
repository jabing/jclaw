/**
 * A2A Server
 *
 * Server for Agent-to-Agent communication hub
 *
 * @module @jclaw/core/network/a2a-server
 */

import type { A2AMessage, NodeInfo } from './protocol.js';
import { A2AProtocol } from './protocol.js';

export interface A2AServerConfig {
  port: number;
  host?: string;
}

export interface ConnectedAgent {
  id: string;
  info: NodeInfo;
  websocket: WebSocket;
  connectedAt: Date;
  lastSeen: Date;
}

export class A2AServer {
  private config: Required<A2AServerConfig>;
  private agents: Map<string, ConnectedAgent> = new Map();
  private messageHandlers: Map<
    string,
    (message: A2AMessage, sender: ConnectedAgent) => void
  > = new Map();

  constructor(config: A2AServerConfig) {
    this.config = {
      host: '0.0.0.0',
      ...config,
    };

    this.setupHandlers();
  }

  async start(): Promise<void> {
    // Note: In production, use a proper WebSocket server library
    // This is a simplified implementation
    console.log(
      `A2A Server starting on ${this.config.host}:${this.config.port}`
    );
    console.log(
      'Note: Full WebSocket server implementation requires additional setup'
    );
  }

  async stop(): Promise<void> {
    // Disconnect all agents
    for (const agent of Array.from(this.agents.values())) {
      try {
        agent.websocket.close();
      } catch {
        // Ignore close errors
      }
    }
    this.agents.clear();
    console.log('A2A Server stopped');
  }

  onMessage(
    type: string,
    handler: (message: A2AMessage, sender: ConnectedAgent) => void
  ): void {
    this.messageHandlers.set(type, handler);
  }

  getConnectedAgents(): ConnectedAgent[] {
    return Array.from(this.agents.values());
  }

  getAgentById(id: string): ConnectedAgent | undefined {
    return this.agents.get(id);
  }

  async broadcast(message: A2AMessage, excludeSender?: string): Promise<void> {
    const messageStr = JSON.stringify(message);

    for (const [id, agent] of Array.from(this.agents.entries())) {
      if (id !== excludeSender) {
        try {
          agent.websocket.send(messageStr);
        } catch (error) {
          console.error(`Failed to send to agent ${id}:`, error);
        }
      }
    }
  }

  async sendToAgent(agentId: string, message: A2AMessage): Promise<boolean> {
    const agent = this.agents.get(agentId);
    if (!agent) {
      return false;
    }

    try {
      agent.websocket.send(JSON.stringify(message));
      return true;
    } catch {
      return false;
    }
  }

  private setupHandlers(): void {
    // Handle greetings
    this.onMessage('greeting', (message, sender) => {
      const info = message.payload as NodeInfo;
      sender.info = info;
      sender.lastSeen = new Date();
      console.log(`Agent ${sender.id} greeted: ${info.name}`);
    });

    // Handle heartbeats
    this.onMessage('heartbeat', (message, sender) => {
      sender.lastSeen = new Date();
    });

    // Handle gene sharing - broadcast to other agents
    this.onMessage('gene_share', async (message, sender) => {
      await this.broadcast(message, sender.id);
    });

    // Handle gene requests - route to agents with genes
    this.onMessage('gene_request', async (message, sender) => {
      // Broadcast request to all agents
      await this.broadcast(message, sender.id);
    });

    // Handle task delegation - route to appropriate agent
    this.onMessage('task_delegate', async (message, sender) => {
      const payload = message.payload as { requiredCapabilities?: string[] };

      // Find agent with required capabilities
      for (const agent of Array.from(this.agents.values())) {
        if (agent.id !== sender.id) {
          const hasCapabilities = payload.requiredCapabilities?.every((cap) =>
            agent.info.capabilities.includes(cap)
          );
          if (hasCapabilities || !payload.requiredCapabilities) {
            await this.sendToAgent(agent.id, message);
            return;
          }
        }
      }
    });
  }

  // Internal method called when a new WebSocket connection is established
  private handleConnection(websocket: WebSocket, agentId: string): void {
    const agent: ConnectedAgent = {
      id: agentId,
      info: {
        id: agentId,
        name: 'Unknown',
        version: '1.0.0',
        capabilities: [],
        endpoint: '',
        lastSeen: Date.now(),
      },
      websocket,
      connectedAt: new Date(),
      lastSeen: new Date(),
    };

    this.agents.set(agentId, agent);

    websocket.onmessage = (event) => {
      this.handleMessage(event.data as string, agent);
    };

    websocket.onclose = () => {
      this.agents.delete(agentId);
      console.log(`Agent ${agentId} disconnected`);
    };
  }

  private handleMessage(data: string, sender: ConnectedAgent): void {
    try {
      const message = JSON.parse(data) as A2AMessage;

      if (!A2AProtocol.validate(message)) {
        console.error('Invalid message from', sender.id);
        return;
      }

      sender.lastSeen = new Date();

      const handler = this.messageHandlers.get(message.type);
      if (handler) {
        handler(message, sender);
      }
    } catch (error) {
      console.error('Failed to parse message:', error);
    }
  }
}

export function createA2AServer(config: A2AServerConfig): A2AServer {
  return new A2AServer(config);
}
