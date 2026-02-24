# Agent Specification: Planner Agent

## Objetivo
Analizar solicitudes de usuario y contexto del sistema para crear planes de ejecución óptimos que coordinen múltiples skills.

## Responsabilidad
El **Planner Agent** es responsable de:
1. Interpretar intenciones del usuario
2. Analizar el contexto y estado del sistema
3. Seleccionar skills apropiadas
4. Secuenciar pasos de ejecución
5. Optimizar el plan para eficiencia
6. Manejar dependencias entre skills

## Inputs

### PlanningRequest
```typescript
interface PlanningRequest {
  // Solicitud del usuario
  userIntent: string;
  userContext?: {
    userId?: string;
    sessionId?: string;
    preferences?: Record<string, unknown>;
  };
  
  // Contexto del sistema
  systemContext: {
    availableSkills: SkillId[];
    systemLoad?: number;
    rateLimits?: Record<string, RateLimitStatus>;
  };
  
  // Restricciones
  constraints?: {
    maxSteps?: number;
    timeout?: number;
    budget?: number;          // Token budget for AI operations
    priority?: 'low' | 'medium' | 'high';
  };
}
```

### Ejemplo de Input
```typescript
const planningRequest: PlanningRequest = {
  userIntent: 'Generate a professional blog post about AI ethics',
  userContext: {
    userId: 'user-123',
    preferences: {
      tone: 'professional',
      length: 'medium'
    }
  },
  systemContext: {
    availableSkills: [
      'generate_content',
      'analyze_seo',
      'moderate_content',
      'summarize_content'
    ],
    rateLimits: {
      openai: { remaining: 450, limit: 500 }
    }
  },
  constraints: {
    maxSteps: 5,
    timeout: 60000,
    budget: 3000,
    priority: 'high'
  }
};
```

## Outputs

### ExecutionPlan
```typescript
interface ExecutionPlan {
  id: string;
  description: string;
  
  steps: ExecutionStep[];
  
  estimatedDuration: number;    // milliseconds
  estimatedCost: number;         // tokens or USD
  
  metadata: {
    createdBy: 'planner';
    createdAt: Date;
    confidence: number;          // 0-1
    alternatives?: ExecutionPlan[];
  };
}

interface ExecutionStep {
  id: string;
  order: number;
  
  skillId: SkillId;
  params: Record<string, unknown>;
  
  dependencies?: string[];       // IDs of prerequisite steps
  condition?: StepCondition;     // Optional conditional execution
  
  retry?: {
    maxAttempts: number;
    backoffMs: number[];
  };
}

interface StepCondition {
  type: 'success' | 'failure' | 'always' | 'custom';
  evaluate?: (context: unknown) => boolean;
}
```

### Ejemplo de Output
```typescript
const executionPlan: ExecutionPlan = {
  id: 'plan-001',
  description: 'Generate professional blog post about AI ethics',
  
  steps: [
    {
      id: 'step-1',
      order: 1,
      skillId: 'generate_content',
      params: {
        topic: 'AI ethics',
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
      skillId: 'analyze_seo',
      params: {
        contentSource: 'step-1.result.content'
      },
      dependencies: ['step-1'],
      condition: {
        type: 'success'
      }
    },
    {
      id: 'step-3',
      order: 3,
      skillId: 'moderate_content',
      params: {
        contentSource: 'step-1.result.content'
      },
      dependencies: ['step-1']
    },
    {
      id: 'step-4',
      order: 4,
      skillId: 'summarize_content',
      params: {
        contentSource: 'step-1.result.content',
        maxLength: 150
      },
      dependencies: ['step-1', 'step-3'],
      condition: {
        type: 'custom',
        evaluate: (ctx) => ctx['step-3'].result.approved === true
      }
    }
  ],
  
  estimatedDuration: 15000,
  estimatedCost: 2500,
  
  metadata: {
    createdBy: 'planner',
    createdAt: new Date(),
    confidence: 0.92
  }
};
```

## Precondiciones

### PRE-PLAN-001: Request Válido
```typescript
precondition ValidRequest {
  check: (request: PlanningRequest) => {
    return (
      request.userIntent?.trim().length > 0 &&
      request.systemContext?.availableSkills?.length > 0 &&
      request.constraints?.timeout > 0
    );
  };
  message: "Planning request must have valid intent and available skills";
}
```

### PRE-PLAN-002: Skills Disponibles
```typescript
precondition SkillsAvailable {
  check: (request: PlanningRequest) => {
    const requiredSkills = inferRequiredSkills(request.userIntent);
    return requiredSkills.every(skill =>
      request.systemContext.availableSkills.includes(skill)
    );
  };
  message: "All required skills must be available";
}
```

### PRE-PLAN-003: Recursos Suficientes
```typescript
precondition SufficientResources {
  check: (request: PlanningRequest) => {
    const estimatedTokens = estimateTokenUsage(request.userIntent);
    return (
      !request.constraints?.budget ||
      estimatedTokens <= request.constraints.budget
    );
  };
  message: "Sufficient token budget must be available";
}
```

## Postcondiciones

### POST-PLAN-001: Plan Completo
```typescript
postcondition CompletePlan {
  check: (plan: ExecutionPlan) => {
    return (
      plan.steps.length > 0 &&
      plan.steps.every(step => 
        step.skillId && 
        step.params &&
        step.order >= 0
      )
    );
  };
  message: "Plan must have at least one valid step";
}
```

### POST-PLAN-002: Dependencias Válidas
```typescript
postcondition ValidDependencies {
  check: (plan: ExecutionPlan) => {
    const stepIds = new Set(plan.steps.map(s => s.id));
    
    return plan.steps.every(step => {
      if (!step.dependencies) return true;
      
      return step.dependencies.every(depId => stepIds.has(depId));
    });
  };
  message: "All step dependencies must reference valid steps";
}
```

### POST-PLAN-003: Orden Lógico
```typescript
postcondition LogicalOrder {
  check: (plan: ExecutionPlan) => {
    const sortedSteps = [...plan.steps].sort((a, b) => a.order - b.order);
    
    for (const step of sortedSteps) {
      if (!step.dependencies) continue;
      
      for (const depId of step.dependencies) {
        const depStep = sortedSteps.find(s => s.id === depId);
        if (depStep && depStep.order >= step.order) {
          return false;
        }
      }
    }
    
    return true;
  };
  message: "Step dependencies must be executed before dependent steps";
}
```

### POST-PLAN-004: Dentro de Restricciones
```typescript
postcondition WithinConstraints {
  check: (plan: ExecutionPlan, request: PlanningRequest) => {
    const constraints = request.constraints;
    
    return (
      (!constraints?.maxSteps || plan.steps.length <= constraints.maxSteps) &&
      (!constraints?.timeout || plan.estimatedDuration <= constraints.timeout) &&
      (!constraints?.budget || plan.estimatedCost <= constraints.budget)
    );
  };
  message: "Plan must respect all constraints";
}
```

## Invariantes

### INV-PLAN-001: Idempotencia de Plans
**Mismo input debe generar plan semánticamente equivalente**
```typescript
invariant PlanIdempotence {
  check: (request1, plan1, request2, plan2) => {
    if (deepEqual(request1, request2)) {
      return plansAreSemanticallyEqual(plan1, plan2);
    }
    return true;
  };
}
```

### INV-PLAN-002: Sin Ciclos de Dependencia
**El grafo de dependencias debe ser acíclico**
```typescript
invariant NoCyclicDependencies {
  check: (plan: ExecutionPlan) => {
    return !hasCycle(buildDependencyGraph(plan.steps));
  };
}
```

## Algoritmo de Planificación

### Fase 1: Análisis de Intent
```typescript
function analyzeIntent(intent: string): IntentAnalysis {
  return {
    mainGoal: extractMainGoal(intent),
    requiredSkills: inferRequiredSkills(intent),
    parameters: extractParameters(intent),
    complexity: estimateComplexity(intent)
  };
}
```

### Fase 2: Selección de Skills
```typescript
function selectSkills(
  analysis: IntentAnalysis,
  availableSkills: SkillId[]
): SkillId[] {
  // Filter required skills that are available
  const skills = analysis.requiredSkills.filter(s =>
    availableSkills.includes(s)
  );
  
  // Add optimization skills if complexity is high
  if (analysis.complexity > 0.7) {
    skills.push('analyze_seo');
  }
  
  // Always include moderation for content generation
  if (skills.includes('generate_content')) {
    skills.push('moderate_content');
  }
  
  return skills;
}
```

### Fase 3: Secuenciamiento
```typescript
function sequenceSteps(
  skills: SkillId[],
  params: Record<string, unknown>
): ExecutionStep[] {
  const steps: ExecutionStep[] = [];
  const skillDependencies = getSkillDependencies();
  
  let order = 1;
  const processedSkills = new Set<SkillId>();
  
  while (processedSkills.size < skills.length) {
    // Find skills whose dependencies are satisfied
    const readySkills = skills.filter(skill =>
      !processedSkills.has(skill) &&
      (skillDependencies[skill] || []).every(dep =>
        processedSkills.has(dep)
      )
    );
    
    // Add steps for ready skills
    for (const skill of readySkills) {
      steps.push({
        id: `step-${order}`,
        order: order++,
        skillId: skill,
        params: buildSkillParams(skill, params),
        dependencies: buildDependencies(skill, steps, skillDependencies)
      });
      
      processedSkills.add(skill);
    }
  }
  
  return steps;
}
```

### Fase 4: Optimización
```typescript
function optimizePlan(plan: ExecutionPlan): ExecutionPlan {
  // Parallel execution optimization
  plan = enableParallelExecution(plan);
  
  // Remove redundant steps
  plan = removeRedundantSteps(plan);
  
  // Optimize parameter passing
  plan = optimizeDataFlow(plan);
  
  // Add retry strategies
  plan = addRetryStrategies(plan);
  
  return plan;
}
```

## Manejo de Errores

### Error: Insufficient Resources
```typescript
{
  code: 'INSUFFICIENT_RESOURCES',
  message: 'Cannot create plan within budget constraints',
  recoverable: true,
  suggestion: 'Increase budget or simplify request'
}
```

### Error: No Valid Plan
```typescript
{
  code: 'NO_VALID_PLAN',
  message: 'Cannot create valid execution plan for request',
  recoverable: false,
  suggestion: 'Rephrase request or make skills available'
}
```

## Métricas

- `planner.plans_created.count` - Planes creados
- `planner.planning_duration_ms` - Tiempo de planificación
- `planner.plan_success_rate` - Tasa de éxito de planes
- `planner.average_steps_per_plan` - Pasos promedio por plan
- `planner.confidence_score` - Score de confianza promedio

## Tests

### Test de Precondiciones
```typescript
describe('Planner Agent Preconditions', () => {
  it('rejects empty intent', () => {
    const request = { userIntent: '', systemContext: {...} };
    expect(() => plannerAgent.plan(request))
      .toThrow('Planning request must have valid intent');
  });
  
  it('rejects when required skills unavailable', () => {
    const request = {
      userIntent: 'generate blog post',
      systemContext: { availableSkills: [] }
    };
    expect(() => plannerAgent.plan(request))
      .toThrow('All required skills must be available');
  });
});
```

### Test de Postcondiciones
```typescript
describe('Planner Agent Postconditions', () => {
  it('creates plan with valid dependencies', () => {
    const plan = plannerAgent.plan(validRequest);
    
    expect(hasValidDependencies(plan)).toBe(true);
  });
  
  it('creates plan within constraints', () => {
    const request = {
      ...validRequest,
      constraints: { maxSteps: 3 }
    };
    
    const plan = plannerAgent.plan(request);
    
    expect(plan.steps.length).toBeLessThanOrEqual(3);
  });
});
```

### Test de Invariantes
```typescript
describe('Planner Agent Invariants', () => {
  it('generates idempotent plans', () => {
    const plan1 = plannerAgent.plan(request);
    const plan2 = plannerAgent.plan(request);
    
    expect(plansAreSemanticallyEqual(plan1, plan2)).toBe(true);
  });
  
  it('never creates cyclic dependencies', () => {
    const plan = plannerAgent.plan(complexRequest);
    
    expect(hasCyclicDependencies(plan)).toBe(false);
  });
});
```

## Ejemplos de Uso

### Ejemplo 1: Generación Simple de Post
```typescript
const plan = await plannerAgent.plan({
  userIntent: 'Create a blog post about React hooks',
  systemContext: {
    availableSkills: ['generate_content', 'moderate_content']
  }
});

// Plan resultante:
// 1. generate_content(topic: 'React hooks')
// 2. moderate_content(content: step-1.result)
```

### Ejemplo 2: Workflow Complejo con SEO
```typescript
const plan = await plannerAgent.plan({
  userIntent: 'Create SEO-optimized post about TypeScript with summary',
  systemContext: {
    availableSkills: [
      'generate_content',
      'analyze_seo',
      'moderate_content',
      'summarize_content'
    ]
  },
  constraints: {
    maxSteps: 5,
    priority: 'high'
  }
});

// Plan resultante:
// 1. generate_content(topic: 'TypeScript')
// 2. analyze_seo(content: step-1.result) [parallel]
// 3. moderate_content(content: step-1.result) [parallel]
// 4. summarize_content(content: step-1.result) [depends: step-3]
```

## Protocolo de Comunicación

Usa **PROTOCOL-001 (ACP)** para comunicación con otros agentes.

Ver: `docs/specs/protocols.md#PROTOCOL-001`

## Referencias
- **System Spec**: `docs/specs/system_spec.md`
- **Protocols**: `docs/specs/protocols.md`
- **Invariants**: `docs/specs/invariants.md`
- **Related Agents**: Executor Agent, Coder Agent

---

**Versión**: 1.0.0  
**Fecha**: 2026-02-24  
**Estado**: 🟡 En Desarrollo
