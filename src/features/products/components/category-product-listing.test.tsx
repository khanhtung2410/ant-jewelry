import { describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { CategoryProductListing } from './category-product-listing';
import { getProducts, getProductsByCategorySlug } from '@/features/shared/queries';

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

vi.mock('@/features/products/actions/category-products', () => ({
  loadMoreCategoryProducts: vi.fn(),
}));

describe('CategoryProductListing', () => {
  it('renders the first server batch and offers another batch', async () => {
    const products = (await getProducts({ sort: 'price_asc' })).slice(0, 10);
    const html = renderToStaticMarkup(
      <CategoryProductListing
        categoryName="Wedding Ring"
        categorySlug="wedding-ring"
        products={products}
        hasMore
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
  });

  it('hides SEE MORE when the server reports no more products', async () => {
    const page = await getProductsByCategorySlug('necklace');
    const html = renderToStaticMarkup(
      <CategoryProductListing
        categoryName="Necklace"
        categorySlug="necklace"
        products={page.products}
        hasMore={page.hasMore}
        sort="price_asc"
      />,
    );

    expect(html.match(/<article/g)).toHaveLength(page.products.length);
    expect(html).not.toContain('SEE MORE');
  });

  it('renders an empty state when the category has no products', () => {
    const html = renderToStaticMarkup(
      <CategoryProductListing
        categoryName="Empty"
        categorySlug="empty"
        products={[]}
        hasMore={false}
        sort="price_asc"
      />,
    );

    expect(html).toContain('No products in this category yet.');
    expect(html).not.toContain('SEE MORE');
  });
});
