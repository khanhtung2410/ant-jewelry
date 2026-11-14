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
  getStorefrontCategorySections,
  parseProductSort,
  sortProducts,
} from '@/features/shared/queries';
import { createVndPrice, type ProductType } from '@/features/shared/domain/domain';
import prisma from '@/features/shared/db/prisma';
import sitemap from '@/app/sitemap';

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

  it('filters by categoryId, the single link between products and categories', async () => {
    const categories = await getCategories();
    expect(categories.length).toBeGreaterThan(0);

    for (const category of categories) {
      const products = await getProducts({ categoryId: category.category_id });
      expect(products.length).toBeGreaterThan(0);
      expect(products.every((product) => product.categoryId === category.category_id)).toBe(true);
      expect(products.every((product) => product.type === category.type)).toBe(true);
    }
  });

  it('filters products by category slug using categoryId, not the type text', async () => {
    const weddingCategory = await getCategoryBySlug('wedding-ring');
    const otherCategory = await getCategoryBySlug('other-jewelry');
    const wedding = await getProductsByCategorySlug('wedding-ring');
    const other = await getProductsByCategorySlug('other-jewelry');

    expect(weddingCategory).not.toBeNull();
    expect(otherCategory).not.toBeNull();
    expect(wedding.length).toBeGreaterThan(0);
    expect(wedding.every((product) => product.categoryId === weddingCategory!.category_id)).toBe(
      true,
    );
    expect(other.length).toBeGreaterThan(0);
    expect(other.every((product) => product.categoryId === otherCategory!.category_id)).toBe(true);
    expect(await getProductsByCategorySlug('missing')).toEqual([]);
  });

  it('groups the home carousel by categoryId so every category keeps its products', async () => {
    const sections = await getStorefrontCategorySections();
    expect(sections.length).toBeGreaterThan(0);

    for (const { category, products } of sections) {
      expect(products.length).toBeGreaterThan(0);
      expect(products.every((product) => product.categoryId === category.category_id)).toBe(true);
    }
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
      categoryId: 'cat-a',
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

  it('returns related products of the same category excluding current product', async () => {
    const aurora = await getProductBySlug('aurora-band');
    expect(aurora).not.toBeNull();
    const related = await getRelatedProducts(aurora!.product_id);
    expect(related.length).toBeGreaterThan(0);
    expect(related.every((product) => product.categoryId === aurora!.categoryId)).toBe(true);
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

describe('hidden category visibility', () => {
  it('hides products of a hidden category from storefront, sitemap and static params', async () => {
    const category = await prisma.category.create({
      data: {
        name: 'Hidden Category',
        slug: 'hidden-category-test',
        type: 'OTHER JEWELRY',
        sortOrder: 99,
        status: 'HIDDEN',
      },
    });
    const product = await prisma.product.create({
      data: {
        categoryId: category.id,
        name: 'Hidden Category Product',
        slug: 'hidden-category-product',
        brand: 'ANT JEWELRY',
        description: 'Product that belongs to a hidden category.',
        price: 1_000_000,
        status: 'VISIBLE',
      },
    });

    try {
      // The product URL resolves to 404, but admin screens can still load it.
      expect(await getProductBySlug('hidden-category-product')).toBeNull();
      expect(
        await getProductBySlug('hidden-category-product', { includeHidden: true }),
      ).toMatchObject({ product_id: product.id, status: 'VISIBLE' });

      // Excluded from lists, the Home carousel and related products.
      expect((await getProducts()).some((item) => item.product_id === product.id)).toBe(false);
      expect(
        (await getStorefrontCategorySections()).some((section) =>
          section.products.some((item) => item.product_id === product.id),
        ),
      ).toBe(false);
      expect(await getRelatedProducts(product.id)).toEqual([]);

      // Excluded from /sitemap.xml and the /p/[slug] static params.
      const urls = (await sitemap()).map((entry) => entry.url);
      expect(urls.some((url) => url.endsWith('/p/hidden-category-product'))).toBe(false);
      expect((await getProducts()).some((item) => item.slug === 'hidden-category-product')).toBe(
        false,
      );
    } finally {
      await prisma.product.delete({ where: { id: product.id } });
      await prisma.category.delete({ where: { id: category.id } });
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
