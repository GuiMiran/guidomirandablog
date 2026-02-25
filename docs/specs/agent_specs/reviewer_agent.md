# Agent Specification: Reviewer Agent

## Objetivo
Validar calidad, seguridad, SEO y conformidad de contenido generado antes de su publicación o ejecución.

## Responsabilidad
El **Reviewer Agent** es responsable de:
1. Validar calidad del contenido generado
2. Ejecutar moderación de contenido
3. Analizar SEO y optimización
4. Verificar cumplimiento de guías de estilo
5. Detectar problemas de seguridad
6. Proporcionar sugerencias de mejora

## Inputs

### ReviewRequest
```typescript
interface ReviewRequest {
  reviewType: ReviewType;
  
  content: ContentToReview;
  
  config?: ReviewConfig;
  
  context?: {
    traceId?: string;
    userId?: string;
    contentId?: string;
  };
}

type ReviewType =
  | 'moderation'       // Content safety
  | 'seo'              // SEO quality
  | 'quality'          // Overall quality
  | 'style'            // Style guidelines
  | 'complete';        // All reviews

interface ContentToReview {
  title?: string;
  content: string;
  excerpt?: string;
  tags?: string[];
  metadata?: Record<string, unknown>;
}

interface ReviewConfig {
  strictness?: 'low' | 'medium' | 'high';
  requiredScore?: number;          // Minimum score (0-100)
  autoReject?: boolean;            // Auto-reject on critical issues
  styleGuide?: string;             // Path to custom style guide
}
```

### Ejemplo de Input
```typescript
const reviewRequest: ReviewRequest = {
  reviewType: 'complete',
  content: {
    title: 'Understanding React Server Components',
    content: '# React Server Components...\n\n...',
    excerpt: 'A comprehensive guide to React Server Components',
    tags: ['React', 'JavaScript', 'Server Components']
  },
  config: {
    strictness: 'high',
    requiredScore: 75,
    autoReject: true
  },
  context: {
    traceId: 'trace-123',
    userId: 'user-456',
    contentId: 'post-789'
  }
};
```

## Outputs

### ReviewResult
```typescript
interface ReviewResult {
  approved: boolean;
  score: number;                    // 0-100
  
  reviews: {
    moderation?: ModerationReview;
    seo?: SEOReview;
    quality?: QualityReview;
    style?: StyleReview;
  };
  
  issues: ReviewIssue[];
  suggestions: string[];
  
  metadata: {
    reviewedAt: Date;
    duration: number;
    reviewer: 'reviewer-agent';
  };
}

interface ModerationReview {
  passed: boolean;
  flagged: boolean;
  categories: {
    hate: boolean;
    harassment: boolean;
    selfHarm: boolean;
    sexual: boolean;
    violence: boolean;
    spam: boolean;
  };
  scores?: Record<string, number>;
}

interface SEOReview {
  score: number;                    // 0-100
  analysis: {
    titleQuality: number;
    metaDescriptionQuality: number;
    keywordDensity: number;
    readability: number;
    internalLinks: number;
    imageAlt: boolean;
  };
  keywords: {
    primary: string[];
    secondary: string[];
    missing: string[];
  };
}

interface QualityReview {
  score: number;                    // 0-100
  metrics: {
    coherence: number;
    completeness: number;
    accuracy: number;
    engagement: number;
  };
  wordCount: number;
  readingLevel: string;             // 'beginner', 'intermediate', 'advanced'
}

interface StyleReview {
  passed: boolean;
  violations: StyleViolation[];
  compliance: number;               // 0-100
}

interface StyleViolation {
  rule: string;
  severity: 'error' | 'warning' | 'info';
  message: string;
  line?: number;
  column?: number;
  suggestion?: string;
}

interface ReviewIssue {
  severity: 'critical' | 'high' | 'medium' | 'low';
  category: string;
  message: string;
  field?: string;
  suggestion?: string;
}
```

### Ejemplo de Output
```typescript
const reviewResult: ReviewResult = {
  approved: true,
  score: 82,
  
  reviews: {
    moderation: {
      passed: true,
      flagged: false,
      categories: {
        hate: false,
        harassment: false,
        selfHarm: false,
        sexual: false,
        violence: false,
        spam: false
      }
    },
    seo: {
      score: 78,
      analysis: {
        titleQuality: 85,
        metaDescriptionQuality: 75,
        keywordDensity: 70,
        readability: 80,
        internalLinks: 2,
        imageAlt: true
      },
      keywords: {
        primary: ['React', 'Server Components'],
        secondary: ['JavaScript', 'Performance'],
        missing: ['SSR', 'Hydration']
      }
    },
    quality: {
      score: 85,
      metrics: {
        coherence: 0.88,
        completeness: 0.85,
        accuracy: 0.90,
        engagement: 0.77
      },
      wordCount: 1543,
      readingLevel: 'intermediate'
    },
    style: {
      passed: true,
      violations: [],
      compliance: 95
    }
  },
  
  issues: [
    {
      severity: 'medium',
      category: 'SEO',
      message: 'Meta description could be more compelling',
      field: 'excerpt',
      suggestion: 'Add a call-to-action or key benefit'
    }
  ],
  
  suggestions: [
    'Consider adding internal links to related posts',
    'Include more code examples',
    'Add alt text to all images'
  ],
  
  metadata: {
    reviewedAt: new Date(),
    duration: 3450,
    reviewer: 'reviewer-agent'
  }
};
```

## Precondiciones

### PRE-REVIEW-001: Content No Vacío
```typescript
precondition NonEmptyContent {
  check: (request: ReviewRequest) => {
    return request.content.content?.trim().length > 0;
  };
  message: "Content to review must not be empty";
}
```

### PRE-REVIEW-002: Tipo de Review Válido
```typescript
precondition ValidReviewType {
  check: (request: ReviewRequest) => {
    const validTypes = ['moderation', 'seo', 'quality', 'style', 'complete'];
    return validTypes.includes(request.reviewType);
  };
  message: "Review type must be valid";
}
```

### PRE-REVIEW-003: OpenAI Disponible (para moderation)
```typescript
precondition OpenAIAvailable {
  check: async (request: ReviewRequest) => {
    if (request.reviewType === 'moderation' || request.reviewType === 'complete') {
      return !!process.env.OPENAI_API_KEY;
    }
    return true;
  };
  message: "OpenAI API key required for moderation";
}
```

## Postcondiciones

### POST-REVIEW-001: Review Completo
```typescript
postcondition CompleteReview {
  check: (result: ReviewResult, request: ReviewRequest) => {
    switch (request.reviewType) {
      case 'moderation':
        return !!result.reviews.moderation;
      case 'seo':
        return !!result.reviews.seo;
      case 'quality':
        return !!result.reviews.quality;
      case 'style':
        return !!result.reviews.style;
      case 'complete':
        return !!result.reviews.moderation && 
               !!result.reviews.seo &&
               !!result.reviews.quality;
      default:
        return false;
    }
  };
  message: "Review result must include requested review types";
}
```

### POST-REVIEW-002: Score Válido
```typescript
postcondition ValidScore {
  check: (result: ReviewResult) => {
    return (
      result.score >= 0 &&
      result.score <= 100 &&
      Object.values(result.reviews).every(review =>
        !review?.score || (review.score >= 0 && review.score <= 100)
      )
    );
  };
  message: "All scores must be between 0 and 100";
}
```

### POST-REVIEW-003: Aprovación Consistente
```typescript
postcondition ConsistentApproval {
  check: (result: ReviewResult, request: ReviewRequest) => {
    const hasCriticalIssues = result.issues.some(i => i.severity === 'critical');
    const belowRequiredScore = result.score < (request.config?.requiredScore || 0);
    
    if (hasCriticalIssues || belowRequiredScore) {
      return !result.approved;
    }
    
    return true;
  };
  message: "Approval status must be consistent with issues and scores";
}
```

## Invariantes

### INV-REVIEW-001: Moderación Determinista
**Mismo contenido siempre produce mismo resultado de moderación**
```typescript
invariant DeterministicModeration {
  check: async (content: ContentToReview) => {
    const result1 = await reviewerAgent.moderate(content);
    const result2 = await reviewerAgent.moderate(content);
    
    return deepEqual(result1.categories, result2.categories);
  };
}
```

### INV-REVIEW-002: Auto-Rechazo de Contenido Flaggeado
**Contenido flaggeado en moderación siempre se rechaza**
```typescript
invariant FlaggedContentRejected {
  check: (result: ReviewResult) => {
    if (result.reviews.moderation?.flagged) {
      return !result.approved;
    }
    return true;
  };
}
```

## Implementación de Reviews

### Moderation Review
```typescript
async function performModerationReview(
  content: ContentToReview
): Promise<ModerationReview> {
  const response = await openai.moderations.create({
    input: content.content
  });
  
  const result = response.results[0];
  
  return {
    passed: !result.flagged,
    flagged: result.flagged,
    categories: {
      hate: result.categories.hate,
      harassment: result.categories.harassment,
      selfHarm: result.categories['self-harm'],
      sexual: result.categories.sexual,
      violence: result.categories.violence,
      spam: detectSpam(content.content)
    },
    scores: result.category_scores
  };
}
```

### SEO Review
```typescript
async function performSEOReview(
  content: ContentToReview
): Promise<SEOReview> {
  const analysis = {
    titleQuality: analyzeTitleQuality(content.title),
    metaDescriptionQuality: analyzeMetaDescription(content.excerpt),
    keywordDensity: calculateKeywordDensity(content.content, content.tags),
    readability: calculateReadability(content.content),
    internalLinks: countInternalLinks(content.content),
    imageAlt: checkImageAltText(content.content)
  };
  
  const keywords = extractKeywords(content.content, content.tags);
  
  // Calculate overall SEO score
  const score = Math.round(
    (analysis.titleQuality * 0.25) +
    (analysis.metaDescriptionQuality * 0.15) +
    (analysis.keywordDensity * 0.20) +
    (analysis.readability * 0.20) +
    (analysis.internalLinks * 5) +  // +5 per link, max 20
    (analysis.imageAlt ? 20 : 0)
  );
  
  return {
    score: Math.min(100, score),
    analysis,
    keywords
  };
}
```

### Quality Review
```typescript
async function performQualityReview(
  content: ContentToReview
): Promise<QualityReview> {
  const metrics = {
    coherence: await analyzeCoherence(content.content),
    completeness: analyzeCompleteness(content.content, content.title),
    accuracy: await checkAccuracy(content.content),
    engagement: analyzeEngagement(content.content)
  };
  
  const score = Math.round(
    (metrics.coherence * 100 * 0.3) +
    (metrics.completeness * 100 * 0.3) +
    (metrics.accuracy * 100 * 0.2) +
    (metrics.engagement * 100 * 0.2)
  );
  
  return {
    score,
    metrics,
    wordCount: countWords(content.content),
    readingLevel: determineReadingLevel(content.content)
  };
}
```

### Style Review
```typescript
async function performStyleReview(
  content: ContentToReview,
  styleGuide?: string
): Promise<StyleReview> {
  const rules = loadStyleRules(styleGuide);
  const violations: StyleViolation[] = [];
  
  for (const rule of rules) {
    const ruleViolations = await rule.check(content);
    violations.push(...ruleViolations);
  }
  
  const errors = violations.filter(v => v.severity === 'error');
  const compliance = Math.round(
    ((rules.length - errors.length) / rules.length) * 100
  );
  
  return {
    passed: errors.length === 0,
    violations,
    compliance
  };
}
```

## Algoritmos de Análisis

### Análisis de Legibilidad (Flesch Reading Ease)
```typescript
function calculateReadability(text: string): number {
  const sentences = countSentences(text);
  const words = countWords(text);
  const syllables = countSyllables(text);
  
  // Flesch Reading Ease formula
  const score = 206.835 - 
                1.015 * (words / sentences) - 
                84.6 * (syllables / words);
  
  // Normalize to 0-100
  return Math.max(0, Math.min(100, score));
}
```

### Detección de Spam
```typescript
function detectSpam(content: string): boolean {
  const spamIndicators = [
    /buy now/gi,
    /click here/gi,
    /limited time/gi,
    /act now/gi,
    /\$\$\$/g,
    /(https?:\/\/[^\s]+){5,}/g  // Too many links
  ];
  
  let spamScore = 0;
  
  for (const indicator of spamIndicators) {
    const matches = content.match(indicator);
    if (matches) {
      spamScore += matches.length;
    }
  }
  
  return spamScore >= 3;  // Threshold
}
```

### Extracción de Keywords
```typescript
function extractKeywords(
  content: string,
  existingTags?: string[]
): { primary: string[]; secondary: string[]; missing: string[] } {
  const words = tokenize(content.toLowerCase());
  const stopWords = loadStopWords();
  
  // Remove stop words and count frequency
  const wordFreq = new Map<string, number>();
  for (const word of words) {
    if (!stopWords.has(word) && word.length > 3) {
      wordFreq.set(word, (wordFreq.get(word) || 0) + 1);
    }
  }
  
  // Sort by frequency
  const sorted = Array.from(wordFreq.entries())
    .sort((a, b) => b[1] - a[1]);
  
  const primary = sorted.slice(0, 3).map(([word]) => word);
  const secondary = sorted.slice(3, 8).map(([word]) => word);
  
  // Check for missing important tags
  const missing = existingTags?.filter(tag =>
    !content.toLowerCase().includes(tag.toLowerCase())
  ) || [];
  
  return { primary, secondary, missing };
}
```

## Decisión de Aprobación

```typescript
function decideApproval(
  result: ReviewResult,
  config: ReviewConfig
): boolean {
  // Critical issues always reject
  const hasCriticalIssues = result.issues.some(i => i.severity === 'critical');
  if (hasCriticalIssues) {
    return false;
  }
  
  // Flagged content always rejects
  if (result.reviews.moderation?.flagged) {
    return false;
  }
  
  // Check required score
  if (config.requiredScore && result.score < config.requiredScore) {
    return false;
  }
  
  // Check strictness level
  if (config.strictness === 'high') {
    // High issues also reject in high strictness
    const hasHighIssues = result.issues.some(i => i.severity === 'high');
    if (hasHighIssues) {
      return false;
    }
  }
  
  return true;
}
```

## Manejo de Errores

### Error: Moderation API Failed
```typescript
{
  code: 'MODERATION_FAILED',
  message: 'OpenAI moderation API failed',
  recoverable: true,
  fallback: 'Use rule-based moderation'
}
```

### Error: Content Too Long
```typescript
{
  code: 'CONTENT_TOO_LONG',
  message: 'Content exceeds maximum length for analysis',
  recoverable: false,
  suggestion: 'Split content into smaller chunks'
}
```

## Métricas

- `reviewer.reviews.count` - Total de reviews
- `reviewer.reviews.by_type` - Reviews por tipo
- `reviewer.approval_rate` - Tasa de aprobación
- `reviewer.average_score` - Score promedio
- `reviewer.issues.by_severity` - Issues por severidad
- `reviewer.duration.average_ms` - Duración promedio

## Tests

### Test de Precondiciones
```typescript
describe('Reviewer Agent Preconditions', () => {
  it('rejects empty content', async () => {
    const request = {
      reviewType: 'quality',
      content: { content: '' }
    };
    
    await expect(reviewerAgent.review(request))
      .rejects.toThrow('must not be empty');
  });
});
```

### Test de Postcondiciones
```typescript
describe('Reviewer Agent Postconditions', () => {
  it('includes requested review types', async () => {
    const result = await reviewerAgent.review({
      reviewType: 'seo',
      content: validContent
    });
    
    expect(result.reviews.seo).toBeDefined();
  });
  
  it('rejects flagged content', async () => {
    const result = await reviewerAgent.review({
      reviewType: 'moderation',
      content: flaggedContent
    });
    
    expect(result.reviews.moderation.flagged).toBe(true);
    expect(result.approved).toBe(false);
  });
});
```

### Test de Invariantes
```typescript
describe('Reviewer Agent Invariants', () => {
  it('produces deterministic moderation results', async () => {
    const result1 = await reviewerAgent.review(moderationRequest);
    const result2 = await reviewerAgent.review(moderationRequest);
    
    expect(result1.reviews.moderation).toEqual(result2.reviews.moderation);
  });
});
```

## Protocolo de Comunicación

Usa **PROTOCOL-001 (ACP)** y **PROTOCOL-003 (CVP)**.

Ver: `docs/specs/protocols.md`

## Referencias
- **System Spec**: `docs/specs/system_spec.md`
- **Protocols**: `docs/specs/protocols.md`
- **Related Agents**: Coder Agent, Executor Agent

---

**Versión**: 1.0.0  
**Fecha**: 2026-02-24  
**Estado**: 🟡 En Desarrollo
