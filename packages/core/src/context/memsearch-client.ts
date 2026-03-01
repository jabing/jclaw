/**
 * MemSearch Client
 * 
 * 通过 Python 子进程调用 MemSearch
 * 替代 OpenViking，更简单轻量
 * 
 * MemSearch GitHub: https://github.com/zilliztech/memsearch
 * 
 * @module @jclaw/core/context/memsearch-client
 */

import { spawn } from 'child_process';

import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import type { ContextManager } from '../types.js';
export interface SearchResult {
  content: string;
  score?: number;
  metadata?: Record<string, unknown>;
}

export interface PythonScriptResult {
  status?: string;
  uri?: string;
  error?: string;
  [key: string]: unknown;
}

export interface MemSearchConfig {
  memoryPath?: string;
  embeddingProvider?: 'openai' | 'local' | 'ollama';
  embeddingModel?: string;
  verbose?: boolean;
}

export class MemSearchClient implements ContextManager {

  private isSearchResultArray(value: unknown): value is SearchResult[] {
    return Array.isArray(value) && value.every(item => 
      typeof item === 'object' && item !== null && 'content' in item);
  }

  private isPythonScriptResult(value: unknown): value is PythonScriptResult {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
  }

  private initialized = false;
  private readonly config: Required<MemSearchConfig>;

  constructor(config: MemSearchConfig = {}) {
    this.config = {
      memoryPath: config.memoryPath || './memory',
      embeddingProvider: config.embeddingProvider || 'local',
      embeddingModel: config.embeddingModel || 'all-MiniLM-L6-v2',
      verbose: config.verbose || false,
    };
  }

  async connect(): Promise<void> {
    try {
      // 确保内存目录存在
      if (!existsSync(this.config.memoryPath)) {
        await mkdir(this.config.memoryPath, { recursive: true });
      }

      // 测试 MemSearch 是否可用
      await this.runPythonScript('test', {});
      this.initialized = true;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to initialize MemSearch: ${message}`);
    }
  }

  async disconnect(): Promise<void> {
    this.initialized = false;
  }

  async query(question: string, options?: { topK?: number }): Promise<string> {
    if (!this.initialized) {
      throw new Error('Client not initialized');
    }

    const results = await this.runPythonScript('search', {
      query: question,
      top_k: options?.topK ?? 5,
      memory_path: this.config.memoryPath,
    });

    if (!this.isSearchResultArray(results)) {
      throw new Error('Expected search results array');
    }
    return results.map((r: SearchResult) => r.content).join('\n\n');
  }

  async addResource(resourcePath: string): Promise<string> {
    if (!this.initialized) {
      throw new Error('Client not initialized');
    }

    // 将资源复制到内存目录
    const content = await this.runPythonScript('add_resource', {
      resource_path: resourcePath,
      memory_path: this.config.memoryPath,
    });

    if (!this.isPythonScriptResult(content)) {
      throw new Error('Expected PythonScriptResult');
    }
    return content.uri || '';
  }

  async saveMemory(content: string, title?: string): Promise<void> {
    const date = new Date().toISOString().split('T')[0];
    const fileName = `${date}.md`;
    const filePath = join(this.config.memoryPath, fileName);
    
    const entry = title 
      ? `\n## ${title}\n${content}\n`
      : `\n${content}\n`;
    
    await writeFile(filePath, entry, { flag: 'a' });
    
    // 重新索引
    await this.runPythonScript('index', {
      memory_path: this.config.memoryPath,
    });
  }

  isConnected(): boolean {
    return this.initialized;
  }

  private runPythonScript(action: string, params: Record<string, unknown>): Promise<unknown> {
    return new Promise((resolve, reject) => {
      const script = this.generatePythonScript(action, params);
      const proc = spawn('python', ['-c', script], {
        env: {
          ...process.env,
          MEMSEARCH_PROVIDER: this.config.embeddingProvider,
          MEMSEARCH_MODEL: this.config.embeddingModel,
        },
      });

      let stdout = '';
      let stderr = '';

      proc.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      proc.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      proc.on('close', (code) => {
        if (code !== 0) {
          reject(new Error(`Python script failed: ${stderr}`));
          return;
        }

        try {
          const result = JSON.parse(stdout);
          resolve(result);
        } catch {
          resolve({ status: 'success', output: stdout.trim() });
        }
      });

      proc.on('error', (error) => {
        reject(error);
      });
    });
  }

  private generatePythonScript(action: string, params: Record<string, unknown>): string {
    const baseScript = `
import asyncio
import json
import sys
sys.path.insert(0, '.')

from memsearch import MemSearch

async def main():
    mem = MemSearch(
        paths=['${params.memory_path || this.config.memoryPath}'],
        embedding_provider='${this.config.embeddingProvider}',
        embedding_model='${this.config.embeddingModel}',
    )
`;

    switch (action) {
      case 'test':
        return baseScript + `
    await mem.index()
    print(json.dumps({"status": "ok"}))

asyncio.run(main())
`;
      case 'search':
        return baseScript + `
    await mem.index()
    results = await mem.search('${params.query}', top_k=${params.top_k})
    print(json.dumps(results))

asyncio.run(main())
`;
      case 'index':
        return baseScript + `
    await mem.index()
    print(json.dumps({"status": "indexed"}))

asyncio.run(main())
`;
      case 'add_resource':
        return baseScript + `
    import shutil
    from pathlib import Path
    
    src = Path('${params.resource_path}')
    dst = Path('${params.memory_path}') / src.name
    shutil.copy2(src, dst)
    await mem.index()
    print(json.dumps({"uri": str(dst)}))

asyncio.run(main())
`;
      default:
        return baseScript + `
    print(json.dumps({"error": "Unknown action"}))

asyncio.run(main())
`;
    }
  }
}

export function createMemSearchClient(config?: MemSearchConfig): MemSearchClient {
  return new MemSearchClient(config);
}
