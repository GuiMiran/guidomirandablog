/**
 * Content Translation Skill
 * SPEC-006: Translate content between languages
 * 
 * Capability: Translate blog posts, comments, and UI text
 * Context Required: Source text, target language, source language (optional)
 * Quality Metrics: Translation accuracy, fluency, cultural appropriateness
 */

import { logger } from '../utils/logger';
import { recordSkillExecution } from '../utils/metrics';
import { cacheSkillResult, getCachedSkillResult } from '../utils/cache';

export interface TranslateContentInput {
  text: string;
  targetLanguage: string;
  sourceLanguage?: string;
  context?: 'blog-post' | 'comment' | 'ui-text' | 'general';
  preserveFormatting?: boolean;
  tone?: 'formal' | 'casual' | 'technical';
}

export interface TranslateContentOutput {
  translatedText: string;
  sourceLanguage: string;
  targetLanguage: string;
  confidence: number;
  warnings?: string[];
}

export interface TranslateContentValidation {
  isValid: boolean;
  errors: string[];
  warnings?: string[];
}

// Language validation
const SUPPORTED_LANGUAGES = [
  'es', 'en', 'pt', 'fr', 'de', 'it', 'ja', 'zh', 'ko', 'ru'
];

/**
 * PRE-condition validation
 */
export function validateTranslateInput(input: TranslateContentInput): TranslateContentValidation {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Required fields
  if (!input.text || input.text.trim().length === 0) {
    errors.push('Text to translate is required');
  }

  if (!input.targetLanguage) {
    errors.push('Target language is required');
  }

  // Text length validation
  if (input.text && input.text.length < 1) {
    errors.push('Text must have at least 1 character');
  }

  if (input.text && input.text.length > 50000) {
    errors.push('Text exceeds maximum length of 50,000 characters');
  }

  // Language code validation
  if (input.targetLanguage && !SUPPORTED_LANGUAGES.includes(input.targetLanguage.toLowerCase())) {
    warnings.push(`Target language '${input.targetLanguage}' may not be supported. Supported: ${SUPPORTED_LANGUAGES.join(', ')}`);
  }

  if (input.sourceLanguage && !SUPPORTED_LANGUAGES.includes(input.sourceLanguage.toLowerCase())) {
    warnings.push(`Source language '${input.sourceLanguage}' may not be supported`);
  }

  // Same language check
  if (input.sourceLanguage && input.targetLanguage && 
      input.sourceLanguage.toLowerCase() === input.targetLanguage.toLowerCase()) {
    warnings.push('Source and target languages are the same');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings: warnings.length > 0 ? warnings : undefined
  };
}

/**
 * POST-condition validation
 */
export function validateTranslateOutput(
  input: TranslateContentInput,
  output: TranslateContentOutput
): TranslateContentValidation {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Required output fields
  if (!output.translatedText) {
    errors.push('Translation result is missing');
  }

  if (!output.targetLanguage) {
    errors.push('Target language is missing from output');
  }

  if (!output.sourceLanguage) {
    errors.push('Source language is missing from output');
  }

  if (output.confidence === undefined || output.confidence === null) {
    errors.push('Confidence score is missing');
  }

  // Quality checks
  if (output.confidence < 0 || output.confidence > 1) {
    errors.push('Confidence score must be between 0 and 1');
  }

  if (output.translatedText && output.translatedText === input.text) {
    warnings.push('Translation is identical to source text');
  }

  if (output.translatedText && output.translatedText.length < input.text.length * 0.3) {
    warnings.push('Translation is significantly shorter than source (possible truncation)');
  }

  if (output.translatedText && output.translatedText.length > input.text.length * 3) {
    warnings.push('Translation is significantly longer than source');
  }

  // Formatting preservation check
  if (input.preserveFormatting) {
    const sourceHasMarkdown = /[#*_`\[\]]/g.test(input.text);
    const translationHasMarkdown = /[#*_`\[\]]/g.test(output.translatedText);
    
    if (sourceHasMarkdown && !translationHasMarkdown) {
      warnings.push('Source has markdown formatting but translation does not');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings: warnings.length > 0 ? warnings : undefined
  };
}

/**
 * Translate Content Skill - Core Implementation
 */
export async function translateContentSkill(
  input: TranslateContentInput
): Promise<TranslateContentOutput> {
  const startTime = Date.now();
  const traceId = `translate-${Date.now()}`;

  logger.info('Translation skill invoked', {
    service: 'skill',
    operation: 'translate_content',
    traceId,
    timestamp: new Date(),
    metadata: {
      targetLanguage: input.targetLanguage,
      sourceLanguage: input.sourceLanguage || 'auto-detect',
      textLength: input.text.length,
      context: input.context
    }
  });

  // PRE-condition validation
  const preValidation = validateTranslateInput(input);
  if (!preValidation.isValid) {
    const error = new Error(`Translation input validation failed: ${preValidation.errors.join(', ')}`);
    logger.error('Translation PRE-validation failed', {
      service: 'skill',
      operation: 'translate_content',
      traceId,
      timestamp: new Date(),
      metadata: { errors: preValidation.errors }
    }, error);
    throw error;
  }

  if (preValidation.warnings && preValidation.warnings.length > 0) {
    logger.warn('Translation input warnings', {
      service: 'skill',
      operation: 'translate_content',
      traceId,
      timestamp: new Date(),
      metadata: { warnings: preValidation.warnings }
    });
  }

  try {
    // Check cache
    const cached = getCachedSkillResult<TranslateContentOutput>('translate_content', {
      text: input.text,
      targetLanguage: input.targetLanguage,
      sourceLanguage: input.sourceLanguage
    });
    
    if (cached) {
      logger.info('Translation cache hit', {
        service: 'skill',
        operation: 'translate_content',
        traceId,
        timestamp: new Date(),
        metadata: { targetLanguage: input.targetLanguage }
      });
      return cached;
    }

    // Note: In a real implementation, this would call OpenAI API or similar
    // For now, we'll create a structured response
    const detectedSourceLanguage = input.sourceLanguage || detectLanguage(input.text);
    
    const result: TranslateContentOutput = {
      translatedText: await performTranslation(input, detectedSourceLanguage),
      sourceLanguage: detectedSourceLanguage,
      targetLanguage: input.targetLanguage,
      confidence: calculateConfidence(input),
      warnings: preValidation.warnings
    };

    // POST-condition validation
    const postValidation = validateTranslateOutput(input, result);
    if (!postValidation.isValid) {
      const error = new Error(`Translation output validation failed: ${postValidation.errors.join(', ')}`);
      logger.error('Translation POST-validation failed', {
        service: 'skill',
        operation: 'translate_content',
        traceId,
        timestamp: new Date(),
        metadata: { errors: postValidation.errors }
      }, error);
      throw error;
    }

    if (postValidation.warnings) {
      result.warnings = [...(result.warnings || []), ...postValidation.warnings];
    }

    // Cache result
    cacheSkillResult('translate_content', input, result);

    const duration = Date.now() - startTime;
    recordSkillExecution('translate_content', duration, true);

    logger.info('Translation completed successfully', {
      service: 'skill',
      operation: 'translate_content',
      traceId,
      timestamp: new Date(),
      metadata: {
        duration,
        confidence: result.confidence,
        sourceLanguage: result.sourceLanguage,
        targetLanguage: result.targetLanguage,
        originalLength: input.text.length,
        translatedLength: result.translatedText.length
      }
    });

    return result;

  } catch (error) {
    const duration = Date.now() - startTime;
    recordSkillExecution('translate_content', duration, false);

    logger.error('Translation skill failed', {
      service: 'skill',
      operation: 'translate_content',
      traceId,
      timestamp: new Date(),
      metadata: { duration }
    }, error instanceof Error ? error : new Error(String(error)));

    throw error;
  }
}

/**
 * Helper: Detect source language (simple heuristic)
 */
function detectLanguage(text: string): string {
  // Simple heuristic based on character patterns
  // In production, use a proper language detection library
  
  const hasSpanishChars = /[áéíóúñ¿¡]/i.test(text);
  const hasSpanishWords = /\b(el|la|los|las|de|en|que|es|un|una|por|con|para)\b/i.test(text);
  
  if (hasSpanishChars || hasSpanishWords) {
    return 'es';
  }
  
  const hasPortugueseChars = /[ãõç]/i.test(text);
  const hasPortugueseWords = /\b(o|a|os|as|de|em|que|é|um|uma|por|com|para)\b/i.test(text);
  
  if (hasPortugueseChars || hasPortugueseWords) {
    return 'pt';
  }
  
  // Default to English
  return 'en';
}

/**
 * Helper: Perform translation (mock implementation)
 * In production, this would call OpenAI API or similar
 */
async function performTranslation(
  input: TranslateContentInput,
  sourceLanguage: string
): Promise<string> {
  // TODO: Implement actual translation using OpenAI API
  // For now, return a placeholder indicating translation would occur
  
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 100));
  
  // In production, would use:
  // const openai = getOpenAIClient();
  // const response = await openai.chat.completions.create({
  //   model: "gpt-4",
  //   messages: [
  //     {
  //       role: "system",
  //       content: `You are a professional translator. Translate the following text from ${sourceLanguage} to ${input.targetLanguage}. ${input.preserveFormatting ? 'Preserve all markdown formatting.' : ''} Use a ${input.tone || 'neutral'} tone.`
  //     },
  //     {
  //       role: "user",
  //       content: input.text
  //     }
  //   ]
  // });
  // return response.choices[0].message.content;
  
  return `[Translation: ${sourceLanguage} → ${input.targetLanguage}] ${input.text}`;
}

/**
 * Helper: Calculate translation confidence
 */
function calculateConfidence(input: TranslateContentInput): number {
  let confidence = 0.85; // Base confidence
  
  // Adjust based on text length (longer texts usually translate better)
  if (input.text.length < 50) {
    confidence -= 0.1;
  } else if (input.text.length > 500) {
    confidence += 0.05;
  }
  
  // Adjust based on context
  if (input.context === 'blog-post' || input.context === 'ui-text') {
    confidence += 0.02; // Standard content types
  }
  
  // Adjust based on source language detection
  if (!input.sourceLanguage) {
    confidence -= 0.05; // Auto-detection has some uncertainty
  }
  
  return Math.max(0, Math.min(1, confidence));
}

/**
 * Skill Metadata Export
 */
export const translateContentSkillMetadata = {
  name: 'translate_content',
  version: '1.0.0',
  description: 'Translate content between languages',
  capabilities: [
    'Blog post translation',
    'Comment translation',
    'UI text localization',
    'Multi-language support',
    'Formatting preservation'
  ],
  supportedLanguages: SUPPORTED_LANGUAGES,
  preValidation: validateTranslateInput,
  postValidation: validateTranslateOutput,
  execute: translateContentSkill
};
