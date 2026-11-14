import type { ReactNode } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import type { Product, ProductColor, ProductImage } from '@/features/shared/domain/domain';
import { createVndPrice } from '@/features/shared/domain/domain';
import { ProductCard } from './product-card';

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

const frontImage: ProductImage = {
  imageId: 'prd-aurora-band-front',
  url: '/mock/products/ring-6.webp',
  alt: 'Aurora Band - ảnh chính',
  isFront: true,
  sortOrder: 1,
};

const secondImage: ProductImage = {
  imageId: 'prd-aurora-band-detail',
  url: '/mock/products/ring-6-2.webp',
  alt: 'Aurora Band - ảnh chi tiết',
  isFront: false,
  sortOrder: 2,
};

const gold: ProductColor = {
  colorId: 'color-gold-18k',
  name: 'Vàng 18K',
  hex: 'gold',
};

const silver: ProductColor = {
  colorId: 'color-silver-925',
  name: 'Bạc 925',
  hex: 'silver',
};

function makeProduct(overrides: Partial<Product> = {}): Product {
  return {
    product_id: 'prd-aurora-band',
    categoryId: 'cat-wedding-ring',
    name: 'Aurora Band',
    slug: 'aurora-band',
    brand: 'Ant Jewelry',
    type: 'WEDDING RING',
    description: 'Nhẫn cưới tròn cổ điển.',
    details: {},
    colors: [gold],
    images: [frontImage],
    price: createVndPrice(10000000),
    status: 'VISIBLE',
    ...overrides,
  };
}

function countImages(html: string): number {
  return html.match(/<img/g)?.length ?? 0;
}

describe('ProductCard', () => {
  it('renders the product name and formatted price', () => {
    const html = renderToStaticMarkup(<ProductCard product={makeProduct()} />);

    expect(html).toContain('Aurora Band');
    expect(html).toContain('10.000.000');
  });

  it('renders a single image when the product has one photo', () => {
    const html = renderToStaticMarkup(
      <ProductCard product={makeProduct({ images: [frontImage] })} />,
    );

    expect(countImages(html)).toBe(1);
  });

  it('renders a second, hover-only image when the gallery has another photo', () => {
    const html = renderToStaticMarkup(
      <ProductCard product={makeProduct({ images: [frontImage, secondImage] })} />,
    );

    expect(countImages(html)).toBe(2);
    expect(html).toContain('/mock/products/ring-6-2.webp');
    expect(html).toContain('group-hover:opacity-100');
  });

  it('uses the explicitly selected hover image instead of the next gallery image', () => {
    const hoverImage = { ...secondImage, url: '/uploads/selected-hover.webp', isHover: true };
    const extraImage = { ...secondImage, imageId: 'prd-aurora-band-extra', sortOrder: 3 };
    const html = renderToStaticMarkup(
      <ProductCard product={makeProduct({ images: [frontImage, extraImage, hoverImage] })} />,
    );

    expect(html).toContain('/uploads/selected-hover.webp');
    expect(html).not.toContain('/mock/products/ring-6-2.webp');
  });

  it('does not render the swatch list when the product has no colors', () => {
    const html = renderToStaticMarkup(<ProductCard product={makeProduct({ colors: [] })} />);

    expect(html).not.toContain('Màu sắc của');
  });

  it('labels every swatch with its color name', () => {
    const html = renderToStaticMarkup(
      <ProductCard product={makeProduct({ colors: [gold, silver] })} />,
    );

    expect(html).toContain('aria-label="Vàng 18K"');
    expect(html).toContain('aria-label="Bạc 925"');
  });
});
