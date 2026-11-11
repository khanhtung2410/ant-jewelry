import type { Metadata } from 'next';
import { BlogList } from '@/features/blog/components/blog-list';
import { getBlogPosts } from '@/features/shared/queries';

export const metadata: Metadata = {
  title: 'Blog',
  description: 'Tin tức, cảm hứng và hướng dẫn chọn trang sức từ ANT JEWELRY.',
};

export default async function BlogPage() {
  const posts = await getBlogPosts();

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
      <h2 className="mb-10 font-heading text-2xl tracking-[0.08em] sm:text-3xl">BLOG</h2>
      <BlogList posts={posts} />
    </main>
  );
}
