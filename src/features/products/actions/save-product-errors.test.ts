import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { prisma } from '@/features/shared/db/prisma';
import type { ProductFormState } from '@/features/products/actions';

vi.mock('@/features/auth/session', () => ({
  getAdminSession: vi.fn(async () => ({
    userId: 'admin-1',
    email: 'admin@antjewelry.local',
    name: 'Admin',
    role: 'ADMIN',
    sessionVersion: 0,
    exp: 9_999_999_999,
  })),
}));

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
  updateTag: vi.fn(),
  cacheTag: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  redirect: vi.fn(() => {
    throw new Error('NEXT_REDIRECT');
  }),
}));

const { saveProduct } = await import('@/features/products/actions');

const initialState: ProductFormState = {
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

const suffix = `${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`;

describe('saveProduct error and status branches with the real database (G8)', () => {
  let categoryId: string;
  let duplicateProductId: string;
  let targetId: string;
  let targetSlug: string;
  let otherColorId: string;
  const createdProductIds: string[] = [];

  beforeAll(async () => {
    const category = await prisma.category.findFirstOrThrow();
    categoryId = category.id;

    const duplicate = await prisma.product.create({
      data: {
        name: 'Duplicate slug product',
        slug: `g8-duplicate-${suffix}`,
        categoryId,
        brand: 'ANT',
        price: 1_000_000,
        description: 'Seeded for the duplicate slug test',
      },
      select: { id: true },
    });
    duplicateProductId = duplicate.id;
    createdProductIds.push(duplicate.id);

    targetSlug = `g8-target-${suffix}`;
    const target = await prisma.product.create({
      data: {
        name: 'Original name',
        slug: targetSlug,
        categoryId,
        brand: 'ANT',
        price: 2_000_000,
        description: 'Seeded for the hidden status test',
        status: 'VISIBLE',
      },
      select: { id: true },
    });
    targetId = target.id;
    createdProductIds.push(target.id);

    const other = await prisma.product.create({
      data: {
        name: 'Other product',
        slug: `g8-other-${suffix}`,
        categoryId,
        brand: 'ANT',
        price: 3_000_000,
        description: 'Seeded for the foreign color test',
      },
      select: { id: true },
    });
    createdProductIds.push(other.id);

    const otherColor = await prisma.productColor.create({
      data: { productId: other.id, name: 'Other red', hex: '#ff0000' },
      select: { id: true },
    });
    otherColorId = otherColor.id;
  });

  beforeEach(async () => {
    await prisma.product.update({
      where: { id: targetId },
      data: { name: 'Original name', status: 'VISIBLE' },
    });
  });

  afterAll(async () => {
    await prisma.product.deleteMany({ where: { id: { in: createdProductIds } } });
  });

  function formDataFor(options: { slug: string; productId?: string; name?: string }): FormData {
    const formData = new FormData();
    if (options.productId) formData.set('productId', options.productId);
    formData.set('name', options.name ?? 'Test product');
    formData.set('slug', options.slug);
    formData.set('categoryId', categoryId);
    formData.set('brand', 'ANT');
    formData.set('price', '1500000');
    formData.set('description', 'Test product description');
    return formData;
  }

  it('returns a slug field error when another product already uses the slug', async () => {
    const state = await saveProduct(
      initialState,
      formDataFor({ slug: `g8-duplicate-${suffix}`, name: 'New product' }),
    );

    expect(state.fieldErrors.slug).toEqual(['This slug is already in use.']);

    const duplicate = await prisma.product.findUniqueOrThrow({ where: { id: duplicateProductId } });
    expect(duplicate.name).toBe('Duplicate slug product');
  });

  it('returns a colors field error and rolls back when a color belongs to another product', async () => {
    const formData = formDataFor({ productId: targetId, slug: targetSlug, name: 'Renamed' });
    formData.append('colorId', otherColorId);
    formData.append('colorName', 'Red');
    formData.append('colorHex', '#ff0000');

    const state = await saveProduct(initialState, formData);

    expect(state.fieldErrors.colors).toEqual([
      'One or more colors no longer belong to this product. Reload and try again.',
    ]);

    const persisted = await prisma.product.findUniqueOrThrow({ where: { id: targetId } });
    expect(persisted.name).toBe('Original name');
    const colors = await prisma.productColor.findMany({ where: { productId: targetId } });
    expect(colors).toHaveLength(0);
  });

  it('returns a form error when the submitted productId does not exist', async () => {
    const state = await saveProduct(
      initialState,
      formDataFor({ productId: 'missing-product-id', slug: `g8-missing-${suffix}` }),
    );

    expect(state.fieldErrors.form).toEqual(['This product no longer exists.']);
  });

  it('persists HIDDEN status when published is false', async () => {
    await expect(
      saveProduct(
        initialState,
        formDataFor({ productId: targetId, slug: targetSlug, name: 'Now hidden' }),
      ),
    ).rejects.toThrow('NEXT_REDIRECT');

    const persisted = await prisma.product.findUniqueOrThrow({ where: { id: targetId } });
    expect(persisted.status).toBe('HIDDEN');
    expect(persisted.name).toBe('Now hidden');
  });
});
