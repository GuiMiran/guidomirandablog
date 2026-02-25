/**
 * SKILL-001: Generate Content
 * 
 * Generate original blog post content using AI (OpenAI GPT-4o)
 * Following specification: docs/specs/skill_specs/generate_content_skill.md
 */

import { BaseSkill, ValidationError, calculateCost, generateSlug, countWords, countParagraphs, extractHeadingStructure } from './base';
import { openai } from '../openai/client';

// ============================================================================
// Types
// ============================================================================

export interface GenerateContentInput {
  topic: string;
  length?: 'short' | 'medium' | 'long';
  tone?: 'professional' | 'casual' | 'technical' | 'conversational';
  targetAudience?: string;
  outline?: string[];
  keywords?: string[];
  language?: string;
  context?: {
    relatedPosts?: string[];
    referenceSources?: string[];
  };
}

export interface GenerateContentOutput {
  content: GeneratedContent;
  metadata: ContentMetadata;
  usage: UsageMetrics;
}

export interface GeneratedContent {
  title: string;
  slug: string;
  excerpt: string;
  body: string;
  tags: string[];
  category: string;
  readingTimeMinutes: number;
}

export interface ContentMetadata {
  wordCount: number;
  characterCount: number;
  paragraphCount: number;
  headingCount: number;
  qualityScore: number;
  tone: string;
  complexity: 'beginner' | 'intermediate' | 'advanced';
  generatedAt: Date;
  modelUsed: string;
}

export interface UsageMetrics {
  tokensUsed: {
    prompt: number;
    completion: number;
    total: number;
  };
  costUSD: number;
  durationMs: number;
}

// ============================================================================
// Skill Implementation
// ============================================================================

export class GenerateContentSkill extends BaseSkill<GenerateContentInput, GenerateContentOutput> {
  readonly id = 'generate_content';
  readonly name = 'Generate Content';
  readonly description = 'Generate original blog post content using AI';
  
  // ====================================
  // Preconditions
  // ====================================
  
  protected async checkPreconditions(input: GenerateContentInput): Promise<ValidationError[]> {
    const errors: ValidationError[] = [];
    
    // PRE-GEN-001: Topic No Vacío
    if (!input.topic || input.topic.trim().length === 0) {
      errors.push({
        code: 'PRE-GEN-001',
        message: 'Topic must not be empty',
        field: 'topic'
      });
    }
    
    // PRE-GEN-002: OpenAI API Disponible
    if (!process.env.OPENAI_API_KEY) {
      errors.push({
        code: 'PRE-GEN-002',
        message: 'OpenAI API must be available and configured',
        field: 'config'
      });
    }
    
    // PRE-GEN-003: Parámetros Válidos
    const validLengths = ['short', 'medium', 'long'];
    const validTones = ['professional', 'casual', 'technical', 'conversational'];
    
    if (input.length && !validLengths.includes(input.length)) {
      errors.push({
        code: 'PRE-GEN-003',
        message: `Length must be one of: ${validLengths.join(', ')}`,
        field: 'length'
      });
    }
    
    if (input.tone && !validTones.includes(input.tone)) {
      errors.push({
        code: 'PRE-GEN-003',
        message: `Tone must be one of: ${validTones.join(', ')}`,
        field: 'tone'
      });
    }
    
    return errors;
  }
  
  // ====================================
  // Postconditions
  // ====================================
  
  protected async checkPostconditions(output: GenerateContentOutput, input: GenerateContentInput): Promise<ValidationError[]> {
    const errors: ValidationError[] = [];
    const { title, body, excerpt, tags, category } = output.content;
    
    // POST-GEN-001: Contenido Completo
    if (title.length === 0) {
      errors.push({ code: 'POST-GEN-001', message: 'Title must not be empty' });
    }
    if (body.length < 100) {
      errors.push({ code: 'POST-GEN-001', message: 'Body must have at least 100 characters' });
    }
    if (excerpt.length === 0) {
      errors.push({ code: 'POST-GEN-001', message: 'Excerpt must not be empty' });
    }
    if (tags.length < 3) {
      errors.push({ code: 'POST-GEN-001', message: 'Must have at least 3 tags' });
    }
    if (category.length === 0) {
      errors.push({ code: 'POST-GEN-001', message: 'Category must not be empty' });
    }
    
    // POST-GEN-002: Estructura Markdown Válida
    const hasHeadings = /^#{1,6}\s+.+$/m.test(body);
    const hasParagraphs = body.split('\n\n').length >= 3;
    
    if (!hasHeadings) {
      errors.push({ code: 'POST-GEN-002', message: 'Body must have at least one heading' });
    }
    if (!hasParagraphs) {
      errors.push({ code: 'POST-GEN-002', message: 'Body must have at least 3 paragraphs' });
    }
    
    // POST-GEN-003: Dentro de Límites de Longitud
    const wordCount = output.metadata.wordCount;
    const limits = {
      short: [300, 800],
      medium: [800, 2000],
      long: [2000, 5000]
    };
    
    const [min, max] = limits[input.length || 'medium'];
    
    if (wordCount < min || wordCount > max) {
      errors.push({
        code: 'POST-GEN-003',
        message: `Content length must be between ${min} and ${max} words (got ${wordCount})`
      });
    }
    
    return errors;
  }
  
  // ====================================
  // Invariants
  // ====================================
  
  protected async checkInvariants(output: GenerateContentOutput, input: GenerateContentInput): Promise<ValidationError[]> {
    const errors: ValidationError[] = [];
    
    // INV-GEN-001: Keywords Presentes
    if (input.keywords && input.keywords.length > 0) {
      const contentText = `${output.content.title} ${output.content.body}`.toLowerCase();
      const presentKeywords = input.keywords.filter(kw =>
        contentText.includes(kw.toLowerCase())
      );
      
      if (presentKeywords.length / input.keywords.length < 0.7) {
        errors.push({
          code: 'INV-GEN-001',
          message: `At least 70% of keywords must appear in content (${presentKeywords.length}/${input.keywords.length})`
        });
      }
    }
    
    // INV-GEN-002: Outline Respetado
    if (input.outline && input.outline.length > 0) {
      const body = output.content.body;
      const matchedSections = input.outline.filter(section =>
        new RegExp(`^#{1,3}\\s+${section}`, 'mi').test(body)
      );
      
      if (matchedSections.length / input.outline.length < 0.8) {
        errors.push({
          code: 'INV-GEN-002',
          message: `At least 80% of outline sections must be present (${matchedSections.length}/${input.outline.length})`
        });
      }
    }
    
    // INV-GEN-003: Costo Razonable
    if (output.usage.costUSD > 0.50) {
      errors.push({
        code: 'INV-GEN-003',
        message: `Content generation must not exceed $0.50 (cost: $${output.usage.costUSD})`
      });
    }
    
    return errors;
  }
  
  // ====================================
  // Implementation
  // ====================================
  
  protected async executeImpl(input: GenerateContentInput, context: any): Promise<GenerateContentOutput> {
    const startTime = Date.now();
    
    const prompt = this.buildPrompt(input);
    
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'Eres un experto escritor de contenido técnico para blogs.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 4000,
      response_format: { type: 'json_object' }
    });
    
    const generatedData = JSON.parse(response.choices[0].message.content || '{}');
    
    // Calculate metadata
    const body = generatedData.body || '';
    const wordCount = countWords(body);
    const characterCount = body.length;
    const paragraphCount = countParagraphs(body);
    const headingStructure = extractHeadingStructure(body);
    const headingCount = headingStructure.h1 + headingStructure.h2 + headingStructure.h3;
    
    const readingTimeMinutes = Math.ceil(wordCount / 200);
    const slug = generateSlug(generatedData.title || input.topic);
    const qualityScore = this.calculateQualityScore(generatedData, wordCount);
    const complexity = this.determineComplexity(body);
    
    const durationMs = Date.now() - startTime;
    const costUSD = calculateCost(
      {
        prompt_tokens: response.usage?.prompt_tokens || 0,
        completion_tokens: response.usage?.completion_tokens || 0
      },
      'gpt-4o'
    );
    
    return {
      content: {
        title: generatedData.title || '',
        slug,
        excerpt: generatedData.excerpt || '',
        body,
        tags: generatedData.tags || [],
        category: generatedData.category || 'General',
        readingTimeMinutes
      },
      metadata: {
        wordCount,
        characterCount,
        paragraphCount,
        headingCount,
        qualityScore,
        tone: input.tone || 'professional',
        complexity,
        generatedAt: new Date(),
        modelUsed: 'gpt-4o'
      },
      usage: {
        tokensUsed: {
          prompt: response.usage?.prompt_tokens || 0,
          completion: response.usage?.completion_tokens || 0,
          total: response.usage?.total_tokens || 0
        },
        costUSD,
        durationMs
      }
    };
  }
  
  // ====================================
  // Helper Methods
  // ====================================
  
  private buildPrompt(input: GenerateContentInput): string {
    const lengthGuide = {
      short: '500-700 palabras',
      medium: '1000-1500 palabras',
      long: '2000-3000 palabras'
    };
    
    const toneGuide = {
      professional: 'Mantén un tono profesional y objetivo',
      casual: 'Usa un tono amigable y conversacional',
      technical: 'Usa terminología técnica precisa',
      conversational: 'Escribe como si hablaras con un amigo'
    };
    
    let prompt = `Genera un artículo de blog sobre: "${input.topic}"\n\n`;
    
    prompt += `Longitud: ${lengthGuide[input.length || 'medium']}\n`;
    prompt += `Tono: ${toneGuide[input.tone || 'professional']}\n`;
    
    if (input.targetAudience) {
      prompt += `Audiencia: ${input.targetAudience}\n`;
    }
    
    if (input.outline && input.outline.length > 0) {
      prompt += `\nEstructura del artículo:\n`;
      input.outline.forEach(section => {
        prompt += `- ${section}\n`;
      });
    }
    
    if (input.keywords && input.keywords.length > 0) {
      prompt += `\nIncluye estas palabras clave: ${input.keywords.join(', ')}\n`;
    }
    
    prompt += `\nFormato de respuesta (JSON):\n`;
    prompt += `{
  "title": "título del artículo",
  "excerpt": "resumen breve de 1-2 frases",
  "body": "contenido completo en markdown",
  "tags": ["tag1", "tag2", "tag3", "tag4", "tag5"],
  "category": "categoría principal"
}\n`;
    
    return prompt;
  }
  
  private calculateQualityScore(content: any, wordCount: number): number {
    let score = 50;
    
    // Title quality (max +10)
    if (content.title && content.title.length >= 30 && content.title.length <= 70) {
      score += 10;
    } else if (content.title && content.title.length >= 20) {
      score += 5;
    }
    
    // Excerpt quality (max +10)
    if (content.excerpt && content.excerpt.length >= 100 && content.excerpt.length <= 160) {
      score += 10;
    }
    
    // Body length (max +10)
    if (wordCount >= 800 && wordCount <= 2000) {
      score += 10;
    } else if (wordCount >= 500) {
      score += 5;
    }
    
    // Structure (max +10)
    const hasIntro = content.body && content.body.toLowerCase().includes('introducción');
    const hasConclusion = content.body && content.body.toLowerCase().includes('conclusión');
    if (hasIntro && hasConclusion) score += 10;
    else if (hasIntro || hasConclusion) score += 5;
    
    // Tags (max +10)
    if (content.tags && content.tags.length >= 5) score += 10;
    else if (content.tags && content.tags.length >= 3) score += 5;
    
    return Math.min(score, 100);
  }
  
  private determineComplexity(body: string): 'beginner' | 'intermediate' | 'advanced' {
    const technicalTerms = [
      'arquitectura', 'algoritmo', 'optimización', 'refactoring',
      'dependency', 'framework', 'biblioteca', 'API', 'middleware'
    ];
    
    const bodyLower = body.toLowerCase();
    const termCount = technicalTerms.filter(term =>
      bodyLower.includes(term.toLowerCase())
    ).length;
    
    if (termCount >= 5) return 'advanced';
    if (termCount >= 2) return 'intermediate';
    return 'beginner';
  }
}

// Export singleton instance
export const generateContentSkill = new GenerateContentSkill();
