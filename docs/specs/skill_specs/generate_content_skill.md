# Skill Specification: Generate Content

## Identificador
**SKILL-001**: `generate_content`

## Objetivo
Generar contenido original para blog posts utilizando modelos de lenguaje (OpenAI GPT-4o), garantizando calidad, coherencia y alineación con el tono y estructura especificados.

## Responsabilidades
1. Generar posts completos con título, contenido y metadatos
2. Respetar parámetros de longitud, tono y audiencia
3. Incluir estructura markdown adecuada
4. Generar tags y categorías relevantes
5. Calcular métricas de calidad del contenido generado

## Inputs

### GenerateContentInput
```typescript
interface GenerateContentInput {
  topic: string;
  
  length?: 'short' | 'medium' | 'long';  // Default: 'medium'
  
  tone?: 'professional' | 'casual' | 'technical' | 'conversational';  // Default: 'professional'
  
  targetAudience?: string;  // e.g., "developers", "general public"
  
  outline?: string[];  // Optional section headings
  
  keywords?: string[];  // SEO keywords to include
  
  language?: string;  // Default: 'es' (español)
  
  context?: {
    relatedPosts?: string[];
    referenceSources?: string[];
  };
}
```

### Ejemplo de Input
```typescript
const input: GenerateContentInput = {
  topic: 'GraphQL vs REST: ¿Cuál elegir en 2026?',
  length: 'medium',
  tone: 'technical',
  targetAudience: 'developers',
  outline: [
    'Introducción',
    'Diferencias clave',
    'Casos de uso de GraphQL',
    'Casos de uso de REST',
    'Conclusión'
  ],
  keywords: ['GraphQL', 'REST', 'API', 'Web Development'],
  language: 'es'
};
```

## Outputs

### GenerateContentOutput
```typescript
interface GenerateContentOutput {
  content: GeneratedContent;
  
  metadata: ContentMetadata;
  
  usage: UsageMetrics;
}

interface GeneratedContent {
  title: string;
  slug: string;
  excerpt: string;
  body: string;              // Markdown format
  tags: string[];
  category: string;
  readingTimeMinutes: number;
}

interface ContentMetadata {
  wordCount: number;
  characterCount: number;
  paragraphCount: number;
  headingCount: number;
  
  qualityScore: number;      // 0-100
  
  tone: string;
  complexity: 'beginner' | 'intermediate' | 'advanced';
  
  generatedAt: Date;
  modelUsed: string;
}

interface UsageMetrics {
  tokensUsed: {
    prompt: number;
    completion: number;
    total: number;
  };
  
  costUSD: number;
  durationMs: number;
}
```

### Ejemplo de Output
```typescript
const output: GenerateContentOutput = {
  content: {
    title: 'GraphQL vs REST: ¿Cuál elegir en 2026?',
    slug: 'graphql-vs-rest-cual-elegir-2026',
    excerpt: 'Analizamos las diferencias clave entre GraphQL y REST para ayudarte a tomar la mejor decisión arquitectónica.',
    body: `# GraphQL vs REST: ¿Cuál elegir en 2026?

## Introducción
En el mundo del desarrollo de APIs...

## Diferencias clave
...

## Conclusión
...`,
    tags: ['GraphQL', 'REST', 'API', 'Web Development', 'Backend'],
    category: 'Web Development',
    readingTimeMinutes: 8
  },
  
  metadata: {
    wordCount: 1850,
    characterCount: 11240,
    paragraphCount: 24,
    headingCount: 5,
    qualityScore: 87,
    tone: 'technical',
    complexity: 'intermediate',
    generatedAt: new Date(),
    modelUsed: 'gpt-4o'
  },
  
  usage: {
    tokensUsed: {
      prompt: 450,
      completion: 2100,
      total: 2550
    },
    costUSD: 0.064,
    durationMs: 12300
  }
};
```

## Precondiciones

### PRE-GEN-001: Topic No Vacío
```typescript
precondition NonEmptyTopic {
  check: (input: GenerateContentInput) => {
    return input.topic.trim().length > 0;
  };
  message: "Topic must not be empty";
}
```

### PRE-GEN-002: OpenAI API Disponible
```typescript
precondition OpenAIAvailable {
  check: async () => {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) return false;
    
    try {
      await openai.models.list();
      return true;
    } catch {
      return false;
    }
  };
  message: "OpenAI API must be available and configured";
}
```

### PRE-GEN-003: Parámetros Válidos
```typescript
precondition ValidParameters {
  check: (input: GenerateContentInput) => {
    const validLengths = ['short', 'medium', 'long'];
    const validTones = ['professional', 'casual', 'technical', 'conversational'];
    
    if (input.length && !validLengths.includes(input.length)) return false;
    if (input.tone && !validTones.includes(input.tone)) return false;
    
    return true;
  };
  message: "Length and tone must be valid values";
}
```

## Postcondiciones

### POST-GEN-001: Contenido Completo
```typescript
postcondition CompleteContent {
  check: (output: GenerateContentOutput) => {
    const { title, body, excerpt, tags, category } = output.content;
    
    return (
      title.length > 0 &&
      body.length >= 100 &&
      excerpt.length > 0 &&
      tags.length >= 3 &&
      category.length > 0
    );
  };
  message: "Generated content must be complete with all required fields";
}
```

### POST-GEN-002: Estructura Markdown Válida
```typescript
postcondition ValidMarkdown {
  check: (output: GenerateContentOutput) => {
    const body = output.content.body;
    
    // Check for at least one heading
    const hasHeadings = /^#{1,6}\s+.+$/m.test(body);
    
    // Check for paragraphs
    const hasParagraphs = body.split('\n\n').length >= 3;
    
    return hasHeadings && hasParagraphs;
  };
  message: "Body must be valid markdown with headings and paragraphs";
}
```

### POST-GEN-003: Dentro de Límites de Longitud
```typescript
postcondition WithinLengthLimits {
  check: (output: GenerateContentOutput, input: GenerateContentInput) => {
    const wordCount = output.metadata.wordCount;
    
    const limits = {
      short: [300, 800],
      medium: [800, 2000],
      long: [2000, 5000]
    };
    
    const [min, max] = limits[input.length || 'medium'];
    
    return wordCount >= min && wordCount <= max;
  };
  message: "Content length must be within specified limits";
}
```

## Invariantes

### INV-GEN-001: Keywords Presentes
**If keywords provided, they must appear in content**
```typescript
invariant KeywordsPresent {
  check: (output: GenerateContentOutput, input: GenerateContentInput) => {
    if (!input.keywords || input.keywords.length === 0) return true;
    
    const contentText = `${output.content.title} ${output.content.body}`.toLowerCase();
    
    // At least 70% of keywords should appear
    const presentKeywords = input.keywords.filter(kw =>
      contentText.includes(kw.toLowerCase())
    );
    
    return presentKeywords.length / input.keywords.length >= 0.7;
  };
}
```

### INV-GEN-002: Outline Respetado
**If outline provided, content must follow structure**
```typescript
invariant OutlineFollowed {
  check: (output: GenerateContentOutput, input: GenerateContentInput) => {
    if (!input.outline || input.outline.length === 0) return true;
    
    const body = output.content.body;
    
    // Check that outline sections appear as headings
    const matchedSections = input.outline.filter(section =>
      new RegExp(`^#{1,3}\\s+${section}`, 'mi').test(body)
    );
    
    // At least 80% of outline sections should be present
    return matchedSections.length / input.outline.length >= 0.8;
  };
}
```

### INV-GEN-003: Costo Razonable
**Content generation must not exceed cost threshold**
```typescript
invariant ReasonableCost {
  check: (output: GenerateContentOutput) => {
    return output.usage.costUSD <= 0.50;  // Max $0.50 per generation
  };
}
```

## Algoritmo

### Fase 1: Preparación del Prompt
```typescript
function buildPrompt(input: GenerateContentInput): string {
  const lengthGuide = {
    short: '500-700 palabras',
    medium: '1000-1500 palabras',
    long: '2000-3000 palabras'
  };
  
  const toneGuide = {
    professional: 'Mantén un tono profesional y objetivo',
    casual: 'Usa un tono amigable y conversacional',
    technical: 'Usa terminología técnica precisa',
    conversational: 'Escribe como si hablaras con un amigo'
  };
  
  let prompt = `Genera un artículo de blog sobre: "${input.topic}"\n\n`;
  
  prompt += `Longitud: ${lengthGuide[input.length || 'medium']}\n`;
  prompt += `Tono: ${toneGuide[input.tone || 'professional']}\n`;
  
  if (input.targetAudience) {
    prompt += `Audiencia: ${input.targetAudience}\n`;
  }
  
  if (input.outline && input.outline.length > 0) {
    prompt += `\nEstructura del artículo:\n`;
    input.outline.forEach(section => {
      prompt += `- ${section}\n`;
    });
  }
  
  if (input.keywords && input.keywords.length > 0) {
    prompt += `\nIncluye estas palabras clave: ${input.keywords.join(', ')}\n`;
  }
  
  prompt += `\nFormato de respuesta (JSON):\n`;
  prompt += `{
  "title": "título del artículo",
  "excerpt": "resumen breve de 1-2 frases",
  "body": "contenido completo en markdown",
  "tags": ["tag1", "tag2", "tag3", "tag4", "tag5"],
  "category": "categoría principal"
}\n`;
  
  return prompt;
}
```

### Fase 2: Invocación de OpenAI
```typescript
async function generateContent(
  input: GenerateContentInput
): Promise<GenerateContentOutput> {
  const startTime = Date.now();
  
  const prompt = buildPrompt(input);
  
  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'system',
        content: 'Eres un experto escritor de contenido técnico para blogs.'
      },
      {
        role: 'user',
        content: prompt
      }
    ],
    temperature: 0.7,
    max_tokens: 4000,
    response_format: { type: 'json_object' }
  });
  
  const durationMs = Date.now() - startTime;
  
  const generatedData = JSON.parse(response.choices[0].message.content);
  
  // Calculate metadata
  const wordCount = generatedData.body.split(/\s+/).length;
  const characterCount = generatedData.body.length;
  const paragraphCount = generatedData.body.split('\n\n').length;
  const headingCount = (generatedData.body.match(/^#{1,6}\s+/gm) || []).length;
  
  // Calculate reading time (average 200 words/minute)
  const readingTimeMinutes = Math.ceil(wordCount / 200);
  
  // Generate slug
  const slug = generateSlug(generatedData.title);
  
  // Calculate quality score
  const qualityScore = calculateQualityScore(generatedData, wordCount);
  
  // Calculate cost
  const costUSD = calculateCost(response.usage, 'gpt-4o');
  
  return {
    content: {
      title: generatedData.title,
      slug,
      excerpt: generatedData.excerpt,
      body: generatedData.body,
      tags: generatedData.tags,
      category: generatedData.category,
      readingTimeMinutes
    },
    metadata: {
      wordCount,
      characterCount,
      paragraphCount,
      headingCount,
      qualityScore,
      tone: input.tone || 'professional',
      complexity: determineComplexity(generatedData.body),
      generatedAt: new Date(),
      modelUsed: 'gpt-4o'
    },
    usage: {
      tokensUsed: {
        prompt: response.usage.prompt_tokens,
        completion: response.usage.completion_tokens,
        total: response.usage.total_tokens
      },
      costUSD,
      durationMs
    }
  };
}
```

### Fase 3: Cálculo de Calidad
```typescript
function calculateQualityScore(content: any, wordCount: number): number {
  let score = 50;  // Base score
  
  // Title quality (max +10)
  if (content.title.length >= 30 && content.title.length <= 70) {
    score += 10;
  } else if (content.title.length >= 20) {
    score += 5;
  }
  
  // Excerpt quality (max +10)
  if (content.excerpt.length >= 100 && content.excerpt.length <= 160) {
    score += 10;
  }
  
  // Body length (max +10)
  if (wordCount >= 800 && wordCount <= 2000) {
    score += 10;
  } else if (wordCount >= 500) {
    score += 5;
  }
  
  // Structure (max +10)
  const hasIntro = content.body.toLowerCase().includes('introducción');
  const hasConclusion = content.body.toLowerCase().includes('conclusión');
  if (hasIntro && hasConclusion) score += 10;
  else if (hasIntro || hasConclusion) score += 5;
  
  // Tags (max +10)
  if (content.tags.length >= 5) score += 10;
  else if (content.tags.length >= 3) score += 5;
  
  return Math.min(score, 100);
}

function determineComplexity(body: string): 'beginner' | 'intermediate' | 'advanced' {
  const technicalTerms = [
    'arquitectura', 'algoritmo', 'optimización', 'refactoring',
    'dependency', 'framework', 'biblioteca', 'API', 'middleware'
  ];
  
  const bodyLower = body.toLowerCase();
  const termCount = technicalTerms.filter(term =>
    bodyLower.includes(term.toLowerCase())
  ).length;
  
  if (termCount >= 5) return 'advanced';
  if (termCount >= 2) return 'intermediate';
  return 'beginner';
}
```

## Métricas

- `skill.generate_content.invocations` - Total invocaciones
- `skill.generate_content.success_rate` - Tasa de éxito
- `skill.generate_content.avg_duration_ms` - Duración promedio
- `skill.generate_content.avg_tokens` - Tokens promedio
- `skill.generate_content.avg_cost_usd` - Costo promedio
- `skill.generate_content.avg_quality_score` - Score de calidad promedio

## Tests

### Test de Precondiciones
```typescript
describe('Generate Content Skill - Preconditions', () => {
  it('rejects empty topic', async () => {
    const input = { topic: '' };
    
    await expect(generateContentSkill.execute(input))
      .rejects.toThrow('Topic must not be empty');
  });
  
  it('validates length parameter', async () => {
    const input = {
      topic: 'Test',
      length: 'invalid' as any
    };
    
    await expect(generateContentSkill.execute(input))
      .rejects.toThrow('must be valid');
  });
});
```

### Test de Invariantes
```typescript
describe('Generate Content Skill - Invariants', () => {
  it('includes provided keywords', async () => {
    const input = {
      topic: 'GraphQL',
      keywords: ['GraphQL', 'API', 'Schema']
    };
    
    const output = await generateContentSkill.execute(input);
    
    expect(keywordsPresent(output, input)).toBe(true);
  });
  
  it('stays within cost limits', async () => {
    const output = await generateContentSkill.execute(validInput);
    
    expect(output.usage.costUSD).toBeLessThanOrEqual(0.50);
  });
});
```

## Protocolo

Usa **PROTOCOL-002 (Skill Execution Protocol)**.

Ver: `docs/specs/protocols.md`

## Referencias
- **System Spec**: `docs/specs/system_spec.md`
- **Coder Agent**: `docs/specs/agent_specs/coder_agent.md`
- **OpenAI Client**: `src/lib/openai/client.ts`

---

**Versión**: 1.0.0  
**Fecha**: 2026-02-24  
**Estado**: 🟡 En Desarrollo
