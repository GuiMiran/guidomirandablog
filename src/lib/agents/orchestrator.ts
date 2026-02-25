/**
 * Multi-Agent Orchestrator
 * 
 * Coordinates multiple agents to handle complex workflows
 * Implements high-level business logic using agent collaboration
 */

import { plannerAgent, type PlanningRequest, type ExecutionPlan } from './planner';
import { executorAgent, type ExecutionRequest, type ExecutionResult } from './executor';
import { coderAgent, type GenerationRequest, type GenerationResult } from './coder';
import { reviewerAgent, type ReviewRequest, type ReviewResult } from './reviewer';
import { createAgentMessage, createSystemEvent } from '../protocols';
import type { AgentMessage, SystemEvent } from '../protocols';

// ============================================================================
// Types
// ============================================================================

export interface OrchestratorRequest {
  intent: string;
  type: WorkflowType;
  params?: Record<string, unknown>;
  context?: OrchestratorContext;
}

export type WorkflowType =
  | 'generate_blog_post'
  | 'summarize_content'
  | 'chat_response'
  | 'analyze_content'
  | 'custom';

export interface OrchestratorContext {
  traceId: string;
  userId?: string;
  sessionId?: string;
}

export interface OrchestratorResult {
  success: boolean;
  result?: any;
  plan?: ExecutionPlan;
  execution?: ExecutionResult;
  review?: ReviewResult;
  events: SystemEvent[];
  errors: Array<{ stage: string; error: string }>;
  metadata: {
    duration: number;
    agentsInvolved: string[];
    timestamp: Date;
  };
}

// ============================================================================
// Orchestrator Implementation
// ============================================================================

export class MultiAgentOrchestrator {
  private events: SystemEvent[] = [];
  private errors: Array<{ stage: string; error: string }> = [];
  
  /**
   * Main orchestration method - handles complete workflow
   */
  async orchestrate(request: OrchestratorRequest): Promise<OrchestratorResult> {
    const startTime = Date.now();
    this.events = [];
    this.errors = [];
    
    const context = request.context || {
      traceId: this.generateTraceId(),
      userId: 'anonymous',
      sessionId: this.generateSessionId()
    };
    
    try {
      this.emitEvent('orchestrator.started', { intent: request.intent, type: request.type });
      
      let result: any;
      
      switch (request.type) {
        case 'generate_blog_post':
          result = await this.generateBlogPostWorkflow(request, context);
          break;
        
        case 'summarize_content':
          result = await this.summarizeContentWorkflow(request, context);
          break;
        
        case 'chat_response':
          result = await this.chatResponseWorkflow(request, context);
          break;
        
        case 'analyze_content':
          result = await this.analyzeContentWorkflow(request, context);
          break;
        
        case 'custom':
          result = await this.customWorkflow(request, context);
          break;
        
        default:
          throw new Error(`Unknown workflow type: ${request.type}`);
      }
      
      this.emitEvent('orchestrator.completed', { success: true });
      
      return {
        success: true,
        result: result.output,
        plan: result.plan,
        execution: result.execution,
        review: result.review,
        events: this.events,
        errors: this.errors,
        metadata: {
          duration: Date.now() - startTime,
          agentsInvolved: result.agentsInvolved || [],
          timestamp: new Date()
        }
      };
      
    } catch (error: any) {
      this.emitEvent('orchestrator.failed', { error: error.message });
      this.errors.push({ stage: 'orchestration', error: error.message });
      
      return {
        success: false,
        events: this.events,
        errors: this.errors,
        metadata: {
          duration: Date.now() - startTime,
          agentsInvolved: [],
          timestamp: new Date()
        }
      };
    }
  }
  
  // ====================================
  // Workflow Implementations
  // ====================================
  
  /**
   * Generate blog post with full pipeline:
   * 1. Plan the generation
   * 2. Generate content
   * 3. Review quality/SEO/moderation
   * 4. Return approved content
   */
  private async generateBlogPostWorkflow(
    request: OrchestratorRequest,
    context: OrchestratorContext
  ) {
    const { topic, tone, length, keywords } = request.params || {};
    
    if (!topic) {
      throw new Error('Topic is required for blog post generation');
    }
    
    // Step 1: Generate content using Coder Agent
    this.emitEvent('workflow.step', { step: 'generate', agent: 'coder' });
    
    const generationResult = await coderAgent.process({
      type: 'blog_post',
      input: {
        topic: topic as string,
        keywords: keywords as string[] || [],
        outline: request.params?.outline as string[]
      },
      config: {
        tone: (tone as any) || 'professional',
        length: (length as any) || 'medium',
        temperature: 0.7
      }
    }, {
      traceId: context.traceId,
      userId: context.userId,
      sessionId: context.sessionId,
      timestamp: new Date()
    });
    
    if (!generationResult.success) {
      throw new Error('Content generation failed');
    }
    
    // Step 2: Review content using Reviewer Agent
    this.emitEvent('workflow.step', { step: 'review', agent: 'reviewer' });
    
    const reviewResult = await reviewerAgent.process({
      reviewType: 'complete',
      content: {
        title: generationResult.content.title,
        content: generationResult.content.content || '',
        excerpt: generationResult.content.excerpt,
        tags: generationResult.content.tags
      },
      config: {
        strictness: 'medium',
        requiredScore: 70
      }
    }, {
      traceId: context.traceId,
      userId: context.userId,
      sessionId: context.sessionId,
      timestamp: new Date()
    });
    
    return {
      output: {
        ...generationResult.content,
        review: {
          approved: reviewResult.approved,
          score: reviewResult.score,
          issues: reviewResult.issues,
          suggestions: reviewResult.suggestions
        }
      },
      review: reviewResult,
      agentsInvolved: ['coder', 'reviewer']
    };
  }
  
  /**
   * Summarize content workflow
   */
  private async summarizeContentWorkflow(
    request: OrchestratorRequest,
    context: OrchestratorContext
  ) {
    const { content, maxLength } = request.params || {};
    
    if (!content) {
      throw new Error('Content is required for summarization');
    }
    
    this.emitEvent('workflow.step', { step: 'summarize', agent: 'coder' });
    
    const result = await coderAgent.process({
      type: 'summary',
      input: {
        content: content as string,
        maxLength: (maxLength as number) || 200
      }
    }, {
      traceId: context.traceId,
      userId: context.userId,
      sessionId: context.sessionId,
      timestamp: new Date()
    });
    
    return {
      output: result.content,
      agentsInvolved: ['coder']
    };
  }
  
  /**
   * Chat response workflow
   */
  private async chatResponseWorkflow(
    request: OrchestratorRequest,
    context: OrchestratorContext
  ) {
    const { messages, question } = request.params || {};
    
    if (!messages && !question) {
      throw new Error('Messages or question required for chat response');
    }
    
    this.emitEvent('workflow.step', { step: 'chat', agent: 'coder' });
    
    const result = await coderAgent.process({
      type: 'chat_response',
      input: {
        messages: messages as any[],
        question: question as string
      }
    }, {
      traceId: context.traceId,
      userId: context.userId,
      sessionId: context.sessionId,
      timestamp: new Date()
    });
    
    return {
      output: result.content,
      agentsInvolved: ['coder']
    };
  }
  
  /**
   * Analyze content workflow (review only)
   */
  private async analyzeContentWorkflow(
    request: OrchestratorRequest,
    context: OrchestratorContext
  ) {
    const { content, reviewType } = request.params || {};
    
    if (!content) {
      throw new Error('Content is required for analysis');
    }
    
    this.emitEvent('workflow.step', { step: 'analyze', agent: 'reviewer' });
    
    const result = await reviewerAgent.process({
      reviewType: (reviewType as any) || 'complete',
      content: {
        content: content as string
      }
    }, {
      traceId: context.traceId,
      userId: context.userId,
      sessionId: context.sessionId,
      timestamp: new Date()
    });
    
    return {
      output: result,
      agentsInvolved: ['reviewer']
    };
  }
  
  /**
   * Custom workflow using Planner + Executor
   * This demonstrates the full multi-agent pipeline
   */
  private async customWorkflow(
    request: OrchestratorRequest,
    context: OrchestratorContext
  ) {
    // Step 1: Create execution plan using Planner Agent
    this.emitEvent('workflow.step', { step: 'plan', agent: 'planner' });
    
    const planningRequest: PlanningRequest = {
      userIntent: request.intent,
      userContext: {
        userId: context.userId,
        preferences: {}
      },
      systemContext: {
        availableSkills: [
          'generate_content',
          'summarize_content',
          'moderate_content',
          'analyze_seo',
          'recommend_content',
          'chat_interaction'
        ],
        systemLoad: 0.5,
        rateLimits: {}
      },
      constraints: {
        maxSteps: 10,
        timeout: 120000,
        budget: 1.0
      }
    };
    
    const plan = await plannerAgent.process(planningRequest, {
      traceId: context.traceId,
      userId: context.userId,
      sessionId: context.sessionId,
      timestamp: new Date()
    });
    
    // Step 2: Execute plan using Executor Agent
    this.emitEvent('workflow.step', { step: 'execute', agent: 'executor' });
    
    const executionRequest: ExecutionRequest = {
      plan,
      context: request.params
    };
    
    const execution = await executorAgent.process(executionRequest, {
      traceId: context.traceId,
      userId: context.userId,
      sessionId: context.sessionId,
      timestamp: new Date()
    });
    
    return {
      output: {
        plan,
        execution
      },
      plan,
      execution,
      agentsInvolved: ['planner', 'executor']
    };
  }
  
  // ====================================
  // Utilities
  // ====================================
  
  private emitEvent(type: string, data: Record<string, unknown>): void {
    const traceId = this.generateTraceId();
    const success = type.includes('completed');
    const event = createSystemEvent(
      type as any,
      success,
      traceId,
      {
        agentId: 'orchestrator' as any,
        data
      }
    );
    this.events.push(event);
  }
  
  private generateTraceId(): string {
    return `trace-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
  
  private generateSessionId(): string {
    return `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
  
  /**
   * Get all events from last orchestration
   */
  getEvents(): SystemEvent[] {
    return [...this.events];
  }
  
  /**
   * Get all errors from last orchestration
   */
  getErrors(): Array<{ stage: string; error: string }> {
    return [...this.errors];
  }
}

// Export singleton instance
export const orchestrator = new MultiAgentOrchestrator();
