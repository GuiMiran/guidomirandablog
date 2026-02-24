/**
 * SKILL-005: Recommend Content
 * 
 * Generate personalized content recommendations
 * Following specification: docs/specs/skill_specs/recommend_content_skill.md
 */

import { BaseSkill, ValidationError } from './base';

// ============================================================================
// Types
// ============================================================================

export interface RecommendContentInput {
  userId?: string;
  currentPostId?: string;
  userHistory?: UserHistory;
  preferences?: UserPreferences;
  context?: RecommendationContext;
}

export interface UserHistory {
  viewedPosts: string[];
  likedPosts?: string[];
  bookmarkedPosts?: string[];
  searchQueries?: string[];
}

export interface UserPreferences {
  favoriteCategories?: string[];
  favoriteTags?: string[];
  preferredTone?: string;
  contentLength?: 'short' | 'medium' | 'long';
}

export interface RecommendationContext {
  maxRecommendations?: number;
  includeExplanations?: boolean;
  diversityWeight?: number;
}

export interface RecommendContentOutput {
  recommendations: Recommendation[];
  metadata: RecommendationMetadata;
}

export interface Recommendation {
  postId: string;
  title: string;
  slug: string;
  category: string;
  tags: string[];
  score: number;
  reasons: RecommendationReason[];
  rank: number;
}

export interface RecommendationReason {
  type: 'similar-content' | 'user-preference' | 'trending' | 'same-category' | 'same-tags';
  weight: number;
  explanation: string;
}

export interface RecommendationMetadata {
  generatedAt: Date;
  userId?: string;
  totalCandidates: number;
  algorithmUsed: string;
  durationMs: number;
}

// Internal types
interface CandidatePost {
  postId: string;
  title: string;
  slug: string;
  category: string;
  tags: string[];
  views?: number;
  likes?: number;
  publishedAt?: Date;
  contentSummary?: string;
}

// ============================================================================
// Skill Implementation
// ============================================================================

export class RecommendContentSkill extends BaseSkill<RecommendContentInput, RecommendContentOutput> {
  readonly id = 'recommend_content';
  readonly name = 'Recommend Content';
  readonly description = 'Generate personalized content recommendations';
  
  // ====================================
  // Preconditions
  // ====================================
  
  protected async checkPreconditions(input: RecommendContentInput): Promise<ValidationError[]> {
    const errors: ValidationError[] = [];
    
    // PRE-REC-001: Contenido Disponible (at least 3 posts)
    // In production, this would check actual database
    // For now, we'll assume posts are available
    
    // PRE-REC-002: Contexto Válido
    if (input.context?.maxRecommendations && input.context.maxRecommendations < 1) {
      errors.push({
        code: 'PRE-REC-002',
        message: 'maxRecommendations must be at least 1',
        field: 'context.maxRecommendations'
      });
    }
    
    if (input.context?.diversityWeight !== undefined) {
      if (input.context.diversityWeight < 0 || input.context.diversityWeight > 1) {
        errors.push({
          code: 'PRE-REC-002',
          message: 'diversityWeight must be between 0 and 1',
          field: 'context.diversityWeight'
        });
      }
    }
    
    return errors;
  }
  
  // ====================================
  // Postconditions
  // ====================================
  
  protected async checkPostconditions(output: RecommendContentOutput, input: RecommendContentInput): Promise<ValidationError[]> {
    const errors: ValidationError[] = [];
    
    const maxRecs = input.context?.maxRecommendations || 5;
    
    // POST-REC-001: Recomendaciones Dentro del Límite
    if (output.recommendations.length > maxRecs) {
      errors.push({
        code: 'POST-REC-001',
        message: `Must return at most ${maxRecs} recommendations`
      });
    }
    
    // POST-REC-002: Scores en Rango Válido
    const invalidScores = output.recommendations.filter(r => r.score < 0 || r.score > 100);
    if (invalidScores.length > 0) {
      errors.push({
        code: 'POST-REC-002',
        message: 'All recommendation scores must be between 0 and 100'
      });
    }
    
    return errors;
  }
  
  // ====================================
  // Invariants
  // ====================================
  
  protected async checkInvariants(output: RecommendContentOutput, input: RecommendContentInput): Promise<ValidationError[]> {
    const errors: ValidationError[] = [];
    
    // INV-REC-001: Ordenamiento por Score
    for (let i = 0; i < output.recommendations.length - 1; i++) {
      if (output.recommendations[i].score < output.recommendations[i + 1].score) {
        errors.push({
          code: 'INV-REC-001',
          message: 'Recommendations must be sorted by score (descending)'
        });
        break;
      }
    }
    
    // INV-REC-002: Sin Duplicados
    const postIds = output.recommendations.map(r => r.postId);
    const uniquePostIds = new Set(postIds);
    if (postIds.length !== uniquePostIds.size) {
      errors.push({
        code: 'INV-REC-002',
        message: 'Recommendations must not contain duplicate posts'
      });
    }
    
    // INV-REC-003: Excluir Post Actual
    if (input.currentPostId) {
      const containsCurrent = output.recommendations.some(r => r.postId === input.currentPostId);
      if (containsCurrent) {
        errors.push({
          code: 'INV-REC-003',
          message: 'Recommendations must not include the current post'
        });
      }
    }
    
    return errors;
  }
  
  // ====================================
  // Implementation
  // ====================================
  
  protected async executeImpl(input: RecommendContentInput, context: any): Promise<RecommendContentOutput> {
    const startTime = Date.now();
    
    const maxRecs = input.context?.maxRecommendations || 5;
    const includeExplanations = input.context?.includeExplanations ?? true;
    const diversityWeight = input.context?.diversityWeight ?? 0.3;
    
    // Step 1: Get all candidate posts
    const candidates = await this.getCandidatePosts(input);
    
    // Step 2: Score each candidate
    const scoredCandidates = candidates.map(candidate => {
      const score = this.calculateRecommendationScore(candidate, input, diversityWeight);
      const reasons = this.generateReasons(candidate, input, score);
      
      return {
        ...candidate,
        score: score.total,
        reasons: includeExplanations ? reasons : []
      };
    });
    
    // Step 3: Sort and limit
    scoredCandidates.sort((a, b) => b.score - a.score);
    const topRecommendations = scoredCandidates.slice(0, maxRecs);
    
    // Step 4: Format output
    const recommendations: Recommendation[] = topRecommendations.map((rec, index) => ({
      postId: rec.postId,
      title: rec.title,
      slug: rec.slug,
      category: rec.category,
      tags: rec.tags,
      score: Math.round(rec.score),
      reasons: rec.reasons,
      rank: index + 1
    }));
    
    const durationMs = Date.now() - startTime;
    
    return {
      recommendations,
      metadata: {
        generatedAt: new Date(),
        userId: input.userId,
        totalCandidates: candidates.length,
        algorithmUsed: 'hybrid-collaborative-content',
        durationMs
      }
    };
  }
  
  // ====================================
  // Helper Methods
  // ====================================
  
  private async getCandidatePosts(input: RecommendContentInput): Promise<CandidatePost[]> {
    // In production, this would fetch from database
    // For now, return mock data
    
    const mockPosts: CandidatePost[] = [
      {
        postId: 'post-apollo-client-intro',
        title: 'Introducción a Apollo Client',
        slug: 'apollo-client-intro',
        category: 'Web Development',
        tags: ['GraphQL', 'React', 'Apollo'],
        views: 250,
        likes: 45,
        publishedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
        contentSummary: 'Apollo Client is a comprehensive state management library for JavaScript'
      },
      {
        postId: 'post-typescript-generics',
        title: 'TypeScript Generics Explicados',
        slug: 'typescript-generics',
        category: 'Web Development',
        tags: ['TypeScript', 'Advanced'],
        views: 180,
        likes: 32,
        publishedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
        contentSummary: 'Deep dive into TypeScript generics and type parameters'
      },
      {
        postId: 'post-react-performance',
        title: 'Optimizando el Rendimiento en React',
        slug: 'react-performance',
        category: 'Frontend',
        tags: ['React', 'Performance', 'Optimization'],
        views: 320,
        likes: 58,
        publishedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        contentSummary: 'Best practices for optimizing React applications'
      },
      {
        postId: 'post-nextjs-ssr',
        title: 'Server-Side Rendering con Next.js',
        slug: 'nextjs-ssr',
        category: 'Web Development',
        tags: ['Next.js', 'SSR', 'React'],
        views: 290,
        likes: 51,
        publishedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        contentSummary: 'Learn how to implement SSR with Next.js'
      },
      {
        postId: 'post-graphql-schema-design',
        title: 'Diseño de Schemas en GraphQL',
        slug: 'graphql-schema-design',
        category: 'Web Development',
        tags: ['GraphQL', 'API Design'],
        views: 200,
        likes: 38,
        publishedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
        contentSummary: 'Best practices for designing GraphQL schemas'
      },
      {
        postId: 'post-css-grid-flexbox',
        title: 'CSS Grid vs Flexbox',
        slug: 'css-grid-flexbox',
        category: 'Frontend',
        tags: ['CSS', 'Layout', 'Frontend'],
        views: 150,
        likes: 28,
        publishedAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
        contentSummary: 'When to use CSS Grid vs Flexbox'
      }
    ];
    
    // Filter out current post and viewed posts
    return mockPosts.filter(post => {
      if (input.currentPostId && post.postId === input.currentPostId) return false;
      if (input.userHistory?.viewedPosts.includes(post.postId)) return false;
      return true;
    });
  }
  
  private calculateRecommendationScore(
    candidate: CandidatePost,
    input: RecommendContentInput,
    diversityWeight: number
  ): { total: number; userPreference: number; similarity: number; trending: number } {
    // Hybrid algorithm: User Preference (40%) + Similarity (40%) + Trending (20%)
    
    const userPreferenceScore = this.calculateUserPreferenceScore(candidate, input);
    const similarityScore = this.calculateSimilarityScore(candidate, input);
    const trendingScore = this.calculateTrendingScore(candidate);
    
    const baseTotal =
      userPreferenceScore * 0.4 +
      similarityScore * 0.4 +
      trendingScore * 0.2;
    
    // Apply diversity penalty if needed
    const diversityPenalty = this.calculateDiversityPenalty(candidate, input) * diversityWeight;
    
    const total = Math.max(0, Math.min(100, baseTotal - diversityPenalty));
    
    return {
      total,
      userPreference: userPreferenceScore,
      similarity: similarityScore,
      trending: trendingScore
    };
  }
  
  private calculateUserPreferenceScore(candidate: CandidatePost, input: RecommendContentInput): number {
    let score = 0;
    
    const prefs = input.preferences;
    if (!prefs) return 50; // Neutral score if no preferences
    
    // Favorite categories (30 points)
    if (prefs.favoriteCategories && prefs.favoriteCategories.includes(candidate.category)) {
      score += 30;
    }
    
    // Favorite tags (40 points - 10 per matching tag, max 40)
    if (prefs.favoriteTags) {
      const matchingTags = candidate.tags.filter(tag =>
        prefs.favoriteTags!.some(favTag => favTag.toLowerCase() === tag.toLowerCase())
      );
      score += Math.min(40, matchingTags.length * 10);
    }
    
    // Liked posts with same tags (15 points)
    if (input.userHistory?.likedPosts && input.userHistory.likedPosts.length > 0) {
      // In production, would compare against actual liked posts
      score += 15;
    }
    
    // Search query relevance (15 points)
    if (input.userHistory?.searchQueries && input.userHistory.searchQueries.length > 0) {
      const hasRelevantKeyword = input.userHistory.searchQueries.some(query =>
        candidate.title.toLowerCase().includes(query.toLowerCase()) ||
        candidate.tags.some(tag => query.toLowerCase().includes(tag.toLowerCase()))
      );
      if (hasRelevantKeyword) score += 15;
    }
    
    return Math.min(100, score);
  }
  
  private calculateSimilarityScore(candidate: CandidatePost, input: RecommendContentInput): number {
    if (!input.currentPostId && (!input.userHistory || input.userHistory.viewedPosts.length === 0)) {
      return 50; // Neutral if no history
    }
    
    // In production, would use embeddings or TF-IDF
    // For now, use simple tag-based similarity
    
    let score = 0;
    
    // Same category as viewed posts (30 points)
    if (input.currentPostId) {
      // Assume current post is in same category
      score += 30;
    }
    
    // Tag overlap (40 points)
    if (input.preferences?.favoriteTags) {
      const overlap = candidate.tags.filter(tag =>
        input.preferences!.favoriteTags!.includes(tag)
      ).length;
      score += Math.min(40, overlap * 15);
    }
    
    // Content similarity (30 points)
    // In production, would use vector similarity
    if (candidate.contentSummary) {
      score += 20; // Mock score
    }
    
    return Math.min(100, score);
  }
  
  private calculateTrendingScore(candidate: CandidatePost): number {
    const now = Date.now();
    const daysSincePublished = candidate.publishedAt
      ? (now - candidate.publishedAt.getTime()) / (1000 * 60 * 60 * 24)
      : 365;
    
    // Recency score (50 points max, decays over time)
    const recencyScore = Math.max(0, 50 * Math.exp(-daysSincePublished / 30));
    
    // Views score (30 points max)
    const viewsScore = Math.min(30, (candidate.views || 0) / 10);
    
    // Likes score (20 points max)
    const likesScore = Math.min(20, (candidate.likes || 0) / 2);
    
    return recencyScore + viewsScore + likesScore;
  }
  
  private calculateDiversityPenalty(candidate: CandidatePost, input: RecommendContentInput): number {
    // Penalize if all tags are the same as user's favorites
    if (!input.preferences?.favoriteTags) return 0;
    
    const allTagsAreFavorite = candidate.tags.every(tag =>
      input.preferences!.favoriteTags!.includes(tag)
    );
    
    return allTagsAreFavorite ? 10 : 0;
  }
  
  private generateReasons(
    candidate: CandidatePost,
    input: RecommendContentInput,
    scores: { userPreference: number; similarity: number; trending: number }
  ): RecommendationReason[] {
    const reasons: RecommendationReason[] = [];
    
    // User preference reasons
    if (scores.userPreference >= 30) {
      const matchingTags = input.preferences?.favoriteTags?.filter(favTag =>
        candidate.tags.some(tag => tag.toLowerCase() === favTag.toLowerCase())
      ) || [];
      
      if (matchingTags.length > 0) {
        reasons.push({
          type: 'user-preference',
          weight: scores.userPreference * 0.4,
          explanation: `Contiene tus tags favoritos: ${matchingTags.join(', ')}`
        });
      }
      
      if (input.preferences?.favoriteCategories?.includes(candidate.category)) {
        reasons.push({
          type: 'same-category',
          weight: 12,
          explanation: `Categoría "${candidate.category}" que te interesa`
        });
      }
    }
    
    // Similarity reasons
    if (scores.similarity >= 30) {
      reasons.push({
        type: 'similar-content',
        weight: scores.similarity * 0.4,
        explanation: input.currentPostId
          ? 'Muy similar al post que estás leyendo'
          : 'Relacionado con posts que has visto'
      });
    }
    
    // Trending reasons
    if (scores.trending >= 40) {
      reasons.push({
        type: 'trending',
        weight: scores.trending * 0.2,
        explanation: `Post popular: ${candidate.views || 0} vistas, ${candidate.likes || 0} likes`
      });
    }
    
    return reasons;
  }
}

// Export singleton instance
export const recommendContentSkill = new RecommendContentSkill();
