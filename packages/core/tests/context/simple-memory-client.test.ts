/**
 * SimpleMemoryClient Tests
 */

import { SimpleMemoryClient } from '../../src/context/simple-memory-client';
import { rm } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

describe('SimpleMemoryClient', () => {
  let client: SimpleMemoryClient;
  const testMemoryPath = './memory/test-unit-' + Date.now();

  beforeEach(async () => {
    client = new SimpleMemoryClient({ memoryPath: testMemoryPath });
  });

  afterEach(async () => {
    try {
      await rm(testMemoryPath, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  });

  describe('connect', () => {
    it('should create memory directory if not exists', async () => {
      await client.connect();
      expect(existsSync(testMemoryPath)).toBe(true);
      expect(client.isConnected()).toBe(true);
    });

    it('should connect successfully', async () => {
      await client.connect();
      expect(client.isConnected()).toBe(true);
    });
  });

  describe('disconnect', () => {
    it('should disconnect successfully', async () => {
      await client.connect();
      await client.disconnect();
      expect(client.isConnected()).toBe(false);
    });
  });

  describe('saveMemory', () => {
    it('should save memory with title', async () => {
      await client.connect();
      await client.saveMemory('Test content', 'Test Title');
      
      const results = await client.query('Test');
      expect(results).toContain('Test content');
      // Title is stored but not returned in query results
    });

    it('should save memory without title', async () => {
      await client.connect();
      await client.saveMemory('Content without title');
      
      const results = await client.query('Content');
      expect(results).toContain('Content without title');
    });
  });

  describe('query', () => {
    it('should throw error if not connected', async () => {
      await expect(client.query('test')).rejects.toThrow('Client not initialized');
    });

    it('should return matching results', async () => {
      await client.connect();
      await client.saveMemory('JClaw is an AI framework', 'About JClaw');
      await client.saveMemory('Python is a programming language', 'About Python');
      
      const results = await client.query('JClaw AI', { topK: 1 });
      expect(results).toContain('JClaw');
      expect(results).not.toContain('Python');
    });

    it('should return multiple results', async () => {
      await client.connect();
      await client.saveMemory('First memory about AI');
      await client.saveMemory('Second memory about AI');
      
      const results = await client.query('AI', { topK: 2 });
      expect(results).toContain('First');
      expect(results).toContain('Second');
    });
  });

  describe('addResource', () => {
    it('should add resource file', async () => {
      await client.connect();
      
      // Create a test file
      const testFile = path.join(testMemoryPath, 'test-resource.txt');
      const fs = require('fs');
      fs.writeFileSync(testFile, 'Resource content');
      
      const id = await client.addResource(testFile);
      expect(id).toMatch(/^resource-/);
      
      const results = await client.query('Resource');
      expect(results).toContain('Resource content');
    });
  });
});
