# Invariantes del Sistema - Blog AI Agéntico

## Definición
Los **invariantes** son condiciones que SIEMPRE deben ser verdaderas en el sistema, independientemente del estado o las operaciones que se ejecuten. Cualquier violación de un invariante indica un error crítico del sistema.

## Formato de Invariantes

```typescript
invariant [ID]: [Nombre] {
  descripción: string;
  precondición: Condition;
  postcondición: Condition;
  validación: ValidationFunction;
  severidad: 'critical' | 'high' | 'medium' | 'low';
  acción_en_fallo: Action;
}
```

---

## Invariantes de Contenido

### INV-CONTENT-001: Validación de Esquema Obligatoria
**Descripción**: Todo contenido debe validarse contra su esquema Zod antes de persistir

**Precondición**:
```typescript
data.readyToPersist === true
```

**Postcondición**:
```typescript
schema.safeParse(data).success === true
```

**Validación**:
```typescript
function validateSchemaInvariant(data: unknown, schema: ZodSchema): boolean {
  const result = schema.safeParse(data);
  if (!result.success) {
    logInvariantViolation('INV-CONTENT-001', result.error);
    return false;
  }
  return true;
}
```

**Severidad**: Critical  
**Acción en Fallo**: Rechazar operación, alertar admins

---

### INV-CONTENT-002: Moderación Obligatoria
**Descripción**: Todo contenido generado por IA debe pasar moderación antes de publicarse

**Precondición**:
```typescript
content.source === 'ai-generated' && 
content.status === 'ready-to-publish'
```

**Postcondición**:
```typescript
content.moderated === true &&
content.moderationResult.flagged === false
```

**Validación**:
```typescript
function validateModerationInvariant(content: AIContent): boolean {
  if (content.source === 'ai-generated' && !content.moderated) {
    logInvariantViolation('INV-CONTENT-002', {
      contentId: content.id,
      reason: 'AI content not moderated'
    });
    return false;
  }
  
  if (content.moderated && content.moderationResult.flagged) {
    logInvariantViolation('INV-CONTENT-002', {
      contentId: content.id,
      reason: 'Flagged content attempted publication'
    });
    return false;
  }
  
  return true;
}
```

**Severidad**: Critical  
**Acción en Fallo**: Bloquear publicación, enviar a revisión manual

---

### INV-CONTENT-003: Longitud de Contenido
**Descripción**: El contenido debe respetar límites de longitud configurados

**Precondición**:
```typescript
content.type in ['post', 'comment', 'message']
```

**Postcondición**:
```typescript
content.length >= CONTENT_MIN_LENGTH[content.type] &&
content.length <= CONTENT_MAX_LENGTH[content.type]
```

**Configuración**:
```typescript
const CONTENT_LIMITS = {
  post: { min: 100, max: 50000 },
  comment: { min: 1, max: 2000 },
  message: { min: 1, max: 4000 },
  excerpt: { min: 50, max: 300 }
};
```

**Severidad**: High  
**Acción en Fallo**: Rechazar contenido, solicitar ajuste

---

## Invariantes de API y Rate Limiting

### INV-API-001: Respeto de Rate Limits de OpenAI
**Descripción**: Las llamadas a OpenAI deben respetar rate limits configurados

**Precondición**:
```typescript
request.target === 'openai'
```

**Postcondición**:
```typescript
rateLimiter.checkLimit(request.userId, 'openai') === true
```

**Validación**:
```typescript
class RateLimiter {
  private limits = {
    openai: {
      requestsPerMinute: 30,
      requestsPerHour: 500,
      tokensPerMinute: 90000
    }
  };

  checkLimit(userId: string, service: string): boolean {
    const usage = this.getUsage(userId, service);
    const limits = this.limits[service];
    
    return (
      usage.requestsThisMinute < limits.requestsPerMinute &&
      usage.requestsThisHour < limits.requestsPerHour &&
      usage.tokensThisMinute < limits.tokensPerMinute
    );
  }
}
```

**Severidad**: High  
**Acción en Fallo**: Queue request, aplicar exponential backoff

---

### INV-API-002: Timeout de Requests
**Descripción**: Ninguna request debe exceder el timeout configurado

**Precondición**:
```typescript
request.startTime !== null
```

**Postcondición**:
```typescript
(Date.now() - request.startTime) <= MAX_REQUEST_TIMEOUT_MS
```

**Configuración**:
```typescript
const TIMEOUTS = {
  chat: 30000,        // 30s
  generate: 60000,    // 60s
  summarize: 20000,   // 20s
  moderate: 10000     // 10s
};
```

**Severidad**: Medium  
**Acción en Fallo**: Cancelar request, retornar error 408

---

## Invariantes de Agentes

### INV-AGENT-001: Trazabilidad Obligatoria
**Descripción**: Toda acción de agente debe registrarse en audit log

**Precondición**:
```typescript
agent.execute(action) === initiated
```

**Postcondición**:
```typescript
auditLog.exists({
  agentId: agent.id,
  actionId: action.id,
  timestamp: Date,
  result: ActionResult
}) === true
```

**Validación**:
```typescript
interface AuditLogEntry {
  id: string;
  agentId: string;
  actionType: string;
  input: unknown;
  output: unknown;
  success: boolean;
  duration: number;
  timestamp: Date;
  metadata: Record<string, unknown>;
}

function logAgentAction(entry: AuditLogEntry): void {
  auditLog.append(entry);
  
  // Validate log was written
  const exists = auditLog.exists(entry.id);
  if (!exists) {
    throw new InvariantViolation('INV-AGENT-001', 'Audit log write failed');
  }
}
```

**Severidad**: Critical  
**Acción en Fallo**: Rollback acción, alertar admins

---

### INV-AGENT-002: Estado Consistente
**Descripción**: El estado del agente debe ser consistente con su última acción

**Precondición**:
```typescript
agent.state.lastAction !== null
```

**Postcondición**:
```typescript
agent.state.status === deriveStatusFromAction(agent.state.lastAction)
```

**Estados Válidos**:
```typescript
type AgentStatus = 
  | 'idle'           // Sin acción pendiente
  | 'planning'       // Creando plan
  | 'executing'      // Ejecutando skill
  | 'reviewing'      // Validando resultado
  | 'error'          // Error en ejecución
  | 'completed';     // Acción completada
```

**Severidad**: High  
**Acción en Fallo**: Reset estado, reintentar última acción

---

### INV-AGENT-003: Límite de Reintentos
**Descripción**: Los agentes no deben reintentar indefinidamente

**Precondición**:
```typescript
action.failed === true
```

**Postcondición**:
```typescript
action.retryCount <= MAX_RETRIES
```

**Configuración**:
```typescript
const RETRY_CONFIG = {
  maxRetries: 3,
  backoffMs: [1000, 2000, 4000],  // Exponential backoff
  retryableErrors: ['TIMEOUT', 'RATE_LIMIT', 'NETWORK_ERROR']
};
```

**Severidad**: Medium  
**Acción en Fallo**: Marcar como fallido permanentemente, notificar

---

## Invariantes de Skills

### INV-SKILL-001: Idempotencia
**Descripción**: Ejecutar un skill múltiples veces con mismo input produce resultado equivalente

**Precondición**:
```typescript
skill.execute(input) === completed
```

**Postcondición**:
```typescript
const result1 = skill.execute(input);
const result2 = skill.execute(input);

result1.equals(result2) || result1.semanticallyEqual(result2)
```

**Validación**:
```typescript
function validateIdempotence(
  skill: Skill,
  input: SkillInput
): boolean {
  const results = [];
  
  for (let i = 0; i < 3; i++) {
    results.push(skill.execute(input));
  }
  
  // All results should be semantically equal
  return results.every((r, i) => 
    i === 0 || results[0].semanticallyEqual(r)
  );
}
```

**Excepciones**: Skills con timestamp, random, o externos no deterministas  
**Severidad**: Medium  
**Acción en Fallo**: Log warning, considerar cachear resultado

---

### INV-SKILL-002: Validación de Precondiciones
**Descripción**: Las precondiciones de un skill deben cumplirse antes de ejecutar

**Precondición**:
```typescript
skill.preconditions.length > 0
```

**Postcondición**:
```typescript
skill.preconditions.every(condition => condition.check() === true)
```

**Validación**:
```typescript
function validatePreconditions(skill: Skill, context: ExecutionContext): boolean {
  for (const precondition of skill.preconditions) {
    if (!precondition.check(context)) {
      logInvariantViolation('INV-SKILL-002', {
        skillId: skill.id,
        failedCondition: precondition.id,
        context
      });
      return false;
    }
  }
  return true;
}
```

**Severidad**: Critical  
**Acción en Fallo**: Rechazar ejecución, retornar error

---

### INV-SKILL-003: Validación de Postcondiciones
**Descripción**: Las postcondiciones deben cumplirse después de ejecutar skill

**Precondición**:
```typescript
skill.execute(input) === completed
```

**Postcondición**:
```typescript
skill.postconditions.every(condition => condition.check(result) === true)
```

**Severidad**: Critical  
**Acción en Fallo**: Rollback operación, marcar skill como fallido

---

## Invariantes de Datos

### INV-DATA-001: Integridad Referencial
**Descripción**: Todas las referencias entre entidades deben ser válidas

**Ejemplos**:
```typescript
// Post debe tener autor válido
post.authorId !== null && users.exists(post.authorId)

// Comment debe referenciar post existente
comment.postId !== null && posts.exists(comment.postId)

// ChatMessage debe tener conversación válida
message.conversationId !== null && conversations.exists(message.conversationId)
```

**Severidad**: Critical  
**Acción en Fallo**: Rechazar operación, validar datos

---

### INV-DATA-002: Timestamps Cronológicos
**Descripción**: Los timestamps deben seguir orden cronológico lógico

**Postcondición**:
```typescript
entity.createdAt <= entity.updatedAt &&
entity.updatedAt <= Date.now()
```

**Severidad**: High  
**Acción en Fallo**: Corregir timestamps, log anomalía

---

### INV-DATA-003: No Duplicación de IDs
**Descripción**: Los IDs deben ser únicos en su colección

**Postcondición**:
```typescript
collection.find({ id: entity.id }).length === 1
```

**Severidad**: Critical  
**Acción en Fallo**: Rechazar inserción, generar nuevo ID

---

## Sistema de Validación Automática

### Implementación
```typescript
class InvariantValidator {
  private invariants: Map<string, Invariant> = new Map();
  
  register(invariant: Invariant): void {
    this.invariants.set(invariant.id, invariant);
  }
  
  validate(context: ValidationContext): ValidationResult {
    const violations: InvariantViolation[] = [];
    
    for (const [id, invariant] of this.invariants) {
      if (!invariant.check(context)) {
        violations.push({
          invariantId: id,
          severity: invariant.severity,
          context,
          timestamp: new Date()
        });
      }
    }
    
    return {
      valid: violations.length === 0,
      violations
    };
  }
  
  async validateAndEnforce(
    context: ValidationContext
  ): Promise<void> {
    const result = this.validate(context);
    
    if (!result.valid) {
      for (const violation of result.violations) {
        await this.handleViolation(violation);
      }
      
      throw new InvariantViolationError(result.violations);
    }
  }
  
  private async handleViolation(
    violation: InvariantViolation
  ): Promise<void> {
    // Log
    logger.error('Invariant violation', violation);
    
    // Alert if critical
    if (violation.severity === 'critical') {
      await alerting.notifyAdmins(violation);
    }
    
    // Execute recovery action
    const invariant = this.invariants.get(violation.invariantId);
    if (invariant?.recoveryAction) {
      await invariant.recoveryAction(violation.context);
    }
  }
}
```

### Integración en CI/CD
```yaml
# .github/workflows/validate-invariants.yml
name: Validate Invariants

on: [push, pull_request]

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Run Invariant Tests
        run: npm run test:invariants
      - name: Check Invariant Coverage
        run: npm run invariants:coverage
```

### Tests de Invariantes
```typescript
// tests/invariants/content.test.ts
describe('Content Invariants', () => {
  it('INV-CONTENT-001: validates schema before persist', async () => {
    const invalidPost = { title: 'Test' }; // Missing required fields
    
    await expect(
      persistPost(invalidPost)
    ).rejects.toThrow('Schema validation failed');
  });
  
  it('INV-CONTENT-002: requires moderation for AI content', async () => {
    const aiContent = generateContent({ topic: 'Test' });
    aiContent.moderated = false;
    
    await expect(
      publishContent(aiContent)
    ).rejects.toThrow('Moderation required');
  });
});
```

## Monitoreo de Invariantes

### Métricas
- `invariant.violations.count` - Total de violaciones
- `invariant.violations.by_id` - Violaciones por invariante
- `invariant.violations.by_severity` - Violaciones por severidad
- `invariant.recovery.success_rate` - Tasa de recuperación exitosa

### Dashboards
- Panel de violaciones en tiempo real
- Histórico de violaciones por invariante
- Alertas automáticas para violaciones críticas

## Documentación de Invariantes

Cada invariante debe documentarse con:
1. **ID único**: INV-[CATEGORY]-[NUMBER]
2. **Descripción clara** del invariante
3. **Precondiciones y postcondiciones** formales
4. **Función de validación** implementable
5. **Severidad** del fallo
6. **Acción de recuperación** definida
7. **Tests** que validan el invariante

## Referencias
- **System Spec**: `docs/specs/system_spec.md`
- **Agent Specs**: `docs/specs/agent_specs/`
- **Skill Specs**: `docs/specs/skill_specs/`
- **Protocols**: `docs/specs/protocols.md`

---

**Versión**: 1.0.0  
**Fecha**: 2026-02-24  
**Estado**: 🟡 En Desarrollo
