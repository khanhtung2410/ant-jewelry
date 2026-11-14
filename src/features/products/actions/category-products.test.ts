import { describe, expect, it } from 'vitest';
import { loadMoreCategoryProducts } from './category-products';

describe('loadMoreCategoryProducts', () => {
  it('returns the next server page for a category', async () => {
    const first = await loadMoreCategoryProducts({
      categorySlug: 'other-jewelry',
      sort: 'price_asc',
      offset: 0,
      limit: 5,
    });
    const second = await loadMoreCategoryProducts({
      categorySlug: 'other-jewelry',
      sort: 'price_asc',
      offset: first.products.length,
      limit: 5,
    });
    const firstIds = new Set(first.products.map((product) => product.product_id));

    expect(first.products).toHaveLength(5);
    expect(first.hasMore).toBe(true);
    expect(second.products.length).toBeGreaterThan(0);
    expect(second.products.every((product) => !firstIds.has(product.product_id))).toBe(true);
    expect(second.hasMore).toBe(false);
  });

  it('rejects an invalid sort value before querying', async () => {
    const page = await loadMoreCategoryProducts({
      categorySlug: 'other-jewelry',
      // @ts-expect-error -- invalid input coming from the browser.
      sort: 'price_unknown',
      offset: 0,
      limit: 5,
    });

    expect(page).toEqual({ products: [], hasMore: false });
  });

  it('returns an empty page for an unknown category', async () => {
    const page = await loadMoreCategoryProducts({
      categorySlug: 'missing-category',
      sort: 'price_asc',
      offset: 0,
      limit: 5,
    });

    expect(page).toEqual({ products: [], hasMore: false });
  });
});
