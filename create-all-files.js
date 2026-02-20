const fs = require('fs');
const path = require('path');

console.log('Creating remaining source files...\n');

const files = {
  'src/app/api/ai/chat/route.ts': `import { NextRequest, NextResponse } from 'next/server';
import { openai } from '@/lib/openai/client';
import { z } from 'zod';

const ChatRequestSchema = z.object({
  message: z.string().min(1).max(1000),
  conversationHistory: z.array(
    z.object({
      role: z.enum(['user', 'assistant']),
      content: z.string(),
    })
  ).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { message, conversationHistory = [] } = ChatRequestSchema.parse(body);

    const messages = [
      {
        role: 'system' as const,
        content: \`You are a helpful AI assistant for Guido Miranda's blog. You can answer questions about the blog posts, 
                  provide insights on software development, AI, and technology topics. Be concise, friendly, and informative.\`,
      },
      ...conversationHistory.map((msg) => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
      })),
      {
        role: 'user' as const,
        content: message,
      },
    ];

    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages,
      temperature: 0.7,
      max_tokens: 500,
    });

    const response = completion.choices[0]?.message?.content || 'I apologize, but I could not generate a response.';

    return NextResponse.json({
      response,
      conversationId: crypto.randomUUID(),
    });
  } catch (error) {
    console.error('Chat API error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request format', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to process chat request' },
      { status: 500 }
    );
  }
}
`,

  'src/app/api/ai/generate/route.ts': `import { NextRequest, NextResponse } from 'next/server';
import { openai } from '@/lib/openai/client';
import { z } from 'zod';

const GenerateRequestSchema = z.object({
  topic: z.string().min(1).max(200),
  type: z.enum(['blog-post', 'summary', 'outline']),
  tone: z.enum(['professional', 'casual', 'technical']).optional(),
  length: z.enum(['short', 'medium', 'long']).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { topic, type, tone = 'professional', length = 'medium' } = GenerateRequestSchema.parse(body);

    const lengthInstructions = {
      short: '2-3 paragraphs',
      medium: '4-6 paragraphs',
      long: '8-10 paragraphs',
    };

    const prompts = {
      'blog-post': \`Write a \${tone} blog post about "\${topic}". 
                    The post should be approximately \${lengthInstructions[length]} in length.
                    Include an engaging introduction, well-structured body with clear sections, and a conclusion.
                    Format the content in Markdown.\`,
      'summary': \`Create a concise summary about "\${topic}" in a \${tone} tone. 
                  Keep it to \${lengthInstructions[length]}.\`,
      'outline': \`Generate a detailed outline for a blog post about "\${topic}".
                  Include main sections, subsections, and key points to cover.
                  Format as a structured list.\`,
    };

    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: 'You are an expert technical writer and content creator.',
        },
        {
          role: 'user',
          content: prompts[type],
        },
      ],
      temperature: 0.8,
      max_tokens: length === 'long' ? 2000 : length === 'medium' ? 1000 : 500,
    });

    const content = completion.choices[0]?.message?.content || '';

    return NextResponse.json({
      content,
      metadata: {
        topic,
        type,
        tone,
        length,
        wordCount: content.split(/\\s+/).length,
      },
    });
  } catch (error) {
    console.error('Generate API error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request format', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to generate content' },
      { status: 500 }
    );
  }
}
`,

  'src/app/api/ai/summarize/route.ts': `import { NextRequest, NextResponse } from 'next/server';
import { openai } from '@/lib/openai/client';
import { z } from 'zod';

const SummarizeRequestSchema = z.object({
  content: z.string().min(100).max(10000),
  length: z.enum(['brief', 'detailed']).optional(),
  format: z.enum(['paragraph', 'bullets']).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { content, length = 'brief', format = 'paragraph' } = SummarizeRequestSchema.parse(body);

    const lengthInstruction = length === 'brief' 
      ? 'in 2-3 sentences' 
      : 'in 1-2 paragraphs';

    const formatInstruction = format === 'bullets'
      ? 'Format the summary as bullet points.'
      : 'Write the summary as a cohesive paragraph.';

    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: \`You are an expert at creating clear, concise summaries. 
                    Extract the key information and main ideas from the provided content.\`,
        },
        {
          role: 'user',
          content: \`Summarize the following content \${lengthInstruction}. \${formatInstruction}\\n\\n\${content}\`,
        },
      ],
      temperature: 0.5,
      max_tokens: 300,
    });

    const summary = completion.choices[0]?.message?.content || '';

    return NextResponse.json({
      summary,
      metadata: {
        originalLength: content.length,
        summaryLength: summary.length,
        compressionRatio: ((1 - summary.length / content.length) * 100).toFixed(2) + '%',
      },
    });
  } catch (error) {
    console.error('Summarize API error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request format', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to summarize content' },
      { status: 500 }
    );
  }
}
`,

  'src/app/blog/[slug]/page.tsx': `import { notFound } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { format } from 'date-fns';
import type { Metadata } from 'next';
import type { BlogPost } from '@/types';

interface PageProps {
  params: {
    slug: string;
  };
}

async function getPost(slug: string): Promise<BlogPost | null> {
  // This would typically fetch from your database or CMS
  // For now, returning mock data
  const mockPosts: Record<string, BlogPost> = {
    'getting-started-with-nextjs': {
      id: '1',
      slug: 'getting-started-with-nextjs',
      title: 'Getting Started with Next.js 14',
      excerpt: 'Learn how to build modern web applications with Next.js 14 and the App Router.',
      content: \`# Getting Started with Next.js 14

Next.js 14 brings exciting new features and improvements to the React framework. In this post, we'll explore the key features and how to get started.

## What's New in Next.js 14

Next.js 14 introduces several improvements:

- **Server Actions**: Build full-stack applications with ease
- **Improved Performance**: Faster builds and optimized runtime
- **Enhanced Developer Experience**: Better error messages and debugging tools

## The App Router

The App Router is the recommended way to build Next.js applications:

\\\`\\\`\\\`typescript
// app/page.tsx
export default function Page() {
  return <h1>Hello, Next.js 14!</h1>
}
\\\`\\\`\\\`

## Getting Started

Install Next.js with the following command:

\\\`\\\`\\\`bash
npx create-next-app@latest my-app
\\\`\\\`\\\`

## Conclusion

Next.js 14 makes building React applications more enjoyable and productive. Start building today!\`,
      author: 'Guido Miranda',
      publishedAt: new Date('2024-01-15'),
      updatedAt: new Date('2024-01-15'),
      tags: ['nextjs', 'react', 'typescript'],
      imageUrl: '/images/nextjs-blog.jpg',
    },
  };

  return mockPosts[slug] || null;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const post = await getPost(params.slug);

  if (!post) {
    return {
      title: 'Post Not Found',
    };
  }

  return {
    title: \`\${post.title} | Guido Miranda Blog\`,
    description: post.excerpt,
    authors: [{ name: post.author }],
    openGraph: {
      title: post.title,
      description: post.excerpt,
      type: 'article',
      publishedTime: post.publishedAt.toISOString(),
      modifiedTime: post.updatedAt.toISOString(),
      authors: [post.author],
      tags: post.tags,
    },
  };
}

export default async function BlogPostPage({ params }: PageProps) {
  const post = await getPost(params.slug);

  if (!post) {
    notFound();
  }

  return (
    <article className="max-w-4xl mx-auto">
      <header className="mb-8">
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
          {post.title}
        </h1>
        
        <div className="flex items-center gap-4 text-gray-600 dark:text-gray-400 mb-6">
          <span className="font-medium">{post.author}</span>
          <span>•</span>
          <time dateTime={post.publishedAt.toISOString()}>
            {format(post.publishedAt, 'MMMM dd, yyyy')}
          </time>
        </div>

        <div className="flex flex-wrap gap-2">
          {post.tags.map((tag) => (
            <span
              key={tag}
              className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-sm"
            >
              #{tag}
            </span>
          ))}
        </div>
      </header>

      <div className="prose dark:prose-invert max-w-none">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>
          {post.content}
        </ReactMarkdown>
      </div>

      <footer className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Last updated: {format(post.updatedAt, 'MMMM dd, yyyy')}
            </p>
          </div>
          <a
            href="/"
            className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
          >
            ← Back to home
          </a>
        </div>
      </footer>
    </article>
  );
}
`,

  'src/lib/firebase/config.ts': `import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// Initialize Firebase
let app: FirebaseApp;
let auth: Auth;
let db: Firestore;
let storage: FirebaseStorage;

if (typeof window !== 'undefined') {
  // Client-side initialization
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
  auth = getAuth(app);
  db = getFirestore(app);
  storage = getStorage(app);
}

export { app, auth, db, storage };
export default app;
`,

  'src/lib/firebase/admin.ts': `import { initializeApp, getApps, cert, ServiceAccount, App } from 'firebase-admin/app';
import { getAuth, Auth } from 'firebase-admin/auth';
import { getFirestore, Firestore } from 'firebase-admin/firestore';

let adminApp: App;
let adminAuth: Auth;
let adminDb: Firestore;

function initAdmin() {
  if (getApps().length === 0) {
    const serviceAccount: ServiceAccount = {
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\\\n/g, '\\n'),
    };

    adminApp = initializeApp({
      credential: cert(serviceAccount),
      projectId: process.env.FIREBASE_PROJECT_ID,
    });
  } else {
    adminApp = getApps()[0];
  }

  adminAuth = getAuth(adminApp);
  adminDb = getFirestore(adminApp);
}

// Initialize on module load (server-side only)
if (typeof window === 'undefined') {
  try {
    initAdmin();
  } catch (error) {
    console.error('Firebase Admin initialization error:', error);
  }
}

export { adminApp, adminAuth, adminDb };
`,

  'src/lib/openai/client.ts': `import OpenAI from 'openai';

if (!process.env.OPENAI_API_KEY) {
  throw new Error('Missing OPENAI_API_KEY environment variable');
}

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default openai;
`,

  'src/components/blog/PostCard.tsx': `'use client';

import Link from 'next/link';
import { format } from 'date-fns';
import type { BlogPost } from '@/types';

interface PostCardProps {
  post: BlogPost;
}

export function PostCard({ post }: PostCardProps) {
  return (
    <article className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden transition-transform hover:scale-105">
      <div className="relative h-48 bg-gradient-to-br from-blue-500 to-purple-600">
        {post.imageUrl && (
          <img
            src={post.imageUrl}
            alt={post.title}
            className="w-full h-full object-cover"
          />
        )}
      </div>
      
      <div className="p-6">
        <div className="flex flex-wrap gap-2 mb-3">
          {post.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded text-xs"
            >
              #{tag}
            </span>
          ))}
        </div>

        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
          <Link
            href={\`/blog/\${post.slug}\`}
            className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
          >
            {post.title}
          </Link>
        </h3>

        <p className="text-gray-600 dark:text-gray-300 mb-4 line-clamp-3">
          {post.excerpt}
        </p>

        <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
          <span className="font-medium">{post.author}</span>
          <time dateTime={post.publishedAt.toISOString()}>
            {format(post.publishedAt, 'MMM dd, yyyy')}
          </time>
        </div>

        <Link
          href={\`/blog/\${post.slug}\`}
          className="mt-4 inline-block text-blue-600 dark:text-blue-400 font-medium hover:text-blue-700 dark:hover:text-blue-300"
        >
          Read more →
        </Link>
      </div>
    </article>
  );
}
`,

  'src/components/ai/ChatBot.tsx': `'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export function ChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'Hello! I\\'m your AI assistant. Ask me anything about the blog or technology topics!',
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: 'user', content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: input,
          conversationHistory: messages,
        }),
      });

      const data = await response.json();
      
      if (response.ok) {
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: data.response },
        ]);
      } else {
        throw new Error(data.error || 'Failed to get response');
      }
    } catch (error) {
      console.error('Chat error:', error);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'Sorry, I encountered an error. Please try again.',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Chat Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-8 right-8 bg-blue-600 hover:bg-blue-700 text-white rounded-full p-4 shadow-lg transition-transform hover:scale-110 z-50"
        aria-label="Open chat"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
          className="w-6 h-6"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z"
          />
        </svg>
      </button>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-24 right-8 w-96 h-[500px] bg-white dark:bg-gray-800 rounded-lg shadow-2xl z-50 flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="font-bold text-gray-900 dark:text-white">
                AI Assistant
              </h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                  className="w-5 h-5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={\`flex \${
                    message.role === 'user' ? 'justify-end' : 'justify-start'
                  }\`}
                >
                  <div
                    className={\`max-w-[80%] rounded-lg p-3 \${
                      message.role === 'user'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                    }\`}
                  >
                    {message.content}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-3">
                    <div className="flex space-x-2">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100" />
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200" />
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form onSubmit={handleSubmit} className="p-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Type your message..."
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={isLoading}
                />
                <button
                  type="submit"
                  disabled={isLoading || !input.trim()}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg transition-colors"
                >
                  Send
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
`,

  'src/types/index.ts': `export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  author: string;
  publishedAt: Date;
  updatedAt: Date;
  tags: string[];
  imageUrl?: string;
  featured?: boolean;
}

export interface User {
  id: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  role: 'admin' | 'user';
  createdAt: Date;
}

export interface Comment {
  id: string;
  postId: string;
  userId: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  parentId?: string;
}

export interface AIGenerateRequest {
  topic: string;
  type: 'blog-post' | 'summary' | 'outline';
  tone?: 'professional' | 'casual' | 'technical';
  length?: 'short' | 'medium' | 'long';
}

export interface AIGenerateResponse {
  content: string;
  metadata: {
    topic: string;
    type: string;
    tone: string;
    length: string;
    wordCount: number;
  };
}

export interface AIChatRequest {
  message: string;
  conversationHistory?: Array<{
    role: 'user' | 'assistant';
    content: string;
  }>;
}

export interface AIChatResponse {
  response: string;
  conversationId: string;
}

export interface AISummarizeRequest {
  content: string;
  length?: 'brief' | 'detailed';
  format?: 'paragraph' | 'bullets';
}

export interface AISummarizeResponse {
  summary: string;
  metadata: {
    originalLength: number;
    summaryLength: number;
    compressionRatio: string;
  };
}
`,

  'tests/setup.ts': `import { beforeAll, afterAll, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

// Setup test environment
beforeAll(() => {
  // Add any global setup here
  console.log('Setting up tests...');
});

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Cleanup after all tests
afterAll(() => {
  console.log('Tests complete!');
});

// Mock environment variables
process.env.NEXT_PUBLIC_FIREBASE_API_KEY = 'test-api-key';
process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN = 'test.firebaseapp.com';
process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID = 'test-project';
process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET = 'test.appspot.com';
process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID = '123456789';
process.env.NEXT_PUBLIC_FIREBASE_APP_ID = 'test-app-id';
process.env.OPENAI_API_KEY = 'test-openai-key';

// Mock fetch for API calls
global.fetch = vi.fn();

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
  notFound: vi.fn(),
}));
`,

  'tests/e2e/home.spec.ts': `import { test, expect } from '@playwright/test';

test.describe('Homepage', () => {
  test('should display the homepage title', async ({ page }) => {
    await page.goto('/');
    
    await expect(page.locator('h1')).toContainText('Welcome to My Blog');
  });

  test('should display recent blog posts', async ({ page }) => {
    await page.goto('/');
    
    // Check that at least one post card is visible
    const postCards = page.locator('article');
    await expect(postCards).toHaveCount(3);
  });

  test('should navigate to a blog post', async ({ page }) => {
    await page.goto('/');
    
    // Click on the first "Read more" link
    await page.click('text=Read more');
    
    // Wait for navigation
    await page.waitForLoadState('networkidle');
    
    // Verify we're on a blog post page
    await expect(page.url()).toMatch(/\\/blog\\//);
  });

  test('should open and interact with chatbot', async ({ page }) => {
    await page.goto('/');
    
    // Click the chat button
    await page.click('button[aria-label="Open chat"]');
    
    // Wait for chat window to appear
    await expect(page.locator('text=AI Assistant')).toBeVisible();
    
    // Type a message
    await page.fill('input[placeholder="Type your message..."]', 'Hello!');
    
    // Send the message
    await page.click('button:has-text("Send")');
    
    // Verify the message appears
    await expect(page.locator('text=Hello!')).toBeVisible();
  });

  test('should have proper navigation', async ({ page }) => {
    await page.goto('/');
    
    // Check header navigation
    await expect(page.locator('nav')).toBeVisible();
    await expect(page.locator('a[href="/"]')).toContainText('Home');
    await expect(page.locator('a[href="/blog"]')).toContainText('Blog');
  });

  test('should display footer', async ({ page }) => {
    await page.goto('/');
    
    // Check footer is present
    const footer = page.locator('footer');
    await expect(footer).toBeVisible();
    await expect(footer).toContainText('Guido Miranda');
    await expect(footer).toContainText(new Date().getFullYear().toString());
  });

  test('should be responsive', async ({ page }) => {
    // Test mobile view
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    
    await expect(page.locator('h1')).toBeVisible();
    
    // Test tablet view
    await page.setViewportSize({ width: 768, height: 1024 });
    await expect(page.locator('h1')).toBeVisible();
    
    // Test desktop view
    await page.setViewportSize({ width: 1920, height: 1080 });
    await expect(page.locator('h1')).toBeVisible();
  });
});

test.describe('Blog Post Page', () => {
  test('should display blog post content', async ({ page }) => {
    await page.goto('/blog/getting-started-with-nextjs');
    
    await expect(page.locator('h1')).toContainText('Getting Started with Next.js 14');
  });

  test('should display post metadata', async ({ page }) => {
    await page.goto('/blog/getting-started-with-nextjs');
    
    // Check for author and date
    await expect(page.locator('text=Guido Miranda')).toBeVisible();
    await expect(page.locator('time')).toBeVisible();
  });

  test('should display tags', async ({ page }) => {
    await page.goto('/blog/getting-started-with-nextjs');
    
    // Check for tags
    await expect(page.locator('text=#nextjs')).toBeVisible();
    await expect(page.locator('text=#react')).toBeVisible();
  });

  test('should have back to home link', async ({ page }) => {
    await page.goto('/blog/getting-started-with-nextjs');
    
    const backLink = page.locator('a:has-text("Back to home")');
    await expect(backLink).toBeVisible();
    
    await backLink.click();
    await page.waitForLoadState('networkidle');
    
    await expect(page.url()).toBe(new URL('/', page.url()).href);
  });
});
`,
};

// Write all files
let created = 0;
let skipped = 0;

Object.entries(files).forEach(([filePath, content]) => {
  const fullPath = path.join(__dirname, filePath);
  const dir = path.dirname(fullPath);
  
  // Ensure directory exists
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  
  // Write file
  if (!fs.existsSync(fullPath)) {
    fs.writeFileSync(fullPath, content, 'utf8');
    console.log(\`  ✓ Created: \${filePath}\`);
    created++;
  } else {
    console.log(\`  - Exists: \${filePath}\`);
    skipped++;
  }
});

console.log(\`\\n===========================================\`);
console.log(\`Files Created: \${created}\`);
console.log(\`Files Skipped: \${skipped}\`);
console.log(\`===========================================\\n\`);
console.log('All source files created successfully!');
console.log('\\nNext steps:');
console.log('1. Copy .env.example to .env and add your credentials');
console.log('2. Run: npm run dev');
console.log('3. Open: http://localhost:3000');
console.log('===========================================\\n');
