# Protocolos de Comunicación - Blog AI Agéntico

## Definición
Los **protocolos** definen las interfaces y formatos estandarizados para la comunicación entre componentes del sistema agéntico. Todo intercambio de información DEBE seguir estos protocolos.

---

## PROTOCOL-001: Agent Communication Protocol (ACP)

### Objetivo
Estandarizar la comunicación between agentes del sistema.

### Mensaje Estándar

```typescript
interface AgentMessage<T = unknown> {
  // Identificación
  id: string;                    // UUID único del mensaje
  correlationId?: string;        // ID para agrupar mensajes relacionados
  
  // Routing
  from: AgentId;                 // Agente emisor
  to: AgentId | AgentId[];      // Agente(s) receptor(es)
  
  // Tipo de mensaje
  type: MessageType;
  
  // Contenido
  payload: T;
  
  // Metadata
  metadata: {
    timestamp: Date;
    priority: MessagePriority;
    ttl?: number;                // Time-to-live en ms
    retryCount?: number;
    requiresAck?: boolean;       // Requiere acknowledgment
  };
}

type MessageType =
  | 'request'       // Solicitud de acción
  | 'response'      // Respuesta a solicitud
  | 'notification'  // Notificación sin respuesta esperada
  | 'error'         // Mensaje de error
  | 'ack';          // Acknowledgment

type MessagePriority = 'low' | 'medium' | 'high' | 'critical';

type AgentId = 
  | 'planner'
  | 'coder'
  | 'reviewer'
  | 'executor';
```

### Ejemplos

#### Request Message
```typescript
const planRequest: AgentMessage<PlanningRequest> = {
  id: '550e8400-e29b-41d4-a716-446655440000',
  from: 'executor',
  to: 'planner',
  type: 'request',
  payload: {
    intent: 'generate-blog-post',
    context: {
      topic: 'AI in Healthcare',
      tone: 'professional',
      length: 'medium'
    }
  },
  metadata: {
    timestamp: new Date('2026-02-24T10:00:00Z'),
    priority: 'high',
    requiresAck: true
  }
};
```

#### Response Message
```typescript
const planResponse: AgentMessage<ExecutionPlan> = {
  id: '550e8400-e29b-41d4-a716-446655440001',
  correlationId: '550e8400-e29b-41d4-a716-446655440000',
  from: 'planner',
  to: 'executor',
  type: 'response',
  payload: {
    steps: [
      { skill: 'generate_content', params: {...} },
      { skill: 'analyze_seo', params: {...} },
      { skill: 'moderate_content', params: {...} }
    ]
  },
  metadata: {
    timestamp: new Date('2026-02-24T10:00:02Z'),
    priority: 'high'
  }
};
```

#### Error Message
```typescript
const errorMessage: AgentMessage<AgentError> = {
  id: '550e8400-e29b-41d4-a716-446655440002',
  correlationId: '550e8400-e29b-41d4-a716-446655440000',
  from: 'coder',
  to: 'executor',
  type: 'error',
  payload: {
    code: 'SKILL_EXECUTION_FAILED',
    message: 'Failed to generate content',
    details: {
      skill: 'generate_content',
      reason: 'OpenAI rate limit exceeded'
    },
    recoverable: true
  },
  metadata: {
    timestamp: new Date('2026-02-24T10:00:05Z'),
    priority: 'high'
  }
};
```

### Flujo de Comunicación

```
Agent A                          Agent B
   |                                |
   |-- request ------------------>  |
   |                                |
   |<-- ack (opcional) ----------   |
   |                                |
   |                                | (procesa)
   |                                |
   |<-- response ----------------   |
   |                                |
   |-- ack (opcional) ----------->  |
```

### Validación
```typescript
function validateAgentMessage(msg: unknown): msg is AgentMessage {
  return (
    typeof msg === 'object' &&
    msg !== null &&
    'id' in msg &&
    'from' in msg &&
    'to' in msg &&
    'type' in msg &&
    'payload' in msg &&
    'metadata' in msg
  );
}
```

---

## PROTOCOL-002: Skill Execution Protocol (SEP)

### Objetivo
Estandarizar la ejecución de skills por agentes.

### Estructura de Ejecución

```typescript
interface SkillExecution<TInput = unknown, TOutput = unknown> {
  // Identificación
  executionId: string;
  skillId: SkillId;
  
  // Input
  input: TInput;
  context: ExecutionContext;
  
  // Contratos
  preconditions: Condition[];
  postconditions: Condition[];
  
  // Configuración
  config?: SkillConfig;
  
  // Estado
  status: ExecutionStatus;
  result?: TOutput;
  error?: ExecutionError;
  
  // Metadata
  metadata: {
    startTime: Date;
    endTime?: Date;
    duration?: number;
    retries: number;
    agentId: AgentId;
  };
}

interface ExecutionContext {
  userId?: string;
  sessionId?: string;
  traceId: string;
  environment: 'development' | 'staging' | 'production';
  [key: string]: unknown;
}

interface Condition {
  id: string;
  description: string;
  check: (context: unknown) => boolean | Promise<boolean>;
}

type ExecutionStatus =
  | 'pending'
  | 'validating'
  | 'executing'
  | 'completed'
  | 'failed'
  | 'cancelled';

type SkillId =
  | 'generate_content'
  | 'summarize_content'
  | 'moderate_content'
  | 'analyze_seo'
  | 'recommend_content'
  | 'chat_interaction';
```

### Ciclo de Vida

```
Pending
   ↓
Validating (check preconditions)
   ↓
Executing (run skill logic)
   ↓
Validating (check postconditions)
   ↓
Completed / Failed
```

### Ejemplo de Ejecución

```typescript
const execution: SkillExecution<GenerateContentInput, GeneratedContent> = {
  executionId: 'exec-001',
  skillId: 'generate_content',
  
  input: {
    topic: 'Machine Learning Basics',
    tone: 'educational',
    length: 'long'
  },
  
  context: {
    traceId: 'trace-123',
    userId: 'user-456',
    environment: 'production'
  },
  
  preconditions: [
    {
      id: 'rate-limit-check',
      description: 'OpenAI rate limit not exceeded',
      check: async () => rateLimiter.check('user-456')
    },
    {
      id: 'valid-topic',
      description: 'Topic is not empty',
      check: (ctx) => ctx.input.topic.trim().length > 0
    }
  ],
  
  postconditions: [
    {
      id: 'content-generated',
      description: 'Content was successfully generated',
      check: (ctx) => ctx.result?.content?.length > 0
    },
    {
      id: 'content-valid',
      description: 'Generated content passes validation',
      check: async (ctx) => {
        const result = ContentSchema.safeParse(ctx.result);
        return result.success;
      }
    }
  ],
  
  status: 'pending',
  
  metadata: {
    startTime: new Date(),
    retries: 0,
    agentId: 'coder'
  }
};
```

### Validación Pre-Ejecución
```typescript
async function validatePreconditions(
  execution: SkillExecution
): Promise<boolean> {
  for (const condition of execution.preconditions) {
    const result = await condition.check({ 
      input: execution.input,
      context: execution.context 
    });
    
    if (!result) {
      throw new PreconditionFailure(condition.id, condition.description);
    }
  }
  
  return true;
}
```

### Validación Post-Ejecución
```typescript
async function validatePostconditions(
  execution: SkillExecution
): Promise<boolean> {
  for (const condition of execution.postconditions) {
    const result = await condition.check({
      input: execution.input,
      result: execution.result,
      context: execution.context
    });
    
    if (!result) {
      throw new PostconditionFailure(condition.id, condition.description);
    }
  }
  
  return true;
}
```

---

## PROTOCOL-003: Content Validation Protocol (CVP)

### Objetivo
Pipeline estandarizado para validar todo contenido antes de publicación.

### Pipeline de Validación

```
Content Input
    ↓
Step 1: Schema Validation
    ↓
Step 2: Content Moderation
    ↓
Step 3: SEO Analysis
    ↓
Step 4: Quality Check
    ↓
Step 5: Final Approval
    ↓
Content Output (approved/rejected)
```

### Estructura

```typescript
interface ContentValidation {
  contentId: string;
  content: unknown;
  
  steps: ValidationStep[];
  
  result: {
    approved: boolean;
    score: number;              // 0-100
    issues: ValidationIssue[];
    recommendations: string[];
  };
  
  metadata: {
    startTime: Date;
    endTime?: Date;
    validator: string;
  };
}

interface ValidationStep {
  id: string;
  name: string;
  order: number;
  required: boolean;
  
  status: 'pending' | 'running' | 'passed' | 'failed' | 'skipped';
  
  validate: (content: unknown) => Promise<ValidationResult>;
  
  result?: ValidationResult;
}

interface ValidationResult {
  passed: boolean;
  score: number;
  issues: ValidationIssue[];
  suggestions?: string[];
}

interface ValidationIssue {
  severity: 'error' | 'warning' | 'info';
  code: string;
  message: string;
  field?: string;
  suggestion?: string;
}
```

### Ejemplo de Implementación

```typescript
const contentValidation: ContentValidation = {
  contentId: 'post-123',
  content: {
    title: 'My Blog Post',
    content: '...',
    tags: ['ai', 'tech']
  },
  
  steps: [
    {
      id: 'schema-validation',
      name: 'Schema Validation',
      order: 1,
      required: true,
      status: 'pending',
      validate: async (content) => {
        const result = BlogPostSchema.safeParse(content);
        return {
          passed: result.success,
          score: result.success ? 100 : 0,
          issues: result.success ? [] : [{
            severity: 'error',
            code: 'SCHEMA_INVALID',
            message: 'Content does not match schema',
            suggestion: 'Fix validation errors'
          }]
        };
      }
    },
    
    {
      id: 'moderation',
      name: 'Content Moderation',
      order: 2,
      required: true,
      status: 'pending',
      validate: async (content) => {
        const moderationResult = await openai.moderations.create({
          input: content.content
        });
        
        const flagged = moderationResult.results[0].flagged;
        
        return {
          passed: !flagged,
          score: flagged ? 0 : 100,
          issues: flagged ? [{
            severity: 'error',
            code: 'CONTENT_FLAGGED',
            message: 'Content flagged by moderation'
          }] : []
        };
      }
    },
    
    {
      id: 'seo-analysis',
      name: 'SEO Analysis',
      order: 3,
      required: false,
      status: 'pending',
      validate: async (content) => {
        const seoScore = await analyzeSEO(content);
        
        return {
          passed: seoScore >= 60,
          score: seoScore,
          issues: seoScore < 60 ? [{
            severity: 'warning',
            code: 'LOW_SEO_SCORE',
            message: `SEO score is ${seoScore}/100`,
            suggestion: 'Improve title, meta description, and keywords'
          }] : [],
          suggestions: seoScore < 80 ? [
            'Add more keywords',
            'Improve readability',
            'Add internal links'
          ] : []
        };
      }
    }
  ],
  
  result: {
    approved: false,
    score: 0,
    issues: [],
    recommendations: []
  },
  
  metadata: {
    startTime: new Date(),
    validator: 'reviewer-agent'
  }
};
```

### Ejecución del Pipeline

```typescript
async function runValidationPipeline(
  validation: ContentValidation
): Promise<ContentValidation> {
  // Sort steps by order
  const sortedSteps = validation.steps.sort((a, b) => a.order - b.order);
  
  const issues: ValidationIssue[] = [];
  let totalScore = 0;
  let scoredSteps = 0;
  
  for (const step of sortedSteps) {
    step.status = 'running';
    
    try {
      const result = await step.validate(validation.content);
      step.result = result;
      step.status = result.passed ? 'passed' : 'failed';
      
      // Aggregate results
      issues.push(...result.issues);
      totalScore += result.score;
      scoredSteps++;
      
      // Stop on required step failure
      if (step.required && !result.passed) {
        break;
      }
      
    } catch (error) {
      step.status = 'failed';
      issues.push({
        severity: 'error',
        code: 'VALIDATION_ERROR',
        message: `Step ${step.name} failed: ${error.message}`
      });
      
      if (step.required) {
        break;
      }
    }
  }
  
  // Calculate final result
  const hasErrors = issues.some(i => i.severity === 'error');
  validation.result = {
    approved: !hasErrors,
    score: scoredSteps > 0 ? totalScore / scoredSteps : 0,
    issues,
    recommendations: extractRecommendations(validation.steps)
  };
  
  validation.metadata.endTime = new Date();
  
  return validation;
}
```

---

## PROTOCOL-004: Event Notification Protocol (ENP)

### Objetivo
Estandarizar la emisión y suscripción de eventos del sistema.

### Estructura de Evento

```typescript
interface SystemEvent<T = unknown> {
  id: string;
  type: EventType;
  source: string;
  
  data: T;
  
  metadata: {
    timestamp: Date;
    correlationId?: string;
    userId?: string;
    traceId?: string;
  };
}

type EventType =
  // Content events
  | 'content.created'
  | 'content.updated'
  | 'content.deleted'
  | 'content.published'
  | 'content.moderated'
  
  // Agent events
  | 'agent.started'
  | 'agent.completed'
  | 'agent.failed'
  
  // Skill events
  | 'skill.executed'
  | 'skill.failed'
  
  // System events
  | 'system.error'
  | 'system.warning';
```

### Ejemplo

```typescript
const contentPublishedEvent: SystemEvent<PublishedContent> = {
  id: 'event-001',
  type: 'content.published',
  source: 'executor-agent',
  
  data: {
    contentId: 'post-123',
    title: 'My Blog Post',
    publishedAt: new Date()
  },
  
  metadata: {
    timestamp: new Date(),
    correlationId: 'correlation-456',
    userId: 'user-789',
    traceId: 'trace-123'
  }
};
```

### Suscripción

```typescript
interface EventSubscription {
  id: string;
  eventTypes: EventType[];
  handler: EventHandler;
  filter?: EventFilter;
}

type EventHandler<T = unknown> = (event: SystemEvent<T>) => Promise<void>;
type EventFilter = (event: SystemEvent) => boolean;

// Ejemplo
const subscription: EventSubscription = {
  id: 'sub-001',
  eventTypes: ['content.published'],
  handler: async (event) => {
    console.log('Content published:', event.data);
    // Trigger additional actions
  },
  filter: (event) => event.metadata.userId === 'user-789'
};
```

---

## PROTOCOL-005: Error Handling Protocol (EHP)

### Objetivo
Estandarizar el manejo y reporte de errores.

### Estructura de Error

```typescript
interface SystemError {
  code: ErrorCode;
  message: string;
  
  severity: ErrorSeverity;
  
  context: {
    component: string;
    operation: string;
    input?: unknown;
    stackTrace?: string;
  };
  
  recoverable: boolean;
  retryStrategy?: RetryStrategy;
  
  metadata: {
    timestamp: Date;
    traceId: string;
    userId?: string;
  };
}

type ErrorCode =
  | 'VALIDATION_ERROR'
  | 'PRECONDITION_FAILED'
  | 'POSTCONDITION_FAILED'
  | 'SKILL_EXECUTION_FAILED'
  | 'RATE_LIMIT_EXCEEDED'
  | 'TIMEOUT'
  | 'NETWORK_ERROR'
  | 'INVARIANT_VIOLATION'
  | 'UNKNOWN_ERROR';

type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical';

interface RetryStrategy {
  maxRetries: number;
  backoffMs: number[];
  retryableErrors: ErrorCode[];
}
```

### Ejemplo

```typescript
const error: SystemError = {
  code: 'RATE_LIMIT_EXCEEDED',
  message: 'OpenAI API rate limit exceeded',
  severity: 'high',
  
  context: {
    component: 'openai-client',
    operation: 'generateCompletion',
    input: { prompt: '...' }
  },
  
  recoverable: true,
  retryStrategy: {
    maxRetries: 3,
    backoffMs: [1000, 2000, 4000],
    retryableErrors: ['RATE_LIMIT_EXCEEDED', 'TIMEOUT', 'NETWORK_ERROR']
  },
  
  metadata: {
    timestamp: new Date(),
    traceId: 'trace-123',
    userId: 'user-456'
  }
};
```

---

## Implementación de Protocolos

### Message Bus
```typescript
class MessageBus {
  private handlers = new Map<string, MessageHandler[]>();
  
  subscribe(pattern: string, handler: MessageHandler): void {
    if (!this.handlers.has(pattern)) {
      this.handlers.set(pattern, []);
    }
    this.handlers.get(pattern)!.push(handler);
  }
  
  async publish(message: AgentMessage): Promise<void> {
    const handlers = this.handlers.get(message.type) || [];
    
    await Promise.all(
      handlers.map(handler => handler(message))
    );
  }
}
```

### Protocol Validator
```typescript
class ProtocolValidator { 
  validateAgentMessage(msg: unknown): ValidationResult {
    // Validate ACP compliance
  }
  
  validateSkillExecution(exec: unknown): ValidationResult {
    // Validate SEP compliance
  }
  
  validateContentPipeline(pipeline: unknown): ValidationResult {
    // Validate CVP compliance
  }
}
```

---

**Versión**: 1.0.0  
**Fecha**: 2026-02-24  
**Estado**: 🟡 En Desarrollo
