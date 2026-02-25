import { NextRequest, NextResponse } from 'next/server';
import { orchestrator } from '@/lib/agents';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { content, length = 'medium', style = 'paragraph', focus, targetAudience } = body;

    if (!content || typeof content !== 'string') {
      return NextResponse.json(
        { error: 'Content is required and must be a string' },
        { status: 400 }
      );
    }

    // Use the multi-agent orchestrator for summarization
    const result = await orchestrator.orchestrate({
      intent: `Summarize content in ${style} style`,
      type: 'summarize_content',
      params: {
        content,
        length,
        style,
        focus: focus || [],
        targetAudience: targetAudience || 'general'
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
    console.error('Error in summarize API:', error);
    
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
      { error: 'Failed to generate summary' },
      { status: 500 }
    );
  }
}
