import type { BlogPost } from '@/features/shared/domain/domain';
import { prisma } from '@/features/shared/db/prisma';

function mapBlogPost(record: {
  id: string;
  title: string;
  slug: string;
  summary: string;
  body: string;
  coverImageUrl: string;
  publishedAt: Date;
  status: 'DRAFT' | 'PUBLISHED';
}): BlogPost {
  return {
    blog_id: record.id,
    title: record.title,
    slug: record.slug,
    summary: record.summary,
    body: record.body,
    coverImageUrl: record.coverImageUrl,
    publishedAt: record.publishedAt.toISOString(),
    status: record.status,
  };
}

/**
 * Returns published Blog posts, newest first. Drafts are excluded unless
 * `includeDrafts` is set explicitly for an admin screen.
 */
export async function getBlogPosts(
  options: { includeDrafts?: boolean; limit?: number } = {},
): Promise<BlogPost[]> {
  'use cache';
  const records = await prisma.blogPost.findMany({
    where: options.includeDrafts ? {} : { status: 'PUBLISHED' },
    orderBy: { publishedAt: 'desc' },
    ...(typeof options.limit === 'number' ? { take: options.limit } : {}),
  });

  return records.map(mapBlogPost);
}

export async function getBlogPostBySlug(
  slug: string,
  options: { includeDrafts?: boolean } = {},
): Promise<BlogPost | null> {
  'use cache';
  const record = await prisma.blogPost.findFirst({
    where: {
      slug,
      ...(options.includeDrafts ? {} : { status: 'PUBLISHED' }),
    },
  });

  return record ? mapBlogPost(record) : null;
}
