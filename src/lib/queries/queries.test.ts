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
} from '@/lib/queries';
import { createVndPrice, type ProductType } from '@/types/domain';

const productTypes: ProductType[] = [
  'WEDDING RING',
  'ENGAGEMENT RING',
  'NECKLACE',
  'OTHER JEWELRY',
];

describe('product queries', () => {
  it('returns only visible products by default', () => {
    const products = getProducts();

    expect(products).toHaveLength(23);
    expect(products.every((product) => product.status === 'VISIBLE')).toBe(true);
  });

  it('can include hidden products for an admin screen', () => {
    expect(getProducts({ includeHidden: true })).toHaveLength(24);
  });

  it('filters by ProductType, which is also the category filter', () => {
    expect(getProducts({ type: 'WEDDING RING' })).toHaveLength(6);
    expect(getProducts({ type: 'ENGAGEMENT RING' })).toHaveLength(6);
    expect(getProducts({ type: 'NECKLACE' })).toHaveLength(4);
    expect(getProducts({ type: 'OTHER JEWELRY' })).toHaveLength(7);
    expect(getProducts({ type: 'OTHER JEWELRY', includeHidden: true })).toHaveLength(8);
  });

  it('filters products by category slug using the category ProductType', () => {
    const wedding = getProductsByCategorySlug('wedding-ring');
    const other = getProductsByCategorySlug('other-jewelry');

    expect(wedding).toHaveLength(6);
    expect(wedding.every((product) => product.type === 'WEDDING RING')).toBe(true);
    expect(other).toHaveLength(7);
    expect(other.every((product) => product.type === 'OTHER JEWELRY')).toBe(true);
    expect(getProductsByCategorySlug('missing')).toEqual([]);
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

  it('returns related products of the same ProductType', () => {
    const related = getRelatedProducts('prd-aurora-band');

    expect(related).toHaveLength(4);
    expect(related.every((product) => product.type === 'WEDDING RING')).toBe(true);
    expect(related.some((product) => product.product_id === 'prd-aurora-band')).toBe(false);
  });

  it('assigns the webp product photos as front images', () => {
    const photoProducts = getProducts({ includeHidden: true }).filter((product) =>
      product.images[0]?.url.endsWith('.webp'),
    );
    const aurora = getProductBySlug('aurora-band');

    expect(photoProducts).toHaveLength(10);
    expect(new Set(photoProducts.map((product) => product.images[0].url)).size).toBe(10);
    expect(aurora?.images).toEqual([
      {
        imageId: 'prd-aurora-band-front',
        url: '/mock/products/ring-6.webp',
        alt: 'Aurora Band - ảnh chính',
        isFront: true,
        sortOrder: 1,
      },
    ]);
  });

  it('keeps extra angles as ordered secondary gallery images', () => {
    for (const [slug, first, second] of [
      ['serenade-twisted-band', 'ring-5', 'ring-5-2'],
      ['etoile-pave', 'ring-2', 'ring-2-1'],
    ] as const) {
      const images = getProductBySlug(slug)?.images ?? [];

      expect(images).toHaveLength(2);
      expect(images.map((image) => image.url)).toEqual([
        `/mock/products/${first}.webp`,
        `/mock/products/${second}.webp`,
      ]);
      expect(images.map((image) => image.sortOrder)).toEqual([1, 2]);
      expect(images.map((image) => image.isFront)).toEqual([true, false]);
    }
  });

  it('keeps SVG placeholders for products without a photo', () => {
    const necklace = getProductBySlug('luna-pendant');

    expect(necklace?.images).toHaveLength(2);
    expect(necklace?.images.every((image) => image.url.endsWith('.svg'))).toBe(true);
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
      'wedding-ring',
      'engagement-ring',
      'necklace',
      'other-jewelry',
    ]);
    expect(categories.map((category) => category.type)).toEqual(productTypes);
  });

  it('has exactly one category per ProductType', () => {
    for (const type of productTypes) {
      expect(getCategoryByType(type)?.type).toBe(type);
    }
  });

  it('finds a category by slug', () => {
    expect(getCategoryBySlug('engagement-ring')?.name).toBe('Engagement Ring');
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
    expect(getBlogPosts({ limit: 2 }).map((post) => post.blog_id)).toEqual([
      'blog-choosing-wedding-band',
      'blog-diamond-cut-guide',
    ]);
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
      'hero-wedding-ring',
      'hero-engagement-ring',
      'hero-other-jewelry',
    ]);
    expect(slides.map((slide) => slide.linkUrl)).toEqual([
      '/c/wedding-ring',
      '/c/engagement-ring',
      '/c/other-jewelry',
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
