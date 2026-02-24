/**
 * SKILL-002: Summarize Content
 * 
 * Generate concise and coherent summaries of extensive content
 * Following specification: docs/specs/skill_specs/summarize_content_skill.md
 */

import { BaseSkill, ValidationError, calculateCost, countWords } from './base';
import { openai } from '../openai/client';

// ============================================================================
// Types
// ============================================================================

export interface SummarizeContentInput {
  content: string;
  length?: 'short' | 'medium' | 'long';
  style?: 'bullet-points' | 'paragraph' | 'abstract';
  focus?: string[];
  targetAudience?: 'general' | 'technical' | 'executive';
  language?: string;
}

export interface SummarizeContentOutput {
  summary: string;
  keyPoints: string[];
  metrics: SummaryMetrics;
  metadata: SummaryMetadata;
}

export interface SummaryMetrics {
  originalWordCount: number;
  summaryWordCount: number;
  compressionRatio: number;
  keyConceptsCovered: number;
  coherenceScore: number;
}

export interface SummaryMetadata {
  generatedAt: Date;
  model: string;
  tokensUsed: number;
  costUSD: number;
  durationMs: number;
}

// ============================================================================
// Skill Implementation
// ============================================================================

export class SummarizeContentSkill extends BaseSkill<SummarizeContentInput, SummarizeContentOutput> {
  readonly id = 'summarize_content';
  readonly name = 'Summarize Content';
  readonly description = 'Generate concise summaries preserving key ideas';
  
  // ====================================
  // Preconditions
  // ====================================
  
  protected async checkPreconditions(input: SummarizeContentInput): Promise<ValidationError[]> {
    const errors: ValidationError[] = [];
    
    // PRE-SUM-001: Contenido Suficiente
    const wordCount = countWords(input.content);
    if (wordCount < 100) {
      errors.push({
        code: 'PRE-SUM-001',
        message: 'Content must have at least 100 words to summarize',
        field: 'content'
      });
    }
    
    return errors;
  }
  
  // ====================================
  // Postconditions
  // ====================================
  
  protected async checkPostconditions(output: SummarizeContentOutput, input: SummarizeContentInput): Promise<ValidationError[]> {
    const errors: ValidationError[] = [];
    
    // POST-SUM-001: Resumen Más Corto
    if (output.metrics.summaryWordCount >= output.metrics.originalWordCount) {
      errors.push({
        code: 'POST-SUM-001',
        message: 'Summary must be shorter than original content'
      });
    }
    
    // POST-SUM-002: Puntos Clave Presentes
    if (output.keyPoints.length < 3 || output.keyPoints.length > 7) {
      errors.push({
        code: 'POST-SUM-002',
        message: 'Must extract 3-7 key points'
      });
    }
    
    return errors;
  }
  
  // ====================================
  // Invariants
  // ====================================
  
  protected async checkInvariants(output: SummarizeContentOutput, input: SummarizeContentInput): Promise<ValidationError[]> {
    const errors: ValidationError[] = [];
    
    // INV-SUM-001: Compresión Razonable (5-50%)
    const ratio = output.metrics.compressionRatio;
    if (ratio < 0.05 || ratio > 0.5) {
      errors.push({
        code: 'INV-SUM-001',
        message: `Compression ratio must be between 0.05 and 0.5 (got ${ratio.toFixed(3)})`
      });
    }
    
    // INV-SUM-002: Coherencia Alta
    if (output.metrics.coherenceScore < 70) {
      errors.push({
        code: 'INV-SUM-002',
        message: `Coherence score must be >= 70 (got ${output.metrics.coherenceScore})`
      });
    }
    
    return errors;
  }
  
  // ====================================
  // Implementation
  // ====================================
  
  protected async executeImpl(input: SummarizeContentInput, context: any): Promise<SummarizeContentOutput> {
    const startTime = Date.now();
    
    const originalWordCount = countWords(input.content);
    
    // Determine summary length target
    const lengthTargets = {
      short: Math.min(100, originalWordCount * 0.1),
      medium: Math.min(250, originalWordCount * 0.2),
      long: Math.min(500, originalWordCount * 0.3)
    };
    
    const targetWords = lengthTargets[input.length || 'medium'];
    
    const prompt = this.buildPrompt(input, targetWords);
    
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'Eres un experto en crear resúmenes concisos y precisos.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.3,
      max_tokens: Math.ceil(targetWords * 1.5),
      response_format: { type: 'json_object' }
    });
    
    const result = JSON.parse(response.choices[0].message.content || '{}');
    
    const summaryWordCount = countWords(result.summary || '');
    const compressionRatio = summaryWordCount / originalWordCount;
    const keyConceptsCovered = (result.keyPoints || []).length;
    const coherenceScore = this.calculateCoherence(result.summary || '', input.content);
    
    const durationMs = Date.now() - startTime;
    const costUSD = calculateCost(
      {
        prompt_tokens: response.usage?.prompt_tokens || 0,
        completion_tokens: response.usage?.completion_tokens || 0
      },
      'gpt-4o-mini'
    );
    
    return {
      summary: result.summary || '',
      keyPoints: result.keyPoints || [],
      metrics: {
        originalWordCount,
        summaryWordCount,
        compressionRatio,
        keyConceptsCovered,
        coherenceScore
      },
      metadata: {
        generatedAt: new Date(),
        model: 'gpt-4o-mini',
        tokensUsed: response.usage?.total_tokens || 0,
        costUSD,
        durationMs
      }
    };
  }
  
  // ====================================
  // Helper Methods
  // ====================================
  
  private buildPrompt(input: SummarizeContentInput, targetWords: number): string {
    let prompt = `Genera un resumen del siguiente contenido en aproximadamente ${targetWords} palabras.\n\n`;
    
    if (input.style === 'bullet-points') {
      prompt += 'Formato: Lista de puntos clave (bullet points).\n';
    } else if (input.style === 'abstract') {
      prompt += 'Formato: Resumen académico estilo abstract.\n';
    } else {
      prompt += 'Formato: Párrafo narrativo coherente.\n';
    }
    
    if (input.focus && input.focus.length > 0) {
      prompt += `Enfócate especialmente en: ${input.focus.join(', ')}.\n`;
    }
    
    if (input.targetAudience) {
      const audienceGuide = {
        general: 'Lenguaje simple y accesible',
        technical: 'Mantén términos técnicos',
        executive: 'Enfócate en impacto y resultados'
      };
      prompt += `Audiencia: ${audienceGuide[input.targetAudience]}.\n`;
    }
    
    prompt += `\nContenido a resumir:\n${input.content}\n\n`;
    prompt += `Responde en formato JSON:\n`;
    prompt += `{
  "summary": "resumen completo",
  "keyPoints": ["punto 1", "punto 2", "punto 3", ...]
}\n`;
    
    return prompt;
  }
  
  private calculateCoherence(summary: string, original: string): number {
    // Simplified coherence calculation based on term overlap
    const summaryTerms = this.extractImportantTerms(summary);
    const originalTerms = this.extractImportantTerms(original);
    
    const overlap = summaryTerms.filter(term => originalTerms.includes(term)).length;
    const score = (overlap / Math.max(summaryTerms.length, 1)) * 100;
    
    return Math.min(100, score);
  }
  
  private extractImportantTerms(text: string): string[] {
    const words = text.toLowerCase().split(/\s+/);
    
    // Spanish stop words
    const stopWords = [
      'el', 'la', 'de', 'que', 'y', 'a', 'en', 'un', 'es', 'por', 'con',
      'no', 'se', 'los', 'como', 'para', 'del', 'las', 'una', 'su'
    ];
    
    return words
      .filter(w => w.length > 4 && !stopWords.includes(w))
      .filter((w, i, arr) => arr.indexOf(w) === i)  // Unique
      .slice(0, 15);  // Top 15
  }
}

// Export singleton instance
export const summarizeContentSkill = new SummarizeContentSkill();
