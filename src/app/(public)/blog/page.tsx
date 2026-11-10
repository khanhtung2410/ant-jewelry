import type { Metadata } from 'next';
import { BlogList } from '@/components/blog-list';
import { getBlogPosts } from '@/lib/queries';

export const metadata: Metadata = {
  title: 'Blog',
  description: 'Tin tức, cảm hứng và hướng dẫn chọn trang sức từ AN JEWELRY.',
};

export default function BlogPage() {
  const posts = getBlogPosts();

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
      <h1 className="mb-10 text-center font-heading text-2xl tracking-[0.08em] sm:text-3xl">
        BLOG
      </h1>
      <BlogList posts={posts} />
    </main>
  );
}
