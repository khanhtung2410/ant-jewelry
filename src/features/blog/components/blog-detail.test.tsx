import { readFileSync } from 'node:fs';
import path from 'node:path';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import type { BlogPost } from '@/features/shared/domain/domain';
import { BLOG_COVER_HEIGHT, BLOG_COVER_WIDTH, BlogDetail } from './blog-detail';

vi.mock('next/image', () => ({
  default: ({ src, alt }: { src: string; alt: string }) => (
    // eslint-disable-next-line @next/next/no-img-element -- next/image is mocked in this Node test.
    <img src={src} alt={alt} />
  ),
}));

vi.mock('next/link', () => ({
  default: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}));

function makePost(id: string, title: string): BlogPost {
  return {
    blog_id: id,
    title,
    slug: id,
    summary: `${title} summary`,
    body: 'Nội dung bài viết.',
    coverImageUrl: `/mock/blog/${id}.webp`,
    images: [],
    publishedAt: '2026-11-01T00:00:00.000Z',
    status: 'PUBLISHED',
  };
}

describe('BlogDetail', () => {
  it('renders exactly one h1: the post title', () => {
    const html = renderToStaticMarkup(
      <BlogDetail post={makePost('bai-chinh', 'Bài chính')} otherPosts={[]} />,
    );

    expect(html.match(/<h1/g)).toHaveLength(1);
    expect(html).toContain('Bài chính');
  });

  it('renders a fixed cover box with explicit image dimensions', () => {
    const html = renderToStaticMarkup(
      <BlogDetail post={makePost('bai-chinh', 'Bài chính')} otherPosts={[]} />,
    );

    expect(html).toContain('aspect-[1200/630]');
    expect(html).toMatch(/<img[^>]+width="1200"[^>]+height="630"/);
    expect(html).toMatch(/<img[^>]+class="absolute inset-0 h-full w-full object-cover"/);
  });

  it('keeps the declared cover ratio in step with the seeded cover asset', () => {
    const svg = readFileSync(
      path.join(process.cwd(), 'public/mock/blog/cover-wedding-band.svg'),
      'utf8',
    );

    expect(svg).toContain(`viewBox="0 0 ${BLOG_COVER_WIDTH} ${BLOG_COVER_HEIGHT}"`);
  });

  it('shows only one related post in OTHER BLOGS', () => {
    const html = renderToStaticMarkup(
      <BlogDetail
        post={makePost('bai-chinh', 'Bài chính')}
        otherPosts={[
          makePost('bai-phu-1', 'Bài phụ một'),
          makePost('bai-phu-2', 'Bài phụ hai'),
          makePost('bai-phu-3', 'Bài phụ ba'),
        ]}
      />,
    );

    expect(html).toContain('OTHER BLOGS');
    expect(html).toContain('Bài phụ một');
    expect(html).not.toContain('Bài phụ hai');
    expect(html).not.toContain('Bài phụ ba');
    expect(html.match(/LEARN MORE/g)).toHaveLength(1);
    expect(html.match(/<h2/g)).toHaveLength(1);
    expect(html).toContain('aria-labelledby="other-blogs-heading"');
  });
});
