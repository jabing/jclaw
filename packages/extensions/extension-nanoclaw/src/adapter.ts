/**
 * NanoClaw Adapter
 *
 * Provides interface to NanoClaw process for WhatsApp messaging via IPC or WebSocket.
 */

import { EventEmitter } from 'events';
import WebSocket from 'ws';

/**
 * Connection type for NanoClaw
 */
export type ConnectionType = 'websocket' | 'ipc';

/**
 * NanoClaw connection configuration
 */
export interface NanoClawConnectionConfig {
  /** Connection type: 'websocket' or 'ipc' */
  type: ConnectionType;
  /** WebSocket URL (for websocket type) */
  wsUrl?: string;
  /** IPC socket path (for ipc type) */
  ipcPath?: string;
  /** Connection timeout in milliseconds */
  connectTimeout?: number;
  /** Reconnection settings */
  reconnect?: {
    /** Maximum reconnection attempts (0 = unlimited) */
    maxAttempts: number;
    /** Delay between reconnection attempts in milliseconds */
    delay: number;
    /** Exponential backoff multiplier */
    backoffMultiplier?: number;
  };
}

/**
 * NanoClaw adapter options
 */
export interface NanoClawOptions {
  /** Path to nanoclaw executable */
  nanoclawPath?: string;
  /** General timeout for operations in milliseconds */
  timeout?: number;
  /** Connection configuration */
  connection?: NanoClawConnectionConfig;
}

/**
 * WhatsApp message received from NanoClaw
 */
export interface WhatsAppMessage {
  /** Unique message identifier */
  id: string;
  /** Sender JID (e.g., user@s.whatsapp.net) */
  from: string;
  /** Message content/text */
  content: string;
  /** Message timestamp (Unix epoch in milliseconds) */
  timestamp: number;
  /** Message type (e.g., 'text', 'image', 'video') */
  messageType?: string;
  /** Group JID if message is from a group */
  groupId?: string;
  /** Sender's display name (if available) */
  senderName?: string;
}

/**
 * Options for sending a WhatsApp message
 */
export interface SendMessageOptions {
  /** Recipient JID (e.g., user@s.whatsapp.net) */
  to: string;
  /** Message content to send */
  content: string;
  /** Optional message type */
  messageType?: string;
}

/**
 * Legacy Message interface (for backward compatibility)
 * @deprecated Use WhatsAppMessage instead
 */
export interface Message {
  from: string;
  content: string;
  timestamp?: number;
}

/**
 * Result from NanoClaw operations
 */
export interface NanoClawResult {
  /** Whether the operation was successful */
  success: boolean;
  /** Error message if operation failed */
  error?: string;
  /** Additional data from the operation */
  data?: unknown;
}

/**
 * Connection state
 */
export type ConnectionState =
  | 'disconnected'
  | 'connecting'
  | 'connected'
  | 'reconnecting';

/**
 * NanoClaw adapter events
 */
export interface NanoClawAdapterEvents {
  /** Emitted when a message is received from WhatsApp */
  message: (message: WhatsAppMessage) => void;
  /** Emitted when connection state changes */
  connectionStateChange: (state: ConnectionState) => void;
  /** Emitted when an error occurs */
  error: (error: Error) => void;
  /** Emitted when successfully connected */
  connected: () => void;
  /** Emitted when disconnected */
  disconnected: () => void;
}

/**
 * NanoClaw Adapter - 封装 NanoClaw 连接和通信
 *
 * Provides WebSocket/IPC connection to NanoClaw process for WhatsApp messaging.
 * Uses EventEmitter pattern for message receiving with automatic reconnection.
 */
export class NanoClawAdapter extends EventEmitter {
  private nanoclawPath: string;
  private timeout: number;
  private connectionConfig: NanoClawConnectionConfig;
  private ws: WebSocket | null = null;
  private connectionState: ConnectionState = 'disconnected';
  private reconnectAttempts = 0;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private messageQueue: Array<{ type: string; payload: unknown }> = [];
  private messageHandlers: Map<string, (response: unknown) => void> = new Map();
  private pingInterval: NodeJS.Timeout | null = null;

  constructor(options: NanoClawOptions = {}) {
    super();
    this.nanoclawPath = options.nanoclawPath ?? 'nanoclaw';
    this.timeout = options.timeout ?? 30000;
    this.connectionConfig = options.connection ?? {
      type: 'websocket',
      wsUrl: 'ws://localhost:8080',
      connectTimeout: 10000,
      reconnect: {
        maxAttempts: 0,
        delay: 5000,
        backoffMultiplier: 1.5,
      },
    };
  }

  /**
   * Get current connection state
   */
  getState(): ConnectionState {
    return this.connectionState;
  }

  /**
   * Check if connected to NanoClaw
   */
  isConnected(): boolean {
    return (
      this.connectionState === 'connected' &&
      this.ws?.readyState === WebSocket.OPEN
    );
  }

  /**
   * Connect to NanoClaw via WebSocket or IPC
   */
  async connect(): Promise<NanoClawResult> {
    if (this.isConnected()) {
      return { success: true, data: { alreadyConnected: true } };
    }

    if (this.connectionState === 'connecting') {
      return { success: true, data: { connecting: true } };
    }

    this.setConnectionState('connecting');

    try {
      if (this.connectionConfig.type === 'websocket') {
        await this.connectWebSocket();
      } else {
        await this.connectIPC();
      }

      this.reconnectAttempts = 0;
      this.setConnectionState('connected');
      this.emit('connected');
      this.startPingInterval();
      this.flushMessageQueue();

      return { success: true };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.setConnectionState('disconnected');
      this.emit('error', new Error(`Connection failed: ${errorMessage}`));
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Connect via WebSocket
   */
  private connectWebSocket(): Promise<void> {
    return new Promise((resolve, reject) => {
      const wsUrl = this.connectionConfig.wsUrl ?? 'ws://localhost:8080';
      const connectTimeout = this.connectionConfig.connectTimeout ?? 10000;

      this.ws = new WebSocket(wsUrl);

      const timeoutTimer = setTimeout(() => {
        this.ws?.close();
        reject(new Error(`Connection timeout after ${connectTimeout}ms`));
      }, connectTimeout);

      this.ws.on('open', () => {
        clearTimeout(timeoutTimer);
        resolve();
      });

      this.ws.on('error', (error) => {
        clearTimeout(timeoutTimer);
        reject(error);
      });

      this.setupWebSocketHandlers();
    });
  }

  /**
   * Connect via IPC (placeholder for future implementation)
   */
  private async connectIPC(): Promise<void> {
    // IPC implementation would use node:net for Unix sockets or named pipes
    // For now, throw error to indicate not implemented
    throw new Error('IPC connection not yet implemented. Use WebSocket.');
  }

  /**
   * Setup WebSocket event handlers
   */
  private setupWebSocketHandlers(): void {
    if (!this.ws) return;

    this.ws.on('message', (data: WebSocket.RawData) => {
      try {
        const message = JSON.parse(data.toString());
        this.handleIncomingMessage(message);
      } catch (error) {
        this.emit('error', new Error(`Failed to parse message: ${error}`));
      }
    });

    this.ws.on('close', (code: number, _reason: Buffer) => {
      this.stopPingInterval();
      this.setConnectionState('disconnected');
      this.emit('disconnected');

      // Attempt reconnection if not intentionally closed
      if (code !== 1000 && code !== 1001) {
        this.scheduleReconnect();
      }
    });

    this.ws.on('error', (error: Error) => {
      this.emit('error', error);
    });
  }

  /**
   * Handle incoming messages from NanoClaw
   */
  private handleIncomingMessage(message: unknown): void {
    if (!this.isValidNanoClawMessage(message)) {
      this.emit('error', new Error('Invalid message format received'));
      return;
    }

    const msg = message as { type: string; payload: unknown; id?: string };

    // Handle response messages
    if (msg.id && this.messageHandlers.has(msg.id)) {
      const handler = this.messageHandlers.get(msg.id)!;
      handler(msg.payload);
      this.messageHandlers.delete(msg.id);
      return;
    }

    // Handle incoming WhatsApp messages
    if (msg.type === 'message') {
      const whatsAppMessage = this.parseWhatsAppMessage(msg.payload);
      if (whatsAppMessage) {
        this.emit('message', whatsAppMessage);
      }
    }

    // Handle connection acknowledgments
    if (msg.type === 'connected') {
      this.setConnectionState('connected');
      this.emit('connected');
    }
  }

  /**
   * Validate NanoClaw message format
   */
  private isValidNanoClawMessage(
    message: unknown
  ): message is { type: string; payload: unknown } {
    return (
      typeof message === 'object' &&
      message !== null &&
      'type' in message &&
      typeof (message as { type: unknown }).type === 'string'
    );
  }

  /**
   * Parse WhatsApp message from NanoClaw payload
   */
  private parseWhatsAppMessage(payload: unknown): WhatsAppMessage | null {
    if (typeof payload !== 'object' || payload === null) {
      return null;
    }

    const p = payload as Record<string, unknown>;

    if (!p.id || !p.from || !p.content) {
      return null;
    }

    return {
      id: String(p.id),
      from: String(p.from),
      content: String(p.content),
      timestamp: typeof p.timestamp === 'number' ? p.timestamp : Date.now(),
      messageType: p.messageType ? String(p.messageType) : 'text',
      groupId: p.groupId ? String(p.groupId) : undefined,
      senderName: p.senderName ? String(p.senderName) : undefined,
    };
  }

  /**
   * Send message to WhatsApp via NanoClaw
   */
  async sendMessage(options: SendMessageOptions): Promise<NanoClawResult> {
    if (!this.isConnected()) {
      // Try to connect first
      const connectResult = await this.connect();
      if (!connectResult.success) {
        return {
          success: false,
          error: `Not connected to NanoClaw: ${connectResult.error}`,
        };
      }
    }

    const messageId = this.generateMessageId();
    const payload = {
      type: 'send_message',
      id: messageId,
      payload: {
        to: options.to,
        content: options.content,
        messageType: options.messageType ?? 'text',
      },
    };

    try {
      const result = await this.sendWithResponse(
        payload,
        messageId,
        this.timeout
      );
      return {
        success: true,
        data: result,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Send message and wait for response
   */
  private sendWithResponse(
    payload: { type: string; id: string; payload: unknown },
    messageId: string,
    timeout: number
  ): Promise<unknown> {
    return new Promise((resolve, reject) => {
      const timeoutTimer = setTimeout(() => {
        this.messageHandlers.delete(messageId);
        reject(new Error(`Request timeout after ${timeout}ms`));
      }, timeout);

      this.messageHandlers.set(messageId, (response: unknown) => {
        clearTimeout(timeoutTimer);
        resolve(response);
      });

      this.sendRaw(payload);
    });
  }

  /**
   * Send raw message to NanoClaw
   */
  private sendRaw(message: {
    type: string;
    id?: string;
    payload?: unknown;
  }): void {
    if (!this.isConnected()) {
      // Queue message for when connection is restored
      this.messageQueue.push(message as { type: string; payload: unknown });
      return;
    }

    try {
      this.ws!.send(JSON.stringify(message));
    } catch (error) {
      // Queue on error
      this.messageQueue.push(message as { type: string; payload: unknown });
      this.emit('error', new Error(`Failed to send message: ${error}`));
    }
  }

  /**
   * Flush queued messages
   */
  private flushMessageQueue(): void {
    while (this.messageQueue.length > 0 && this.isConnected()) {
      const message = this.messageQueue.shift();
      if (message) {
        this.sendRaw(message);
      }
    }
  }

  /**
   * Receive messages (legacy polling method)
   * @deprecated Use EventEmitter 'message' event instead
   */
  async receiveMessages(): Promise<Message[]> {
    // In event-driven mode, this returns an empty array
    // Users should listen to 'message' events instead
    return [];
  }

  /**
   * Check NanoClaw availability
   */
  async isAvailable(): Promise<boolean> {
    if (this.isConnected()) {
      return true;
    }

    const result = await this.connect();
    return result.success;
  }

  /**
   * Start NanoClaw adapter and connect
   */
  async start(): Promise<NanoClawResult> {
    return this.connect();
  }

  /**
   * Stop NanoClaw adapter and disconnect
   */
  async stop(): Promise<NanoClawResult> {
    this.stopPingInterval();

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.ws) {
      try {
        this.ws.close(1000, 'Client disconnect');
      } catch {
        // Ignore close errors
      }
      this.ws = null;
    }

    this.messageHandlers.clear();
    this.messageQueue = [];
    this.setConnectionState('disconnected');

    return { success: true };
  }

  /**
   * Disconnect from NanoClaw
   */
  async disconnect(): Promise<NanoClawResult> {
    return this.stop();
  }

  /**
   * Set connection state and emit event
   */
  private setConnectionState(state: ConnectionState): void {
    if (this.connectionState !== state) {
      this.connectionState = state;
      this.emit('connectionStateChange', state);
    }
  }

  /**
   * Schedule reconnection attempt
   */
  private scheduleReconnect(): void {
    const config = this.connectionConfig.reconnect;
    if (!config) return;

    if (
      config.maxAttempts > 0 &&
      this.reconnectAttempts >= config.maxAttempts
    ) {
      this.emit(
        'error',
        new Error(`Max reconnection attempts (${config.maxAttempts}) reached`)
      );
      return;
    }

    this.reconnectAttempts++;
    this.setConnectionState('reconnecting');

    const delay = Math.min(
      config.delay *
        Math.pow(config.backoffMultiplier ?? 1.5, this.reconnectAttempts - 1),
      60000 // Max 60 second delay
    );

    this.reconnectTimer = setTimeout(() => {
      this.connect().catch(() => {
        // Error already emitted in connect()
      });
    }, delay);

    this.emit(
      'error',
      new Error(
        `Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`
      )
    );
  }

  /**
   * Start ping interval to keep connection alive
   */
  private startPingInterval(): void {
    this.pingInterval = setInterval(() => {
      if (this.isConnected()) {
        this.sendRaw({ type: 'ping', payload: {} });
      }
    }, 30000); // Ping every 30 seconds
  }

  /**
   * Stop ping interval
   */
  private stopPingInterval(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  /**
   * Generate unique message ID
   */
  private generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Typed event emitter wrapper for 'message' event
   */
  on<K extends keyof NanoClawAdapterEvents>(
    event: K,
    listener: NanoClawAdapterEvents[K]
  ): this {
    return super.on(event, listener);
  }

  /**
   * Typed event emitter wrapper for 'message' emit
   */
  emit<K extends keyof NanoClawAdapterEvents>(
    event: K,
    ...args: Parameters<NanoClawAdapterEvents[K]>
  ): boolean {
    return super.emit(event, ...args);
  }

  /**
   * Typed event emitter wrapper for 'message' once
   */
  once<K extends keyof NanoClawAdapterEvents>(
    event: K,
    listener: NanoClawAdapterEvents[K]
  ): this {
    return super.once(event, listener);
  }
}
