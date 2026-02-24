/**
 * Protocols: Communication Standards for Agentic System
 * 
 * Defines standardized interfaces for agent-to-agent and agent-to-skill communication
 * Following specification: docs/specs/protocols.md
 */

// ============================================================================
// PROTOCOL-001: Agent Communication Protocol (ACP)
// ============================================================================

export type AgentId = 'planner' | 'coder' | 'reviewer' | 'executor';

export type MessageType = 'request' | 'response' | 'notification' | 'error' | 'ack';

export type MessagePriority = 'low' | 'medium' | 'high' | 'critical';

export interface AgentMessage<T = unknown> {
  id: string;
  correlationId?: string;
  from: AgentId;
  to: AgentId | AgentId[];
  type: MessageType;
  payload: T;
  metadata: MessageMetadata;
}

export interface MessageMetadata {
  timestamp: Date;
  priority: MessagePriority;
  ttl?: number;
  retryCount?: number;
  requiresAck?: boolean;
}

// ============================================================================
// PROTOCOL-002: Skill Execution Protocol (SEP)
// ============================================================================
// Already implemented in src/lib/skills/base.ts
// - SkillRequest
// - SkillResponse  
// - ExecutionContext

// ============================================================================
// PROTOCOL-003: Content Validation Protocol (CVP)
// ============================================================================

export interface ValidationRequest {
  content: ContentToValidate;
  validationType: ValidationType[];
  strictness?: 'low' | 'medium' | 'high';
}

export type ValidationType = 'quality' | 'seo' | 'safety' | 'completeness' | 'accuracy';

export interface ContentToValidate {
  id?: string;
  title?: string;
  body: string;
  excerpt?: string;
  tags?: string[];
  category?: string;
  metadata?: Record<string, unknown>;
}

export interface ValidationResult {
  valid: boolean;
  score: number;
  validations: ValidationCheck[];
  summary: string;
  recommendations: string[];
}

export interface ValidationCheck {
  type: ValidationType;
  passed: boolean;
  score: number;
  message: string;
  details?: Record<string, unknown>;
}

// ============================================================================
// PROTOCOL-004: Error Notification Protocol (ENP)
// ============================================================================

export type ErrorSeverity = 'warning' | 'error' | 'critical';

export type ErrorCategory = 
  | 'validation'
  | 'execution'
  | 'communication'
  | 'resource'
  | 'timeout'
  | 'authorization';

export interface ErrorNotification {
  id: string;
  severity: ErrorSeverity;
  category: ErrorCategory;
  message: string;
  source: string;
  timestamp: Date;
  context?: Record<string, unknown>;
  stackTrace?: string;
  recoverable: boolean;
  suggestedAction?: string;
}

// ============================================================================
// PROTOCOL-005: Event History Protocol (EHP)
// ============================================================================

export type EventType =
  | 'agent.started'
  | 'agent.completed'
  | 'agent.failed'
  | 'skill.started'
  | 'skill.completed'
  | 'skill.failed'
  | 'plan.created'
  | 'plan.updated'
  | 'validation.started'
  | 'validation.completed';

export interface SystemEvent {
  id: string;
  type: EventType;
  agentId?: AgentId;
  skillId?: string;
  timestamp: Date;
  duration?: number;
  success: boolean;
  data?: Record<string, unknown>;
  metadata: EventMetadata;
}

export interface EventMetadata {
  traceId: string;
  sessionId?: string;
  userId?: string;
  correlationId?: string;
}

// ============================================================================
// Helper Functions
// ============================================================================

export function createAgentMessage<T>(
  from: AgentId,
  to: AgentId | AgentId[],
  type: MessageType,
  payload: T,
  options?: {
    correlationId?: string;
    priority?: MessagePriority;
    ttl?: number;
    requiresAck?: boolean;
  }
): AgentMessage<T> {
  return {
    id: crypto.randomUUID(),
    correlationId: options?.correlationId,
    from,
    to,
    type,
    payload,
    metadata: {
      timestamp: new Date(),
      priority: options?.priority || 'medium',
      ttl: options?.ttl,
      requiresAck: options?.requiresAck
    }
  };
}

export function createErrorNotification(
  severity: ErrorSeverity,
  category: ErrorCategory,
  message: string,
  source: string,
  options?: {
    context?: Record<string, unknown>;
    stackTrace?: string;
    recoverable?: boolean;
    suggestedAction?: string;
  }
): ErrorNotification {
  return {
    id: crypto.randomUUID(),
    severity,
    category,
    message,
    source,
    timestamp: new Date(),
    context: options?.context,
    stackTrace: options?.stackTrace,
    recoverable: options?.recoverable ?? true,
    suggestedAction: options?.suggestedAction
  };
}

export function createSystemEvent(
  type: EventType,
  success: boolean,
  traceId: string,
  options?: {
    agentId?: AgentId;
    skillId?: string;
    duration?: number;
    data?: Record<string, unknown>;
    sessionId?: string;
    userId?: string;
    correlationId?: string;
  }
): SystemEvent {
  return {
    id: crypto.randomUUID(),
    type,
    agentId: options?.agentId,
    skillId: options?.skillId,
    timestamp: new Date(),
    duration: options?.duration,
    success,
    data: options?.data,
    metadata: {
      traceId,
      sessionId: options?.sessionId,
      userId: options?.userId,
      correlationId: options?.correlationId
    }
  };
}
