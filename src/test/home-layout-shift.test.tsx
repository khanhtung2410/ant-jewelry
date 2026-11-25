import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/features/shared/queries', () => ({
  getStorefrontCategorySections: vi.fn(async () => [
    {
      category: {
        category_id: 'cat-1',
        type: 'RING',
        name: 'Wedding ring',
        slug: 'wedding-ring',
        sortOrder: 1,
        status: 'ACTIVE',
      },
      products: [],
    },
    {
      category: {
        category_id: 'cat-2',
        type: 'RING',
        name: 'Engagement ring',
        slug: 'engagement-ring',
        sortOrder: 2,
        status: 'ACTIVE',
      },
      products: [],
    },
  ]),
  getBlogPosts: vi.fn(async () => [
    {
      blog_id: 'post-1',
      title: 'Bai viet 1',
      slug: 'bai-viet-1',
      summary: 'Tom tat',
      body: 'Noi dung',
      coverImageUrl: '/images/blog-cover.svg',
      images: [],
      publishedAt: '2026-01-01T00:00:00.000Z',
      status: 'PUBLISHED',
    },
  ]),
  getHeroSlides: vi.fn(async () => []),
}));

import Home from '@/app/(public)/page';

describe('Home layout stability', () => {
  it('does not defer below-the-fold sections with content-visibility', async () => {
    const markup = renderToStaticMarkup(await Home());

    expect(markup).toContain('Wedding ring');
    expect(markup).not.toContain('content-visibility');
    expect(markup).not.toContain('contain-intrinsic-size');
  });
});
