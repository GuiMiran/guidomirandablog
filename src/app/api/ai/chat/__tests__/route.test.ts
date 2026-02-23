import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '../route';
import { NextRequest } from 'next/server';

const mockCreate = vi.fn();

// Mock OpenAI
vi.mock('openai', () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      chat: {
        completions: {
          create: mockCreate,
        },
      },
    })),
  };
});

describe('POST /api/ai/chat', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset environment variable
    delete process.env.OPENAI_API_KEY;
    // Default mock: successful response
    mockCreate.mockResolvedValue({
      choices: [{ message: { content: 'This is a test response from OpenAI' } }],
    });
  });

  it('should return a mock response when OPENAI_API_KEY is not set', async () => {
    const messages = [
      {
        id: '1',
        role: 'user' as const,
        content: 'Hello',
        timestamp: new Date(),
      },
    ];

    const request = new NextRequest('http://localhost:3000/api/ai/chat', {
      method: 'POST',
      body: JSON.stringify({ messages }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.message).toContain('mock AI assistant');
  });

  it('should return error for invalid request body', async () => {
    const request = new NextRequest('http://localhost:3000/api/ai/chat', {
      method: 'POST',
      body: JSON.stringify({ invalid: 'data' }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Invalid request body');
  });

  it('should return error for empty messages array', async () => {
    const request = new NextRequest('http://localhost:3000/api/ai/chat', {
      method: 'POST',
      body: JSON.stringify({ messages: 'not-an-array' }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Invalid request body');
  });

  it('should process messages successfully with OPENAI_API_KEY', async () => {
    process.env.OPENAI_API_KEY = 'test-api-key';

    const messages = [
      {
        id: '1',
        role: 'user' as const,
        content: 'Hello, how are you?',
        timestamp: new Date(),
      },
    ];

    const request = new NextRequest('http://localhost:3000/api/ai/chat', {
      method: 'POST',
      body: JSON.stringify({ messages }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.message).toBe('This is a test response from OpenAI');
  });

  it('should handle OpenAI API errors gracefully', async () => {
    process.env.OPENAI_API_KEY = 'test-api-key';
    mockCreate.mockRejectedValue(new Error('OpenAI API Error'));

    const messages = [
      {
        id: '1',
        role: 'user' as const,
        content: 'Hello',
        timestamp: new Date(),
      },
    ];

    const request = new NextRequest('http://localhost:3000/api/ai/chat', {
      method: 'POST',
      body: JSON.stringify({ messages }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Failed to process chat request');
  });
});
