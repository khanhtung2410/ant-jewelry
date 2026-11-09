import { describe, expect, it } from 'vitest';
import {
  getBlogPostBySlug,
  getBlogPosts,
  getCategories,
  getCategoryBySlug,
  getHeroSlides,
  getProductById,
  getProductBySlug,
  getProducts,
  getRelatedProducts,
  getSettings,
} from '@/lib/queries';
import { createVndPrice } from '@/types/domain';

describe('product queries', () => {
  it('returns only visible products by default', () => {
    const products = getProducts();

    expect(products).toHaveLength(23);
    expect(products.every((product) => product.status === 'VISIBLE')).toBe(true);
  });

  it('can include hidden products for an admin screen', () => {
    expect(getProducts({ includeHidden: true })).toHaveLength(24);
  });

  it('filters by category and type', () => {
    const weddingBands = getProducts({ categoryId: 'cat-wedding-bands' });
    const earrings = getProducts({ type: 'EARRING' });

    expect(weddingBands).toHaveLength(6);
    expect(weddingBands.every((product) => product.categoryId === 'cat-wedding-bands')).toBe(true);
    expect(earrings).toHaveLength(2);
    expect(earrings.every((product) => product.type === 'EARRING')).toBe(true);
    expect(getProducts({ type: 'EARRING', includeHidden: true })).toHaveLength(3);
  });

  it('sorts by price in both directions', () => {
    const ascending = getProducts({ sort: 'price_asc' }).map((product) => product.price);
    const descending = getProducts({ sort: 'price_desc' }).map((product) => product.price);

    expect(ascending).toEqual([...ascending].sort((a, b) => a - b));
    expect(descending).toEqual([...descending].sort((a, b) => b - a));
  });

  it('sorts by name', () => {
    const names = getProducts({ sort: 'name_asc' }).map((product) => product.name);

    expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b, 'vi')));
  });

  it('finds a visible product by slug or id', () => {
    expect(getProductBySlug('aurora-band')?.product_id).toBe('prd-aurora-band');
    expect(getProductById('prd-aurora-band')?.slug).toBe('aurora-band');
  });

  it('hides hidden products from storefront lookups', () => {
    expect(getProductBySlug('dawn-stud-earrings')).toBeNull();
    expect(getProductBySlug('dawn-stud-earrings', { includeHidden: true })?.status).toBe('HIDDEN');
  });

  it('returns related products from the same category', () => {
    const related = getRelatedProducts('prd-aurora-band');

    expect(related).toHaveLength(4);
    expect(related.every((product) => product.categoryId === 'cat-wedding-bands')).toBe(true);
    expect(related.some((product) => product.product_id === 'prd-aurora-band')).toBe(false);
  });

  it('returns a clone so callers cannot mutate mock data', () => {
    const first = getProducts()[0];
    first.name = 'mutated';

    expect(getProducts()[0].name).not.toBe('mutated');
  });
});

describe('category queries', () => {
  it('returns visible categories ordered by sortOrder', () => {
    const categories = getCategories();

    expect(categories.map((category) => category.slug)).toEqual([
      'wedding-bands',
      'engagement',
      'everyday',
      'ready-to-ship',
    ]);
  });

  it('finds a category by slug', () => {
    expect(getCategoryBySlug('engagement')?.name).toBe('Engagement');
    expect(getCategoryBySlug('missing')).toBeNull();
  });
});

describe('blog queries', () => {
  it('returns published posts newest first', () => {
    const posts = getBlogPosts();

    expect(posts).toHaveLength(5);
    expect(posts.every((post) => post.status === 'PUBLISHED')).toBe(true);
    expect(posts[0].publishedAt > posts[1].publishedAt).toBe(true);
  });

  it('can include drafts and limit results', () => {
    expect(getBlogPosts({ includeDrafts: true })).toHaveLength(6);
    expect(getBlogPosts({ limit: 2 })).toHaveLength(2);
  });

  it('does not expose a draft by slug on the storefront', () => {
    expect(getBlogPostBySlug('bang-size-nhan-va-cach-do')).toBeNull();
    expect(getBlogPostBySlug('bang-size-nhan-va-cach-do', { includeDrafts: true })?.status).toBe(
      'DRAFT',
    );
  });
});

describe('hero slide queries', () => {
  it('returns visible slides ordered by sortOrder', () => {
    const slides = getHeroSlides();

    expect(slides.map((slide) => slide.slide_id)).toEqual([
      'hero-wedding-bands',
      'hero-engagement',
    ]);
  });
});

describe('settings query', () => {
  it('returns contact settings and a clone', () => {
    const settings = getSettings();
    settings.phone = 'mutated';

    expect(getSettings().phone).toBe('0900 000 000');
    expect(settings.siteName).toBe('AN JEWELRY');
  });
});

describe('VND price guard', () => {
  it('rejects negative and non-integer amounts', () => {
    expect(() => createVndPrice(-1)).toThrow(RangeError);
    expect(() => createVndPrice(1.5)).toThrow(RangeError);
  });
});
