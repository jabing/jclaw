/**
 * Simple Memory Client - Enhanced Version
 */

import { writeFile, readFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';
import type { ContextManager } from '../types.js';

export interface SimpleMemoryConfig {
  memoryPath?: string;
  verbose?: boolean;
  enableSynonyms?: boolean;
  enableFuzzyMatch?: boolean;
  fuzzyThreshold?: number;
}

const DEFAULT_SYNONYMS: Record<string, string[]> = {
  '用户': ['user', 'customer', 'client'],
  '性能': ['performance', 'speed', 'optimization'],
  '数据库': ['database', 'db', 'storage'],
  '配置': ['config', 'configuration', 'settings'],
  '接口': ['api', 'interface', 'endpoint'],
  '部署': ['deploy', 'deployment', 'release'],
  '测试': ['test', 'testing', 'spec'],
  '日志': ['log', 'logging', 'logger'],
  '错误': ['error', 'exception', 'bug'],
  '优化': ['optimize', 'improve', 'enhance'],
};

function levenshteinDistance(a: string, b: string): number {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;
  
  const matrix: number[][] = [];
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0]![j] = j;
  }
  
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      const substitutionCost = b.charAt(i - 1) === a.charAt(j - 1) ? 0 : 1;
      const deletion = (matrix[i - 1]![j] ?? 0) + 1;
      const insertion = (matrix[i]![j - 1] ?? 0) + 1;
      const substitution = (matrix[i - 1]![j - 1] ?? 0) + substitutionCost;
      matrix[i]![j] = Math.min(deletion, insertion, substitution);
    }
  }
  
  return matrix[b.length]![a.length] ?? 0;
}

function calculateSimilarity(a: string, b: string): number {
  const maxLen = Math.max(a.length, b.length);
  if (maxLen === 0) return 1;
  return 1 - levenshteinDistance(a, b) / maxLen;
}

interface MemoryEntry {
  id: string;
  content: string;
  title?: string;
  timestamp: number;
  tags: string[];
  accessCount: number;
  lastAccessed: number;
  layer: 'L0' | 'L1' | 'L2';
}

interface SearchResult {
  entry: MemoryEntry;
  score: number;
  matchType: 'exact' | 'synonym' | 'fuzzy' | 'tag';
}

export class SimpleMemoryClient implements ContextManager {
  private initialized = false;
  private readonly config: Required<SimpleMemoryConfig>;
  private memories: Map<string, MemoryEntry> = new Map();
  private synonyms: Map<string, string[]> = new Map();

  constructor(config: SimpleMemoryConfig = {}) {
    this.config = {
      memoryPath: config.memoryPath || './.jclaw/memory',
      verbose: config.verbose || false,
      enableSynonyms: config.enableSynonyms !== false,
      enableFuzzyMatch: config.enableFuzzyMatch !== false,
      fuzzyThreshold: config.fuzzyThreshold || 0.7,
    };
    this.initSynonyms();
  }

  private initSynonyms(): void {
    for (const [key, values] of Object.entries(DEFAULT_SYNONYMS)) {
      this.synonyms.set(key, values);
      for (const value of values) {
        const existing = this.synonyms.get(value) || [];
        if (!existing.includes(key)) {
          this.synonyms.set(value, [...existing, key, ...values.filter(v => v !== value)]);
        }
      }
    }
  }

  async connect(): Promise<void> {
    if (!existsSync(this.config.memoryPath)) {
      await mkdir(this.config.memoryPath, { recursive: true });
    }
    await this.loadAllLayers();
    this.initialized = true;
  }

  async disconnect(): Promise<void> {
    await this.saveAllLayers();
    this.initialized = false;
  }

  async query(question: string, options?: { topK?: number }): Promise<string> {
    if (!this.initialized) throw new Error('Client not initialized');
    const keywords = this.extractKeywords(question);
    const results: SearchResult[] = [];
    for (const entry of this.memories.values()) {
      const searchResult = this.scoreEntry(entry, keywords);
      if (searchResult.score > 0) results.push(searchResult);
    }
    results.sort((a, b) => b.score - a.score);
    const topK = options?.topK ?? 5;
    const topResults = results.slice(0, topK);
    for (const result of topResults) {
      await this.updateAccessStats(result.entry.id);
    }
    return topResults.map(r => r.entry.content).join('\n\n---\n\n');
  }

  async saveMemory(content: string, title?: string): Promise<void> {
    const id = `memory-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    this.memories.set(id, {
      id, content, title,
      timestamp: Date.now(),
      tags: [],
      accessCount: 0,
      lastAccessed: Date.now(),
      layer: 'L0',
    });
    await this.saveAllLayers();
    const date = new Date().toISOString().split('T')[0];
    const filePath = join(this.config.memoryPath, `${date}.md`);
    const entry = title ? `\n## ${title}\n${content}\n` : `\n${content}\n`;
    await writeFile(filePath, entry, { flag: 'a' });
  }

  async addResource(resourcePath: string): Promise<string> {
    const content = await readFile(resourcePath, 'utf-8');
    const id = `resource-${Date.now()}`;
    this.memories.set(id, {
      id, content,
      title: `Resource: ${resourcePath}`,
      timestamp: Date.now(),
      tags: ['resource'],
      accessCount: 0,
      lastAccessed: Date.now(),
      layer: 'L2',
    });
    await this.saveAllLayers();
    return id;
  }

  isConnected(): boolean {
    return this.initialized;
  }

  getStats(): { total: number; L0: number; L1: number; L2: number } {
    const stats = { total: this.memories.size, L0: 0, L1: 0, L2: 0 };
    for (const entry of this.memories.values()) {
      stats[entry.layer]++;
    }
    return stats;
  }

  async compact(): Promise<void> {
    const now = Date.now();
    const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;
    const sixtyDaysAgo = now - 60 * 24 * 60 * 60 * 1000;
    for (const [, entry] of this.memories) {
      if (entry.layer === 'L0' && entry.lastAccessed < thirtyDaysAgo && entry.accessCount < 5) {
        entry.layer = 'L1';
      }
      if (entry.layer === 'L1' && entry.lastAccessed < sixtyDaysAgo && entry.accessCount < 2) {
        entry.layer = 'L2';
      }
    }
    await this.saveAllLayers();
  }

  private extractKeywords(text: string): string[] {
    const keywords = text.toLowerCase().replace(/[^\w\s\u4e00-\u9fa5]/g, ' ').split(/\s+/).filter(k => k.length > 1);
    const expanded: string[] = [];
    for (const keyword of keywords) {
      expanded.push(keyword);
      if (this.config.enableSynonyms) {
        const syns = this.synonyms.get(keyword);
        if (syns) expanded.push(...syns);
      }
    }
    return [...new Set(expanded)];
  }

  private scoreEntry(entry: MemoryEntry, keywords: string[]): SearchResult {
    const text = (entry.content + ' ' + (entry.title || '') + ' ' + entry.tags.join(' ')).toLowerCase();
    let maxScore = 0;
    let matchType: SearchResult['matchType'] = 'exact';
    for (const keyword of keywords) {
      if (text.includes(keyword)) {
        maxScore = Math.max(maxScore, 1.0);
        matchType = 'exact';
        continue;
      }
      if (this.config.enableSynonyms) {
        const keywordSynonyms = this.synonyms.get(keyword) || [];
        for (const syn of keywordSynonyms) {
          if (text.includes(syn.toLowerCase())) {
            maxScore = Math.max(maxScore, 0.8);
            matchType = 'synonym';
            break;
          }
        }
      }
      if (this.config.enableFuzzyMatch && maxScore < 0.8) {
        const words = text.split(/\s+/);
        for (const word of words) {
          if (word.length > 3) {
            const similarity = calculateSimilarity(keyword, word);
            if (similarity >= this.config.fuzzyThreshold) {
              maxScore = Math.max(maxScore, similarity * 0.6);
              matchType = 'fuzzy';
            }
          }
        }
      }
      for (const tag of entry.tags) {
        const tagLower = tag.toLowerCase();
        if (tagLower.includes(keyword) || keyword.includes(tagLower)) {
          maxScore = Math.max(maxScore, 0.7);
          matchType = 'tag';
        }
      }
    }
    const weightedScore = this.applyWeights(maxScore, entry);
    return { entry, score: weightedScore, matchType };
  }

  private applyWeights(baseScore: number, entry: MemoryEntry): number {
    if (baseScore <= 0) return 0;
    const accessFactor = Math.min(entry.accessCount / 10, 1) * 0.3;
    const daysSinceAccess = (Date.now() - entry.lastAccessed) / (1000 * 60 * 60 * 24);
    const timeFactor = Math.max(0, 1 - daysSinceAccess / 30) * 0.2;
    const layerFactor = entry.layer === 'L0' ? 0.1 : entry.layer === 'L1' ? 0.05 : 0;
    return baseScore * 0.5 + accessFactor + timeFactor + layerFactor;
  }

  private async updateAccessStats(id: string): Promise<void> {
    const entry = this.memories.get(id);
    if (entry) {
      entry.accessCount++;
      entry.lastAccessed = Date.now();
      await this.promoteLayer(entry);
    }
  }

  private async promoteLayer(entry: MemoryEntry): Promise<void> {
    if (entry.accessCount > 20 && entry.layer === 'L2') entry.layer = 'L1';
    else if (entry.accessCount > 50 && entry.layer === 'L1') entry.layer = 'L0';
  }

  private async loadAllLayers(): Promise<void> {
    for (const layer of ['L0', 'L1', 'L2'] as const) {
      const layerPath = join(this.config.memoryPath, `layer-${layer}.json`);
      try {
        if (existsSync(layerPath)) {
          const content = await readFile(layerPath, 'utf-8');
          const data = JSON.parse(content);
          if (data.memories) {
            for (const [id, entry] of Object.entries(data.memories)) {
              this.memories.set(id, entry as MemoryEntry);
            }
          }
        }
      } catch { /* ignore */ }
    }
  }

  private async saveAllLayers(): Promise<void> {
    const layerData = {
      L0: { memories: {} as Record<string, MemoryEntry> },
      L1: { memories: {} as Record<string, MemoryEntry> },
      L2: { memories: {} as Record<string, MemoryEntry> },
    };
    for (const [id, entry] of this.memories) {
      layerData[entry.layer].memories[id] = entry;
    }
    for (const layer of ['L0', 'L1', 'L2'] as const) {
      const layerPath = join(this.config.memoryPath, `layer-${layer}.json`);
      await writeFile(layerPath, JSON.stringify(layerData[layer], null, 2));
    }
  }
}

export function createSimpleMemoryClient(config?: SimpleMemoryConfig): SimpleMemoryClient {
  return new SimpleMemoryClient(config);
}
