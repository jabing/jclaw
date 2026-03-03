/**
 * Comprehensive NanoClaw Adapter Tests
 *
 * Tests all public methods, error scenarios, and edge cases.
 */

import {
  NanoClawAdapter,
  type WhatsAppMessage,
  type SendMessageOptions,
  type NanoClawConnectionConfig,
  type ConnectionState,
  type NanoClawOptions,
  type NanoClawResult,
} from '../src/adapter.js';
import { EventEmitter } from 'events';
import WebSocket from 'ws';

// Mock WebSocket
jest.mock('ws');

describe('NanoClawAdapter - Comprehensive', () => {
  let adapter: NanoClawAdapter;
  let mockWebSocket: jest.Mocked<WebSocket>;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();

    // Create mock WebSocket instance
    mockWebSocket = {
      on: jest.fn(),
      once: jest.fn(),
      send: jest.fn(),
      close: jest.fn(),
      readyState: WebSocket.CONNECTING,
    } as unknown as jest.Mocked<WebSocket>;

    (WebSocket as unknown as jest.Mock).mockImplementation(() => mockWebSocket);

    adapter = new NanoClawAdapter({
      connection: {
        type: 'websocket',
        wsUrl: 'ws://localhost:8080',
        connectTimeout: 5000,
        reconnect: {
          maxAttempts: 3,
          delay: 100,
          backoffMultiplier: 1.5,
        },
      },
    });
  });

  afterEach(async () => {
    jest.useRealTimers();
    await adapter.stop();
  });

  describe('constructor', () => {
    it('should create adapter with default options', () => {
      const defaultAdapter = new NanoClawAdapter();
      expect(defaultAdapter).toBeDefined();
      expect(defaultAdapter.getState()).toBe('disconnected');
      expect(defaultAdapter.isConnected()).toBe(false);
    });

    it('should accept custom nanoclawPath', () => {
      const customAdapter = new NanoClawAdapter({
        nanoclawPath: '/custom/path/nanoclaw',
      });
      expect(customAdapter).toBeDefined();
    });

    it('should accept custom timeout', () => {
      const customAdapter = new NanoClawAdapter({
        timeout: 60000,
      });
      expect(customAdapter).toBeDefined();
    });

    it('should accept complete custom options', () => {
      const customAdapter = new NanoClawAdapter({
        nanoclawPath: '/custom/nanoclaw',
        timeout: 45000,
        connection: {
          type: 'websocket',
          wsUrl: 'ws://custom:9999',
          connectTimeout: 15000,
          reconnect: {
            maxAttempts: 5,
            delay: 1000,
            backoffMultiplier: 2,
          },
        },
      });
      expect(customAdapter).toBeDefined();
    });

    it('should use default reconnect config when not provided', () => {
      const adapterWithoutReconnect = new NanoClawAdapter({
        connection: {
          type: 'websocket',
          wsUrl: 'ws://localhost:8080',
        },
      });
      expect(adapterWithoutReconnect).toBeDefined();
    });
  });

  describe('connection state management', () => {
    it('should start in disconnected state', () => {
      expect(adapter.getState()).toBe('disconnected');
      expect(adapter.isConnected()).toBe(false);
    });

    it('should track connection state changes', async () => {
      const stateChanges: ConnectionState[] = [];
      adapter.on('connectionStateChange', (state) => {
        stateChanges.push(state);
      });

      // Simulate successful connection
      const connectPromise = adapter.connect();

      // Get the open handler and call it
      const openHandler = mockWebSocket.on.mock.calls.find(
        (call) => call[0] === 'open'
      )?.[1];
      expect(openHandler).toBeDefined();

      mockWebSocket.readyState = WebSocket.OPEN;
      openHandler?.();

      await connectPromise;

      expect(adapter.getState()).toBe('connected');
      expect(adapter.isConnected()).toBe(true);
      expect(stateChanges).toContain('connecting');
      expect(stateChanges).toContain('connected');
    });

    it('should handle already connected state', async () => {
      // First connection
      const connectPromise = adapter.connect();
      const openHandler = mockWebSocket.on.mock.calls.find(
        (call) => call[0] === 'open'
      )?.[1];
      mockWebSocket.readyState = WebSocket.OPEN;
      openHandler?.();
      await connectPromise;

      // Try connecting again
      const result = await adapter.connect();
      expect(result.success).toBe(true);
      expect(result.data).toEqual({ alreadyConnected: true });
    });

    it('should handle connecting state', async () => {
      // Start first connection
      const firstConnect = adapter.connect();

      // Try second connection while first is in progress
      const secondConnect = adapter.connect();
      const result = await secondConnect;

      expect(result.success).toBe(true);
      expect(result.data).toEqual({ connecting: true });

      // Clean up
      const openHandler = mockWebSocket.on.mock.calls.find(
        (call) => call[0] === 'open'
      )?.[1];
      openHandler?.();
      await firstConnect;
    });
  });

  describe('WebSocket connection', () => {
    it('should create WebSocket with correct URL', async () => {
      const connectPromise = adapter.connect();

      const openHandler = mockWebSocket.on.mock.calls.find(
        (call) => call[0] === 'open'
      )?.[1];
      mockWebSocket.readyState = WebSocket.OPEN;
      openHandler?.();

      await connectPromise;

      expect(WebSocket).toHaveBeenCalledWith('ws://localhost:8080');
    });

    it('should handle connection timeout', async () => {
      adapter = new NanoClawAdapter({
        connection: {
          type: 'websocket',
          wsUrl: 'ws://localhost:8080',
          connectTimeout: 1000,
        },
      });

      const connectPromise = adapter.connect();

      // Fast-forward past timeout
      jest.advanceTimersByTime(1100);

      const result = await connectPromise;

      expect(result.success).toBe(false);
      expect(result.error).toContain('timeout');
      expect(mockWebSocket.close).toHaveBeenCalled();
    });

    it('should handle WebSocket connection error', async () => {
      const connectPromise = adapter.connect();

      const errorHandler = mockWebSocket.on.mock.calls.find(
        (call) => call[0] === 'error'
      )?.[1];
      expect(errorHandler).toBeDefined();

      const testError = new Error('Connection refused');
      errorHandler?.(testError);

      const result = await connectPromise;

      expect(result.success).toBe(false);
      expect(result.error).toBe('Connection refused');
    });

    it('should setup message handler on connect', async () => {
      const connectPromise = adapter.connect();

      const openHandler = mockWebSocket.on.mock.calls.find(
        (call) => call[0] === 'open'
      )?.[1];
      mockWebSocket.readyState = WebSocket.OPEN;
      openHandler?.();

      await connectPromise;

      const messageHandler = mockWebSocket.on.mock.calls.find(
        (call) => call[0] === 'message'
      )?.[1];
      expect(messageHandler).toBeDefined();
    });

    it('should setup close handler on connect', async () => {
      const connectPromise = adapter.connect();

      const openHandler = mockWebSocket.on.mock.calls.find(
        (call) => call[0] === 'open'
      )?.[1];
      mockWebSocket.readyState = WebSocket.OPEN;
      openHandler?.();

      await connectPromise;

      const closeHandler = mockWebSocket.on.mock.calls.find(
        (call) => call[0] === 'close'
      )?.[1];
      expect(closeHandler).toBeDefined();
    });
  });

  describe('message handling', () => {
    beforeEach(async () => {
      const connectPromise = adapter.connect();
      const openHandler = mockWebSocket.on.mock.calls.find(
        (call) => call[0] === 'open'
      )?.[1];
      mockWebSocket.readyState = WebSocket.OPEN;
      openHandler?.();
      await connectPromise;
    });

    it('should handle incoming WhatsApp messages', () => {
      const messageHandler = jest.fn();
      adapter.on('message', messageHandler);

      const wsMessageHandler = mockWebSocket.on.mock.calls.find(
        (call) => call[0] === 'message'
      )?.[1];

      const incomingMessage = {
        type: 'message',
        payload: {
          id: 'msg-123',
          from: 'user@s.whatsapp.net',
          content: 'Hello World',
          timestamp: Date.now(),
          messageType: 'text',
        },
      };

      wsMessageHandler?.(Buffer.from(JSON.stringify(incomingMessage)));

      expect(messageHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'msg-123',
          from: 'user@s.whatsapp.net',
          content: 'Hello World',
        })
      );
    });

    it('should handle messages with groupId and senderName', () => {
      const messageHandler = jest.fn();
      adapter.on('message', messageHandler);

      const wsMessageHandler = mockWebSocket.on.mock.calls.find(
        (call) => call[0] === 'message'
      )?.[1];

      const incomingMessage = {
        type: 'message',
        payload: {
          id: 'msg-456',
          from: 'user@s.whatsapp.net',
          content: 'Group message',
          timestamp: Date.now(),
          messageType: 'text',
          groupId: 'group-123@g.us',
          senderName: 'John Doe',
        },
      };

      wsMessageHandler?.(Buffer.from(JSON.stringify(incomingMessage)));

      expect(messageHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          groupId: 'group-123@g.us',
          senderName: 'John Doe',
        })
      );
    });

    it('should handle invalid JSON messages', () => {
      const errorHandler = jest.fn();
      adapter.on('error', errorHandler);

      const wsMessageHandler = mockWebSocket.on.mock.calls.find(
        (call) => call[0] === 'message'
      )?.[1];

      wsMessageHandler?.(Buffer.from('invalid json'));

      expect(errorHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('Failed to parse message'),
        })
      );
    });

    it('should handle messages without type field', () => {
      const errorHandler = jest.fn();
      adapter.on('error', errorHandler);

      const wsMessageHandler = mockWebSocket.on.mock.calls.find(
        (call) => call[0] === 'message'
      )?.[1];

      const invalidMessage = { payload: 'test' };
      wsMessageHandler?.(Buffer.from(JSON.stringify(invalidMessage)));

      expect(errorHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Invalid message format received',
        })
      );
    });

    it('should handle message responses with id', () => {
      const wsMessageHandler = mockWebSocket.on.mock.calls.find(
        (call) => call[0] === 'message'
      )?.[1];

      // Start a send operation that will wait for response
      const sendPromise = adapter.sendMessage({
        to: 'user@s.whatsapp.net',
        content: 'Test',
      });

      // Get the sent message ID from the send call
      expect(mockWebSocket.send).toHaveBeenCalled();
      const sentMessage = JSON.parse(
        (mockWebSocket.send as jest.Mock).mock.calls[0][0]
      );

      // Simulate response
      const response = {
        type: 'response',
        id: sentMessage.id,
        payload: { success: true },
      };
      wsMessageHandler?.(Buffer.from(JSON.stringify(response)));

      return expect(sendPromise).resolves.toEqual(
        expect.objectContaining({ success: true })
      );
    });

    it('should handle connected acknowledgment', () => {
      const connectedHandler = jest.fn();
      adapter.on('connected', connectedHandler);

      const wsMessageHandler = mockWebSocket.on.mock.calls.find(
        (call) => call[0] === 'message'
      )?.[1];

      const ackMessage = {
        type: 'connected',
        payload: {},
      };

      wsMessageHandler?.(Buffer.from(JSON.stringify(ackMessage)));

      expect(connectedHandler).toHaveBeenCalled();
    });

    it('should use current timestamp when message has no timestamp', () => {
      const messageHandler = jest.fn();
      adapter.on('message', messageHandler);

      const wsMessageHandler = mockWebSocket.on.mock.calls.find(
        (call) => call[0] === 'message'
      )?.[1];

      const beforeTime = Date.now();
      const incomingMessage = {
        type: 'message',
        payload: {
          id: 'msg-789',
          from: 'user@s.whatsapp.net',
          content: 'No timestamp',
        },
      };

      wsMessageHandler?.(Buffer.from(JSON.stringify(incomingMessage)));
      const afterTime = Date.now();

      const receivedMessage = messageHandler.mock
        .calls[0][0] as WhatsAppMessage;
      expect(receivedMessage.timestamp).toBeGreaterThanOrEqual(beforeTime);
      expect(receivedMessage.timestamp).toBeLessThanOrEqual(afterTime);
    });

    it('should default messageType to text when not provided', () => {
      const messageHandler = jest.fn();
      adapter.on('message', messageHandler);

      const wsMessageHandler = mockWebSocket.on.mock.calls.find(
        (call) => call[0] === 'message'
      )?.[1];

      const incomingMessage = {
        type: 'message',
        payload: {
          id: 'msg-000',
          from: 'user@s.whatsapp.net',
          content: 'No type',
        },
      };

      wsMessageHandler?.(Buffer.from(JSON.stringify(incomingMessage)));

      expect(messageHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          messageType: 'text',
        })
      );
    });

    it('should skip messages with missing required fields', () => {
      const messageHandler = jest.fn();
      adapter.on('message', messageHandler);

      const wsMessageHandler = mockWebSocket.on.mock.calls.find(
        (call) => call[0] === 'message'
      )?.[1];

      // Missing id
      const invalidMessage1 = {
        type: 'message',
        payload: {
          from: 'user@s.whatsapp.net',
          content: 'Hello',
        },
      };

      wsMessageHandler?.(Buffer.from(JSON.stringify(invalidMessage1)));
      expect(messageHandler).not.toHaveBeenCalled();

      // Missing from
      const invalidMessage2 = {
        type: 'message',
        payload: {
          id: 'msg-001',
          content: 'Hello',
        },
      };

      wsMessageHandler?.(Buffer.from(JSON.stringify(invalidMessage2)));
      expect(messageHandler).not.toHaveBeenCalled();

      // Missing content
      const invalidMessage3 = {
        type: 'message',
        payload: {
          id: 'msg-002',
          from: 'user@s.whatsapp.net',
        },
      };

      wsMessageHandler?.(Buffer.from(JSON.stringify(invalidMessage3)));
      expect(messageHandler).not.toHaveBeenCalled();
    });
  });

  describe('sendMessage', () => {
    beforeEach(async () => {
      const connectPromise = adapter.connect();
      const openHandler = mockWebSocket.on.mock.calls.find(
        (call) => call[0] === 'open'
      )?.[1];
      mockWebSocket.readyState = WebSocket.OPEN;
      openHandler?.();
      await connectPromise;
      jest.clearAllMocks();
    });

    it('should send message successfully', async () => {
      const sendPromise = adapter.sendMessage({
        to: 'user@s.whatsapp.net',
        content: 'Hello World',
      });

      // Simulate response
      const sentMessage = JSON.parse(
        (mockWebSocket.send as jest.Mock).mock.calls[0][0]
      );

      const wsMessageHandler = mockWebSocket.on.mock.calls.find(
        (call) => call[0] === 'message'
      )?.[1];

      wsMessageHandler?.(
        Buffer.from(
          JSON.stringify({
            type: 'response',
            id: sentMessage.id,
            payload: { success: true, messageId: 'wa-msg-123' },
          })
        )
      );

      const result = await sendPromise;

      expect(result.success).toBe(true);
      expect(mockWebSocket.send).toHaveBeenCalled();
      const sentPayload = JSON.parse(
        (mockWebSocket.send as jest.Mock).mock.calls[0][0]
      );
      expect(sentPayload.type).toBe('send_message');
      expect(sentPayload.payload.to).toBe('user@s.whatsapp.net');
      expect(sentPayload.payload.content).toBe('Hello World');
    });

    it('should include message type in payload', async () => {
      const sendPromise = adapter.sendMessage({
        to: 'user@s.whatsapp.net',
        content: 'Hello',
        messageType: 'image',
      });

      const sentMessage = JSON.parse(
        (mockWebSocket.send as jest.Mock).mock.calls[0][0]
      );

      const wsMessageHandler = mockWebSocket.on.mock.calls.find(
        (call) => call[0] === 'message'
      )?.[1];

      wsMessageHandler?.(
        Buffer.from(
          JSON.stringify({
            type: 'response',
            id: sentMessage.id,
            payload: { success: true },
          })
        )
      );

      await sendPromise;

      expect(sentMessage.payload.messageType).toBe('image');
    });

    it('should default message type to text', async () => {
      const sendPromise = adapter.sendMessage({
        to: 'user@s.whatsapp.net',
        content: 'Hello',
      });

      const sentMessage = JSON.parse(
        (mockWebSocket.send as jest.Mock).mock.calls[0][0]
      );

      const wsMessageHandler = mockWebSocket.on.mock.calls.find(
        (call) => call[0] === 'message'
      )?.[1];

      wsMessageHandler?.(
        Buffer.from(
          JSON.stringify({
            type: 'response',
            id: sentMessage.id,
            payload: { success: true },
          })
        )
      );

      await sendPromise;

      expect(sentMessage.payload.messageType).toBe('text');
    });

    it('should handle send timeout', async () => {
      adapter = new NanoClawAdapter({
        timeout: 1000,
        connection: {
          type: 'websocket',
          wsUrl: 'ws://localhost:8080',
        },
      });

      // Connect first
      const connectPromise = adapter.connect();
      const openHandler = mockWebSocket.on.mock.calls.find(
        (call) => call[0] === 'open'
      )?.[1];
      mockWebSocket.readyState = WebSocket.OPEN;
      openHandler?.();
      await connectPromise;

      const sendPromise = adapter.sendMessage({
        to: 'user@s.whatsapp.net',
        content: 'Hello',
      });

      // Fast-forward past timeout
      jest.advanceTimersByTime(1100);

      const result = await sendPromise;

      expect(result.success).toBe(false);
      expect(result.error).toContain('timeout');
    });

    it('should connect before sending if not connected', async () => {
      await adapter.stop();

      const sendPromise = adapter.sendMessage({
        to: 'user@s.whatsapp.net',
        content: 'Hello',
      });

      // Should trigger connect
      const newOpenHandler = mockWebSocket.on.mock.calls.find(
        (call) => call[0] === 'open'
      )?.[1];
      mockWebSocket.readyState = WebSocket.OPEN;
      newOpenHandler?.();

      const sentMessage = JSON.parse(
        (mockWebSocket.send as jest.Mock).mock.calls[0][0]
      );

      const wsMessageHandler = mockWebSocket.on.mock.calls.find(
        (call) => call[0] === 'message'
      )?.[1];

      wsMessageHandler?.(
        Buffer.from(
          JSON.stringify({
            type: 'response',
            id: sentMessage.id,
            payload: { success: true },
          })
        )
      );

      const result = await sendPromise;
      expect(result.success).toBe(true);
    });

    it('should handle connection failure before send', async () => {
      await adapter.stop();

      const sendPromise = adapter.sendMessage({
        to: 'user@s.whatsapp.net',
        content: 'Hello',
      });

      // Simulate connection error
      const errorHandler = mockWebSocket.on.mock.calls.find(
        (call) => call[0] === 'error'
      )?.[1];
      errorHandler?.(new Error('Connection failed'));

      const result = await sendPromise;

      expect(result.success).toBe(false);
      expect(result.error).toContain('Not connected to NanoClaw');
    });
  });

  describe('reconnection', () => {
    it('should attempt reconnection on unexpected close', async () => {
      // Connect first
      const connectPromise = adapter.connect();
      const openHandler = mockWebSocket.on.mock.calls.find(
        (call) => call[0] === 'open'
      )?.[1];
      mockWebSocket.readyState = WebSocket.OPEN;
      openHandler?.();
      await connectPromise;

      const errorHandler = jest.fn();
      adapter.on('error', errorHandler);

      // Simulate unexpected close
      const closeHandler = mockWebSocket.on.mock.calls.find(
        (call) => call[0] === 'close'
      )?.[1];
      closeHandler?.(1006, Buffer.from('Connection lost'));

      // Should schedule reconnect
      expect(adapter.getState()).toBe('reconnecting');

      // Fast-forward to trigger reconnect
      jest.advanceTimersByTime(150);

      expect(errorHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('Reconnecting'),
        })
      );
    });

    it('should not reconnect on normal close', async () => {
      // Connect first
      const connectPromise = adapter.connect();
      const openHandler = mockWebSocket.on.mock.calls.find(
        (call) => call[0] === 'open'
      )?.[1];
      mockWebSocket.readyState = WebSocket.OPEN;
      openHandler?.();
      await connectPromise;

      const errorHandler = jest.fn();
      adapter.on('error', errorHandler);

      // Simulate normal close
      const closeHandler = mockWebSocket.on.mock.calls.find(
        (call) => call[0] === 'close'
      )?.[1];
      closeHandler?.(1000, Buffer.from('Normal closure'));

      // Fast-forward
      jest.advanceTimersByTime(1000);

      // Should not have reconnection error
      const reconnectErrors = errorHandler.mock.calls.filter((call) =>
        call[0].message.includes('Reconnecting')
      );
      expect(reconnectErrors).toHaveLength(0);
    });

    it('should stop reconnecting after max attempts', async () => {
      const errorHandler = jest.fn();
      adapter.on('error', errorHandler);

      // Connect first
      const connectPromise = adapter.connect();
      const openHandler = mockWebSocket.on.mock.calls.find(
        (call) => call[0] === 'open'
      )?.[1];
      mockWebSocket.readyState = WebSocket.OPEN;
      openHandler?.();
      await connectPromise;

      // Simulate multiple disconnections
      for (let i = 0; i < 5; i++) {
        const closeHandler = mockWebSocket.on.mock.calls.find(
          (call) => call[0] === 'close'
        )?.[1];
        closeHandler?.(1006, Buffer.from('Connection lost'));

        // Fast-forward to trigger each reconnect
        jest.advanceTimersByTime(60000);
      }

      // Should have max attempts error
      const maxAttemptsErrors = errorHandler.mock.calls.filter((call) =>
        call[0].message.includes('Max reconnection attempts')
      );
      expect(maxAttemptsErrors.length).toBeGreaterThan(0);
    });

    it('should use exponential backoff for reconnection', async () => {
      const errorHandler = jest.fn();
      adapter.on('error', errorHandler);

      // Connect first
      const connectPromise = adapter.connect();
      const openHandler = mockWebSocket.on.mock.calls.find(
        (call) => call[0] === 'open'
      )?.[1];
      mockWebSocket.readyState = WebSocket.OPEN;
      openHandler?.();
      await connectPromise;

      // First disconnect
      let closeHandler = mockWebSocket.on.mock.calls.find(
        (call) => call[0] === 'close'
      )?.[1];
      closeHandler?.(1006, Buffer.from('Connection lost'));

      jest.advanceTimersByTime(100);

      // Check first retry delay (100ms)
      let reconnectErrors = errorHandler.mock.calls.filter((call) =>
        call[0].message.includes('Reconnecting')
      );
      expect(reconnectErrors[0][0].message).toContain('100ms');

      // Reset and connect again
      errorHandler.mockClear();

      // Second disconnect
      closeHandler = mockWebSocket.on.mock.calls.find(
        (call) => call[0] === 'close'
      )?.[1];
      closeHandler?.(1006, Buffer.from('Connection lost'));

      jest.advanceTimersByTime(200);

      // Check second retry delay (150ms = 100 * 1.5)
      reconnectErrors = errorHandler.mock.calls.filter((call) =>
        call[0].message.includes('Reconnecting')
      );
      expect(reconnectErrors[0][0].message).toContain('150ms');
    });
  });

  describe('message queue', () => {
    it('should queue messages when disconnected', async () => {
      // Don't connect - try to send
      const sendPromise = adapter.sendMessage({
        to: 'user@s.whatsapp.net',
        content: 'Queued message',
      });

      // Connect should be triggered
      const openHandler = mockWebSocket.on.mock.calls.find(
        (call) => call[0] === 'open'
      )?.[1];
      mockWebSocket.readyState = WebSocket.OPEN;
      openHandler?.();

      const wsMessageHandler = mockWebSocket.on.mock.calls.find(
        (call) => call[0] === 'message'
      )?.[1];

      // Find the send_message request
      const sendCalls = (mockWebSocket.send as jest.Mock).mock.calls;
      const sentMessage = sendCalls
        .map((call) => JSON.parse(call[0]))
        .find((msg) => msg.type === 'send_message');

      wsMessageHandler?.(
        Buffer.from(
          JSON.stringify({
            type: 'response',
            id: sentMessage?.id,
            payload: { success: true },
          })
        )
      );

      const result = await sendPromise;
      expect(result.success).toBe(true);
    });

    it('should flush queued messages on connect', async () => {
      // Queue a message by sending raw
      await adapter.connect();

      // Stop to disconnect
      await adapter.stop();

      // The send should queue since disconnected
      // But it will auto-connect first
    });
  });

  describe('ping/pong', () => {
    it('should send ping every 30 seconds', async () => {
      const connectPromise = adapter.connect();
      const openHandler = mockWebSocket.on.mock.calls.find(
        (call) => call[0] === 'open'
      )?.[1];
      mockWebSocket.readyState = WebSocket.OPEN;
      openHandler?.();
      await connectPromise;

      jest.clearAllMocks();

      // Fast-forward 30 seconds
      jest.advanceTimersByTime(30000);

      expect(mockWebSocket.send).toHaveBeenCalled();
      const sentMessage = JSON.parse(
        (mockWebSocket.send as jest.Mock).mock.calls[0][0]
      );
      expect(sentMessage.type).toBe('ping');
    });

    it('should stop ping on disconnect', async () => {
      const connectPromise = adapter.connect();
      const openHandler = mockWebSocket.on.mock.calls.find(
        (call) => call[0] === 'open'
      )?.[1];
      mockWebSocket.readyState = WebSocket.OPEN;
      openHandler?.();
      await connectPromise;

      await adapter.stop();

      jest.clearAllMocks();

      // Fast-forward 30 seconds
      jest.advanceTimersByTime(30000);

      expect(mockWebSocket.send).not.toHaveBeenCalled();
    });
  });

  describe('stop/disconnect', () => {
    it('should stop successfully when connected', async () => {
      const connectPromise = adapter.connect();
      const openHandler = mockWebSocket.on.mock.calls.find(
        (call) => call[0] === 'open'
      )?.[1];
      mockWebSocket.readyState = WebSocket.OPEN;
      openHandler?.();
      await connectPromise;

      const result = await adapter.stop();

      expect(result.success).toBe(true);
      expect(mockWebSocket.close).toHaveBeenCalledWith(
        1000,
        'Client disconnect'
      );
      expect(adapter.getState()).toBe('disconnected');
      expect(adapter.isConnected()).toBe(false);
    });

    it('should stop successfully when not connected', async () => {
      const result = await adapter.stop();
      expect(result.success).toBe(true);
    });

    it('should disconnect as alias for stop', async () => {
      const result = await adapter.disconnect();
      expect(result.success).toBe(true);
    });

    it('should clear reconnect timer on stop', async () => {
      // Connect
      const connectPromise = adapter.connect();
      const openHandler = mockWebSocket.on.mock.calls.find(
        (call) => call[0] === 'open'
      )?.[1];
      mockWebSocket.readyState = WebSocket.OPEN;
      openHandler?.();
      await connectPromise;

      // Trigger reconnect
      const closeHandler = mockWebSocket.on.mock.calls.find(
        (call) => call[0] === 'close'
      )?.[1];
      closeHandler?.(1006, Buffer.from('Connection lost'));

      // Stop should clear the timer
      await adapter.stop();

      // Fast-forward - should not trigger any errors
      const errorHandler = jest.fn();
      adapter.on('error', errorHandler);
      jest.advanceTimersByTime(60000);

      expect(errorHandler).not.toHaveBeenCalled();
    });

    it('should handle close errors gracefully', async () => {
      const connectPromise = adapter.connect();
      const openHandler = mockWebSocket.on.mock.calls.find(
        (call) => call[0] === 'open'
      )?.[1];
      mockWebSocket.readyState = WebSocket.OPEN;
      openHandler?.();
      await connectPromise;

      // Make close throw
      (mockWebSocket.close as jest.Mock).mockImplementation(() => {
        throw new Error('Close error');
      });

      // Should not throw
      const result = await adapter.stop();
      expect(result.success).toBe(true);
    });
  });

  describe('isAvailable', () => {
    it('should return true when already connected', async () => {
      const connectPromise = adapter.connect();
      const openHandler = mockWebSocket.on.mock.calls.find(
        (call) => call[0] === 'open'
      )?.[1];
      mockWebSocket.readyState = WebSocket.OPEN;
      openHandler?.();
      await connectPromise;

      const available = await adapter.isAvailable();
      expect(available).toBe(true);
    });

    it('should attempt connection when not connected', async () => {
      const availablePromise = adapter.isAvailable();

      const openHandler = mockWebSocket.on.mock.calls.find(
        (call) => call[0] === 'open'
      )?.[1];
      mockWebSocket.readyState = WebSocket.OPEN;
      openHandler?.();

      const available = await availablePromise;
      expect(available).toBe(true);
    });

    it('should return false on connection failure', async () => {
      const availablePromise = adapter.isAvailable();

      const errorHandler = mockWebSocket.on.mock.calls.find(
        (call) => call[0] === 'error'
      )?.[1];
      errorHandler?.(new Error('Connection refused'));

      const available = await availablePromise;
      expect(available).toBe(false);
    });
  });

  describe('start', () => {
    it('should start and connect', async () => {
      const startPromise = adapter.start();

      const openHandler = mockWebSocket.on.mock.calls.find(
        (call) => call[0] === 'open'
      )?.[1];
      mockWebSocket.readyState = WebSocket.OPEN;
      openHandler?.();

      const result = await startPromise;
      expect(result.success).toBe(true);
      expect(adapter.isConnected()).toBe(true);
    });
  });

  describe('IPC connection', () => {
    it('should throw error for IPC connection', async () => {
      const ipcAdapter = new NanoClawAdapter({
        connection: {
          type: 'ipc',
          ipcPath: '/tmp/nanoclaw.sock',
        },
      });

      const result = await ipcAdapter.connect();

      expect(result.success).toBe(false);
      expect(result.error).toBe(
        'IPC connection not yet implemented. Use WebSocket.'
      );
    });
  });

  describe('event emitter typed interface', () => {
    it('should support typed on method', () => {
      const messageHandler = jest.fn();
      adapter.on('message', messageHandler);

      const message: WhatsAppMessage = {
        id: 'msg1',
        from: 'user@s.whatsapp.net',
        content: 'Test',
        timestamp: Date.now(),
      };

      (adapter as EventEmitter).emit('message', message);
      expect(messageHandler).toHaveBeenCalledWith(message);
    });

    it('should support typed once method', () => {
      const handler = jest.fn();
      adapter.once('connected', handler);

      (adapter as EventEmitter).emit('connected');
      (adapter as EventEmitter).emit('connected');

      expect(handler).toHaveBeenCalledTimes(1);
    });

    it('should support typed emit method', () => {
      const handler = jest.fn();
      adapter.on('error', handler);

      const error = new Error('Test error');
      adapter.emit('error', error);

      expect(handler).toHaveBeenCalledWith(error);
    });

    it('should emit disconnected event', async () => {
      const handler = jest.fn();
      adapter.on('disconnected', handler);

      // Connect first
      const connectPromise = adapter.connect();
      const openHandler = mockWebSocket.on.mock.calls.find(
        (call) => call[0] === 'open'
      )?.[1];
      mockWebSocket.readyState = WebSocket.OPEN;
      openHandler?.();
      await connectPromise;

      // Disconnect
      await adapter.stop();

      expect(handler).toHaveBeenCalled();
    });
  });

  describe('receiveMessages (deprecated)', () => {
    it('should return empty array', async () => {
      const messages = await adapter.receiveMessages();
      expect(Array.isArray(messages)).toBe(true);
      expect(messages).toHaveLength(0);
    });
  });

  describe('message interfaces', () => {
    it('should have correct WhatsAppMessage interface', () => {
      const message: WhatsAppMessage = {
        id: 'test-id',
        from: 'user@s.whatsapp.net',
        content: 'Hello',
        timestamp: Date.now(),
        messageType: 'text',
        groupId: 'group-123@g.us',
        senderName: 'John',
      };

      expect(message.id).toBe('test-id');
      expect(message.from).toBe('user@s.whatsapp.net');
      expect(message.content).toBe('Hello');
      expect(message.timestamp).toBeDefined();
      expect(message.messageType).toBe('text');
      expect(message.groupId).toBe('group-123@g.us');
      expect(message.senderName).toBe('John');
    });

    it('should have correct SendMessageOptions interface', () => {
      const options: SendMessageOptions = {
        to: 'user@s.whatsapp.net',
        content: 'Hello',
        messageType: 'text',
      };

      expect(options.to).toBe('user@s.whatsapp.net');
      expect(options.content).toBe('Hello');
      expect(options.messageType).toBe('text');
    });

    it('should have correct NanoClawConnectionConfig interface', () => {
      const config: NanoClawConnectionConfig = {
        type: 'websocket',
        wsUrl: 'ws://localhost:8080',
        connectTimeout: 10000,
        reconnect: {
          maxAttempts: 5,
          delay: 5000,
          backoffMultiplier: 2,
        },
      };

      expect(config.type).toBe('websocket');
      expect(config.wsUrl).toBe('ws://localhost:8080');
      expect(config.connectTimeout).toBe(10000);
      expect(config.reconnect?.maxAttempts).toBe(5);
      expect(config.reconnect?.delay).toBe(5000);
      expect(config.reconnect?.backoffMultiplier).toBe(2);
    });

    it('should have correct ConnectionState type', () => {
      const states: ConnectionState[] = [
        'disconnected',
        'connecting',
        'connected',
        'reconnecting',
      ];

      expect(states).toHaveLength(4);
    });

    it('should have correct NanoClawResult interface', () => {
      const successResult: NanoClawResult = {
        success: true,
        data: { messageId: '123' },
      };

      const errorResult: NanoClawResult = {
        success: false,
        error: 'Something went wrong',
      };

      expect(successResult.success).toBe(true);
      expect(errorResult.success).toBe(false);
    });
  });

  describe('edge cases', () => {
    it('should handle sendRaw errors', async () => {
      // Connect first
      const connectPromise = adapter.connect();
      const openHandler = mockWebSocket.on.mock.calls.find(
        (call) => call[0] === 'open'
      )?.[1];
      mockWebSocket.readyState = WebSocket.OPEN;
      openHandler?.();
      await connectPromise;

      // Make send throw
      const errorHandler = jest.fn();
      adapter.on('error', errorHandler);

      (mockWebSocket.send as jest.Mock).mockImplementation(() => {
        throw new Error('Send failed');
      });

      // Try to send - should queue and emit error
      const sendPromise = adapter.sendMessage({
        to: 'user@s.whatsapp.net',
        content: 'Test',
      });

      // Should get timeout since we can't send
      jest.advanceTimersByTime(60000);
      await sendPromise;

      expect(errorHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('Failed to send message'),
        })
      );
    });

    it('should handle null payload in messages', () => {
      const messageHandler = jest.fn();
      adapter.on('message', messageHandler);

      // Connect
      const connectPromise = adapter.connect();
      const openHandler = mockWebSocket.on.mock.calls.find(
        (call) => call[0] === 'open'
      )?.[1];
      mockWebSocket.readyState = WebSocket.OPEN;
      openHandler?.();

      const wsMessageHandler = mockWebSocket.on.mock.calls.find(
        (call) => call[0] === 'message'
      )?.[1];

      // Message with null payload
      const invalidMessage = {
        type: 'message',
        payload: null,
      };

      wsMessageHandler?.(Buffer.from(JSON.stringify(invalidMessage)));

      expect(messageHandler).not.toHaveBeenCalled();
    });

    it('should handle non-object payload in messages', () => {
      const messageHandler = jest.fn();
      adapter.on('message', messageHandler);

      // Connect
      const connectPromise = adapter.connect();
      const openHandler = mockWebSocket.on.mock.calls.find(
        (call) => call[0] === 'open'
      )?.[1];
      mockWebSocket.readyState = WebSocket.OPEN;
      openHandler?.();

      const wsMessageHandler = mockWebSocket.on.mock.calls.find(
        (call) => call[0] === 'message'
      )?.[1];

      // Message with string payload
      const invalidMessage = {
        type: 'message',
        payload: 'not an object',
      };

      wsMessageHandler?.(Buffer.from(JSON.stringify(invalidMessage)));

      expect(messageHandler).not.toHaveBeenCalled();
    });

    it('should handle function pattern that throws', async () => {
      // This test would be for router, but let's ensure adapter handles
      // incoming messages properly
      const messageHandler = jest.fn();
      adapter.on('message', messageHandler);

      // Connect
      const connectPromise = adapter.connect();
      const openHandler = mockWebSocket.on.mock.calls.find(
        (call) => call[0] === 'open'
      )?.[1];
      mockWebSocket.readyState = WebSocket.OPEN;
      openHandler?.();

      const wsMessageHandler = mockWebSocket.on.mock.calls.find(
        (call) => call[0] === 'message'
      )?.[1];

      const message = {
        type: 'message',
        payload: {
          id: 'msg-001',
          from: 'user@s.whatsapp.net',
          content: 'Hello',
          timestamp: Date.now(),
        },
      };

      wsMessageHandler?.(Buffer.from(JSON.stringify(message)));

      expect(messageHandler).toHaveBeenCalled();
    });

    it('should handle WebSocket close during send', async () => {
      // Connect
      const connectPromise = adapter.connect();
      const openHandler = mockWebSocket.on.mock.calls.find(
        (call) => call[0] === 'open'
      )?.[1];
      mockWebSocket.readyState = WebSocket.OPEN;
      openHandler?.();
      await connectPromise;

      // Simulate close
      const closeHandler = mockWebSocket.on.mock.calls.find(
        (call) => call[0] === 'close'
      )?.[1];
      closeHandler?.(1006, Buffer.from('Connection lost'));

      // Try to send after close
      mockWebSocket.readyState = WebSocket.CLOSED;

      const sendPromise = adapter.sendMessage({
        to: 'user@s.whatsapp.net',
        content: 'Test',
      });

      // Should attempt reconnect
      const newOpenHandler = mockWebSocket.on.mock.calls.find(
        (call) => call[0] === 'open'
      )?.[1];
      mockWebSocket.readyState = WebSocket.OPEN;
      newOpenHandler?.();

      const wsMessageHandler = mockWebSocket.on.mock.calls.find(
        (call) => call[0] === 'message'
      )?.[1];

      const sendCalls = (mockWebSocket.send as jest.Mock).mock.calls;
      const sentMessage = sendCalls
        .map((call) => JSON.parse(call[0]))
        .find((msg) => msg.type === 'send_message');

      wsMessageHandler?.(
        Buffer.from(
          JSON.stringify({
            type: 'response',
            id: sentMessage?.id,
            payload: { success: true },
          })
        )
      );

      const result = await sendPromise;
      expect(result.success).toBe(true);
    });

    it('should cap reconnection delay at 60 seconds', async () => {
      const errorHandler = jest.fn();
      adapter.on('error', errorHandler);

      // Connect
      const connectPromise = adapter.connect();
      const openHandler = mockWebSocket.on.mock.calls.find(
        (call) => call[0] === 'open'
      )?.[1];
      mockWebSocket.readyState = WebSocket.OPEN;
      openHandler?.();
      await connectPromise;

      // Trigger multiple reconnects
      for (let i = 0; i < 10; i++) {
        const closeHandler = mockWebSocket.on.mock.calls.find(
          (call) => call[0] === 'close'
        )?.[1];
        closeHandler?.(1006, Buffer.from('Connection lost'));
        jest.advanceTimersByTime(60000);
      }

      // Check that delays are capped
      const reconnectErrors = errorHandler.mock.calls.filter((call) =>
        call[0].message.includes('Reconnecting')
      );

      // The delay should never exceed 60000ms
      reconnectErrors.forEach((call) => {
        const match = call[0].message.match(/(\d+)ms/);
        if (match) {
          const delay = parseInt(match[1], 10);
          expect(delay).toBeLessThanOrEqual(60000);
        }
      });
    });
  });
});
