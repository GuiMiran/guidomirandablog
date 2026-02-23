import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import type { BlogPost } from '@/types';

// Mock data - same as in other pages
async function getAllPosts(): Promise<BlogPost[]> {
  return [
    {
      id: '1',
      slug: 'getting-started-with-nextjs',
      title: 'Getting Started with Next.js 14',
      excerpt: 'Learn how to build modern web applications with Next.js 14 and the App Router.',
      content: `# Getting Started with Next.js 14

Next.js 14 brings powerful features and improvements to help you build modern web applications. In this comprehensive guide, we'll explore the key features and best practices.

## What's New in Next.js 14

Next.js 14 introduces several exciting features:

- **Server Actions**: Simplified data mutations with server-side functions
- **Partial Prerendering**: Combine static and dynamic rendering for optimal performance
- **Improved Performance**: Faster local development and production builds
- **Enhanced Developer Experience**: Better error messages and debugging tools

## Getting Started

First, create a new Next.js project:

\`\`\`bash
npx create-next-app@latest my-app
cd my-app
npm run dev
\`\`\`

## App Router

The App Router is the recommended way to build Next.js applications. It provides:

- File-system based routing
- Server Components by default
- Layouts and templates
- Error handling
- Loading states

## Conclusion

Next.js 14 is a powerful framework for building modern web applications. Start building today!`,
      author: 'Guido Miranda',
      publishedAt: new Date('2024-01-15'),
      updatedAt: new Date('2024-01-15'),
      tags: ['nextjs', 'react', 'typescript'],
      imageUrl: '/images/nextjs-blog.jpg',
    },
    {
      id: '2',
      slug: 'ai-powered-applications',
      title: 'Building AI-Powered Applications',
      excerpt: 'Explore how to integrate OpenAI and other AI services into your applications.',
      content: `# Building AI-Powered Applications

Artificial Intelligence is transforming how we build applications. Learn how to integrate AI capabilities into your projects.

## Why AI in Your Applications?

AI can enhance user experiences in many ways:

- **Natural Language Processing**: Build chatbots and assistants
- **Content Generation**: Create text, images, and more
- **Data Analysis**: Extract insights from large datasets
- **Personalization**: Tailor experiences to individual users

## Getting Started with OpenAI

OpenAI provides powerful APIs for various AI tasks:

\`\`\`typescript
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const completion = await openai.chat.completions.create({
  model: 'gpt-4',
  messages: [{ role: 'user', content: 'Hello!' }],
});
\`\`\`

## Best Practices

1. **API Key Security**: Never expose your API keys
2. **Rate Limiting**: Implement proper rate limiting
3. **Error Handling**: Handle API errors gracefully
4. **Cost Management**: Monitor and optimize API usage

## Conclusion

AI-powered applications are the future. Start building today!`,
      author: 'Guido Miranda',
      publishedAt: new Date('2024-01-10'),
      updatedAt: new Date('2024-01-10'),
      tags: ['ai', 'openai', 'machine-learning'],
      imageUrl: '/images/ai-blog.jpg',
    },
    {
      id: '3',
      slug: 'firebase-authentication',
      title: 'Implementing Firebase Authentication',
      excerpt: 'A comprehensive guide to adding authentication to your web app with Firebase.',
      content: `# Implementing Firebase Authentication

Firebase Authentication provides a complete authentication system for your web applications. Learn how to implement it effectively.

## Why Firebase Authentication?

Firebase Authentication offers:

- **Multiple Providers**: Email, Google, GitHub, and more
- **Easy Setup**: Quick integration with minimal code
- **Security**: Built-in security best practices
- **Scalability**: Handles millions of users

## Setup

First, install Firebase:

\`\`\`bash
npm install firebase
\`\`\`

Then initialize Firebase in your app:

\`\`\`typescript
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
\`\`\`

## Implementing Sign-In

Add email/password authentication:

\`\`\`typescript
import { signInWithEmailAndPassword } from 'firebase/auth';

async function signIn(email: string, password: string) {
  try {
    const userCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password
    );
    return userCredential.user;
  } catch (error) {
    console.error('Error signing in:', error);
    throw error;
  }
}
\`\`\`

## Best Practices

1. **Secure Configuration**: Use environment variables
2. **Error Handling**: Provide user-friendly error messages
3. **Session Management**: Handle user sessions properly
4. **Protected Routes**: Secure your application routes

## Conclusion

Firebase Authentication makes it easy to add secure authentication to your applications!`,
      author: 'Guido Miranda',
      publishedAt: new Date('2024-01-05'),
      updatedAt: new Date('2024-01-05'),
      tags: ['firebase', 'authentication', 'security'],
      imageUrl: '/images/firebase-blog.jpg',
    },
  ];
}

async function getPostBySlug(slug: string): Promise<BlogPost | undefined> {
  const posts = await getAllPosts();
  return posts.find((post) => post.slug === slug);
}

// Generate static params for all blog posts
export async function generateStaticParams() {
  const posts = await getAllPosts();
  return posts.map((post) => ({
    slug: post.slug,
  }));
}

// Generate metadata for the page
export async function generateMetadata({ params }: { params: { slug: string } }) {
  const post = await getPostBySlug(params.slug);

  if (!post) {
    return {
      title: 'Post Not Found',
    };
  }

  return {
    title: `${post.title} | Guido Miranda Blog`,
    description: post.excerpt,
  };
}

export default async function BlogPostPage({
  params,
}: {
  params: { slug: string };
}) {
  const post = await getPostBySlug(params.slug);

  if (!post) {
    notFound();
  }

  const formattedDate = new Date(post.publishedAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <article className="max-w-4xl mx-auto">
      {/* Back link */}
      <Link
        href="/blog"
        className="inline-flex items-center text-blue-600 dark:text-blue-400 hover:underline mb-8"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5 mr-1"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
            clipRule="evenodd"
          />
        </svg>
        Back to Blog
      </Link>

      {/* Header image */}
      {post.imageUrl && (
        <div className="relative h-96 w-full mb-8 rounded-lg overflow-hidden">
          <Image
            src={post.imageUrl}
            alt={post.title}
            fill
            className="object-cover"
            priority
          />
        </div>
      )}

      {/* Title and metadata */}
      <header className="mb-8">
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
          {post.title}
        </h1>
        
        <div className="flex flex-wrap items-center gap-4 text-gray-600 dark:text-gray-400 mb-6">
          <div className="flex items-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 mr-2"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                clipRule="evenodd"
              />
            </svg>
            <span>{post.author}</span>
          </div>
          <div className="flex items-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 mr-2"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"
                clipRule="evenodd"
              />
            </svg>
            <time dateTime={post.publishedAt.toISOString()}>{formattedDate}</time>
          </div>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-2">
          {post.tags.map((tag) => (
            <span
              key={tag}
              className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-sm font-medium"
            >
              {tag}
            </span>
          ))}
        </div>
      </header>

      {/* Content */}
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <div className="whitespace-pre-wrap text-gray-700 dark:text-gray-300 leading-relaxed">
          {post.content}
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-12 pt-8 border-t dark:border-gray-700">
        <Link
          href="/blog"
          className="inline-flex items-center text-blue-600 dark:text-blue-400 hover:underline"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 mr-1"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
              clipRule="evenodd"
            />
          </svg>
          Back to Blog
        </Link>
      </footer>
    </article>
  );
}
