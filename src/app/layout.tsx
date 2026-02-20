import type { Metadata } from 'next';
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
