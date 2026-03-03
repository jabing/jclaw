/**
 * Task Complexity Assessor
 *
 * Evaluates task complexity to determine appropriate execution mode
 *
 * @module @jclaw/core/runtime/complexity-assessor
 */

export interface ComplexityFactors {
  descriptionLength: number;
  fileCount: number;
  hasRiskKeywords: boolean;
  hasMultiSteps: boolean;
  historicalFailureRate: number;
}

export interface ComplexityResult {
  score: number; // 0.0 to 1.0
  level: 'simple' | 'medium' | 'complex';
  factors: ComplexityFactors;
  recommendedMode: 'react' | 'ooda' | 'oops';
}

const RISK_KEYWORDS = [
  // English keywords
  'delete',
  'remove',
  'drop',
  'truncate',
  'destroy',
  'production',
  'live',
  'critical',
  'refactor',
  'migrate',
  'migration',
  'security',
  'password',
  'secret',
  'backup',
  'restore',
  // Chinese keywords
  '删除',
  '移除',
  '清空',
  '销毁',
  '生产',
  '线上',
  '关键',
  '紧急',
  '重要',
  '重构',
  '迁移',
  '安全',
  '密码',
  '密钥',
  '秘密',
  '备份',
  '恢复',
];

const MULTI_STEP_INDICATORS = [
  '然后',
  '之后',
  '接着',
  '最后',
  '并且',
  'then',
  'after',
  'next',
  'finally',
  'also',
  '第一步',
  '第二步',
  'step 1',
  'step 2',
  'first',
  'second',
  'third',
];

export class ComplexityAssessor {
  private historicalData: Map<string, { attempts: number; failures: number }> =
    new Map();

  assess(prompt: string, context?: Record<string, unknown>): ComplexityResult {
    const factors: ComplexityFactors = {
      descriptionLength: this.assessDescriptionLength(prompt),
      fileCount: this.estimateFileCount(context),
      hasRiskKeywords: this.checkRiskKeywords(prompt),
      hasMultiSteps: this.checkMultiSteps(prompt),
      historicalFailureRate: this.getHistoricalFailureRate(prompt),
    };

    const score = this.calculateScore(factors);
    const level = this.determineLevel(score);
    const recommendedMode = this.recommendMode(score);

    return { score, level, factors, recommendedMode };
  }

  recordResult(prompt: string, success: boolean): void {
    const key = this.extractKey(prompt);
    const data = this.historicalData.get(key) || { attempts: 0, failures: 0 };
    data.attempts++;
    if (!success) data.failures++;
    this.historicalData.set(key, data);
  }

  private assessDescriptionLength(prompt: string): number {
    const length = prompt.length;
    if (length < 100) return 0;
    if (length < 300) return 0.3;
    if (length < 500) return 0.6;
    return 1;
  }

  private estimateFileCount(context?: Record<string, unknown>): number {
    if (!context) return 0;

    const files = (context as Record<string, unknown>).files;
    if (Array.isArray(files)) {
      return Math.min(files.length / 10, 1);
    }

    return 0;
  }

  private checkRiskKeywords(prompt: string): boolean {
    const lowerPrompt = prompt.toLowerCase();
    return RISK_KEYWORDS.some((keyword) =>
      lowerPrompt.includes(keyword.toLowerCase())
    );
  }

  private checkMultiSteps(prompt: string): boolean {
    const lowerPrompt = prompt.toLowerCase();
    return MULTI_STEP_INDICATORS.some((indicator) =>
      lowerPrompt.includes(indicator.toLowerCase())
    );
  }

  private getHistoricalFailureRate(prompt: string): number {
    const key = this.extractKey(prompt);
    const data = this.historicalData.get(key);
    if (!data || data.attempts === 0) return 0;
    return data.failures / data.attempts;
  }

  private calculateScore(factors: ComplexityFactors): number {
    const weights = {
      descriptionLength: 0.15,
      fileCount: 0.15,
      hasRiskKeywords: 0.25,
      hasMultiSteps: 0.15,
      historicalFailureRate: 0.3,
    };

    return (
      factors.descriptionLength * weights.descriptionLength +
      factors.fileCount * weights.fileCount +
      (factors.hasRiskKeywords ? 1 : 0) * weights.hasRiskKeywords +
      (factors.hasMultiSteps ? 1 : 0) * weights.hasMultiSteps +
      factors.historicalFailureRate * weights.historicalFailureRate
    );
  }

  private determineLevel(score: number): 'simple' | 'medium' | 'complex' {
    if (score < 0.3) return 'simple';
    if (score < 0.7) return 'medium';
    return 'complex';
  }

  private recommendMode(score: number): 'react' | 'ooda' | 'oops' {
    if (score < 0.3) return 'react';
    if (score < 0.7) return 'ooda';
    return 'oops';
  }

  private extractKey(prompt: string): string {
    // Extract first 50 chars as key for historical tracking
    return prompt.slice(0, 50).toLowerCase();
  }
}

export function createComplexityAssessor(): ComplexityAssessor {
  return new ComplexityAssessor();
}
