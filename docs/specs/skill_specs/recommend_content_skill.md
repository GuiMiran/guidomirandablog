# Skill Specification: Recommend Content

## Identificador
**SKILL-005**: `recommend_content`

## Objetivo
Generar recomendaciones personalizadas de contenido basadas en historial de usuario, preferencias, similaridad semántica y tendencias, maximizando relevancia y engagement.

## Responsabilidades
1. Analizar historial y preferencias de usuario
2. Calcular similaridad entre posts
3. Identificar trending topics
4. Generar recomendaciones personalizadas
5. Explicar razón de cada recomendación

## Inputs

### RecommendContentInput
```typescript
interface RecommendContentInput {
  userId?: string;
  
  currentPostId?: string;  // For "related posts" recommendations
  
  userHistory?: UserHistory;
  
  preferences?: UserPreferences;
  
  context?: {
    maxRecommendations?: number;  // Default: 5
    includeExplanations?: boolean;  // Default: true
    diversityWeight?: number;  // 0-1, default: 0.3
  };
}

interface UserHistory {
  viewedPosts: string[];
  likedPosts?: string[];
  bookmarkedPosts?: string[];
  searchQueries?: string[];
}

interface UserPreferences {
  favoriteCategories?: string[];
  favoriteTags?: string[];
  preferredTone?: string;
  contentLength?: 'short' | 'medium' | 'long';
}
```

### Ejemplo de Input
```typescript
const input: RecommendContentInput = {
  userId: 'user-123',
  currentPostId: 'post-graphql-vs-rest',
  
  userHistory: {
    viewedPosts: ['post-react-hooks', 'post-typescript-intro', 'post-graphql-vs-rest'],
    likedPosts: ['post-react-hooks'],
    searchQueries: ['GraphQL tutorial', 'React best practices']
  },
  
  preferences: {
    favoriteCategories: ['Web Development', 'Frontend'],
    favoriteTags: ['React', 'TypeScript', 'GraphQL'],
    preferredTone: 'technical',
    contentLength: 'medium'
  },
  
  context: {
    maxRecommendations: 5,
    includeExplanations: true,
    diversityWeight: 0.3
  }
};
```

## Outputs

### RecommendContentOutput
```typescript
interface RecommendContentOutput {
  recommendations: Recommendation[];
  
  metadata: RecommendationMetadata;
}

interface Recommendation {
  postId: string;
  title: string;
  slug: string;
  category: string;
  tags: string[];
  
  score: number;              // 0-100 relevance score
  
  reasons: RecommendationReason[];
  
  rank: number;               // 1, 2, 3, ...
}

interface RecommendationReason {
  type: 'similar-content' | 'user-preference' | 'trending' | 'same-category' | 'same-tags';
  weight: number;             // Contribution to final score
  explanation: string;
}

interface RecommendationMetadata {
  generatedAt: Date;
  userId?: string;
  totalCandidates: number;
  algorithmUsed: string;
  durationMs: number;
}
```

### Ejemplo de Output
```typescript
const output: RecommendContentOutput = {
  recommendations: [
    {
      postId: 'post-apollo-client-intro',
      title: 'Introducción a Apollo Client',
      slug: 'apollo-client-intro',
      category: 'Web Development',
      tags: ['GraphQL', 'React', 'Apollo'],
      score: 92,
      reasons: [
        {
          type: 'user-preference',
          weight: 35,
          explanation: 'Contiene tus tags favoritos: GraphQL, React'
        },
        {
          type: 'similar-content',
          weight: 40,
          explanation: 'Muy similar a "GraphQL vs REST" que acabas de leer'
        },
        {
          type: 'trending',
          weight: 17,
          explanation: 'Post popular esta semana (250 vistas)'
        }
      ],
      rank: 1
    },
    {
      postId: 'post-typescript-generics',
      title: 'TypeScript Generics Explicados',
      slug: 'typescript-generics',
      category: 'Web Development',
      tags: ['TypeScript', 'Advanced'],
      score: 78,
      reasons: [
        {
          type: 'user-preference',
          weight: 30,
          explanation: 'Contiene tu tag favorito: TypeScript'
        },
        {
          type: 'same-category',
          weight: 28,
          explanation: 'Misma categoría que tus posts favoritos'
        },
        {
          type: 'similar-content',
          weight: 20,
          explanation: 'Relacionado con "TypeScript Intro" que viste antes'
        }
      ],
      rank: 2
    }
    // ... more recommendations
  ],
  
  metadata: {
    generatedAt: new Date(),
    userId: 'user-123',
    totalCandidates: 45,
    algorithmUsed: 'hybrid-collaborative-content',
    durationMs: 125
  }
};
```

## Precondiciones

### PRE-REC-001: Contenido Disponible
```typescript
precondition ContentAvailable {
  check: async () => {
    const postCount = await db.collection('posts').count();
    return postCount >= 3;
  };
  message: "Must have at least 3 posts to generate recommendations";
}
```

### PRE-REC-002: Contexto Válido
```typescript
precondition ValidContext {
  check: (input: RecommendContentInput) => {
    // Either userId or currentPostId must be provided
    return !!(input.userId || input.currentPostId);
  };
  message: "Must provide userId or currentPostId for recommendations";
}
```

## Postcondiciones

### POST-REC-001: Recomendaciones Ordenadas
```typescript
postcondition OrderedByScore {
  check: (output: RecommendContentOutput) => {
    for (let i = 0; i < output.recommendations.length - 1; i++) {
      if (output.recommendations[i].score < output.recommendations[i + 1].score) {
        return false;
      }
    }
    return true;
  };
  message: "Recommendations must be ordered by descending score";
}
```

### POST-REC-002: Ranks Consecutivos
```typescript
postcondition ConsecutiveRanks {
  check: (output: RecommendContentOutput) => {
    return output.recommendations.every((rec, index) =>
      rec.rank === index + 1
    );
  };
  message: "Ranks must be consecutive starting from 1";
}
```

## Invariantes

### INV-REC-001: Scores Válidos
**All recommendation scores must be 0-100**
```typescript
invariant ValidScores {
  check: (output: RecommendContentOutput) => {
    return output.recommendations.every(rec =>
      rec.score >= 0 && rec.score <= 100
    );
  };
}
```

### INV-REC-002: Razones Suman Score
**Recommendation reasons weights should approximately sum to score**
```typescript
invariant ReasonsMatchScore {
  check: (output: RecommendContentOutput) => {
    return output.recommendations.every(rec => {
      const totalWeight = rec.reasons.reduce((sum, r) => sum + r.weight, 0);
      return Math.abs(totalWeight - rec.score) <= 10;
    });
  };
}
```

### INV-REC-003: Sin Duplicados
**Recommendations must not contain duplicates**
```typescript
invariant NoDuplicates {
  check: (output: RecommendContentOutput) => {
    const postIds = output.recommendations.map(r => r.postId);
    return new Set(postIds).size === postIds.length;
  };
}
```

## Algoritmo

### Fase 1: Obtener Candidatos
```typescript
async function getCandidates(input: RecommendContentInput): Promise<Post[]> {
  const query: any = {
    published: true
  };
  
  // Exclude already viewed
  if (input.userHistory?.viewedPosts) {
    query._id = { $nin: input.userHistory.viewedPosts };
  }
  
  // Filter by preferred categories
  if (input.preferences?.favoriteCategories) {
    query.category = { $in: input.preferences.favoriteCategories };
  }
  
  const candidates = await db.collection('posts')
    .find(query)
    .limit(50)
    .toArray();
  
  return candidates;
}
```

### Fase 2: Calcular Scores
```typescript
function calculateRecommendationScore(
  post: Post,
  input: RecommendContentInput,
  currentPost?: Post
): { score: number; reasons: RecommendationReason[] } {
  const reasons: RecommendationReason[] = [];
  let totalScore = 0;
  
  // 1. User Preference Score (max 40 points)
  if (input.preferences) {
    const prefScore = calculatePreferenceScore(post, input.preferences);
    if (prefScore > 0) {
      totalScore += prefScore;
      reasons.push({
        type: 'user-preference',
        weight: prefScore,
        explanation: explainPreferenceMatch(post, input.preferences)
      });
    }
  }
  
  // 2. Content Similarity Score (max 40 points)
  if (currentPost) {
    const simScore = calculateSimilarityScore(post, currentPost);
    if (simScore > 0) {
      totalScore += simScore;
      reasons.push({
        type: 'similar-content',
        weight: simScore,
        explanation: `Muy similar a "${currentPost.title}"`
      });
    }
  }
  
  // 3. Trending Score (max 20 points)
  const trendScore = calculateTrendingScore(post);
  if (trendScore > 0) {
    totalScore += trendScore;
    reasons.push({
      type: 'trending',
      weight: trendScore,
      explanation: `Post popular esta semana (${post.viewCount} vistas)`
    });
  }
  
  return {
    score: Math.min(100, totalScore),
    reasons
  };
}

function calculatePreferenceScore(post: Post, prefs: UserPreferences): number {
  let score = 0;
  
  // Category match (15 points)
  if (prefs.favoriteCategories?.includes(post.category)) {
    score += 15;
  }
  
  // Tag overlap (20 points max)
  if (prefs.favoriteTags && post.tags) {
    const matchingTags = post.tags.filter(tag =>
      prefs.favoriteTags!.includes(tag)
    );
    score += Math.min(20, matchingTags.length * 7);
  }
  
  // Content length preference (5 points)
  if (prefs.contentLength) {
    const wordCount = post.body.split(/\s+/).length;
    const lengthMatch = {
      short: wordCount < 800,
      medium: wordCount >= 800 && wordCount <= 2000,
      long: wordCount > 2000
    };
    
    if (lengthMatch[prefs.contentLength]) {
      score += 5;
    }
  }
  
  return score;
}

function calculateSimilarityScore(post1: Post, post2: Post): number {
  let score = 0;
  
  // Tag overlap (20 points)
  const commonTags = post1.tags.filter(tag => post2.tags.includes(tag));
  score += Math.min(20, commonTags.length * 7);
  
  // Same category (15 points)
  if (post1.category === post2.category) {
    score += 15;
  }
  
  // Content similarity (5 points) - simplified, use embeddings in production
  const keywords1 = extractKeywords(post1.body);
  const keywords2 = extractKeywords(post2.body);
  const commonKeywords = keywords1.filter(kw => keywords2.includes(kw));
  score += Math.min(5, commonKeywords.length);
  
  return score;
}

function calculateTrendingScore(post: Post): number {
  const daysSincePublished = (Date.now() - post.publishedAt.getTime()) / (1000 * 60 * 60 * 24);
  
  // Recency bonus (posts from last 30 days)
  if (daysSincePublished > 30) return 0;
  
  const recencyFactor = 1 - (daysSincePublished / 30);
  
  // View count factor
  const viewScore = Math.min(10, post.viewCount / 50);
  
  // Like count factor
  const likeScore = Math.min(5, (post.likeCount || 0) / 10);
  
  return Math.round((viewScore + likeScore) * recencyFactor);
}
```

### Fase 3: Aplicar Diversidad
```typescript
function applyDiversityFilter(
  recommendations: Recommendation[],
  diversityWeight: number
): Recommendation[] {
  // Ensure some diversity in recommendations
  const result: Recommendation[] = [];
  const seenCategories = new Set<string>();
  const seenTags = new Set<string>();
  
  for (const rec of recommendations) {
    let diversityPenalty = 0;
    
    // Penalize if category already seen
    if (seenCategories.has(rec.category)) {
      diversityPenalty += 10 * diversityWeight;
    }
    
    // Penalize if tags heavily overlap
    const tagOverlap = rec.tags.filter(tag => seenTags.has(tag)).length;
    diversityPenalty += (tagOverlap * 5) * diversityWeight;
    
    rec.score -= diversityPenalty;
    
    result.push(rec);
    seenCategories.add(rec.category);
    rec.tags.forEach(tag => seenTags.add(tag));
  }
  
  // Re-sort after diversity adjustment
  return result.sort((a, b) => b.score - a.score);
}
```

### Fase 4: Generar Recomendaciones
```typescript
async function recommendContent(
  input: RecommendContentInput
): Promise<RecommendContentOutput> {
  const startTime = Date.now();
  
  // Get current post if provided
  let currentPost: Post | undefined;
  if (input.currentPostId) {
    currentPost = await db.collection('posts').findOne({ _id: input.currentPostId });
  }
  
  // Get candidates
  const candidates = await getCandidates(input);
  
  // Calculate scores
  const scoredCandidates = candidates.map(post => {
    const { score, reasons } = calculateRecommendationScore(post, input, currentPost);
    
    return {
      postId: post._id,
      title: post.title,
      slug: post.slug,
      category: post.category,
      tags: post.tags,
      score,
      reasons,
      rank: 0  // Will be set after sorting
    };
  });
  
  // Sort by score
  scoredCandidates.sort((a, b) => b.score - a.score);
  
  // Apply diversity filter
  const diversityWeight = input.context?.diversityWeight ?? 0.3;
  const diversified = applyDiversityFilter(scoredCandidates, diversityWeight);
  
  // Take top N
  const maxRecs = input.context?.maxRecommendations ?? 5;
  const topRecommendations = diversified.slice(0, maxRecs);
  
  // Assign ranks
  topRecommendations.forEach((rec, index) => {
    rec.rank = index + 1;
  });
  
  const durationMs = Date.now() - startTime;
  
  return {
    recommendations: topRecommendations,
    metadata: {
      generatedAt: new Date(),
      userId: input.userId,
      totalCandidates: candidates.length,
      algorithmUsed: 'hybrid-collaborative-content',
      durationMs
    }
  };
}
```

## Métricas

- `skill.recommend_content.invocations`
- `skill.recommend_content.avg_candidates`
- `skill.recommend_content.avg_score`
- `skill.recommend_content.click_through_rate` (if tracked)

## Tests

```typescript
describe('Recommend Content Skill', () => {
  it('orders recommendations by score', async () => {
    const output = await recommendContentSkill.execute(validInput);
    
    for (let i = 0; i < output.recommendations.length - 1; i++) {
      expect(output.recommendations[i].score).toBeGreaterThanOrEqual(
        output.recommendations[i + 1].score
      );
    }
  });
  
  it('contains no duplicates', async () => {
    const output = await recommendContentSkill.execute(validInput);
    const postIds = output.recommendations.map(r => r.postId);
    expect(new Set(postIds).size).toBe(postIds.length);
  });
});
```

## Protocolo

Usa **PROTOCOL-002 (Skill Execution Protocol)**.

## Referencias
- **System Spec**: `docs/specs/system_spec.md`

---

**Versión**: 1.0.0  
**Fecha**: 2026-02-24  
**Estado**: 🟡 En Desarrollo
