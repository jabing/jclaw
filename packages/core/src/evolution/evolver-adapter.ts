/**
 * Evolver Adapter
 * 
 * 适配真实的 Evolver 项目 (autogame-17/evolver)
 * 通过子进程调用 Evolver CLI
 * 
 * @module @jclaw/core/evolution/evolver-adapter
 */

import { spawn } from 'child_process';
import { promises as fs } from 'fs';
import * as path from 'path';
import * as os from 'os';

/**
 * Evolver 适配器配置
 */
export interface EvolverAdapterConfig {
  /** Evolver 可执行文件路径 */
  evolverPath?: string;
  /** 工作目录 */
  workspace?: string;
  /** 执行超时时间 */
  timeout?: number;
  /** 是否启用调试日志 */
  verbose?: boolean;
}

/**
 * 进化结果
 */
export interface EvolverResult {
  /** 是否成功 */
  success: boolean;
  /** 进化后的代码 */
  mutated?: string;
  /** 适应度分数 (0-1) */
  fitness?: number;
  /** 策略类型 */
  strategy?: string;
  /** 改进描述 */
  description?: string;
  /** 错误信息 */
  error?: string;
}

/**
 * Evolver Adapter
 * 
 * 调用真实的 Evolver 项目进行代码进化。
 * Evolver 项目地址: https://github.com/autogame-17/evolver
 * 
 * @example
 * ```typescript
 * const adapter = new EvolverAdapter();
 * 
 * const result = await adapter.evolve(code, {
 *   strategy: 'optimize'
 * });
 * 
 * if (result.success) {
 *   console.log('进化后的代码:', result.mutated);
 *   console.log('适应度:', result.fitness);
 * }
 * ```
 */
export class EvolverAdapter {
  private readonly config: Required<EvolverAdapterConfig>;

  constructor(config: EvolverAdapterConfig = {}) {
    this.config = {
      evolverPath: config.evolverPath || 'evolver',
      workspace: config.workspace || path.join(os.tmpdir(), 'jclaw-evolver'),
      timeout: config.timeout || 60000,
      verbose: config.verbose || false,
    };
  }

  /**
   * 检查 Evolver 是否可用
   */
  async isAvailable(): Promise<boolean> {
    return new Promise((resolve) => {
      const proc = spawn(this.config.evolverPath, ['--version'], {
        timeout: 5000,
      });

      proc.on('error', () => resolve(false));
      proc.on('close', (code) => resolve(code === 0));
    });
  }

  /**
   * 进化代码
   * 
   * @param code - 原始代码
   * @param options - 进化选项
   * @returns 进化结果
   */
  async evolve(
    code: string,
    options: {
      strategy?: 'repair' | 'optimize' | 'innovate';
      context?: string;
    } = {}
  ): Promise<EvolverResult> {
    // 创建工作目录
    const workDir = path.join(this.config.workspace, `evolve-${Date.now()}`);
    await fs.mkdir(workDir, { recursive: true });

    try {
      // 写入输入文件
      const inputFile = path.join(workDir, 'input.js');
      await fs.writeFile(inputFile, code, 'utf-8');

      // 构建命令参数
      const args = ['run', '--input', inputFile];

      if (options.strategy) {
        args.push('--strategy', options.strategy);
      }

      if (options.context) {
        const contextFile = path.join(workDir, 'context.txt');
        await fs.writeFile(contextFile, options.context, 'utf-8');
        args.push('--context', contextFile);
      }

      this.log(`执行: ${this.config.evolverPath} ${args.join(' ')}`);

      // 执行 Evolver
      return await this.runEvolver(args, workDir);
    } finally {
      // 清理工作目录
      await this.cleanup(workDir);
    }
  }

  /**
   * 批量进化
   * 
   * 使用多个策略同时进化，返回最佳结果
   */
  async evolveBatch(
    code: string,
    strategies: Array<'repair' | 'optimize' | 'innovate'> = ['repair', 'optimize', 'innovate']
  ): Promise<EvolverResult[]> {
    const promises = strategies.map((strategy) =>
      this.evolve(code, { strategy }).catch((error): EvolverResult => ({
        success: false,
        strategy,
        error: error instanceof Error ? error.message : String(error),
      }))
    );

    return Promise.all(promises);
  }

  /**
   * 运行 Evolver 进程
   */
  private runEvolver(args: string[], workDir: string): Promise<EvolverResult> {
    return new Promise((resolve) => {
      const proc = spawn(this.config.evolverPath, args, {
        cwd: workDir,
        timeout: this.config.timeout,
        env: { ...process.env, NODE_ENV: 'production' },
      });

      let stderr = '';

      proc.stdout.on('data', (data: Buffer) => {
        const text = data.toString('utf-8');
        this.log(`stdout: ${text.trim()}`);
      });

      proc.stderr.on('data', (data: Buffer) => {
        const text = data.toString('utf-8');
        stderr += text;
        this.log(`stderr: ${text.trim()}`);
      });

      proc.on('close', async (code) => {
        try {
          // 尝试读取结果文件
          const result = await this.readResult(workDir);
          resolve(result);
        } catch (error) {
          resolve({
            success: false,
            error: stderr || (error instanceof Error ? error.message : String(error)) || `Process exited with code ${code}`,
          });
        }
      });

      proc.on('error', (error) => {
        resolve({
          success: false,
          error: `Failed to spawn evolver: ${error instanceof Error ? error.message : String(error)}`,
        });
      });
    });
  }

  /**
   * 读取进化结果
   */
  private async readResult(workDir: string): Promise<EvolverResult> {
    // 尝试多个可能的结果文件位置
    const possibleOutputs = [
      path.join(workDir, 'output.js'),
      path.join(workDir, 'result.js'),
      path.join(workDir, 'evolved.js'),
      path.join(workDir, 'out', 'output.js'),
    ];

    let mutated: string | undefined;
    for (const file of possibleOutputs) {
      try {
        mutated = await fs.readFile(file, 'utf-8');
        break;
      } catch {
        // 文件不存在，继续尝试
      }
    }

    // 读取元数据
    let fitness = 0.5;
    let strategy = 'unknown';
    let description = '';

    const possibleMetadata = [
      path.join(workDir, 'result.json'),
      path.join(workDir, 'metadata.json'),
      path.join(workDir, 'fitness.json'),
    ];

    for (const file of possibleMetadata) {
      try {
        const data = JSON.parse(await fs.readFile(file, 'utf-8'));
        fitness = data.fitness ?? data.score ?? fitness;
        strategy = data.strategy ?? strategy;
        description = data.description ?? data.reasoning ?? description;
        break;
      } catch {
        // 文件不存在或解析失败
      }
    }

    if (!mutated) {
      return {
        success: false,
        error: 'No output file generated',
      };
    }

    return {
      success: true,
      mutated,
      fitness,
      strategy,
      description,
    };
  }

  /**
   * 清理工作目录
   */
  private async cleanup(workDir: string): Promise<void> {
    try {
      await fs.rm(workDir, { recursive: true, force: true });
    } catch {
      // 忽略清理错误
    }
  }

  /**
   * 日志输出
   */
  private log(message: string): void {
    if (this.config.verbose) {
      console.log(`[EvolverAdapter] ${message}`);
    }
  }
}

/**
 * 创建 Evolver 适配器
 */
export function createEvolverAdapter(config?: EvolverAdapterConfig): EvolverAdapter {
  return new EvolverAdapter(config);
}
