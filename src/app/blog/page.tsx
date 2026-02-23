import { PostCard } from '@/components/blog/PostCard';
import type { BlogPost } from '@/types';

async function getAllPosts(): Promise<BlogPost[]> {
  // This would typically fetch from your database or CMS
  // For now, returning mock data
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

export default async function BlogPage() {
  const posts = await getAllPosts();

  return (
    <div className="max-w-7xl mx-auto">
      <section className="mb-12">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
          Blog
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-300">
          Thoughts on software development, AI, and modern web technologies.
        </p>
      </section>

      <section>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      </section>
    </div>
  );
}
