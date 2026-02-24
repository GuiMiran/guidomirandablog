import { NextRequest, NextResponse } from 'next/server';
import { metrics, calculateCacheHitRate } from '@/lib/utils/metrics';

/**
 * Metrics Endpoint
 * 
 * Returns performance and business metrics
 * Prometheus-compatible format
 * 
 * Note: In production, this should be protected with authentication
 */
export async function GET(request: NextRequest) {
  try {
    // Get all metrics
    const allMetrics = metrics.getAllMetrics();
    
    // Calculate derived metrics
    const cacheHitRate = calculateCacheHitRate();
    
    // Build response
    const response = {
      ...allMetrics,
      derived: {
        cache_hit_rate_percent: cacheHitRate
      }
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error: any) {
    console.error('Error fetching metrics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch metrics' },
      { status: 500 }
    );
  }
}

/**
 * Reset Metrics (for testing)
 * POST /api/ai/metrics with { "reset": true }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    if (body.reset === true) {
      // Only allow in development
      if (process.env.NODE_ENV === 'development') {
        metrics.reset();
        return NextResponse.json({ message: 'Metrics reset successfully' }, { status: 200 });
      } else {
        return NextResponse.json(
          { error: 'Metrics reset not allowed in production' },
          { status: 403 }
        );
      }
    }
    
    return NextResponse.json(
      { error: 'Invalid request' },
      { status: 400 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
}
