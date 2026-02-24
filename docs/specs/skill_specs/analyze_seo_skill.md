# Skill Specification: Analyze SEO

## Identificador
**SKILL-004**: `analyze_seo`

## Objetivo
Analizar contenido desde perspectiva de optimización para motores de búsqueda (SEO), generando score cuantitativo (0-100) y recomendaciones accionables para mejorar visibilidad y ranking.

## Responsabilidades
1. Analizar elementos on-page SEO (título, meta, headers, keywords)
2. Evaluar legibilidad y estructura del contenido
3. Verificar optimización de imágenes y enlaces
4. Calcular score SEO agregado (0-100)
5. Proveer recomendaciones priorizadas

## Inputs

### AnalyzeSEOInput
```typescript
interface AnalyzeSEOInput {
  content: SEOContent;
  
  targetKeywords?: string[];  // Primary keywords to optimize for
  
  competitorUrls?: string[];  // URLs to benchmark against
  
  options?: {
    checkReadability?: boolean;     // Default: true
    checkImages?: boolean;          // Default: true
    checkLinks?: boolean;           // Default: true
    checkMobile?: boolean;          // Default: false
  };
}

interface SEOContent {
  title: string;
  excerpt?: string;
  body: string;                     // Markdown or HTML
  slug?: string;
  tags?: string[];
  images?: ImageInfo[];
  links?: LinkInfo[];
}

interface ImageInfo {
  src: string;
  alt?: string;
  title?: string;
}

interface LinkInfo {
  href: string;
  text: string;
  internal: boolean;
}
```

### Ejemplo de Input
```typescript
const input: AnalyzeSEOInput = {
  content: {
    title: 'GraphQL vs REST: ¿Cuál elegir en 2026?',
    excerpt: 'Analizamos las diferencias clave entre GraphQL y REST...',
    body: '# GraphQL vs REST...',
    slug: 'graphql-vs-rest-cual-elegir-2026',
    tags: ['GraphQL', 'REST', 'API'],
    images: [
      {
        src: '/images/graphql-diagram.png',
        alt: 'Diagrama arquitectura GraphQL'
      }
    ],
    links: [
      {
        href: '/blog/api-design-principles',
        text: 'Principios de diseño de APIs',
        internal: true
      }
    ]
  },
  targetKeywords: ['GraphQL', 'REST API', 'API comparison'],
  options: {
    checkReadability: true,
    checkImages: true,
    checkLinks: true
  }
};
```

## Outputs

### AnalyzeSEOOutput
```typescript
interface AnalyzeSEOOutput {
  score: number;                  // 0-100 overall SEO score
  
  analysis: SEOAnalysis;
  
  issues: SEOIssue[];
  
  recommendations: SEORecommendation[];
  
  metadata: AnalysisMetadata;
}

interface SEOAnalysis {
  title: TitleAnalysis;
  meta: MetaAnalysis;
  content: ContentAnalysis;
  keywords: KeywordAnalysis;
  readability: ReadabilityAnalysis;
  technical: TechnicalAnalysis;
}

interface TitleAnalysis {
  score: number;                  // 0-100
  length: number;
  hasKeyword: boolean;
  optimal: boolean;               // 50-60 characters
  suggestions: string[];
}

interface MetaAnalysis {
  score: number;
  excerptLength: number;
  excerptOptimal: boolean;        // 150-160 characters
  suggestions: string[];
}

interface ContentAnalysis {
  score: number;
  wordCount: number;
  paragraphCount: number;
  headingStructure: HeadingStructure;
  keywordDensity: number;         // Percentage
  suggestions: string[];
}

interface KeywordAnalysis {
  score: number;
  targetKeywords: KeywordMetric[];
  suggestions: string[];
}

interface KeywordMetric {
  keyword: string;
  frequency: number;
  density: number;                // Percentage
  positions: string[];            // 'title', 'h1', 'h2', 'body'
  optimal: boolean;
}

interface ReadabilityAnalysis {
  score: number;
  fleschReadingEase: number;      // 0-100
  avgWordsPerSentence: number;
  avgSyllablesPerWord: number;
  readingLevel: string;           // e.g., "8th grade"
  suggestions: string[];
}

interface TechnicalAnalysis {
  score: number;
  images: ImageSEOAnalysis;
  links: LinkSEOAnalysis;
  slug: SlugAnalysis;
  suggestions: string[];
}

interface SEOIssue {
  category: 'title' | 'meta' | 'content' | 'keywords' | 'readability' | 'technical';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  impact: number;                 // 0-10 points lost
}

interface SEORecommendation {
  priority: 'high' | 'medium' | 'low';
  category: string;
  title: string;
  description: string;
  expectedImpact: number;         // 0-10 points gained
}

interface AnalysisMetadata {
  analyzedAt: Date;
  duration: number;
  contentLength: number;
  checksPerformed: string[];
}
```

### Ejemplo de Output
```typescript
const output: AnalyzeSEOOutput = {
  score: 78,
  
  analysis: {
    title: {
      score: 90,
      length: 44,
      hasKeyword: true,
      optimal: true,
      suggestions: []
    },
    meta: {
      score: 85,
      excerptLength: 158,
      excerptOptimal: true,
      suggestions: ['Consider adding target keyword at the beginning']
    },
    content: {
      score: 75,
      wordCount: 1850,
      paragraphCount: 24,
      headingStructure: {
        h1: 1,
        h2: 5,
        h3: 3
      },
      keywordDensity: 2.1,
      suggestions: ['Add more internal links', 'Include LSI keywords']
    },
    keywords: {
      score: 80,
      targetKeywords: [
        {
          keyword: 'GraphQL',
          frequency: 12,
          density: 0.65,
          positions: ['title', 'h1', 'h2', 'body'],
          optimal: true
        },
        {
          keyword: 'REST API',
          frequency: 8,
          density: 0.43,
          positions: ['h2', 'body'],
          optimal: true
        }
      ],
      suggestions: []
    },
    readability: {
      score: 70,
      fleschReadingEase: 58,
      avgWordsPerSentence: 18,
      avgSyllablesPerWord: 1.6,
      readingLevel: '10th-12th grade',
      suggestions: ['Simplify complex sentences', 'Use shorter paragraphs']
    },
    technical: {
      score: 65,
      images: {
        total: 3,
        withAlt: 2,
        optimized: 66
      },
      links: {
        total: 8,
        internal: 3,
        external: 5,
        broken: 0
      },
      slug: {
        score: 100,
        length: 37,
        hasKeyword: true,
        valid: true
      },
      suggestions: ['Add alt text to all images', 'Add more internal links']
    }
  },
  
  issues: [
    {
      category: 'technical',
      severity: 'medium',
      message: '1 image missing alt text',
      impact: 3
    },
    {
      category: 'content',
      severity: 'low',
      message: 'Low internal link count',
      impact: 2
    }
  ],
  
  recommendations: [
    {
      priority: 'high',
      category: 'technical',
      title: 'Add alt text to all images',
      description: 'Image at /images/rest-diagram.png is missing alt text. Add descriptive alt text for accessibility and SEO.',
      expectedImpact: 3
    },
    {
      priority: 'medium',
      category: 'content',
      title: 'Increase internal linking',
      description: 'Add 2-3 internal links to related articles to improve site structure and user navigation.',
      expectedImpact: 4
    }
  ],
  
  metadata: {
    analyzedAt: new Date(),
    duration: 850,
    contentLength: 11240,
    checksPerformed: ['title', 'meta', 'content', 'keywords', 'readability', 'images', 'links']
  }
};
```

## Precondiciones

### PRE-SEO-001: Contenido Completo
```typescript
precondition CompleteContent {
  check: (input: AnalyzeSEOInput) => {
    return (
      input.content.title.trim().length > 0 &&
      input.content.body.trim().length >= 100
    );
  };
  message: "Content must have title and body with at least 100 characters";
}
```

## Postcondiciones

### POST-SEO-001: Score Válido
```typescript
postcondition ValidScore {
  check: (output: AnalyzeSEOOutput) => {
    return output.score >= 0 && output.score <= 100;
  };
  message: "SEO score must be between 0 and 100";
}
```

### POST-SEO-002: Recomendaciones Priorizadas
```typescript
postcondition PrioritizedRecommendations {
  check: (output: AnalyzeSEOOutput) => {
    const highPriority = output.recommendations.filter(r => r.priority === 'high');
    const totalImpact = output.recommendations.reduce((sum, r) => sum + r.expectedImpact, 0);
    
    // High priority recommendations should have highest impact
    if (highPriority.length > 0) {
      const avgHighImpact = highPriority.reduce((sum, r) => sum + r.expectedImpact, 0) / highPriority.length;
      return avgHighImpact >= 3;
    }
    
    return true;
  };
  message: "High priority recommendations must have significant impact";
}
```

## Invariantes

### INV-SEO-001: Score Derivado de Componentes
**Overall score must be derived from component scores**
```typescript
invariant ScoreConsistency {
  check: (output: AnalyzeSEOOutput) => {
    const componentScores = [
      output.analysis.title.score,
      output.analysis.meta.score,
      output.analysis.content.score,
      output.analysis.keywords.score,
      output.analysis.readability.score,
      output.analysis.technical.score
    ];
    
    const avgComponentScore = componentScores.reduce((a, b) => a + b, 0) / componentScores.length;
    
    // Overall score should be within 5 points of average
    return Math.abs(output.score - avgComponentScore) <= 5;
  };
}
```

### INV-SEO-002: Issues Reflejan Score Bajo
**Low scores must have corresponding issues**
```typescript
invariant IssuesMatchScore {
  check: (output: AnalyzeSEOOutput) => {
    if (output.score < 50) {
      return output.issues.length >= 3;
    }
    if (output.score < 70) {
      return output.issues.length >= 1;
    }
    return true;
  };
}
```

## Algoritmo

### Fase 1: Análisis de Título
```typescript
function analyzeTitle(title: string, targetKeywords?: string[]): TitleAnalysis {
  const length = title.length;
  const optimal = length >= 50 && length <= 60;
  
  let hasKeyword = false;
  if (targetKeywords && targetKeywords.length > 0) {
    const titleLower = title.toLowerCase();
    hasKeyword = targetKeywords.some(kw =>
      titleLower.includes(kw.toLowerCase())
    );
  }
  
  let score = 50;
  
  // Length scoring
  if (optimal) score += 30;
  else if (length >= 40 && length <= 70) score += 20;
  else if (length < 30 || length > 80) score -= 20;
  
  // Keyword scoring
  if (hasKeyword) score += 20;
  
  const suggestions: string[] = [];
  if (!optimal) {
    if (length < 50) suggestions.push(`Increase title length to 50-60 characters (current: ${length})`);
    if (length > 60) suggestions.push(`Reduce title length to 50-60 characters (current: ${length})`);
  }
  
  if (!hasKeyword && targetKeywords) {
    suggestions.push(`Include target keyword in title: ${targetKeywords[0]}`);
  }
  
  return {
    score: Math.max(0, Math.min(100, score)),
    length,
    hasKeyword,
    optimal,
    suggestions
  };
}
```

### Fase 2: Análisis de Meta Description
```typescript
function analyzeMeta(excerpt: string | undefined, targetKeywords?: string[]): MetaAnalysis {
  if (!excerpt) {
    return {
      score: 0,
      excerptLength: 0,
      excerptOptimal: false,
      suggestions: ['Add meta description (excerpt) for better SEO']
    };
  }
  
  const length = excerpt.length;
  const optimal = length >= 150 && length <= 160;
  
  let score = 50;
  
  if (optimal) score += 40;
  else if (length >= 120 && length <= 180) score += 25;
  else if (length < 100 || length > 200) score -= 20;
  
  if (targetKeywords) {
    const excerptLower = excerpt.toLowerCase();
    const hasKeyword = targetKeywords.some(kw =>
      excerptLower.includes(kw.toLowerCase())
    );
    if (hasKeyword) score += 10;
  }
  
  const suggestions: string[] = [];
  if (!optimal) {
    if (length < 150) suggestions.push(`Increase meta description to 150-160 characters (current: ${length})`);
    if (length > 160) suggestions.push(`Reduce meta description to 150-160 characters (current: ${length})`);
  }
  
  return {
    score: Math.max(0, Math.min(100, score)),
    excerptLength: length,
    excerptOptimal: optimal,
    suggestions
  };
}
```

### Fase 3: Análisis de Contenido
```typescript
function analyzeContent(body: string, targetKeywords?: string[]): ContentAnalysis {
  const wordCount = body.split(/\s+/).length;
  const paragraphCount = body.split(/\n\n+/).length;
  
  // Extract heading structure
  const headingMatches = body.match(/^#{1,6}\s+.+$/gm) || [];
  const headingStructure = {
    h1: headingMatches.filter(h => h.startsWith('# ')).length,
    h2: headingMatches.filter(h => h.startsWith('## ')).length,
    h3: headingMatches.filter(h => h.startsWith('### ')).length
  };
  
  // Calculate keyword density
  let keywordDensity = 0;
  if (targetKeywords && targetKeywords.length > 0) {
    const bodyLower = body.toLowerCase();
    const keywordCount = targetKeywords.reduce((count, kw) => {
      const regex = new RegExp(kw.toLowerCase(), 'g');
      const matches = bodyLower.match(regex);
      return count + (matches?.length || 0);
    }, 0);
    keywordDensity = (keywordCount / wordCount) * 100;
  }
  
  let score = 50;
  
  // Word count scoring
  if (wordCount >= 800 && wordCount <= 2500) score += 20;
  else if (wordCount >= 500) score += 10;
  else if (wordCount < 300) score -= 20;
  
  // Heading structure scoring
  if (headingStructure.h1 === 1 && headingStructure.h2 >= 3) score += 15;
  else if (headingStructure.h1 === 1) score += 5;
  
  // Keyword density scoring (optimal: 1-3%)
  if (keywordDensity >= 1 && keywordDensity <= 3) score += 15;
  else if (keywordDensity > 0) score += 5;
  
  const suggestions: string[] = [];
  if (wordCount < 800) {
    suggestions.push(`Increase content length to at least 800 words (current: ${wordCount})`);
  }
  if (headingStructure.h1 === 0) {
    suggestions.push('Add H1 heading');
  }
  if (headingStructure.h2 < 3) {
    suggestions.push('Add more H2 headings for better structure');
  }
  if (keywordDensity < 1) {
    suggestions.push('Increase keyword density (aim for 1-3%)');
  } else if (keywordDensity > 3) {
    suggestions.push('Reduce keyword stuffing (density above 3%)');
  }
  
  return {
    score: Math.max(0, Math.min(100, score)),
    wordCount,
    paragraphCount,
    headingStructure,
    keywordDensity,
    suggestions
  };
}
```

### Fase 4: Análisis de Keywords
```typescript
function analyzeKeywords(content: SEOContent, targetKeywords?: string[]): KeywordAnalysis {
  if (!targetKeywords || targetKeywords.length === 0) {
    return {
      score: 50,
      targetKeywords: [],
      suggestions: ['Define target keywords for better optimization']
    };
  }
  
  const fullText = `${content.title} ${content.body}`.toLowerCase();
  const metrics: KeywordMetric[] = [];
  
  for (const keyword of targetKeywords) {
    const keywordLower = keyword.toLowerCase();
    const regex = new RegExp(keywordLower, 'g');
    const matches = fullText.match(regex);
    const frequency = matches?.length || 0;
    
    const wordCount = content.body.split(/\s+/).length;
    const density = (frequency / wordCount) * 100;
    
    const positions: string[] = [];
    if (content.title.toLowerCase().includes(keywordLower)) positions.push('title');
    
    const h1Match = content.body.match(/^#\s+(.+)$/m);
    if (h1Match && h1Match[1].toLowerCase().includes(keywordLower)) positions.push('h1');
    
    const h2Matches = content.body.match(/^##\s+(.+)$/gm);
    if (h2Matches && h2Matches.some(h => h.toLowerCase().includes(keywordLower))) positions.push('h2');
    
    if (content.body.toLowerCase().includes(keywordLower)) positions.push('body');
    
    const optimal = density >= 0.5 && density <= 2 && positions.length >= 2;
    
    metrics.push({
      keyword,
      frequency,
      density,
      positions,
      optimal
    });
  }
  
  const optimalCount = metrics.filter(m => m.optimal).length;
  const score = (optimalCount / metrics.length) * 100;
  
  const suggestions: string[] = [];
  metrics.forEach(m => {
    if (!m.optimal) {
      if (m.density < 0.5) {
        suggestions.push(`Increase usage of "${m.keyword}" (current density: ${m.density.toFixed(2)}%)`);
      }
      if (m.positions.length < 2) {
        suggestions.push(`Include "${m.keyword}" in more prominent positions`);
      }
    }
  });
  
  return {
    score,
    targetKeywords: metrics,
    suggestions
  };
}
```

### Fase 5: Análisis de Legibilidad (Flesch Reading Ease)
```typescript
function analyzeReadability(body: string): ReadabilityAnalysis {
  const sentences = body.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const words = body.split(/\s+/);
  const syllables = words.reduce((count, word) => count + countSyllables(word), 0);
  
  const avgWordsPerSentence = words.length / sentences.length;
  const avgSyllablesPerWord = syllables / words.length;
  
  // Flesch Reading Ease formula: 206.835 - 1.015(words/sentences) - 84.6(syllables/words)
  const fleschScore = 206.835 - (1.015 * avgWordsPerSentence) - (84.6 * avgSyllablesPerWord);
  const fleschReadingEase = Math.max(0, Math.min(100, fleschScore));
  
  let readingLevel: string;
  if (fleschReadingEase >= 90) readingLevel = '5th grade';
  else if (fleschReadingEase >= 80) readingLevel = '6th grade';
  else if (fleschReadingEase >= 70) readingLevel = '7th grade';
  else if (fleschReadingEase >= 60) readingLevel = '8th-9th grade';
  else if (fleschReadingEase >= 50) readingLevel = '10th-12th grade';
  else if (fleschReadingEase >= 30) readingLevel = 'College';
  else readingLevel = 'College graduate';
  
  // SEO score: aim for 60-80 (8th-10th grade)
  let score = 50;
  if (fleschReadingEase >= 60 && fleschReadingEase <= 80) score = 100;
  else if (fleschReadingEase >= 50 && fleschReadingEase <= 90) score = 80;
  else if (fleschReadingEase >= 40 && fleschReadingEase <= 95) score = 60;
  else score = 40;
  
  const suggestions: string[] = [];
  if (avgWordsPerSentence > 20) {
    suggestions.push(`Shorten sentences (avg: ${avgWordsPerSentence.toFixed(1)} words/sentence)`);
  }
  if (fleschReadingEase < 60) {
    suggestions.push('Simplify language for better readability');
  }
  
  return {
    score,
    fleschReadingEase,
    avgWordsPerSentence,
    avgSyllablesPerWord,
    readingLevel,
    suggestions
  };
}

function countSyllables(word: string): number {
  word = word.toLowerCase().replace(/[^a-z]/g, '');
  if (word.length <= 3) return 1;
  
  const vowels = 'aeiouy';
  let count = 0;
  let prevWasVowel = false;
  
  for (let i = 0; i < word.length; i++) {
    const isVowel = vowels.includes(word[i]);
    if (isVowel && !prevWasVowel) count++;
    prevWasVowel = isVowel;
  }
  
  // Adjust for silent 'e'
  if (word.endsWith('e')) count--;
  
  return Math.max(1, count);
}
```

## Métricas

- `skill.analyze_seo.invocations` - Total invocaciones
- `skill.analyze_seo.avg_score` - Score SEO promedio
- `skill.analyze_seo.avg_duration_ms` - Duración promedio
- `skill.analyze_seo.score_distribution` - Distribución de scores

## Tests

### Test de Invariantes
```typescript
describe('Analyze SEO Skill - Invariants', () => {
  it('overall score consistent with components', async () => {
    const output = await analyzeSEOSkill.execute(validInput);
    
    const componentScores = [
      output.analysis.title.score,
      output.analysis.meta.score,
      output.analysis.content.score,
      output.analysis.keywords.score,
      output.analysis.readability.score,
      output.analysis.technical.score
    ];
    
    const avgScore = componentScores.reduce((a, b) => a + b, 0) / componentScores.length;
    
    expect(Math.abs(output.score - avgScore)).toBeLessThanOrEqual(5);
  });
});
```

## Protocolo

Usa **PROTOCOL-002 (Skill Execution Protocol)**.

## Referencias
- **System Spec**: `docs/specs/system_spec.md`
- **Reviewer Agent**: `docs/specs/agent_specs/reviewer_agent.md`

---

**Versión**: 1.0.0  
**Fecha**: 2026-02-24  
**Estado**: 🟡 En Desarrollo
