import type { ReactNode } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import type { BlogPost } from '@/features/shared/domain/domain';
import { BlogRow } from './blog-row';

vi.mock('next/image', () => ({
  default: ({ src, alt, unoptimized }: { src: string; alt: string; unoptimized?: boolean }) => (
    // eslint-disable-next-line @next/next/no-img-element -- next/image is mocked in this Node test.
    <img src={src} alt={alt} data-unoptimized={String(Boolean(unoptimized))} />
  ),
}));

vi.mock('next/link', () => ({
  default: ({ href, children }: { href: string; children: ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}));

const post: BlogPost = {
  blog_id: 'post-1',
  title: 'Cách chọn nhẫn cưới',
  slug: 'cach-chon-nhan-cuoi',
  summary: 'Một vài lưu ý khi chọn nhẫn cưới.',
  body: '',
  coverImageUrl: '/mock/blog/cover.svg',
  images: [],
  publishedAt: '2026-01-01',
  status: 'PUBLISHED',
};

describe('BlogRow', () => {
  it('renders local covers through the image optimizer', () => {
    const html = renderToStaticMarkup(<BlogRow post={post} />);

    expect(html).toContain('src="/mock/blog/cover.svg"');
    expect(html).toContain('data-unoptimized="false"');
  });

  it('skips the optimizer for admin-entered absolute cover URLs', () => {
    const html = renderToStaticMarkup(
      <BlogRow post={{ ...post, coverImageUrl: 'https://cdn.example.com/cover.jpg' }} />,
    );

    expect(html).toContain('src="https://cdn.example.com/cover.jpg"');
    expect(html).toContain('data-unoptimized="true"');
  });
});
