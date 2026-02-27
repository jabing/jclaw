/**
 * MockClient Tests
 *
 * Tests for the in-memory mock implementation of ContextManager.
 * These tests verify the mock client works correctly without network connections.
 */

import { MockClient } from '../../src/context/mock-client.js';

describe('MockClient', () => {
  let client: MockClient;

  beforeEach(() => {
    client = new MockClient();
  });

  afterEach(() => {
    // Clean up after each test
    client.reset();
  });

  describe('connection', () => {
    it('should start disconnected', () => {
      expect(client.isConnected()).toBe(false);
    });

    it('should connect successfully', async () => {
      await client.connect();
      expect(client.isConnected()).toBe(true);
    });

    it('should disconnect successfully', async () => {
      await client.connect();
      expect(client.isConnected()).toBe(true);

      await client.disconnect();
      expect(client.isConnected()).toBe(false);
    });

    it('should allow reconnecting after disconnect', async () => {
      await client.connect();
      await client.disconnect();
      await client.connect();
      expect(client.isConnected()).toBe(true);
    });

    it('should be idempotent - connect multiple times', async () => {
      await client.connect();
      await client.connect();
      expect(client.isConnected()).toBe(true);
    });

    it('should be idempotent - disconnect without connect', async () => {
      await client.disconnect();
      expect(client.isConnected()).toBe(false);
    });
  });

  describe('query', () => {
    it('should throw when not connected', async () => {
      await expect(client.query('test')).rejects.toThrow('not connected');
    });

    it('should return mock response when connected', async () => {
      await client.connect();
      const response = await client.query('test question');
      expect(response).toContain('test question');
      expect(response).toContain('Mock response');
    });

    it('should return custom response when set', async () => {
      await client.connect();
      client.setQueryResponse('custom', 'custom response');
      const response = await client.query('custom');
      expect(response).toBe('custom response');
    });

    it('should handle empty question', async () => {
      await client.connect();
      const response = await client.query('');
      expect(response).toContain('Mock response');
    });

    it('should accept topK option without error', async () => {
      await client.connect();
      const response = await client.query('test', { topK: 5 });
      expect(response).toBeDefined();
    });

    it('should return different responses for different questions', async () => {
      await client.connect();
      const response1 = await client.query('question one');
      const response2 = await client.query('question two');

      expect(response1).toContain('question one');
      expect(response2).toContain('question two');
    });

    it('should return exact custom response match', async () => {
      await client.connect();
      client.setQueryResponse('exact', 'This is the exact response');

      const response = await client.query('exact');
      expect(response).toBe('This is the exact response');
    });

    it('should fallback to default after clearing custom response', async () => {
      await client.connect();
      client.setQueryResponse('test', 'custom');
      expect(await client.query('test')).toBe('custom');

      client.clearQueryResponse('test');
      const response = await client.query('test');
      expect(response).toContain('Mock response');
    });
  });

  describe('addResource', () => {
    it('should throw when not connected', async () => {
      await expect(client.addResource('/path')).rejects.toThrow(
        'not connected'
      );
    });

    it('should add resource and return id', async () => {
      await client.connect();
      const id = await client.addResource('/test/path');
      expect(id).toMatch(/^mock-/);
    });

    it('should generate unique ids for different resources', async () => {
      await client.connect();
      const id1 = await client.addResource('/path1');
      const id2 = await client.addResource('/path2');
      expect(id1).not.toBe(id2);
    });

    it('should store resources', async () => {
      await client.connect();
      await client.addResource('/path1');
      await client.addResource('/path2');
      expect(client.getResources()).toHaveLength(2);
    });

    it('should store correct resource path', async () => {
      await client.connect();
      const id = await client.addResource('/my/test/path');
      const resource = client.getResourceById(id);
      expect(resource?.path).toBe('/my/test/path');
    });

    it('should store resource with timestamp', async () => {
      await client.connect();
      const beforeAdd = new Date();
      const id = await client.addResource('/path');
      const afterAdd = new Date();
      const resource = client.getResourceById(id);

      expect(resource?.addedAt).toBeInstanceOf(Date);
      expect(resource?.addedAt.getTime()).toBeGreaterThanOrEqual(
        beforeAdd.getTime()
      );
      expect(resource?.addedAt.getTime()).toBeLessThanOrEqual(
        afterAdd.getTime()
      );
    });

    it('should handle empty path', async () => {
      await client.connect();
      const id = await client.addResource('');
      const resource = client.getResourceById(id);
      expect(resource?.path).toBe('');
    });

    it('should handle special characters in path', async () => {
      await client.connect();
      const specialPath = '/path/with spaces/and-dashes_and_underscores';
      const id = await client.addResource(specialPath);
      const resource = client.getResourceById(id);
      expect(resource?.path).toBe(specialPath);
    });
  });

  describe('test helpers', () => {
    describe('clearResources', () => {
      it('should clear all stored resources', async () => {
        await client.connect();
        await client.addResource('/path1');
        await client.addResource('/path2');
        expect(client.getResources()).toHaveLength(2);

        client.clearResources();
        expect(client.getResources()).toHaveLength(0);
      });
    });

    describe('reset', () => {
      it('should reset connection state', async () => {
        await client.connect();
        expect(client.isConnected()).toBe(true);

        client.reset();
        expect(client.isConnected()).toBe(false);
      });

      it('should clear all resources', async () => {
        await client.connect();
        await client.addResource('/path1');
        await client.addResource('/path2');

        client.reset();
        expect(client.getResources()).toHaveLength(0);
      });

      it('should clear all query responses', async () => {
        await client.connect();
        client.setQueryResponse('q1', 'r1');
        client.setQueryResponse('q2', 'r2');

        client.reset();
        await client.connect();

        expect(await client.query('q1')).toContain('Mock response');
        expect(await client.query('q2')).toContain('Mock response');
      });

      it('should restore to initial state completely', async () => {
        await client.connect();
        client.setQueryResponse('test', 'response');
        await client.addResource('/path');

        client.reset();

        expect(client.isConnected()).toBe(false);
        expect(client.getResources()).toHaveLength(0);
      });
    });

    describe('getResourceById', () => {
      it('should return undefined for non-existent resource', () => {
        expect(client.getResourceById('non-existent')).toBeUndefined();
      });

      it('should return resource by id', async () => {
        await client.connect();
        const id = await client.addResource('/test/path');
        const resource = client.getResourceById(id);

        expect(resource).toBeDefined();
        expect(resource?.id).toBe(id);
        expect(resource?.path).toBe('/test/path');
      });
    });
  });

  describe('ContextManager interface compliance', () => {
    it('should implement connect method', () => {
      expect(typeof client.connect).toBe('function');
    });

    it('should implement disconnect method', () => {
      expect(typeof client.disconnect).toBe('function');
    });

    it('should implement query method', () => {
      expect(typeof client.query).toBe('function');
    });

    it('should implement addResource method', () => {
      expect(typeof client.addResource).toBe('function');
    });
  });

  describe('offline operation', () => {
    it('should work without any network connection', async () => {
      // This test verifies the mock works in isolation
      // No network calls should be made
      await client.connect();

      const response = await client.query('any question');
      expect(response).toBeDefined();

      const resourceId = await client.addResource('/any/path');
      expect(resourceId).toBeDefined();

      await client.disconnect();
    });
  });
});
