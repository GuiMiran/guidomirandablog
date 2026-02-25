# Skill Specification: Summarize Content

## Identificador
**SKILL-002**: `summarize_content`

## Objetivo
Generar resúmenes concisos y coherentes de contenido extenso, preservando ideas clave y manteniendo fidelidad al texto original.

## Responsabilidades
1. Extraer puntos clave del contenido
2. Generar resúmenes en diferentes longitudes (corto, medio, largo)
3. Mantener coherencia y fluidez
4. Preservar tono del contenido original
5. Calcular métricas de reducción y calidad

## Inputs

### SummarizeContentInput
```typescript
interface SummarizeContentInput {
  content: string;
  
  length?: 'short' | 'medium' | 'long';  // Default: 'medium'
  
  style?: 'bullet-points' | 'paragraph' | 'abstract';  // Default: 'paragraph'
  
  focus?: string[];  // Topics to emphasize in summary
  
  targetAudience?: 'general' | 'technical' | 'executive';
  
  language?: string;  // Default: 'es'
}
```

### Ejemplo de Input
```typescript
const input: SummarizeContentInput = {
  content: `GraphQL es un lenguaje de consulta para APIs y un runtime para ejecutar esas consultas...
  
  (2000 words of content)
  
  En conclusión, GraphQL ofrece ventajas significativas...`,
  
  length: 'medium',
  style: 'paragraph',
  focus: ['ventajas', 'casos de uso'],
  targetAudience: 'technical'
};
```

## Outputs

### SummarizeContentOutput
```typescript
interface SummarizeContentOutput {
  summary: string;
  
  keyPoints: string[];  // 3-5 main points
  
  metrics: SummaryMetrics;
  
  metadata: SummaryMetadata;
}

interface SummaryMetrics {
  originalWordCount: number;
  summaryWordCount: number;
  compressionRatio: number;      // e.g., 0.15 = 85% reduction
  
  keyConceptsCovered: number;
  coherenceScore: number;        // 0-100
}

interface SummaryMetadata {
  generatedAt: Date;
  model: string;
  tokensUsed: number;
  costUSD: number;
  durationMs: number;
}
```

### Ejemplo de Output
```typescript
const output: SummarizeContentOutput = {
  summary: `GraphQL es un lenguaje de consulta que permite a los clientes solicitar exactamente los datos que necesitan. A diferencia de REST, donde múltiples endpoints devuelven estructuras fijas, GraphQL usa un único endpoint con un schema tipado. Las principales ventajas incluyen reducción de overfetching/underfetching, mejor experiencia de desarrollo con herramientas como GraphiQL, y evolución de APIs sin versionado. Es ideal para aplicaciones móviles con ancho de banda limitado y proyectos con múltiples clientes que necesitan datos diferentes.`,
  
  keyPoints: [
    'GraphQL permite solicitar exactamente los datos necesarios',
    'Usa un único endpoint con schema tipado',
    'Reduce overfetching y underfetching comparado con REST',
    'Ideal para aplicaciones móviles y múltiples clientes',
    'Evolución de API sin versionado'
  ],
  
  metrics: {
    originalWordCount: 1850,
    summaryWordCount: 98,
    compressionRatio: 0.053,
    keyConceptsCovered: 5,
    coherenceScore: 87
  },
  
  metadata: {
    generatedAt: new Date(),
    model: 'gpt-4o-mini',
    tokensUsed: 2150,
    costUSD: 0.003,
    durationMs: 2300
  }
};
```

## Precondiciones

### PRE-SUM-001: Contenido Suficiente
```typescript
precondition SufficientContent {
  check: (input: SummarizeContentInput) => {
    const wordCount = input.content.split(/\s+/).length;
    return wordCount >= 100;
  };
  message: "Content must have at least 100 words to summarize";
}
```

## Postcondiciones

### POST-SUM-001: Resumen Más Corto
```typescript
postcondition ShorterThanOriginal {
  check: (output: SummarizeContentOutput, input: SummarizeContentInput) => {
    return output.metrics.summaryWordCount < output.metrics.originalWordCount;
  };
  message: "Summary must be shorter than original content";
}
```

### POST-SUM-002: Puntos Clave Presentes
```typescript
postcondition KeyPointsPresent {
  check: (output: SummarizeContentOutput) => {
    return output.keyPoints.length >= 3 && output.keyPoints.length <= 7;
  };
  message: "Must extract 3-7 key points";
}
```

## Invariantes

### INV-SUM-001: Compresión Razonable
**Summary compression ratio must be reasonable**
```typescript
invariant ReasonableCompression {
  check: (output: SummarizeContentOutput) => {
    const ratio = output.metrics.compressionRatio;
    return ratio >= 0.05 && ratio <= 0.5;  // 50-95% reduction
  };
}
```

### INV-SUM-002: Coherencia Alta
**Summary must maintain high coherence**
```typescript
invariant HighCoherence {
  check: (output: SummarizeContentOutput) => {
    return output.metrics.coherenceScore >= 70;
  };
}
```

## Algoritmo

```typescript
async function summarizeContent(
  input: SummarizeContentInput
): Promise<SummarizeContentOutput> {
  const startTime = Date.now();
  
  const originalWordCount = input.content.split(/\s+/).length;
  
  // Determine summary length target
  const lengthTargets = {
    short: Math.min(100, originalWordCount * 0.1),
    medium: Math.min(250, originalWordCount * 0.2),
    long: Math.min(500, originalWordCount * 0.3)
  };
  
  const targetWords = lengthTargets[input.length || 'medium'];
  
  const prompt = buildSummaryPrompt(input, targetWords);
  
  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: 'Eres un experto en crear resúmenes concisos y precisos.'
      },
      {
        role: 'user',
        content: prompt
      }
    ],
    temperature: 0.3,
    max_tokens: Math.ceil(targetWords * 1.5),
    response_format: { type: 'json_object' }
  });
  
  const result = JSON.parse(response.choices[0].message.content);
  
  const summaryWordCount = result.summary.split(/\s+/).length;
  const compressionRatio = summaryWordCount / originalWordCount;
  
  // Extract key concepts covered
  const keyConceptsCovered = result.keyPoints.length;
  
  // Calculate coherence score (simplified)
  const coherenceScore = calculateCoherence(result.summary, input.content);
  
  const durationMs = Date.now() - startTime;
  
  return {
    summary: result.summary,
    keyPoints: result.keyPoints,
    metrics: {
      originalWordCount,
      summaryWordCount,
      compressionRatio,
      keyConceptsCovered,
      coherenceScore
    },
    metadata: {
      generatedAt: new Date(),
      model: 'gpt-4o-mini',
      tokensUsed: response.usage.total_tokens,
      costUSD: calculateCost(response.usage, 'gpt-4o-mini'),
      durationMs
    }
  };
}

function buildSummaryPrompt(input: SummarizeContentInput, targetWords: number): string {
  let prompt = `Genera un resumen del siguiente contenido en aproximadamente ${targetWords} palabras.\n\n`;
  
  if (input.style === 'bullet-points') {
    prompt += 'Formato: Lista de puntos clave (bullet points).\n';
  } else if (input.style === 'abstract') {
    prompt += 'Formato: Resumen académico estilo abstract.\n';
  } else {
    prompt += 'Formato: Párrafo narrativo coherente.\n';
  }
  
  if (input.focus && input.focus.length > 0) {
    prompt += `Enfócate especialmente en: ${input.focus.join(', ')}.\n`;
  }
  
  if (input.targetAudience) {
    const audienceGuide = {
      general: 'Lenguaje simple y accesible',
      technical: 'Mantén términos técnicos',
      executive: 'Enfócate en impacto y resultados'
    };
    prompt += `Audiencia: ${audienceGuide[input.targetAudience]}.\n`;
  }
  
  prompt += `\nContenido a resumir:\n${input.content}\n\n`;
  prompt += `Responde en formato JSON:\n`;
  prompt += `{
  "summary": "resumen completo",
  "keyPoints": ["punto 1", "punto 2", "punto 3", ...]
}\n`;
  
  return prompt;
}

function calculateCoherence(summary: string, original: string): number {
  // Simplified coherence calculation
  // Check overlap of important terms
  const summaryTerms = extractImportantTerms(summary);
  const originalTerms = extractImportantTerms(original);
  
  const overlap = summaryTerms.filter(term => originalTerms.includes(term)).length;
  const score = (overlap / Math.max(summaryTerms.length, 1)) * 100;
  
  return Math.min(100, score);
}

function extractImportantTerms(text: string): string[] {
  const words = text.toLowerCase().split(/\s+/);
  
  // Remove stop words (simplified)
  const stopWords = ['el', 'la', 'de', 'que', 'y', 'a', 'en', 'un', 'es', 'por'];
  
  return words
    .filter(w => w.length > 4 && !stopWords.includes(w))
    .filter((w, i, arr) => arr.indexOf(w) === i)  // Unique
    .slice(0, 15);  // Top 15
}
```

## Métricas

- `skill.summarize_content.invocations`
- `skill.summarize_content.avg_compression_ratio`
- `skill.summarize_content.avg_coherence_score`
- `skill.summarize_content.avg_duration_ms`

## Tests

```typescript
describe('Summarize Content Skill', () => {
  it('produces shorter summary', async () => {
    const output = await summarizeContentSkill.execute(validInput);
    expect(output.metrics.summaryWordCount).toBeLessThan(output.metrics.originalWordCount);
  });
  
  it('maintains reasonable compression', async () => {
    const output = await summarizeContentSkill.execute(validInput);
    expect(output.metrics.compressionRatio).toBeGreaterThanOrEqual(0.05);
    expect(output.metrics.compressionRatio).toBeLessThanOrEqual(0.5);
  });
});
```

## Protocolo

Usa **PROTOCOL-002 (Skill Execution Protocol)**.

## Referencias
- **System Spec**: `docs/specs/system_spec.md`
- **Coder Agent**: `docs/specs/agent_specs/coder_agent.md`

---

**Versión**: 1.0.0  
**Fecha**: 2026-02-24  
**Estado**: 🟡 En Desarrollo
