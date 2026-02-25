# 📋 Sistema Agéntico: Índice de Especificaciones

## 🎯 Objetivo

Este repositorio contiene un **sistema agéntico completamente especificado** para un blog con capacidades de IA, siguiendo metodología **Spec-Driven Development (SDD)**.

---

## 📂 Estructura de Documentación

```
docs/
├── specs/
│   ├── system_spec.md                 # 🏛️  ARQUITECTURA CENTRAL
│   ├── invariants.md                  # ⚖️  17 Invariantes del Sistema
│   ├── protocols.md                   # 📡 5 Protocolos de Comunicación
│   ├── VALIDATION_REPORT.md          # 🔍 Reporte de Validación Código vs Specs
│   │
│   ├── agent_specs/                   # 🤖 AGENTES (4)
│   │   ├── planner_agent.md          #     - Planificación y análisis
│   │   ├── coder_agent.md            #     - Generación de contenido
│   │   ├── reviewer_agent.md         #     - Validación y calidad
│   │   └── executor_agent.md         #     - Ejecución y coordinación
│   │
│   └── skill_specs/                   # 🛠️  SKILLS (6)
│       ├── generate_content_skill.md  #     - Generación de posts
│       ├── summarize_content_skill.md #     - Resúmenes
│       ├── moderate_content_skill.md  #     - Moderación de contenido
│       ├── analyze_seo_skill.md       #     - Análisis SEO
│       ├── recommend_content_skill.md #     - Recomendaciones
│       └── chat_interaction_skill.md  #     - Chatbot conversacional
│
├── user-stories/
│   ├── ai-agentica.md                 # 📖 6 User Stories (55 pts)
│   └── spec-driven-development.md     # 📖 8 User Stories (81 pts)
│
├── SPEC_DRIVEN_DEVELOPMENT.md        # 📚 Guía de Metodología SDD
└── IMPLEMENTATION_SUMMARY.md         # 📊 Resumen de Implementación
```

---

## 🏛️ Documentos Centrales

### 1. [system_spec.md](specs/system_spec.md)
**Especificación arquitectónica del sistema completo**

- 🎯 Arquitectura Multi-Agente (4 agentes especializados)
- 🛠️ Skill Layer (6 skills modulares)
- 📊 Data Layer (Firebase/Firestore)
- 🌐 API Layer (Next.js Edge Functions)
- ⚖️ 5 Invariantes Globales
- 📡 5 Protocolos de Comunicación

**Inicio Recomendado**: Lee este documento primero para entender el sistema completo.

---

### 2. [invariants.md](specs/invariants.md)
**17 Invariantes que SIEMPRE deben cumplirse**

#### Categorías:
- **Content Invariants** (INV-CONTENT-001 a 002): Validación de schemas, moderación obligatoria
- **API Invariants** (INV-API-001 a 004): Rate limits, autenticación, idempotencia, versionado
- **Agent Invariants** (INV-AGENT-001 a 003): Traceabilidad, stateless, timeouts
- **Skill Invariants** (INV-SKILL-001 a 003): Idempotencia, validación, costo
- **Data Invariants** (INV-DATA-001 a 002): Integridad referencial, registro de cambios

---

### 3. [protocols.md](specs/protocols.md)
**5 Protocolos formales de comunicación**

- **PROTOCOL-001 (ACP)**: Agent Communication Protocol
- **PROTOCOL-002 (SEP)**: Skill Execution Protocol
- **PROTOCOL-003 (CVP)**: Content Validation Pipeline
- **PROTOCOL-004 (ENP)**: Event Notification Protocol
- **PROTOCOL-005 (EHP)**: Error Handling Protocol

Cada protocolo incluye:
- Estructura de mensajes (TypeScript interfaces)
- Ejemplos de uso
- Flow diagrams

---

### 4. [VALIDATION_REPORT.md](specs/VALIDATION_REPORT.md)
**📊 Reporte de validación: Código existente vs Especificaciones**

#### Métricas Clave:
- **Alineación Global**: ~22%
- **Skills**: 30-40% implementados (outputs simplificados)
- **Agentes**: 0-20% implementados (funciones sueltas, no cohesivos)
- **Protocols**: 0% implementados
- **Invariants**: 0% validados en runtime

#### Problemas Críticos Identificados:
1. ❌ Skills no retornan outputs completos (faltan métricas, metadata)
2. ❌ No hay validación de precondiciones/postcondiciones
3. ❌ Agentes no existen como entidades
4. ❌ Protocols no implementados
5. ❌ Tests derivados de specs no existen

---

## 🤖 Especificaciones de Agentes

### [Planner Agent](specs/agent_specs/planner_agent.md)
**Responsabilidad**: Analizar requests y crear execution plans

**Inputs**: `PlanningRequest { userIntent, systemContext, constraints }`  
**Outputs**: `ExecutionPlan { steps[], dependencies, estimatedDuration, estimatedCost }`

**Algoritmo**:
1. Analizar intención del usuario
2. Seleccionar skills necesarios
3. Secuenciar steps con dependencias
4. Optimizar plan (minimizar costo/duración)

**Precondiciones**: ValidRequest, SkillsAvailable, SufficientResources  
**Postcondiciones**: CompletePlan, ValidDependencies, LogicalOrder  
**Invariantes**: PlanIdempotence, NoCyclicDependencies

---

### [Coder Agent](specs/agent_specs/coder_agent.md)
**Responsabilidad**: Generar y transformar contenido usando IA

**Skills Soportados**:
- `blog_post`: Generar posts completos con markdown
- `summary`: Resumir contenido existente
- `chat_response`: Responder preguntas conversacionales
- `seo_metadata`: Generar títulos y meta descriptions
- `title_suggestions`: Proponer títulos alternativos

**Precondiciones**: ValidInput, RateLimitCheck, APIKeyConfigured  
**Postcondiciones**: ContentGenerated, CompleteMetadata, WithinTokenLimits  
**Invariantes**: DeterministicGeneration (temp=0), ReasonableCost (<$1)

---

### [Reviewer Agent](specs/agent_specs/reviewer_agent.md)
**Responsabilidad**: Validar contenido (calidad, seguridad, SEO)

**Reviews Implementados**:
- **Moderation Review**: OpenAI Moderation API (hate, harassment, violence, etc.)
- **SEO Review**: Score 0-100, análisis de keywords, legibilidad, estructura
- **Quality Review**: Coherencia, completitud, precisión, engagement
- **Style Review**: Compliance con guía de estilo, consistencia de tono

**Precondiciones**: NonEmptyContent, ValidReviewType, OpenAIAvailable  
**Postcondiciones**: CompleteReview, ValidScore (0-100), ConsistentApproval  
**Invariantes**: DeterministicModeration, FlaggedContentRejected

---

### [Executor Agent](specs/agent_specs/executor_agent.md)
**Responsabilidad**: Ejecutar planes y coordinar skills

**Capacidades**:
- Ejecutar steps en orden con dependencias
- Manejar reintentos con exponential backoff
- Pasar datos entre steps (data store)
- Registrar auditoría completa
- Ejecutar steps en paralelo (si no tienen dependencias)

**Precondiciones**: ValidPlan, SkillsAvailable, NoCyclicDependencies  
**Postcondiciones**: AllStepsProcessed, CompleteAuditLog, ConsistentStatus  
**Invariantes**: ExecutionOrder, AuditLogCompleteness

---

## 🛠️ Especificaciones de Skills

### [SKILL-001: Generate Content](specs/skill_specs/generate_content_skill.md)
**Objetivo**: Generar blog posts originales con IA

**Inputs**:
```typescript
{
  topic: string;
  length: 'short' | 'medium' | 'long';
  tone: 'professional' | 'casual' | 'technical' | 'conversational';
  outline?: string[];
  keywords?: string[];
}
```

**Outputs**:
```typescript
{
  content: { title, slug, excerpt, body, tags, category, readingTimeMinutes },
  metadata: { wordCount, qualityScore, complexity },
  usage: { tokensUsed, costUSD, durationMs }
}
```

**Invariantes**:
- INV-GEN-001: Keywords presentes (70% si proporcionados)
- INV-GEN-002: Outline respetado (80% si proporcionado)
- INV-GEN-003: Costo <= $0.50

---

### [SKILL-002: Summarize Content](specs/skill_specs/summarize_content_skill.md)
**Objetivo**: Generar resúmenes concisos preservando ideas clave

**Invariantes**:
- INV-SUM-001: Compression ratio 5-50% (razonable)
- INV-SUM-002: Coherence score >= 70

**Outputs**: summary, keyPoints[3-7], metrics, metadata

---

### [SKILL-003: Moderate Content](specs/skill_specs/moderate_content_skill.md)
**Objetivo**: Validar contenido contra políticas de seguridad

**Checks**:
- OpenAI Moderation API (hate, harassment, violence, sexual, self-harm)
- Spam detection (links excesivos, repetición, keywords)
- Malicious links detection

**Invariantes**:
- INV-MOD-001: Flagged content → approved = false
- INV-MOD-002: Critical violations con confidence >= 0.8
- INV-MOD-003: Determinista (mismo input → mismo output)

---

### [SKILL-004: Analyze SEO](specs/skill_specs/analyze_seo_skill.md)
**Objetivo**: Analizar y optimizar contenido para SEO

**Análisis Incluidos**:
1. **Title**: Longitud óptima (50-60 chars), keywords
2. **Meta**: Excerpt 150-160 chars
3. **Content**: Word count, heading structure, keyword density
4. **Keywords**: Posiciones (title, h1, h2, body), density 1-3%
5. **Readability**: Flesch Reading Ease (0-100)
6. **Technical**: Images (alt text), links (internal/external), slug

**Score**: 0-100 agregado de componentes

**Invariantes**:
- INV-SEO-001: Score derivado de componentes (avg ± 5)
- INV-SEO-002: Score bajo → issues documentados

---

### [SKILL-005: Recommend Content](specs/skill_specs/recommend_content_skill.md)
**Objetivo**: Generar recomendaciones personalizadas

**Algoritmo Híbrido**:
- **User Preference Score** (40 pts): Categorías favoritas, tags, longitud
- **Content Similarity** (40 pts): Tag overlap, misma categoría, keywords
- **Trending Score** (20 pts): Recency, view count, like count

**Invariantes**:
- INV-REC-001: Scores válidos (0-100)
- INV-REC-002: Razones suman score (± 10)
- INV-REC-003: Sin duplicados

---

### [SKILL-006: Chat Interaction](specs/skill_specs/chat_interaction_skill.md)
**Objetivo**: Chatbot conversacional con conocimiento del blog

**Capacidades**:
- Detectar intención (question, chitchat, help, feedback, off-topic)
- Buscar posts relevantes del blog
- Generar follow-up suggestions
- Mantener contexto de conversación

**Invariantes**:
- INV-CHAT-001: Response <= maxLength (± 10%)
- INV-CHAT-002: Intent confidence >= 0.6
- INV-CHAT-003: Sources relevantes (score >= 0.5)

---

## 📖 User Stories

### [AI Agentica - 6 Stories (55 pts)](user-stories/ai-agentica.md)

1. **US-AI-001**: Chat Assistant Inteligente (8 pts)
2. **US-AI-002**: Auto-Summarization (5 pts)
3. **US-AI-003**: Content Generator (8 pts)
4. **US-AI-004**: Recomendaciones Personalizadas (13 pts)
5. **US-AI-005**: Moderación Automática (8 pts)
6. **US-AI-006**: SEO Optimization Agent (13 pts)

### [Spec-Driven Development - 8 Stories (81 pts)](user-stories/spec-driven-development.md)

1. **US-SDD-001**: Component Specifications (5 pts)
2. **US-SDD-002**: Automated Validation (13 pts)
3. **US-SDD-003**: Test Generation from Specs (13 pts)
4. **US-SDD-004**: API Contract Specifications (8 pts)
5. **US-SDD-005**: State Machine Definitions (13 pts)
6. **US-SDD-006**: Database Schema Contracts (8 pts)
7. **US-SDD-007**: Living Documentation (8 pts)
8. **US-SDD-008**: Contract Testing (13 pts)

**Total**: 136 Story Points

---

## 🚀 Próximos Pasos

### Fase 1: Refactor Skills (Prioridad Alta)

1. Crear `src/lib/skills/base.ts` con interfaz base
2. Implementar skills completos con outputs según specs
3. Agregar validación de precondiciones/postcondiciones
4. Agregar verificación de invariantes
5. Actualizar API routes

**Impacto**: Alineación 22% → 60%

### Fase 2: Implementar Agentes

1. Crear estructura de agentes en `src/lib/agents/`
2. Implementar Coder Agent (agrupa skills de generación)
3. Implementar Reviewer Agent (agrupa skills de validación)
4. Implementar Planner Agent
5. Implementar Executor Agent

**Impacto**: Alineación 60% → 80%

### Fase 3: Protocols y Validación

1. Implementar Agent Communication Protocol (ACP)
2. Implementar Skill Execution Protocol (SEP)
3. Crear sistema de validación de invariantes
4. Agregar middleware de auditoría
5. Implementar event notifications

**Impacto**: Alineación 80% → 95%

### Fase 4: Testing

1. Generar tests unitarios de precondiciones
2. Generar tests de postcondiciones
3. Generar tests de invariantes
4. Implementar contract testing (Pact/OpenAPI)
5. Integrar con CI/CD

---

## 📊 Estado Actual

| Componente | Spec | Código | Alineación |
|------------|------|--------|------------|
| **Especificaciones** | ✅ 100% | - | - |
| **Skills** | ✅ | ⚠️ 35% | 🟠 Medio |
| **Agentes** | ✅ | ❌ 10% | 🔴 Bajo |
| **Protocols** | ✅ | ❌ 0% | 🔴 Crítico |
| **Invariants** | ✅ | ❌ 0% | 🔴 Crítico |
| **Tests** | ✅ | ❌ 0% | 🔴 Crítico |

**Alineación Global**: ~22%

---

## 📚 Metodología SDD

### Principios Clave

1. **Specs son Source of Truth**: El código se deriva de las especificaciones
2. **Sistema Agéntico**: Múltiples agentes especializados coordinados
3. **Orden de Trabajo**:
   - Leer spec → Identificar contratos → Generar código → Validar
4. **Formato de Specs**:
   - Objetivo/Responsabilidad
   - Inputs/Outputs (TypeScript interfaces)
   - Precondiciones/Postcondiciones
   - Invariantes
   - Algoritmos
   - Tests

### Ventajas

✅ **Verificabilidad**: Código puede validarse contra contratos formales  
✅ **Mantenibilidad**: Specs documentan intención y restricciones  
✅ **Extensibilidad**: Nuevos agentes/skills siguen mismo patrón  
✅ **Calidad**: Tests derivados de invariantes  
✅ **Colaboración**: Specs como lenguaje común

---

## 🔗 Referencias Rápidas

- **Arquitectura**: [system_spec.md](specs/system_spec.md)
- **Validación**: [VALIDATION_REPORT.md](specs/VALIDATION_REPORT.md)
- **Metodología**: [SPEC_DRIVEN_DEVELOPMENT.md](SPEC_DRIVEN_DEVELOPMENT.md)
- **Implementación**: [IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md)

---

## 🤝 Contribución

Para agregar nuevos agentes o skills:

1. Crear spec en `docs/specs/agent_specs/` o `docs/specs/skill_specs/`
2. Seguir formato estándar (ver specs existentes)
3. Definir precondiciones, postcondiciones, invariantes
4. Implementar código derivado de spec
5. Generar tests de contratos
6. Actualizar VALIDATION_REPORT.md

---

**Versión**: 1.0.0  
**Fecha**: 2026-02-24  
**Mantenedor**: Sistema de Especificación Agéntica
