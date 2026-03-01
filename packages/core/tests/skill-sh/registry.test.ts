/**
 * SkillRegistry Tests
 *
 * Unit tests for SkillRegistry class.
 */

import { jest } from '@jest/globals';
// Mock fs/promises
jest.mock('fs/promises', () => ({
  readFile: jest.fn(),
  writeFile: jest.fn(),
  mkdir: jest.fn(),
}));

// Mock fs
jest.mock('fs', () => ({
  existsSync: jest.fn(),
}));
import * as fsPromises from 'fs/promises';
import * as fs from 'fs';
import { join } from 'path';
import {
  SkillRegistry,
  createSkillRegistry,
} from '../../src/skill-sh/registry.js';
import type { SkillRegistryEntry } from '../../src/skill-sh/types.js';


describe('SkillRegistry', () => {
  const mockStorageDir = '/mock/storage';
  const mockRegistryPath = join(mockStorageDir, 'skill-registry.json');
  let registry: SkillRegistry;

  const mockEntry: SkillRegistryEntry = {
    id: 'owner/repo1',
    status: 'installed',
    path: '/path/to/skill',
    version: '1.0.0',
    installedAt: new Date('2024-01-01'),
    lastUsedAt: new Date('2024-01-02'),
    usageCount: 5,
    userRating: 4,
    localQuality: 85,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Mock console.error to keep test output clean
    jest.spyOn(console, 'error').mockImplementation(() => {});

    // Mock fs functions
    // Set up mock implementations
    (fs.existsSync as any).mockReturnValue(false);
    (fsPromises.readFile as any).mockResolvedValue('{}');
    (fsPromises.writeFile as any).mockResolvedValue(undefined);
    (fsPromises.mkdir as any).mockResolvedValue(undefined);

    // Create registry instance
    registry = new SkillRegistry(mockStorageDir);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('constructor', () => {
    it('should create registry with default storage dir', () => {
      const defaultRegistry = new SkillRegistry();
      expect(defaultRegistry).toBeDefined();
    });

    it('should load existing registry file', async () => {
      // Mock existsSync to return true and readFile to return data
      const mockData = {
        [mockEntry.id]: mockEntry,
      };
      (fs.existsSync as any).mockReturnValue(true);
      (fsPromises.readFile as any).mockResolvedValue(JSON.stringify(mockData));

      // Need to trigger load again, but load is called in constructor.
      // Since we already created registry in beforeEach with false existsSync,
      // we need to create a new instance.
      const registry2 = new SkillRegistry(mockStorageDir);

      // Wait for async load to complete (load is async but constructor doesn't await)
      // We'll wait a bit for promises to settle
      await new Promise((resolve) => setTimeout(resolve, 10));

      const entry = registry2.get(mockEntry.id);
      expect(entry).toBeDefined();
      expect(entry?.id).toBe(mockEntry.id);
    });

    it('should handle load errors gracefully', async () => {
      (fs.existsSync as any).mockReturnValue(true);
      (fsPromises.readFile as any).mockRejectedValue(new Error('Read error'));

      // Should not throw
      const registry2 = new SkillRegistry(mockStorageDir);
      await new Promise((resolve) => setTimeout(resolve, 10));

      // Registry should be empty
      expect(registry2.getAll()).toHaveLength(0);
    });
  });

  describe('register', () => {
    it('should register skill entry', async () => {
      await registry.register(mockEntry);

      expect(registry.has(mockEntry.id)).toBe(true);
      expect(registry.get(mockEntry.id)).toEqual(mockEntry);
      expect(fsPromises.writeFile).toHaveBeenCalled();
    });

    it('should save registry after registration', async () => {
      await registry.register(mockEntry);

      expect(fsPromises.writeFile).toHaveBeenCalledWith(
        mockRegistryPath,
        expect.any(String)
      );
      expect((fsPromises.writeFile as any).mock.calls[0]).toBeDefined();
      const savedData = JSON.parse((fsPromises.writeFile as any).mock.calls[0]![1] as string);
      const expectedEntry = {
        ...mockEntry,
        installedAt: mockEntry.installedAt!.toISOString(),
        lastUsedAt: mockEntry.lastUsedAt!.toISOString(),
      };
      expect(savedData[mockEntry.id]).toEqual(expectedEntry);
    });
  });

  describe('get and has', () => {
    beforeEach(async () => {
      await registry.register(mockEntry);
    });

    it('should get registered entry', () => {
      const entry = registry.get(mockEntry.id);
      expect(entry).toEqual(mockEntry);
    });

    it('should return undefined for non-existent entry', () => {
      const entry = registry.get('nonexistent');
      expect(entry).toBeUndefined();
    });

    it('should check if entry exists', () => {
      expect(registry.has(mockEntry.id)).toBe(true);
      expect(registry.has('nonexistent')).toBe(false);
    });
  });

  describe('getAll', () => {
    it('should return all entries', async () => {
      const entry2: SkillRegistryEntry = {
        ...mockEntry,
        id: 'owner/repo2',
      };
      await registry.register(mockEntry);
      await registry.register(entry2);

      const all = registry.getAll();
      expect(all).toHaveLength(2);
      expect(all.map((e) => e.id)).toContain(mockEntry.id);
      expect(all.map((e) => e.id)).toContain(entry2.id);
    });

    it('should return empty array when no entries', () => {
      expect(registry.getAll()).toHaveLength(0);
    });
  });

  describe('updateStatus', () => {
    beforeEach(async () => {
      await registry.register(mockEntry);
    });

    it('should update entry status', async () => {
      await registry.updateStatus(mockEntry.id, 'active');

      const entry = registry.get(mockEntry.id);
      expect(entry?.status).toBe('active');
      expect(fsPromises.writeFile).toHaveBeenCalledTimes(2); // once for register, once for update
    });

    it('should do nothing for non-existent entry', async () => {
      await registry.updateStatus('nonexistent', 'active');
      // Should not call writeFile again
      expect(fsPromises.writeFile).toHaveBeenCalledTimes(1); // only from register
    });
  });

  describe('recordUsage', () => {
    beforeEach(async () => {
      await registry.register(mockEntry);
    });

    it('should increment usage count and update lastUsedAt', async () => {
      const initialUsage = mockEntry.usageCount;
      await registry.recordUsage(mockEntry.id);

      const entry = registry.get(mockEntry.id);
      expect(entry?.usageCount).toBe(initialUsage + 1);
      expect(entry?.lastUsedAt).toBeDefined();
      expect(entry?.lastUsedAt!.getTime()).toBeGreaterThanOrEqual(
        mockEntry.lastUsedAt!.getTime()
      );
      expect(fsPromises.writeFile).toHaveBeenCalledTimes(2);
    });

    it('should do nothing for non-existent entry', async () => {
      await registry.recordUsage('nonexistent');
      expect(fsPromises.writeFile).toHaveBeenCalledTimes(1);
    });
  });

  describe('setRating', () => {
    beforeEach(async () => {
      await registry.register(mockEntry);
    });

    it('should set user rating', async () => {
      await registry.setRating(mockEntry.id, 5);

      const entry = registry.get(mockEntry.id);
      expect(entry?.userRating).toBe(5);
      expect(fsPromises.writeFile).toHaveBeenCalledTimes(2);
    });

    it('should do nothing for non-existent entry', async () => {
      await registry.setRating('nonexistent', 5);
      expect(fsPromises.writeFile).toHaveBeenCalledTimes(1);
    });
  });

  describe('unregister', () => {
    beforeEach(async () => {
      await registry.register(mockEntry);
    });

    it('should remove entry', async () => {
      await registry.unregister(mockEntry.id);

      expect(registry.has(mockEntry.id)).toBe(false);
      expect(registry.get(mockEntry.id)).toBeUndefined();
      expect(fsPromises.writeFile).toHaveBeenCalledTimes(2);
    });

    it('should do nothing for non-existent entry', async () => {
      await registry.unregister('nonexistent');
      expect(fsPromises.writeFile).toHaveBeenCalledTimes(1);
    });
  });

  describe('save error handling', () => {
    it('should handle save errors gracefully', async () => {
      (fsPromises.writeFile as any).mockRejectedValue(new Error('Write error'));

      // Should not throw
      await expect(registry.register(mockEntry)).resolves.toBeUndefined();
      // Error should be logged
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('createSkillRegistry', () => {
    it('should create registry instance', () => {
      const instance = createSkillRegistry(mockStorageDir);
      expect(instance).toBeInstanceOf(SkillRegistry);
    });
  });
});
