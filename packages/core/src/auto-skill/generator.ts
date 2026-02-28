/**
 * AutoSkill Generator - Enhanced Version
 * 
 * Improved code generation with templates, validation, and evolution
 * 
 * @module @jclaw/core/auto-skill/generator
 */

import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import type { Task } from '../types.js';
import type { ExtensionRegistry } from '../extension-system/registry.js';
import type { LLMClient } from '../runtime/llm-client.js';
import type { EvolutionEngine } from '../evolution/engine.js';
import type {
  AutoSkillConfig,
  CapabilityGap,
  DiscoveryResult,
  GeneratedExtension,
  GenerationResult,
  GenerationStep,
} from './types.js';

const DEFAULT_CONFIG: Required<AutoSkillConfig> = {
  enabled: true,
  maxGenerationAttempts: 3,
  storageDir: './.jclaw/auto-skills',
  autoInstall: true,
  minFitness: 0.7,
  generationTimeout: 120000,
  enableEvolution: true,
};

// Pre-built code templates for common capabilities
const CODE_TEMPLATES: Record<string, string> = {
  http_client: `/**
 * Auto-generated HTTP Client Extension
 */
import type { Extension, AgentRuntime } from '@jclaw/core';

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

  file_operations: `/**
 * Auto-generated File Operations Extension
 */
import type { Extension, AgentRuntime } from '@jclaw/core';
import { readFile, writeFile, mkdir, readdir } from 'fs/promises';
import { existsSync } from 'fs';

export const autoFileOpsExtension: Extension = {
  name: 'auto-file-operations',
  version: '1.0.0',
  description: 'File system operations',
  capabilities: [
    {
      name: 'file_read',
      description: 'Read file contents',
      handler: async (path: string) => await readFile(path, 'utf-8'),
    },
    {
      name: 'file_write',
      description: 'Write file contents',
      handler: async (path: string, content: string) => {
        await writeFile(path, content, 'utf-8');
        return { success: true };
      },
    },
  ],
  async install(_runtime: AgentRuntime): Promise<void> {
    console.log('Installing file operations capability...');
  },
  async uninstall(): Promise<void> {
    console.log('Uninstalling file operations capability...');
  },
};

export default autoFileOpsExtension;`,
};

export class AutoSkillGenerator {
  private readonly config: Required<AutoSkillConfig>;

  constructor(
    private llmClient: LLMClient,
    private registry: ExtensionRegistry,
    private evolutionEngine: EvolutionEngine,
    config?: Partial<AutoSkillConfig>
  ) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  async discoverCapabilities(task: Task): Promise<DiscoveryResult> {
    const existingCapabilities = this.registry.getCapabilityNames();
    
    const prompt = `Analyze the task and identify missing capabilities.

Task: ${task.prompt}

Existing Capabilities:
${existingCapabilities.map(c => `- ${c}`).join('\n')}

Return JSON:
{
  "taskAnalysis": "Brief analysis",
  "gaps": [
    {
      "capability": "snake_case_name",
      "description": "What this does",
      "complexity": "simple|medium|complex",
      "reasoning": "Why needed"
    }
  ],
  "suggestedCapabilities": ["existing_cap"]
}`;

    try {
      const response = await this.llmClient.chat([
        { role: 'system', content: 'You are a capability analyzer.' },
        { role: 'user', content: prompt }
      ]);

      const content = response.content;
      const jsonMatch = content.match(/{[\s\S]*}/);
      if (!jsonMatch) throw new Error('No JSON found');

      return JSON.parse(jsonMatch[0]);
    } catch (error) {
      console.error('Discovery failed:', error);
      return { taskAnalysis: 'Failed to analyze', gaps: [], suggestedCapabilities: [] };
    }
  }

  async generateExtension(gap: CapabilityGap, attempt = 1): Promise<GenerationResult> {
    const steps: GenerationStep[] = [
      { name: 'analyze', status: 'success' },
      { name: 'generate', status: 'running' },
      { name: 'validate', status: 'pending' },
    ];

    try {
      const templateKey = this.findTemplateForCapability(gap.capability);
      let code: string;
      
      if (templateKey) {
        code = CODE_TEMPLATES[templateKey];
        console.log('   Using template for:', templateKey);
      } else {
        code = await this.generateCode(gap);
      }
      
      steps[1]!.status = 'success';
      steps[2]!.status = 'running';
      
      const validation = await this.validateCode(code);
      if (!validation.valid) {
        steps[2]!.status = 'failed';
        if (attempt < this.config.maxGenerationAttempts) {
          return this.generateExtension(gap, attempt + 1);
        }
        return { success: false, steps, error: validation.error };
      }
      steps[2]!.status = 'success';

      if (this.config.enableEvolution) {
        code = await this.optimizeCode(code, gap);
      }

      return {
        success: true,
        extension: { name: `auto-${gap.capability}`, code, gap, version: '1.0.0', generatedAt: new Date(), model: 'gpt-4o' },
        steps
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return { success: false, steps, error: errorMessage };
    }
  }

  private findTemplateForCapability(capability: string): string | null {
    const templates = Object.keys(CODE_TEMPLATES);
    for (const template of templates) {
      if (capability.includes(template) || template.includes(capability)) {
        return template;
      }
    }
    return null;
  }

  private async generateCode(gap: CapabilityGap): Promise<string> {
    const prompt = `Generate a complete JClaw Extension for capability: ${gap.capability}

Description: ${gap.description}

Requirements:
1. Implement Extension interface from '@jclaw/core'
2. Include install() and uninstall() methods
3. Export as default
4. Use TypeScript
5. Add proper error handling`;

    const response = await this.llmClient.chat([
      { role: 'system', content: 'You are a TypeScript expert.' },
      { role: 'user', content: prompt }
    ]);

    const codeMatch = response.content.match(/```typescript\n([\s\S]*?)```/);
    return codeMatch && codeMatch[1] ? codeMatch[1].trim() : response.content.trim();
  }

  private async optimizeCode(code: string, gap: CapabilityGap): Promise<string> {
    const prompt = `Optimize this TypeScript code for better quality:

${code}

Focus on:
1. Error handling
2. Type safety
3. Performance
4. Readability`;

    try {
      const response = await this.llmClient.chat([
        { role: 'system', content: 'You are a code optimizer.' },
        { role: 'user', content: prompt }
      ]);
      const codeMatch = response.content.match(/```typescript\n([\s\S]*?)```/);
      return codeMatch && codeMatch[1] ? codeMatch[1].trim() : response.content.trim();
    } catch {
      return code;
    }
  }

  private async validateCode(code: string): Promise<{ valid: boolean; error?: string }> {
    const required = ['export', 'install', 'uninstall', 'capabilities'];
    for (const part of required) {
      if (!code.includes(part)) {
        return { valid: false, error: `Missing: ${part}` };
      }
    }
    return { valid: true };
  }

  async saveExtension(extension: GeneratedExtension): Promise<string> {
    const dir = join(this.config.storageDir, extension.name);
    await mkdir(join(dir, 'src'), { recursive: true });
    await writeFile(join(dir, 'src', 'index.ts'), extension.code);
    await writeFile(join(dir, 'package.json'), JSON.stringify({
      name: extension.name,
      version: extension.version,
      type: 'module',
      main: 'dist/index.js',
      dependencies: { '@jclaw/core': '^0.1.0' }
    }, null, 2));
    return dir;
  }
}

export function createAutoSkillGenerator(
  llmClient: LLMClient,
  registry: ExtensionRegistry,
  evolutionEngine: EvolutionEngine,
  config?: Partial<AutoSkillConfig>
): AutoSkillGenerator {
  return new AutoSkillGenerator(llmClient, registry, evolutionEngine, config);
}

// Add more code templates
export function addCodeTemplate(name: string, template: string): void {
  CODE_TEMPLATES[name] = template;
}

// Get all available templates
export function getAvailableTemplates(): string[] {
  return Object.keys(CODE_TEMPLATES);
}
