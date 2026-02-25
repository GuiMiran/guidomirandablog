import { NextRequest, NextResponse } from 'next/server';
import { orchestrator } from '@/lib/agents';
import { logger, logAPIRequest } from '@/lib/utils/logger';
import { recordAPIRequest, setActiveRequests, metrics, MetricNames } from '@/lib/utils/metrics';

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  const traceId = crypto.randomUUID();
  let statusCode = 200;
  
  // Track active requests
  const activeReqs = metrics.getGauge(MetricNames.ACTIVE_REQUESTS);
  setActiveRequests(activeReqs + 1);
  
  try {
    const body = await request.json();
    const { topic, tone = 'professional', length = 'medium', outline, keywords } = body;

    logger.info('Generate API request received', {
      service: 'api',
      operation: '/api/ai/generate',
      traceId,
      timestamp: new Date(),
      metadata: { topic, tone, length }
    });

    if (!topic || typeof topic !== 'string') {
      statusCode = 400;
      return NextResponse.json(
        { error: 'Topic is required and must be a string' },
        { status: 400 }
      );
    }

    if (!['professional', 'casual', 'technical', 'educational'].includes(tone)) {
      statusCode = 400;
      return NextResponse.json(
        { error: 'Invalid tone. Must be: professional, casual, technical, or educational' },
        { status: 400 }
      );
    }

    if (!['short', 'medium', 'long'].includes(length)) {
      statusCode = 400;
      return NextResponse.json(
        { error: 'Invalid length. Must be: short, medium, or long' },
        { status: 400 }
      );
    }

    // Use the multi-agent orchestrator for blog post generation
    const result = await orchestrator.orchestrate({
      intent: `Generate a ${tone} blog post about ${topic}`,
      type: 'generate_blog_post',
      params: {
        topic,
        tone,
        length,
        outline: outline || [],
        keywords: keywords || []
      },
      context: {
        traceId,
        userId: request.headers.get('x-user-id') || 'api-user',
        sessionId: request.headers.get('x-session-id') || undefined
      }
    });

    logger.info('Generate API request completed', {
      service: 'api',
      operation: '/api/ai/generate',
      traceId,
      timestamp: new Date(),
      metadata: { 
        success: result.success,
        duration_ms: Date.now() - startTime
      }
    });

    return NextResponse.json({
      success: result.success,
      ...result.result
    });
  } catch (error: any) {
    statusCode = error.name === 'SkillExecutionError' ? 400 : 500;
    
    logger.error('Generate API error', {
      service: 'api',
      operation: '/api/ai/generate',
      traceId,
      timestamp: new Date()
    }, error);
    
    // Handle skill execution errors
    if (error.name === 'SkillExecutionError') {
      return NextResponse.json(
        { 
          error: error.message,
          code: error.code,
          details: error.details
        },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to generate blog post' },
      { status: 500 }
    );
  } finally {
    const duration = Date.now() - startTime;
    
    // Record metrics
    recordAPIRequest('/api/ai/generate', 'POST', statusCode, duration);
    logAPIRequest('/api/ai/generate', 'POST', traceId, statusCode, duration);
    
    // Update active requests
    const activeReqs = metrics.getGauge(MetricNames.ACTIVE_REQUESTS);
    setActiveRequests(Math.max(0, activeReqs - 1));
  }
}
