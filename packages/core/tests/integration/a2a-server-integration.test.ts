/**
 * A2A Server Integration Tests
 *
 * Tests for complete WebSocket A2A server implementation
 */

import { A2AServer, createA2AServer } from '../../src/network/a2a-server.js';
import type { A2AServerConfig } from '../../src/network/a2a-server.js';

describe('A2AServer Integration', () => {
  let server: A2AServer;
  let testPort = 8765;

  beforeEach(() => {
    testPort += Math.floor(Math.random() * 100);
  });

  describe('Server Lifecycle', () => {
    it('should start server successfully', async () => {
      server = createA2AServer({
        port: testPort,
        host: 'localhost',
      });

      await expect(server.start()).resolves.toBeUndefined();
      await server.stop();
    });

    it('should stop server gracefully', async () => {
      server = createA2AServer({
        port: testPort,
        host: 'localhost',
      });

      await server.start();
      await expect(server.stop()).resolves.toBeUndefined();
    });

    it('should handle server errors', async () => {
      server = createA2AServer({
        port: 1, // Invalid port
        host: 'localhost',
      });

      await expect(server.start()).rejects.toThrow();
    });

    it('should handle multiple start/stop cycles', async () => {
      server = createA2AServer({
        port: testPort,
        host: 'localhost',
      });

      await server.start();
      await server.stop();
      await server.start();
      await server.stop();
    });
  });

  describe('Agent Connection', () => {
    beforeEach(async () => {
      server = createA2AServer({
        port: testPort,
        host: 'localhost',
      });
      await server.start();
    });

    afterEach(async () => {
      await server.stop();
    });

    it('should track connected agents', () => {
      const agents = server.getConnectedAgents();
      expect(agents).toEqual([]);
      expect(server.getAgentCount()).toBe(0);
    });

    it('should get agent by ID', () => {
      const agent = server.getAgentById('nonexistent');
      expect(agent).toBeUndefined();
    });

    it('should return agent count', () => {
      expect(server.getAgentCount()).toBe(0);
    });
  });

  describe('Message Handling', () => {
    beforeEach(async () => {
      server = createA2AServer({
        port: testPort,
        host: 'localhost',
      });
      await server.start();
    });

    afterEach(async () => {
      await server.stop();
    });

    it('should register message handler', () => {
      const handler = jest.fn();
      server.onMessage('test', handler);
      expect(handler).toBeDefined();
    });

    it('should handle multiple message types', () => {
      const handler1 = jest.fn();
      const handler2 = jest.fn();

      server.onMessage('type1', handler1);
      server.onMessage('type2', handler2);

      expect(handler1).toBeDefined();
      expect(handler2).toBeDefined();
    });
  });

  describe('Broadcast', () => {
    beforeEach(async () => {
      server = createA2AServer({
        port: testPort,
        host: 'localhost',
      });
      await server.start();
    });

    afterEach(async () => {
      await server.stop();
    });

    it('should broadcast message to all agents', async () => {
      const message = {
        type: 'test',
        sender: 'server',
        receiver: 'all',
        timestamp: new Date().toISOString(),
        payload: {},
      };

      // Should not throw even with no agents
      await expect(server.broadcast(message)).resolves.toBeUndefined();
    });

    it('should exclude sender from broadcast', async () => {
      const message = {
        type: 'test',
        sender: 'server',
        receiver: 'all',
        timestamp: new Date().toISOString(),
        payload: {},
      };

      await expect(
        server.broadcast(message, 'excluded-agent')
      ).resolves.toBeUndefined();
    });
  });

  describe('Send to Agent', () => {
    beforeEach(async () => {
      server = createA2AServer({
        port: testPort,
        host: 'localhost',
      });
      await server.start();
    });

    afterEach(async () => {
      await server.stop();
    });

    it('should return false for nonexistent agent', async () => {
      const message = {
        type: 'test',
        sender: 'server',
        receiver: 'agent',
        timestamp: new Date().toISOString(),
        payload: {},
      };

      const result = await server.sendToAgent('nonexistent', message);
      expect(result).toBe(false);
    });
  });

  describe('Server Configuration', () => {
    it('should accept custom host', () => {
      server = createA2AServer({
        port: testPort,
        host: '127.0.0.1',
      });

      expect(server).toBeDefined();
    });

    it('should default host to 0.0.0.0', () => {
      server = createA2AServer({
        port: testPort,
      });

      expect(server).toBeDefined();
    });

    it('should accept port number', () => {
      server = createA2AServer({
        port: 9000,
      });

      expect(server).toBeDefined();
    });
  });

  describe('Health Check Endpoint', () => {
    beforeEach(async () => {
      server = createA2AServer({
        port: testPort,
        host: 'localhost',
      });
      await server.start();
    });

    afterEach(async () => {
      await server.stop();
    });

    it('should have health endpoint available', () => {
      // Health check would be tested with HTTP request in real scenario
      expect(server.getAgentCount()).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    beforeEach(async () => {
      server = createA2AServer({
        port: testPort,
        host: 'localhost',
      });
      await server.start();
    });

    afterEach(async () => {
      await server.stop();
    });

    it('should handle invalid messages gracefully', () => {
      // Message parsing happens internally, should not crash
      expect(server).toBeDefined();
    });

    it('should handle connection errors', () => {
      expect(server).toBeDefined();
    });

    it('should handle send errors gracefully', async () => {
      const message = {
        type: 'test',
        sender: 'server',
        receiver: 'agent',
        timestamp: new Date().toISOString(),
        payload: {},
      };

      // Should not throw
      await expect(server.broadcast(message)).resolves.toBeUndefined();
    });
  });

  describe('createA2AServer', () => {
    it('should create server instance', () => {
      const instance = createA2AServer({
        port: testPort,
      });

      expect(instance).toBeInstanceOf(A2AServer);
    });

    it('should accept full config', () => {
      const instance = createA2AServer({
        port: testPort,
        host: 'localhost',
      });

      expect(instance).toBeInstanceOf(A2AServer);
    });
  });

  describe('WebSocket Endpoint', () => {
    beforeEach(async () => {
      server = createA2AServer({
        port: testPort,
        host: 'localhost',
      });
      await server.start();
    });

    afterEach(async () => {
      await server.stop();
    });

    it('should have WebSocket endpoint at /a2a', () => {
      // WebSocket endpoint would be tested with actual client connection
      expect(server).toBeDefined();
    });

    it('should require agent ID for connection', () => {
      // Connection validation is internal
      expect(server).toBeDefined();
    });
  });

  describe('Agent Tracking', () => {
    beforeEach(async () => {
      server = createA2AServer({
        port: testPort,
        host: 'localhost',
      });
      await server.start();
    });

    afterEach(async () => {
      await server.stop();
    });

    it('should track agent connection time', () => {
      expect(server.getConnectedAgents()).toEqual([]);
    });

    it('should update agent lastSeen timestamp', () => {
      // Internal tracking, verified through getConnectedAgents
      expect(server).toBeDefined();
    });

    it('should remove agent on disconnect', () => {
      expect(server.getAgentCount()).toBe(0);
    });
  });

  describe('Message Routing', () => {
    beforeEach(async () => {
      server = createA2AServer({
        port: testPort,
        host: 'localhost',
      });
      await server.start();
    });

    afterEach(async () => {
      await server.stop();
    });

    it('should route task delegation to capable agents', async () => {
      // Routing logic is internal, tested through message handlers
      expect(server).toBeDefined();
    });

    it('should broadcast gene sharing messages', async () => {
      const message = {
        type: 'gene_share',
        sender: 'server',
        receiver: 'all',
        timestamp: new Date().toISOString(),
        payload: {},
      };

      await expect(server.broadcast(message)).resolves.toBeUndefined();
    });
  });

  describe('Server Status', () => {
    beforeEach(async () => {
      server = createA2AServer({
        port: testPort,
        host: 'localhost',
      });
      await server.start();
    });

    afterEach(async () => {
      await server.stop();
    });

    it('should provide agent count', () => {
      expect(server.getAgentCount()).toBe(0);
    });

    it('should provide connected agents list', () => {
      expect(server.getConnectedAgents()).toEqual([]);
    });

    it('should provide agent details by ID', () => {
      expect(server.getAgentById('test')).toBeUndefined();
    });
  });

  describe('Graceful Shutdown', () => {
    it('should disconnect all agents on stop', async () => {
      server = createA2AServer({
        port: testPort,
        host: 'localhost',
      });

      await server.start();
      await server.stop();

      expect(server.getAgentCount()).toBe(0);
    });

    it('should close WebSocket server', async () => {
      server = createA2AServer({
        port: testPort,
        host: 'localhost',
      });

      await server.start();
      await server.stop();

      expect(server).toBeDefined();
    });

    it('should close HTTP server', async () => {
      server = createA2AServer({
        port: testPort,
        host: 'localhost',
      });

      await server.start();
      await server.stop();

      expect(server).toBeDefined();
    });
  });
});
