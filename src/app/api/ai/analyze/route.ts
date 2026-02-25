import { NextRequest, NextResponse } from 'next/server';
import { orchestrator } from '@/lib/agents';

/**
 * Analyze Content Endpoint
 * 
 * Performs comprehensive analysis including:
 * - SEO optimization
 * - Content quality
 * - Readability metrics
 * - Keyword analysis
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { content, title, tags, options } = body;

    // Validate required fields
    if (!content || typeof content !== 'string') {
      return NextResponse.json(
        { error: 'Content is required and must be a string' },
        { status: 400 }
      );
    }

    // Use orchestrator for content analysis
    const result = await orchestrator.orchestrate({
      intent: 'Analyze content for SEO and quality',
      type: 'analyze_content',
      params: {
        content: {
          title: title || '',
          content,
          tags: tags || []
        },
        options: options || {
          checkSEO: true,
          checkReadability: true,
          checkModeration: true
        }
      },
      context: {
        traceId: crypto.randomUUID(),
        userId: request.headers.get('x-user-id') || 'api-user',
        sessionId: request.headers.get('x-session-id') || undefined
      }
    });

    return NextResponse.json({
      success: result.success,
      ...result.result
    });
  } catch (error: any) {
    console.error('Error in analyze API:', error);
    
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
      { error: 'Failed to analyze content' },
      { status: 500 }
    );
  }
}
