/**
 * Skill Quality Assessment System
 * 
 * Automated quality evaluation for skills
 * 
 * @module @jclaw/core/skill-sh/quality
 */

import type { SkillShResult, SkillQualityAssessment } from './types.js';

/**
 * Quality Assessor
 */
export class QualityAssessor {
  /**
   * Assess skill quality comprehensively
   */
  async assess(skill: SkillShResult, skillMd?: string): Promise<SkillQualityAssessment> {
    const details = await this.gatherDetails(skill, skillMd);
    
    return {
      score: this.calculateOverallScore(skill, details),
      codeQuality: this.assessCodeQuality(skill),
      documentation: this.assessDocumentation(skill, details),
      testCoverage: this.assessTestCoverage(details),
      community: this.assessCommunity(skill),
      security: this.assessSecurity(details),
      details,
    };
  }

  /**
   * Gather skill details
   */
  private async gatherDetails(skill: SkillShResult, skillMd?: string) {
    return {
      linesOfCode: skillMd ? skillMd.split('\n').length : 0,
      hasTests: skillMd ? skillMd.includes('test') || skillMd.includes('Test') : false,
      hasExamples: skillMd ? skillMd.includes('## Example') || skillMd.includes('## Usage') : false,
      hasDocumentation: skillMd ? skillMd.length > 500 : false,
      recentlyUpdated: this.isRecentlyUpdated(skill.updatedAt),
      openIssues: 0, // Would need GitHub API
    };
  }

  /**
   * Calculate overall score
   */
  private calculateOverallScore(skill: SkillShResult, details: SkillQualityAssessment['details']): number {
    let score = 50;

    // Community metrics (40%)
    if (skill.stars > 100) score += 15;
    else if (skill.stars > 50) score += 10;
    else if (skill.stars > 10) score += 5;

    if (skill.downloads > 1000) score += 15;
    else if (skill.downloads > 500) score += 10;
    else if (skill.downloads > 100) score += 5;

    // Documentation (20%)
    if (details.hasDocumentation) score += 10;
    if (details.hasExamples) score += 10;

    // Maintenance (20%)
    if (details.recentlyUpdated) score += 10;
    if (details.openIssues < 5) score += 10;

    // Testing (20%)
    if (details.hasTests) score += 20;

    return Math.min(100, score);
  }

  /**
   * Assess code quality
   */
  private assessCodeQuality(skill: SkillShResult): number {
    // This would analyze actual code if available
    return skill.quality || 50;
  }

  /**
   * Assess documentation quality
   */
  private assessDocumentation(skill: SkillShResult, details: SkillQualityAssessment['details']): number {
    let score = 50;

    if (details.hasDocumentation) score += 20;
    if (details.hasExamples) score += 20;
    if (skill.description.length > 100) score += 10;

    return Math.min(100, score);
  }

  /**
   * Assess test coverage
   */
  private assessTestCoverage(details: SkillQualityAssessment['details']): number {
    return details.hasTests ? 70 : 30;
  }

  /**
   * Assess community health
   */
  private assessCommunity(skill: SkillShResult): number {
    let score = 50;

    if (skill.stars > 100) score += 25;
    else if (skill.stars > 50) score += 15;
    else if (skill.stars > 10) score += 5;

    if (skill.downloads > 1000) score += 25;
    else if (skill.downloads > 500) score += 15;
    else if (skill.downloads > 100) score += 5;

    return Math.min(100, score);
  }

  /**
   * Assess security
   */
  private assessSecurity(details: SkillQualityAssessment['details']): number {
    // Basic security assessment
    let score = 70;

    // Recently updated is good for security
    if (details.recentlyUpdated) score += 10;

    // Well tested is more secure
    if (details.hasTests) score += 10;

    // Documentation helps security
    if (details.hasDocumentation) score += 10;

    return Math.min(100, score);
  }

  /**
   * Check if recently updated
   */
  private isRecentlyUpdated(updatedAt: string): boolean {
    const days = Math.floor(
      (Date.now() - new Date(updatedAt).getTime()) / (1000 * 60 * 60 * 24)
    );
    return days < 30;
  }
}

export function createQualityAssessor(): QualityAssessor {
  return new QualityAssessor();
}
