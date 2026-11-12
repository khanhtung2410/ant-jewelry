import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { BlogDetail } from '@/features/blog/components/blog-detail';
import { getBlogPostBySlug, getBlogPosts } from '@/features/shared/queries';

export async function generateStaticParams() {
  const posts = await getBlogPosts();
  return posts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata(props: PageProps<'/blog/[slug]'>): Promise<Metadata> {
  const { slug } = await props.params;
  const post = await getBlogPostBySlug(slug);

  if (!post) {
    notFound();
  }

  const title = `${post.title} | ANT JEWELRY`;

  return {
    title: post.title,
    description: post.summary,
    alternates: {
      canonical: `/blog/${post.slug}`,
    },
    openGraph: {
      type: 'article',
      siteName: 'ANT JEWELRY',
      title,
      description: post.summary,
      url: `/blog/${post.slug}`,
      publishedTime: post.publishedAt,
      images: [{ url: post.coverImageUrl, alt: post.title }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description: post.summary,
      images: [{ url: post.coverImageUrl, alt: post.title }],
    },
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
