import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/features/shared/db/prisma';
import type { BlogPostFormState } from '@/features/blog/actions';

vi.mock('@/features/auth/session', () => ({
  getAdminSession: vi.fn(async () => ({
    userId: 'admin-1',
    email: 'admin@antjewelry.local',
    name: 'Admin',
    role: 'ADMIN',
    sessionVersion: 0,
    exp: 9_999_999_999,
  })),
}));

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
  updateTag: vi.fn(),
  cacheTag: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  redirect: vi.fn(() => {
    throw new Error('NEXT_REDIRECT');
  }),
}));

const { deleteBlogPost, saveBlogPost } = await import('@/features/blog/actions');

const suffix = `${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`;

const emptyState: BlogPostFormState = {
  values: {
    title: '',
    slug: '',
    summary: '',
    body: '',
    coverImageUrl: '',
    publishedAt: '',
    status: 'DRAFT',
  },
  fieldErrors: {},
  message: null,
};

describe('blog post actions and image sync with the real database (G12)', () => {
  const createdPostIds: string[] = [];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterAll(async () => {
    await prisma.blogPost.deleteMany({ where: { id: { in: createdPostIds } } });
  });

  function formDataFor(options: {
    slug: string;
    title?: string;
    body?: string;
    coverImageUrl?: string;
    blogId?: string;
  }): FormData {
    const formData = new FormData();
    if (options.blogId) formData.set('blogId', options.blogId);
    formData.set('title', options.title ?? 'Test post');
    formData.set('slug', options.slug);
    formData.set('summary', 'A short summary');
    formData.set('body', options.body ?? 'Body text');
    formData.set('coverImageUrl', options.coverImageUrl ?? '/mock/cover.webp');
    formData.set('publishedAt', '2026-05-01');
    formData.set('status', 'PUBLISHED');
    return formData;
  }

  it('persists a post and ordered cover plus body image rows, and revalidates blog pages', async () => {
    const slug = `g12-create-${suffix}`;
    const body = 'Intro\n\n![Ring](/mock/ring.webp)\n\n![Necklace](/mock/necklace.webp)';

    await expect(saveBlogPost(emptyState, formDataFor({ slug, body }))).rejects.toThrow(
      'NEXT_REDIRECT',
    );

    const post = await prisma.blogPost.findUniqueOrThrow({
      where: { slug },
      include: { images: { orderBy: { sortOrder: 'asc' } } },
    });
    createdPostIds.push(post.id);

    expect(post.title).toBe('Test post');
    expect(post.coverImageUrl).toBe('/mock/cover.webp');
    expect(post.status).toBe('PUBLISHED');
    expect(post.publishedAt.toISOString()).toBe('2026-04-30T17:00:00.000Z');
    expect(
      post.images.map((image) => ({
        url: image.url,
        alt: image.alt,
        sortOrder: image.sortOrder,
      })),
    ).toEqual([
      { url: '/mock/cover.webp', alt: 'Test post', sortOrder: 1 },
      { url: '/mock/ring.webp', alt: 'Ring', sortOrder: 2 },
      { url: '/mock/necklace.webp', alt: 'Necklace', sortOrder: 3 },
    ]);

    expect(revalidatePath).toHaveBeenCalledWith('/admin/blog');
    expect(revalidatePath).toHaveBeenCalledWith('/', 'page');
    expect(revalidatePath).toHaveBeenCalledWith('/blog', 'page');
    expect(revalidatePath).toHaveBeenCalledWith('/blog/[slug]', 'page');

    // The synced rows must reach the real query consumer in the right order.
    const { getBlogPostBySlug } = await import('@/features/blog/queries/blog-posts');
    const fetched = await getBlogPostBySlug(slug, { includeDrafts: true });
    expect(fetched?.images.map((image) => image.url)).toEqual([
      '/mock/cover.webp',
      '/mock/ring.webp',
      '/mock/necklace.webp',
    ]);
  });

  it('returns a slug field error when another post already uses the slug', async () => {
    const slug = `g12-duplicate-${suffix}`;
    const existing = await prisma.blogPost.create({
      data: {
        title: 'Existing post',
        slug,
        summary: 'Summary',
        body: 'Body',
        coverImageUrl: '/mock/cover.webp',
        publishedAt: new Date('2026-04-30T17:00:00.000Z'),
        status: 'DRAFT',
      },
      select: { id: true },
    });
    createdPostIds.push(existing.id);

    const state = await saveBlogPost(emptyState, formDataFor({ slug, title: 'Another post' }));

    expect(state.fieldErrors.slug).toEqual(['This slug is already in use.']);
    const persisted = await prisma.blogPost.findUniqueOrThrow({ where: { id: existing.id } });
    expect(persisted.title).toBe('Existing post');
  });

  it('replaces the image rows on re-save, deduplicating URLs and falling back to the title for alt', async () => {
    const slug = `g12-sync-${suffix}`;
    await expect(
      saveBlogPost(
        emptyState,
        formDataFor({
          slug,
          coverImageUrl: '/mock/old-cover.webp',
          body: '![A](/mock/a.webp)\n![B](/mock/b.webp)',
        }),
      ),
    ).rejects.toThrow('NEXT_REDIRECT');

    const created = await prisma.blogPost.findUniqueOrThrow({ where: { slug } });
    createdPostIds.push(created.id);
    const initialImages = await prisma.blogImage.findMany({
      where: { blogPostId: created.id },
      orderBy: { sortOrder: 'asc' },
      select: { url: true },
    });
    expect(initialImages.map((image) => image.url)).toEqual([
      '/mock/old-cover.webp',
      '/mock/a.webp',
      '/mock/b.webp',
    ]);

    await expect(
      saveBlogPost(
        emptyState,
        formDataFor({
          slug,
          blogId: created.id,
          coverImageUrl: '/mock/a.webp',
          body: '![A again](/mock/a.webp)\n![](/mock/c.webp)',
        }),
      ),
    ).rejects.toThrow('NEXT_REDIRECT');

    const synced = await prisma.blogPost.findUniqueOrThrow({
      where: { id: created.id },
      include: { images: { orderBy: { sortOrder: 'asc' } } },
    });
    expect(
      synced.images.map((image) => ({
        url: image.url,
        alt: image.alt,
        sortOrder: image.sortOrder,
      })),
    ).toEqual([
      { url: '/mock/a.webp', alt: 'A again', sortOrder: 1 },
      { url: '/mock/c.webp', alt: 'Test post', sortOrder: 2 },
    ]);
  });

  it('deletes the post together with its images and revalidates blog pages', async () => {
    const slug = `g12-delete-${suffix}`;
    await expect(
      saveBlogPost(emptyState, formDataFor({ slug, body: '![Ring](/mock/ring.webp)' })),
    ).rejects.toThrow('NEXT_REDIRECT');

    const post = await prisma.blogPost.findUniqueOrThrow({ where: { slug } });
    createdPostIds.push(post.id);
    expect(await prisma.blogImage.count({ where: { blogPostId: post.id } })).toBe(2);

    vi.clearAllMocks();
    await expect(deleteBlogPost(post.id, new FormData())).rejects.toThrow('NEXT_REDIRECT');

    expect(await prisma.blogPost.findUnique({ where: { id: post.id } })).toBeNull();
    expect(await prisma.blogImage.count({ where: { blogPostId: post.id } })).toBe(0);
    expect(revalidatePath).toHaveBeenCalledWith('/admin/blog');
    expect(revalidatePath).toHaveBeenCalledWith('/', 'page');
    expect(revalidatePath).toHaveBeenCalledWith('/blog', 'page');
    expect(revalidatePath).toHaveBeenCalledWith('/blog/[slug]', 'page');
  });
});
