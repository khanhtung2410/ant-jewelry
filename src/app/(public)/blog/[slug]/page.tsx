import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Prisma } from '@prisma/client';
import { Suspense } from 'react';
import { getBlogPostBySlug, getBlogPosts } from '@/features/shared/queries';
import { BlogPostPageContent } from './blog-post-page-content';

export async function generateStaticParams() {
  try {
    const posts = await getBlogPosts();
    return posts.map((post) => ({ slug: post.slug }));
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2021') {
      return [];
    }
    throw error;
  }
}

export async function generateMetadata(props: PageProps<'/blog/[slug]'>): Promise<Metadata> {
  const { slug } = await props.params;
  let post: Awaited<ReturnType<typeof getBlogPostBySlug>>;
  try {
    post = await getBlogPostBySlug(slug);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2021') {
      notFound();
    }
    throw error;
  }

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

export default function BlogPostPage(props: PageProps<'/blog/[slug]'>) {
  return (
    <Suspense fallback={<BlogPostPageFallback />}>
      <BlogPostPageContent params={props.params} />
    </Suspense>
  );
}

function BlogPostPageFallback() {
  return (
    <main
      aria-busy="true"
      aria-label="Loading blog post"
      className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8"
    >
      <div className="mb-10 h-8 w-32 animate-pulse bg-product-image" />
      <div className="mx-auto max-w-3xl space-y-4">
        <div className="mx-auto h-8 w-2/3 animate-pulse bg-product-image" />
        <div className="mx-auto h-4 w-40 animate-pulse bg-product-image" />
        <div className="aspect-[4/3] w-full animate-pulse bg-product-image" />
      </div>
    </main>
  );
}
