/**
 * Base Agent Infrastructure
 * 
 * Provides foundational classes and interfaces for all agents
 */

import type { AgentMessage, AgentId, SystemEvent, ErrorNotification } from '../protocols';

// ============================================================================
// Agent Interface
// ============================================================================

export interface Agent<TInput = unknown, TOutput = unknown> {
  readonly id: AgentId;
  readonly name: string;
  readonly description: string;
  readonly capabilities: string[];
  
  process(input: TInput, context: AgentContext): Promise<TOutput>;
  handleMessage(message: AgentMessage): Promise<AgentMessage | void>;
}

// ============================================================================
// Agent Context
// ============================================================================

export interface AgentContext {
  traceId: string;
  sessionId?: string;
  userId?: string;
  timestamp: Date;
  messageHistory?: AgentMessage[];
  systemState?: Record<string, unknown>;
}

// ============================================================================
// Base Agent Class
// ============================================================================

export abstract class BaseAgent<TInput = unknown, TOutput = unknown> implements Agent<TInput, TOutput> {
  abstract readonly id: AgentId;
  abstract readonly name: string;
  abstract readonly description: string;
  abstract readonly capabilities: string[];
  
  protected events: SystemEvent[] = [];
  protected errors: ErrorNotification[] = [];
  
  /**
   * Main processing method - implements agent-specific logic
   */
  async process(input: TInput, context: AgentContext): Promise<TOutput> {
    const startTime = Date.now();
    
    try {
      // Emit start event
      this.emitEvent('agent.started', context, { input });
      
      // Validate input
      await this.validateInput(input);
      
      // Execute agent logic
      const result = await this.execute(input, context);
      
      // Validate output
      await this.validateOutput(result);
      
      // Emit success event
      const duration = Date.now() - startTime;
      this.emitEvent('agent.completed', context, { output: result, duration });
      
      return result;
    } catch (error: any) {
      const duration = Date.now() - startTime;
      this.emitEvent('agent.failed', context, { error: error.message, duration });
      this.handleError(error, context);
      throw error;
    }
  }
  
  /**
   * Handle inter-agent messages
   */
  async handleMessage(message: AgentMessage): Promise<AgentMessage | void> {
    // Default implementation - can be overridden
    console.log(`Agent ${this.id} received message:`, message);
    
    if (message.metadata.requiresAck) {
      return {
        id: crypto.randomUUID(),
        correlationId: message.id,
        from: this.id,
        to: message.from,
        type: 'ack',
        payload: { received: true },
        metadata: {
          timestamp: new Date(),
          priority: message.metadata.priority
        }
      };
    }
  }
  
  /**
   * Abstract methods to be implemented by concrete agents
   */
  protected abstract execute(input: TInput, context: AgentContext): Promise<TOutput>;
  protected abstract validateInput(input: TInput): Promise<void>;
  protected abstract validateOutput(output: TOutput): Promise<void>;
  
  /**
   * Event emission
   */
  protected emitEvent(
    type: SystemEvent['type'],
    context: AgentContext,
    data?: Record<string, unknown>
  ): void {
    const event: SystemEvent = {
      id: crypto.randomUUID(),
      type,
      agentId: this.id,
      timestamp: new Date(),
      success: !type.includes('failed'),
      data,
      metadata: {
        traceId: context.traceId,
        sessionId: context.sessionId,
        userId: context.userId
      }
    };
    
    this.events.push(event);
  }
  
  /**
   * Error handling
   */
  protected handleError(error: Error, context: AgentContext): void {
    const errorNotification: ErrorNotification = {
      id: crypto.randomUUID(),
      severity: 'error',
      category: 'execution',
      message: error.message,
      source: `agent.${this.id}`,
      timestamp: new Date(),
      context: {
        traceId: context.traceId,
        sessionId: context.sessionId
      },
      stackTrace: error.stack,
      recoverable: true
    };
    
    this.errors.push(errorNotification);
  }
  
  /**
   * Get agent history
   */
  getEvents(): SystemEvent[] {
    return [...this.events];
  }
  
  getErrors(): ErrorNotification[] {
    return [...this.errors];
  }
  
  clearHistory(): void {
    this.events = [];
    this.errors = [];
  }
}

// ============================================================================
// Agent Validation Error
// ============================================================================

export class AgentValidationError extends Error {
  constructor(
    public code: string,
    message: string,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'AgentValidationError';
  }
}
