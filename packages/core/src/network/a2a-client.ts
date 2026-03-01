/**
 * A2A Client
 *
 * Client for Agent-to-Agent communication
 *
 * @module @jclaw/core/network/a2a-client
 */

import type { A2AMessage, NodeInfo, GeneRequestPayload } from './protocol.js';
import { A2AProtocol } from './protocol.js';

export interface A2AClientConfig {
  hubUrl: string;
  agentId: string;
  agentInfo: NodeInfo;
  reconnectInterval?: number;
}

export interface ConnectionStatus {
  connected: boolean;
  lastHeartbeat: Date | null;
  reconnectAttempts: number;
}

export class A2AClient {
  private config: Required<A2AClientConfig>;
  private ws: WebSocket | null = null;
  private status: ConnectionStatus = {
    connected: false,
    lastHeartbeat: null,
    reconnectAttempts: 0,
  };
  private messageHandlers: Map<string, (message: A2AMessage) => void> =
    new Map();
  private heartbeatInterval: ReturnType<typeof setInterval> | null = null;

  constructor(config: A2AClientConfig) {
    this.config = {
      reconnectInterval: 5000,
      ...config,
    };
  }

  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.config.hubUrl);

        this.ws.onopen = () => {
          this.status.connected = true;
          this.status.reconnectAttempts = 0;
          this.sendGreeting();
          this.startHeartbeat();
          resolve();
        };

        this.ws.onclose = () => {
          this.status.connected = false;
          this.stopHeartbeat();
          this.scheduleReconnect();
        };

        this.ws.onerror = (error) => {
          if (!this.status.connected) {
            reject(error);
          }
        };

        this.ws.onmessage = (event) => {
          this.handleMessage(event.data);
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  async disconnect(): Promise<void> {
    this.stopHeartbeat();
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.status.connected = false;
  }

  async sendMessage(message: A2AMessage): Promise<void> {
    if (!this.ws || !this.status.connected) {
      throw new Error('Not connected to hub');
    }

    this.ws.send(JSON.stringify(message));
  }

  onMessage(type: string, handler: (message: A2AMessage) => void): void {
    this.messageHandlers.set(type, handler);
  }

  offMessage(type: string): void {
    this.messageHandlers.delete(type);
  }

  getStatus(): ConnectionStatus {
    return { ...this.status };
  }

  async sendGeneShare(genes: unknown[], requireAck = false): Promise<void> {
    const message = A2AProtocol.createGeneShare(
      this.config.agentId,
      'hub',
      genes as never[],
      requireAck
    );
    await this.sendMessage(message);
  }

  async requestGenes(request: GeneRequestPayload = {}): Promise<void> {
    const message = A2AProtocol.createGeneRequest(
      this.config.agentId,
      'hub',
      request
    );
    await this.sendMessage(message);
  }

  async delegateTask(task: {
    taskId: string;
    description: string;
    requiredCapabilities: string[];
  }): Promise<void> {
    const message = A2AProtocol.createTaskDelegate(
      this.config.agentId,
      'hub', // Hub will route to appropriate agent
      task
    );
    await this.sendMessage(message);
  }

  private sendGreeting(): void {
    const message = A2AProtocol.createGreeting(
      this.config.agentId,
      'hub',
      this.config.agentInfo
    );
    this.sendMessage(message).catch(console.error);
  }

  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      if (this.status.connected) {
        const message = A2AProtocol.createHeartbeat(this.config.agentId, 'hub');
        this.sendMessage(message).catch(console.error);
        this.status.lastHeartbeat = new Date();
      }
    }, 30000); // Every 30 seconds
  }

  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  private scheduleReconnect(): void {
    this.status.reconnectAttempts++;
    setTimeout(() => {
      this.connect().catch(console.error);
    }, this.config.reconnectInterval);
  }

  private handleMessage(data: string): void {
    try {
      const message = JSON.parse(data) as A2AMessage;

      if (!A2AProtocol.validate(message)) {
        console.error('Invalid message received:', message);
        return;
      }

      const handler = this.messageHandlers.get(message.type);
      if (handler) {
        handler(message);
      }
    } catch (error) {
      console.error('Failed to parse message:', error);
    }
  }
}

export function createA2AClient(config: A2AClientConfig): A2AClient {
  return new A2AClient(config);
}
