/**
 * AutoSkillGenerator Tests
 *
 * Unit tests for AutoSkillGenerator class.
 */

import { jest } from '@jest/globals';
import { AutoSkillGenerator, addCodeTemplate, getAvailableTemplates } from '../../src/auto-skill/generator.js';
import type { LLMClient } from '../../src/runtime/llm-client.js';
import type { ExtensionRegistry } from '../../src/extension-system/registry.js';
import type { EvolutionEngine } from '../../src/evolution/engine.js';
import type { Task } from '../../src/types.js';
import type { CapabilityGap, GeneratedExtension } from '../../src/auto-skill/types.js';

import * as fsPromises from 'fs/promises';

jest.mock('fs/promises', () => ({
  mkdir: jest.fn(),
  writeFile: jest.fn(),
}));

describe('AutoSkillGenerator', () => {
  let mockLLMClient: any;
  let mockRegistry: any;
  let mockEvolutionEngine: any;
  let generator: AutoSkillGenerator;

  const mockTask: Task = {
    id: 'test-task',
    prompt: 'Send HTTP request to API endpoint',
  };


  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();

    // Create mocks
    mockLLMClient = {
      chat: jest.fn(),
    } as any;

    mockRegistry = {
      getCapabilityNames: jest.fn().mockReturnValue([]),
    } as any;

    mockEvolutionEngine = {} as any;

    // Mock global fetch
    (global.fetch as jest.Mock) = jest.fn();

    // Mock console to keep test output clean
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'log').mockImplementation(() => {});



    // Create generator instance with default config
    generator = new AutoSkillGenerator(mockLLMClient, mockRegistry, mockEvolutionEngine);
  });



  describe('constructor', () => {
    it('should create generator with default config', () => {
      expect(generator).toBeDefined();
    });

    it('should apply custom config', () => {
      const customConfig = {
        maxGenerationAttempts: 5,
        storageDir: './custom',
      };
      const gen = new AutoSkillGenerator(
        mockLLMClient,
        mockRegistry,
        mockEvolutionEngine,
        customConfig
      );
      expect(gen).toBeDefined();
    });
  });

  describe('discoverCapabilities', () => {
    it('should discover missing capabilities', async () => {
      mockRegistry.getCapabilityNames.mockReturnValue(['file_read', 'file_write']);
      const mockResponse = {
        content: JSON.stringify({
          taskAnalysis: 'Task requires HTTP client capability',
          gaps: [
            {
              capability: 'http_client',
              description: 'Make HTTP requests',
              complexity: 'simple',
              reasoning: 'Task involves API calls',
            },
          ],
          suggestedCapabilities: ['file_read'],
        }),
      };
      mockLLMClient.chat.mockResolvedValue(mockResponse);

      const result = await generator.discoverCapabilities(mockTask);

      expect(result.gaps).toHaveLength(1);
      expect(result.gaps[0]!.capability).toBe('http_client');
      expect(result.suggestedCapabilities).toContain('file_read');
    });

    it('should handle LLM error and return empty gaps', async () => {
      mockRegistry.getCapabilityNames.mockReturnValue([]);
      mockLLMClient.chat.mockRejectedValue(new Error('API failure'));

      const result = await generator.discoverCapabilities(mockTask);

      expect(result.gaps).toEqual([]);
      expect(result.suggestedCapabilities).toEqual([]);
      expect(result.taskAnalysis).toBe('Failed to analyze');
    });

    it('should handle malformed JSON response', async () => {
      mockRegistry.getCapabilityNames.mockReturnValue([]);
      const mockResponse = { content: 'Not JSON' };
      mockLLMClient.chat.mockResolvedValue(mockResponse);

      const result = await generator.discoverCapabilities(mockTask);

      expect(result.gaps).toEqual([]);
      expect(result.suggestedCapabilities).toEqual([]);
    });
  });

  describe('generateExtension', () => {
    const mockGap: CapabilityGap = {
      capability: 'http_client',
      description: 'Make HTTP requests',
      complexity: 'simple',
      reasoning: 'Needed for API calls',
    };


    it('should generate extension using template', async () => {
      // Ensure template exists
      addCodeTemplate('http_client', 'template code');
      // Mock validation passes
      // The template code likely lacks required parts, but validation is simple
      // Let's use a template that includes required strings
      const template = `export const extension = { install() {}, uninstall() {}, capabilities: [] };`;
      addCodeTemplate('http_client', template);
      // Create generator with evolution disabled to avoid optimization LLM call
      const noEvolutionGen = new AutoSkillGenerator(
        mockLLMClient,
        mockRegistry,
        mockEvolutionEngine,
        { enableEvolution: false }
      );

      const result = await noEvolutionGen.generateExtension(mockGap);

      expect(result.success).toBe(true);
      expect(result.extension).toBeDefined();
      expect(result.extension?.name).toBe('auto-http_client');
      expect(result.steps).toHaveLength(3);
      // Should not call LLM for code generation or optimization
      expect(mockLLMClient.chat).not.toHaveBeenCalled();
    });

    it('should generate extension via LLM when no template', async () => {
      // Use a capability that doesn't match any template
      const gap: CapabilityGap = {
        ...mockGap,
        capability: 'unknown_capability',
      };
      mockLLMClient.chat.mockResolvedValue({
        content: '```typescript\nexport const extension = { install() {}, uninstall() {}, capabilities: [] };\n```',
      });

      const result = await generator.generateExtension(gap);

      expect(result.success).toBe(true);
      expect(mockLLMClient.chat).toHaveBeenCalled();
    });

    it('should retry when validation fails', async () => {
      // Use a capability that doesn't match any template
      const gap = {
        ...mockGap,
        capability: 'invalid_capability',
      };
      // Mock LLM to return code missing required parts
      mockLLMClient.chat.mockResolvedValue({
        content: '// Invalid code',
      });

      const result = await generator.generateExtension(gap);

      // Should fail after max attempts (default 3)
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      // Should have called LLM multiple times
      expect(mockLLMClient.chat).toHaveBeenCalledTimes(3);
    });

    it('should optimize code when enableEvolution is true', async () => {
      const customGen = new AutoSkillGenerator(
        mockLLMClient,
        mockRegistry,
        mockEvolutionEngine,
        { enableEvolution: true }
      );
      // Provide template that passes validation
      const template = `export const extension = { install() {}, uninstall() {}, capabilities: [] };`;
      addCodeTemplate('http_client', template);
      // Mock LLM for optimization
      mockLLMClient.chat.mockResolvedValue({
        content: '```typescript\noptimized code\n```',
      });

      const result = await customGen.generateExtension(mockGap);
      expect(result.success).toBe(true);
      // Should have called chat for optimization
      expect(mockLLMClient.chat).toHaveBeenCalled();
    });
  });

  describe('saveExtension', () => {
    it('should save extension files', async () => {
      const mockExtension: GeneratedExtension = {
        name: 'auto-http_client',
        code: 'export const extension = {};',
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

      const savedPath = await generator.saveExtension(mockExtension);

      expect(fsPromises.mkdir).toHaveBeenCalled();
      expect(fsPromises.writeFile).toHaveBeenCalledTimes(2); // index.ts and package.json
      expect(savedPath.replace(/\\/g, '/')).toContain('.jclaw/auto-skills/auto-http_client');
    });
  });

  describe('addCodeTemplate and getAvailableTemplates', () => {
    it('should add new template', () => {
      const initialCount = getAvailableTemplates().length;
      addCodeTemplate('new_template', 'template code');
      const templates = getAvailableTemplates();
      expect(templates).toContain('new_template');
      expect(templates).toHaveLength(initialCount + 1);
    });
  });
});
