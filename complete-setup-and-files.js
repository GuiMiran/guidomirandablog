const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Directory structure
const dirs = [
  'src/app/api/ai/chat',
  'src/app/api/ai/generate',
  'src/app/api/ai/summarize',
  'src/app/blog/[slug]',
  'src/components/ui',
  'src/components/blog',
  'src/components/ai',
  'src/lib/firebase',
  'src/lib/openai',
  'src/types',
  'src/utils',
  'content/posts',
  'tests/unit',
  'tests/e2e',
  '.github/workflows',
  'public/images'
];

console.log('===========================================');
console.log('Complete Project Setup');
console.log('===========================================\n');

// Step 1: Create directories
console.log('[1/3] Creating directories...');
dirs.forEach(dir => {
  const fullPath = path.join(__dirname, dir);
  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath, { recursive: true });
    console.log(`  ✓ Created: ${dir}`);
  } else {
    console.log(`  - Exists: ${dir}`);
  }
});
console.log('  Directories created successfully!\n');

// Step 2: Install dependencies
console.log('[2/3] Installing dependencies...');
try {
  execSync('npm install', { stdio: 'inherit', cwd: __dirname });
  console.log('  Dependencies installed successfully!\n');
} catch (error) {
  console.error('  ERROR: Failed to install dependencies');
  console.error(error.message);
  process.exit(1);
}

// Step 3: Create source files
console.log('[3/3] Creating source files...');

const files = {
  'src/app/layout.tsx': `import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Analytics } from '@vercel/analytics/react';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Guido Miranda Blog',
  description: 'Personal blog about software development, AI, and technology',
  authors: [{ name: 'Guido Miranda' }],
  keywords: ['blog', 'software development', 'AI', 'technology', 'programming'],
  openGraph: {
    title: 'Guido Miranda Blog',
    description: 'Personal blog about software development, AI, and technology',
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Guido Miranda Blog',
    description: 'Personal blog about software development, AI, and technology',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
          <header className="border-b border-gray-200 dark:border-gray-700">
            <nav className="container mx-auto px-4 py-6">
              <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Guido Miranda
                </h1>
                <div className="flex gap-6">
                  <a
                    href="/"
                    className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white transition-colors"
                  >
                    Home
                  </a>
                  <a
                    href="/blog"
                    className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white transition-colors"
                  >
                    Blog
                  </a>
                </div>
              </div>
            </nav>
          </header>
          <main className="container mx-auto px-4 py-8">{children}</main>
          <footer className="border-t border-gray-200 dark:border-gray-700 mt-16">
            <div className="container mx-auto px-4 py-8 text-center text-gray-600 dark:text-gray-400">
              <p>&copy; {new Date().getFullYear()} Guido Miranda. All rights reserved.</p>
            </div>
          </footer>
        </div>
        <Analytics />
      </body>
    </html>
  );
}
`,

  'src/app/page.tsx': `import { PostCard } from '@/components/blog/PostCard';
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
`,

  'src/app/globals.css': `@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --foreground-rgb: 0, 0, 0;
  --background-start-rgb: 249, 250, 251;
  --background-end-rgb: 243, 244, 246;
}

@media (prefers-color-scheme: dark) {
  :root {
    --foreground-rgb: 255, 255, 255;
    --background-start-rgb: 17, 24, 39;
    --background-end-rgb: 31, 41, 55;
  }
}

body {
  color: rgb(var(--foreground-rgb));
  background: linear-gradient(
      to bottom,
      transparent,
      rgb(var(--background-end-rgb))
    )
    rgb(var(--background-start-rgb));
}

@layer base {
  h1 {
    @apply text-4xl font-bold tracking-tight;
  }
  
  h2 {
    @apply text-3xl font-semibold tracking-tight;
  }
  
  h3 {
    @apply text-2xl font-semibold tracking-tight;
  }
  
  h4 {
    @apply text-xl font-semibold;
  }
  
  a {
    @apply transition-colors duration-200;
  }
}

@layer components {
  .prose {
    @apply max-w-none text-gray-700 dark:text-gray-300;
  }
  
  .prose h1 {
    @apply text-gray-900 dark:text-white mb-4;
  }
  
  .prose h2 {
    @apply text-gray-900 dark:text-white mt-8 mb-4;
  }
  
  .prose h3 {
    @apply text-gray-900 dark:text-white mt-6 mb-3;
  }
  
  .prose p {
    @apply mb-4 leading-7;
  }
  
  .prose a {
    @apply text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 underline;
  }
  
  .prose code {
    @apply bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-sm font-mono;
  }
  
  .prose pre {
    @apply bg-gray-900 dark:bg-gray-950 p-4 rounded-lg overflow-x-auto mb-4;
  }
  
  .prose pre code {
    @apply bg-transparent p-0 text-gray-100;
  }
  
  .prose ul {
    @apply list-disc list-inside mb-4 space-y-2;
  }
  
  .prose ol {
    @apply list-decimal list-inside mb-4 space-y-2;
  }
  
  .prose blockquote {
    @apply border-l-4 border-gray-300 dark:border-gray-600 pl-4 italic my-4;
  }
}

@layer utilities {
  .text-balance {
    text-wrap: balance;
  }
}
`,

};

// Write all files
Object.entries(files).forEach(([filePath, content]) => {
  const fullPath = path.join(__dirname, filePath);
  fs.writeFileSync(fullPath, content);
  console.log(`  ✓ Created: ${filePath}`);
});

console.log('\n===========================================');
console.log('Setup Complete!');
console.log('===========================================');
console.log('\nNext Steps:');
console.log('1. Run: node create-all-files.js (to create remaining files)');
console.log('2. Copy .env.example to .env and add credentials');
console.log('3. Run: npm run dev');
console.log('===========================================\n');
