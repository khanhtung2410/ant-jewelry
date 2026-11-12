import { describe, expect, it } from 'vitest';
import { blogPostFormSchema } from './blog-form-schema';

const validPost = {
  title: 'Cách chọn nhẫn cưới',
  slug: 'cach-chon-nhan-cuoi',
  summary: 'Hướng dẫn chọn nhẫn cưới phù hợp.',
  body: '## Phom tay\n\nNội dung bài viết.',
  coverImageUrl: '/mock/blog/cover.svg',
  publishedAt: '2026-10-28',
  status: 'PUBLISHED',
};

describe('blogPostFormSchema', () => {
  it('accepts a valid post with a site image path', () => {
    expect(blogPostFormSchema.parse(validPost)).toEqual(validPost);
  });

  it('rejects invalid dates, statuses, and unsafe image URLs', () => {
    const result = blogPostFormSchema.safeParse({
      ...validPost,
      publishedAt: '2026-02-31',
      status: 'ARCHIVED',
      coverImageUrl: 'javascript:alert(1)',
    });

    expect(result.success).toBe(false);
    if (result.success) return;

    expect(result.error.issues.map((issue) => issue.path[0])).toEqual(
      expect.arrayContaining(['publishedAt', 'status', 'coverImageUrl']),
    );
  });

  it('accepts http(s) image URLs', () => {
    expect(
      blogPostFormSchema.safeParse({
        ...validPost,
        coverImageUrl: 'https://example.com/cover.jpg',
      }).success,
    ).toBe(true);
  });
});
