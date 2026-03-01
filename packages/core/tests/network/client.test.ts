/**
 * EvoMap Client Tests
 */

import { EvoMapClient, createEvoMapClient } from '../../src/network/client.js';
import type { Gene } from '../../src/evolution/types.js';

describe('EvoMapClient', () => {
  const mockConfig = {
    hubUrl: 'https://evomap.test/api',
    nodeId: 'test-node-1',
    nodeName: 'Test Node',
    capabilities: ['test'],
  };

  beforeEach(() => {
    // Mock fetch
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({}),
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('constructor', () => {
    it('should create client with config', () => {
      const client = new EvoMapClient(mockConfig);
      expect(client).toBeDefined();
      expect(client.nodeInfo.id).toBe('test-node-1');
      expect(client.nodeInfo.name).toBe('Test Node');
    });

    it('should apply default values', () => {
      const client = new EvoMapClient({ hubUrl: 'http://test', nodeId: 'node-1' });
      expect(client.nodeInfo.name).toBe('JClaw-Agent');
    });
  });

  describe('createEvoMapClient', () => {
    it('should create client instance', () => {
      const client = createEvoMapClient(mockConfig);
      expect(client).toBeInstanceOf(EvoMapClient);
    });
  });

  describe('register', () => {
    it('should register with hub', async () => {
      const client = new EvoMapClient(mockConfig);

      await client.register();

      expect(client.isRegistered()).toBe(true);
      expect(global.fetch).toHaveBeenCalledWith(
        'https://evomap.test/api/register',
        expect.objectContaining({ method: 'POST' })
      );
    });

    it('should throw on registration failure', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 500,
      });

      const client = new EvoMapClient(mockConfig);

      await expect(client.register()).rejects.toThrow('Registration failed');
    });
  });

  describe('unregister', () => {
    it('should unregister from hub', async () => {
      const client = new EvoMapClient(mockConfig);
      await client.register();

      await client.unregister();

      expect(client.isRegistered()).toBe(false);
    });

    it('should handle unregister when not registered', async () => {
      const client = new EvoMapClient(mockConfig);

      // Should not throw
      await client.unregister();

      expect(client.isRegistered()).toBe(false);
    });
  });

  describe('shareGenes', () => {
    let client: EvoMapClient;
    const testGenes: Gene[] = [
      {
        id: 'gene-1',
        type: 'behavior',
        content: 'test-content',
        fitness: 0.9,
        generation: 1,
        parents: [],
        createdAt: new Date(),
      },
    ];

    beforeEach(async () => {
      client = new EvoMapClient(mockConfig);
      await client.register();
    });

    afterEach(async () => {
      await client.unregister();
    });

    it('should share genes with hub', async () => {
      await client.shareGenes(testGenes);

      expect(global.fetch).toHaveBeenCalledWith(
        'https://evomap.test/api/genes/share',
        expect.objectContaining({ method: 'POST' })
      );
    });

    it('should throw if not registered', async () => {
      const unregisteredClient = new EvoMapClient(mockConfig);

      await expect(unregisteredClient.shareGenes(testGenes)).rejects.toThrow(
        'Not registered with EvoMap Hub'
      );
    });
  });

  describe('requestGenes', () => {
    let client: EvoMapClient;

    beforeEach(async () => {
      client = new EvoMapClient(mockConfig);
      await client.register();
    });

    afterEach(async () => {
      await client.unregister();
    });

    it('should request genes from hub', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          genes: [],
          total: 0,
        }),
      });

      const response = await client.requestGenes({ minFitness: 0.8 });

      expect(response.success).toBe(true);
      expect(global.fetch).toHaveBeenCalledWith(
        'https://evomap.test/api/genes/request',
        expect.objectContaining({ method: 'POST' })
      );
    });

    it('should return failure response on error', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 500,
      });

      const response = await client.requestGenes();

      expect(response.success).toBe(false);
    });

    it('should throw if not registered', async () => {
      const unregisteredClient = new EvoMapClient(mockConfig);

      await expect(unregisteredClient.requestGenes()).rejects.toThrow(
        'Not registered with EvoMap Hub'
      );
    });
  });
});
