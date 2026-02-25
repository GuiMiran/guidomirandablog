/**
 * Unit Tests for Metrics System
 * 
 * Tests performance and business metrics collection
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { 
  metrics, 
  MetricNames, 
  recordAPIRequest, 
  recordSkillExecution, 
  recordAgentProcess,
  recordCacheOperation,
  calculateCacheHitRate 
} from '@/lib/utils/metrics';

describe('MetricsCollector', () => {
  beforeEach(() => {
    metrics.reset();
  });

  describe('Counters', () => {
    it('should increment counters', () => {
      metrics.incrementCounter('test_counter', 1);
      metrics.incrementCounter('test_counter', 5);
      
      const value = metrics.getCounter('test_counter');
      expect(value).toBe(6);
    });

    it('should support labeled counters', () => {
      metrics.incrementCounter('requests', 1, { endpoint: '/api/generate', status: '200' });
      metrics.incrementCounter('requests', 1, { endpoint: '/api/chat', status: '200' });
      
      const genCount = metrics.getCounter('requests', { endpoint: '/api/generate', status: '200' });
      const chatCount = metrics.getCounter('requests', { endpoint: '/api/chat', status: '200' });
      
      expect(genCount).toBe(1);
      expect(chatCount).toBe(1);
    });
  });

  describe('Gauges', () => {
    it('should set and get gauge values', () => {
      metrics.setGauge('active_requests', 5);
      expect(metrics.getGauge('active_requests')).toBe(5);
      
      metrics.setGauge('active_requests', 10);
      expect(metrics.getGauge('active_requests')).toBe(10);
    });
  });

  describe('Histograms', () => {
    it('should record values and calculate percentiles', () => {
      const values = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
      values.forEach(v => metrics.recordValue('latency', v));
      
      const histogram = metrics.getHistogram('latency');
      
      expect(histogram).not.toBeNull();
      expect(histogram!.count).toBe(10);
      expect(histogram!.sum).toBe(550);
      expect(histogram!.min).toBe(10);
      expect(histogram!.max).toBe(100);
      expect(histogram!.p50).toBeCloseTo(50, -1);
      // p95 with 10 values will be close to the 95th percentile
      expect(histogram!.p95).toBeGreaterThanOrEqual(90);
    });

    it('should return null for non-existent histogram', () => {
      const histogram = metrics.getHistogram('non_existent');
      expect(histogram).toBeNull();
    });
  });

  describe('getAllMetrics', () => {
    it('should return all metrics', () => {
      metrics.incrementCounter('requests', 10);
      metrics.setGauge('active', 5);
      metrics.recordValue('latency', 100);
      
      const all = metrics.getAllMetrics();
      
      expect(all).toHaveProperty('counters');
      expect(all).toHaveProperty('gauges');
      expect(all).toHaveProperty('histograms');
      expect(all).toHaveProperty('uptime_seconds');
    });
  });
});

describe('Metric Recording Utilities', () => {
  beforeEach(() => {
    metrics.reset();
  });

  it('recordAPIRequest should record metrics', () => {
    recordAPIRequest('/api/ai/generate', 'POST', 200, 150);
    
    const requests = metrics.getCounter(MetricNames.API_REQUESTS_TOTAL, {
      endpoint: '/api/ai/generate',
      method: 'POST',
      status: '200'
    });
    
    expect(requests).toBe(1);
    
    // Histogram uses labels, so we need to query with the same labels
    const histogram = metrics.getHistogram(MetricNames.API_LATENCY_MS, {
      endpoint: '/api/ai/generate',
      method: 'POST'
    });
    expect(histogram).not.toBeNull();
    expect(histogram!.count).toBe(1);
  });

  it('recordAPIRequest should track errors', () => {
    recordAPIRequest('/api/ai/generate', 'POST', 500, 50);
    
    const errors = metrics.getCounter(MetricNames.API_ERRORS_TOTAL, {
      endpoint: '/api/ai/generate',
      method: 'POST',
      status: '500'
    });
    
    expect(errors).toBe(1);
  });

  it('recordSkillExecution should track tokens and cost', () => {
    recordSkillExecution('generate_content', 500, true, 1000, 0.02);
    
    const tokens = metrics.getCounter(MetricNames.TOKENS_USED_TOTAL, { skill: 'generate_content' });
    const cost = metrics.getCounter(MetricNames.COST_USD_TOTAL, { skill: 'generate_content' });
    
    expect(tokens).toBe(1000);
    expect(cost).toBeCloseTo(0.02, 2);
  });

  it('recordAgentProcess should track agent metrics', () => {
    recordAgentProcess('coder', 1000, true);
    
    const processes = metrics.getCounter(MetricNames.AGENT_PROCESS_TOTAL, {
      agent: 'coder',
      success: 'true'
    });
    
    expect(processes).toBe(1);
  });

  it('calculateCacheHitRate should compute hit rate', () => {
    recordCacheOperation(true);  // hit
    recordCacheOperation(true);  // hit
    recordCacheOperation(false); // miss
    
    const hitRate = calculateCacheHitRate();
    expect(hitRate).toBeCloseTo(66.67, 1);
  });
});
