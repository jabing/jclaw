/**
 * Skill.sh Adapter
 * 
 * @module @jclaw/core/skill-sh/adapter
 */

import { existsSync } from 'fs';
import { mkdir } from 'fs/promises';
import { join } from 'path';
import { homedir } from 'os';
import { execSync } from 'child_process';
import type { LLMClient } from '../runtime/llm-client.js';
import type {
  SkillShResult,
  SkillShDetail,
  SkillShAdapterConfig,
  SkillSearchOptions,
  SkillFrontmatter,
  SkillInstallationResult,
} from './types.js';

const DEFAULT_CONFIG: Required<SkillShAdapterConfig> = {
  apiBase: 'https://api.skills.sh/v1',
  cacheDir: './.jclaw/skill-sh-cache',
  enableCache: true,
  cacheTtl: 24 * 60 * 60 * 1000,
  timeout: 30000,
  userAgent: 'JClaw-Agent/1.0',
  githubToken: '',
  communityRepo: 'jclaw-ai/skills',
};

export class SkillShAdapter {
  private readonly config: Required<SkillShAdapterConfig>;
  private cache: Map<string, { data: unknown; timestamp: number }> = new Map();

  constructor(
    private llmClient: LLMClient,
    config?: SkillShAdapterConfig
  ) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.ensureCacheDir();
  }

  async search(options: SkillSearchOptions): Promise<SkillShResult[]> {
    const cacheKey = `search:${JSON.stringify(options)}`;
    const cached = this.getCache<SkillShResult[]>(cacheKey);
    if (cached) return cached;

    try {
      const params = new URLSearchParams();
      params.set('q', options.query);
      if (options.category) params.set('category', options.category);
      if (options.minQuality) params.set('min_quality', String(options.minQuality));
      if (options.sortBy) params.set('sort', options.sortBy);
      if (options.limit) params.set('limit', String(options.limit));

      const response = await fetch(
        `${this.config.apiBase}/search?${params}`,
        {
          headers: this.getHeaders(),
          signal: AbortSignal.timeout(this.config.timeout),
        }
      );

      if (!response.ok) throw new Error(`API error: ${response.status}`);

      const results = await response.json() as SkillShResult[];
      this.setCache(cacheKey, results);
      return results;
    } catch (error) {
      console.error('Skill.sh search failed:', error);
      return [];
    }
  }

  async getSkill(skillId: string): Promise<SkillShDetail | null> {
    const cacheKey = `skill:${skillId}`;
    const cached = this.getCache<SkillShDetail>(cacheKey);
    if (cached) return cached;

    try {
      const response = await fetch(
        `${this.config.apiBase}/skills/${skillId}`,
        {
          headers: this.getHeaders(),
          signal: AbortSignal.timeout(this.config.timeout),
        }
      );

      if (!response.ok) return null;

      const detail = await response.json() as SkillShDetail;
      this.setCache(cacheKey, detail);
      return detail;
    } catch (error) {
      console.error('Failed to get skill:', error);
      return null;
    }
  }

  async downloadSkillMd(owner: string, repo: string): Promise<string | null> {
    const cacheKey = `skillmd:${owner}/${repo}`;
    const cached = this.getCache<string>(cacheKey);
    if (cached) return cached;

    try {
      const response = await fetch(
        `https://raw.githubusercontent.com/${owner}/${repo}/main/SKILL.md`,
        {
          headers: this.config.githubToken 
            ? { Authorization: `token ${this.config.githubToken}` }
            : {},
          signal: AbortSignal.timeout(this.config.timeout),
        }
      );

      if (!response.ok) return null;

      const content = await response.text();
      this.setCache(cacheKey, content);
      return content;
    } catch (error) {
      return null;
    }
  }

  async installSkill(skillId: string): Promise<SkillInstallationResult> {
    const startTime = Date.now();
    
    try {
      const output = execSync(`npx skills add ${skillId}`, {
        encoding: 'utf-8',
        timeout: 120000,
        stdio: 'pipe',
      });

      const duration = Date.now() - startTime;
      const skill = await this.getSkill(skillId);
      
      return {
        success: true,
        skill: skill || undefined,
        installPath: this.getSkillInstallPath(skillId),
        duration,
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Installation failed',
        duration,
      };
    }
  }

  parseFrontmatter(content: string): SkillFrontmatter | null {
    const match = content.match(/^---\n([\s\S]*?)\n---/);
    if (!match) return null;

    try {
      const yaml = match[1];
      const frontmatter: Record<string, unknown> = {};
      
      for (const line of yaml!.split('\n')) {
        const colonIndex = line.indexOf(':');
        if (colonIndex === -1) continue;
        
        const key = line.slice(0, colonIndex).trim();
        const value = line.slice(colonIndex + 1).trim();
        
        if (value.startsWith('[') && value.endsWith(']')) {
          frontmatter[key] = value
            .slice(1, -1)
            .split(',')
            .map(s => s.trim().replace(/^[\"']|[\"']$/g, ''));
        } else {
          frontmatter[key] = value.replace(/^[\"']|[\"']$/g, '');
        }
      }

      return frontmatter as unknown as SkillFrontmatter;
    } catch {
      return null;
    }
  }

  private getSkillInstallPath(skillId: string): string {
    // Check project-level paths first (priority: standard > others)
    const projectPaths = [
      join(process.cwd(), '.agents', 'skills', skillId),      // Standard format
      join(process.cwd(), '.claude', 'skills', skillId),     // Claude compatible
      join(process.cwd(), '.codex', 'skills', skillId),      // Codex compatible
      join(process.cwd(), '.skills', skillId),               // Generic format
      join(process.cwd(), '.jclaw', 'skills', skillId),      // Legacy format
    ];

    for (const path of projectPaths) {
      if (existsSync(path)) return path;
    }

    // Check global paths (~/.agents/skills/, etc.)
    const globalPaths = [
      join(homedir(), '.agents', 'skills', skillId),         // Global standard
      join(homedir(), '.claude', 'skills', skillId),         // Global Claude
      join(homedir(), '.jclaw', 'skills', skillId),          // Global JClaw
    ];

    for (const path of globalPaths) {
      if (existsSync(path)) return path;
    }

    // Default to project-level standard path for new installations
    return join(process.cwd(), '.agents', 'skills', skillId);
  }

  private getCache<T>(key: string): T | null {
    if (!this.config.enableCache) return null;
    const entry = this.cache.get(key);
    if (!entry) return null;
    if (Date.now() - entry.timestamp > this.config.cacheTtl) {
      this.cache.delete(key);
      return null;
    }
    return entry.data as T;
  }

  private setCache(key: string, data: unknown): void {
    if (!this.config.enableCache) return;
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  private async ensureCacheDir(): Promise<void> {
    if (!this.config.enableCache) return;
    try {
      await mkdir(this.config.cacheDir, { recursive: true });
    } catch {}
  }

  private getHeaders(): Record<string, string> {
    return {
      'User-Agent': this.config.userAgent,
      'Accept': 'application/json',
    };
  }
}

export function createSkillShAdapter(
  llmClient: LLMClient,
  config?: SkillShAdapterConfig
): SkillShAdapter {
  return new SkillShAdapter(llmClient, config);
}

// Enhanced skill.sh API integration
export interface SkillShSearchResponse {
  results: SkillShResult[];
  total: number;
  page: number;
  hasMore: boolean;
}

// Add caching for skill.sh API calls
const apiCache = new Map<string, { data: unknown; timestamp: number }>();
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

export async function searchSkillShAPI(
  query: string,
  options?: { limit?: number; sortBy?: string }
): Promise<SkillShSearchResponse> {
  const cacheKey = `skillsh:${query}:${JSON.stringify(options || {})}`;
  
  // Check cache
  const cached = apiCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data as SkillShSearchResponse;
  }

  try {
    // Real API call to skill.sh
    const params = new URLSearchParams({ q: query });
    if (options?.limit) params.set('limit', String(options.limit));
    if (options?.sortBy) params.set('sort', options.sortBy);

    const response = await fetch(`https://api.skills.sh/v1/search?${params}`, {
      headers: { 'Accept': 'application/json' },
      signal: AbortSignal.timeout(30000),
    });

    if (!response.ok) {
      throw new Error(`skill.sh API error: ${response.status}`);
    }

    const data = await response.json();
    
    // Cache the result
    apiCache.set(cacheKey, { data, timestamp: Date.now() });
    
    return data as unknown as SkillShSearchResponse;
  } catch (error) {
    console.error('skill.sh API search failed:', error);
    // Return empty results on error
    return { results: [], total: 0, page: 1, hasMore: false };
  }
}

// Clear API cache
export function clearSkillShCache(): void {
  apiCache.clear();
}

// Get cache stats
export function getCacheStats(): { size: number; keys: string[] } {
  const now = Date.now();
  const validKeys: string[] = [];
  
  for (const [key, value] of apiCache.entries()) {
    if (now - value.timestamp < CACHE_TTL) {
      validKeys.push(key);
    } else {
      apiCache.delete(key);
    }
  }
  
  return { size: validKeys.length, keys: validKeys };
}
