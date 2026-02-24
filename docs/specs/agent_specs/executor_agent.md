# Agent Specification: Executor Agent

## Objetivo
Ejecutar planes de acción coordinando skills, manejando el flujo de datos entre pasos, gestionando errores y asegurando que las operaciones se completen exitosamente.

## Responsabilidad
El **Executor Agent** es responsable de:
1. Ejecutar planes creados por Planner Agent
2. Coordinar invocación de skills en orden correcto
3. Manejar flujo de datos entre steps
4. Gestionar reintentos y recuperación de errores
5. Garantizar cumplimiento de precondiciones y postcondiciones
6. Registrar auditoría de todas las operaciones

## Inputs

### ExecutionRequest
```typescript
interface ExecutionRequest {
  plan: ExecutionPlan;
  
  context?: ExecutionContext;
  
  config?: ExecutionConfig;
}

interface ExecutionPlan {
  id: string;
  description: string;
  steps: ExecutionStep[];
  metadata: PlanMetadata;
}

interface ExecutionStep {
  id: string;
  order: number;
  skillId: SkillId;
  params: Record<string, unknown>;
  dependencies?: string[];
  condition?: StepCondition;
  retry?: RetryConfig;
}

interface ExecutionContext {
  traceId: string;
  userId?: string;
  sessionId?: string;
  environment: 'development' | 'staging' | 'production';
  metadata?: Record<string, unknown>;
}

interface ExecutionConfig {
  timeout?: number;              // Global timeout (ms)
  stopOnError?: boolean;         // Stop execution on first error
  parallel?: boolean;            // Enable parallel execution where possible
  dryRun?: boolean;             // Simulate without actually executing
  auditLevel?: 'minimal' | 'standard' | 'verbose';
}
```

### Ejemplo de Input
```typescript
const executionRequest: ExecutionRequest = {
  plan: {
    id: 'plan-123',
    description: 'Generate and publish blog post',
    steps: [
      {
        id: 'step-1',
        order: 1,
        skillId: 'generate_content',
        params: {
          topic: 'GraphQL Best Practices',
          tone: 'professional',
          length: 'medium'
        },
        retry: {
          maxAttempts: 3,
          backoffMs: [1000, 2000, 4000]
        }
      },
      {
        id: 'step-2',
        order: 2,
        skillId: 'moderate_content',
        params: {
          contentSource: '${step-1.result.content}'
        },
        dependencies: ['step-1']
      },
      {
        id: 'step-3',
        order: 3,
        skillId: 'analyze_seo',
        params: {
          contentSource: '${step-1.result}'
        },
        dependencies: ['step-1']
      }
    ],
    metadata: {
      createdBy: 'planner',
      createdAt: new Date(),
      confidence: 0.9
    }
  },
  context: {
    traceId: 'trace-456',
    userId: 'user-789',
    environment: 'production'
  },
  config: {
    timeout: 120000,
    stopOnError: true,
    parallel: true,
    auditLevel: 'standard'
  }
};
```

## Outputs

### ExecutionResult
```typescript
interface ExecutionResult {
  executionId: string;
  planId: string;
  
  status: ExecutionStatus;
  
  stepResults: Map<string, StepResult>;
  
  finalResult?: unknown;
  error?: ExecutionError;
  
  metrics: ExecutionMetrics;
  
  audit: AuditLog;
}

type ExecutionStatus =
  | 'pending'
  | 'running'
  | 'completed'
  | 'partial'      // Some steps completed, some failed
  | 'failed'
  | 'cancelled'
  | 'timeout';

interface StepResult {
  stepId: string;
  skillId: SkillId;
  
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
  
  input: Record<string, unknown>;
  output?: unknown;
  error?: ExecutionError;
  
  attempts: number;
  duration: number;
  
  startTime: Date;
  endTime?: Date;
}

interface ExecutionMetrics {
  totalSteps: number;
  completedSteps: number;
  failedSteps: number;
  skippedSteps: number;
  
  totalDuration: number;
  skillsInvoked: Record<SkillId, number>;
  
  resourceUsage?: {
    tokensUsed?: number;
    costUSD?: number;
    apiCalls?: number;
  };
}

interface AuditLog {
  entries: AuditEntry[];
}

interface AuditEntry {
  timestamp: Date;
  level: 'info' | 'warn' | 'error';
  stepId?: string;
  message: string;
  details?: unknown;
}
```

### Ejemplo de Output
```typescript
const executionResult: ExecutionResult = {
  executionId: 'exec-001',
  planId: 'plan-123',
  
  status: 'completed',
  
  stepResults: new Map([
    ['step-1', {
      stepId: 'step-1',
      skillId: 'generate_content',
      status: 'completed',
      input: {
        topic: 'GraphQL Best Practices',
        tone: 'professional',
        length: 'medium'
      },
      output: {
        title: 'GraphQL Best Practices for 2026',
        content: '...',
        tags: ['GraphQL', 'API', 'Best Practices']
      },
      attempts: 1,
      duration: 12340,
      startTime: new Date('2026-02-24T10:00:00Z'),
      endTime: new Date('2026-02-24T10:00:12Z')
    }],
    ['step-2', {
      stepId: 'step-2',
      skillId: 'moderate_content',
      status: 'completed',
      input: { content: '...' },
      output: {
        approved: true,
        flagged: false
      },
      attempts: 1,
      duration: 2500,
      startTime: new Date('2026-02-24T10:00:12Z'),
      endTime: new Date('2026-02-24T10:00:15Z')
    }],
    ['step-3', {
      stepId: 'step-3',
      skillId: 'analyze_seo',
      status: 'completed',
      input: { content: '...' },
      output: {
        score: 85,
        suggestions: ['Add internal links']
      },
      attempts: 1,
      duration: 3200,
      startTime: new Date('2026-02-24T10:00:12Z'),
      endTime: new Date('2026-02-24T10:00:15Z')
    }]
  ]),
  
  finalResult: {
    contentGenerated: true,
    moderated: true,
    seoScore: 85
  },
  
  metrics: {
    totalSteps: 3,
    completedSteps: 3,
    failedSteps: 0,
    skippedSteps: 0,
    totalDuration: 15500,
    skillsInvoked: {
      generate_content: 1,
      moderate_content: 1,
      analyze_seo: 1
    },
    resourceUsage: {
      tokensUsed: 2500,
      costUSD: 0.075,
      apiCalls: 3
    }
  },
  
  audit: {
    entries: [
      {
        timestamp: new Date('2026-02-24T10:00:00Z'),
        level: 'info',
        message: 'Execution started',
        details: { planId: 'plan-123' }
      },
      {
        timestamp: new Date('2026-02-24T10:00:00Z'),
        level: 'info',
        stepId: 'step-1',
        message: 'Step started: generate_content',
        details: { skillId: 'generate_content' }
      },
      {
        timestamp: new Date('2026-02-24T10:00:12Z'),
        level: 'info',
        stepId: 'step-1',
        message: 'Step completed successfully',
        details: { duration: 12340 }
      },
      // ... more entries
    ]
  }
};
```

## Precondiciones

### PRE-EXEC-001: Plan Válido
```typescript
precondition ValidPlan {
  check: (request: ExecutionRequest) => {
    return (
      request.plan?.id &&
      request.plan.steps?.length > 0 &&
      request.plan.steps.every(step =>
        step.id && step.skillId && step.order >= 0
      )
    );
  };
  message: "Execution plan must be valid and have at least one step";
}
```

### PRE-EXEC-002: Skills Disponibles
```typescript
precondition SkillsAvailable {
  check: async (request: ExecutionRequest) => {
    const skillRegistry = await getSkillRegistry();
    
    return request.plan.steps.every(step =>
      skillRegistry.hasSkill(step.skillId)
    );
  };
  message: "All skills in plan must be registered and available";
}
```

### PRE-EXEC-003: Sin Dependencias Cíclicas
```typescript
precondition NoCyclicDependencies {
  check: (request: ExecutionRequest) => {
    const graph = buildDependencyGraph(request.plan.steps);
    return !hasCycle(graph);
  };
  message: "Plan must not have cyclic dependencies";
}
```

## Postcondiciones

### POST-EXEC-001: Todos los Steps Procesados
```typescript
postcondition AllStepsProcessed {
  check: (result: ExecutionResult) => {
    const expectedSteps = result.metrics.totalSteps;
    const processedSteps = result.metrics.completedSteps + 
                          result.metrics.failedSteps + 
                          result.metrics.skippedSteps;
    
    return processedSteps === expectedSteps;
  };
  message: "All steps must be marked as completed, failed, or skipped";
}
```

### POST-EXEC-002: Audit Log Completo
```typescript
postcondition CompleteAuditLog {
  check: (result: ExecutionResult) => {
    const hasStartEntry = result.audit.entries.some(e =>
      e.message.includes('started')
    );
    
    const hasEndEntry = result.audit.entries.some(e =>
      e.message.includes('completed') || e.message.includes('failed')
    );
    
    return hasStartEntry && hasEndEntry;
  };
  message: "Audit log must have start and end entries";
}
```

### POST-EXEC-003: Estado Consistente
```typescript
postcondition ConsistentStatus {
  check: (result: ExecutionResult) => {
    if (result.status === 'completed') {
      return result.metrics.failedSteps === 0;
    }
    
    if (result.status === 'failed') {
      return result.metrics.failedSteps > 0;
    }
    
    return true;
  };
  message: "Execution status must be consistent with step results";
}
```

## Invariantes

### INV-EXEC-001: Orden de Ejecución
**Steps must execute in order respecting dependencies**
```typescript
invariant ExecutionOrder {
  check: (result: ExecutionResult, plan: ExecutionPlan) => {
    for (const step of plan.steps) {
      if (!step.dependencies) continue;
      
      const stepResult = result.stepResults.get(step.id);
      if (!stepResult || stepResult.status === 'pending') continue;
      
      // Check all dependencies executed before this step
      for (const depId of step.dependencies) {
        const depResult = result.stepResults.get(depId);
        
        if (!depResult) return false;
        if (depResult.endTime! > stepResult.startTime) return false;
      }
    }
    
    return true;
  };
}
```

### INV-EXEC-002: Atomicidad de Audit Log
**Every step execution must have audit entries**
```typescript
invariant AuditLogCompleteness {
  check: (result: ExecutionResult) => {
    for (const [stepId, stepResult] of result.stepResults) {
      const hasAuditEntry = result.audit.entries.some(e =>
        e.stepId === stepId
      );
      
      if (!hasAuditEntry) return false;
    }
    
    return true;
  };
}
```

## Algoritmo de Ejecución

### Fase 1: Preparación
```typescript
async function prepare(request: ExecutionRequest): Promise<ExecutionContext> {
  // Validate plan
  await validatePlan(request.plan);
  
  // Load skills
  const skillRegistry = await loadSkillRegistry();
  
  // Build execution graph
  const graph = buildExecutionGraph(request.plan.steps);
  
  // Initialize audit log
  const audit = initializeAuditLog(request);
  
  return {
    ...request.context,
    skillRegistry,
    graph,
    audit,
    dataStore: new Map()  // For passing data between steps
  };
}
```

### Fase 2: Ejecución
```typescript
async function execute(
  plan: ExecutionPlan,
  context: ExecutionContext,
  config: ExecutionConfig
): Promise<ExecutionResult> {
  const result: ExecutionResult = initializeResult(plan);
  
  const sortedSteps = topologicalSort(plan.steps);
  
  for (const step of sortedSteps) {
    // Check if dependencies met
    if (!await checkDependencies(step, result)) {
      result.stepResults.set(step.id, {
        ...createStepResult(step),
        status: 'skipped'
      });
      continue;
    }
    
    // Check condition
    if (step.condition && !await evaluateCondition(step.condition, context)) {
      result.stepResults.set(step.id, {
        ...createStepResult(step),
        status: 'skipped'
      });
      continue;
    }
    
    // Execute step
    const stepResult = await executeStep(step, context, config);
    result.stepResults.set(step.id, stepResult);
    
    // Store result for next steps
    context.dataStore.set(step.id, stepResult.output);
    
    // Handle errors
    if (stepResult.status === 'failed' && config.stopOnError) {
      result.status = 'failed';
      result.error = stepResult.error;
      break;
    }
  }
  
  // Finalize
  result.status = determineOverallStatus(result);
  result.metrics = calculateMetrics(result);
  
  return result;
}
```

### Fase 3: Ejecución de Step Individual
```typescript
async function executeStep(
  step: ExecutionStep,
  context: ExecutionContext,
  config: ExecutionConfig
): Promise<StepResult> {
  const stepResult = createStepResult(step);
  
  // Audit: Start
  auditLog.add({
    timestamp: new Date(),
    level: 'info',
    stepId: step.id,
    message: `Step started: ${step.skillId}`
  });
  
  // Resolve parameters (interpolate from previous steps)
  const resolvedParams = await resolveParameters(step.params, context.dataStore);
  stepResult.input = resolvedParams;
  
  let attempts = 0;
  const maxAttempts = step.retry?.maxAttempts || 1;
  
  while (attempts < maxAttempts) {
    try {
      stepResult.status = 'running';
      stepResult.startTime = new Date();
      
      // Check preconditions
      const skill = context.skillRegistry.getSkill(step.skillId);
      await validatePreconditions(skill, resolvedParams, context);
      
      // Execute skill
      const output = await skill.execute(resolvedParams, context);
      
      // Check postconditions
      await validatePostconditions(skill, output, context);
      
      stepResult.output = output;
      stepResult.status = 'completed';
      stepResult.endTime = new Date();
      stepResult.duration = stepResult.endTime.getTime() - stepResult.startTime.getTime();
      
      // Audit: Success
      auditLog.add({
        timestamp: new Date(),
        level: 'info',
        stepId: step.id,
        message: 'Step completed successfully',
        details: { duration: stepResult.duration }
      });
      
      break;  // Success, exit retry loop
      
    } catch (error) {
      attempts++;
      stepResult.attempts = attempts;
      
      if (attempts >= maxAttempts) {
        stepResult.status = 'failed';
        stepResult.error = {
          code: 'SKILL_EXECUTION_FAILED',
          message: error.message,
          recoverable: isRecoverable(error),
          details: error
        };
        stepResult.endTime = new Date();
        
        // Audit: Failure
        auditLog.add({
          timestamp: new Date(),
          level: 'error',
          stepId: step.id,
          message: `Step failed after ${attempts} attempts`,
          details: { error: error.message }
        });
        
      } else {
        // Retry with backoff
        const backoffMs = step.retry?.backoffMs?.[attempts - 1] || 1000;
        
        auditLog.add({
          timestamp: new Date(),
          level: 'warn',
          stepId: step.id,
          message: `Step failed, retrying in ${backoffMs}ms`,
          details: { attempt: attempts, maxAttempts }
        });
        
        await sleep(backoffMs);
      }
    }
  }
  
  return stepResult;
}
```

### Fase 4: Resolución de Parámetros
```typescript
async function resolveParameters(
  params: Record<string, unknown>,
  dataStore: Map<string, unknown>
): Promise<Record<string, unknown>> {
  const resolved: Record<string, unknown> = {};
  
  for (const [key, value] of Object.entries(params)) {
    if (typeof value === 'string' && value.startsWith('${') && value.endsWith('}')) {
      // Template string: ${step-1.result.content}
      const path = value.slice(2, -1);
      resolved[key] = resolvePath(path, dataStore);
    } else {
      resolved[key] = value;
    }
  }
  
  return resolved;
}

function resolvePath(path: string, dataStore: Map<string, unknown>): unknown {
  const parts = path.split('.');
  const stepId = parts[0];
  
  let value = dataStore.get(stepId);
  
  for (let i = 1; i < parts.length; i++) {
    if (value && typeof value === 'object') {
      value = (value as Record<string, unknown>)[parts[i]];
    } else {
      throw new Error(`Cannot resolve path: ${path}`);
    }
  }
  
  return value;
}
```

## Ejecución Paralela

```typescript
async function executeParallel(
  steps: ExecutionStep[],
  context: ExecutionContext,
  config: ExecutionConfig
): Promise<Map<string, StepResult>> {
  // Group steps that can run in parallel
  const groups = groupByDependencies(steps);
  
  const results = new Map<string, StepResult>();
  
  for (const group of groups) {
    // Execute group in parallel
    const promises = group.map(step => executeStep(step, context, config));
    const groupResults = await Promise.allSettled(promises);
    
    // Collect results
    group.forEach((step, index) => {
      const promiseResult = groupResults[index];
      
      if (promiseResult.status === 'fulfilled') {
        results.set(step.id, promiseResult.value);
      } else {
        results.set(step.id, {
          ...createStepResult(step),
          status: 'failed',
          error: {
            code: 'PARALLEL_EXECUTION_FAILED',
            message: promiseResult.reason?.message || 'Unknown error'
          }
        });
      }
    });
  }
  
  return results;
}
```

## Manejo de Errores

### Error Recovery Strategy
```typescript
interface ErrorRecoveryStrategy {
  retryable: boolean;
  fallback?: () => Promise<unknown>;
  compensate?: () => Promise<void>;
}

function getRecoveryStrategy(error: ExecutionError): ErrorRecoveryStrategy {
  switch (error.code) {
    case 'RATE_LIMIT_EXCEEDED':
      return {
        retryable: true,
        fallback: async () => queueForLater()
      };
    
    case 'TIMEOUT':
      return {
        retryable: true,
        fallback: async () => useCache()
      };
    
    case 'PRECONDITION_FAILED':
      return {
        retryable: false,
        compensate: async () => rollbackChanges()
      };
    
    default:
      return { retryable: false };
  }
}
```

## Métricas

- `executor.executions.count` - Total ejecuciones
- `executor.executions.success_rate` - Tasa de éxito
- `executor.steps.executed` - Total steps ejecutados
- `executor.steps.failed` - Steps fallidos
- `executor.duration.average_ms` - Duración promedio
- `executor.retries.count` - Total reintentos

## Tests

### Test de Precondiciones
```typescript
describe('Executor Agent Preconditions', () => {
  it('rejects invalid plan', async () => {
    const request = {
      plan: { id: '', steps: [] }
    };
    
    await expect(executorAgent.execute(request))
      .rejects.toThrow('plan must be valid');
  });
  
  it('detects cyclic dependencies', async () => {
    const request = {
      plan: createPlanWithCycle()
    };
    
    await expect(executorAgent.execute(request))
      .rejects.toThrow('cyclic dependencies');
  });
});
```

### Test de Invariantes
```typescript
describe('Executor Agent Invariants', () => {
  it('executes steps in correct order', async () => {
    const result = await executorAgent.execute(validRequest);
    
    expect(stepsExecutedInOrder(result, validRequest.plan)).toBe(true);
  });
  
  it('creates audit entry for every step', async () => {
    const result = await executorAgent.execute(validRequest);
    
    for (const [stepId] of result.stepResults) {
      expect(hasAuditEntry(result.audit, stepId)).toBe(true);
    }
  });
});
```

## Protocolo de Comunicación

Usa **PROTOCOL-001 (ACP)** y **PROTOCOL-002 (SEP)**.

Ver: `docs/specs/protocols.md`

## Referencias
- **System Spec**: `docs/specs/system_spec.md`
- **Protocols**: `docs/specs/protocols.md`
- **Invariants**: `docs/specs/invariants.md`
- **Related Agents**: Planner Agent, Coder Agent, Reviewer Agent

---

**Versión**: 1.0.0  
**Fecha**: 2026-02-24  
**Estado**: 🟡 En Desarrollo
