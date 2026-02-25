/**
 * Metrics Collection System
 * 
 * Provides performance and business metrics collection:
 * - Request counters
 * - Latency histograms
 * - Error rates
 * - Resource usage
 * - Cost tracking
 */

export interface MetricValue {
  value: number;
  timestamp: Date;
  labels?: Record<string, string>;
}

export interface Histogram {
  count: number;
  sum: number;
  min: number;
  max: number;
  p50: number;
  p95: number;
  p99: number;
}

class MetricsCollector {
  private counters: Map<string, number> = new Map();
  private gauges: Map<string, number> = new Map();
  private histograms: Map<string, number[]> = new Map();
  private startTime: Date = new Date();

  // Counter operations
  incrementCounter(name: string, value: number = 1, labels?: Record<string, string>): void {
    const key = this.generateKey(name, labels);
    const current = this.counters.get(key) || 0;
    this.counters.set(key, current + value);
  }

  getCounter(name: string, labels?: Record<string, string>): number {
    const key = this.generateKey(name, labels);
    return this.counters.get(key) || 0;
  }

  // Gauge operations
  setGauge(name: string, value: number, labels?: Record<string, string>): void {
    const key = this.generateKey(name, labels);
    this.gauges.set(key, value);
  }

  getGauge(name: string, labels?: Record<string, string>): number {
    const key = this.generateKey(name, labels);
    return this.gauges.get(key) || 0;
  }

  // Histogram operations
  recordValue(name: string, value: number, labels?: Record<string, string>): void {
    const key = this.generateKey(name, labels);
    const values = this.histograms.get(key) || [];
    values.push(value);
    
    // Keep only last 1000 values to prevent memory issues
    if (values.length > 1000) {
      values.shift();
    }
    
    this.histograms.set(key, values);
  }

  getHistogram(name: string, labels?: Record<string, string>): Histogram | null {
    const key = this.generateKey(name, labels);
    const values = this.histograms.get(key);
    
    if (!values || values.length === 0) {
      return null;
    }

    const sorted = [...values].sort((a, b) => a - b);
    const count = sorted.length;
    const sum = sorted.reduce((a, b) => a + b, 0);

    return {
      count,
      sum,
      min: sorted[0],
      max: sorted[count - 1],
      p50: this.percentile(sorted, 50),
      p95: this.percentile(sorted, 95),
      p99: this.percentile(sorted, 99)
    };
  }

  // Get all metrics
  getAllMetrics(): Record<string, any> {
    const counters: Record<string, number> = {};
    this.counters.forEach((value, key) => {
      counters[key] = value;
    });

    const gauges: Record<string, number> = {};
    this.gauges.forEach((value, key) => {
      gauges[key] = value;
    });

    const histograms: Record<string, Histogram> = {};
    this.histograms.forEach((values, key) => {
      const hist = this.getHistogram(key.split(':')[0]);
      if (hist) {
        histograms[key] = hist;
      }
    });

    return {
      uptime_seconds: Math.floor((Date.now() - this.startTime.getTime()) / 1000),
      timestamp: new Date().toISOString(),
      counters,
      gauges,
      histograms
    };
  }

  // Reset all metrics
  reset(): void {
    this.counters.clear();
    this.gauges.clear();
    this.histograms.clear();
  }

  private generateKey(name: string, labels?: Record<string, string>): string {
    if (!labels || Object.keys(labels).length === 0) {
      return name;
    }
    const labelStr = Object.entries(labels)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}="${v}"`)
      .join(',');
    return `${name}{${labelStr}}`;
  }

  private percentile(sorted: number[], p: number): number {
    const index = Math.ceil((p / 100) * sorted.length) - 1;
    return sorted[Math.max(0, index)];
  }
}

// Singleton instance
export const metrics = new MetricsCollector();

// Pre-defined metric names
export const MetricNames = {
  // API metrics
  API_REQUESTS_TOTAL: 'api_requests_total',
  API_LATENCY_MS: 'api_latency_ms',
  API_ERRORS_TOTAL: 'api_errors_total',
  
  // Agent metrics
  AGENT_PROCESS_DURATION_MS: 'agent_process_duration_ms',
  AGENT_PROCESS_TOTAL: 'agent_process_total',
  AGENT_ERRORS_TOTAL: 'agent_errors_total',
  
  // Skill metrics
  SKILL_EXECUTION_DURATION_MS: 'skill_execution_duration_ms',
  SKILL_EXECUTION_TOTAL: 'skill_execution_total',
  SKILL_ERRORS_TOTAL: 'skill_errors_total',
  
  // Business metrics
  TOKENS_USED_TOTAL: 'tokens_used_total',
  COST_USD_TOTAL: 'cost_usd_total',
  
  // Cache metrics
  CACHE_HITS_TOTAL: 'cache_hits_total',
  CACHE_MISSES_TOTAL: 'cache_misses_total',
  
  // System metrics
  ACTIVE_REQUESTS: 'active_requests',
  QUEUE_DEPTH: 'queue_depth'
} as const;

// Utility functions
export const recordAPIRequest = (endpoint: string, method: string, statusCode: number, duration: number) => {
  metrics.incrementCounter(MetricNames.API_REQUESTS_TOTAL, 1, { endpoint, method, status: String(statusCode) });
  metrics.recordValue(MetricNames.API_LATENCY_MS, duration, { endpoint, method });
  
  if (statusCode >= 400) {
    metrics.incrementCounter(MetricNames.API_ERRORS_TOTAL, 1, { endpoint, method, status: String(statusCode) });
  }
};

export const recordSkillExecution = (skillId: string, duration: number, success: boolean, tokensUsed?: number, costUSD?: number) => {
  metrics.incrementCounter(MetricNames.SKILL_EXECUTION_TOTAL, 1, { skill: skillId, success: String(success) });
  metrics.recordValue(MetricNames.SKILL_EXECUTION_DURATION_MS, duration, { skill: skillId });
  
  if (!success) {
    metrics.incrementCounter(MetricNames.SKILL_ERRORS_TOTAL, 1, { skill: skillId });
  }
  
  if (tokensUsed) {
    metrics.incrementCounter(MetricNames.TOKENS_USED_TOTAL, tokensUsed, { skill: skillId });
  }
  
  if (costUSD) {
    metrics.incrementCounter(MetricNames.COST_USD_TOTAL, costUSD, { skill: skillId });
  }
};

export const recordAgentProcess = (agentId: string, duration: number, success: boolean) => {
  metrics.incrementCounter(MetricNames.AGENT_PROCESS_TOTAL, 1, { agent: agentId, success: String(success) });
  metrics.recordValue(MetricNames.AGENT_PROCESS_DURATION_MS, duration, { agent: agentId });
  
  if (!success) {
    metrics.incrementCounter(MetricNames.AGENT_ERRORS_TOTAL, 1, { agent: agentId });
  }
};

export const recordCacheOperation = (hit: boolean) => {
  if (hit) {
    metrics.incrementCounter(MetricNames.CACHE_HITS_TOTAL);
  } else {
    metrics.incrementCounter(MetricNames.CACHE_MISSES_TOTAL);
  }
};

export const setActiveRequests = (count: number) => {
  metrics.setGauge(MetricNames.ACTIVE_REQUESTS, count);
};

export const calculateCacheHitRate = (): number => {
  const hits = metrics.getCounter(MetricNames.CACHE_HITS_TOTAL);
  const misses = metrics.getCounter(MetricNames.CACHE_MISSES_TOTAL);
  const total = hits + misses;
  
  if (total === 0) return 0;
  return (hits / total) * 100;
};
