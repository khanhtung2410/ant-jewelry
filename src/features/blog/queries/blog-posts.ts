/* eslint-disable @typescript-eslint/no-explicit-any */
import type { BlogPost, BlogPostImage } from '@/features/shared/domain/domain';
import { publishStatus } from '@/constants/statuses';
import { prisma } from '@/features/shared/db/prisma';

function isMissingTableError(error: unknown): boolean {
  const e = error as {
    code?: string;
    sqlState?: string;
    cause?: { code?: string; sqlState?: string };
  } | null;
  const code = e?.code ?? e?.cause?.code;
  const sqlState = e?.sqlState ?? e?.cause?.sqlState;
  return code === 'P2021' || sqlState === '42P01';
}

function mapBlogPost(record: {
  id: string;
  title: string;
  slug: string;
  summary: string;
  body: string;
  coverImageUrl: string;
  publishedAt: unknown;
  status: 'DRAFT' | 'PUBLISHED';
  images: { id: string; url: string; alt: string; sortOrder: number }[];
}): BlogPost {
  const publishedAt =
    record.publishedAt instanceof Date ? record.publishedAt : new Date(String(record.publishedAt));
  return {
    blog_id: record.id,
    title: record.title,
    slug: record.slug,
    summary: record.summary,
    body: record.body,
    coverImageUrl: record.coverImageUrl,
    images: record.images.map((image): BlogPostImage => ({
      imageId: image.id,
      url: image.url,
      alt: image.alt,
      sortOrder: image.sortOrder,
    })),
    publishedAt: publishedAt.toISOString(),
    status: record.status,
  };
}

/**
 * Newest first, with `id` as the tie-breaker so posts that share a
 * `publishedAt` value keep the same order on SQLite and PostgreSQL.
 */
export function getBlogPostOrderBy(): Array<Record<string, 'asc' | 'desc'>> {
  return [{ publishedAt: 'desc' }, { id: 'asc' }];
}

/**
 * Returns published Blog posts, newest first. Drafts are excluded unless
 * `includeDrafts` is set explicitly for an admin screen.
 */
export async function getBlogPosts(
  options: { includeDrafts?: boolean; limit?: number } = {},
): Promise<BlogPost[]> {
  'use cache';
  try {
    let query = (prisma.orm.public.BlogPost as any)
      .include('images', (images: any) => images.orderBy((img: any) => img.sortOrder.asc()))
      .orderBy([(post: any) => post.publishedAt.desc(), (post: any) => post.id.asc()]);
    if (!options.includeDrafts) {
      query = query.where({ status: publishStatus.PUBLISHED });
    }
    if (typeof options.limit === 'number') {
      query = query.limit(options.limit);
    }
    const records = await query.all();
    return records.map(mapBlogPost);
  } catch (error) {
    if (isMissingTableError(error)) {
      return [];
    }
    throw error;
  }
}

export async function getBlogPostBySlug(
  slug: string,
  options: { includeDrafts?: boolean } = {},
): Promise<BlogPost | null> {
  'use cache';
  try {
    let query = (prisma.orm.public.BlogPost as any).where({ slug });
    if (!options.includeDrafts) {
      query = query.where({ status: publishStatus.PUBLISHED });
    }
    const record = await query
      .include('images', (images: any) => images.orderBy((img: any) => img.sortOrder.asc()))
      .first();
    return record ? mapBlogPost(record) : null;
  } catch (error) {
    if (isMissingTableError(error)) {
      return null;
    }
    throw error;
  }
}
