# Agent Specification: Coder Agent

## Objetivo
Generar y transformar contenido (posts, código, resúmenes, respuestas de chat) utilizando modelos de IA, asegurando calidad y coherencia.

## Responsabilidad
El **Coder Agent** es responsable de:
1. Generar contenido original usando IA
2. Transformar contenido existente
3. Adaptar tono y estilo según contexto
4. Mantener coherencia con directrices del blog
5. Optimizar prompts para mejores resultados
6. Manejar interacciones con API de OpenAI

## Inputs

### GenerationRequest
```typescript
interface GenerationRequest {
  type: GenerationType;
  
  input: GenerationInput;
  
  config?: GenerationConfig;
  
  context?: {
    userId?: string;
    sessionId?: string;
    traceId?: string;
  };
}

type GenerationType =
  | 'blog_post'
  | 'summary'
  | 'chat_response'
  | 'seo_metadata'
  | 'title_suggestions';

interface GenerationInput {
  // For blog_post
  topic?: string;
  outline?: string[];
  keywords?: string[];
  
  // For summary
  content?: string;
  maxLength?: number;
  
  // For chat_response
  messages?: ChatMessage[];
  question?: string;
  
  // For seo_metadata
  postContent?: string;
}

interface GenerationConfig {
  model?: string;              // 'gpt-4o-mini', 'gpt-4o', etc.
  temperature?: number;        // 0-1
  maxTokens?: number;
  tone?: 'professional' | 'casual' | 'technical' | 'educational';
  length?: 'short' | 'medium' | 'long';
  language?: string;           // 'en', 'es', etc.
  guidelines?: string[];       // Custom style guidelines
}
```

### Ejemplo de Input
```typescript
const request: GenerationRequest = {
  type: 'blog_post',
  input: {
    topic: 'The Future of WebAssembly',
    keywords: ['WebAssembly', 'performance', 'web development'],
    outline: [
      'Introduction to WebAssembly',
      'Current state and adoption',
      'Use cases and benefits',
      'Future predictions'
    ]
  },
  config: {
    model: 'gpt-4o',
    temperature: 0.7,
    maxTokens: 3000,
    tone: 'professional',
    length: 'long',
    language: 'en',
    guidelines: [
      'Use technical examples',
      'Include code snippets',
      'Cite sources when possible'
    ]
  }
};
```

## Outputs

### GenerationResult
```typescript
interface GenerationResult {
  success: boolean;
  
  content: GeneratedContent;
  
  metadata: GenerationMetadata;
}

interface GeneratedContent {
  // For blog_post
  title?: string;
  content?: string;
  excerpt?: string;
  tags?: string[];
  
  // For summary
  summary?: string;
  
  // For chat_response
  message?: string;
  
  // For seo_metadata
  metaTitle?: string;
  metaDescription?: string;
  keywords?: string[];
}

interface GenerationMetadata {
  model: string;
  tokensUsed: {
    prompt: number;
    completion: number;
    total: number;
  };
  costUSD?: number;
  duration: number;          // milliseconds
  timestamp: Date;
  quality?: {
    score: number;           // 0-1
    metrics: {
      coherence?: number;
      relevance?: number;
      completeness?: number;
    };
  };
}
```

### Ejemplo de Output
```typescript
const result: GenerationResult = {
  success: true,
  content: {
    title: 'The Future of WebAssembly: Performance and Beyond',
    content: '# Introduction...\n\n...',
    excerpt: 'WebAssembly is revolutionizing web development...',
    tags: ['WebAssembly', 'Performance', 'Web Development', 'Future Tech']
  },
  metadata: {
    model: 'gpt-4o',
    tokensUsed: {
      prompt: 450,
      completion: 2100,
      total: 2550
    },
    costUSD: 0.0765,
    duration: 12340,
    timestamp: new Date(),
    quality: {
      score: 0.89,
      metrics: {
        coherence: 0.92,
        relevance: 0.88,
        completeness: 0.87
      }
    }
  }
};
```

## Precondiciones

### PRE-CODER-001: Input Válido
```typescript
precondition ValidInput {
  check: (request: GenerationRequest) => {
    switch (request.type) {
      case 'blog_post':
        return !!request.input.topic?.trim();
      case 'summary':
        return !!request.input.content && request.input.content.length > 50;
      case 'chat_response':
        return !!request.input.messages?.length || !!request.input.question;
      default:
        return false;
    }
  };
  message: "Generation request must have valid input for type";
}
```

### PRE-CODER-002: Rate Limit OK
```typescript
precondition RateLimitCheck {
  check: async (request: GenerationRequest) => {
    const userId = request.context?.userId || 'anonymous';
    return await rateLimiter.checkLimit(userId, 'openai');
  };
  message: "OpenAI rate limit must not be exceeded";
}
```

### PRE-CODER-003: API Key Configurada
```typescript
precondition APIKeyConfigured {
  check: () => {
    return !!process.env.OPENAI_API_KEY;
  };
  message: "OPENAI_API_KEY environment variable must be set";
}
```

## Postcondiciones

### POST-CODER-001: Content Generated
```typescript
postcondition ContentGenerated {
  check: (result: GenerationResult) => {
    if (!result.success) return true;  // Error handling separate
    
    switch (result.content) {
      case result.content.content !== undefined:
        return result.content.content.length > 0;
      case result.content.summary !== undefined:
        return result.content.summary.length > 0;
      case result.content.message !== undefined:
        return result.content.message.length > 0;
      default:
        return false;
    }
  };
  message: "Successful generation must produce non-empty content";
}
```

### POST-CODER-002: Metadata Completa
```typescript
postcondition CompleteMetadata {
  check: (result: GenerationResult) => {
    return (
      result.metadata.model &&
      result.metadata.tokensUsed.total > 0 &&
      result.metadata.duration > 0 &&
      result.metadata.timestamp instanceof Date
    );
  };
  message: "Generation must include complete metadata";
}
```

### POST-CODER-003: Dentro de Límites de Tokens
```typescript
postcondition WithinTokenLimits {
  check: (request: GenerationRequest, result: GenerationResult) => {
    const maxTokens = request.config?.maxTokens || 4000;
    return result.metadata.tokensUsed.completion <= maxTokens;
  };
  message: "Generated content must respect token limits";
}
```

## Invariantes

### INV-CODER-001: Determinismo con Temperatura 0
**Con temperatura=0, mismo prompt debe generar contenido idéntico o muy similar**
```typescript
invariant DeterministicGeneration {
  check: async (request: GenerationRequest) => {
    if (request.config?.temperature !== 0) return true;
    
    const result1 = await coderAgent.generate(request);
    const result2 = await coderAgent.generate(request);
    
    return similarityScore(result1.content, result2.content) > 0.95;
  };
}
```

### INV-CODER-002: Costo Razonable
**El costo de generación no debe exceder límites configurados**
```typescript
invariant ReasonableCost {
  check: (result: GenerationResult) => {
    const MAX_COST_USD = 1.0;  // Per generation
    return !result.metadata.costUSD || result.metadata.costUSD <= MAX_COST_USD;
  };
}
```

## Implementación de Skills

### Skill: Generate Blog Post
```typescript
async function generateBlogPost(
  input: GenerationInput,
  config: GenerationConfig
): Promise<GeneratedContent> {
  const prompt = buildBlogPostPrompt(input, config);
  
  const response = await openai.chat.completions.create({
    model: config.model || 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: buildSystemPrompt(config)
      },
      {
        role: 'user',
        content: prompt
      }
    ],
    temperature: config.temperature || 0.7,
    max_tokens: config.maxTokens || 3000,
    response_format: { type: 'json_object' }
  });
  
  const content = JSON.parse(response.choices[0].message.content);
  
  return {
    title: content.title,
    content: content.content,
    excerpt: content.excerpt || generateExcerpt(content.content),
    tags: content.tags || extractTags(content.content, input.keywords)
  };
}
```

### Skill: Generate Summary
```typescript
async function generateSummary(
  content: string,
  maxLength: number
): Promise<string> {
  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: `You are a professional content summarizer. 
        Create concise summaries that capture key points.
        Target length: approximately ${maxLength} characters.`
      },
      {
        role: 'user',
        content: `Summarize:\n\n${content}`
      }
    ],
    temperature: 0.5,
    max_tokens: Math.ceil(maxLength / 3)
  });
  
  return response.choices[0].message.content;
}
```

### Skill: Generate Chat Response
```typescript
async function generateChatResponse(
  messages: ChatMessage[],
  context?: string
): Promise<string> {
  const systemPrompt = `You are a helpful AI assistant for Guido Miranda's blog.
  ${context ? `Context: ${context}` : ''}
  Be friendly, concise, and informative.`;
  
  const openAIMessages = [
    { role: 'system', content: systemPrompt },
    ...messages.map(m => ({
      role: m.role,
      content: m.content
    }))
  ];
  
  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: openAIMessages,
    temperature: 0.7,
    max_tokens: 500
  });
  
  return response.choices[0].message.content;
}
```

## Optimización de Prompts

### Sistema de Templates
```typescript
const PROMPT_TEMPLATES = {
  blog_post: {
    system: `You are an expert technical blog writer.
    Write clear, engaging, and accurate content.
    
    Style guidelines:
    {guidelines}
    
    Tone: {tone}
    Target length: {length}`,
    
    user: `Write a blog post about: {topic}
    
    {outline ? `Structure:\n${outline.join('\n')}` : ''}
    
    {keywords ? `Keywords to include: ${keywords.join(', ')}` : ''}
    
    Format as JSON with keys: title, content, excerpt, tags`
  },
  
  summary: {
    system: `You are a professional content summarizer.
    Create concise, accurate summaries.
    Maximum length: {maxLength} characters.`,
    
    user: `Summarize this content:\n\n{content}`
  },
  
  chat: {
    system: `You are a helpful AI assistant for a technical blog.
    Answer questions about: web development, AI, software engineering.
    Be friendly and concise.`,
    
    user: `{question}`
  }
};
```

### Prompt Builder
```typescript
function buildPrompt(
  template: string,
  variables: Record<string, unknown>
): string {
  let prompt = template;
  
  for (const [key, value] of Object.entries(variables)) {
    const placeholder = `{${key}}`;
    prompt = prompt.replace(
      new RegExp(placeholder, 'g'),
      String(value)
    );
  }
  
  return prompt;
}
```

## Manejo de Errores

### Error: Rate Limit Exceeded
```typescript
{
  code: 'RATE_LIMIT_EXCEEDED',
  message: 'OpenAI API rate limit exceeded',
  recoverable: true,
  retryStrategy: {
    maxRetries: 3,
    backoffMs: [5000, 10000, 20000]
  }
}
```

### Error: Content Too Long
```typescript
{
  code: 'CONTENT_TOO_LONG',
  message: 'Generated content exceeds maximum length',
  recoverable: true,
  suggestion: 'Reduce maxTokens or simplify request'
}
```

### Error: Generation Failed
```typescript
{
  code: 'GENERATION_FAILED',
  message: 'Failed to generate content',
  recoverable: true,
  details: {
    reason: openAIError.message,
    model: request.config.model
  }
}
```

## Métricas

- `coder.generations.count` - Total generaciones
- `coder.generations.by_type` - Generaciones por tipo
- `coder.tokens.used` - Tokens consumidos
- `coder.cost.usd` - Costo total en USD
- `coder.quality.average_score` - Score promedio de calidad
- `coder.duration.average_ms` - Duración promedio

## Tests

### Test de Precondiciones
```typescript
describe('Coder Agent Preconditions', () => {
  it('rejects empty topic for blog post', async () => {
    const request = {
      type: 'blog_post',
      input: { topic: '' }
    };
    
    await expect(coderAgent.generate(request))
      .rejects.toThrow('valid input for type');
  });
  
  it('checks rate limit before generation', async () => {
    rateLimiter.checkLimit = jest.fn().mockResolvedValue(false);
    
    await expect(coderAgent.generate(validRequest))
      .rejects.toThrow('rate limit');
  });
});
```

### Test de Postcondiciones
```typescript
describe('Coder Agent Postconditions', () => {
  it('generates non-empty content', async () => {
    const result = await coderAgent.generate(validRequest);
    
    expect(result.success).toBe(true);
    expect(result.content.content.length).toBeGreaterThan(0);
  });
  
  it('includes complete metadata', async () => {
    const result = await coderAgent.generate(validRequest);
    
    expect(result.metadata.model).toBeDefined();
    expect(result.metadata.tokensUsed.total).toBeGreaterThan(0);
    expect(result.metadata.duration).toBeGreaterThan(0);
  });
});
```

### Test de Invariantes
```typescript
describe('Coder Agent Invariants', () => {
  it('generates deterministic content with temp=0', async () => {
    const request = {
      ...validRequest,
      config: { temperature: 0 }
    };
    
    const result1 = await coderAgent.generate(request);
    const result2 = await coderAgent.generate(request);
    
    expect(similarityScore(result1, result2)).toBeGreaterThan(0.95);
  });
  
  it('never exceeds cost limits', async () => {
    const result = await coderAgent.generate(validRequest);
    
    expect(result.metadata.costUSD).toBeLessThanOrEqual(1.0);
  });
});
```

## Ejemplos de Uso

### Ejemplo 1: Generar Post
```typescript
const result = await coderAgent.generate({
  type: 'blog_post',
  input: {
    topic: 'TypeScript 5.0 Features',
    keywords: ['TypeScript', 'Types', 'JavaScript']
  },
  config: {
    tone: 'professional',
    length: 'medium'
  }
});

console.log(result.content.title);
console.log(result.content.content);
console.log(`Cost: $${result.metadata.costUSD}`);
```

### Ejemplo 2: Generar Resumen
```typescript
const result = await coderAgent.generate({
  type: 'summary',
  input: {
    content: longBlogPostContent,
    maxLength: 150
  }
});

console.log(result.content.summary);
```

### Ejemplo 3: Chat Response
```typescript
const result = await coderAgent.generate({
  type: 'chat_response',
  input: {
    messages: conversationHistory,
    question: 'What is React Server Components?'
  }
});

console.log(result.content.message);
```

## Protocolo de Comunicación

Usa **PROTOCOL-001 (ACP)** para comunicación con otros agentes.

Ver: `docs/specs/protocols.md#PROTOCOL-001`

## Referencias
- **System Spec**: `docs/specs/system_spec.md`
- **OpenAI Client**: `src/lib/openai/client.ts`
- **Skill Specs**: `docs/specs/skill_specs/`
- **Related Agents**: Planner Agent, Reviewer Agent

---

**Versión**: 1.0.0  
**Fecha**: 2026-02-24  
**Estado**: 🟡 En Desarrollo
