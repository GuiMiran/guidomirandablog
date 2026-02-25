/**
 * SKILL-006: Chat Interaction
 * 
 * Provide intelligent conversational responses
 * Following specification: docs/specs/skill_specs/chat_interaction_skill.md
 */

import { BaseSkill, ValidationError, countWords } from './base';
import { openai } from '../openai/client';

// ============================================================================
// Types
// ============================================================================

export interface ChatInteractionInput {
  message: string;
  conversationHistory?: ChatMessage[];
  userId?: string;
  context?: ChatContext;
  options?: ChatOptions;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface ChatContext {
  currentPage?: string;
  recentPosts?: string[];
  userIntent?: 'question' | 'chitchat' | 'help' | 'feedback';
}

export interface ChatOptions {
  maxResponseLength?: number;
  citeSources?: boolean;
  personality?: 'professional' | 'friendly' | 'concise';
}

export interface ChatInteractionOutput {
  response: string;
  intent: DetectedIntent;
  sources?: Source[];
  suggestions?: string[];
  metadata: ChatMetadata;
}

export interface DetectedIntent {
  type: 'question' | 'chitchat' | 'help' | 'feedback' | 'off-topic';
  confidence: number;
  topic?: string;
}

export interface Source {
  postId: string;
  title: string;
  slug: string;
  excerpt: string;
  relevanceScore: number;
}

export interface ChatMetadata {
  respondedAt: Date;
  model: string;
  tokensUsed: number;
  costUSD: number;
  durationMs: number;
  requiresHumanReview: boolean;
}

// ============================================================================
// Skill Implementation
// ============================================================================

export class ChatInteractionSkill extends BaseSkill<ChatInteractionInput, ChatInteractionOutput> {
  readonly id = 'chat_interaction';
  readonly name = 'Chat Interaction';
  readonly description = 'Provide intelligent conversational responses';
  
  // ====================================
  // Preconditions
  // ====================================
  
  protected async checkPreconditions(input: ChatInteractionInput): Promise<ValidationError[]> {
    const errors: ValidationError[] = [];
    
    // PRE-CHAT-001: Mensaje No Vacío
    if (input.message.trim().length === 0) {
      errors.push({
        code: 'PRE-CHAT-001',
        message: 'Chat message must not be empty',
        field: 'message'
      });
    }
    
    // PRE-CHAT-002: Historial Válido
    if (input.conversationHistory && input.conversationHistory.length > 0) {
      for (let i = 0; i < input.conversationHistory.length - 1; i++) {
        if (input.conversationHistory[i].role === input.conversationHistory[i + 1].role) {
          errors.push({
            code: 'PRE-CHAT-002',
            message: 'Conversation history must alternate between user and assistant',
            field: 'conversationHistory'
          });
          break;
        }
      }
    }
    
    return errors;
  }
  
  // ====================================
  // Postconditions
  // ====================================
  
  protected async checkPostconditions(output: ChatInteractionOutput, input: ChatInteractionInput): Promise<ValidationError[]> {
    const errors: ValidationError[] = [];
    
    // POST-CHAT-001: Respuesta Completa
    if (output.response.trim().length < 20) {
      errors.push({
        code: 'POST-CHAT-001',
        message: 'Response must be at least 20 characters'
      });
    }
    
    // POST-CHAT-002: Sources Si Citado
    const mentionsSources = /artículo|post|puedes leer|más información|mi artículo/i.test(output.response);
    if (mentionsSources && (!output.sources || output.sources.length === 0)) {
      errors.push({
        code: 'POST-CHAT-002',
        message: 'If response cites sources, sources array must be populated'
      });
    }
    
    return errors;
  }
  
  // ====================================
  // Invariants
  // ====================================
  
  protected async checkInvariants(output: ChatInteractionOutput, input: ChatInteractionInput): Promise<ValidationError[]> {
    const errors: ValidationError[] = [];
    
    // INV-CHAT-001: Respuesta Limitada
    const maxWords = input.options?.maxResponseLength ?? 500;
    const wordCount = countWords(output.response);
    
    if (wordCount > maxWords * 1.1) {
      errors.push({
        code: 'INV-CHAT-001',
        message: `Response exceeds maximum length (${wordCount} > ${maxWords * 1.1})`
      });
    }
    
    // INV-CHAT-002: Intent Confianza Alta
    if (output.intent.confidence < 0.6) {
      errors.push({
        code: 'INV-CHAT-002',
        message: `Intent confidence too low (${output.intent.confidence.toFixed(2)})`
      });
    }
    
    return errors;
  }
  
  // ====================================
  // Implementation
  // ====================================
  
  protected async executeImpl(input: ChatInteractionInput, context: any): Promise<ChatInteractionOutput> {
    const startTime = Date.now();
    
    const options = input.options || {};
    const maxResponseLength = options.maxResponseLength || 500;
    const citeSources = options.citeSources ?? true;
    const personality = options.personality || 'friendly';
    
    // Step 1: Detect intent
    const intent = this.detectIntent(input.message, input.context);
    
    // Step 2: Search for relevant sources if needed
    let sources: Source[] = [];
    if (citeSources && intent.type === 'question') {
      sources = await this.searchRelevantSources(input.message, intent.topic);
    }
    
    // Step 3: Build context for AI
    const systemPrompt = this.buildSystemPrompt(personality, citeSources);
    const userPrompt = this.buildUserPrompt(input, sources);
    
    // Step 4: Generate response
    const completionResponse = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        ...this.formatConversationHistory(input.conversationHistory || []),
        { role: 'user', content: userPrompt }
      ],
      temperature: personality === 'professional' ? 0.5 : 0.7,
      max_tokens: Math.ceil(maxResponseLength * 1.5),
      presence_penalty: 0.2,
      frequency_penalty: 0.2
    });
    
    const response = completionResponse.choices[0].message.content || '';
    
    // Step 5: Generate follow-up suggestions
    const suggestions = this.generateSuggestions(input.message, intent, sources);
    
    // Step 6: Determine if human review needed
    const requiresHumanReview = this.requiresHumanReview(intent, response);
    
    const durationMs = Date.now() - startTime;
    const costUSD = this.calculateCost(completionResponse.usage);
    
    return {
      response,
      intent,
      sources: sources.length > 0 ? sources : undefined,
      suggestions: suggestions.length > 0 ? suggestions : undefined,
      metadata: {
        respondedAt: new Date(),
        model: 'gpt-4o-mini',
        tokensUsed: completionResponse.usage?.total_tokens || 0,
        costUSD,
        durationMs,
        requiresHumanReview
      }
    };
  }
  
  // ====================================
  // Helper Methods
  // ====================================
  
  private detectIntent(message: string, context?: ChatContext): DetectedIntent {
    const messageLower = message.toLowerCase();
    
    // Question indicators
    const questionIndicators = [
      '¿', '?', 'qué', 'cómo', 'cuál', 'cuándo', 'dónde', 'por qué',
      'what', 'how', 'when', 'where', 'why', 'which', 'can you explain'
    ];
    
    // Chitchat indicators
    const chitchatIndicators = [
      'hola', 'hi', 'hello', 'gracias', 'thanks', 'adiós', 'bye',
      'buenos días', 'good morning', 'buenas tardes', 'buenas noches'
    ];
    
    // Help indicators
    const helpIndicators = [
      'ayuda', 'help', 'no entiendo', 'confused', 'no funciona', 'error'
    ];
    
    // Feedback indicators
    const feedbackIndicators = [
      'me gusta', 'excelente', 'malo', 'sugerencia', 'feedback',
      'mejorar', 'problema', 'like', 'love', 'hate'
    ];
    
    let type: DetectedIntent['type'] = 'off-topic';
    let confidence = 0.7;
    let topic: string | undefined;
    
    // Check for question
    if (questionIndicators.some(ind => messageLower.includes(ind))) {
      type = 'question';
      confidence = 0.85;
      
      // Extract topic (simplified)
      const techKeywords = [
        'react', 'typescript', 'javascript', 'graphql', 'next.js', 'css',
        'api', 'frontend', 'backend', 'database', 'node', 'python'
      ];
      
      for (const keyword of techKeywords) {
        if (messageLower.includes(keyword)) {
          topic = keyword;
          confidence = 0.9;
          break;
        }
      }
    }
    // Check for chitchat
    else if (chitchatIndicators.some(ind => messageLower.includes(ind))) {
      type = 'chitchat';
      confidence = 0.9;
    }
    // Check for help
    else if (helpIndicators.some(ind => messageLower.includes(ind))) {
      type = 'help';
      confidence = 0.85;
    }
    // Check for feedback
    else if (feedbackIndicators.some(ind => messageLower.includes(ind))) {
      type = 'feedback';
      confidence = 0.8;
    }
    
    // Use context hint if available
    if (context?.userIntent && confidence < 0.9) {
      type = context.userIntent;
      confidence = Math.max(confidence, 0.75);
    }
    
    return { type, confidence, topic };
  }
  
  private async searchRelevantSources(query: string, topic?: string): Promise<Source[]> {
    // In production, this would search actual blog post database
    // For now, return mock relevant sources
    
    const mockSources: Source[] = [
      {
        postId: 'post-graphql-vs-rest',
        title: 'GraphQL vs REST: ¿Cuál elegir en 2026?',
        slug: 'graphql-vs-rest-cual-elegir-2026',
        excerpt: 'Analizamos las diferencias clave entre GraphQL y REST para ayudarte a elegir la mejor opción.',
        relevanceScore: 0.92
      },
      {
        postId: 'post-typescript-intro',
        title: 'Introducción a TypeScript',
        slug: 'typescript-intro',
        excerpt: 'Aprende los fundamentos de TypeScript y cómo puede mejorar tu código JavaScript.',
        relevanceScore: 0.85
      },
      {
        postId: 'post-react-hooks',
        title: 'React Hooks Explicados',
        slug: 'react-hooks-explicados',
        excerpt: 'Guía completa sobre React Hooks: useState, useEffect, y más.',
        relevanceScore: 0.78
      }
    ];
    
    const queryLower = query.toLowerCase();
    
    // Filter by topic if available
    if (topic) {
      return mockSources.filter(source =>
        source.title.toLowerCase().includes(topic.toLowerCase()) ||
        source.excerpt.toLowerCase().includes(topic.toLowerCase())
      ).slice(0, 2);
    }
    
    // Otherwise return top matching by keyword overlap
    const scoredSources = mockSources.map(source => {
      const titleMatch = queryLower.split(' ').some(word =>
        word.length > 3 && source.title.toLowerCase().includes(word)
      );
      
      return {
        ...source,
        matchScore: titleMatch ? source.relevanceScore : source.relevanceScore * 0.5
      };
    });
    
    return scoredSources
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, 2)
      .map(({ matchScore, ...source }) => source);
  }
  
  private buildSystemPrompt(personality: string, citeSources: boolean): string {
    const personalityMap = {
      professional: 'Eres un asistente técnico profesional y preciso.',
      friendly: 'Eres un asistente amigable y conversacional que ayuda con entusiasmo.',
      concise: 'Eres un asistente directo y conciso que proporciona respuestas breves.'
    };
    
    let prompt = personalityMap[personality as keyof typeof personalityMap] || personalityMap.friendly;
    
    prompt += ' Ayudas a usuarios respondiendo preguntas sobre desarrollo web, tecnología, y programación.';
    
    if (citeSources) {
      prompt += ' Cuando sea relevante, menciona artículos del blog que puedan ayudar al usuario.';
    }
    
    prompt += ' Responde en el mismo idioma que el usuario utiliza.';
    prompt += ' Sé claro, útil y amigable en tus respuestas.';
    
    return prompt;
  }
  
  private buildUserPrompt(input: ChatInteractionInput, sources: Source[]): string {
    let prompt = input.message;
    
    if (sources.length > 0) {
      prompt += '\n\nArtículos relevantes del blog:\n';
      sources.forEach((source, index) => {
        prompt += `${index + 1}. "${source.title}" - ${source.excerpt}\n`;
      });
      prompt += '\nPuedes mencionar estos artículos si son relevantes para la pregunta.';
    }
    
    if (input.context?.currentPage) {
      prompt += `\n\nContexto: El usuario está viendo la página: ${input.context.currentPage}`;
    }
    
    return prompt;
  }
  
  private formatConversationHistory(history: ChatMessage[]): Array<{ role: 'user' | 'assistant'; content: string }> {
    // Limit history to last 6 messages to avoid token overflow
    const recentHistory = history.slice(-6);
    
    return recentHistory.map(msg => ({
      role: msg.role,
      content: msg.content
    }));
  }
  
  private generateSuggestions(userMessage: string, intent: DetectedIntent, sources: Source[]): string[] {
    const suggestions: string[] = [];
    
    if (intent.type === 'chitchat') {
      suggestions.push('¿En qué puedo ayudarte hoy?');
      suggestions.push('¿Tienes alguna pregunta técnica?');
    } else if (intent.type === 'question') {
      if (intent.topic) {
        const topicCapitalized = intent.topic.charAt(0).toUpperCase() + intent.topic.slice(1);
        suggestions.push(`¿Cómo empiezo con ${topicCapitalized}?`);
        suggestions.push(`¿Cuáles son las mejores prácticas de ${topicCapitalized}?`);
      }
      
      if (sources.length > 0) {
        suggestions.push(`¿Puedes explicar más sobre ${sources[0].title.split(':')[0]}?`);
      }
    } else if (intent.type === 'help') {
      suggestions.push('¿Qué tipo de contenido buscas?');
      suggestions.push('¿Puedes describir tu problema con más detalle?');
    }
    
    return suggestions.slice(0, 3); // Return max 3 suggestions
  }
  
  private requiresHumanReview(intent: DetectedIntent, response: string): boolean {
    // Require human review for:
    // 1. Low confidence intents
    if (intent.confidence < 0.7) return true;
    
    // 2. Feedback messages
    if (intent.type === 'feedback') return true;
    
    // 3. Very short responses (might indicate confusion)
    if (response.length < 50) return true;
    
    // 4. Off-topic messages
    if (intent.type === 'off-topic') return true;
    
    return false;
  }
  
  private calculateCost(usage: any): number {
    if (!usage) return 0;
    
    const promptTokens = usage.prompt_tokens || 0;
    const completionTokens = usage.completion_tokens || 0;
    
    // gpt-4o-mini pricing (as of 2024)
    const promptCostPer1M = 0.150;
    const completionCostPer1M = 0.600;
    
    return (
      (promptTokens / 1000000) * promptCostPer1M +
      (completionTokens / 1000000) * completionCostPer1M
    );
  }
}

// Export singleton instance
export const chatInteractionSkill = new ChatInteractionSkill();
