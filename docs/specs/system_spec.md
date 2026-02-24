# System Specification: Blog AI Agéntico

## Objetivo
Construir un sistema de blog personal potenciado por IA, donde múltiples agentes autónomos colaboran para generar, gestionar, moderar y optimizar contenido de manera inteligente, siguiendo principios de Spec-Driven Development.

## Arquitectura del Sistema

### Visión General
El sistema está compuesto por **agentes especializados** que poseen **skills específicas** y colaboran mediante **protocolos de comunicación** estandarizados. Cada agente opera sobre datos validados por **esquemas formales** y respeta **invariantes globales** del sistema.

```
┌─────────────────────────────────────────────────────────┐
│                   BLOG AI SYSTEM                        │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌──────────────┐    ┌──────────────┐                 │
│  │   Planner    │───▶│    Coder     │                 │
│  │    Agent     │    │    Agent     │                 │
│  └──────┬───────┘    └──────┬───────┘                 │
│         │                   │                          │
│         ▼                   ▼                          │
│  ┌──────────────┐    ┌──────────────┐                 │
│  │   Executor   │◀───│   Reviewer   │                 │
│  │    Agent     │    │    Agent     │                 │
│  └──────────────┘    └──────────────┘                 │
│                                                         │
├─────────────────────────────────────────────────────────┤
│                      SKILLS LAYER                       │
├─────────────────────────────────────────────────────────┤
│  • Generate Content    • Summarize Content             │
│  • Moderate Content    • Analyze SEO                   │
│  • Recommend Content   • Chat Interaction              │
└─────────────────────────────────────────────────────────┘
         │                        │
         ▼                        ▼
┌─────────────────┐      ┌─────────────────┐
│   OpenAI API    │      │   Firebase DB   │
└─────────────────┘      └─────────────────┘
```

## Componentes del Sistema

### 1. Agentes (Agents)

#### 1.1 Planner Agent
**Responsabilidad**: Analizar solicitudes de usuario y crear planes de ejecución
- **Input**: User request, system state
- **Output**: Execution plan (secuencia de skills)
- **Spec**: `docs/specs/agent_specs/planner_agent.md`

#### 1.2 Coder Agent
**Responsabilidad**: Generar y transformar contenido (código, posts, resúmenes)
- **Input**: Generation request, context
- **Output**: Generated content, metadata
- **Spec**: `docs/specs/agent_specs/coder_agent.md`

#### 1.3 Reviewer Agent
**Responsabilidad**: Validar calidad, seguridad y SEO del contenido
- **Input**: Content to review, validation rules
- **Output**: Review result, suggestions
- **Spec**: `docs/specs/agent_specs/reviewer_agent.md`

#### 1.4 Executor Agent
**Responsabilidad**: Ejecutar skills y coordinar flujos de trabajo
- **Input**: Execution plan, skill parameters
- **Output**: Execution result, logs
- **Spec**: `docs/specs/agent_specs/executor_agent.md`

### 2. Skills

#### 2.1 Content Generation Skills
- **Generate Blog Post**: Crear contenido original desde topics
- **Summarize Content**: Generar resúmenes concisos
- **Chat Interaction**: Responder preguntas sobre el blog

#### 2.2 Content Management Skills
- **Moderate Content**: Filtrar spam y contenido inapropiado
- **Analyze SEO**: Evaluar y optimizar contenido para búsqueda
- **Recommend Content**: Sugerir posts relacionados

**Specs**: `docs/specs/skill_specs/*.md`

### 3. Data Layer

#### 3.1 Esquemas (Schemas)
Definidos con **Zod** para validación en runtime:
- `BlogPost`: Estructura de posts
- `Comment`: Estructura de comentarios
- `ChatMessage`: Mensajes del chatbot
- `AIGenerationRequest`: Solicitudes a IA
- `AIGenerationResponse`: Respuestas de IA

**Ubicación**: `docs/specs/schemas/*.schema.ts`

#### 3.2 Persistencia
- **Firebase/Firestore**: Datos de posts, comentarios, usuarios
- **OpenAI API**: Generación de contenido IA

### 4. API Layer

#### 4.1 Endpoints Públicos
- `POST /api/ai/chat`: Interacción con chatbot
- `POST /api/ai/summarize`: Generar resúmenes
- `POST /api/ai/generate`: Generar contenido

#### 4.2 Endpoints Internos (Agentes)
- `POST /api/agents/plan`: Crear plan de ejecución
- `POST /api/agents/execute`: Ejecutar skill
- `POST /api/agents/review`: Revisar contenido

**Specs**: `docs/specs/api/*.spec.yaml`

## Invariantes Globales

Ver especificación completa en: `docs/specs/invariants.md`

### INV-001: Validación de Contenido
**Todo contenido generado DEBE pasar moderación antes de publicarse**
```typescript
invariant ContentModeration {
  precondition: content.generated === true
  postcondition: content.moderated === true && content.moderationStatus !== 'rejected'
}
```

### INV-002: Límites de API
**Las llamadas a OpenAI DEBEN respetar rate limits configurados**
```typescript
invariant APIRateLimiting {
  precondition: request.target === 'openai'
  postcondition: rateLimitChecker.isWithinLimits(request) === true
}
```

### INV-003: Validación de Esquemas
**Todos los datos DEBEN validarse con sus esquemas Zod antes de persistir**
```typescript
invariant SchemaValidation {
  precondition: data.toBePersisted === true
  postcondition: schema.safeParse(data).success === true
}
```

### INV-004: Trazabilidad de Agentes
**Cada acción de agente DEBE registrar su origen y resultado**
```typescript
invariant AgentTraceability {
  precondition: agent.execute(action)
  postcondition: auditLog.contains({agent, action, result, timestamp}) === true
}
```

### INV-005: Idempotencia de Skills
**Los skills DEBEN ser idempotentes para mismos inputs**
```typescript
invariant SkillIdempotence {
  precondition: skill.execute(input1) && skill.execute(input1)
  postcondition: result1 === result2 || result1.semanticallyEqual(result2)
}
```

## Protocolos de Comunicación

Ver especificación completa en: `docs/specs/protocols.md`

### Protocol 1: Agent Communication Protocol (ACP)
Formato estándar de mensajes entre agentes:
```typescript
interface AgentMessage {
  from: AgentId;
  to: AgentId;
  type: 'request' | 'response' | 'notification';
  payload: unknown;
  metadata: {
    requestId: string;
    timestamp: Date;
    priority: 'low' | 'medium' | 'high';
  };
}
```

### Protocol 2: Skill Execution Protocol (SEP)
Formato estándar de ejecución de skills:
```typescript
interface SkillExecution {
  skillId: SkillId;
  input: SkillInput;
  context: ExecutionContext;
  preconditions: Condition[];
  postconditions: Condition[];
}
```

### Protocol 3: Content Validation Protocol (CVP)
Pipeline de validación para todo contenido:
```
Content → Schema Validation → Moderation → SEO Analysis → Approval
```

## Flujos de Trabajo Principales

### Flujo 1: Generación de Post
```
User Request
    ↓
Planner Agent (analiza request)
    ↓
Coder Agent (genera contenido)
    ↓
Reviewer Agent (valida calidad + SEO)
    ↓
Executor Agent (persiste en DB)
    ↓
Response to User
```

### Flujo 2: Chat Interaction
```
User Message
    ↓
Planner Agent (determina intent)
    ↓
Executor Agent (ejecuta ChatInteractionSkill)
    ↓
Coder Agent (genera respuesta)
    ↓
Response to User
```

### Flujo 3: Moderación de Comentario
```
Comment Submitted
    ↓
Executor Agent (ejecuta ModerateContentSkill)
    ↓
Reviewer Agent (valida resultado)
    ↓
IF approved → Publish
IF rejected → Notify Admin
```

## Configuración y Environment

### Variables Requeridas
```bash
# OpenAI
OPENAI_API_KEY=sk-proj-...
OPENAI_MODEL=gpt-4o-mini
OPENAI_MAX_TOKENS=4000

# Firebase
FIREBASE_API_KEY=...
FIREBASE_PROJECT_ID=...
FIREBASE_DATABASE_URL=...

# System
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development|production

# Agent Config
AGENT_MAX_RETRIES=3
AGENT_TIMEOUT_MS=30000
SKILL_CACHE_TTL_SECONDS=3600
```

## Métricas y Observabilidad

### Métricas de Agentes
- `agent.execution.count` - Número de ejecuciones
- `agent.execution.duration` - Tiempo de ejecución
- `agent.execution.success_rate` - Tasa de éxito
- `agent.execution.error_rate` - Tasa de error

### Métricas de Skills
- `skill.invocation.count` - Invocaciones por skill
- `skill.cache.hit_rate` - Tasa de cache hits
- `skill.validation.failure_rate` - Fallos de validación

### Métricas de Sistema
- `api.openai.tokens_used` - Tokens consumidos
- `api.openai.cost_usd` - Costo estimado
- `content.moderation.flagged_rate` - Contenido flaggeado

## Testing Strategy

### Niveles de Testing

#### 1. Unit Tests (Skills)
- Cada skill tiene tests de precondiciones
- Cada skill tiene tests de postcondiciones
- Cada skill tiene tests de invariantes

#### 2. Integration Tests (Agents)
- Agent communication protocol
- Agent-skill interaction
- Agent error handling

#### 3. Contract Tests (APIs)
- Request/response schema validation
- OpenAPI spec compliance
- Error response formats

#### 4. E2E Tests (Flujos)
- User journey completo
- Error recovery
- Performance bajo carga

## Extensibilidad

### Agregar Nuevo Agente
1. Crear spec en `agent_specs/[agent_name].md`
2. Definir responsabilidad, inputs, outputs
3. Implementar protocolo de comunicación
4. Agregar tests de contrato
5. Registrar en system registry

### Agregar Nuevo Skill
1. Crear spec en `skill_specs/[skill_name].md`
2. Definir precondiciones y postcondiciones
3. Implementar skill function
4. Generar tests desde spec
5. Registrar en skill registry

### Agregar Nuevo Invariante
1. Documentar en `invariants.md`
2. Implementar validador automático
3. Agregar a CI/CD pipeline
4. Generar tests de invariante

## Referencias

- **Historias de Usuario**: `docs/user-stories/ai-agentica.md`
- **Workflow SDD**: `docs/SPEC_DRIVEN_DEVELOPMENT.md`
- **Invariantes**: `docs/specs/invariants.md`
- **Protocolos**: `docs/specs/protocols.md`
- **Agent Specs**: `docs/specs/agent_specs/`
- **Skill Specs**: `docs/specs/skill_specs/`

## Versión
- **Versión**: 1.0.0
- **Fecha**: 2026-02-24
- **Autor**: System Architect
- **Estado**: 🟡 En Desarrollo

## Changelog
- **v1.0.0** (2026-02-24): Especificación inicial del sistema agéntico
