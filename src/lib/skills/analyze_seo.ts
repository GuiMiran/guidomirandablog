/**
 * SKILL-004: Analyze SEO
 * 
 * Analyze content for search engine optimization
 * Following specification: docs/specs/skill_specs/analyze_seo_skill.md
 */

import { BaseSkill, ValidationError, countWords, extractHeadingStructure } from './base';

// ============================================================================
// Types
// ============================================================================

export interface AnalyzeSEOInput {
  content: SEOContent;
  targetKeywords?: string[];
  competitorUrls?: string[];
  options?: {
    checkReadability?: boolean;
    checkImages?: boolean;
    checkLinks?: boolean;
    checkMobile?: boolean;
  };
}

export interface SEOContent {
  title: string;
  excerpt?: string;
  body: string;
  slug?: string;
  tags?: string[];
  images?: ImageInfo[];
  links?: LinkInfo[];
}

export interface ImageInfo {
  src: string;
  alt?: string;
  title?: string;
}

export interface LinkInfo {
  href: string;
  text: string;
  internal: boolean;
}

export interface AnalyzeSEOOutput {
  score: number;
  analysis: SEOAnalysis;
  issues: SEOIssue[];
  recommendations: SEORecommendation[];
  metadata: AnalysisMetadata;
}

export interface SEOAnalysis {
  title: TitleAnalysis;
  meta: MetaAnalysis;
  content: ContentAnalysis;
  keywords: KeywordAnalysis;
  readability: ReadabilityAnalysis;
  technical: TechnicalAnalysis;
}

export interface TitleAnalysis {
  score: number;
  length: number;
  hasKeyword: boolean;
  optimal: boolean;
  suggestions: string[];
}

export interface MetaAnalysis {
  score: number;
  excerptLength: number;
  excerptOptimal: boolean;
  suggestions: string[];
}

export interface ContentAnalysis {
  score: number;
  wordCount: number;
  paragraphCount: number;
  headingStructure: HeadingStructure;
  keywordDensity: number;
  suggestions: string[];
}

export interface HeadingStructure {
  h1: number;
  h2: number;
  h3: number;
  h4?: number;
}

export interface KeywordAnalysis {
  score: number;
  targetKeywords: KeywordMetric[];
  suggestions: string[];
}

export interface KeywordMetric {
  keyword: string;
  frequency: number;
  density: number;
  positions: string[];
  optimal: boolean;
}

export interface ReadabilityAnalysis {
  score: number;
  fleschReadingEase: number;
  avgWordsPerSentence: number;
  avgSyllablesPerWord: number;
  readingLevel: string;
  suggestions: string[];
}

export interface TechnicalAnalysis {
  score: number;
  images: ImageSEOAnalysis;
  links: LinkSEOAnalysis;
  slug: SlugAnalysis;
  suggestions: string[];
}

export interface ImageSEOAnalysis {
  total: number;
  withAlt: number;
  optimized: number;
}

export interface LinkSEOAnalysis {
  total: number;
  internal: number;
  external: number;
  broken: number;
}

export interface SlugAnalysis {
  score: number;
  length: number;
  hasKeyword: boolean;
  valid: boolean;
}

export interface SEOIssue {
  category: 'title' | 'meta' | 'content' | 'keywords' | 'readability' | 'technical';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  impact: number;
}

export interface SEORecommendation {
  priority: 'high' | 'medium' | 'low';
  category: string;
  title: string;
  description: string;
  expectedImpact: number;
}

export interface AnalysisMetadata {
  analyzedAt: Date;
  duration: number;
  contentLength: number;
  checksPerformed: string[];
}

// ============================================================================
// Skill Implementation
// ============================================================================

export class AnalyzeSEOSkill extends BaseSkill<AnalyzeSEOInput, AnalyzeSEOOutput> {
  readonly id = 'analyze_seo';
  readonly name = 'Analyze SEO';
  readonly description = 'Analyze content for search engine optimization';
  
  // ====================================
  // Preconditions
  // ====================================
  
  protected async checkPreconditions(input: AnalyzeSEOInput): Promise<ValidationError[]> {
    const errors: ValidationError[] = [];
    
    // PRE-SEO-001: Contenido Completo
    if (!input.content.title || input.content.title.trim().length === 0) {
      errors.push({
        code: 'PRE-SEO-001',
        message: 'Content must have a title',
        field: 'content.title'
      });
    }
    
    if (!input.content.body || input.content.body.trim().length < 100) {
      errors.push({
        code: 'PRE-SEO-001',
        message: 'Content body must have at least 100 characters',
        field: 'content.body'
      });
    }
    
    return errors;
  }
  
  // ====================================
  // Postconditions
  // ====================================
  
  protected async checkPostconditions(output: AnalyzeSEOOutput, input: AnalyzeSEOInput): Promise<ValidationError[]> {
    const errors: ValidationError[] = [];
    
    // POST-SEO-001: Score en Rango Válido
    if (output.score < 0 || output.score > 100) {
      errors.push({
        code: 'POST-SEO-001',
        message: 'SEO score must be between 0 and 100'
      });
    }
    
    // POST-SEO-002: Análisis Completo
    const requiredAnalyses = ['title', 'meta', 'content', 'keywords', 'readability', 'technical'];
    const hasAllAnalyses = requiredAnalyses.every(key =>
      output.analysis[key as keyof SEOAnalysis] !== undefined
    );
    
    if (!hasAllAnalyses) {
      errors.push({
        code: 'POST-SEO-002',
        message: 'Analysis must include all required sections'
      });
    }
    
    return errors;
  }
  
  // ====================================
  // Invariants
  // ====================================
  
  protected async checkInvariants(output: AnalyzeSEOOutput, input: AnalyzeSEOInput): Promise<ValidationError[]> {
    const errors: ValidationError[] = [];
    
    // INV-SEO-001: Score Agregado Consistente
    const avgScore = (
      output.analysis.title.score +
      output.analysis.meta.score +
      output.analysis.content.score +
      output.analysis.keywords.score +
      output.analysis.readability.score +
      output.analysis.technical.score
    ) / 6;
    
    const scoreDelta = Math.abs(output.score - avgScore);
    if (scoreDelta > 5) {
      errors.push({
        code: 'INV-SEO-001',
        message: `Overall score must match average of individual scores (delta: ${scoreDelta.toFixed(1)})`
      });
    }
    
    return errors;
  }
  
  // ====================================
  // Implementation
  // ====================================
  
  protected async executeImpl(input: AnalyzeSEOInput, context: any): Promise<AnalyzeSEOOutput> {
    const startTime = Date.now();
    const checksPerformed: string[] = [];
    
    const options = {
      checkReadability: input.options?.checkReadability ?? true,
      checkImages: input.options?.checkImages ?? true,
      checkLinks: input.options?.checkLinks ?? true,
      checkMobile: input.options?.checkMobile ?? false
    };
    
    // Title Analysis
    const titleAnalysis = this.analyzeTitle(input.content.title, input.targetKeywords);
    checksPerformed.push('title');
    
    // Meta Analysis
    const metaAnalysis = this.analyzeMeta(input.content.excerpt, input.targetKeywords);
    checksPerformed.push('meta');
    
    // Content Analysis
    const contentAnalysis = this.analyzeContent(input.content.body, input.targetKeywords);
    checksPerformed.push('content');
    
    // Keywords Analysis
    const keywordAnalysis = this.analyzeKeywords(
      input.content.title,
      input.content.body,
      input.targetKeywords || []
    );
    checksPerformed.push('keywords');
    
    // Readability Analysis
    let readabilityAnalysis: ReadabilityAnalysis;
    if (options.checkReadability) {
      readabilityAnalysis = this.analyzeReadability(input.content.body);
      checksPerformed.push('readability');
    } else {
      readabilityAnalysis = {
        score: 50,
        fleschReadingEase: 0,
        avgWordsPerSentence: 0,
        avgSyllablesPerWord: 0,
        readingLevel: 'not checked',
        suggestions: []
      };
    }
    
    // Technical Analysis
    const technicalAnalysis = this.analyzeTechnical(
      input.content,
      options.checkImages,
      options.checkLinks
    );
    checksPerformed.push('technical');
    
    const analysis: SEOAnalysis = {
      title: titleAnalysis,
      meta: metaAnalysis,
      content: contentAnalysis,
      keywords: keywordAnalysis,
      readability: readabilityAnalysis,
      technical: technicalAnalysis
    };
    
    // Calculate overall score
    const score = this.calculateOverallScore(analysis);
    
    // Identify issues
    const issues = this.identifyIssues(analysis, input.content);
    
    // Generate recommendations
    const recommendations = this.generateRecommendations(issues, analysis);
    
    const duration = Date.now() - startTime;
    
    return {
      score,
      analysis,
      issues,
      recommendations,
      metadata: {
        analyzedAt: new Date(),
        duration,
        contentLength: input.content.body.length,
        checksPerformed
      }
    };
  }
  
  // ====================================
  // Analysis Methods
  // ====================================
  
  private analyzeTitle(title: string, targetKeywords?: string[]): TitleAnalysis {
    const length = title.length;
    const optimal = length >= 50 && length <= 60;
    
    let hasKeyword = false;
    if (targetKeywords && targetKeywords.length > 0) {
      hasKeyword = targetKeywords.some(kw =>
        title.toLowerCase().includes(kw.toLowerCase())
      );
    }
    
    const suggestions: string[] = [];
    if (length < 50) {
      suggestions.push('Title is too short. Aim for 50-60 characters.');
    } else if (length > 60) {
      suggestions.push('Title is too long. May be truncated in search results.');
    }
    
    if (!hasKeyword && targetKeywords && targetKeywords.length > 0) {
      suggestions.push(`Include target keyword "${targetKeywords[0]}" in title.`);
    }
    
    let score = 50;
    if (optimal) score += 30;
    else if (length >= 40 && length <= 70) score += 15;
    
    if (hasKeyword) score += 20;
    
    return {
      score,
      length,
      hasKeyword,
      optimal,
      suggestions
    };
  }
  
  private analyzeMeta(excerpt: string | undefined, targetKeywords?: string[]): MetaAnalysis {
    const excerptLength = excerpt?.length || 0;
    const excerptOptimal = excerptLength >= 150 && excerptLength <= 160;
    
    const suggestions: string[] = [];
    
    if (!excerpt) {
      suggestions.push('Add a meta description (excerpt) for better SEO.');
      return {
        score: 0,
        excerptLength: 0,
        excerptOptimal: false,
        suggestions
      };
    }
    
    if (excerptLength < 150) {
      suggestions.push('Meta description is too short. Aim for 150-160 characters.');
    } else if (excerptLength > 160) {
      suggestions.push('Meta description is too long. May be truncated in search results.');
    }
    
    if (targetKeywords && targetKeywords.length > 0) {
      const hasKeyword = targetKeywords.some(kw =>
        excerpt.toLowerCase().includes(kw.toLowerCase())
      );
      if (!hasKeyword) {
        suggestions.push(`Include target keyword "${targetKeywords[0]}" in meta description.`);
      }
    }
    
    let score = 50;
    if (excerptOptimal) score += 35;
    else if (excerptLength >= 120 && excerptLength <= 180) score += 15;
    
    return {
      score,
      excerptLength,
      excerptOptimal,
      suggestions
    };
  }
  
  private analyzeContent(body: string, targetKeywords?: string[]): ContentAnalysis {
    const wordCount = countWords(body);
    const paragraphCount = body.split(/\n\n+/).filter(p => p.trim().length > 0).length;
    const headingStructure = extractHeadingStructure(body);
    
    let keywordDensity = 0;
    if (targetKeywords && targetKeywords.length > 0) {
      const allKeywordOccurrences = targetKeywords.reduce((sum, kw) => {
        const regex = new RegExp(kw, 'gi');
        return sum + (body.match(regex) || []).length;
      }, 0);
      keywordDensity = (allKeywordOccurrences / wordCount) * 100;
    }
    
    const suggestions: string[] = [];
    
    if (wordCount < 300) {
      suggestions.push('Content is too short. Aim for at least 800 words for better SEO.');
    } else if (wordCount < 800) {
      suggestions.push('Consider expanding content for better depth and SEO value.');
    }
    
    if (headingStructure.h1 === 0) {
      suggestions.push('Add an H1 heading to your content.');
    } else if (headingStructure.h1 > 1) {
      suggestions.push('Use only one H1 heading per page.');
    }
    
    if (headingStructure.h2 < 3 && wordCount > 500) {
      suggestions.push('Add more H2 headings to structure your content.');
    }
    
    if (keywordDensity > 0 && (keywordDensity < 0.5 || keywordDensity > 2.5)) {
      suggestions.push(`Keyword density is ${keywordDensity.toFixed(1)}%. Aim for 1-2%.`);
    }
    
    let score = 50;
    if (wordCount >= 800) score += 15;
    if (wordCount >= 1500) score += 10;
    if (headingStructure.h1 === 1) score += 10;
    if (headingStructure.h2 >= 3) score += 10;
    if (keywordDensity >= 0.5 && keywordDensity <= 2.5) score += 5;
    
    return {
      score,
      wordCount,
      paragraphCount,
      headingStructure,
      keywordDensity,
      suggestions
    };
  }
  
  private analyzeKeywords(title: string, body: string, targetKeywords: string[]): KeywordAnalysis {
    if (targetKeywords.length === 0) {
      return {
        score: 50,
        targetKeywords: [],
        suggestions: ['Specify target keywords for better keyword optimization.']
      };
    }
    
    const titleLower = title.toLowerCase();
    const bodyLower = body.toLowerCase();
    const wordCount = countWords(body);
    
    const keywordMetrics: KeywordMetric[] = targetKeywords.map(keyword => {
      const keywordLower = keyword.toLowerCase();
      const regex = new RegExp(keywordLower, 'g');
      
      const frequency = (bodyLower.match(regex) || []).length;
      const density = (frequency / wordCount) * 100;
      
      const positions: string[] = [];
      if (titleLower.includes(keywordLower)) positions.push('title');
      
      const h1Match = body.match(/^#\s+(.+)$/m);
      if (h1Match && h1Match[1].toLowerCase().includes(keywordLower)) {
        positions.push('h1');
      }
      
      const h2Matches = body.match(/^##\s+(.+)$/gm);
      if (h2Matches && h2Matches.some(h => h.toLowerCase().includes(keywordLower))) {
        positions.push('h2');
      }
      
      if (frequency > 0) positions.push('body');
      
      const optimal = density >= 0.5 && density <= 2.5 && positions.length >= 2;
      
      return {
        keyword,
        frequency,
        density,
        positions,
        optimal
      };
    });
    
    const optimalCount = keywordMetrics.filter(m => m.optimal).length;
    const score = (optimalCount / keywordMetrics.length) * 100;
    
    const suggestions: string[] = [];
    keywordMetrics.forEach(metric => {
      if (!metric.optimal) {
        if (metric.frequency === 0) {
          suggestions.push(`Keyword "${metric.keyword}" not found in content.`);
        } else if (metric.density < 0.5) {
          suggestions.push(`Increase usage of "${metric.keyword}" (current: ${metric.density.toFixed(1)}%).`);
        } else if (metric.density > 2.5) {
          suggestions.push(`Reduce usage of "${metric.keyword}" (current: ${metric.density.toFixed(1)}%).`);
        } else if (metric.positions.length < 2) {
          suggestions.push(`Use "${metric.keyword}" in more prominent positions (title, headings).`);
        }
      }
    });
    
    return {
      score,
      targetKeywords: keywordMetrics,
      suggestions
    };
  }
  
  private analyzeReadability(body: string): ReadabilityAnalysis {
    // Flesch Reading Ease calculation
    const sentences = body.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const words = body.split(/\s+/).filter(w => w.length > 0);
    const syllables = words.reduce((sum, word) => sum + this.countSyllables(word), 0);
    
    const avgWordsPerSentence = words.length / Math.max(sentences.length, 1);
    const avgSyllablesPerWord = syllables / Math.max(words.length, 1);
    
    const fleschReadingEase = 206.835 - 1.015 * avgWordsPerSentence - 84.6 * avgSyllablesPerWord;
    const fleschClamped = Math.max(0, Math.min(100, fleschReadingEase));
    
    let readingLevel = '';
    if (fleschClamped >= 90) readingLevel = '5th grade';
    else if (fleschClamped >= 80) readingLevel = '6th grade';
    else if (fleschClamped >= 70) readingLevel = '7th grade';
    else if (fleschClamped >= 60) readingLevel = '8th-9th grade';
    else if (fleschClamped >= 50) readingLevel = '10th-12th grade';
    else if (fleschClamped >= 30) readingLevel = 'College';
    else readingLevel = 'College graduate';
    
    const suggestions: string[] = [];
    
    if (avgWordsPerSentence > 25) {
      suggestions.push('Simplify complex sentences. Average words per sentence is too high.');
    }
    
    if (fleschClamped < 50) {
      suggestions.push('Content is difficult to read. Use simpler words and shorter sentences.');
    }
    
    const score = fleschClamped;
    
    return {
      score,
      fleschReadingEase: fleschClamped,
      avgWordsPerSentence,
      avgSyllablesPerWord,
      readingLevel,
      suggestions
    };
  }
  
  private countSyllables(word: string): number {
    word = word.toLowerCase();
    if (word.length <= 3) return 1;
    
    word = word.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '');
    word = word.replace(/^y/, '');
    
    const syllableMatches = word.match(/[aeiouy]{1,2}/g);
    return syllableMatches ? syllableMatches.length : 1;
  }
  
  private analyzeTechnical(content: SEOContent, checkImages: boolean, checkLinks: boolean): TechnicalAnalysis {
    const suggestions: string[] = [];
    let score = 50;
    
    // Images
    let imageAnalysis: ImageSEOAnalysis = {
      total: 0,
      withAlt: 0,
      optimized: 0
    };
    
    if (checkImages && content.images) {
      imageAnalysis.total = content.images.length;
      imageAnalysis.withAlt = content.images.filter(img => img.alt && img.alt.length > 0).length;
      imageAnalysis.optimized = imageAnalysis.total > 0
        ? (imageAnalysis.withAlt / imageAnalysis.total) * 100
        : 0;
      
      if (imageAnalysis.total > 0 && imageAnalysis.withAlt < imageAnalysis.total) {
        suggestions.push(`${imageAnalysis.total - imageAnalysis.withAlt} image(s) missing alt text.`);
      }
      
      if (imageAnalysis.optimized >= 80) score += 15;
      else if (imageAnalysis.optimized >= 50) score += 7;
    }
    
    // Links
    let linkAnalysis: LinkSEOAnalysis = {
      total: 0,
      internal: 0,
      external: 0,
      broken: 0
    };
    
    if (checkLinks && content.links) {
      linkAnalysis.total = content.links.length;
      linkAnalysis.internal = content.links.filter(link => link.internal).length;
      linkAnalysis.external = content.links.filter(link => !link.internal).length;
      
      const wordCount = countWords(content.body);
      const internalLinkDensity = (linkAnalysis.internal / wordCount) * 100;
      
      if (internalLinkDensity < 0.5 && wordCount > 500) {
        suggestions.push('Add more internal links to improve site navigation.');
      }
      
      if (linkAnalysis.internal >= 3) score += 10;
      if (linkAnalysis.external >= 1) score += 5;
    }
    
    // Slug
    let slugAnalysis: SlugAnalysis = {
      score: 50,
      length: 0,
      hasKeyword: false,
      valid: false
    };
    
    if (content.slug) {
      slugAnalysis.length = content.slug.length;
      slugAnalysis.valid = /^[a-z0-9-]+$/.test(content.slug);
      
      // Check if slug contains any keyword from tags
      if (content.tags && content.tags.length > 0) {
        slugAnalysis.hasKeyword = content.tags.some(tag =>
          content.slug!.toLowerCase().includes(tag.toLowerCase().replace(/\s+/g, '-'))
        );
      }
      
      if (slugAnalysis.valid) slugAnalysis.score += 30;
      if (slugAnalysis.hasKeyword) slugAnalysis.score += 20;
      
      if (!slugAnalysis.valid) {
        suggestions.push('Slug contains invalid characters. Use only lowercase letters, numbers, and hyphens.');
      }
      
      if (slugAnalysis.score >= 80) score += 10;
    } else {
      suggestions.push('Add a URL slug for better SEO.');
    }
    
    return {
      score: Math.min(100, score),
      images: imageAnalysis,
      links: linkAnalysis,
      slug: slugAnalysis,
      suggestions
    };
  }
  
  // ====================================
  // Scoring & Recommendations
  // ====================================
  
  private calculateOverallScore(analysis: SEOAnalysis): number {
    const weights = {
      title: 0.20,
      meta: 0.15,
      content: 0.25,
      keywords: 0.20,
      readability: 0.10,
      technical: 0.10
    };
    
    return Math.round(
      analysis.title.score * weights.title +
      analysis.meta.score * weights.meta +
      analysis.content.score * weights.content +
      analysis.keywords.score * weights.keywords +
      analysis.readability.score * weights.readability +
      analysis.technical.score * weights.technical
    );
  }
  
  private identifyIssues(analysis: SEOAnalysis, content: SEOContent): SEOIssue[] {
    const issues: SEOIssue[] = [];
    
    // Title issues
    if (analysis.title.score < 50) {
      issues.push({
        category: 'title',
        severity: 'high',
        message: 'Title needs optimization',
        impact: 8
      });
    }
    
    // Meta issues
    if (analysis.meta.score === 0) {
      issues.push({
        category: 'meta',
        severity: 'high',
        message: 'Missing meta description',
        impact: 7
      });
    }
    
    // Content issues
    if (analysis.content.wordCount < 300) {
      issues.push({
        category: 'content',
        severity: 'critical',
        message: 'Content is too short',
        impact: 10
      });
    }
    
    if (analysis.content.headingStructure.h1 === 0) {
      issues.push({
        category: 'content',
        severity: 'high',
        message: 'Missing H1 heading',
        impact: 6
      });
    }
    
    // Readability issues
    if (analysis.readability.score < 30) {
      issues.push({
        category: 'readability',
        severity: 'medium',
        message: 'Content is too difficult to read',
        impact: 5
      });
    }
    
    // Technical issues
    if (content.images && content.images.length > 0) {
      const imagesWithoutAlt = content.images.filter(img => !img.alt || img.alt.length === 0);
      if (imagesWithoutAlt.length > 0) {
        issues.push({
          category: 'technical',
          severity: 'medium',
          message: `${imagesWithoutAlt.length} image(s) missing alt text`,
          impact: 4
        });
      }
    }
    
    return issues;
  }
  
  private generateRecommendations(issues: SEOIssue[], analysis: SEOAnalysis): SEORecommendation[] {
    const recommendations: SEORecommendation[] = [];
    
    // Prioritize by impact
    const sortedIssues = [...issues].sort((a, b) => b.impact - a.impact);
    
    for (const issue of sortedIssues.slice(0, 5)) {  // Top 5 issues
      let description = '';
      
      if (issue.category === 'title') {
        description = `Optimize your title to be between 50-60 characters and include your target keyword.`;
      } else if (issue.category === 'meta') {
        description = `Add a meta description (excerpt) of 150-160 characters that includes your target keyword.`;
      } else if (issue.category === 'content') {
        if (issue.message.includes('short')) {
          description = `Expand your content to at least 800 words for better SEO performance.`;
        } else if (issue.message.includes('H1')) {
          description = `Add a single H1 heading at the start of your content.`;
        }
      } else if (issue.category === 'readability') {
        description = `Simplify your content by using shorter sentences and simpler words.`;
      } else if (issue.category === 'technical') {
        description = `Add descriptive alt text to all images for better accessibility and SEO.`;
      }
      
      const priority = issue.severity === 'critical' || issue.severity === 'high' ? 'high' :
                       issue.severity === 'medium' ? 'medium' : 'low';
      
      recommendations.push({
        priority,
        category: issue.category,
        title: issue.message,
        description,
        expectedImpact: issue.impact
      });
    }
    
    return recommendations;
  }
}

// Export singleton instance
export const analyzeSEOSkill = new AnalyzeSEOSkill();
