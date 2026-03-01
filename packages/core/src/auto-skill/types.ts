/**
 * AutoSkill Types
 *
 * Type definitions for automatic skill discovery, generation, and installation.
 *
 * @module @jclaw/core/auto-skill/types
 */

import type { Capability } from '../types.js';

/**
 * 能力缺口分析结果
 */
export interface CapabilityGap {
  /** 能力名称 */
  capability: string;
  /** 能力描述 */
  description: string;
  /** 输入参数 Schema */
  inputSchema?: Record<string, unknown>;
  /** 复杂度评估 */
  complexity: 'simple' | 'medium' | 'complex';
  /** 为什么需要这个能力 */
  reasoning: string;
}

/**
 * 生成的扩展代码
 */
export interface GeneratedExtension {
  /** 扩展名称 */
  name: string;
  /** 完整代码内容 */
  code: string;
  /** 对应的能力缺口 */
  gap: CapabilityGap;
  /** 代码版本 */
  version: string;
  /** 生成时间戳 */
  generatedAt: Date;
  /** 使用的模型 */
  model: string;
}

/**
 * 技能生成配置
 */
export interface AutoSkillConfig {
  /** 是否启用自动生成 */
  enabled: boolean;
  /** 最大生成尝试次数 */
  maxGenerationAttempts?: number;
  /** 自动保存目录 */
  storageDir?: string;
  /** 是否自动安装 */
  autoInstall?: boolean;
  /** 最小适应度阈值 */
  minFitness?: number;
  /** 生成超时时间（毫秒） */
  generationTimeout?: number;
  /** 是否启用进化优化 */
  enableEvolution?: boolean;
}

/**
 * 技能发现结果
 */
export interface DiscoveryResult {
  /** 任务分析 */
  taskAnalysis: string;
  /** 识别出的能力缺口 */
  gaps: CapabilityGap[];
  /** 建议的现有能力组合 */
  suggestedCapabilities: string[];
}

/**
 * 生成结果
 */
export interface GenerationResult {
  /** 是否成功 */
  success: boolean;
  /** 生成的扩展 */
  extension?: GeneratedExtension;
  /** 生成的步骤记录 */
  steps: GenerationStep[];
  /** 错误信息 */
  error?: string;
}

/**
 * 生成步骤
 */
export interface GenerationStep {
  /** 步骤名称 */
  name: string;
  /** 步骤状态 */
  status: 'pending' | 'running' | 'success' | 'failed';
  /** 开始时间 */
  startTime?: Date;
  /** 结束时间 */
  endTime?: Date;
  /** 输出内容 */
  output?: string;
  /** 错误信息 */
  error?: string;
}

/**
 * 安装结果
 */
export interface InstallationResult {
  /** 是否成功 */
  success: boolean;
  /** 安装的扩展名称 */
  extensionName: string;
  /** 安装路径 */
  installPath: string;
  /** 编译输出 */
  compileOutput?: string;
  /** 验证结果 */
  validationResult?: {
    passed: boolean;
    fitness?: number;
    errors: string[];
  };
  /** 错误信息 */
  error?: string;
}

/**
 * 技能使用统计
 */
export interface SkillUsageStats {
  /** 技能名称 */
  skillName: string;
  /** 使用次数 */
  usageCount: number;
  /** 成功次数 */
  successCount: number;
  /** 平均执行时间 */
  avgExecutionTime: number;
  /** 上次使用时间 */
  lastUsedAt?: Date;
  /** 用户评分 */
  userRating?: number;
}

/**
 * 自生成技能元数据
 */
export interface AutoSkillMetadata {
  /** 技能 ID */
  id: string;
  /** 技能名称 */
  name: string;
  /** 生成的能力 */
  capability: Capability;
  /** 源代码 */
  sourceCode: string;
  /** 生成的原因 */
  generationReason: string;
  /** 父技能 ID（如果是进化而来） */
  parentSkillId?: string;
  /** 版本历史 */
  versions: SkillVersion[];
  /** 使用统计 */
  usageStats: SkillUsageStats;
  /** 是否已验证 */
  isValidated: boolean;
  /** 适应度分数 */
  fitness?: number;
}

/**
 * 技能版本
 */
export interface SkillVersion {
  /** 版本号 */
  version: string;
  /** 代码内容 */
  code: string;
  /** 变更说明 */
  changes: string;
  /** 适应度 */
  fitness: number;
  /** 创建时间 */
  createdAt: Date;
}

/**
 * Skill.sh Adapter Configuration
 */
export interface SkillShAdapterConfig {
  /** API base URL */
  apiBase?: string;
  /** API key for authentication */
  apiKey?: string;
  /** Request timeout in milliseconds */
  timeout?: number;
  /** Enable caching */
  enableCache?: boolean;
  /** Cache TTL in seconds */
  cacheTtl?: number;
}
