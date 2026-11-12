import { describe, expect, it } from 'vitest';
import { categoryFormSchema } from './category-form-schema';

const validCategory = {
  name: 'Wedding Ring',
  slug: 'wedding-ring',
  type: 'WEDDING RING',
  visible: true,
};

describe('categoryFormSchema', () => {
  it('accepts a valid category', () => {
    expect(categoryFormSchema.parse(validCategory)).toEqual(validCategory);
  });

  it('rejects missing names, invalid slugs, and unknown product types', () => {
    const result = categoryFormSchema.safeParse({
      ...validCategory,
      name: '  ',
      slug: 'Wedding Ring',
      type: 'BRACELET',
    });

    expect(result.success).toBe(false);
    if (result.success) return;

    expect(result.error.issues.map((issue) => issue.path[0])).toEqual(
      expect.arrayContaining(['name', 'slug', 'type']),
    );
  });
});
