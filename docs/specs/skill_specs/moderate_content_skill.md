# Skill Specification: Moderate Content

## Identificador
**SKILL-003**: `moderate_content`

## Objetivo
Validar contenido para garantizar que cumple con políticas de seguridad, no contiene material ofensivo, ilegal o perjudicial, utilizando OpenAI Moderation API y reglas personalizadas.

## Responsabilidades
1. Detectar contenido ofensivo, hate speech, violencia, contenido sexual
2. Identificar spam y contenido malicioso
3. Verificar cumplimiento de políticas de contenido
4. Generar reportes detallados de moderación
5. Proveer recomendaciones correctivas

## Inputs

### ModerateContentInput
```typescript
interface ModerateContentInput {
  content: string | ContentToModerate;
  
  strictness?: 'low' | 'medium' | 'high';  // Default: 'medium'
  
  checkTypes?: ModerationCheckType[];  // Default: all types
  
  context?: {
    userId?: string;
    postId?: string;
    previousViolations?: number;
  };
}

interface ContentToModerate {
  title?: string;
  body?: string;
  tags?: string[];
  excerpt?: string;
}

type ModerationCheckType =
  | 'hate'
  | 'hate/threatening'
  | 'harassment'
  | 'harassment/threatening'
  | 'self-harm'
  | 'self-harm/intent'
  | 'self-harm/instructions'
  | 'sexual'
  | 'sexual/minors'
  | 'violence'
  | 'violence/graphic'
  | 'spam'
  | 'malicious-links';
```

### Ejemplo de Input
```typescript
const input: ModerateContentInput = {
  content: {
    title: 'Cómo construir una API REST con Node.js',
    body: 'En este tutorial aprenderás...',
    tags: ['Node.js', 'API', 'REST']
  },
  strictness: 'medium',
  checkTypes: ['hate', 'harassment', 'spam'],
  context: {
    userId: 'user-123',
    postId: 'post-456',
    previousViolations: 0
  }
};
```

## Outputs

### ModerateContentOutput
```typescript
interface ModerateContentOutput {
  approved: boolean;
  
  flagged: boolean;
  
  violations: Violation[];
  
  scores: ModerationScores;
  
  recommendations: string[];
  
  metadata: ModerationMetadata;
}

interface Violation {
  type: ModerationCheckType;
  severity: 'low' | 'medium' | 'high' | 'critical';
  confidence: number;          // 0-1
  excerpt?: string;            // Problematic excerpt
  reason: string;
  suggestedAction: 'warn' | 'edit' | 'block' | 'review';
}

interface ModerationScores {
  hate: number;
  harassment: number;
  selfHarm: number;
  sexual: number;
  violence: number;
  spam: number;
  overall: number;             // Aggregate risk score 0-100
}

interface ModerationMetadata {
  checkedAt: Date;
  checkDuration: number;
  apiUsed: string;
  strictnessLevel: string;
  autoDecision: boolean;       // If decision was automatic
}
```

### Ejemplo de Output
```typescript
const output: ModerateContentOutput = {
  approved: true,
  flagged: false,
  violations: [],
  
  scores: {
    hate: 0.002,
    harassment: 0.001,
    selfHarm: 0.0001,
    sexual: 0.0003,
    violence: 0.0005,
    spam: 0.01,
    overall: 2.5
  },
  
  recommendations: [
    'Content appears safe for publication',
    'Consider adding more descriptive tags'
  ],
  
  metadata: {
    checkedAt: new Date(),
    checkDuration: 450,
    apiUsed: 'openai-moderation-stable',
    strictnessLevel: 'medium',
    autoDecision: true
  }
};
```

## Precondiciones

### PRE-MOD-001: Contenido No Vacío
```typescript
precondition NonEmptyContent {
  check: (input: ModerateContentInput) => {
    if (typeof input.content === 'string') {
      return input.content.trim().length > 0;
    }
    
    const contentObj = input.content;
    return (
      (contentObj.title?.trim().length ?? 0) > 0 ||
      (contentObj.body?.trim().length ?? 0) > 0
    );
  };
  message: "Content to moderate must not be empty";
}
```

### PRE-MOD-002: Moderation API Disponible
```typescript
precondition ModerationAPIAvailable {
  check: async () => {
    try {
      const testModeration = await openai.moderations.create({
        input: 'test'
      });
      return true;
    } catch {
      return false;
    }
  };
  message: "OpenAI Moderation API must be available";
}
```

## Postcondiciones

### POST-MOD-001: Decisión Clara
```typescript
postcondition ClearDecision {
  check: (output: ModerateContentOutput) => {
    // Must have a clear approval decision
    return typeof output.approved === 'boolean';
  };
  message: "Moderation must produce clear approval decision";
}
```

### POST-MOD-002: Violations Documentadas
```typescript
postcondition ViolationsDocumented {
  check: (output: ModerateContentOutput) => {
    if (output.flagged) {
      return output.violations.length > 0;
    }
    return true;
  };
  message: "If flagged, must document at least one violation";
}
```

### POST-MOD-003: Scores Válidos
```typescript
postcondition ValidScores {
  check: (output: ModerateContentOutput) => {
    return Object.values(output.scores).every(score =>
      score >= 0 && score <= 100
    );
  };
  message: "All moderation scores must be between 0 and 100";
}
```

## Invariantes

### INV-MOD-001: Aprobación Consistente
**Flagged content cannot be approved**
```typescript
invariant ConsistentApproval {
  check: (output: ModerateContentOutput) => {
    if (output.flagged) {
      return output.approved === false;
    }
    return true;
  };
}
```

### INV-MOD-002: Alta Confianza en Bloqueos
**Critical violations must have high confidence**
```typescript
invariant HighConfidenceCritical {
  check: (output: ModerateContentOutput) => {
    const criticalViolations = output.violations.filter(v =>
      v.severity === 'critical'
    );
    
    return criticalViolations.every(v => v.confidence >= 0.8);
  };
}
```

### INV-MOD-003: Determinismo
**Same content produces same result (no randomness)**
```typescript
invariant Deterministic {
  check: async (input: ModerateContentInput) => {
    const result1 = await moderateContent(input);
    const result2 = await moderateContent(input);
    
    return (
      result1.approved === result2.approved &&
      result1.flagged === result2.flagged &&
      result1.violations.length === result2.violations.length
    );
  };
}
```

## Algoritmo

### Fase 1: Normalización de Contenido
```typescript
function normalizeContent(input: ModerateContentInput): string {
  if (typeof input.content === 'string') {
    return input.content;
  }
  
  const parts: string[] = [];
  
  if (input.content.title) {
    parts.push(`Title: ${input.content.title}`);
  }
  
  if (input.content.excerpt) {
    parts.push(`Excerpt: ${input.content.excerpt}`);
  }
  
  if (input.content.body) {
    parts.push(`Body: ${input.content.body}`);
  }
  
  if (input.content.tags && input.content.tags.length > 0) {
    parts.push(`Tags: ${input.content.tags.join(', ')}`);
  }
  
  return parts.join('\n\n');
}
```

### Fase 2: Moderación con OpenAI
```typescript
async function moderateContent(
  input: ModerateContentInput
): Promise<ModerateContentOutput> {
  const startTime = Date.now();
  
  const contentText = normalizeContent(input);
  
  // Call OpenAI Moderation API
  const moderationResponse = await openai.moderations.create({
    input: contentText,
    model: 'text-moderation-stable'
  });
  
  const result = moderationResponse.results[0];
  
  // Convert scores to 0-100 scale
  const scores: ModerationScores = {
    hate: result.category_scores.hate * 100,
    harassment: result.category_scores.harassment * 100,
    selfHarm: result.category_scores['self-harm'] * 100,
    sexual: result.category_scores.sexual * 100,
    violence: result.category_scores.violence * 100,
    spam: await checkSpam(contentText),
    overall: 0  // Will be calculated
  };
  
  // Calculate overall risk score
  scores.overall = calculateOverallRisk(scores);
  
  // Determine violations
  const violations = identifyViolations(
    result,
    scores,
    input.strictness || 'medium'
  );
  
  // Check for spam and malicious links
  if (input.checkTypes?.includes('spam')) {
    const spamViolation = await checkForSpam(contentText);
    if (spamViolation) violations.push(spamViolation);
  }
  
  if (input.checkTypes?.includes('malicious-links')) {
    const linkViolation = await checkMaliciousLinks(contentText);
    if (linkViolation) violations.push(linkViolation);
  }
  
  // Adjust for user history
  if (input.context?.previousViolations && input.context.previousViolations > 0) {
    adjustForHistory(violations, input.context.previousViolations);
  }
  
  // Make decision
  const flagged = violations.length > 0;
  const approved = !flagged || violations.every(v =>
    v.severity === 'low' && v.suggestedAction === 'warn'
  );
  
  // Generate recommendations
  const recommendations = generateRecommendations(violations, scores);
  
  const checkDuration = Date.now() - startTime;
  
  return {
    approved,
    flagged,
    violations,
    scores,
    recommendations,
    metadata: {
      checkedAt: new Date(),
      checkDuration,
      apiUsed: 'openai-moderation-stable',
      strictnessLevel: input.strictness || 'medium',
      autoDecision: violations.every(v => v.confidence >= 0.9)
    }
  };
}
```

### Fase 3: Identificación de Violaciones
```typescript
function identifyViolations(
  result: ModerationResult,
  scores: ModerationScores,
  strictness: string
): Violation[] {
  const violations: Violation[] = [];
  
  const thresholds = getThresholds(strictness);
  
  // Check each category
  const checks: Array<[ModerationCheckType, number, string]> = [
    ['hate', scores.hate, 'Hate speech detected'],
    ['harassment', scores.harassment, 'Harassment detected'],
    ['self-harm', scores.selfHarm, 'Self-harm content detected'],
    ['sexual', scores.sexual, 'Sexual content detected'],
    ['violence', scores.violence, 'Violent content detected']
  ];
  
  for (const [type, score, reason] of checks) {
    if (score > thresholds[type]) {
      violations.push({
        type,
        severity: determineSeverity(score, thresholds[type]),
        confidence: score / 100,
        reason,
        suggestedAction: determineSuggestedAction(score, thresholds[type])
      });
    }
  }
  
  return violations;
}

function getThresholds(strictness: string): Record<string, number> {
  const thresholdSets = {
    low: {
      hate: 50,
      harassment: 50,
      'self-harm': 30,
      sexual: 60,
      violence: 50,
      spam: 70
    },
    medium: {
      hate: 30,
      harassment: 30,
      'self-harm': 20,
      sexual: 40,
      violence: 30,
      spam: 50
    },
    high: {
      hate: 15,
      harassment: 15,
      'self-harm': 10,
      sexual: 25,
      violence: 15,
      spam: 30
    }
  };
  
  return thresholdSets[strictness] || thresholdSets.medium;
}
```

### Fase 4: Detección de Spam
```typescript
async function checkSpam(content: string): Promise<number> {
  let spamScore = 0;
  
  // Check for excessive links
  const linkCount = (content.match(/https?:\/\//g) || []).length;
  if (linkCount > 5) spamScore += 20;
  if (linkCount > 10) spamScore += 30;
  
  // Check for repeated phrases
  const words = content.toLowerCase().split(/\s+/);
  const wordFreq = new Map<string, number>();
  words.forEach(word => {
    wordFreq.set(word, (wordFreq.get(word) || 0) + 1);
  });
  
  const maxFreq = Math.max(...wordFreq.values());
  if (maxFreq > words.length * 0.1) {
    spamScore += 15;
  }
  
  // Check for common spam keywords
  const spamKeywords = [
    'click here', 'buy now', 'limited time', 'act now',
    'free money', 'guaranteed', 'no risk', 'winner'
  ];
  
  const contentLower = content.toLowerCase();
  const spamKeywordCount = spamKeywords.filter(kw =>
    contentLower.includes(kw)
  ).length;
  
  spamScore += spamKeywordCount * 10;
  
  // Check for excessive capitalization
  const capsRatio = (content.match(/[A-Z]/g) || []).length / content.length;
  if (capsRatio > 0.3) spamScore += 20;
  
  return Math.min(spamScore, 100);
}

async function checkMaliciousLinks(content: string): Promise<Violation | null> {
  const links = content.match(/https?:\/\/[^\s]+/g) || [];
  
  // Check against known malicious domains (simplified)
  const suspiciousDomains = [
    'bit.ly', 'tinyurl.com', 't.co'  // URL shorteners often used in spam
  ];
  
  for (const link of links) {
    try {
      const url = new URL(link);
      if (suspiciousDomains.some(domain => url.hostname.includes(domain))) {
        return {
          type: 'malicious-links',
          severity: 'medium',
          confidence: 0.6,
          excerpt: link,
          reason: 'Suspicious shortened URL detected',
          suggestedAction: 'review'
        };
      }
    } catch {
      // Invalid URL, flag it
      return {
        type: 'malicious-links',
        severity: 'low',
        confidence: 0.8,
        excerpt: link,
        reason: 'Malformed URL detected',
        suggestedAction: 'edit'
      };
    }
  }
  
  return null;
}
```

### Fase 5: Recomendaciones
```typescript
function generateRecommendations(
  violations: Violation[],
  scores: ModerationScores
): string[] {
  const recommendations: string[] = [];
  
  if (violations.length === 0) {
    recommendations.push('Content appears safe for publication');
    
    if (scores.overall < 5) {
      recommendations.push('Excellent content quality from moderation perspective');
    }
  } else {
    // Group by severity
    const criticalViolations = violations.filter(v => v.severity === 'critical');
    const highViolations = violations.filter(v => v.severity === 'high');
    
    if (criticalViolations.length > 0) {
      recommendations.push('CRITICAL: This content violates platform policies and cannot be published');
      criticalViolations.forEach(v => {
        recommendations.push(`- ${v.reason}`);
      });
    }
    
    if (highViolations.length > 0) {
      recommendations.push('Content requires significant revision before publication');
      highViolations.forEach(v => {
        recommendations.push(`- ${v.reason}`);
      });
    }
    
    // Suggest actions
    const editActions = violations.filter(v => v.suggestedAction === 'edit');
    if (editActions.length > 0) {
      recommendations.push('Consider editing the following sections:');
      editActions.forEach(v => {
        if (v.excerpt) {
          recommendations.push(`- "${v.excerpt.substring(0, 50)}..."`);
        }
      });
    }
  }
  
  return recommendations;
}
```

## Métricas

- `skill.moderate_content.invocations` - Total invocaciones
- `skill.moderate_content.approval_rate` - Tasa de aprobación
- `skill.moderate_content.flagged_rate` - Tasa de contenido flagged
- `skill.moderate_content.avg_score` - Score promedio de riesgo
- `skill.moderate_content.violations_by_type` - Distribución de violaciones

## Tests

### Test de Precondiciones
```typescript
describe('Moderate Content Skill - Preconditions', () => {
  it('rejects empty content', async () => {
    const input = { content: '' };
    
    await expect(moderateContentSkill.execute(input))
      .rejects.toThrow('must not be empty');
  });
});
```

### Test de Invariantes
```typescript
describe('Moderate Content Skill - Invariants', () => {
  it('never approves flagged content', async () => {
    const input = {
      content: 'violating content...'
    };
    
    const output = await moderateContentSkill.execute(input);
    
    if (output.flagged) {
      expect(output.approved).toBe(false);
    }
  });
  
  it('is deterministic', async () => {
    const input = { content: 'Test content' };
    
    const result1 = await moderateContentSkill.execute(input);
    const result2 = await moderateContentSkill.execute(input);
    
    expect(result1.approved).toBe(result2.approved);
    expect(result1.flagged).toBe(result2.flagged);
  });
});
```

## Protocolo

Usa **PROTOCOL-002 (Skill Execution Protocol)**.

Ver: `docs/specs/protocols.md`

## Referencias
- **System Spec**: `docs/specs/system_spec.md`
- **Reviewer Agent**: `docs/specs/agent_specs/reviewer_agent.md`
- **Invariants**: INV-CONTENT-002

---

**Versión**: 1.0.0  
**Fecha**: 2026-02-24  
**Estado**: 🟡 En Desarrollo
