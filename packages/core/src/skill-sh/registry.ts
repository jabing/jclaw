/**
 * Skill Registry
 * 
 * Local registry for installed skills
 * 
 * @module @jclaw/core/skill-sh/registry
 */

import { readFile, writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
import type { SkillRegistryEntry } from './types.js';

const REGISTRY_FILE = 'skill-registry.json';

/**
 * Skill Registry Manager
 */
export class SkillRegistry {
  private entries: Map<string, SkillRegistryEntry> = new Map();
  private registryPath: string;

  constructor(storageDir?: string) {
    // Use provided path, or find existing registry, or use standard path
    const resolvedDir = storageDir ?? this.findExistingRegistryPath() ?? './.agents/skills';
    this.registryPath = join(resolvedDir, REGISTRY_FILE);
    this.load();
  }

  /**
   * Find existing registry path from possible locations
   * Priority: project-level > global
   */
  private findExistingRegistryPath(): string | null {
    // Check project-level paths first
    const projectPaths = [
      './.agents/skills',
      './.claude/skills',
      './.codex/skills',
      './.skills',
      './.jclaw/skills',
    ];
    
    for (const path of projectPaths) {
      if (existsSync(join(path, REGISTRY_FILE))) {
        return path;
      }
    }

    // Check global paths
    const globalPaths = [
      join(homedir(), '.agents', 'skills'),
      join(homedir(), '.claude', 'skills'),
      join(homedir(), '.jclaw', 'skills'),
    ];

    for (const path of globalPaths) {
      if (existsSync(join(path, REGISTRY_FILE))) {
        return path;
      }
    }

    return null;
  }

  /**
   * Register installed skill
   */
  async register(entry: SkillRegistryEntry): Promise<void> {
    this.entries.set(entry.id, entry);
    await this.save();
  }

  /**
   * Get skill entry
   */
  get(id: string): SkillRegistryEntry | undefined {
    return this.entries.get(id);
  }

  /**
   * Check if skill is registered
   */
  has(id: string): boolean {
    return this.entries.has(id);
  }

  /**
   * Get all entries
   */
  getAll(): SkillRegistryEntry[] {
    return Array.from(this.entries.values());
  }

  /**
   * Update skill status
   */
  async updateStatus(id: string, status: SkillRegistryEntry['status']): Promise<void> {
    const entry = this.entries.get(id);
    if (entry) {
      entry.status = status;
      await this.save();
    }
  }

  /**
   * Record skill usage
   */
  async recordUsage(id: string): Promise<void> {
    const entry = this.entries.get(id);
    if (entry) {
      entry.usageCount++;
      entry.lastUsedAt = new Date();
      await this.save();
    }
  }

  /**
   * Set user rating
   */
  async setRating(id: string, rating: number): Promise<void> {
    const entry = this.entries.get(id);
    if (entry) {
      entry.userRating = rating;
      await this.save();
    }
  }

  /**
   * Remove skill
   */
  async unregister(id: string): Promise<void> {
    if (this.entries.delete(id)) {
      await this.save();
    }
  }

  /**
   * Load registry from disk
   */
  private async load(): Promise<void> {
    try {
      if (existsSync(this.registryPath)) {
        const content = await readFile(this.registryPath, 'utf-8');
        const data = JSON.parse(content);
        this.entries = new Map(Object.entries(data));
      }
    } catch (error) {
      console.error('Failed to load skill registry:', error);
    }
  }

  /**
   * Save registry to disk
   */
  private async save(): Promise<void> {
    try {
      const dir = this.registryPath.slice(0, this.registryPath.lastIndexOf('/'));
      await mkdir(dir, { recursive: true });
      
      const data = Object.fromEntries(this.entries);
      await writeFile(this.registryPath, JSON.stringify(data, null, 2));
    } catch (error) {
      console.error('Failed to save skill registry:', error);
    }
  }
}

export function createSkillRegistry(storageDir?: string): SkillRegistry {
  return new SkillRegistry(storageDir);
}
