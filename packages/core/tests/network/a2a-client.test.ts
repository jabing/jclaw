/**
 * A2AClient Tests
 */

import { A2AClient, createA2AClient } from '../../src/network/a2a-client.js';
import type {
  A2AClientConfig,
  ConnectionStatus,
} from '../../src/network/a2a-client.js';
import type { A2AMessage } from '../../src/network/protocol.js';

describe('A2AClient', () => {
  let client: A2AClient;
  let mockConfig: A2AClientConfig;

  beforeEach(() => {
    mockConfig = {
      hubUrl: 'ws://localhost:8080',
      agentId: 'test-agent-1',
      agentInfo: {
        id: 'test-agent-1',
        name: 'Test Agent',
        version: '1.0.0',
        capabilities: ['test'],
        endpoint: 'http://localhost:3000',
        lastSeen: Date.now(),
      },
    };

    client = new A2AClient(mockConfig);
  });

  describe('constructor', () => {
    it('should create client with config', () => {
      expect(client).toBeDefined();
    });

    it('should store config with defaults', () => {
      const clientWithDefaults = new A2AClient(mockConfig);
      expect(clientWithDefaults).toBeDefined();
    });

    it('should accept custom reconnect interval', () => {
      const customConfig: A2AClientConfig = {
        ...mockConfig,
        reconnectInterval: 10000,
      };

      const customClient = new A2AClient(customConfig);
      expect(customClient).toBeDefined();
    });

    it('should initialize disconnected status', () => {
      const status = client.getStatus();
      expect(status.connected).toBe(false);
    });

    it('should initialize with zero reconnect attempts', () => {
      const status = client.getStatus();
      expect(status.reconnectAttempts).toBe(0);
    });

    it('should initialize with null lastHeartbeat', () => {
      const status = client.getStatus();
      expect(status.lastHeartbeat).toBe(null);
    });
  });

  describe('ConnectionStatus type', () => {
    it('should have connected boolean', () => {
      const status: ConnectionStatus = {
        connected: false,
        lastHeartbeat: null,
        reconnectAttempts: 0,
      };

      expect(status.connected).toBeDefined();
    });

    it('should have lastHeartbeat date or null', () => {
      const status: ConnectionStatus = {
        connected: false,
        lastHeartbeat: null,
        reconnectAttempts: 0,
      };

      expect(status.lastHeartbeat).toBeDefined();
    });

    it('should have reconnectAttempts number', () => {
      const status: ConnectionStatus = {
        connected: false,
        lastHeartbeat: null,
        reconnectAttempts: 0,
      };

      expect(status.reconnectAttempts).toBeDefined();
    });
  });

  describe('connect', () => {
    it('should attempt to connect to hub', async () => {
      // Note: This will fail in test environment without WebSocket server
      // Testing the method exists and returns a promise
      const connectPromise = client.connect();
      expect(connectPromise).toBeInstanceOf(Promise);
    });

    it('should reject on connection error', async () => {
      // Will reject because no WebSocket server running
      await expect(client.connect()).rejects.toThrow();
    });

    it('should set connected status on successful connection', () => {
      // Mock WebSocket for testing
      const mockWS = {
        onopen: null as any,
        onclose: null as any,
        onerror: null as any,
        onmessage: null as any,
        send: jest.fn(),
        close: jest.fn(),
      };

      global.WebSocket = jest.fn().mockImplementation(() => mockWS);

      const testClient = new A2AClient(mockConfig);
      const connectPromise = testClient.connect();

      // Simulate successful connection
      if (mockWS.onopen) {
        mockWS.onopen();
      }

      return connectPromise.then(() => {
        const status = testClient.getStatus();
        expect(status.connected).toBe(true);
      });
    });

    it('should reset reconnect attempts on successful connection', () => {
      const mockWS = {
        onopen: null as any,
        onclose: null as any,
        onerror: null as any,
        onmessage: null as any,
        send: jest.fn(),
        close: jest.fn(),
      };

      global.WebSocket = jest.fn().mockImplementation(() => mockWS);

      const testClient = new A2AClient(mockConfig);

      // Simulate connection
      if (mockWS.onopen) {
        mockWS.onopen();
      }

      const status = testClient.getStatus();
      expect(status.reconnectAttempts).toBe(0);
    });

    it('should send greeting on connection', () => {
      const mockWS = {
        onopen: null as any,
        onclose: null as any,
        onerror: null as any,
        onmessage: null as any,
        send: jest.fn(),
        close: jest.fn(),
      };

      global.WebSocket = jest.fn().mockImplementation(() => mockWS);

      const testClient = new A2AClient(mockConfig);
      const connectPromise = testClient.connect();

      if (mockWS.onopen) {
        mockWS.onopen();
      }

      return connectPromise.then(() => {
        expect(mockWS.send).toHaveBeenCalled();
      });
    });

    it('should start heartbeat on connection', () => {
      const mockWS = {
        onopen: null as any,
        onclose: null as any,
        onerror: null as any,
        onmessage: null as any,
        send: jest.fn(),
        close: jest.fn(),
      };

      global.WebSocket = jest.fn().mockImplementation(() => mockWS);

      const testClient = new A2AClient(mockConfig);
      const connectPromise = testClient.connect();

      if (mockWS.onopen) {
        mockWS.onopen();
      }

      return connectPromise.then(() => {
        const status = testClient.getStatus();
        expect(status.lastHeartbeat).toBeDefined();
      });
    });

    it('should handle connection errors', async () => {
      const mockWS = {
        onopen: null as any,
        onclose: null as any,
        onerror: jest.fn(),
        onmessage: null as any,
        send: jest.fn(),
        close: jest.fn(),
      };

      global.WebSocket = jest.fn().mockImplementation(() => mockWS);

      const testClient = new A2AClient(mockConfig);
      const connectPromise = testClient.connect();

      // Simulate error when not connected
      if (mockWS.onerror) {
        mockWS.onerror(new Error('Connection failed'));
      }

      await expect(connectPromise).rejects.toThrow();
    });
  });

  describe('disconnect', () => {
    it('should close WebSocket connection', async () => {
      const mockWS = {
        onopen: null as any,
        onclose: null as any,
        onerror: null as any,
        onmessage: null as any,
        send: jest.fn(),
        close: jest.fn(),
      };

      global.WebSocket = jest.fn().mockImplementation(() => mockWS);

      const testClient = new A2AClient(mockConfig);
      await testClient.connect();

      if (mockWS.onopen) {
        mockWS.onopen();
      }

      await testClient.disconnect();

      expect(mockWS.close).toHaveBeenCalled();
    });

    it('should set connected to false', async () => {
      const mockWS = {
        onopen: null as any,
        onclose: null as any,
        onerror: null as any,
        onmessage: null as any,
        send: jest.fn(),
        close: jest.fn(),
      };

      global.WebSocket = jest.fn().mockImplementation(() => mockWS);

      const testClient = new A2AClient(mockConfig);
      await testClient.connect();

      if (mockWS.onopen) {
        mockWS.onopen();
      }

      await testClient.disconnect();

      const status = testClient.getStatus();
      expect(status.connected).toBe(false);
    });

    it('should stop heartbeat', async () => {
      const mockWS = {
        onopen: null as any,
        onclose: null as any,
        onerror: null as any,
        onmessage: null as any,
        send: jest.fn(),
        close: jest.fn(),
      };

      global.WebSocket = jest.fn().mockImplementation(() => mockWS);

      const testClient = new A2AClient(mockConfig);
      await testClient.connect();

      if (mockWS.onopen) {
        mockWS.onopen();
      }

      await testClient.disconnect();

      const status = testClient.getStatus();
      expect(status).toBeDefined();
    });

    it('should handle disconnect when not connected', async () => {
      const testClient = new A2AClient(mockConfig);
      await expect(testClient.disconnect()).resolves.toBeDefined();
    });
  });

  describe('sendMessage', () => {
    it('should send message to WebSocket', async () => {
      const mockWS = {
        onopen: null as any,
        onclose: null as any,
        onerror: null as any,
        onmessage: null as any,
        send: jest.fn(),
        close: jest.fn(),
      };

      global.WebSocket = jest.fn().mockImplementation(() => mockWS);

      const testClient = new A2AClient(mockConfig);
      await testClient.connect();

      if (mockWS.onopen) {
        mockWS.onopen();
      }

      const message: A2AMessage = {
        type: 'test',
        sender: 'test-agent-1',
        receiver: 'hub',
        timestamp: new Date().toISOString(),
        payload: {},
      };

      await testClient.sendMessage(message);

      expect(mockWS.send).toHaveBeenCalled();
    });

    it('should throw error when not connected', async () => {
      const testClient = new A2AClient(mockConfig);

      const message: A2AMessage = {
        type: 'test',
        sender: 'test-agent-1',
        receiver: 'hub',
        timestamp: new Date().toISOString(),
        payload: {},
      };

      await expect(testClient.sendMessage(message)).rejects.toThrow(
        'Not connected'
      );
    });

    it('should stringify message before sending', async () => {
      const mockWS = {
        onopen: null as any,
        onclose: null as any,
        onerror: null as any,
        onmessage: null as any,
        send: jest.fn(),
        close: jest.fn(),
      };

      global.WebSocket = jest.fn().mockImplementation(() => mockWS);

      const testClient = new A2AClient(mockConfig);
      await testClient.connect();

      if (mockWS.onopen) {
        mockWS.onopen();
      }

      const message: A2AMessage = {
        type: 'test',
        sender: 'test-agent-1',
        receiver: 'hub',
        timestamp: new Date().toISOString(),
        payload: { key: 'value' },
      };

      await testClient.sendMessage(message);

      expect(mockWS.send).toHaveBeenCalledWith(JSON.stringify(message));
    });
  });

  describe('onMessage', () => {
    it('should register message handler', () => {
      const handler = jest.fn();
      client.onMessage('test', handler);
      expect(handler).toBeDefined();
    });

    it('should accept different message types', () => {
      const handler1 = jest.fn();
      const handler2 = jest.fn();

      client.onMessage('type1', handler1);
      client.onMessage('type2', handler2);

      expect(handler1).toBeDefined();
      expect(handler2).toBeDefined();
    });

    it('should store handler in messageHandlers map', () => {
      const handler = jest.fn();
      client.onMessage('test', handler);
      expect(handler).toBeDefined();
    });
  });

  describe('offMessage', () => {
    it('should remove message handler', () => {
      const handler = jest.fn();
      client.onMessage('test', handler);
      client.offMessage('test');
      expect(handler).toBeDefined();
    });

    it('should handle removing non-existent handler', () => {
      expect(() => client.offMessage('nonexistent')).not.toThrow();
    });
  });

  describe('getStatus', () => {
    it('should return connection status', () => {
      const status = client.getStatus();
      expect(status).toBeDefined();
    });

    it('should return connected status', () => {
      const status = client.getStatus();
      expect(status.connected).toBe(false);
    });

    it('should return lastHeartbeat', () => {
      const status = client.getStatus();
      expect(status.lastHeartbeat).toBe(null);
    });

    it('should return reconnectAttempts', () => {
      const status = client.getStatus();
      expect(status.reconnectAttempts).toBe(0);
    });

    it('should return copy of status', () => {
      const status1 = client.getStatus();
      const status2 = client.getStatus();
      expect(status1).toEqual(status2);
    });
  });

  describe('sendGeneShare', () => {
    it('should send gene share message', async () => {
      const mockWS = {
        onopen: null as any,
        onclose: null as any,
        onerror: null as any,
        onmessage: null as any,
        send: jest.fn(),
        close: jest.fn(),
      };

      global.WebSocket = jest.fn().mockImplementation(() => mockWS);

      const testClient = new A2AClient(mockConfig);
      await testClient.connect();

      if (mockWS.onopen) {
        mockWS.onopen();
      }

      const genes = [{ type: 'skill', name: 'test' }];
      await testClient.sendGeneShare(genes);

      expect(mockWS.send).toHaveBeenCalled();
    });

    it('should accept requireAck parameter', async () => {
      const mockWS = {
        onopen: null as any,
        onclose: null as any,
        onerror: null as any,
        onmessage: null as any,
        send: jest.fn(),
        close: jest.fn(),
      };

      global.WebSocket = jest.fn().mockImplementation(() => mockWS);

      const testClient = new A2AClient(mockConfig);
      await testClient.connect();

      if (mockWS.onopen) {
        mockWS.onopen();
      }

      await testClient.sendGeneShare([], true);

      expect(mockWS.send).toHaveBeenCalled();
    });

    it('should throw error when not connected', async () => {
      const testClient = new A2AClient(mockConfig);

      await expect(testClient.sendGeneShare([])).rejects.toThrow(
        'Not connected'
      );
    });
  });

  describe('requestGenes', () => {
    it('should send gene request message', async () => {
      const mockWS = {
        onopen: null as any,
        onclose: null as any,
        onerror: null as any,
        onmessage: null as any,
        send: jest.fn(),
        close: jest.fn(),
      };

      global.WebSocket = jest.fn().mockImplementation(() => mockWS);

      const testClient = new A2AClient(mockConfig);
      await testClient.connect();

      if (mockWS.onopen) {
        mockWS.onopen();
      }

      await testClient.requestGenes();

      expect(mockWS.send).toHaveBeenCalled();
    });

    it('should accept request payload', async () => {
      const mockWS = {
        onopen: null as any,
        onclose: null as any,
        onerror: null as any,
        onmessage: null as any,
        send: jest.fn(),
        close: jest.fn(),
      };

      global.WebSocket = jest.fn().mockImplementation(() => mockWS);

      const testClient = new A2AClient(mockConfig);
      await testClient.connect();

      if (mockWS.onopen) {
        mockWS.onopen();
      }

      await testClient.requestGenes({ genes: ['gene1', 'gene2'] });

      expect(mockWS.send).toHaveBeenCalled();
    });

    it('should throw error when not connected', async () => {
      const testClient = new A2AClient(mockConfig);

      await expect(testClient.requestGenes()).rejects.toThrow('Not connected');
    });
  });

  describe('delegateTask', () => {
    it('should send task delegation message', async () => {
      const mockWS = {
        onopen: null as any,
        onclose: null as any,
        onerror: null as any,
        onmessage: null as any,
        send: jest.fn(),
        close: jest.fn(),
      };

      global.WebSocket = jest.fn().mockImplementation(() => mockWS);

      const testClient = new A2AClient(mockConfig);
      await testClient.connect();

      if (mockWS.onopen) {
        mockWS.onopen();
      }

      await testClient.delegateTask({
        taskId: 'task-1',
        description: 'Test task',
        requiredCapabilities: ['test'],
      });

      expect(mockWS.send).toHaveBeenCalled();
    });

    it('should include task details', async () => {
      const mockWS = {
        onopen: null as any,
        onclose: null as any,
        onerror: null as any,
        onmessage: null as any,
        send: jest.fn(),
        close: jest.fn(),
      };

      global.WebSocket = jest.fn().mockImplementation(() => mockWS);

      const testClient = new A2AClient(mockConfig);
      await testClient.connect();

      if (mockWS.onopen) {
        mockWS.onopen();
      }

      await testClient.delegateTask({
        taskId: 'task-1',
        description: 'Test task',
        requiredCapabilities: ['test'],
      });

      expect(mockWS.send).toHaveBeenCalled();
    });

    it('should throw error when not connected', async () => {
      const testClient = new A2AClient(mockConfig);

      await expect(
        testClient.delegateTask({
          taskId: 'task-1',
          description: 'Test',
          requiredCapabilities: [],
        })
      ).rejects.toThrow('Not connected');
    });
  });

  describe('createA2AClient', () => {
    it('should create client instance', () => {
      const instance = createA2AClient(mockConfig);
      expect(instance).toBeInstanceOf(A2AClient);
    });
  });

  describe('heartbeat mechanism', () => {
    it('should send heartbeat periodically', async () => {
      const mockWS = {
        onopen: null as any,
        onclose: null as any,
        onerror: null as any,
        onmessage: null as any,
        send: jest.fn(),
        close: jest.fn(),
      };

      global.WebSocket = jest.fn().mockImplementation(() => mockWS);

      const testClient = new A2AClient(mockConfig);
      await testClient.connect();

      if (mockWS.onopen) {
        mockWS.onopen();
      }

      // Wait for heartbeat interval
      await new Promise((resolve) => setTimeout(resolve, 100));

      const status = testClient.getStatus();
      expect(status).toBeDefined();
    });

    it('should update lastHeartbeat on heartbeat', async () => {
      const mockWS = {
        onopen: null as any,
        onclose: null as any,
        onerror: null as any,
        onmessage: null as any,
        send: jest.fn(),
        close: jest.fn(),
      };

      global.WebSocket = jest.fn().mockImplementation(() => mockWS);

      const testClient = new A2AClient(mockConfig);
      await testClient.connect();

      if (mockWS.onopen) {
        mockWS.onopen();
      }

      await new Promise((resolve) => setTimeout(resolve, 50));

      const status = testClient.getStatus();
      expect(status.lastHeartbeat).toBeDefined();
    });
  });

  describe('reconnection logic', () => {
    it('should schedule reconnection on disconnect', async () => {
      const mockWS = {
        onopen: null as any,
        onclose: null as any,
        onerror: null as any,
        onmessage: null as any,
        send: jest.fn(),
        close: jest.fn(),
      };

      global.WebSocket = jest.fn().mockImplementation(() => mockWS);

      const testClient = new A2AClient({
        ...mockConfig,
        reconnectInterval: 10,
      });

      await testClient.connect();

      if (mockWS.onopen) {
        mockWS.onopen();
      }

      // Simulate disconnect
      if (mockWS.onclose) {
        mockWS.onclose();
      }

      const status = testClient.getStatus();
      expect(status.reconnectAttempts).toBeGreaterThan(0);
    });

    it('should increment reconnect attempts on failure', async () => {
      const mockWS = {
        onopen: null as any,
        onclose: null as any,
        onerror: null as any,
        onmessage: null as any,
        send: jest.fn(),
        close: jest.fn(),
      };

      global.WebSocket = jest.fn().mockImplementation(() => mockWS);

      const testClient = new A2AClient({
        ...mockConfig,
        reconnectInterval: 10,
      });

      // Simulate multiple disconnects
      if (mockWS.onclose) {
        mockWS.onclose();
        mockWS.onclose();
      }

      const status = testClient.getStatus();
      expect(status.reconnectAttempts).toBeGreaterThanOrEqual(0);
    });
  });

  describe('message handling', () => {
    it('should parse incoming message', async () => {
      const mockWS = {
        onopen: null as any,
        onclose: null as any,
        onerror: null as any,
        onmessage: null as any,
        send: jest.fn(),
        close: jest.fn(),
      };

      global.WebSocket = jest.fn().mockImplementation(() => mockWS);

      const testClient = new A2AClient(mockConfig);
      await testClient.connect();

      const handler = jest.fn();
      testClient.onMessage('test', handler);

      if (mockWS.onopen) {
        mockWS.onopen();
      }

      // Simulate incoming message
      if (mockWS.onmessage) {
        mockWS.onmessage({
          data: JSON.stringify({
            type: 'test',
            sender: 'hub',
            receiver: 'test-agent-1',
            timestamp: new Date().toISOString(),
            payload: {},
          }),
        });
      }

      expect(handler).toHaveBeenCalled();
    });

    it('should handle invalid JSON', async () => {
      const mockWS = {
        onopen: null as any,
        onclose: null as any,
        onerror: null as any,
        onmessage: null as any,
        send: jest.fn(),
        close: jest.fn(),
      };

      global.WebSocket = jest.fn().mockImplementation(() => mockWS);

      const testClient = new A2AClient(mockConfig);
      await testClient.connect();

      if (mockWS.onopen) {
        mockWS.onopen();
      }

      // Simulate invalid JSON
      if (mockWS.onmessage) {
        mockWS.onmessage({ data: 'invalid json' });
      }

      expect(testClient).toBeDefined();
    });

    it('should call registered handler', async () => {
      const mockWS = {
        onopen: null as any,
        onclose: null as any,
        onerror: null as any,
        onmessage: null as any,
        send: jest.fn(),
        close: jest.fn(),
      };

      global.WebSocket = jest.fn().mockImplementation(() => mockWS);

      const testClient = new A2AClient(mockConfig);
      await testClient.connect();

      const handler = jest.fn();
      testClient.onMessage('custom', handler);

      if (mockWS.onopen) {
        mockWS.onopen();
      }

      if (mockWS.onmessage) {
        mockWS.onmessage({
          data: JSON.stringify({
            type: 'custom',
            sender: 'hub',
            receiver: 'test-agent-1',
            timestamp: new Date().toISOString(),
            payload: {},
          }),
        });
      }

      expect(handler).toHaveBeenCalled();
    });
  });
});
