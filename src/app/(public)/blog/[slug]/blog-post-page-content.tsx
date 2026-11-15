import { notFound } from 'next/navigation';
import { BlogDetail } from '@/features/blog/components/blog-detail';
import { getBlogPostBySlug, getBlogPosts } from '@/features/shared/queries';

type BlogPostPageContentProps = Pick<PageProps<'/blog/[slug]'>, 'params'>;

export async function BlogPostPageContent({ params }: BlogPostPageContentProps) {
  const { slug } = await params;
  const post = await getBlogPostBySlug(slug);

  if (!post) {
    notFound();
  }

  const otherPosts = (await getBlogPosts()).filter((item) => item.slug !== post.slug).slice(0, 1);

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
      <p className="mb-10 font-heading text-2xl tracking-[0.08em] sm:text-3xl">BLOG</p>
      <BlogDetail post={post} otherPosts={otherPosts} />
    </main>
  );
}
