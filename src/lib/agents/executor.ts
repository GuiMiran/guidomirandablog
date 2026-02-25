/**
 * AGENT-004: Executor Agent
 * 
 * Executes plans by coordinating skill invocations
 * Following specification: docs/specs/agent_specs/executor_agent.md
 */

import { BaseAgent, AgentContext, AgentValidationError } from './base';
import type { AgentId } from '../protocols';
import type { ExecutionPlan, ExecutionStep, SkillId } from './planner';
import * as skills from '../skills';

// ============================================================================
// Types
// ============================================================================

export interface ExecutionRequest {
  plan: ExecutionPlan;
  context?: Record<string, unknown>;
}

export interface ExecutionResult {
  planId: string;
  status: 'completed' | 'partial' | 'failed';
  steps: StepResult[];
  summary: ExecutionSummary;
  metadata: ExecutionMetadata;
}

export interface StepResult {
  stepId: string;
  skillId: SkillId;
  status: 'completed' | 'failed' | 'skipped';
  output?: unknown;
  error?: StepError;
  duration: number;
  retries: number;
}

export interface StepError {
  code: string;
  message: string;
  recoverable: boolean;
  details?: Record<string, unknown>;
}

export interface ExecutionSummary {
  totalSteps: number;
  completedSteps: number;
  failedSteps: number;
  skippedSteps: number;
  totalDuration: number;
  totalCost: number;
}

export interface ExecutionMetadata {
  executedBy: AgentId;
  startedAt: Date;
  completedAt: Date;
  traceId: string;
}

// ============================================================================
// Executor Agent Implementation
// ============================================================================

export class ExecutorAgent extends BaseAgent<ExecutionRequest, ExecutionResult> {
  readonly id: AgentId = 'executor';
  readonly name = 'Executor Agent';
  readonly description = 'Executes plans by coordinating skill invocations';
  readonly capabilities = [
    'skill-invocation',
    'error-recovery',
    'result-aggregation',
    'parallel-execution'
  ];
  
  private stepResults: Map<string, StepResult> = new Map();
  
  protected async validateInput(input: ExecutionRequest): Promise<void> {
    if (!input.plan) {
      throw new AgentValidationError(
        'MISSING_PLAN',
        'Execution request must include a plan'
      );
    }
    
    if (!input.plan.steps || input.plan.steps.length === 0) {
      throw new AgentValidationError(
        'EMPTY_PLAN',
        'Plan must contain at least one step'
      );
    }
  }
  
  protected async validateOutput(output: ExecutionResult): Promise<void> {
    if (output.steps.length !== output.summary.totalSteps) {
      throw new AgentValidationError(
        'STEP_COUNT_MISMATCH',
        'Step results count must match total steps'
      );
    }
  }
  
  protected async execute(input: ExecutionRequest, context: AgentContext): Promise<ExecutionResult> {
    const startTime = Date.now();
    this.stepResults.clear();
    
    const { plan } = input;
    const stepResults: StepResult[] = [];
    
    // Execute steps in order, respecting dependencies
    for (const step of plan.steps) {
      const stepStartTime = Date.now();
      
      try {
        // Check if dependencies are met
        if (step.dependencies && !this.dependenciesMet(step.dependencies)) {
          stepResults.push({
            stepId: step.id,
            skillId: step.skillId,
            status: 'skipped',
            duration: Date.now() - stepStartTime,
            retries: 0
          });
          continue;
        }
        
        // Check condition if present
        if (step.condition && !this.evaluateCondition(step.condition)) {
          stepResults.push({
            stepId: step.id,
            skillId: step.skillId,
            status: 'skipped',
            duration: Date.now() - stepStartTime,
            retries: 0
          });
          continue;
        }
        
        // Execute step with retry
        const result = await this.executeStepWithRetry(step, context);
        stepResults.push(result);
        this.stepResults.set(step.id, result);
        
      } catch (error: any) {
        stepResults.push({
          stepId: step.id,
          skillId: step.skillId,
          status: 'failed',
          error: {
            code: error.code || 'UNKNOWN_ERROR',
            message: error.message,
            recoverable: false
          },
          duration: Date.now() - stepStartTime,
          retries: step.retry?.maxAttempts || 0
        });
      }
    }
    
    const totalDuration = Date.now() - startTime;
    const summary = this.buildSummary(stepResults, totalDuration);
    
    return {
      planId: plan.id,
      status: this.determineStatus(stepResults),
      steps: stepResults,
      summary,
      metadata: {
        executedBy: this.id,
        startedAt: new Date(startTime),
        completedAt: new Date(),
        traceId: context.traceId
      }
    };
  }
  
  // ====================================
  // Step Execution
  // ====================================
  
  private async executeStepWithRetry(
    step: ExecutionStep,
    context: AgentContext
  ): Promise<StepResult> {
    const startTime = Date.now();
    let retries = 0;
    let lastError: Error | undefined;
    
    const maxAttempts = step.retry?.maxAttempts || 1;
    const backoffMs = step.retry?.backoffMs || [0];
    
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        // Execute the skill
        const output = await this.invokeSkill(step, context);
        
        return {
          stepId: step.id,
          skillId: step.skillId,
          status: 'completed',
          output,
          duration: Date.now() - startTime,
          retries
        };
      } catch (error: any) {
        lastError = error;
        retries++;
        
        // Wait before retry
        if (attempt < maxAttempts - 1) {
          const delayMs = backoffMs[attempt] || backoffMs[backoffMs.length - 1];
          await this.delay(delayMs);
        }
      }
    }
    
    // All retries exhausted
    return {
      stepId: step.id,
      skillId: step.skillId,
      status: 'failed',
      error: {
        code: lastError?.name || 'EXECUTION_FAILED',
        message: lastError?.message || 'Unknown error',
        recoverable: retries < maxAttempts
      },
      duration: Date.now() - startTime,
      retries
    };
  }
  
  private async invokeSkill(step: ExecutionStep, context: AgentContext): Promise<unknown> {
    // Resolve parameters (may reference previous step outputs)
    const resolvedParams = this.resolveParams(step.params);
    
    // Get skill instance
    const skill = this.getSkill(step.skillId);
    
    // Build execution context
    const executionContext = {
      traceId: context.traceId,
      userId: context.userId,
      sessionId: context.sessionId,
      environment: 'production' as const,
      timestamp: new Date()
    };
    
    // Execute skill
    return await skill.execute(resolvedParams, executionContext);
  }
  
  private getSkill(skillId: SkillId): any {
    switch (skillId) {
      case 'generate_content':
        return skills.generateContentSkill;
      case 'summarize_content':
        return skills.summarizeContentSkill;
      case 'moderate_content':
        return skills.moderateContentSkill;
      case 'analyze_seo':
        return skills.analyzeSEOSkill;
      case 'recommend_content':
        return skills.recommendContentSkill;
      case 'chat_interaction':
        return skills.chatInteractionSkill;
      default:
        throw new Error(`Unknown skill: ${skillId}`);
    }
  }
  
  // ====================================
  // Parameter Resolution
  // ====================================
  
  private resolveParams(params: Record<string, unknown>): Record<string, unknown> {
    const resolved: Record<string, unknown> = {};
    
    for (const [key, value] of Object.entries(params)) {
      if (typeof value === 'string' && value.startsWith('step-')) {
        // Reference to previous step output
        resolved[key] = this.resolveStepReference(value);
      } else {
        resolved[key] = value;
      }
    }
    
    return resolved;
  }
  
  private resolveStepReference(reference: string): unknown {
    // Format: step-1.result.content or step-1.output
    const parts = reference.split('.');
    const stepId = parts[0];
    
    const stepResult = this.stepResults.get(stepId);
    if (!stepResult || stepResult.status !== 'completed') {
      throw new Error(`Cannot resolve reference to ${reference}`);
    }
    
    let value: any = stepResult.output;
    
    // Navigate nested properties
    for (let i = 1; i < parts.length; i++) {
      if (value && typeof value === 'object' && parts[i] in value) {
        value = value[parts[i]];
      } else {
        throw new Error(`Property ${parts[i]} not found in ${reference}`);
      }
    }
    
    return value;
  }
  
  // ====================================
  // Dependencies & Conditions
  // ====================================
  
  private dependenciesMet(dependencies: string[]): boolean {
    return dependencies.every(depId => {
      const result = this.stepResults.get(depId);
      return result && result.status === 'completed';
    });
  }
  
  private evaluateCondition(condition: ExecutionStep['condition']): boolean {
    if (!condition) return true;
    
    switch (condition.type) {
      case 'always':
        return true;
      
      case 'success':
        // Check if all previous steps succeeded
        return Array.from(this.stepResults.values()).every(r => r.status === 'completed');
      
      case 'failure':
        // Check if any previous step failed
        return Array.from(this.stepResults.values()).some(r => r.status === 'failed');
      
      case 'custom':
        if (condition.evaluate) {
          return condition.evaluate(this.stepResults);
        }
        return true;
      
      default:
        return true;
    }
  }
  
  // ====================================
  // Result Aggregation
  // ====================================
  
  private buildSummary(stepResults: StepResult[], totalDuration: number): ExecutionSummary {
    const completed = stepResults.filter(r => r.status === 'completed').length;
    const failed = stepResults.filter(r => r.status === 'failed').length;
    const skipped = stepResults.filter(r => r.status === 'skipped').length;
    
    // Estimate total cost (simplified)
    const totalCost = stepResults
      .filter(r => r.status === 'completed' && r.output)
      .reduce((sum, r: any) => {
        return sum + (r.output?.usage?.costUSD || 0);
      }, 0);
    
    return {
      totalSteps: stepResults.length,
      completedSteps: completed,
      failedSteps: failed,
      skippedSteps: skipped,
      totalDuration,
      totalCost
    };
  }
  
  private determineStatus(stepResults: StepResult[]): 'completed' | 'partial' | 'failed' {
    const completed = stepResults.filter(r => r.status === 'completed').length;
    const failed = stepResults.filter(r => r.status === 'failed').length;
    
    if (failed === 0) return 'completed';
    if (completed === 0) return 'failed';
    return 'partial';
  }
  
  // ====================================
  // Utilities
  // ====================================
  
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Export singleton instance
export const executorAgent = new ExecutorAgent();
