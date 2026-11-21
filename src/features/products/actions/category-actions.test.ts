import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { revalidatePath, revalidateTag } from 'next/cache';
import { prisma } from '@/features/shared/db/prisma';
import type {
  CategoryFormState,
  DeleteCategoryState,
} from '@/features/products/actions/categories';

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

const { deleteCategory, moveCategory, saveCategory } =
  await import('@/features/products/actions/categories');

const suffix = `${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`;
const quote = '\u201c';
const endQuote = '\u201d';

const emptyCategoryState: CategoryFormState = {
  values: { name: '', slug: '', type: 'NECKLACE', visible: true },
  fieldErrors: {},
  message: null,
};

const emptyDeleteState: DeleteCategoryState = { message: null };

describe('category actions with the real database (G11)', () => {
  let originalSortOrders: Map<string, number>;
  const createdCategoryIds: string[] = [];
  const createdProductIds: string[] = [];

  beforeAll(async () => {
    const all = await prisma.category.findMany({ select: { id: true, sortOrder: true } });
    originalSortOrders = new Map(all.map((category) => [category.id, category.sortOrder]));
  });

  beforeEach(() => {
    vi.mocked(revalidatePath).mockClear();
    vi.mocked(revalidateTag).mockClear();
  });

  afterAll(async () => {
    await prisma.product.deleteMany({ where: { id: { in: createdProductIds } } });
    await prisma.category.deleteMany({ where: { id: { in: createdCategoryIds } } });
    for (const [id, sortOrder] of originalSortOrders) {
      await prisma.category.update({ where: { id }, data: { sortOrder } });
    }
  });

  async function createCategory(name: string, sortOrder: number): Promise<string> {
    const category = await prisma.category.create({
      data: {
        name,
        slug: `g11-${name.toLowerCase().replaceAll(' ', '-')}-${suffix}`,
        type: 'OTHER JEWELRY',
        sortOrder,
      },
      select: { id: true },
    });
    createdCategoryIds.push(category.id);
    return category.id;
  }

  function saveFormData(slug: string, type: string, categoryId?: string): FormData {
    const formData = new FormData();
    if (categoryId) formData.set('categoryId', categoryId);
    formData.set('name', 'Posted category');
    formData.set('slug', slug);
    formData.set('type', type);
    formData.set('visible', 'on');
    return formData;
  }

  it('returns a slug field error when another category already uses the slug', async () => {
    const existing = await createCategory('Duplicate Slug', 910);

    const state = await saveCategory(
      emptyCategoryState,
      saveFormData(`g11-duplicate-slug-${suffix}`, 'NECKLACE'),
    );

    expect(state.fieldErrors.slug).toEqual(['This slug is already in use.']);
    const persisted = await prisma.category.findUniqueOrThrow({ where: { id: existing } });
    expect(persisted.name).toBe('Duplicate Slug');
  });

  it('returns a type field error when the type belongs to another category', async () => {
    const state = await saveCategory(
      emptyCategoryState,
      saveFormData(`g11-duplicate-type-${suffix}`, 'NECKLACE'),
    );

    expect(state.fieldErrors.type?.[0]).toContain('NECKLACE');
    expect(state.fieldErrors.type?.[0]).toContain('already belongs to');
  });

  it('refuses to delete a category with one product and reports the count', async () => {
    const categoryId = await createCategory('One Product', 911);
    const product = await prisma.product.create({
      data: {
        name: 'Only product',
        slug: `g11-only-product-${suffix}`,
        categoryId,
        brand: 'ANT',
        price: 1_000_000,
        description: 'Seeded for the delete guard test',
      },
      select: { id: true },
    });
    createdProductIds.push(product.id);

    const state = await deleteCategory(
      emptyDeleteState,
      (() => {
        const formData = new FormData();
        formData.set('categoryId', categoryId);
        return formData;
      })(),
    );

    expect(state.message).toBe(
      `Cannot delete ${quote}One Product${endQuote} because 1 product is still assigned to it. Move or delete those products first.`,
    );
    const persisted = await prisma.category.findUnique({ where: { id: categoryId } });
    expect(persisted).not.toBeNull();
  });

  it('reports the plural count when several products are assigned', async () => {
    const categoryId = await createCategory('Many Products', 912);
    for (const index of [1, 2]) {
      const product = await prisma.product.create({
        data: {
          name: `Product ${index}`,
          slug: `g11-many-product-${index}-${suffix}`,
          categoryId,
          brand: 'ANT',
          price: 1_000_000,
          description: 'Seeded for the delete guard test',
        },
        select: { id: true },
      });
      createdProductIds.push(product.id);
    }

    const formData = new FormData();
    formData.set('categoryId', categoryId);
    const state = await deleteCategory(emptyDeleteState, formData);

    expect(state.message).toBe(
      `Cannot delete ${quote}Many Products${endQuote} because 2 products are still assigned to it. Move or delete those products first.`,
    );
  });

  it('deletes a category that has no products', async () => {
    const categoryId = await createCategory('Empty Category', 913);

    await expect(
      deleteCategory(
        emptyDeleteState,
        (() => {
          const formData = new FormData();
          formData.set('categoryId', categoryId);
          return formData;
        })(),
      ),
    ).rejects.toThrow('NEXT_REDIRECT');

    const persisted = await prisma.category.findUnique({ where: { id: categoryId } });
    expect(persisted).toBeNull();
  });

  it('swaps sortOrder when a category is moved up and down', async () => {
    const firstId = await createCategory('Move First', 920);
    const secondId = await createCategory('Move Second', 921);
    const thirdId = await createCategory('Move Third', 922);

    await expect(moveCategory(secondId, 'up', new FormData())).rejects.toThrow('NEXT_REDIRECT');

    const afterUp = await prisma.category.findMany({
      where: { id: { in: [firstId, secondId, thirdId] } },
      select: { id: true, sortOrder: true },
    });
    const upById = new Map(afterUp.map((category) => [category.id, category.sortOrder]));
    expect(upById.get(secondId)).toBeLessThan(upById.get(firstId)!);
    expect(upById.get(firstId)).toBeLessThan(upById.get(thirdId)!);

    await expect(moveCategory(secondId, 'down', new FormData())).rejects.toThrow('NEXT_REDIRECT');

    const afterDown = await prisma.category.findMany({
      where: { id: { in: [firstId, secondId, thirdId] } },
      select: { id: true, sortOrder: true },
    });
    const downById = new Map(afterDown.map((category) => [category.id, category.sortOrder]));
    expect(downById.get(firstId)).toBeLessThan(downById.get(secondId)!);
    expect(downById.get(secondId)).toBeLessThan(downById.get(thirdId)!);
  });

  it('revalidates the storefront consumers and hides a category from the real query', async () => {
    const categoryId = await createCategory('Visibility Target', 930);
    const seeded = await prisma.category.findUniqueOrThrow({ where: { id: categoryId } });
    const slug = seeded.slug;

    // Hide via the real write path used by saveCategory (status field).
    await prisma.category.update({
      where: { id: categoryId },
      data: { status: 'HIDDEN' },
    });

    const { getCategories } = await import('@/features/products/queries/categories');
    const publicCategories = await getCategories();
    expect(publicCategories.some((category) => category.slug === slug)).toBe(false);
    const allCategories = await getCategories({ includeHidden: true });
    expect(allCategories.find((category) => category.slug === slug)?.status).toBe('HIDDEN');

    // moveCategory is a successful action that must revalidate the same
    // storefront consumers after any category mutation.
    await expect(moveCategory(categoryId, 'up', new FormData())).rejects.toThrow('NEXT_REDIRECT');
    expect(revalidateTag).toHaveBeenCalledWith('products', 'max');
    expect(revalidatePath).toHaveBeenCalledWith('/admin/categories');
    expect(revalidatePath).toHaveBeenCalledWith('/', 'layout');
  });
});
