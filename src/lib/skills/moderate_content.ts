/**
 * SKILL-003: Moderate Content
 * 
 * Validate content for safety, compliance, and policy adherence
 * Following specification: docs/specs/skill_specs/moderate_content_skill.md
 */

import { BaseSkill, ValidationError, countWords } from './base';
import { openai } from '../openai/client';

// ============================================================================
// Types
// ============================================================================

export interface ModerateContentInput {
  content: string | ContentToModerate;
  strictness?: 'low' | 'medium' | 'high';
  checkTypes?: ModerationCheckType[];
  context?: {
    userId?: string;
    postId?: string;
    previousViolations?: number;
  };
}

export interface ContentToModerate {
  title?: string;
  body?: string;
  tags?: string[];
  excerpt?: string;
}

export type ModerationCheckType =
  | 'hate'
  | 'hate/threatening'
  | 'harassment'
  | 'harassment/threatening'
  | 'self-harm'
  | 'self-harm/intent'
  | 'self-harm/instructions'
  | 'sexual'
  | 'sexual/minors'
  | 'violence'
  | 'violence/graphic'
  | 'spam'
  | 'malicious-links';

export interface ModerateContentOutput {
  approved: boolean;
  flagged: boolean;
  violations: Violation[];
  scores: ModerationScores;
  recommendations: string[];
  metadata: ModerationMetadata;
}

export interface Violation {
  type: ModerationCheckType;
  severity: 'low' | 'medium' | 'high' | 'critical';
  confidence: number;
  excerpt?: string;
  reason: string;
  suggestedAction: 'warn' | 'edit' | 'block' | 'review';
}

export interface ModerationScores {
  hate: number;
  harassment: number;
  selfHarm: number;
  sexual: number;
  violence: number;
  spam: number;
  overall: number;
}

export interface ModerationMetadata {
  checkedAt: Date;
  checkDuration: number;
  apiUsed: string;
  strictnessLevel: string;
  autoDecision: boolean;
}

// ============================================================================
// Skill Implementation
// ============================================================================

export class ModerateContentSkill extends BaseSkill<ModerateContentInput, ModerateContentOutput> {
  readonly id = 'moderate_content';
  readonly name = 'Moderate Content';
  readonly description = 'Validate content for safety and policy compliance';
  
  // ====================================
  // Preconditions
  // ====================================
  
  protected async checkPreconditions(input: ModerateContentInput): Promise<ValidationError[]> {
    const errors: ValidationError[] = [];
    
    // PRE-MOD-001: Contenido No Vacío
    if (typeof input.content === 'string') {
      if (input.content.trim().length === 0) {
        errors.push({
          code: 'PRE-MOD-001',
          message: 'Content to moderate must not be empty',
          field: 'content'
        });
      }
    } else {
      const contentObj = input.content;
      const hasContent = (
        (contentObj.title?.trim().length ?? 0) > 0 ||
        (contentObj.body?.trim().length ?? 0) > 0
      );
      
      if (!hasContent) {
        errors.push({
          code: 'PRE-MOD-001',
          message: 'Content to moderate must not be empty',
          field: 'content'
        });
      }
    }
    
    return errors;
  }
  
  // ====================================
  // Postconditions
  // ====================================
  
  protected async checkPostconditions(output: ModerateContentOutput, input: ModerateContentInput): Promise<ValidationError[]> {
    const errors: ValidationError[] = [];
    
    // POST-MOD-001: Decisión Clara
    if (typeof output.approved !== 'boolean') {
      errors.push({
        code: 'POST-MOD-001',
        message: 'Moderation must produce clear approval decision'
      });
    }
    
    // POST-MOD-002: Violations Documentadas
    if (output.flagged && output.violations.length === 0) {
      errors.push({
        code: 'POST-MOD-002',
        message: 'If flagged, must document at least one violation'
      });
    }
    
    // POST-MOD-003: Scores Válidos
    const allScoresValid = Object.values(output.scores).every(score =>
      score >= 0 && score <= 100
    );
    
    if (!allScoresValid) {
      errors.push({
        code: 'POST-MOD-003',
        message: 'All moderation scores must be between 0 and 100'
      });
    }
    
    return errors;
  }
  
  // ====================================
  // Invariants
  // ====================================
  
  protected async checkInvariants(output: ModerateContentOutput, input: ModerateContentInput): Promise<ValidationError[]> {
    const errors: ValidationError[] = [];
    
    // INV-MOD-001: Aprobación Consistente
    if (output.flagged && output.approved) {
      errors.push({
        code: 'INV-MOD-001',
        message: 'Flagged content cannot be approved'
      });
    }
    
    // INV-MOD-002: Alta Confianza en Bloqueos
    const criticalViolations = output.violations.filter(v => v.severity === 'critical');
    const lowConfidenceCritical = criticalViolations.filter(v => v.confidence < 0.8);
    
    if (lowConfidenceCritical.length > 0) {
      errors.push({
        code: 'INV-MOD-002',
        message: 'Critical violations must have confidence >= 0.8'
      });
    }
    
    return errors;
  }
  
  // ====================================
  // Implementation
  // ====================================
  
  protected async executeImpl(input: ModerateContentInput, context: any): Promise<ModerateContentOutput> {
    const startTime = Date.now();
    
    const contentText = this.normalizeContent(input.content);
    
    // Call OpenAI Moderation API
    const moderationResponse = await openai.moderations.create({
      input: contentText,
      model: 'text-moderation-stable'
    });
    
    const result = moderationResponse.results[0];
    
    // Convert scores to 0-100 scale
    const scores: ModerationScores = {
      hate: result.category_scores.hate * 100,
      harassment: result.category_scores.harassment * 100,
      selfHarm: result.category_scores['self-harm'] * 100,
      sexual: result.category_scores.sexual * 100,
      violence: result.category_scores.violence * 100,
      spam: await this.checkSpam(contentText),
      overall: 0
    };
    
    scores.overall = this.calculateOverallRisk(scores);
    
    const violations = this.identifyViolations(result, scores, input.strictness || 'medium');
    
    // Check for spam and malicious links if requested
    if (!input.checkTypes || input.checkTypes.includes('spam')) {
      const spamViolation = await this.checkForSpamViolation(contentText);
      if (spamViolation) violations.push(spamViolation);
    }
    
    if (!input.checkTypes || input.checkTypes.includes('malicious-links')) {
      const linkViolation = await this.checkMaliciousLinks(contentText);
      if (linkViolation) violations.push(linkViolation);
    }
    
    // Adjust for user history
    if (input.context?.previousViolations && input.context.previousViolations > 0) {
      this.adjustForHistory(violations, input.context.previousViolations);
    }
    
    const flagged = violations.length > 0;
    const approved = !flagged || violations.every(v =>
      v.severity === 'low' && v.suggestedAction === 'warn'
    );
    
    const recommendations = this.generateRecommendations(violations, scores);
    
    const checkDuration = Date.now() - startTime;
    
    return {
      approved,
      flagged,
      violations,
      scores,
      recommendations,
      metadata: {
        checkedAt: new Date(),
        checkDuration,
        apiUsed: 'openai-moderation-stable',
        strictnessLevel: input.strictness || 'medium',
        autoDecision: violations.every(v => v.confidence >= 0.9)
      }
    };
  }
  
  // ====================================
  // Helper Methods
  // ====================================
  
  private normalizeContent(content: string | ContentToModerate): string {
    if (typeof content === 'string') {
      return content;
    }
    
    const parts: string[] = [];
    
    if (content.title) parts.push(`Title: ${content.title}`);
    if (content.excerpt) parts.push(`Excerpt: ${content.excerpt}`);
    if (content.body) parts.push(`Body: ${content.body}`);
    if (content.tags && content.tags.length > 0) {
      parts.push(`Tags: ${content.tags.join(', ')}`);
    }
    
    return parts.join('\n\n');
  }
  
  private calculateOverallRisk(scores: ModerationScores): number {
    const weights = {
      hate: 0.25,
      harassment: 0.20,
      selfHarm: 0.20,
      sexual: 0.15,
      violence: 0.15,
      spam: 0.05
    };
    
    return (
      scores.hate * weights.hate +
      scores.harassment * weights.harassment +
      scores.selfHarm * weights.selfHarm +
      scores.sexual * weights.sexual +
      scores.violence * weights.violence +
      scores.spam * weights.spam
    );
  }
  
  private identifyViolations(result: any, scores: ModerationScores, strictness: string): Violation[] {
    const violations: Violation[] = [];
    const thresholds = this.getThresholds(strictness);
    
    const checks: Array<[ModerationCheckType, number, string]> = [
      ['hate', scores.hate, 'Hate speech detected'],
      ['harassment', scores.harassment, 'Harassment detected'],
      ['self-harm', scores.selfHarm, 'Self-harm content detected'],
      ['sexual', scores.sexual, 'Sexual content detected'],
      ['violence', scores.violence, 'Violent content detected']
    ];
    
    for (const [type, score, reason] of checks) {
      if (score > thresholds[type as keyof typeof thresholds]) {
        violations.push({
          type,
          severity: this.determineSeverity(score, thresholds[type as keyof typeof thresholds]),
          confidence: score / 100,
          reason,
          suggestedAction: this.determineSuggestedAction(score, thresholds[type as keyof typeof thresholds])
        });
      }
    }
    
    return violations;
  }
  
  private getThresholds(strictness: string): Record<string, number> {
    const thresholdSets = {
      low: {
        hate: 50,
        harassment: 50,
        'self-harm': 30,
        sexual: 60,
        violence: 50,
        spam: 70
      },
      medium: {
        hate: 30,
        harassment: 30,
        'self-harm': 20,
        sexual: 40,
        violence: 30,
        spam: 50
      },
      high: {
        hate: 15,
        harassment: 15,
        'self-harm': 10,
        sexual: 25,
        violence: 15,
        spam: 30
      }
    };
    
    return thresholdSets[strictness as keyof typeof thresholdSets] || thresholdSets.medium;
  }
  
  private determineSeverity(score: number, threshold: number): 'low' | 'medium' | 'high' | 'critical' {
    const ratio = score / threshold;
    
    if (ratio >= 3) return 'critical';
    if (ratio >= 2) return 'high';
    if (ratio >= 1.5) return 'medium';
    return 'low';
  }
  
  private determineSuggestedAction(score: number, threshold: number): 'warn' | 'edit' | 'block' | 'review' {
    const ratio = score / threshold;
    
    if (ratio >= 3) return 'block';
    if (ratio >= 2) return 'edit';
    if (ratio >= 1.5) return 'review';
    return 'warn';
  }
  
  private async checkSpam(content: string): Promise<number> {
    let spamScore = 0;
    
    // Excessive links
    const linkCount = (content.match(/https?:\/\//g) || []).length;
    if (linkCount > 5) spamScore += 20;
    if (linkCount > 10) spamScore += 30;
    
    // Repeated phrases
    const words = content.toLowerCase().split(/\s+/);
    const wordFreq = new Map<string, number>();
    words.forEach(word => {
      wordFreq.set(word, (wordFreq.get(word) || 0) + 1);
    });
    
    const frequencies = Array.from(wordFreq.values());
    const maxFreq = frequencies.length > 0 ? Math.max(...frequencies) : 0;
    if (maxFreq > words.length * 0.1) {
      spamScore += 15;
    }
    
    // Spam keywords
    const spamKeywords = [
      'click here', 'buy now', 'limited time', 'act now',
      'free money', 'guaranteed', 'no risk', 'winner'
    ];
    
    const contentLower = content.toLowerCase();
    const spamKeywordCount = spamKeywords.filter(kw =>
      contentLower.includes(kw)
    ).length;
    
    spamScore += spamKeywordCount * 10;
    
    // Excessive capitalization
    const capsRatio = (content.match(/[A-Z]/g) || []).length / content.length;
    if (capsRatio > 0.3) spamScore += 20;
    
    return Math.min(spamScore, 100);
  }
  
  private async checkForSpamViolation(content: string): Promise<Violation | null> {
    const spamScore = await this.checkSpam(content);
    
    if (spamScore > 50) {
      return {
        type: 'spam',
        severity: spamScore > 70 ? 'high' : 'medium',
        confidence: spamScore / 100,
        reason: 'Spam indicators detected',
        suggestedAction: spamScore > 70 ? 'block' : 'review'
      };
    }
    
    return null;
  }
  
  private async checkMaliciousLinks(content: string): Promise<Violation | null> {
    const links = content.match(/https?:\/\/[^\s]+/g) || [];
    
    const suspiciousDomains = ['bit.ly', 'tinyurl.com', 't.co'];
    
    for (const link of links) {
      try {
        const url = new URL(link);
        if (suspiciousDomains.some(domain => url.hostname.includes(domain))) {
          return {
            type: 'malicious-links',
            severity: 'medium',
            confidence: 0.6,
            excerpt: link,
            reason: 'Suspicious shortened URL detected',
            suggestedAction: 'review'
          };
        }
      } catch {
        return {
          type: 'malicious-links',
          severity: 'low',
          confidence: 0.8,
          excerpt: link,
          reason: 'Malformed URL detected',
          suggestedAction: 'edit'
        };
      }
    }
    
    return null;
  }
  
  private adjustForHistory(violations: Violation[], previousViolations: number): void {
    // Increase severity for repeat offenders
    if (previousViolations >= 3) {
      violations.forEach(v => {
        if (v.severity === 'low') v.severity = 'medium';
        else if (v.severity === 'medium') v.severity = 'high';
      });
    }
  }
  
  private generateRecommendations(violations: Violation[], scores: ModerationScores): string[] {
    const recommendations: string[] = [];
    
    if (violations.length === 0) {
      recommendations.push('Content appears safe for publication');
      
      if (scores.overall < 5) {
        recommendations.push('Excellent content quality from moderation perspective');
      }
    } else {
      const criticalViolations = violations.filter(v => v.severity === 'critical');
      const highViolations = violations.filter(v => v.severity === 'high');
      
      if (criticalViolations.length > 0) {
        recommendations.push('CRITICAL: This content violates platform policies and cannot be published');
        criticalViolations.forEach(v => {
          recommendations.push(`- ${v.reason}`);
        });
      }
      
      if (highViolations.length > 0) {
        recommendations.push('Content requires significant revision before publication');
        highViolations.forEach(v => {
          recommendations.push(`- ${v.reason}`);
        });
      }
      
      const editActions = violations.filter(v => v.suggestedAction === 'edit');
      if (editActions.length > 0) {
        recommendations.push('Consider editing the following sections:');
        editActions.forEach(v => {
          if (v.excerpt) {
            recommendations.push(`- "${v.excerpt.substring(0, 50)}..."`);
          }
        });
      }
    }
    
    return recommendations;
  }
}

// Export singleton instance
export const moderateContentSkill = new ModerateContentSkill();
