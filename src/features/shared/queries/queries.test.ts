import { describe, expect, it } from 'vitest';
import {
  getBlogPostBySlug,
  getBlogPosts,
  getCategories,
  getCategoryBySlug,
  getCategoryByType,
  getHeroSlides,
  getProductById,
  getProductBySlug,
  getProducts,
  getProductsByCategorySlug,
  getRelatedProducts,
  getSettings,
  parseProductSort,
  sortProducts,
} from '@/features/shared/queries';
import { createVndPrice, type ProductType } from '@/features/shared/domain/domain';

const productTypes: ProductType[] = [
  'WEDDING RING',
  'ENGAGEMENT RING',
  'NECKLACE',
  'OTHER JEWELRY',
];

describe('product queries', () => {
  it('returns only visible products by default', async () => {
    const products = await getProducts();
    const allProducts = await getProducts({ includeHidden: true });

    expect(products.length).toBeGreaterThanOrEqual(20);
    expect(allProducts.length).toBeGreaterThan(products.length);
    expect(products.every((product) => product.status === 'VISIBLE')).toBe(true);
  });

  it('can include hidden products for an admin screen', async () => {
    const hidden = (await getProducts({ includeHidden: true })).filter(
      (product) => product.status === 'HIDDEN',
    );
    expect(hidden.length).toBeGreaterThan(0);
  });

  it('filters by ProductType, which is also the category filter', async () => {
    for (const type of productTypes) {
      const products = await getProducts({ type });
      expect(products.length).toBeGreaterThan(0);
      expect(products.every((product) => product.type === type)).toBe(true);
    }
  });

  it('filters products by category slug using the category ProductType', async () => {
    const wedding = await getProductsByCategorySlug('wedding-ring');
    const other = await getProductsByCategorySlug('other-jewelry');

    expect(wedding.length).toBeGreaterThan(0);
    expect(wedding.every((product) => product.type === 'WEDDING RING')).toBe(true);
    expect(other.length).toBeGreaterThan(0);
    expect(other.every((product) => product.type === 'OTHER JEWELRY')).toBe(true);
    expect(await getProductsByCategorySlug('missing')).toEqual([]);
  });

  it('sorts by price in both directions', async () => {
    const ascending = (await getProducts({ sort: 'price_asc' })).map((product) => product.price);
    const descending = (await getProducts({ sort: 'price_desc' })).map((product) => product.price);

    expect(ascending).toEqual([...ascending].sort((a, b) => a - b));
    expect(descending).toEqual([...descending].sort((a, b) => b - a));
  });

  it('sorts by name', async () => {
    const names = (await getProducts({ sort: 'name_asc' })).map((product) => product.name);

    expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b, 'vi')));
  });

  it('sorts names descending without mutating the input list', async () => {
    const products = await getProducts();
    const originalIds = products.map((product) => product.product_id);
    const sorted = sortProducts(products, 'name_desc');

    expect(sorted.map((product) => product.name)).toEqual(
      [...products.map((product) => product.name)].sort((a, b) => b.localeCompare(a, 'vi')),
    );
    expect(products.map((product) => product.product_id)).toEqual(originalIds);
  });

  it('falls back to ascending price for missing or invalid sort values', () => {
    expect(parseProductSort(undefined)).toBe('price_asc');
    expect(parseProductSort('unknown')).toBe('price_asc');
    expect(parseProductSort(['price_desc', 'name_asc'])).toBe('price_asc');
    expect(parseProductSort('name_desc')).toBe('name_desc');
  });

  it('uses product id as a stable price tie-breaker without dropping tied products', () => {
    const first = {
      product_id: 'a',
      name: 'A',
      slug: 'a',
      brand: 'B',
      type: 'WEDDING RING' as const,
      description: '',
      details: {},
      colors: [],
      images: [],
      price: createVndPrice(1000),
      status: 'VISIBLE' as const,
    };
    const second = { ...first, product_id: 'b', name: 'B', slug: 'b' };
    const sorted = sortProducts([second, first], 'price_asc');
    expect(sorted.map((product) => product.product_id)).toEqual(['a', 'b']);
  });

  it('finds a visible product by slug or id', async () => {
    const product = await getProductBySlug('aurora-band');
    expect(product).not.toBeNull();
    expect(await getProductById(product!.product_id)).toMatchObject({ slug: 'aurora-band' });
  });

  it('hides hidden products from storefront lookups', async () => {
    const hidden = (await getProducts({ includeHidden: true })).find(
      (product) => product.status === 'HIDDEN',
    );
    expect(hidden).toBeDefined();
    expect(await getProductBySlug(hidden!.slug)).toBeNull();
    expect(await getProductBySlug(hidden!.slug, { includeHidden: true })).toMatchObject({
      status: 'HIDDEN',
    });
  });

  it('returns related products of the same ProductType excluding current product', async () => {
    const aurora = await getProductBySlug('aurora-band');
    expect(aurora).not.toBeNull();
    const related = await getRelatedProducts(aurora!.product_id);
    expect(related.length).toBeGreaterThan(0);
    expect(related.every((product) => product.type === aurora!.type)).toBe(true);
    expect(related.some((product) => product.product_id === aurora!.product_id)).toBe(false);
    expect(related.every((product) => product.status === 'VISIBLE')).toBe(true);
  });

  it('returns product card data with required fields for storefront cards', async () => {
    const wedding = await getProductsByCategorySlug('wedding-ring', { sort: 'price_asc' });
    expect(wedding.length).toBeGreaterThan(0);
    for (const product of wedding) {
      expect(typeof product.product_id).toBe('string');
      expect(typeof product.name).toBe('string');
      expect(typeof product.slug).toBe('string');
      expect(typeof product.price).toBe('number');
      expect(Array.isArray(product.images)).toBe(true);
      expect(Array.isArray(product.colors)).toBe(true);
    }
  });
});

describe('category queries', () => {
  it('returns visible categories ordered by sortOrder', async () => {
    const categories = await getCategories();

    expect(categories.map((category) => category.slug)).toEqual([
      'wedding-ring',
      'engagement-ring',
      'necklace',
      'other-jewelry',
    ]);
    expect(categories.map((category) => category.type)).toEqual(productTypes);
  });

  it('has exactly one category per ProductType', async () => {
    for (const type of productTypes) {
      expect((await getCategoryByType(type))?.type).toBe(type);
    }
  });

  it('finds a category by slug', async () => {
    expect((await getCategoryBySlug('engagement-ring'))?.name).toBe('Engagement Ring');
    expect(await getCategoryBySlug('missing')).toBeNull();
  });
});

describe('blog queries', () => {
  it('returns published posts newest first', async () => {
    const posts = await getBlogPosts();

    expect(posts).toHaveLength(5);
    expect(posts.every((post) => post.status === 'PUBLISHED')).toBe(true);
    expect(posts[0].publishedAt >= posts[1].publishedAt).toBe(true);
  });

  it('can include drafts and limit results', async () => {
    expect(await getBlogPosts({ includeDrafts: true })).toHaveLength(6);
    expect((await getBlogPosts({ limit: 2 })).length).toBe(2);
  });

  it('does not expose a draft by slug on the storefront', async () => {
    expect(await getBlogPostBySlug('bang-size-nhan-va-cach-do')).toBeNull();
    expect(
      await getBlogPostBySlug('bang-size-nhan-va-cach-do', { includeDrafts: true }),
    ).toMatchObject({
      status: 'DRAFT',
    });
  });
});

describe('hero slide queries', () => {
  it('returns visible slides ordered by sortOrder', async () => {
    const slides = await getHeroSlides();

    expect(slides.map((slide) => slide.linkUrl)).toEqual([
      '/c/wedding-ring',
      '/c/engagement-ring',
      '/c/other-jewelry',
    ]);
    expect(slides.every((slide) => slide.status === 'VISIBLE')).toBe(true);
  });
});

describe('settings query', () => {
  it('returns contact settings', async () => {
    const settings = await getSettings();
    expect(settings.siteName).toBe('ANT JEWELRY');
    expect(settings.phone).toBeTruthy();
  });
});

describe('VND price guard', () => {
  it('rejects negative and non-integer amounts', () => {
    expect(() => createVndPrice(-1)).toThrow(RangeError);
    expect(() => createVndPrice(1.5)).toThrow(RangeError);
  });
});
