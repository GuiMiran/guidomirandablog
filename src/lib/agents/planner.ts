/**
 * AGENT-001: Planner Agent
 * 
 * Analyzes user requests and creates optimal execution plans
 * Following specification: docs/specs/agent_specs/planner_agent.md
 */

import { BaseAgent, AgentContext, AgentValidationError } from './base';
import type { AgentId } from '../protocols';

// ============================================================================
// Types
// ============================================================================

export type SkillId =
  | 'generate_content'
  | 'summarize_content'
  | 'moderate_content'
  | 'analyze_seo'
  | 'recommend_content'
  | 'chat_interaction';

export interface PlanningRequest {
  userIntent: string;
  userContext?: {
    userId?: string;
    sessionId?: string;
    preferences?: Record<string, unknown>;
  };
  systemContext: {
    availableSkills: SkillId[];
    systemLoad?: number;
    rateLimits?: Record<string, RateLimitStatus>;
  };
  constraints?: {
    maxSteps?: number;
    timeout?: number;
    budget?: number;
    priority?: 'low' | 'medium' | 'high';
  };
}

export interface RateLimitStatus {
  remaining: number;
  limit: number;
  resetAt?: Date;
}

export interface ExecutionPlan {
  id: string;
  description: string;
  steps: ExecutionStep[];
  estimatedDuration: number;
  estimatedCost: number;
  metadata: PlanMetadata;
}

export interface ExecutionStep {
  id: string;
  order: number;
  skillId: SkillId;
  params: Record<string, unknown>;
  dependencies?: string[];
  condition?: StepCondition;
  retry?: RetryConfig;
}

export interface StepCondition {
  type: 'success' | 'failure' | 'always' | 'custom';
  evaluate?: (context: unknown) => boolean;
}

export interface RetryConfig {
  maxAttempts: number;
  backoffMs: number[];
}

export interface PlanMetadata {
  createdBy: AgentId;
  createdAt: Date;
  confidence: number;
  alternatives?: ExecutionPlan[];
}

// ============================================================================
// Planner Agent Implementation
// ============================================================================

export class PlannerAgent extends BaseAgent<PlanningRequest, ExecutionPlan> {
  readonly id: AgentId = 'planner';
  readonly name = 'Planner Agent';
  readonly description = 'Analyzes requests and creates execution plans';
  readonly capabilities = [
    'intent-analysis',
    'skill-selection',
    'plan-optimization',
    'dependency-resolution'
  ];
  
  protected async validateInput(input: PlanningRequest): Promise<void> {
    if (!input.userIntent || input.userIntent.trim().length === 0) {
      throw new AgentValidationError(
        'INVALID_INTENT',
        'User intent must not be empty'
      );
    }
    
    if (!input.systemContext || !input.systemContext.availableSkills) {
      throw new AgentValidationError(
        'MISSING_CONTEXT',
        'System context with available skills is required'
      );
    }
    
    if (input.systemContext.availableSkills.length === 0) {
      throw new AgentValidationError(
        'NO_SKILLS',
        'No skills available for planning'
      );
    }
  }
  
  protected async validateOutput(output: ExecutionPlan): Promise<void> {
    if (!output.steps || output.steps.length === 0) {
      throw new AgentValidationError(
        'EMPTY_PLAN',
        'Execution plan must contain at least one step'
      );
    }
    
    // Validate step dependencies
    const stepIds = new Set(output.steps.map(s => s.id));
    for (const step of output.steps) {
      if (step.dependencies) {
        for (const depId of step.dependencies) {
          if (!stepIds.has(depId)) {
            throw new AgentValidationError(
              'INVALID_DEPENDENCY',
              `Step ${step.id} depends on non-existent step ${depId}`
            );
          }
        }
      }
    }
    
    // Validate confidence
    if (output.metadata.confidence < 0 || output.metadata.confidence > 1) {
      throw new AgentValidationError(
        'INVALID_CONFIDENCE',
        'Confidence must be between 0 and 1'
      );
    }
  }
  
  protected async execute(input: PlanningRequest, context: AgentContext): Promise<ExecutionPlan> {
    // Step 1: Analyze user intent
    const intent = this.analyzeIntent(input.userIntent);
    
    // Step 2: Select appropriate skills
    const selectedSkills = this.selectSkills(intent, input.systemContext.availableSkills);
    
    // Step 3: Create execution steps
    const steps = this.createSteps(selectedSkills, intent, input.userContext?.preferences);
    
    // Step 4: Optimize step order and add dependencies
    const optimizedSteps = this.optimizeSteps(steps);
    
    // Step 5: Calculate estimates
    const estimates = this.calculateEstimates(optimizedSteps);
    
    // Step 6: Build final plan
    const plan: ExecutionPlan = {
      id: `plan-${crypto.randomUUID()}`,
      description: this.generatePlanDescription(intent, optimizedSteps),
      steps: optimizedSteps,
      estimatedDuration: estimates.duration,
      estimatedCost: estimates.cost,
      metadata: {
        createdBy: this.id,
        createdAt: new Date(),
        confidence: this.calculateConfidence(intent, optimizedSteps)
      }
    };
    
    return plan;
  }
  
  // ====================================
  // Helper Methods
  // ====================================
  
  private analyzeIntent(userIntent: string): UserIntent {
    const intentLower = userIntent.toLowerCase();
    
    // Detect primary action
    let action: IntentAction = 'unknown';
    if (intentLower.includes('generate') || intentLower.includes('create') || intentLower.includes('write')) {
      action = 'generate';
    } else if (intentLower.includes('summarize') || intentLower.includes('summary')) {
      action = 'summarize';
    } else if (intentLower.includes('analyze') || intentLower.includes('check') || intentLower.includes('seo')) {
      action = 'analyze';
    } else if (intentLower.includes('moderate') || intentLower.includes('validate')) {
      action = 'moderate';
    } else if (intentLower.includes('recommend') || intentLower.includes('suggest')) {
      action = 'recommend';
    } else if (intentLower.includes('chat') || intentLower.includes('talk') || intentLower.includes('ask')) {
      action = 'chat';
    }
    
    // Extract topic
    const topicMatch = userIntent.match(/about (.+?)(?:\s+with|\s+using|\s+in|$)/i);
    const topic = topicMatch ? topicMatch[1].trim() : undefined;
    
    // Extract parameters
    const params: Record<string, string> = {};
    
    const toneMatch = userIntent.match(/(professional|casual|technical|friendly)/i);
    if (toneMatch) params.tone = toneMatch[1].toLowerCase();
    
    const lengthMatch = userIntent.match(/(short|medium|long)/i);
    if (lengthMatch) params.length = lengthMatch[1].toLowerCase();
    
    return { action, topic, params };
  }
  
  private selectSkills(intent: UserIntent, availableSkills: SkillId[]): SkillId[] {
    const selected: SkillId[] = [];
    
    // Map actions to skills
    switch (intent.action) {
      case 'generate':
        if (availableSkills.includes('generate_content')) {
          selected.push('generate_content');
          // Add SEO analysis if available
          if (availableSkills.includes('analyze_seo')) {
            selected.push('analyze_seo');
          }
          // Add moderation if available
          if (availableSkills.includes('moderate_content')) {
            selected.push('moderate_content');
          }
        }
        break;
      
      case 'summarize':
        if (availableSkills.includes('summarize_content')) {
          selected.push('summarize_content');
        }
        break;
      
      case 'analyze':
        if (availableSkills.includes('analyze_seo')) {
          selected.push('analyze_seo');
        }
        break;
      
      case 'moderate':
        if (availableSkills.includes('moderate_content')) {
          selected.push('moderate_content');
        }
        break;
      
      case 'recommend':
        if (availableSkills.includes('recommend_content')) {
          selected.push('recommend_content');
        }
        break;
      
      case 'chat':
        if (availableSkills.includes('chat_interaction')) {
          selected.push('chat_interaction');
        }
        break;
      
      default:
        // Default to chat if no specific action detected
        if (availableSkills.includes('chat_interaction')) {
          selected.push('chat_interaction');
        }
    }
    
    return selected;
  }
  
  private createSteps(
    skills: SkillId[],
    intent: UserIntent,
    preferences?: Record<string, unknown>
  ): ExecutionStep[] {
    const steps: ExecutionStep[] = [];
    
    skills.forEach((skillId, index) => {
      const step: ExecutionStep = {
        id: `step-${index + 1}`,
        order: index + 1,
        skillId,
        params: this.buildSkillParams(skillId, intent, preferences),
        retry: {
          maxAttempts: 3,
          backoffMs: [1000, 2000, 4000]
        }
      };
      
      steps.push(step);
    });
    
    return steps;
  }
  
  private buildSkillParams(
    skillId: SkillId,
    intent: UserIntent,
    preferences?: Record<string, unknown>
  ): Record<string, unknown> {
    const params: Record<string, unknown> = {};
    
    switch (skillId) {
      case 'generate_content':
        params.topic = intent.topic || 'General topic';
        params.tone = intent.params.tone || preferences?.tone || 'professional';
        params.length = intent.params.length || preferences?.length || 'medium';
        break;
      
      case 'summarize_content':
        params.length = intent.params.length || 'medium';
        params.style = 'paragraph';
        break;
      
      case 'analyze_seo':
        // SEO params will be populated from previous step's output
        params.checkReadability = true;
        params.checkImages = true;
        params.checkLinks = true;
        break;
      
      case 'moderate_content':
        params.strictness = 'medium';
        break;
      
      case 'recommend_content':
        params.maxRecommendations = 5;
        params.includeExplanations = true;
        break;
      
      case 'chat_interaction':
        params.message = intent.topic || '';
        params.personality = 'friendly';
        params.citeSources = true;
        break;
    }
    
    return params;
  }
  
  private optimizeSteps(steps: ExecutionStep[]): ExecutionStep[] {
    // Add dependencies for sequential execution
    const optimized = steps.map((step, index) => {
      if (index === 0) return step;
      
      // Steps after generate_content should depend on it
      if (steps[0].skillId === 'generate_content' && index > 0) {
        return {
          ...step,
          dependencies: ['step-1'],
          condition: { type: 'success' as const }
        };
      }
      
      // Default: depend on previous step
      return {
        ...step,
        dependencies: [`step-${index}`],
        condition: { type: 'success' as const }
      };
    });
    
    return optimized;
  }
  
  private calculateEstimates(steps: ExecutionStep[]): { duration: number; cost: number } {
    // Estimate duration and cost based on skills
    const estimates = {
      generate_content: { duration: 5000, cost: 500 },
      summarize_content: { duration: 2000, cost: 200 },
      moderate_content: { duration: 1500, cost: 100 },
      analyze_seo: { duration: 1000, cost: 0 },
      recommend_content: { duration: 500, cost: 0 },
      chat_interaction: { duration: 2000, cost: 300 }
    };
    
    let totalDuration = 0;
    let totalCost = 0;
    
    for (const step of steps) {
      const estimate = estimates[step.skillId];
      totalDuration += estimate.duration;
      totalCost += estimate.cost;
    }
    
    // Add 20% buffer for overhead
    return {
      duration: Math.round(totalDuration * 1.2),
      cost: Math.round(totalCost * 1.2)
    };
  }
  
  private generatePlanDescription(intent: UserIntent, steps: ExecutionStep[]): string {
    const skillNames = steps.map(s => s.skillId.replace(/_/g, ' ')).join(', ');
    return `${intent.action} ${intent.topic || 'content'} using: ${skillNames}`;
  }
  
  private calculateConfidence(intent: UserIntent, steps: ExecutionStep[]): number {
    // Base confidence
    let confidence = 0.7;
    
    // Higher confidence if we have a clear action
    if (intent.action !== 'unknown') confidence += 0.1;
    
    // Higher confidence if we have a topic
    if (intent.topic) confidence += 0.1;
    
    // Higher confidence if we have steps
    if (steps.length > 0) confidence += 0.1;
    
    return Math.min(1.0, confidence);
  }
}

// ============================================================================
// Helper Types
// ============================================================================

type IntentAction = 'generate' | 'summarize' | 'analyze' | 'moderate' | 'recommend' | 'chat' | 'unknown';

interface UserIntent {
  action: IntentAction;
  topic?: string;
  params: Record<string, string>;
}

// Export singleton instance
export const plannerAgent = new PlannerAgent();
