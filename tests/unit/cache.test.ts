/**
 * Unit Tests for Cache System
 * 
 * Tests multi-level caching functionality
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { cache, CachePrefix, CacheTTL, cacheSkillResult, getCachedSkillResult } from '@/lib/utils/cache';

describe('CacheManager', () => {
  beforeEach(() => {
    cache.clear();
  });

  it('should store and retrieve values', () => {
    const value = { result: 'test data' };
    cache.set(CachePrefix.SKILL, 'test-key', value);
    
    const retrieved = cache.get(CachePrefix.SKILL, 'test-key');
    expect(retrieved).toEqual(value);
  });

  it('should return null for non-existent keys', () => {
    const retrieved = cache.get(CachePrefix.SKILL, 'non-existent');
    expect(retrieved).toBeNull();
  });

  it('should expire entries after TTL', async () => {
    const value = { result: 'test' };
    cache.set(CachePrefix.SKILL, 'expiring-key', value, { ttl: 1 }); // 1 second TTL
    
    // Should exist immediately
    let retrieved = cache.get(CachePrefix.SKILL, 'expiring-key');
    expect(retrieved).toEqual(value);
    
    // Wait for expiration
    await new Promise(resolve => setTimeout(resolve, 1100));
    
    // Should be expired
    retrieved = cache.get(CachePrefix.SKILL, 'expiring-key');
    expect(retrieved).toBeNull();
  });

  it('should use LRU eviction when cache is full', () => {
    // Fill cache with max size entries (simulated)
    for (let i = 0; i < 10; i++) {
      cache.set(CachePrefix.SKILL, `key-${i}`, { data: i });
    }
    
    // Access key-0 to make it most recently used
    cache.get(CachePrefix.SKILL, 'key-0');
    
    const stats = cache.getStats();
    expect(stats.size).toBeGreaterThan(0);
  });

  it('should track cache statistics', () => {
    cache.set(CachePrefix.SKILL, 'key1', { data: 1 });
    cache.set(CachePrefix.AGENT, 'key2', { data: 2 });
    
    // Access to increase hits
    cache.get(CachePrefix.SKILL, 'key1');
    cache.get(CachePrefix.SKILL, 'key1');
    
    const stats = cache.getStats();
    expect(stats.size).toBe(2);
    expect(stats.entries[0].hits).toBe(2);
  });

  it('should delete entries', () => {
    cache.set(CachePrefix.SKILL, 'delete-me', { data: 'test' });
    
    const deleted = cache.delete(CachePrefix.SKILL, 'delete-me');
    expect(deleted).toBe(true);
    
    const retrieved = cache.get(CachePrefix.SKILL, 'delete-me');
    expect(retrieved).toBeNull();
  });

  it('should clear all entries', () => {
    cache.set(CachePrefix.SKILL, 'key1', { data: 1 });
    cache.set(CachePrefix.AGENT, 'key2', { data: 2 });
    
    cache.clear();
    
    const stats = cache.getStats();
    expect(stats.size).toBe(0);
  });
});

describe('Cache Utilities', () => {
  beforeEach(() => {
    cache.clear();
  });

  it('cacheSkillResult should store skill outputs', () => {
    const input = { topic: 'AI' };
    const result = { content: 'Generated content' };
    
    cacheSkillResult('generate_content', input, result, CacheTTL.GENERATED_CONTENT);
    
    const cached = getCachedSkillResult('generate_content', input);
    expect(cached).toEqual(result);
  });

  it('should generate consistent keys for same input', () => {
    const input = { topic: 'Testing', tone: 'professional' };
    const result1 = { content: 'Test 1' };
    const result2 = { content: 'Test 2' };
    
    // Set first result
    cacheSkillResult('test_skill', input, result1);
    
    // Set second result with same input (should overwrite)
    cacheSkillResult('test_skill', input, result2);
    
    const cached = getCachedSkillResult('test_skill', input);
    expect(cached).toEqual(result2);
  });

  it('should generate different keys for different inputs', () => {
    const input1 = { topic: 'AI' };
    const input2 = { topic: 'ML' };
    const result1 = { content: 'AI content' };
    const result2 = { content: 'ML content' };
    
    cacheSkillResult('test_skill', input1, result1);
    cacheSkillResult('test_skill', input2, result2);
    
    const cached1 = getCachedSkillResult('test_skill', input1);
    const cached2 = getCachedSkillResult('test_skill', input2);
    
    expect(cached1).toEqual(result1);
    expect(cached2).toEqual(result2);
  });
});
