import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getAdminSession } from '@/features/auth/session';

const redirectError = new Error('NEXT_REDIRECT');

const {
  revalidatePathMock,
  revalidateTagMock,
  redirectMock,
  processPendingProductImageDeletionsMock,
  categoryFindUniqueMock,
  productFindUniqueMock,
  productCreateMock,
  productUpdateMock,
  productDeleteMock,
  productImageFindFirstMock,
  productImageFindManyMock,
  productImageDeleteMock,
  productImageUpdateMock,
  pendingImageDeletionUpsertMock,
  transactionMock,
} = vi.hoisted(() => {
  const revalidatePathMock = vi.fn();
  const revalidateTagMock = vi.fn();
  const redirectMock = vi.fn(() => {
    throw redirectError;
  });
  const processPendingProductImageDeletionsMock = vi.fn(async () => {});
  const categoryFindUniqueMock = vi.fn(async () => ({ id: 'category-1' }));
  const productFindUniqueMock = vi.fn();
  const productCreateMock = vi.fn(async () => ({ id: 'p-1' }));
  const productUpdateMock = vi.fn(async () => ({ id: 'p-1' }));
  const productDeleteMock = vi.fn(async () => ({}));
  const productColorFindManyMock = vi.fn(async () => []);
  const productImageFindFirstMock = vi.fn();
  const productImageFindManyMock = vi.fn(async () => []);
  const productImageDeleteMock = vi.fn(async () => ({}));
  const productImageUpdateMock = vi.fn(async () => ({}));
  const pendingImageDeletionUpsertMock = vi.fn(async () => ({}));
  const transactionMock = vi.fn(async (fn: (tx: unknown) => Promise<unknown>) =>
    fn({
      pendingImageDeletion: { upsert: pendingImageDeletionUpsertMock },
      productImage: {
        findFirst: productImageFindFirstMock,
        findMany: productImageFindManyMock,
        delete: productImageDeleteMock,
        update: productImageUpdateMock,
      },
      productColor: {
        findMany: productColorFindManyMock,
        deleteMany: vi.fn(async () => ({})),
      },
      product: {
        delete: productDeleteMock,
        create: productCreateMock,
        update: productUpdateMock,
      },
    }),
  );

  return {
    revalidatePathMock,
    revalidateTagMock,
    redirectMock,
    processPendingProductImageDeletionsMock,
    categoryFindUniqueMock,
    productFindUniqueMock,
    productCreateMock,
    productUpdateMock,
    productDeleteMock,
    productColorFindManyMock,
    productImageFindFirstMock,
    productImageFindManyMock,
    productImageDeleteMock,
    productImageUpdateMock,
    pendingImageDeletionUpsertMock,
    transactionMock,
  };
});

vi.mock('@/features/auth/session', () => ({
  getAdminSession: vi.fn(async () => ({
    userId: 'admin-1',
    email: 'admin@example.com',
    name: 'Admin',
    role: 'ADMIN',
    sessionVersion: 0,
    exp: 9_999_999_999,
  })),
}));

vi.mock('next/cache', () => ({
  revalidatePath: revalidatePathMock,
  revalidateTag: revalidateTagMock,
  updateTag: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  redirect: redirectMock,
}));

vi.mock('@/features/products/server/product-revalidation', () => ({
  revalidateProductPages: vi.fn(({ immediate = false }: { immediate?: boolean } = {}) => {
    revalidateTagMock('products', immediate ? { expire: 0 } : 'max');
    revalidatePathMock('/admin/products');
    revalidatePathMock('/', 'page');
    revalidatePathMock('/c/[slug]', 'page');
    revalidatePathMock('/p/[slug]', 'page');
  }),
}));

vi.mock('@/features/products/server/product-image-cleanup', () => ({
  processPendingProductImageDeletions: processPendingProductImageDeletionsMock,
}));

vi.mock('@/features/shared/db/prisma', () => ({
  prisma: {
    $transaction: transactionMock,
    category: { findUnique: categoryFindUniqueMock },
    product: {
      findUnique: productFindUniqueMock,
      delete: productDeleteMock,
      create: productCreateMock,
      update: productUpdateMock,
    },
    productImage: {
      findFirst: productImageFindFirstMock,
      findMany: productImageFindManyMock,
      delete: productImageDeleteMock,
      update: productImageUpdateMock,
    },
    pendingImageDeletion: {
      upsert: pendingImageDeletionUpsertMock,
    },
  },
}));

const { deleteProduct, deleteProductImage, saveProduct } =
  await import('@/features/products/actions');

describe('product deletion actions (R2.5)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getAdminSession).mockResolvedValue({
      userId: 'admin-1',
      email: 'admin@example.com',
      name: 'Admin',
      role: 'ADMIN',
      sessionVersion: 0,
      exp: 9_999_999_999,
    });
  });

  it('deletes a product image, queues storage cleanup, revalidates, and promotes next front image', async () => {
    productImageFindFirstMock.mockResolvedValueOnce({
      id: 'img-1',
      storageKey: 'products/p-1/cover.webp',
      isFront: true,
    });
    // next shared image lookup inside transaction
    productImageFindFirstMock.mockResolvedValueOnce({ id: 'img-2' });

    await deleteProductImage('p-1', 'img-1', new FormData());

    expect(transactionMock).toHaveBeenCalledTimes(1);
    expect(pendingImageDeletionUpsertMock).toHaveBeenCalledWith({
      where: { storageKey: 'products/p-1/cover.webp' },
      create: { storageKey: 'products/p-1/cover.webp' },
      update: {},
    });
    expect(productImageDeleteMock).toHaveBeenCalledWith({ where: { id: 'img-1' } });
    expect(productImageUpdateMock).toHaveBeenCalledWith({
      where: { id: 'img-2' },
      data: { isFront: true, isHover: false },
    });
    expect(revalidateTagMock).toHaveBeenCalledWith('products', { expire: 0 });
    expect(revalidatePathMock).toHaveBeenCalledWith('/admin/products');
    expect(revalidatePathMock).toHaveBeenCalledWith('/p/[slug]', 'page');
    expect(processPendingProductImageDeletionsMock).toHaveBeenCalledTimes(1);
  });

  it('deletes a non-front image without promoting another front image', async () => {
    productImageFindFirstMock.mockResolvedValueOnce({
      id: 'img-3',
      storageKey: 'products/p-1/detail.webp',
      isFront: false,
    });

    await deleteProductImage('p-1', 'img-3', new FormData());

    expect(productImageDeleteMock).toHaveBeenCalledWith({ where: { id: 'img-3' } });
    expect(productImageUpdateMock).not.toHaveBeenCalled();
    expect(revalidateTagMock).toHaveBeenCalledWith('products', { expire: 0 });
    expect(processPendingProductImageDeletionsMock).toHaveBeenCalledTimes(1);
  });

  it('still deletes a product image when storage cleanup fails', async () => {
    productImageFindFirstMock.mockResolvedValueOnce({
      id: 'img-1',
      storageKey: 'products/p-1/cover.webp',
      isFront: false,
    });
    processPendingProductImageDeletionsMock.mockRejectedValueOnce(new Error('unlink failed'));
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    await expect(deleteProductImage('p-1', 'img-1', new FormData())).resolves.toBeUndefined();

    expect(pendingImageDeletionUpsertMock).toHaveBeenCalled();
    expect(productImageDeleteMock).toHaveBeenCalledWith({ where: { id: 'img-1' } });
    expect(revalidateTagMock).toHaveBeenCalledWith('products', { expire: 0 });
    expect(processPendingProductImageDeletionsMock).toHaveBeenCalledTimes(1);
    expect(consoleError).toHaveBeenCalled();
    consoleError.mockRestore();
  });

  it('rejects image deletion when the image does not exist', async () => {
    productImageFindFirstMock.mockResolvedValueOnce(null);

    await expect(deleteProductImage('p-1', 'missing', new FormData())).rejects.toThrow(
      'Product image not found.',
    );
    expect(transactionMock).not.toHaveBeenCalled();
    expect(processPendingProductImageDeletionsMock).not.toHaveBeenCalled();
  });

  it('rejects image deletion when user cannot manage products', async () => {
    vi.mocked(getAdminSession).mockResolvedValueOnce(null);

    await expect(deleteProductImage('p-1', 'img-1', new FormData())).rejects.toThrow(
      'You do not have permission to manage product images.',
    );
    expect(productImageFindFirstMock).not.toHaveBeenCalled();
  });

  it('deletes a product, queues image cleanup, revalidates, and redirects', async () => {
    productFindUniqueMock.mockResolvedValueOnce({
      id: 'p-1',
      images: [
        { storageKey: 'products/p-1/a.webp' },
        { storageKey: null },
        { storageKey: 'products/p-1/b.webp' },
      ],
    });

    await expect(deleteProduct('p-1', new FormData())).rejects.toBe(redirectError);

    expect(transactionMock).toHaveBeenCalledTimes(1);
    expect(pendingImageDeletionUpsertMock).toHaveBeenCalledTimes(2);
    expect(pendingImageDeletionUpsertMock).toHaveBeenCalledWith({
      where: { storageKey: 'products/p-1/a.webp' },
      create: { storageKey: 'products/p-1/a.webp' },
      update: {},
    });
    expect(productDeleteMock).toHaveBeenCalledWith({ where: { id: 'p-1' } });
    expect(revalidateTagMock).toHaveBeenCalledWith('products', { expire: 0 });
    expect(processPendingProductImageDeletionsMock).toHaveBeenCalledTimes(1);
    expect(redirectMock).toHaveBeenCalledWith('/admin/products?deleted=1');
  });

  it('still redirects after deleting a product when storage cleanup fails', async () => {
    productFindUniqueMock.mockResolvedValueOnce({
      id: 'p-1',
      images: [{ storageKey: 'products/p-1/a.webp' }],
    });
    processPendingProductImageDeletionsMock.mockRejectedValueOnce(new Error('unlink failed'));
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    await expect(deleteProduct('p-1', new FormData())).rejects.toBe(redirectError);

    expect(productDeleteMock).toHaveBeenCalledWith({ where: { id: 'p-1' } });
    expect(revalidateTagMock).toHaveBeenCalledWith('products', { expire: 0 });
    expect(processPendingProductImageDeletionsMock).toHaveBeenCalledTimes(1);
    expect(redirectMock).toHaveBeenCalledWith('/admin/products?deleted=1');
    expect(consoleError).toHaveBeenCalled();
    consoleError.mockRestore();
  });

  it('rejects product deletion without products:delete permission', async () => {
    vi.mocked(getAdminSession).mockResolvedValueOnce({
      userId: 'editor-1',
      email: 'editor@example.com',
      name: 'Editor',
      role: 'EDITOR',
      sessionVersion: 0,
      exp: 9_999_999_999,
    });

    await expect(deleteProduct('p-1', new FormData())).rejects.toThrow(
      'You do not have permission to delete products.',
    );
    expect(productFindUniqueMock).not.toHaveBeenCalled();
  });

  it('rejects product deletion when the product does not exist', async () => {
    productFindUniqueMock.mockResolvedValueOnce(null);

    await expect(deleteProduct('missing', new FormData())).rejects.toThrow('Product not found.');
    expect(transactionMock).not.toHaveBeenCalled();
    expect(processPendingProductImageDeletionsMock).not.toHaveBeenCalled();
  });

  it('still saves a product when storage cleanup fails', async () => {
    productFindUniqueMock.mockResolvedValueOnce(null);
    processPendingProductImageDeletionsMock.mockRejectedValueOnce(new Error('unlink failed'));
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    const formData = new FormData();
    formData.set('name', 'Gold ring');
    formData.set('slug', 'gold-ring');
    formData.set('categoryId', 'category-1');
    formData.set('brand', 'ANT');
    formData.set('price', '1000000');
    formData.set('description', 'A ring');

    const state = {
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

    await expect(saveProduct(state, formData)).rejects.toBe(redirectError);

    expect(productCreateMock).toHaveBeenCalled();
    expect(revalidateTagMock).toHaveBeenCalledWith('products', { expire: 0 });
    expect(processPendingProductImageDeletionsMock).toHaveBeenCalledTimes(1);
    expect(redirectMock).toHaveBeenCalledWith('/admin/products?saved=1');
    expect(consoleError).toHaveBeenCalled();
    consoleError.mockRestore();
  });
});
