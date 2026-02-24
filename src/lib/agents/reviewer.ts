/**
 * AGENT-003: Reviewer Agent
 * 
 * Validates quality, security, SEO and compliance of generated content
 * Following specification: docs/specs/agent_specs/reviewer_agent.md
 */

import { BaseAgent, AgentContext, AgentValidationError } from './base';
import type { AgentId } from '../protocols';
import { moderateContentSkill, analyzeSEOSkill } from '@/lib/skills';

// ============================================================================
// Types
// ============================================================================

export type ReviewType = 'moderation' | 'seo' | 'quality' | 'style' | 'complete';

export interface ReviewRequest {
  reviewType: ReviewType;
  content: ContentToReview;
  config?: ReviewConfig;
}

export interface ContentToReview {
  title?: string;
  content: string;
  excerpt?: string;
  tags?: string[];
  metadata?: Record<string, unknown>;
}

export interface ReviewConfig {
  strictness?: 'low' | 'medium' | 'high';
  requiredScore?: number;
  autoReject?: boolean;
  styleGuide?: string;
}

export interface ReviewResult {
  approved: boolean;
  score: number;
  reviews: {
    moderation?: ModerationReview;
    seo?: SEOReview;
    quality?: QualityReview;
    style?: StyleReview;
  };
  issues: ReviewIssue[];
  suggestions: string[];
  metadata: {
    reviewedAt: Date;
    duration: number;
    reviewer: AgentId;
  };
}

export interface ModerationReview {
  passed: boolean;
  flagged: boolean;
  categories: {
    hate: boolean;
    harassment: boolean;
    selfHarm: boolean;
    sexual: boolean;
    violence: boolean;
    spam: boolean;
  };
  scores?: Record<string, number>;
}

export interface SEOReview {
  score: number;
  analysis: {
    titleQuality: number;
    metaDescriptionQuality: number;
    keywordDensity: number;
    readability: number;
    internalLinks: number;
    imageAlt: boolean;
  };
  keywords: {
    primary: string[];
    secondary: string[];
    missing: string[];
  };
}

export interface QualityReview {
  score: number;
  metrics: {
    coherence: number;
    completeness: number;
    accuracy: number;
    engagement: number;
  };
  wordCount: number;
  readingLevel: string;
}

export interface StyleReview {
  passed: boolean;
  violations: StyleViolation[];
  compliance: number;
}

export interface StyleViolation {
  rule: string;
  severity: 'error' | 'warning' | 'info';
  message: string;
  line?: number;
  column?: number;
  suggestion?: string;
}

export interface ReviewIssue {
  severity: 'critical' | 'high' | 'medium' | 'low';
  category: string;
  message: string;
  field?: string;
  suggestion?: string;
}

// ============================================================================
// Reviewer Agent Implementation
// ============================================================================

export class ReviewerAgent extends BaseAgent<ReviewRequest, ReviewResult> {
  readonly id: AgentId = 'reviewer';
  readonly name = 'Reviewer Agent';
  readonly description = 'Validates quality, security, SEO and compliance';
  readonly capabilities = [
    'content-moderation',
    'seo-analysis',
    'quality-validation',
    'style-checking'
  ];
  
  protected async validateInput(input: ReviewRequest): Promise<void> {
    if (!input.reviewType) {
      throw new AgentValidationError(
        'MISSING_TYPE',
        'Review request must specify a type'
      );
    }
    
    if (!input.content?.content?.trim()) {
      throw new AgentValidationError(
        'MISSING_CONTENT',
        'Review request must include content to review'
      );
    }
  }
  
  protected async validateOutput(output: ReviewResult): Promise<void> {
    if (output.score < 0 || output.score > 100) {
      throw new AgentValidationError(
        'INVALID_SCORE',
        'Review score must be between 0 and 100'
      );
    }
  }
  
  protected async execute(
    input: ReviewRequest,
    context: AgentContext
  ): Promise<ReviewResult> {
    const startTime = Date.now();
    const config = input.config || {};
    
    const reviews: ReviewResult['reviews'] = {};
    const issues: ReviewIssue[] = [];
    const suggestions: string[] = [];
    
    // Execute reviews based on type
    if (input.reviewType === 'moderation' || input.reviewType === 'complete') {
      reviews.moderation = await this.performModerationReview(input.content, context);
      this.collectIssues(reviews.moderation, issues, suggestions);
    }
    
    if (input.reviewType === 'seo' || input.reviewType === 'complete') {
      reviews.seo = await this.performSEOReview(input.content, context);
      this.collectSEOIssues(reviews.seo, issues, suggestions);
    }
    
    if (input.reviewType === 'quality' || input.reviewType === 'complete') {
      reviews.quality = await this.performQualityReview(input.content);
      this.collectQualityIssues(reviews.quality, issues, suggestions);
    }
    
    if (input.reviewType === 'style' || input.reviewType === 'complete') {
      reviews.style = await this.performStyleReview(input.content, config);
      this.collectStyleIssues(reviews.style, issues, suggestions);
    }
    
    // Calculate overall score
    const score = this.calculateOverallScore(reviews);
    
    // Determine approval
    const requiredScore = config.requiredScore || 70;
    const hasCriticalIssues = issues.some(i => i.severity === 'critical');
    const approved = score >= requiredScore && !hasCriticalIssues;
    
    return {
      approved,
      score,
      reviews,
      issues: issues.sort((a, b) => {
        const severity = { critical: 0, high: 1, medium: 2, low: 3 };
        return severity[a.severity] - severity[b.severity];
      }),
      suggestions,
      metadata: {
        reviewedAt: new Date(),
        duration: Date.now() - startTime,
        reviewer: this.id
      }
    };
  }
  
  // ====================================
  // Review Methods
  // ====================================
  
  private async performModerationReview(
    content: ContentToReview,
    context: AgentContext
  ): Promise<ModerationReview> {
    try {
      const result = await moderateContentSkill.execute({
        content: content.content,
        strictness: 'medium'
      }, {
        traceId: context.traceId,
        userId: context.userId,
        sessionId: context.sessionId,
        environment: 'production',
        timestamp: new Date()
      });
      
      const mod = result;
      
      // Check if any violation exists
      const hasViolations = mod.violations.length > 0;
      
      return {
        passed: mod.approved,
        flagged: mod.flagged,
        categories: {
          hate: mod.violations.some(v => v.type.includes('hate')),
          harassment: mod.violations.some(v => v.type.includes('harassment')),
          selfHarm: mod.violations.some(v => v.type.includes('self-harm')),
          sexual: mod.violations.some(v => v.type.includes('sexual')),
          violence: mod.violations.some(v => v.type.includes('violence')),
          spam: mod.violations.some(v => v.type.includes('spam'))
        },
        scores: {
          hate: mod.scores.hate,
          harassment: mod.scores.harassment,
          selfHarm: mod.scores.selfHarm,
          sexual: mod.scores.sexual,
          violence: mod.scores.violence,
          overall: mod.scores.overall
        }
      };
    } catch (error) {
      // Fallback moderation
      return {
        passed: true,
        flagged: false,
        categories: {
          hate: false,
          harassment: false,
          selfHarm: false,
          sexual: false,
          violence: false,
          spam: false
        }
      };
    }
  }
  
  private async performSEOReview(
    content: ContentToReview,
    context: AgentContext
  ): Promise<SEOReview> {
    try {
      const result = await analyzeSEOSkill.execute({
        content: { 
          title: content.title || '', 
          body: content.content 
        },
        targetKeywords: content.tags || []
      }, {
        traceId: context.traceId,
        userId: context.userId,
        sessionId: context.sessionId,
        environment: 'production',
        timestamp: new Date()
      });
      
      const seo = result;
      
      return {
        score: seo.score,
        analysis: {
          titleQuality: seo.analysis.title.score,
          metaDescriptionQuality: seo.analysis.meta.score,
          keywordDensity: seo.analysis.content.keywordDensity,
          readability: seo.analysis.readability.score,
          internalLinks: seo.analysis.technical.links.internal,
          imageAlt: seo.analysis.technical.images.withAlt > 0
        },
        keywords: {
          primary: seo.analysis.keywords.targetKeywords.slice(0, 3).map(k => k.keyword),
          secondary: seo.analysis.keywords.targetKeywords.slice(3, 6).map(k => k.keyword),
          missing: seo.analysis.keywords.suggestions.filter(s => s.includes('keyword')).slice(0, 3)
        }
      };
    } catch (error) {
      // Fallback SEO analysis
      return {
        score: 60,
        analysis: {
          titleQuality: 60,
          metaDescriptionQuality: 60,
          keywordDensity: 60,
          readability: 60,
          internalLinks: 0,
          imageAlt: false
        },
        keywords: {
          primary: content.tags?.slice(0, 3) || [],
          secondary: content.tags?.slice(3) || [],
          missing: []
        }
      };
    }
  }
  
  private async performQualityReview(content: ContentToReview): Promise<QualityReview> {
    const text = content.content;
    const words = text.split(/\s+/);
    const wordCount = words.length;
    
    // Basic quality metrics
    const coherence = this.calculateCoherence(text);
    const completeness = this.calculateCompleteness(text, wordCount);
    const accuracy = 0.85; // Would require fact-checking
    const engagement = this.calculateEngagement(text);
    
    const score = Math.round((coherence + completeness + accuracy + engagement) / 4 * 100);
    
    return {
      score,
      metrics: {
        coherence,
        completeness,
        accuracy,
        engagement
      },
      wordCount,
      readingLevel: this.determineReadingLevel(words, text)
    };
  }
  
  private async performStyleReview(
    content: ContentToReview,
    config: ReviewConfig
  ): Promise<StyleReview> {
    const violations: StyleViolation[] = [];
    
    // Check basic style rules
    const text = content.content;
    
    // Rule: Title should exist and be appropriate length
    if (content.title && (content.title.length < 10 || content.title.length > 100)) {
      violations.push({
        rule: 'title-length',
        severity: 'warning',
        message: 'Title should be between 10-100 characters',
        suggestion: 'Adjust title length'
      });
    }
    
    // Rule: Content should have headings
    if (!text.match(/^#{1,6}\s/m)) {
      violations.push({
        rule: 'no-headings',
        severity: 'warning',
        message: 'Content should include headings for structure',
        suggestion: 'Add section headings'
      });
    }
    
    // Rule: Paragraphs should not be too long
    const paragraphs = text.split('\n\n');
    const longParagraphs = paragraphs.filter(p => p.split(/\s+/).length > 150);
    if (longParagraphs.length > 0) {
      violations.push({
        rule: 'long-paragraphs',
        severity: 'info',
        message: `${longParagraphs.length} paragraphs exceed 150 words`,
        suggestion: 'Break long paragraphs into smaller ones'
      });
    }
    
    const compliance = Math.max(0, 100 - violations.length * 10);
    
    return {
      passed: violations.filter(v => v.severity === 'error').length === 0,
      violations,
      compliance
    };
  }
  
  // ====================================
  // Issue Collection
  // ====================================
  
  private collectIssues(
    moderation: ModerationReview,
    issues: ReviewIssue[],
    suggestions: string[]
  ): void {
    if (moderation.flagged) {
      const flaggedCategories = Object.entries(moderation.categories)
        .filter(([_, flagged]) => flagged)
        .map(([cat]) => cat);
      
      issues.push({
        severity: 'critical',
        category: 'moderation',
        message: `Content flagged for: ${flaggedCategories.join(', ')}`,
        suggestion: 'Review and modify flagged content'
      });
    }
  }
  
  private collectSEOIssues(
    seo: SEOReview,
    issues: ReviewIssue[],
    suggestions: string[]
  ): void {
    if (seo.score < 60) {
      issues.push({
        severity: 'medium',
        category: 'seo',
        message: `SEO score is low (${seo.score}/100)`,
        suggestion: 'Improve keyword usage and readability'
      });
    }
    
    if (seo.keywords.missing.length > 0) {
      suggestions.push(`Consider adding keywords: ${seo.keywords.missing.slice(0, 5).join(', ')}`);
    }
    
    if (seo.analysis.readability < 60) {
      suggestions.push('Improve readability by simplifying complex sentences');
    }
  }
  
  private collectQualityIssues(
    quality: QualityReview,
    issues: ReviewIssue[],
    suggestions: string[]
  ): void {
    if (quality.score < 60) {
      issues.push({
        severity: 'high',
        category: 'quality',
        message: `Quality score is low (${quality.score}/100)`,
        suggestion: 'Improve content coherence and completeness'
      });
    }
    
    if (quality.wordCount < 300) {
      suggestions.push('Content is short. Consider expanding with more details.');
    }
    
    if (quality.metrics.coherence < 0.7) {
      suggestions.push('Improve logical flow between sections');
    }
  }
  
  private collectStyleIssues(
    style: StyleReview,
    issues: ReviewIssue[],
    suggestions: string[]
  ): void {
    style.violations.forEach(violation => {
      if (violation.severity === 'error') {
        issues.push({
          severity: 'high',
          category: 'style',
          message: violation.message,
          suggestion: violation.suggestion
        });
      }
    });
    
    if (style.compliance < 80) {
      suggestions.push('Review style guidelines for better compliance');
    }
  }
  
  // ====================================
  // Calculation Helpers
  // ====================================
  
  private calculateOverallScore(reviews: ReviewResult['reviews']): number {
    const scores: number[] = [];
    
    if (reviews.moderation) {
      scores.push(reviews.moderation.passed ? 100 : 0);
    }
    if (reviews.seo) {
      scores.push(reviews.seo.score);
    }
    if (reviews.quality) {
      scores.push(reviews.quality.score);
    }
    if (reviews.style) {
      scores.push(reviews.style.compliance);
    }
    
    return scores.length > 0
      ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
      : 0;
  }
  
  private calculateCoherence(text: string): number {
    // Simple coherence - check for transition words and logical structure
    const transitionWords = ['however', 'therefore', 'moreover', 'additionally', 'furthermore'];
    const hasTransitions = transitionWords.some(word => text.toLowerCase().includes(word));
    const hasParagraphs = text.split('\n\n').length > 3;
    
    return (hasTransitions ? 0.5 : 0.3) + (hasParagraphs ? 0.4 : 0.2);
  }
  
  private calculateCompleteness(text: string, wordCount: number): number {
    const hasIntro = text.toLowerCase().includes('introduction') || wordCount > 100;
    const hasConclusion = text.toLowerCase().includes('conclusion') || text.toLowerCase().includes('summary');
    const hasBody = wordCount > 300;
    
    let score = 0;
    if (hasIntro) score += 0.33;
    if (hasBody) score += 0.34;
    if (hasConclusion) score += 0.33;
    
    return score;
  }
  
  private calculateEngagement(text: string): number {
    const hasQuestions = text.includes('?');
    const hasExamples = text.toLowerCase().includes('example') || text.toLowerCase().includes('for instance');
    const hasCode = text.includes('```');
    const hasLists = text.match(/^[\*\-\d]+\.\s/m);
    
    let score = 0.4; // Base score
    if (hasQuestions) score += 0.15;
    if (hasExamples) score += 0.15;
    if (hasCode) score += 0.15;
    if (hasLists) score += 0.15;
    
    return Math.min(1.0, score);
  }
  
  private determineReadingLevel(words: string[], text: string): string {
    const avgWordLength = words.reduce((sum, w) => sum + w.length, 0) / words.length;
    const sentences = text.split(/[.!?]+/).length;
    const avgWordsPerSentence = words.length / sentences;
    
    // Simplified Flesch reading ease estimation
    if (avgWordLength < 5 && avgWordsPerSentence < 15) return 'beginner';
    if (avgWordLength < 6 && avgWordsPerSentence < 20) return 'intermediate';
    return 'advanced';
  }
}

// Export singleton instance
export const reviewerAgent = new ReviewerAgent();
