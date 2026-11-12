import { describe, expect, it } from 'vitest';
import { parseProductDetails, productFormSchema } from './product-form-schema';

const validProduct = {
  name: 'Aurora Ring',
  slug: 'aurora-ring',
  categoryId: 'category-id',
  type: 'WEDDING RING',
  brand: 'ANT JEWELRY',
  price: '10.000.000',
  description: 'A gold ring.',
  details: 'Chất liệu: Vàng 18K\nLoại đá: Kim cương',
  colors: [{ id: '', name: 'Gold', hex: '#D4AF37' }],
  published: true,
};

describe('productFormSchema', () => {
  it('normalizes grouped VND prices before validating', () => {
    expect(productFormSchema.parse(validProduct).price).toBe(10_000_000);
  });

  it('rejects invalid prices, slugs, and color hex values at their fields', () => {
    const result = productFormSchema.safeParse({
      ...validProduct,
      price: '10.00.000',
      slug: 'Aurora Ring',
      colors: [{ id: '', name: 'Gold', hex: '#D4AF3' }],
    });

    expect(result.success).toBe(false);
    if (result.success) return;

    expect(result.error.issues.map((issue) => issue.path[0])).toEqual(
      expect.arrayContaining(['price', 'slug', 'colors']),
    );
  });

  it('rejects zero, decimal, and negative prices', () => {
    for (const price of ['0', '1000.5', '-1000']) {
      expect(productFormSchema.safeParse({ ...validProduct, price }).success).toBe(false);
    }
  });

  it('validates detail lines and parses them into key/value pairs', () => {
    expect(
      productFormSchema.safeParse({ ...validProduct, details: 'Incomplete detail' }).success,
    ).toBe(false);
    expect(parseProductDetails(validProduct.details)).toEqual({
      'Chất liệu': 'Vàng 18K',
      'Loại đá': 'Kim cương',
    });
  });
});
