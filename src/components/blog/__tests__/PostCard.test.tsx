import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PostCard } from '../PostCard';
import type { BlogPost } from '@/types';

// Mock Next.js components
vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

vi.mock('next/image', () => ({
  default: ({ alt, src }: { alt: string; src: string }) => (
    <img alt={alt} src={src} />
  ),
}));

describe('PostCard', () => {
  const mockPost: BlogPost = {
    id: '1',
    slug: 'test-post',
    title: 'Test Post Title',
    excerpt: 'This is a test excerpt for the blog post.',
    content: 'Full content here',
    author: 'Test Author',
    publishedAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15'),
    tags: ['test', 'vitest', 'react'],
    imageUrl: '/images/test-image.jpg',
  };

  it('should render post title', () => {
    render(<PostCard post={mockPost} />);
    expect(screen.getByText('Test Post Title')).toBeDefined();
  });

  it('should render post excerpt', () => {
    render(<PostCard post={mockPost} />);
    expect(screen.getByText('This is a test excerpt for the blog post.')).toBeDefined();
  });

  it('should render post author', () => {
    render(<PostCard post={mockPost} />);
    expect(screen.getByText('Test Author')).toBeDefined();
  });

  it('should render formatted date', () => {
    render(<PostCard post={mockPost} />);
    expect(screen.getByText('January 15, 2024')).toBeDefined();
  });

  it('should render all tags', () => {
    render(<PostCard post={mockPost} />);
    expect(screen.getByText('test')).toBeDefined();
    expect(screen.getByText('vitest')).toBeDefined();
    expect(screen.getByText('react')).toBeDefined();
  });

  it('should render image when imageUrl is provided', () => {
    render(<PostCard post={mockPost} />);
    const image = screen.getByAltText('Test Post Title');
    expect(image).toBeDefined();
    expect(image.getAttribute('src')).toBe('/images/test-image.jpg');
  });

  it('should not render image when imageUrl is not provided', () => {
    const postWithoutImage = { ...mockPost, imageUrl: undefined };
    render(<PostCard post={postWithoutImage} />);
    const image = screen.queryByAltText('Test Post Title');
    expect(image).toBeNull();
  });

  it('should have correct link to post detail page', () => {
    const { container } = render(<PostCard post={mockPost} />);
    const link = container.querySelector('a[href="/blog/test-post"]');
    expect(link).toBeDefined();
  });

  it('should render with multiple tags', () => {
    const postWithManyTags = {
      ...mockPost,
      tags: ['javascript', 'typescript', 'nextjs', 'react', 'tailwind'],
    };
    render(<PostCard post={postWithManyTags} />);
    
    expect(screen.getByText('javascript')).toBeDefined();
    expect(screen.getByText('typescript')).toBeDefined();
    expect(screen.getByText('nextjs')).toBeDefined();
    expect(screen.getByText('react')).toBeDefined();
    expect(screen.getByText('tailwind')).toBeDefined();
  });

  it('should handle posts with no tags', () => {
    const postWithNoTags = { ...mockPost, tags: [] };
    render(<PostCard post={postWithNoTags} />);
    // Should still render without errors
    expect(screen.getByText('Test Post Title')).toBeDefined();
  });
});
