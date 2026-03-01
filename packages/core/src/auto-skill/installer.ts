/**
 * AutoSkill Installer
 * 
 * Compiles and installs generated skills.
 * 
 * @module @jclaw/core/auto-skill/installer
 */

import { execSync } from 'child_process';
import { writeFile, mkdir, rm } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';
import { readdir } from 'fs/promises';
import type { ExtensionRegistry } from '../extension-system/registry.js';

import type { Extension } from '../types.js';
import type { GeneratedExtension, InstallationResult } from './types.js';

export class AutoSkillInstaller {
  constructor(
    private registry: ExtensionRegistry,
    private storageDir: string = './.jclaw/auto-skills'
  ) {}

  /**
   * 编译并安装生成的 Extension
   */
  async install(extension: GeneratedExtension): Promise<InstallationResult> {
    const extensionDir = join(this.storageDir, extension.name);
    
    try {
      // 1. 保存源代码
      await this.saveSourceFiles(extensionDir, extension);

      // 2. 安装依赖
      await this.installDependencies(extensionDir);

      // 3. 编译 TypeScript
      const compileOutput = await this.compileExtension(extensionDir);

      // 4. 验证编译结果
      const distPath = join(extensionDir, 'dist', 'index.js');
      if (!existsSync(distPath)) {
        throw new Error('Compilation failed: dist/index.js not found');
      }

      // 5. 动态加载并注册
      const module = await import(distPath);
      const extensionInstance = module.default;
      
      if (!extensionInstance) {
        throw new Error('Extension does not export default');
      }

      // 验证 Extension 接口
      if (!this.isValidExtension(extensionInstance)) {
        throw new Error('Extension does not implement required interface');
      }

      // 注册到系统
      this.registry.register(extensionInstance);

      return {
        success: true,
        extensionName: extension.name,
        installPath: extensionDir,
        compileOutput,
        validationResult: {
          passed: true,
          errors: []
        }
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      // 清理失败的安装
      try {
        await rm(extensionDir, { recursive: true, force: true });
      } catch {
        // 忽略清理错误
      }

      return {
        success: false,
        extensionName: extension.name,
        installPath: extensionDir,
        error: errorMessage
      };
    }
  }

  /**
   * 保存源文件
   */
  private async saveSourceFiles(extensionDir: string, extension: GeneratedExtension): Promise<void> {
    // 创建目录结构
    const srcDir = join(extensionDir, 'src');
    await mkdir(srcDir, { recursive: true });

    // 保存主代码文件
    await writeFile(join(srcDir, 'index.ts'), extension.code);

    // 创建 package.json
    const packageJson = {
      name: extension.name,
      version: extension.version,
      type: 'module',
      main: 'dist/index.js',
      types: 'dist/index.d.ts',
      dependencies: {
        '@jclaw/core': '^0.1.0'
      },
      devDependencies: {
        typescript: '^5.3.0'
      }
    };
    await writeFile(
      join(extensionDir, 'package.json'),
      JSON.stringify(packageJson, null, 2)
    );

    // 创建 tsconfig.json
    const tsConfig = {
      compilerOptions: {
        target: 'ES2022',
        module: 'NodeNext',
        moduleResolution: 'NodeNext',
        strict: true,
        esModuleInterop: true,
        skipLibCheck: true,
        forceConsistentCasingInFileNames: true,
        declaration: true,
        outDir: 'dist'
      },
      include: ['src/**/*']
    };
    await writeFile(
      join(extensionDir, 'tsconfig.json'),
      JSON.stringify(tsConfig, null, 2)
    );
  }

  /**
   * 安装 npm 依赖
   */
  private async installDependencies(extensionDir: string): Promise<void> {
    try {
      execSync('npm install', {
        cwd: extensionDir,
        stdio: 'pipe',
        timeout: 60000
      });
    } catch (error) {
      throw new Error(`Failed to install dependencies: ${error}`);
    }
  }

  /**
   * 编译 TypeScript
   */
  private async compileExtension(extensionDir: string): Promise<string> {
    try {
      const output = execSync('npx tsc', {
        cwd: extensionDir,
        stdio: 'pipe',
        encoding: 'utf-8',
        timeout: 60000
      });
      return output;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Compilation failed: ${errorMessage}`);
    }
  }

  /**
   * 验证 Extension 接口
   */
  private isValidExtension(obj: unknown): obj is Extension {
    if (typeof obj !== 'object' || obj === null) {
      return false;
    }

    const ext = obj as Record<string, unknown>;
    
    return (
      typeof ext.name === 'string' &&
      typeof ext.version === 'string' &&
      typeof ext.description === 'string' &&
      Array.isArray(ext.capabilities) &&
      typeof ext.install === 'function' &&
      typeof ext.uninstall === 'function'
    );
  }

  /**
   * 卸载已安装的 skill
   */
  async uninstall(skillName: string): Promise<boolean> {
    try {
      // 检查扩展是否存在
      const extensionDir = join(this.storageDir, skillName);
      if (!existsSync(extensionDir)) {
        return false;
      }
      
      // 从 registry 注销
      this.registry.unregister(skillName);
      
      // 删除文件
      await rm(extensionDir, { recursive: true, force: true });
      
      return true;
    } catch {
      return false;
    }
  }

  /**
   * 列出已安装的 auto skills
   */
  async listInstalled(): Promise<string[]> {
    if (!existsSync(this.storageDir)) {
      return [];
    }

    try {
      const items = await readdir(this.storageDir);
      return items;
    } catch {
      return [];
    }
  }
}

export function createAutoSkillInstaller(
  registry: ExtensionRegistry,
  storageDir?: string
): AutoSkillInstaller {
  return new AutoSkillInstaller(registry, storageDir);
}
