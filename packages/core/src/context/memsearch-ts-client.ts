/**
 * MemSearch-TS Client
 *
 * TypeScript-native semantic memory client using memsearch-core.
 * Zero Python dependency, built on Milvus vector database.
 *
 * @module @jclaw/core/context/memsearch-ts-client
 */

import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';
import type { ContextManager } from '../types.js';

export interface MemSearchTsConfig {
  memoryPath?: string;
  embeddingProvider?: 'openai' | 'ollama';
  embeddingModel?: string;
  milvusUri?: string;
  collectionName?: string;
  verbose?: boolean;
}

interface SearchResult {
  content: string;
  score: number;
  source?: string;
}

interface MemSearchInstance {
  index(): Promise<void>;
  search(query: string, options?: { topK?: number }): Promise<SearchResult[]>;
  close?(): void;
}

export class MemSearchTsClient implements ContextManager {
  private initialized = false;
  private readonly config: Required<MemSearchTsConfig>;
  private mem: MemSearchInstance | null = null;

  constructor(config: MemSearchTsConfig = {}) {
    this.config = {
      memoryPath: config.memoryPath || './.jclaw/memory',
      embeddingProvider: config.embeddingProvider || 'openai',
      embeddingModel: config.embeddingModel || 'text-embedding-3-small',
      milvusUri: config.milvusUri || join(process.env.HOME || '.', '.jclaw', 'milvus.db'),
      collectionName: config.collectionName || 'jclaw_memories',
      verbose: config.verbose || false,
    };
  }

  async connect(): Promise<void> {
    try {
      if (!existsSync(this.config.memoryPath)) {
        await mkdir(this.config.memoryPath, { recursive: true });
      }

      const { MemSearch } = await import('memsearch-core');

      this.mem = new MemSearch({
        paths: [this.config.memoryPath],
        embedding: {
          provider: this.config.embeddingProvider,
          model: this.config.embeddingModel,
        },
        milvus: {
          uri: this.config.milvusUri,
          collection: this.config.collectionName,
        },
      }) as MemSearchInstance;

      await this.mem.index();
      this.initialized = true;

      if (this.config.verbose) {
        console.log('[MemSearch-TS] Connected, memory path: ' + this.config.memoryPath);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error('Failed to initialize MemSearch-TS: ' + message);
    }
  }

  async disconnect(): Promise<void> {
    if (this.mem) {
      this.mem.close?.();
      this.mem = null;
    }
    this.initialized = false;
  }

  async query(question: string, options?: { topK?: number }): Promise<string> {
    if (!this.initialized || !this.mem) {
      throw new Error('MemSearch-TS client not initialized');
    }

    try {
      await this.mem.index();
      const results = await this.mem.search(question, { topK: options?.topK ?? 5 });

      if (this.config.verbose) {
        console.log('[MemSearch-TS] Found ' + results.length + ' results');
      }

      return results.map((r, i) => '[' + (i+1) + '] (score: ' + r.score.toFixed(2) + ')\n' + r.content).join('\n\n---\n\n');
    } catch (error) {
      if (this.config.verbose) {
        console.error('[MemSearch-TS] Search failed:', error);
      }
      return '';
    }
  }

  async saveMemory(content: string, title?: string): Promise<void> {
    const date = new Date().toISOString().split('T')[0];
    const timestamp = new Date().toISOString();
    const fileName = date + '.md';
    const filePath = join(this.config.memoryPath, fileName);

    const entry = title
      ? '\n## ' + title + '\n\n> Saved at: ' + timestamp + '\n\n' + content + '\n\n---\n'
      : '\n> Saved at: ' + timestamp + '\n\n' + content + '\n\n---\n';

    await writeFile(filePath, entry, { flag: 'a' });

    if (this.config.verbose) {
      console.log('[MemSearch-TS] Saved memory: ' + (title || 'untitled'));
    }

    if (this.mem) {
      await this.mem.index();
    }
  }

  async addResource(resourcePath: string): Promise<string> {
    if (!this.initialized) {
      throw new Error('MemSearch-TS client not initialized');
    }

    const { copyFile } = await import('fs/promises');
    const { basename } = await import('path');
    const destPath = join(this.config.memoryPath, basename(resourcePath));

    await copyFile(resourcePath, destPath);

    if (this.mem) {
      await this.mem.index();
    }

    return destPath;
  }

  isConnected(): boolean {
    return this.initialized;
  }

  getStats(): { memoryPath: string; connected: boolean } {
    return {
      memoryPath: this.config.memoryPath,
      connected: this.initialized,
    };
  }
}

export function createMemSearchTsClient(config?: MemSearchTsConfig): MemSearchTsClient {
  return new MemSearchTsClient(config);
}
