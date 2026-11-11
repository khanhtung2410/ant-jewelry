import { describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { getNextVisibleProductCount, CategoryProductListing } from './category-product-listing';
import { getProducts } from '@/lib/queries';

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

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

describe('CategoryProductListing', () => {
  it('renders the first ten products in a grid and offers another batch', async () => {
    const products = await getProducts({ sort: 'price_asc' });
    const html = renderToStaticMarkup(
      <CategoryProductListing
        categoryName="Wedding Ring"
        categorySlug="wedding-ring"
        products={products}
        sort="price_asc"
      />,
    );

    expect(html).toContain('<h1 id="category-title"');
    expect(html).toContain('aria-label="Sort by"');
    expect(html.match(/<option/g)).toHaveLength(4);
    expect(html).toContain('value="price_asc" selected=""');
    expect(html).toContain('grid grid-cols-2 gap-x-4 gap-y-8 lg:grid-cols-5');
    expect(html.match(/<article/g)).toHaveLength(10);
    expect(html).toContain('>SEE MORE</button>');
    expect(html).not.toContain(`href="/p/${products[10].slug}"`);
  });

  it('hides SEE MORE when all products fit in the initial batch', async () => {
    const products = await getProducts({ type: 'NECKLACE' });
    const html = renderToStaticMarkup(
      <CategoryProductListing
        categoryName="Necklace"
        categorySlug="necklace"
        products={products}
        sort="price_asc"
      />,
    );

    expect(html.match(/<article/g)).toHaveLength(products.length);
    expect(html).not.toContain('SEE MORE');
  });

  it('adds ten products at a time and clamps the final partial batch', () => {
    expect(getNextVisibleProductCount(10, 25)).toBe(20);
    expect(getNextVisibleProductCount(20, 25)).toBe(25);
    expect(getNextVisibleProductCount(25, 25)).toBe(25);
  });
});
