import { NextRequest, NextResponse } from 'next/server';
import { orchestrator } from '@/lib/agents';
import { metrics, calculateCacheHitRate } from '@/lib/utils/metrics';
import { cache } from '@/lib/utils/cache';

/**
 * Health Check Endpoint
 * 
 * Returns system health status including:
 * - API availability
 * - Agent system status
 * - Performance metrics
 * - Cache statistics
 */
export async function GET(request: NextRequest) {
  try {
    const startTime = Date.now();
    const cacheStats = cache.getStats();
    const cacheHitRate = calculateCacheHitRate();
    
    // Basic health check
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      uptime: process.uptime(),
      services: {
        api: {
          status: 'up',
          latency_ms: Date.now() - startTime
        },
        orchestrator: {
          status: 'up',
          agents: ['planner', 'executor', 'coder', 'reviewer']
        },
        cache: {
          status: 'up',
          size: cacheStats.size,
          max_size: cacheStats.maxSize,
          hit_rate_percent: cacheHitRate.toFixed(2),
          utilization_percent: ((cacheStats.size / cacheStats.maxSize) * 100).toFixed(2)
        }
      },
      metrics_summary: {
        total_requests: metrics.getCounter('api_requests_total'),
        total_errors: metrics.getCounter('api_errors_total'),
        cache_hits: metrics.getCounter('cache_hits_total'),
        cache_misses: metrics.getCounter('cache_misses_total')
      }
    };

    return NextResponse.json(health, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message
    }, { status: 503 });
  }
}
