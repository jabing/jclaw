/**
 * Skill to Extension Converter
 * 
 * Converts SKILL.md format to JClaw Extension
 * 
 * @module @jclaw/core/skill-sh/converter
 */

import type { Extension, Capability } from '../types.js';
import type { SkillShResult, SkillFrontmatter, ConvertedSkill } from './types.js';
import type { LLMClient } from '../runtime/llm-client.js';

/**
 * Skill to Extension Converter
 */
export class SkillConverter {
  constructor(private llmClient: LLMClient) {}

  /**
   * Convert SKILL.md to JClaw Extension
   */
  async convert(
    skill: SkillShResult,
    skillMd: string
  ): Promise<ConvertedSkill> {
    const warnings: string[] = [];
    const frontmatter = this.parseFrontmatter(skillMd);
    
    if (!frontmatter) {
      warnings.push('Failed to parse SKILL.md frontmatter');
    }

    // Generate capability from SKILL.md content
    const capabilities = await this.generateCapabilities(skill, skillMd);
    
    if (capabilities.length === 0) {
      warnings.push('No capabilities could be generated');
    }

    // Build extension
    const extension: Extension = {
      name: `skill-${skill.name}`,
      version: skill.version || '1.0.0',
      description: frontmatter?.description || `Skill.sh: ${skill.description}`,
      capabilities,
      dependencies: [],
      
      async install(): Promise<void> {
        console.log(`Installing skill: ${skill.name}`);
        // Skill-specific initialization
      },
      
      async uninstall(): Promise<void> {
        console.log(`Uninstalling skill: ${skill.name}`);
        // Skill-specific cleanup
      },
    };

    // Calculate quality score
    const quality = this.assessQuality(skill, skillMd, capabilities);

    return {
      original: skill,
      extension,
      quality,
      warnings,
    };
  }

  /**
   * Generate capabilities from SKILL.md content
   */
  private async generateCapabilities(
    skill: SkillShResult,
    skillMd: string
  ): Promise<Capability[]> {
    // Extract capability definitions from SKILL.md
    const prompt = `Analyze this SKILL.md and extract capabilities:

${skillMd}

Return JSON array of capabilities:
[{
  "name": "capability-name",
  "description": "what this does",
  "inputSchema": { "type": "object", "properties": {} },
  "outputSchema": { "type": "object" }
}]

If no clear capabilities found, return empty array.`;

    try {
      const response = await this.llmClient.chat([
        { role: 'system', content: 'You are a capability analyzer.' },
        { role: 'user', content: prompt }
      ]);

      const content = response.content;
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      
      if (!jsonMatch) return [];
      
      const capabilities = JSON.parse(jsonMatch[0]);
      
      return capabilities.map((cap: { name: string; description: string; inputSchema?: object; outputSchema?: object }) => ({
        name: cap.name,
        description: cap.description,
        handler: async () => {
          // Skill capability handler
          // This would be implemented based on skill-specific logic
          throw new Error(`Capability ${cap.name} not yet implemented`);
        },
      }));
    } catch (error) {
      console.error('Failed to generate capabilities:', error);
      return [];
    }
  }

  /**
   * Parse SKILL.md frontmatter
   */
  private parseFrontmatter(content: string): SkillFrontmatter | null {
    const match = content.match(/^---\n([\s\S]*?)\n---/);
    if (!match) return null;

    try {
      const yaml = match[1];
      const frontmatter: Record<string, unknown> = {};
      
      for (const line of (yaml || '').split('\n')) {
        const colonIndex = line.indexOf(':');
        if (colonIndex === -1) continue;
        
        const key = line.slice(0, colonIndex).trim();
        const value = line.slice(colonIndex + 1).trim();
        
        if (value.startsWith('[') && value.endsWith(']')) {
          frontmatter[key] = value
            .slice(1, -1)
            .split(',')
            .map(s => s.trim().replace(/^["']|["']$/g, ''));
        } else {
          frontmatter[key] = value.replace(/^["']|["']$/g, '');
        }
      }

      return frontmatter as unknown as SkillFrontmatter;
    } catch {
      return null;
    }
  }

  /**
   * Assess conversion quality
   */
  private assessQuality(
    skill: SkillShResult,
    skillMd: string,
    capabilities: Capability[]
  ): number {
    let score = 50; // Base score

    // Stars bonus
    if (skill.stars > 100) score += 10;
    else if (skill.stars > 50) score += 5;
    else if (skill.stars > 10) score += 2;

    // Download bonus
    if (skill.downloads > 1000) score += 10;
    else if (skill.downloads > 500) score += 5;
    else if (skill.downloads > 100) score += 2;

    // Capability bonus
    if (capabilities.length > 0) score += 10;
    if (capabilities.length >= 3) score += 5;

    // Content length bonus
    if (skillMd.length > 1000) score += 5;
    if (skillMd.length > 3000) score += 5;

    // Documentation quality
    if (skillMd.includes('## Usage')) score += 5;
    if (skillMd.includes('## Example')) score += 5;
    if (skillMd.includes('## API')) score += 5;

    return Math.min(100, score);
  }
}

/**
 * Create skill converter
 */
export function createSkillConverter(llmClient: LLMClient): SkillConverter {
  return new SkillConverter(llmClient);
}
