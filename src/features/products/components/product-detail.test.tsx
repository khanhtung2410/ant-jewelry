import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import type { Product, ProductColor, ProductImage } from '@/features/shared/domain/domain';
import { createVndPrice } from '@/features/shared/domain/domain';
import { ProductDetail } from './product-detail';

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

function image(id: string, url: string, isFront = false): ProductImage {
  return {
    imageId: id,
    url,
    alt: `Aurora Band - ${id}`,
    isFront,
    sortOrder: 1,
  };
}

const gold: ProductColor = {
  colorId: 'color-gold-18k',
  name: 'Vàng 18K',
  hex: '#D4AF37',
  images: [
    image('gold-front', '/mock/products/aurora-band-gold-1.svg', true),
    image('gold-detail', '/mock/products/aurora-band-gold-2.svg'),
    image('gold-detail-2', '/mock/products/aurora-band-gold-3.svg'),
    image('gold-detail-3', '/mock/products/aurora-band-gold-4.svg'),
  ],
};

const whiteGold: ProductColor = {
  colorId: 'color-white-gold-18k',
  name: 'Vàng trắng 18K',
  hex: '#E5E4E2',
};

function makeProduct(): Product {
  return {
    product_id: 'prd-aurora-band',
    categoryId: 'cat-wedding-ring',
    name: 'Aurora Band',
    slug: 'aurora-band',
    brand: 'Ant Jewelry',
    type: 'WEDDING RING',
    description: 'Nhẫn cưới tròn cổ điển với bề mặt đánh bóng.',
    details: { 'Chất liệu': 'Vàng 18K', 'Bản nhẫn': '2.0 mm' },
    colors: [gold, whiteGold],
    images: [image('prd-aurora-band-front', '/mock/products/ring-6.webp', true)],
    price: createVndPrice(12500000),
    status: 'VISIBLE',
  };
}

const settings = {
  siteName: 'ANT JEWELRY',
  phone: '0900 000 000',
  facebookUrl: 'https://www.facebook.com/example.antjewelry',
  instagramUrl: 'https://www.instagram.com/example.antjewelry',
};

describe('ProductDetail', () => {
  it('renders the uppercase name, brand, category type, and price without a currency symbol', () => {
    const html = renderToStaticMarkup(
      <ProductDetail product={makeProduct()} categoryName="Wedding Ring" settings={settings} />,
    );

    expect(html).toContain('class="font-heading text-2xl uppercase');
    expect(html).toContain('Aurora Band');
    expect(html).toContain('Brand:');
    expect(html).toContain('Ant Jewelry');
    expect(html).toContain('Type:');
    expect(html).toContain('Wedding Ring');
    expect(html).toContain('12.500.000');
    expect(html).not.toContain('₫');
  });

  it('renders the description, details, and ORDER NOW trigger', () => {
    const html = renderToStaticMarkup(
      <ProductDetail product={makeProduct()} categoryName="Wedding Ring" settings={settings} />,
    );

    expect(html).toContain('Nhẫn cưới tròn cổ điển');
    expect(html).toContain('Details');
    expect(html).toContain('Chất liệu');
    expect(html).toContain('2.0 mm');
    expect(html).toContain('ORDER NOW');
    expect(html).toContain('aria-haspopup="dialog"');
    expect(html).toContain('aria-expanded="false"');
    expect(html).not.toContain('role="dialog"');
  });

  it('renders every colour as a labelled swatch and starts with the first colour gallery', () => {
    const html = renderToStaticMarkup(
      <ProductDetail product={makeProduct()} categoryName="Wedding Ring" settings={settings} />,
    );

    expect(html).toContain('aria-label="Vàng 18K"');
    expect(html).toContain('aria-label="Vàng trắng 18K"');
    expect(html).toContain('aria-pressed="true"');
    expect(html).toContain('aria-pressed="false"');
    expect(html).toContain('/mock/products/aurora-band-gold-1.svg');
    expect(html.match(/aria-label="View Aurora Band/g)).toHaveLength(3);
  });
});
