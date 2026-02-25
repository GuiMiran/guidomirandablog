/**
 * Multi-Level Caching System
 * 
 * Provides intelligent caching for:
 * - Skill outputs
 * - Agent results
 * - API responses
 * 
 * Strategies:
 * - L1: In-memory cache (fast, volatile)
 * - L2: Distributed cache (Redis - future)
 * - Smart TTL based on content type
 * - LRU eviction policy
 */

import { createHash } from 'crypto';
import { recordCacheOperation } from './metrics';
import { logger } from './logger';

export interface CacheEntry<T> {
  value: T;
  timestamp: Date;
  ttl: number; // seconds
  hits: number;
}

export interface CacheOptions {
  ttl?: number; // seconds, default 300 (5 minutes)
  maxSize?: number; // max entries, default 1000
}

class CacheManager {
  private cache: Map<string, CacheEntry<any>> = new Map();
  private readonly defaultTTL = 300; // 5 minutes
  private readonly maxSize = 1000;
  private accessOrder: string[] = []; // For LRU

  /**
   * Generate cache key from object
   */
  private generateKey(prefix: string, data: any): string {
    const dataStr = typeof data === 'string' ? data : JSON.stringify(data);
    const hash = createHash('sha256').update(dataStr).digest('hex').substring(0, 16);
    return `${prefix}:${hash}`;
  }

  /**
   * Check if entry is expired
   */
  private isExpired(entry: CacheEntry<any>): boolean {
    const now = Date.now();
    const entryTime = entry.timestamp.getTime();
    const ttlMs = entry.ttl * 1000;
    return (now - entryTime) > ttlMs;
  }

  /**
   * Evict least recently used entry
   */
  private evictLRU(): void {
    if (this.accessOrder.length === 0) return;
    
    const keyToEvict = this.accessOrder.shift();
    if (keyToEvict) {
      this.cache.delete(keyToEvict);
      
      logger.debug('Cache eviction (LRU)', {
        service: 'system',
        operation: 'cache_evict',
        timestamp: new Date(),
        metadata: { key: keyToEvict }
      });
    }
  }

  /**
   * Update access order for LRU
   */
  private updateAccessOrder(key: string): void {
    // Remove from current position
    const index = this.accessOrder.indexOf(key);
    if (index > -1) {
      this.accessOrder.splice(index, 1);
    }
    // Add to end (most recently used)
    this.accessOrder.push(key);
  }

  /**
   * Clean up expired entries
   */
  private cleanupExpired(): void {
    let cleaned = 0;
    const keysToDelete: string[] = [];
    
    this.cache.forEach((entry, key) => {
      if (this.isExpired(entry)) {
        keysToDelete.push(key);
      }
    });
    
    keysToDelete.forEach(key => {
      this.cache.delete(key);
      
      // Remove from access order
      const index = this.accessOrder.indexOf(key);
      if (index > -1) {
        this.accessOrder.splice(index, 1);
      }
      
      cleaned++;
    });
    
    if (cleaned > 0) {
      logger.debug(`Cache cleanup: ${cleaned} expired entries removed`, {
        service: 'system',
        operation: 'cache_cleanup',
        timestamp: new Date(),
        metadata: { entries_removed: cleaned }
      });
    }
  }

  /**
   * Get value from cache
   */
  get<T>(prefix: string, key: any): T | null {
    const cacheKey = this.generateKey(prefix, key);
    const entry = this.cache.get(cacheKey);

    if (!entry) {
      recordCacheOperation(false);
      return null;
    }

    if (this.isExpired(entry)) {
      this.cache.delete(cacheKey);
      recordCacheOperation(false);
      return null;
    }

    // Update stats
    entry.hits++;
    this.updateAccessOrder(cacheKey);
    recordCacheOperation(true);

    logger.debug('Cache hit', {
      service: 'system',
      operation: 'cache_get',
      timestamp: new Date(),
      metadata: { key: cacheKey, hits: entry.hits }
    });

    return entry.value as T;
  }

  /**
   * Set value in cache
   */
  set<T>(prefix: string, key: any, value: T, options?: CacheOptions): void {
    const cacheKey = this.generateKey(prefix, key);
    
    // Check size limit
    if (this.cache.size >= this.maxSize && !this.cache.has(cacheKey)) {
      this.evictLRU();
    }

    const entry: CacheEntry<T> = {
      value,
      timestamp: new Date(),
      ttl: options?.ttl || this.defaultTTL,
      hits: 0
    };

    this.cache.set(cacheKey, entry);
    this.updateAccessOrder(cacheKey);

    logger.debug('Cache set', {
      service: 'system',
      operation: 'cache_set',
      timestamp: new Date(),
      metadata: { key: cacheKey, ttl: entry.ttl }
    });

    // Periodic cleanup (every 100 sets)
    if (this.cache.size % 100 === 0) {
      this.cleanupExpired();
    }
  }

  /**
   * Delete value from cache
   */
  delete(prefix: string, key: any): boolean {
    const cacheKey = this.generateKey(prefix, key);
    const deleted = this.cache.delete(cacheKey);
    
    if (deleted) {
      const index = this.accessOrder.indexOf(cacheKey);
      if (index > -1) {
        this.accessOrder.splice(index, 1);
      }
    }
    
    return deleted;
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
    this.accessOrder = [];
    
    logger.info('Cache cleared', {
      service: 'system',
      operation: 'cache_clear',
      timestamp: new Date()
    });
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    size: number;
    maxSize: number;
    hitRate: number;
    entries: Array<{ key: string; hits: number; age: number }>;
  } {
    const entries: Array<{ key: string; hits: number; age: number }> = [];
    let totalHits = 0;
    
    this.cache.forEach((entry, key) => {
      const age = Math.floor((Date.now() - entry.timestamp.getTime()) / 1000);
      entries.push({ key, hits: entry.hits, age });
      totalHits += entry.hits;
    });
    
    // Sort by hits descending
    entries.sort((a, b) => b.hits - a.hits);
    
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      hitRate: this.cache.size > 0 ? totalHits / this.cache.size : 0,
      entries: entries.slice(0, 10) // Top 10
    };
  }
}

// Singleton instance
export const cache = new CacheManager();

// Cache key prefixes
export const CachePrefix = {
  SKILL: 'skill',
  AGENT: 'agent',
  API: 'api',
  ORCHESTRATOR: 'orchestrator'
} as const;

// Default TTLs by content type (in seconds)
export const CacheTTL = {
  GENERATED_CONTENT: 300,      // 5 minutes
  SUMMARY: 600,                // 10 minutes
  CHAT_RESPONSE: 120,          // 2 minutes
  SEO_ANALYSIS: 1800,          // 30 minutes
  MODERATION: 3600,            // 1 hour
  TRANSLATION: 86400           // 24 hours
} as const;

// Utility functions
export const cacheSkillResult = <T>(skillId: string, input: any, result: T, ttl?: number): void => {
  cache.set(CachePrefix.SKILL, { skillId, input }, result, { ttl });
};

export const getCachedSkillResult = <T>(skillId: string, input: any): T | null => {
  return cache.get<T>(CachePrefix.SKILL, { skillId, input });
};

export const cacheAgentResult = <T>(agentId: string, request: any, result: T, ttl?: number): void => {
  cache.set(CachePrefix.AGENT, { agentId, request }, result, { ttl });
};

export const getCachedAgentResult = <T>(agentId: string, request: any): T | null => {
  return cache.get<T>(CachePrefix.AGENT, { agentId, request });
};

export const cacheAPIResponse = <T>(endpoint: string, params: any, result: T, ttl?: number): void => {
  cache.set(CachePrefix.API, { endpoint, params }, result, { ttl });
};

export const getCachedAPIResponse = <T>(endpoint: string, params: any): T | null => {
  return cache.get<T>(CachePrefix.API, { endpoint, params });
};
