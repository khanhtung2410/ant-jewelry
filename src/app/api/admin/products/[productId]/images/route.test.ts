import { beforeEach, describe, expect, it, vi } from 'vitest';
import { POST } from './route';

const mocks = vi.hoisted(() => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
  uploadProductImage: vi.fn(async (productId: string) => ({
    storageKey: `products/${productId}/uploaded.png`,
    url: `/uploads/products/${productId}/uploaded.png`,
  })),
  createProductImage: vi.fn(async ({ data }: { data: Record<string, unknown> }) => ({
    id: 'image-1',
    ...data,
  })),
  enqueueProductImageDeletions: vi.fn(async () => {}),
}));

vi.mock('next/cache', () => ({
  revalidatePath: mocks.revalidatePath,
  revalidateTag: mocks.revalidateTag,
}));

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

vi.mock('@/features/products/server/product-image-storage', () => ({
  uploadProductImage: mocks.uploadProductImage,
}));

vi.mock('@/features/products/server/product-image-cleanup', async (importOriginal) => {
  const actual =
    await importOriginal<typeof import('@/features/products/server/product-image-cleanup')>();
  return { ...actual, enqueueProductImageDeletions: mocks.enqueueProductImageDeletions };
});

vi.mock('@/features/shared/db/prisma', () => ({
  prisma: {
    product: {
      findUnique: vi.fn(async () => ({ id: 'product-1', name: 'Gold ring', images: [] })),
    },
    productImage: { create: mocks.createProductImage },
    $transaction: vi.fn(async (operations: Promise<unknown>[]) => Promise.all(operations)),
  },
}));

function createPngBytes(): Uint8Array<ArrayBuffer> {
  const bytes: Uint8Array<ArrayBuffer> = new Uint8Array(24);
  bytes.set([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a], 0);
  bytes.set([0x49, 0x48, 0x44, 0x52], 12);
  return bytes;
}

function createUploadRequest(fileCount = 1): Request {
  const formData = new FormData();
  for (let index = 0; index < fileCount; index += 1) {
    formData.append(
      'files',
      new File([createPngBytes()], `ring-${index}.png`, { type: 'image/png' }),
    );
  }

  return new Request('http://localhost/api/admin/products/product-1/images', {
    method: 'POST',
    headers: { origin: 'http://localhost' },
    body: formData,
  });
}

describe('POST product image upload', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('revalidates the products cache so the storefront shows the new image', async () => {
    const response = await POST(createUploadRequest(), {
      params: Promise.resolve({ productId: 'product-1' }),
    });
    const body = (await response.json()) as { images: { isFront: boolean }[] };

    expect(response.status).toBe(201);
    expect(body.images).toHaveLength(1);
    expect(body.images[0].isFront).toBe(true);
    expect(mocks.revalidateTag).toHaveBeenCalledWith('products', { expire: 0 });
    expect(mocks.revalidatePath).toHaveBeenCalledWith('/p/[slug]', 'page');
    expect(mocks.revalidatePath).toHaveBeenCalledWith('/c/[slug]', 'page');
  });

  it('rejects batched requests so every upload stays under the body limit', async () => {
    const response = await POST(createUploadRequest(2), {
      params: Promise.resolve({ productId: 'product-1' }),
    });
    const body = (await response.json()) as { error: string };

    expect(response.status).toBe(400);
    expect(body.error).toMatch(/exactly one image per request/i);
    expect(mocks.uploadProductImage).not.toHaveBeenCalled();
    expect(mocks.createProductImage).not.toHaveBeenCalled();
  });

  it('returns an upload error when the storage write fails', async () => {
    mocks.uploadProductImage.mockRejectedValueOnce(new Error('write failed'));
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    const response = await POST(createUploadRequest(), {
      params: Promise.resolve({ productId: 'product-1' }),
    });
    const body = (await response.json()) as { error: string };

    expect(response.status).toBe(500);
    expect(body.error).toMatch(/upload failed/i);
    expect(mocks.enqueueProductImageDeletions).not.toHaveBeenCalled();
    expect(consoleError).toHaveBeenCalled();
    consoleError.mockRestore();
  });

  it('returns a metadata error even when cleanup fails', async () => {
    mocks.createProductImage.mockRejectedValueOnce(new Error('db failed'));
    mocks.enqueueProductImageDeletions.mockRejectedValueOnce(new Error('cleanup failed'));
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    const response = await POST(createUploadRequest(), {
      params: Promise.resolve({ productId: 'product-1' }),
    });
    const body = (await response.json()) as { error: string };

    expect(response.status).toBe(500);
    expect(body.error).toMatch(/metadata/i);
    expect(mocks.enqueueProductImageDeletions).toHaveBeenCalledTimes(1);
    expect(consoleError).toHaveBeenCalled();
    consoleError.mockRestore();
  });
});
