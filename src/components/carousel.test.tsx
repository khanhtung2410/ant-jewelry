import type { ReactNode } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import type { Product } from '@/types/domain';
import { createVndPrice } from '@/types/domain';
import { Carousel, getCarouselPage } from './carousel';

vi.mock('next/image', () => ({
  default: ({
    src,
    alt,
    className,
    'aria-hidden': ariaHidden,
  }: {
    src: string;
    alt: string;
    className?: string;
    'aria-hidden'?: boolean | 'true' | 'false';
  }) => (
    // eslint-disable-next-line @next/next/no-img-element -- next/image is mocked in this Node test.
    <img src={src} alt={alt} className={className} aria-hidden={ariaHidden} />
  ),
}));

vi.mock('next/link', () => ({
  default: ({
    href,
    children,
    className,
  }: {
    href: string;
    children: ReactNode;
    className?: string;
  }) => (
    <a href={href} className={className}>
      {children}
    </a>
  ),
}));

function makeProduct(index: number): Product {
  return {
    product_id: `prd-${index}`,
    name: `Product ${index}`,
    slug: `product-${index}`,
    brand: 'Ant Jewelry',
    type: 'WEDDING RING',
    description: '',
    details: {},
    colors: [],
    images: [
      {
        imageId: `prd-${index}-front`,
        url: `/mock/products/ring-${index}.webp`,
        alt: `Product ${index} - ảnh chính`,
        isFront: true,
        sortOrder: 1,
      },
    ],
    price: createVndPrice(10000000 + index),
    status: 'VISIBLE',
  };
}

function makeProducts(count: number): Product[] {
  return Array.from({ length: count }, (_, index) => makeProduct(index + 1));
}

function countCards(html: string): number {
  return html.match(/<article/g)?.length ?? 0;
}

function countDisabledButtons(html: string): number {
  return html.match(/<button[^>]*\sdisabled=""/g)?.length ?? 0;
}

describe('getCarouselPage', () => {
  it('shows five products per page', () => {
    const view = getCarouselPage(makeProducts(7), 0);

    expect(view.items).toHaveLength(5);
    expect(view.hasPrevious).toBe(false);
    expect(view.hasNext).toBe(true);
  });

  it('puts the remainder on the last page', () => {
    const view = getCarouselPage(makeProducts(7), 1);

    expect(view.items).toHaveLength(2);
    expect(view.hasPrevious).toBe(true);
    expect(view.hasNext).toBe(false);
  });

  it('clamps out-of-range pages to the last page', () => {
    const view = getCarouselPage(makeProducts(3), 9);

    expect(view.page).toBe(0);
    expect(view.items).toHaveLength(3);
    expect(view.hasPrevious).toBe(false);
    expect(view.hasNext).toBe(false);
  });
});

describe('Carousel', () => {
  it('renders all products and disables both arrows when fewer than five are provided', () => {
    const html = renderToStaticMarkup(
      <Carousel title="Wedding Ring" products={makeProducts(3)} viewAllHref="/c/wedding-ring" />,
    );

    expect(countCards(html)).toBe(3);
    expect(countDisabledButtons(html)).toBe(2);
    expect(html).toContain('VIEW PRODUCTS');
    expect(html).toContain('href="/c/wedding-ring"');
  });

  it('shows five cards and enables the next arrow when more than five are provided', () => {
    const html = renderToStaticMarkup(
      <Carousel title="Wedding Ring" products={makeProducts(7)} viewAllHref="/c/wedding-ring" />,
    );

    expect(countCards(html)).toBe(5);
    expect(countDisabledButtons(html)).toBe(1);
  });

  it('renders the empty state without arrows enabled', () => {
    const html = renderToStaticMarkup(
      <Carousel title="Wedding Ring" products={[]} viewAllHref="/c/wedding-ring" />,
    );

    expect(countCards(html)).toBe(0);
    expect(html).toContain('Chưa có sản phẩm.');
    expect(countDisabledButtons(html)).toBe(2);
  });
});
