/**
 * A2A/GEP Protocol Tests
 */

import { A2AProtocol, GEPProtocol } from '../../src/network/protocol.js';

describe('A2AProtocol', () => {
  describe('createMessage', () => {
    it('should create a valid message', () => {
      const message = A2AProtocol.createMessage(
        'greeting',
        'agent-1',
        'agent-2',
        { test: 'data' }
      );

      expect(message.version).toBe('1.0.0');
      expect(message.type).toBe('greeting');
      expect(message.from).toBe('agent-1');
      expect(message.to).toBe('agent-2');
      expect(message.payload).toEqual({ test: 'data' });
      expect(message.timestamp).toBeGreaterThan(0);
      expect(message.messageId).toMatch(/^msg-/);
    });
  });

  describe('createGreeting', () => {
    it('should create a greeting message', () => {
      const nodeInfo = {
        id: 'node-1',
        name: 'Test Node',
        version: '1.0.0',
        capabilities: ['test'],
        endpoint: 'http://localhost:3000',
        lastSeen: Date.now(),
      };

      const message = A2AProtocol.createGreeting('agent-1', 'hub', nodeInfo);

      expect(message.type).toBe('greeting');
      expect(message.payload).toEqual(nodeInfo);
    });
  });

  describe('createGeneShare', () => {
    it('should create a gene share message', () => {
      const genes = [
        {
          version: '1.0.0',
          geneId: 'gene-1',
          geneType: 'behavior' as const,
          data: 'test-data',
          metadata: { fitness: 0.9, generation: 1, parents: [], checksum: 'abc' },
          timestamp: Date.now(),
        },
      ];

      const message = A2AProtocol.createGeneShare('agent-1', 'hub', genes, true);

      expect(message.type).toBe('gene_share');
      expect((message.payload as { genes: typeof genes }).genes).toEqual(genes);
      expect((message.payload as { requireAck: boolean }).requireAck).toBe(true);
    });
  });

  describe('createGeneRequest', () => {
    it('should create a gene request message', () => {
      const request = {
        types: ['behavior' as const],
        minFitness: 0.8,
        limit: 10,
      };

      const message = A2AProtocol.createGeneRequest('agent-1', 'hub', request);

      expect(message.type).toBe('gene_request');
      expect(message.payload).toEqual(request);
    });
  });

  describe('createTaskDelegate', () => {
    it('should create a task delegate message', () => {
      const task = {
        taskId: 'task-1',
        description: 'Test task',
        requiredCapabilities: ['code'],
        priority: 5,
      };

      const message = A2AProtocol.createTaskDelegate('agent-1', 'agent-2', task);

      expect(message.type).toBe('task_delegate');
      expect(message.payload).toEqual(task);
    });
  });

  describe('createHeartbeat', () => {
    it('should create a heartbeat message', () => {
      const message = A2AProtocol.createHeartbeat('agent-1', 'hub');

      expect(message.type).toBe('heartbeat');
      expect(message.payload).toHaveProperty('timestamp');
    });
  });

  describe('validate', () => {
    it('should validate a correct message', () => {
      const message = A2AProtocol.createMessage('greeting', 'a', 'b', {});

      expect(A2AProtocol.validate(message)).toBe(true);
    });

    it('should reject invalid messages', () => {
      expect(
        A2AProtocol.validate({
          version: '',
          type: 'greeting',
          from: 'a',
          to: 'b',
          payload: {},
          timestamp: 0,
          messageId: '',
        })
      ).toBe(false);
    });
  });
});

describe('GEPProtocol', () => {
  describe('createPacket', () => {
    it('should create a valid packet', () => {
      const packet = GEPProtocol.createPacket('gene-1', 'behavior', 'test-data', {
        fitness: 0.9,
        generation: 1,
        parents: ['parent-1'],
      });

      expect(packet.version).toBe('1.0.0');
      expect(packet.geneId).toBe('gene-1');
      expect(packet.geneType).toBe('behavior');
      expect(packet.data).toBe('test-data');
      expect(packet.metadata.fitness).toBe(0.9);
      expect(packet.metadata.generation).toBe(1);
      expect(packet.metadata.parents).toContain('parent-1');
      expect(packet.metadata.checksum).toBeDefined();
      expect(packet.timestamp).toBeGreaterThan(0);
    });
  });

  describe('validate', () => {
    it('should validate a correct packet', () => {
      const packet = GEPProtocol.createPacket('gene-1', 'behavior', 'data', {
        fitness: 0.9,
        generation: 1,
        parents: [],
      });

      expect(GEPProtocol.validate(packet)).toBe(true);
    });

    it('should reject packets with invalid checksum', () => {
      const packet = GEPProtocol.createPacket('gene-1', 'behavior', 'data', {
        fitness: 0.9,
        generation: 1,
        parents: [],
      });

      // Modify checksum
      packet.metadata.checksum = 'invalid';

      expect(GEPProtocol.validate(packet)).toBe(false);
    });

    it('should reject invalid packets', () => {
      expect(
        GEPProtocol.validate({
          version: '',
          geneId: '',
          geneType: 'behavior',
          data: '',
          metadata: { fitness: 0, generation: 0, parents: [], checksum: '' },
          timestamp: 0,
        })
      ).toBe(false);
    });
  });
});
