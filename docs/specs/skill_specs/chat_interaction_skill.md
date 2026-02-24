# Skill Specification: Chat Interaction

## Identificador
**SKILL-006**: `chat_interaction`

## Objetivo
Proporcionar respuestas conversacionales inteligentes y contextuales a preguntas de usuarios sobre contenido del blog, tecnologías, y temas generales, manteniendo personalidad consistente y citando fuentes cuando sea apropiado.

## Responsabilidades
1. Comprender intención y contexto de consultas
2. Generar respuestas naturales y útiles
3. Citar posts relevantes del blog cuando aplique
4. Mantener contexto de conversación
5. Detectar preguntas fuera de alcance

## Inputs

### ChatInteractionInput
```typescript
interface ChatInteractionInput {
  message: string;
  
  conversationHistory?: ChatMessage[];
  
  userId?: string;
  
  context?: {
    currentPage?: string;     // URL or page ID
    recentPosts?: string[];   // Recently viewed posts
    userIntent?: 'question' | 'chitchat' | 'help' | 'feedback';
  };
  
  options?: {
    maxResponseLength?: number;    // Default: 500 words
    citeSources?: boolean;         // Default: true
    personality?: 'professional' | 'friendly' | 'concise';
  };
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}
```

### Ejemplo de Input
```typescript
const input: ChatInteractionInput = {
  message: '¿Cuáles son las principales ventajas de usar GraphQL?',
  
  conversationHistory: [
    {
      role: 'user',
      content: 'Hola, estoy aprendiendo sobre APIs',
      timestamp: new Date('2026-02-24T10:00:00Z')
    },
    {
      role: 'assistant',
      content: '¡Hola! Me alegra que estés aprendiendo sobre APIs. ¿En qué puedo ayudarte?',
      timestamp: new Date('2026-02-24T10:00:05Z')
    }
  ],
  
  userId: 'user-123',
  
  context: {
    currentPage: '/blog/graphql-vs-rest',
    recentPosts: ['post-graphql-vs-rest', 'post-api-design'],
    userIntent: 'question'
  },
  
  options: {
    maxResponseLength: 300,
    citeSources: true,
    personality: 'friendly'
  }
};
```

## Outputs

### ChatInteractionOutput
```typescript
interface ChatInteractionOutput {
  response: string;
  
  intent: DetectedIntent;
  
  sources?: Source[];  // Cited blog posts or references
  
  suggestions?: string[];  // Follow-up questions
  
  metadata: ChatMetadata;
}

interface DetectedIntent {
  type: 'question' | 'chitchat' | 'help' | 'feedback' | 'off-topic';
  confidence: number;  // 0-1
  topic?: string;
}

interface Source {
  postId: string;
  title: string;
  slug: string;
  excerpt: string;
  relevanceScore: number;  // 0-1
}

interface ChatMetadata {
  respondedAt: Date;
  model: string;
  tokensUsed: number;
  costUSD: number;
  durationMs: number;
  requiresHumanReview: boolean;
}
```

### Ejemplo de Output
```typescript
const output: ChatInteractionOutput = {
  response: `Las principales ventajas de GraphQL son:

1. **Solicitudes precisas**: Los clientes pueden pedir exactamente los datos que necesitan, evitando overfetching (recibir datos innecesarios) y underfetching (no recibir suficientes datos).

2. **Un solo endpoint**: A diferencia de REST donde cada recurso tiene su propio endpoint, GraphQL usa un único endpoint con un schema tipado que define todas las operaciones disponibles.

3. **Evolución sin versionado**: Puedes agregar nuevos campos y tipos sin afectar consultas existentes, eliminando la necesidad de versionado de API (v1, v2, etc.).

4. **Mejor DX**: Herramientas como GraphiQL proporcionan documentación automática, autocompletado y exploración interactiva del schema.

Puedes leer más detalles en mi artículo "GraphQL vs REST: ¿Cuál elegir?" que compara ambos enfoques en profundidad.`,
  
  intent: {
    type: 'question',
    confidence: 0.95,
    topic: 'GraphQL'
  },
  
  sources: [
    {
      postId: 'post-graphql-vs-rest',
      title: 'GraphQL vs REST: ¿Cuál elegir en 2026?',
      slug: 'graphql-vs-rest-cual-elegir-2026',
      excerpt: 'Analizamos las diferencias clave entre GraphQL y REST...',
      relevanceScore: 0.92
    }
  ],
  
  suggestions: [
    '¿Cuándo debería usar REST en lugar de GraphQL?',
    '¿GraphQL es más lento que REST?',
    '¿Cómo implemento GraphQL en Node.js?'
  ],
  
  metadata: {
    respondedAt: new Date(),
    model: 'gpt-4o-mini',
    tokensUsed: 550,
    costUSD: 0.002,
    durationMs: 1800,
    requiresHumanReview: false
  }
};
```

## Precondiciones

### PRE-CHAT-001: Mensaje No Vacío
```typescript
precondition NonEmptyMessage {
  check: (input: ChatInteractionInput) => {
    return input.message.trim().length > 0;
  };
  message: "Chat message must not be empty";
}
```

### PRE-CHAT-002: Historial Válido
```typescript
precondition ValidHistory {
  check: (input: ChatInteractionInput) => {
    if (!input.conversationHistory) return true;
    
    // History must alternate between user and assistant
    for (let i = 0; i < input.conversationHistory.length - 1; i++) {
      const current = input.conversationHistory[i];
      const next = input.conversationHistory[i + 1];
      
      if (current.role === next.role) return false;
    }
    
    return true;
  };
  message: "Conversation history must alternate between user and assistant";
}
```

## Postcondiciones

### POST-CHAT-001: Respuesta Completa
```typescript
postcondition CompleteResponse {
  check: (output: ChatInteractionOutput) => {
    return output.response.trim().length >= 20;
  };
  message: "Response must be at least 20 characters";
}
```

### POST-CHAT-002: Sources Si Citado
```typescript
postcondition SourcesIfCited {
  check: (output: ChatInteractionOutput) => {
    // If response mentions "artículo" or "post", sources should be provided
    const mentionsSources = /artículo|post|puedes leer/i.test(output.response);
    
    if (mentionsSources) {
      return output.sources && output.sources.length > 0;
    }
    
    return true;
  };
  message: "If response cites sources, sources array must be populated";
}
```

## Invariantes

### INV-CHAT-001: Respuesta Limitada
**Response length must not exceed maximum**
```typescript
invariant WithinLengthLimit {
  check: (output: ChatInteractionOutput, input: ChatInteractionInput) => {
    const maxWords = input.options?.maxResponseLength ?? 500;
    const wordCount = output.response.split(/\s+/).length;
    
    return wordCount <= maxWords * 1.1;  // 10% tolerance
  };
}
```

### INV-CHAT-002: Intent Confianza Alta
**Detected intent must have reasonable confidence**
```typescript
invariant ReasonableConfidence {
  check: (output: ChatInteractionOutput) => {
    return output.intent.confidence >= 0.6;
  };
}
```

### INV-CHAT-003: Sources Relevantes
**Cited sources must be relevant**
```typescript
invariant RelevantSources {
  check: (output: ChatInteractionOutput) => {
    if (!output.sources || output.sources.length === 0) return true;
    
    return output.sources.every(source =>
      source.relevanceScore >= 0.5
    );
  };
}
```

## Algoritmo

### Fase 1: Análisis de Intención
```typescript
function detectIntent(
  message: string,
  history?: ChatMessage[]
): DetectedIntent {
  const messageLower = message.toLowerCase();
  
  // Question patterns
  const questionWords = ['qué', 'cómo', 'cuál', 'cuándo', 'dónde', 'por qué', 'quién'];
  const isQuestion = questionWords.some(q => messageLower.includes(q)) ||
                     message.trim().endsWith('?');
  
  // Chitchat patterns
  const greetings = ['hola', 'buenos días', 'buenas tardes', 'hey'];
  const isGreeting = greetings.some(g => messageLower.startsWith(g));
  
  // Help patterns
  const helpWords = ['ayuda', 'help', 'no entiendo', 'cómo funciona'];
  const isHelp = helpWords.some(h => messageLower.includes(h));
  
  // Feedback patterns
  const feedbackWords = ['gracias', 'excelente', 'no sirve', 'error', 'problema'];
  const isFeedback = feedbackWords.some(f => messageLower.includes(f));
  
  let type: DetectedIntent['type'];
  let confidence: number;
  
  if (isQuestion) {
    type = 'question';
    confidence = 0.9;
  } else if (isHelp) {
    type = 'help';
    confidence = 0.85;
  } else if (isFeedback) {
    type = 'feedback';
    confidence = 0.8;
  } else if (isGreeting) {
    type = 'chitchat';
    confidence = 0.9;
  } else {
    type = 'chitchat';
    confidence = 0.6;
  }
  
  // Extract topic
  const topic = extractTopic(message);
  
  return { type, confidence, topic };
}

function extractTopic(message: string): string | undefined {
  const techKeywords = [
    'graphql', 'rest', 'api', 'react', 'typescript', 'javascript',
    'node', 'nextjs', 'database', 'firebase', 'authentication'
  ];
  
  const messageLower = message.toLowerCase();
  
  for (const keyword of techKeywords) {
    if (messageLower.includes(keyword)) {
      return keyword.charAt(0).toUpperCase() + keyword.slice(1);
    }
  }
  
  return undefined;
}
```

### Fase 2: Buscar Fuentes Relevantes
```typescript
async function findRelevantSources(
  message: string,
  intent: DetectedIntent
): Promise<Source[]> {
  if (intent.type !== 'question') return [];
  
  // Simple keyword-based search (use embeddings in production)
  const keywords = extractKeywords(message);
  
  const posts = await db.collection('posts')
    .find({
      $or: [
        { tags: { $in: keywords } },
        { title: { $regex: keywords.join('|'), $options: 'i' } },
        { body: { $regex: keywords.join('|'), $options: 'i' } }
      ]
    })
    .limit(3)
    .toArray();
  
  return posts.map(post => ({
    postId: post._id,
    title: post.title,
    slug: post.slug,
    excerpt: post.excerpt,
    relevanceScore: calculateRelevance(message, post)
  })).filter(source => source.relevanceScore >= 0.5);
}

function calculateRelevance(message: string, post: Post): number {
  const messageKeywords = extractKeywords(message);
  const postKeywords = extractKeywords(`${post.title} ${post.body}`);
  
  const overlap = messageKeywords.filter(kw =>
    postKeywords.includes(kw)
  ).length;
  
  return Math.min(1, overlap / messageKeywords.length);
}

function extractKeywords(text: string): string[] {
  const words = text.toLowerCase().split(/\s+/);
  const stopWords = ['el', 'la', 'de', 'que', 'y', 'a', 'en', 'un', 'es'];
  
  return words
    .filter(w => w.length > 3 && !stopWords.includes(w))
    .slice(0, 10);
}
```

### Fase 3: Generar Respuesta
```typescript
async function chatInteraction(
  input: ChatInteractionInput
): Promise<ChatInteractionOutput> {
  const startTime = Date.now();
  
  // Detect intent
  const intent = detectIntent(input.message, input.conversationHistory);
  
  // Find relevant sources
  const sources = await findRelevantSources(input.message, intent);
  
  // Build context for LLM
  const systemPrompt = buildSystemPrompt(input.options?.personality, sources);
  
  // Build conversation messages
  const messages: any[] = [
    { role: 'system', content: systemPrompt }
  ];
  
  // Add history
  if (input.conversationHistory) {
    input.conversationHistory.forEach(msg => {
      messages.push({
        role: msg.role,
        content: msg.content
      });
    });
  }
  
  // Add current message
  messages.push({
    role: 'user',
    content: input.message
  });
  
  // Call OpenAI
  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages,
    temperature: 0.7,
    max_tokens: (input.options?.maxResponseLength ?? 500) * 2  // Rough token estimate
  });
  
  const responseText = response.choices[0].message.content;
  
  // Generate follow-up suggestions
  const suggestions = await generateSuggestions(input.message, intent, sources);
  
  // Determine if human review needed
  const requiresHumanReview = intent.confidence < 0.7 || intent.type === 'off-topic';
  
  const durationMs = Date.now() - startTime;
  
  return {
    response: responseText,
    intent,
    sources: sources.length > 0 ? sources : undefined,
    suggestions,
    metadata: {
      respondedAt: new Date(),
      model: 'gpt-4o-mini',
      tokensUsed: response.usage.total_tokens,
      costUSD: calculateCost(response.usage, 'gpt-4o-mini'),
      durationMs,
      requiresHumanReview
    }
  };
}

function buildSystemPrompt(personality?: string, sources?: Source[]): string {
  let prompt = '';
  
  const personalities = {
    professional: 'Eres un asistente profesional y experto en desarrollo web y tecnología.',
    friendly: 'Eres un asistente amigable y cercano que ayuda con consultas sobre desarrollo y tecnología.',
    concise: 'Eres un asistente directo y conciso que proporciona respuestas precisas.'
  };
  
  prompt += personalities[personality || 'friendly'] + '\n\n';
  
  prompt += `Respondes preguntas sobre el contenido de un blog técnico que cubre temas como React, TypeScript, GraphQL, APIs, y desarrollo web en general.\n\n`;
  
  if (sources && sources.length > 0) {
    prompt += `FUENTES DISPONIBLES (cita estas si son relevantes):\n`;
    sources.forEach(source => {
      prompt += `- "${source.title}" (slug: ${source.slug}): ${source.excerpt}\n`;
    });
    prompt += `\n`;
  }
  
  prompt += `Directrices:
- Proporciona respuestas útiles y precisas
- Si citas un artículo del blog, menciona su título
- Si no sabes algo, admítelo honestamente
- Mantén un tono ${personality === 'concise' ? 'breve' : 'conversacional'}
- No inventes información que no conoces\n`;
  
  return prompt;
}

async function generateSuggestions(
  message: string,
  intent: DetectedIntent,
  sources: Source[]
): Promise<string[]> {
  if (intent.type !== 'question') return [];
  
  const suggestions: string[] = [];
  
  // Topic-based suggestions
  if (intent.topic) {
    suggestions.push(`¿Cuándo debería usar ${intent.topic}?`);
    suggestions.push(`¿Cuáles son las mejores prácticas con ${intent.topic}?`);
  }
  
  // Source-based suggestions
  if (sources.length > 0) {
    suggestions.push(`¿Puedes explicar más sobre ${sources[0].title}?`);
  }
  
  return suggestions.slice(0, 3);
}
```

## Métricas

- `skill.chat_interaction.invocations`
- `skill.chat_interaction.avg_response_length`
- `skill.chat_interaction.intent_distribution`
- `skill.chat_interaction.sources_cited_rate`
- `skill.chat_interaction.user_satisfaction` (if tracked)

## Tests

```typescript
describe('Chat Interaction Skill', () => {
  it('detects question intent', async () => {
    const input = {
      message: '¿Qué es GraphQL?'
    };
    
    const output = await chatInteractionSkill.execute(input);
    
    expect(output.intent.type).toBe('question');
    expect(output.intent.confidence).toBeGreaterThan(0.8);
  });
  
  it('provides sources for relevant questions', async () => {
    const input = {
      message: '¿Cuáles son las ventajas de GraphQL?',
      options: { citeSources: true }
    };
    
    const output = await chatInteractionSkill.execute(input);
    
    if (output.sources) {
      expect(output.sources.length).toBeGreaterThan(0);
      expect(output.sources[0].relevanceScore).toBeGreaterThanOrEqual(0.5);
    }
  });
});
```

## Protocolo

Usa **PROTOCOL-002 (Skill Execution Protocol)**.

## Referencias
- **System Spec**: `docs/specs/system_spec.md`
- **Existing Implementation**: `src/app/api/ai/chat/route.ts`

---

**Versión**: 1.0.0  
**Fecha**: 2026-02-24  
**Estado**: 🟡 En Desarrollo
