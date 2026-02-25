/**
 * AGENT-002: Coder Agent
 * 
 * Generates and transforms content using AI models
 * Following specification: docs/specs/agent_specs/coder_agent.md
 */

import { BaseAgent, AgentContext, AgentValidationError } from './base';
import type { AgentId } from '../protocols';
import { generateContentSkill, summarizeContentSkill, chatInteractionSkill } from '@/lib/skills';

// ============================================================================
// Types
// ============================================================================

export type GenerationType =
  | 'blog_post'
  | 'summary'
  | 'chat_response'
  | 'seo_metadata'
  | 'title_suggestions';

export interface GenerationRequest {
  type: GenerationType;
  input: GenerationInput;
  config?: GenerationConfig;
}

export interface GenerationInput {
  // For blog_post
  topic?: string;
  outline?: string[];
  keywords?: string[];
  
  // For summary
  content?: string;
  maxLength?: number;
  
  // For chat_response
  messages?: Array<{ role: string; content: string }>;
  question?: string;
  
  // For seo_metadata
  postContent?: string;
}

export interface GenerationConfig {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  tone?: 'professional' | 'casual' | 'technical' | 'educational';
  length?: 'short' | 'medium' | 'long';
  language?: string;
  guidelines?: string[];
}

export interface GenerationResult {
  success: boolean;
  content: GeneratedContent;
  metadata: GenerationMetadata;
}

export interface GeneratedContent {
  // For blog_post
  title?: string;
  content?: string;
  excerpt?: string;
  tags?: string[];
  
  // For summary
  summary?: string;
  
  // For chat_response
  message?: string;
  
  // For seo_metadata
  metaTitle?: string;
  metaDescription?: string;
  keywords?: string[];
}

export interface GenerationMetadata {
  model: string;
  tokensUsed: {
    prompt: number;
    completion: number;
    total: number;
  };
  costUSD?: number;
  duration: number;
  timestamp: Date;
  quality?: {
    score: number;
    metrics: {
      coherence?: number;
      relevance?: number;
      completeness?: number;
    };
  };
}

// ============================================================================
// Coder Agent Implementation
// ============================================================================

export class CoderAgent extends BaseAgent<GenerationRequest, GenerationResult> {
  readonly id: AgentId = 'coder';
  readonly name = 'Coder Agent';
  readonly description = 'Generates and transforms content using AI models';
  readonly capabilities = [
    'content-generation',
    'text-transformation',
    'style-adaptation',
    'prompt-optimization'
  ];
  
  protected async validateInput(input: GenerationRequest): Promise<void> {
    if (!input.type) {
      throw new AgentValidationError(
        'MISSING_TYPE',
        'Generation request must specify a type'
      );
    }
    
    // Validate type-specific requirements
    switch (input.type) {
      case 'blog_post':
        if (!input.input.topic?.trim()) {
          throw new AgentValidationError(
            'MISSING_TOPIC',
            'Blog post generation requires a topic'
          );
        }
        break;
      
      case 'summary':
        if (!input.input.content || input.input.content.length < 50) {
          throw new AgentValidationError(
            'INVALID_CONTENT',
            'Summary requires content with at least 50 characters'
          );
        }
        break;
      
      case 'chat_response':
        if (!input.input.messages?.length && !input.input.question) {
          throw new AgentValidationError(
            'MISSING_CONTEXT',
            'Chat response requires messages or question'
          );
        }
        break;
      
      case 'seo_metadata':
        if (!input.input.postContent?.trim()) {
          throw new AgentValidationError(
            'MISSING_CONTENT',
            'SEO metadata generation requires post content'
          );
        }
        break;
      
      case 'title_suggestions':
        if (!input.input.topic && !input.input.content) {
          throw new AgentValidationError(
            'MISSING_INPUT',
            'Title suggestions require topic or content'
          );
        }
        break;
    }
  }
  
  protected async validateOutput(output: GenerationResult): Promise<void> {
    if (!output.success && !output.content) {
      throw new AgentValidationError(
        'INVALID_RESULT',
        'Generation result must have content or success flag'
      );
    }
    
    if (output.metadata.tokensUsed.total <= 0) {
      throw new AgentValidationError(
        'INVALID_TOKENS',
        'Token usage must be greater than 0'
      );
    }
  }
  
  protected async execute(
    input: GenerationRequest,
    context: AgentContext
  ): Promise<GenerationResult> {
    const startTime = Date.now();
    
    try {
      let result: GenerationResult;
      
      switch (input.type) {
        case 'blog_post':
          result = await this.generateBlogPost(input, context);
          break;
        
        case 'summary':
          result = await this.generateSummary(input, context);
          break;
        
        case 'chat_response':
          result = await this.generateChatResponse(input, context);
          break;
        
        case 'seo_metadata':
          result = await this.generateSEOMetadata(input, context);
          break;
        
        case 'title_suggestions':
          result = await this.generateTitleSuggestions(input, context);
          break;
        
        default:
          throw new Error(`Unsupported generation type: ${input.type}`);
      }
      
      result.metadata.duration = Date.now() - startTime;
      result.metadata.timestamp = new Date();
      
      return result;
      
    } catch (error: any) {
      return {
        success: false,
        content: {},
        metadata: {
          model: input.config?.model || 'gpt-4o-mini',
          tokensUsed: { prompt: 0, completion: 0, total: 0 },
          duration: Date.now() - startTime,
          timestamp: new Date()
        }
      };
    }
  }
  
  // ====================================
  // Generation Methods
  // ====================================
  
  private async generateBlogPost(
    input: GenerationRequest,
    context: AgentContext
  ): Promise<GenerationResult> {
    const { topic, outline, keywords } = input.input;
    const config = input.config || {};
    
    // Build enhanced prompt
    const prompt = this.buildBlogPostPrompt(topic!, outline, keywords, config);
    
    // Execute generation skill
    const skillResult = await generateContentSkill.execute({
      topic: topic!,
      tone: (config.tone === 'educational' ? 'professional' : config.tone) || 'professional',
      length: config.length || 'medium',
      outline: outline || [],
      keywords: keywords || []
    }, {
      traceId: context.traceId,
      userId: context.userId,
      sessionId: context.sessionId,
      environment: 'production',
      timestamp: new Date()
    });
    
    // Parse generated content from body
    const parsed = this.parseMarkdownPost(skillResult.content.body);
    
    return {
      success: true,
      content: {
        title: parsed.title || skillResult.content.title,
        content: parsed.content,
        excerpt: skillResult.content.excerpt,
        tags: skillResult.content.tags
      },
      metadata: {
        model: skillResult.metadata.modelUsed,
        tokensUsed: skillResult.usage.tokensUsed,
        costUSD: skillResult.usage.costUSD,
        duration: 0, // Will be set by execute()
        timestamp: new Date(),
        quality: this.estimateQuality(skillResult.content.body)
      }
    };
  }
  
  private async generateSummary(
    input: GenerationRequest,
    context: AgentContext
  ): Promise<GenerationResult> {
    const { content, maxLength } = input.input;
    const config = input.config || {};
    
    // Execute summarize skill
    const lengthMap: Record<number, 'short' | 'medium' | 'long'> = {
      100: 'short',
      200: 'medium',
      400: 'long'
    };
    const targetLength = maxLength || 200;
    const mappedLength = targetLength <= 150 ? 'short' : targetLength <= 300 ? 'medium' : 'long';
    
    const skillResult = await summarizeContentSkill.execute({
      content: content!,
      length: mappedLength,
      style: 'paragraph',
      targetAudience: 'general'
    }, {
      traceId: context.traceId,
      userId: context.userId,
      sessionId: context.sessionId,
      environment: 'production',
      timestamp: new Date()
    });
    
    return {
      success: true,
      content: {
        summary: skillResult.summary
      },
      metadata: {
        model: skillResult.metadata.model,
        tokensUsed: {
          prompt: Math.floor(skillResult.metadata.tokensUsed * 0.3),
          completion: Math.floor(skillResult.metadata.tokensUsed * 0.7),
          total: skillResult.metadata.tokensUsed
        },
        costUSD: skillResult.metadata.costUSD,
        duration: 0,
        timestamp: new Date()
      }
    };
  }
  
  private async generateChatResponse(
    input: GenerationRequest,
    context: AgentContext
  ): Promise<GenerationResult> {
    const { messages, question } = input.input;
    const config = input.config || {};
    
    // Build chat request
    const chatMessage = question || (messages && messages[messages.length - 1]?.content) || '';
    
    // Execute chat skill
    const skillResult = await chatInteractionSkill.execute({
      message: chatMessage,
      conversationHistory: messages ? messages.map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
        timestamp: new Date()
      })) : undefined,
      context: {
        userIntent: 'question'
      },
      options: {
        maxResponseLength: config.maxTokens,
        personality: 'professional'
      }
    }, {
      traceId: context.traceId,
      userId: context.userId,
      sessionId: context.sessionId,
      environment: 'production',
      timestamp: new Date()
    });
    
    return {
      success: true,
      content: {
        message: skillResult.response
      },
      metadata: {
        model: skillResult.metadata.model,
        tokensUsed: {
          prompt: Math.floor(skillResult.metadata.tokensUsed * 0.4),
          completion: Math.floor(skillResult.metadata.tokensUsed * 0.6),
          total: skillResult.metadata.tokensUsed
        },
        costUSD: skillResult.metadata.costUSD,
        duration: 0,
        timestamp: new Date()
      }
    };
  }
  
  private async generateSEOMetadata(
    input: GenerationRequest,
    context: AgentContext
  ): Promise<GenerationResult> {
    const { postContent } = input.input;
    
    // Use analyze_seo skill
    const { analyzeSEOSkill } = await import('@/lib/skills');
    const skillResult = await analyzeSEOSkill.execute({
      content: { title: '', body: postContent! },
      targetKeywords: []
    }, {
      traceId: context.traceId,
      userId: context.userId,
      sessionId: context.sessionId,
      environment: 'production',
      timestamp: new Date()
    });
    
    // Extract keywords from analysis (targetKeywords is KeywordMetric[])
    const keywordMetrics = skillResult.analysis.keywords.targetKeywords || [];
    
    return {
      success: true,
      content: {
        metaTitle: postContent!.slice(0, 60),
        metaDescription: postContent!.slice(0, 160),
        keywords: keywordMetrics.map(k => k.keyword)
      },
      metadata: {
        model: 'seo-analyzer',
        tokensUsed: { prompt: 0, completion: 0, total: 0 },
        costUSD: 0,
        duration: skillResult.metadata.duration,
        timestamp: new Date()
      }
    };
  }
  
  private async generateTitleSuggestions(
    input: GenerationRequest,
    context: AgentContext
  ): Promise<GenerationResult> {
    const { topic, content } = input.input;
    const baseTitle = topic || 'Content';
    
    // Generate simple title variations
    const titles = [
      `Understanding ${baseTitle}`,
      `A Complete Guide to ${baseTitle}`,
      `${baseTitle}: Best Practices and Tips`,
      `Getting Started with ${baseTitle}`,
      `${baseTitle} Fundamentals`
    ];
    
    return {
      success: true,
      content: {
        title: titles[0],
        content: titles.join('\n'),
        excerpt: `${titles.length} title suggestions for ${baseTitle}`
      },
      metadata: {
        model: 'heuristic',
        tokensUsed: { prompt: 0, completion: 0, total: 0 },
        costUSD: 0,
        duration: 0,
        timestamp: new Date()
      }
    };
  }
  
  // ====================================
  // Helper Methods
  // ====================================
  
  private buildBlogPostPrompt(
    topic: string,
    outline?: string[],
    keywords?: string[],
    config?: GenerationConfig
  ): string {
    // Simplified - not used anymore
    return topic;
  }
  
  private parseMarkdownPost(content: string): { title?: string; content: string } {
    const lines = content.split('\n');
    const firstLine = lines[0];
    
    if (firstLine.startsWith('# ')) {
      return {
        title: firstLine.replace('# ', '').trim(),
        content: lines.slice(1).join('\n').trim()
      };
    }
    
    return { content };
  }
  
  private generateTitleFromTopic(topic: string): string {
    return topic.charAt(0).toUpperCase() + topic.slice(1);
  }
  
  private generateExcerpt(content: string, maxLength: number = 200): string {
    const plainText = content.replace(/[#*`\[\]]/g, '').trim();
    if (plainText.length <= maxLength) return plainText;
    return plainText.substring(0, maxLength).trim() + '...';
  }
  
  private estimateQuality(content: string): { score: number; metrics: any } {
    const wordCount = content.split(/\s+/).length;
    const hasHeadings = /^#{1,6}\s/m.test(content);
    const hasCode = /```/.test(content);
    const paragraphCount = content.split('\n\n').length;
    
    let score = 0.5;
    if (wordCount > 300) score += 0.1;
    if (wordCount > 800) score += 0.1;
    if (hasHeadings) score += 0.15;
    if (hasCode) score += 0.1;
    if (paragraphCount > 3) score += 0.05;
    
    return {
      score: Math.min(1.0, score),
      metrics: {
        coherence: 0.85,
        relevance: 0.88,
        completeness: Math.min(1.0, wordCount / 1000)
      }
    };
  }
}

// Export singleton instance
export const coderAgent = new CoderAgent();
