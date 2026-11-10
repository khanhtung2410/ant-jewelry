import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import type { HeroSlide } from '@/types/domain';
import { HeroSlider } from './hero-slider';

vi.mock('next/image', () => ({
  default: ({ src, alt }: { src: string; alt: string }) => (
    // eslint-disable-next-line @next/next/no-img-element -- next/image is mocked in this Node test.
    <img src={src} alt={alt} />
  ),
}));

vi.mock('next/link', () => ({
  default: ({
    href,
    children,
    'aria-label': ariaLabel,
    className,
  }: {
    href: string;
    children: string;
    'aria-label'?: string;
    className?: string;
  }) => (
    <a href={href} aria-label={ariaLabel} className={className}>
      {children}
    </a>
  ),
}));

const slides: HeroSlide[] = Array.from({ length: 3 }, (_, index) => ({
  slide_id: `slide-${index + 1}`,
  imageUrl: `/mock/hero/slide-${index + 1}.svg`,
  alt: `Featured collection ${index + 1}`,
  title: `Collection ${index + 1}`,
  subtitle: `Collection description ${index + 1}`,
  linkUrl: `/c/collection-${index + 1}`,
  sortOrder: index + 1,
  status: 'VISIBLE',
}));

describe('HeroSlider', () => {
  it('renders the first slide, three navigation dots, and an explore link', () => {
    const html = renderToStaticMarkup(<HeroSlider slides={slides} />);

    expect(html).toContain('src="/mock/hero/slide-1.svg"');
    expect(html).toContain('href="/c/collection-1"');
    expect(html).toContain('EXPLORE NOW');
    expect(html).toContain('Collection 1');
    expect(html.match(/h-\[30px\] w-\[30px\]/g)).toHaveLength(2);
    expect(html).toContain('class="h-6 w-6 rotate-180"');
    expect(html).toContain('d="M8.25 4.5l7.5 7.5-7.5 7.5"');
    expect(html).toContain('pointer-events-none absolute inset-x-0 top-1/2');
    expect(html.match(/pointer-events-auto/g)).toHaveLength(2);
    expect(html).toContain('bottom-8 left-1/2');
    expect(html).toContain('absolute bottom-4 left-1/2');
    expect(html.match(/aria-label="Go to slide \d"/g)).toHaveLength(3);
    expect(html).toContain('aria-label="Previous slide"');
    expect(html).not.toContain('aria-label="Previous slide" disabled=""');
    expect(html).toContain('aria-label="Next slide"');
    expect(html).not.toContain('aria-label="Next slide" disabled=""');
  });

  it('shows an empty state without slide controls when no slides are provided', () => {
    const html = renderToStaticMarkup(<HeroSlider slides={[]} />);

    expect(html).toContain('Chưa có bộ sưu tập nổi bật.');
    expect(html).not.toContain('Go to slide');
  });
});
