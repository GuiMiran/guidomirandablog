/**
 * Base interfaces and types for the Skills layer
 * Following PROTOCOL-002 (Skill Execution Protocol)
 */

// ============================================================================
// PROTOCOL-002: Skill Execution Protocol
// ============================================================================

export interface SkillRequest<TInput = any> {
  skillId: string;
  input: TInput;
  context: ExecutionContext;
}

export interface SkillResponse<TOutput = any> {
  success: boolean;
  output?: TOutput;
  error?: SkillError;
  metadata: SkillMetadata;
}

export interface ExecutionContext {
  traceId: string;
  userId?: string;
  sessionId?: string;
  environment: 'development' | 'staging' | 'production';
  timestamp: Date;
}

export interface SkillError {
  code: string;
  message: string;
  recoverable: boolean;
  details?: any;
}

export interface SkillMetadata {
  executedAt: Date;
  durationMs: number;
  tokensUsed?: number;
  costUSD?: number;
  modelUsed?: string;
}

// ============================================================================
// Base Skill Interface
// ============================================================================

export interface Skill<TInput, TOutput> {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  
  /**
   * Execute the skill with given input
   */
  execute(input: TInput, context?: Partial<ExecutionContext>): Promise<TOutput>;
  
  /**
   * Validate preconditions before execution
   */
  validatePreconditions(input: TInput): Promise<ValidationResult>;
  
  /**
   * Validate postconditions after execution
   */
  validatePostconditions(output: TOutput, input: TInput): Promise<ValidationResult>;
  
  /**
   * Validate invariants (should always be true)
   */
  validateInvariants(output: TOutput, input: TInput): Promise<ValidationResult>;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

export interface ValidationError {
  code: string;
  message: string;
  field?: string;
}

// ============================================================================
// Abstract Base Skill Class
// ============================================================================

export abstract class BaseSkill<TInput, TOutput> implements Skill<TInput, TOutput> {
  abstract readonly id: string;
  abstract readonly name: string;
  abstract readonly description: string;
  
  /**
   * Main execution logic (to be implemented by subclasses)
   */
  protected abstract executeImpl(input: TInput, context: ExecutionContext): Promise<TOutput>;
  
  /**
   * Precondition checks (to be implemented by subclasses)
   */
  protected abstract checkPreconditions(input: TInput): Promise<ValidationError[]>;
  
  /**
   * Postcondition checks (to be implemented by subclasses)
   */
  protected abstract checkPostconditions(output: TOutput, input: TInput): Promise<ValidationError[]>;
  
  /**
   * Invariant checks (to be implemented by subclasses)
   */
  protected abstract checkInvariants(output: TOutput, input: TInput): Promise<ValidationError[]>;
  
  /**
   * Public execute method with validation and error handling
   */
  async execute(input: TInput, contextOverride?: Partial<ExecutionContext>): Promise<TOutput> {
    const startTime = Date.now();
    const context = this.buildContext(contextOverride);
    
    try {
      // Validate preconditions
      const preValidation = await this.validatePreconditions(input);
      if (!preValidation.valid) {
        throw new SkillExecutionError(
          'PRECONDITION_FAILED',
          `Preconditions failed: ${preValidation.errors.map(e => e.message).join(', ')}`,
          false,
          { errors: preValidation.errors }
        );
      }
      
      // Execute skill logic
      const output = await this.executeImpl(input, context);
      
      // Validate postconditions
      const postValidation = await this.validatePostconditions(output, input);
      if (!postValidation.valid) {
        throw new SkillExecutionError(
          'POSTCONDITION_FAILED',
          `Postconditions failed: ${postValidation.errors.map(e => e.message).join(', ')}`,
          false,
          { errors: postValidation.errors }
        );
      }
      
      // Validate invariants
      const invariantValidation = await this.validateInvariants(output, input);
      if (!invariantValidation.valid) {
        throw new SkillExecutionError(
          'INVARIANT_VIOLATED',
          `Invariants violated: ${invariantValidation.errors.map(e => e.message).join(', ')}`,
          false,
          { errors: invariantValidation.errors }
        );
      }
      
      return output;
      
    } catch (error) {
      if (error instanceof SkillExecutionError) {
        throw error;
      }
      
      // Wrap unexpected errors
      throw new SkillExecutionError(
        'EXECUTION_FAILED',
        error instanceof Error ? error.message : 'Unknown error',
        true,
        { originalError: error }
      );
    }
  }
  
  async validatePreconditions(input: TInput): Promise<ValidationResult> {
    const errors = await this.checkPreconditions(input);
    return {
      valid: errors.length === 0,
      errors
    };
  }
  
  async validatePostconditions(output: TOutput, input: TInput): Promise<ValidationResult> {
    const errors = await this.checkPostconditions(output, input);
    return {
      valid: errors.length === 0,
      errors
    };
  }
  
  async validateInvariants(output: TOutput, input: TInput): Promise<ValidationResult> {
    const errors = await this.checkInvariants(output, input);
    return {
      valid: errors.length === 0,
      errors
    };
  }
  
  private buildContext(override?: Partial<ExecutionContext>): ExecutionContext {
    return {
      traceId: override?.traceId || this.generateTraceId(),
      userId: override?.userId,
      sessionId: override?.sessionId,
      environment: override?.environment || (process.env.NODE_ENV === 'production' ? 'production' : 'development'),
      timestamp: new Date()
    };
  }
  
  private generateTraceId(): string {
    return `trace-${this.id}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  }
}

// ============================================================================
// Custom Error Class
// ============================================================================

export class SkillExecutionError extends Error {
  constructor(
    public code: string,
    message: string,
    public recoverable: boolean,
    public details?: any
  ) {
    super(message);
    this.name = 'SkillExecutionError';
  }
}

// ============================================================================
// Utility Functions
// ============================================================================

export function calculateCost(usage: { prompt_tokens: number; completion_tokens: number }, model: string): number {
  // OpenAI pricing (as of 2024)
  const pricing: Record<string, { input: number; output: number }> = {
    'gpt-4o': { input: 5.00, output: 15.00 },     // per 1M tokens
    'gpt-4o-mini': { input: 0.15, output: 0.60 }, // per 1M tokens
  };
  
  const modelPricing = pricing[model] || pricing['gpt-4o-mini'];
  
  const inputCost = (usage.prompt_tokens / 1_000_000) * modelPricing.input;
  const outputCost = (usage.completion_tokens / 1_000_000) * modelPricing.output;
  
  return Number((inputCost + outputCost).toFixed(6));
}

export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove accents
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function countWords(text: string): number {
  return text.split(/\s+/).filter(w => w.length > 0).length;
}

export function countParagraphs(text: string): number {
  return text.split(/\n\n+/).filter(p => p.trim().length > 0).length;
}

export function extractHeadingStructure(markdown: string): { h1: number; h2: number; h3: number } {
  const headings = markdown.match(/^#{1,6}\s+.+$/gm) || [];
  
  return {
    h1: headings.filter(h => h.startsWith('# ')).length,
    h2: headings.filter(h => h.startsWith('## ')).length,
    h3: headings.filter(h => h.startsWith('### ')).length
  };
}
