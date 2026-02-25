/**
 * Orchestrate API Route
 * 
 * Main endpoint for multi-agent workflows
 * Uses the orchestrator to coordinate complex operations
 */

import { NextRequest, NextResponse } from 'next/server';
import { orchestrator } from '@/lib/agents';
import type { OrchestratorRequest, WorkflowType } from '@/lib/agents';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { intent, type, params } = body;

    // Validate required fields
    if (!intent || typeof intent !== 'string') {
      return NextResponse.json(
        { error: 'Intent is required and must be a string' },
        { status: 400 }
      );
    }

    if (!type || typeof type !== 'string') {
      return NextResponse.json(
        { error: 'Type is required and must be a string' },
        { status: 400 }
      );
    }

    // Validate workflow type
    const validTypes: WorkflowType[] = [
      'generate_blog_post',
      'summarize_content',
      'chat_response',
      'analyze_content',
      'custom'
    ];

    if (!validTypes.includes(type as WorkflowType)) {
      return NextResponse.json(
        {
          error: `Invalid type. Must be one of: ${validTypes.join(', ')}`,
          validTypes
        },
        { status: 400 }
      );
    }

    // Build orchestrator request
    const orchestratorRequest: OrchestratorRequest = {
      intent,
      type: type as WorkflowType,
      params: params || {},
      context: {
        traceId: crypto.randomUUID(),
        userId: request.headers.get('x-user-id') || undefined,
        sessionId: request.headers.get('x-session-id') || undefined
      }
    };

    // Execute orchestration
    const result = await orchestrator.orchestrate(orchestratorRequest);

    // Return result
    return NextResponse.json({
      success: result.success,
      result: result.result,
      metadata: {
        duration: result.metadata.duration,
        agentsInvolved: result.metadata.agentsInvolved,
        timestamp: result.metadata.timestamp
      },
      review: result.review ? {
        approved: result.review.approved,
        score: result.review.score,
        issues: result.review.issues.map(issue => ({
          severity: issue.severity,
          category: issue.category,
          message: issue.message,
          suggestion: issue.suggestion
        })),
        suggestions: result.review.suggestions
      } : undefined,
      events: result.events.map(event => ({
        type: event.type,
        timestamp: event.timestamp,
        success: event.success
      })),
      errors: result.errors
    });

  } catch (error: any) {
    console.error('Orchestration error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error during orchestration',
        message: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

// GET endpoint for supported workflow types
export async function GET() {
  return NextResponse.json({
    workflows: [
      {
        type: 'generate_blog_post',
        description: 'Generate a complete blog post with quality review',
        requiredParams: ['topic'],
        optionalParams: ['tone', 'length', 'keywords', 'outline']
      },
      {
        type: 'summarize_content',
        description: 'Summarize existing content',
        requiredParams: ['content'],
        optionalParams: ['maxLength']
      },
      {
        type: 'chat_response',
        description: 'Generate a chat response',
        requiredParams: ['messages or question'],
        optionalParams: ['messages', 'question']
      },
      {
        type: 'analyze_content',
        description: 'Analyze content quality, SEO, and moderation',
        requiredParams: ['content'],
        optionalParams: ['reviewType']
      },
      {
        type: 'custom',
        description: 'Custom workflow using planner and executor',
        requiredParams: ['intent'],
        optionalParams: ['any']
      }
    ]
  });
}
