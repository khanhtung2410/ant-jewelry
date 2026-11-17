import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { getAdminSession } from '@/features/auth/session';
import { prisma } from '@/features/shared/db/prisma';
import type { ProductFormState } from '@/features/products/actions';

vi.mock('@/features/auth/session', () => ({
  getAdminSession: vi.fn(async () => ({
    userId: 'editor-1',
    email: 'editor@example.com',
    name: 'Editor',
    role: 'EDITOR',
    sessionVersion: 0,
    exp: 9_999_999_999,
  })),
}));

vi.mock('next/navigation', () => ({
  redirect: vi.fn(() => {
    throw new Error('NEXT_REDIRECT');
  }),
}));

const { saveProduct } = await import('@/features/products/actions');

const state: ProductFormState = {
  values: {
    name: '',
    slug: '',
    categoryId: '',
    brand: '',
    price: '',
    description: '',
    details: '',
    colors: [],
    published: false,
  },
  fieldErrors: {},
  message: null,
};

describe('saveProduct price guard with the real test database (R1.2b)', () => {
  const slug = `editor-price-${Date.now()}`;
  let productId: string;
  let categoryId: string;
  let originalPrice: number;

  beforeAll(async () => {
    const category = await prisma.category.findFirstOrThrow();
    categoryId = category.id;
    const product = await prisma.product.create({
      data: {
        name: 'Price guard ring',
        slug,
        categoryId,
        brand: 'ANT',
        price: 1_234_567,
        description: 'Product for the editor price guard test',
        status: 'VISIBLE',
      },
    });
    productId = product.id;
    originalPrice = product.price;
  });

  afterAll(async () => {
    await prisma.product.deleteMany({ where: { id: productId } });
  });

  function formDataFor(price: string, name: string): FormData {
    const formData = new FormData();
    formData.set('productId', productId);
    formData.set('name', name);
    formData.set('slug', slug);
    formData.set('categoryId', categoryId);
    formData.set('brand', 'ANT');
    formData.set('price', price);
    formData.set('description', 'Product for the editor price guard test');
    return formData;
  }

  it('keeps the stored price when an EDITOR submits a different price', async () => {
    await expect(saveProduct(state, formDataFor('9999999', 'Renamed by editor'))).rejects.toThrow(
      'NEXT_REDIRECT',
    );

    const persisted = await prisma.product.findUniqueOrThrow({ where: { id: productId } });
    expect(persisted.price).toBe(originalPrice);
    expect(persisted.name).toBe('Renamed by editor');
  });

  it('does not block an EDITOR save because of an invalid readonly price field', async () => {
    await expect(saveProduct(state, formDataFor('not a price', 'Renamed again'))).rejects.toThrow(
      'NEXT_REDIRECT',
    );

    const persisted = await prisma.product.findUniqueOrThrow({ where: { id: productId } });
    expect(persisted.price).toBe(originalPrice);
    expect(persisted.name).toBe('Renamed again');
  });
});
