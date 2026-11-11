import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { BlogDetail } from '@/components/blog-detail';
import { getBlogPostBySlug, getBlogPosts } from '@/lib/queries';

export async function generateStaticParams() {
  const posts = await getBlogPosts();
  return posts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata(props: PageProps<'/blog/[slug]'>): Promise<Metadata> {
  const { slug } = await props.params;
  const post = await getBlogPostBySlug(slug);

  if (!post) {
    return {};
  }

  return {
    title: post.title,
    description: post.summary,
  };
}

export default async function BlogPostPage(props: PageProps<'/blog/[slug]'>) {
  const { slug } = await props.params;
  const post = await getBlogPostBySlug(slug);

  if (!post) {
    notFound();
  }

  const otherPosts = (await getBlogPosts()).filter((item) => item.slug !== post.slug).slice(0, 4);

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
      <h1 className="mb-10 font-heading text-2xl tracking-[0.08em] sm:text-3xl">BLOG</h1>
      <BlogDetail post={post} otherPosts={otherPosts} />
    </main>
  );
}
