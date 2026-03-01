/**
 * AutoSkillInstaller Tests
 *
 * Unit tests for AutoSkillInstaller class.
 */

import { jest } from '@jest/globals';
import {
  AutoSkillInstaller,
  createAutoSkillInstaller,
} from '../../src/auto-skill/installer.js';
import type { ExtensionRegistry } from '../../src/extension-system/registry.js';
import type { GeneratedExtension } from '../../src/auto-skill/types.js';
import type { Extension, AgentRuntime } from '../../src/types.js';

// Mock fs/promises
jest.mock('fs/promises', () => ({
  mkdir: jest.fn(),
  writeFile: jest.fn(),
  rm: jest.fn(),
  readdir: jest.fn(),
}));

// Mock child_process.execSync
jest.mock('child_process', () => ({
  execSync: jest.fn(),
}));

// Mock fs.existsSync
jest.mock('fs', () => ({
  existsSync: jest.fn(),
}));

import * as fsPromises from 'fs/promises';
import * as childProcess from 'child_process';
import * as fs from 'fs';

describe('AutoSkillInstaller', () => {
  let mockRegistry: any;
  let installer: AutoSkillInstaller;

  const mockExtension: GeneratedExtension = {
    name: 'auto-http_client',
    code: `import type { Extension, AgentRuntime } from '@jclaw/core';

export const autoHttpClientExtension: Extension = {
  name: 'auto-http-client',
  version: '1.0.0',
  description: 'HTTP client for making API requests',
  capabilities: [
    {
      name: 'http_client',
      description: 'Make HTTP requests to external APIs',
      handler: async (options: { url: string; method?: string; headers?: Record<string, string>; body?: any }) => {
        const response = await fetch(options.url, {
          method: options.method || 'GET',
          headers: { 'Content-Type': 'application/json', ...options.headers },
          body: options.body ? JSON.stringify(options.body) : undefined,
        });
        return await response.json();
      },
    },
  ],
  async install(_runtime: AgentRuntime): Promise<void> {
    console.log('Installing HTTP client capability...');
  },
  async uninstall(): Promise<void> {
    console.log('Uninstalling HTTP client capability...');
  },
};

export default autoHttpClientExtension;`,
    gap: {
      capability: 'http_client',
      description: 'Make HTTP requests',
      complexity: 'simple',
      reasoning: 'Needed for API calls',
    },
    version: '1.0.0',
    generatedAt: new Date(),
    model: 'gpt-4o',
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Create registry mock
    mockRegistry = {
      register: jest.fn(),
      unregister: jest.fn(),
    };

    // Set up mock implementations with simpler typing
    (fsPromises.mkdir as any).mockResolvedValue(undefined);
    (fsPromises.writeFile as any).mockResolvedValue(undefined);
    (fsPromises.rm as any).mockResolvedValue(undefined);
    (fsPromises.readdir as any).mockResolvedValue([]);
    (fs.existsSync as any).mockReturnValue(false);
    (childProcess.execSync as any).mockReturnValue('');

    installer = new AutoSkillInstaller(mockRegistry);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('constructor', () => {
    it('should create installer with default storage directory', () => {
      expect(installer).toBeDefined();
    });

    it('should use custom storage directory', () => {
      const customInstaller = new AutoSkillInstaller(
        mockRegistry,
        './custom-dir'
      );
      expect(customInstaller).toBeDefined();
    });
  });

  describe('uninstall', () => {
    it('should uninstall extension successfully', async () => {
      (fs.existsSync as any).mockReturnValue(true);

      const result = await installer.uninstall('auto-http_client');

      expect(result).toBe(true);
      expect(mockRegistry.unregister).toHaveBeenCalledWith('auto-http_client');
      expect(fsPromises.rm).toHaveBeenCalled();
    });

    it('should return false when extension not found', async () => {
      (fs.existsSync as any).mockReturnValue(false);

      const result = await installer.uninstall('non-existent');

      expect(result).toBe(false);
      expect(mockRegistry.unregister).not.toHaveBeenCalled();
      expect(fsPromises.rm).not.toHaveBeenCalled();
    });

    it('should return false when unregister throws', async () => {
      (fs.existsSync as any).mockReturnValue(true);
      mockRegistry.unregister.mockImplementation(() => {
        throw new Error('Failed');
      });

      const result = await installer.uninstall('auto-http_client');

      expect(result).toBe(false);
    });
  });

  describe('listInstalled', () => {
    it('should list installed extensions', async () => {
      (fs.existsSync as any).mockReturnValue(true);
      (fsPromises.readdir as any).mockResolvedValue([
        'extension1',
        'extension2',
      ]);

      const list = await installer.listInstalled();

      expect(list).toEqual(['extension1', 'extension2']);
    });

    it('should return empty array when storage directory does not exist', async () => {
      (fs.existsSync as any).mockReturnValue(false);

      const list = await installer.listInstalled();

      expect(list).toEqual([]);
      expect(fsPromises.readdir).not.toHaveBeenCalled();
    });

    it('should return empty array on readdir error', async () => {
      (fs.existsSync as any).mockReturnValue(true);
      (fsPromises.readdir as any).mockRejectedValue(
        new Error('Permission denied')
      );

      const list = await installer.listInstalled();

      expect(list).toEqual([]);
    });
  });

  describe('createAutoSkillInstaller', () => {
    it('should create installer instance', () => {
      const instance = createAutoSkillInstaller(mockRegistry);
      expect(instance).toBeInstanceOf(AutoSkillInstaller);
    });
  });
});
