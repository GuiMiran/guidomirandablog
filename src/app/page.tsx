import { PostCard } from '@/components/blog/PostCard';
import { ChatBot } from '@/components/ai/ChatBot';
import type { BlogPost } from '@/types';

async function getRecentPosts(): Promise<BlogPost[]> {
  // This would typically fetch from your database or CMS
  // For now, returning mock data
  return [
    {
      id: '1',
      slug: 'getting-started-with-nextjs',
      title: 'Getting Started with Next.js 14',
      excerpt: 'Learn how to build modern web applications with Next.js 14 and the App Router.',
      content: '',
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
      content: '',
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
      content: '',
      author: 'Guido Miranda',
      publishedAt: new Date('2024-01-05'),
      updatedAt: new Date('2024-01-05'),
      tags: ['firebase', 'authentication', 'security'],
      imageUrl: '/images/firebase-blog.jpg',
    },
  ];
}

export default async function HomePage() {
  const posts = await getRecentPosts();

  return (
    <div className="space-y-12">
      <section className="text-center py-12">
        <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-4">
          Welcome to My Blog
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
          Exploring software development, AI, and modern web technologies.
          Join me on this journey of learning and building.
        </p>
      </section>

      <section>
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
          Recent Posts
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      </section>

      <ChatBot />
    </div>
  );
}
