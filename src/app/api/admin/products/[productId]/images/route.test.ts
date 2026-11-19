import { beforeEach, describe, expect, it, vi } from 'vitest';
import { POST } from './route';
import { InvalidProductImageError } from '@/features/products/server/product-image-storage';

const adminSession = {
  userId: 'admin-1',
  email: 'admin@example.com',
  name: 'Admin',
  role: 'ADMIN',
  sessionVersion: 0,
  exp: 9_999_999_999,
};

const mocks = vi.hoisted(() => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
  getAdminSession: vi.fn(
    async (): Promise<{
      userId: string;
      email: string;
      name: string;
      role: string;
      sessionVersion: number;
      exp: number;
    } | null> => ({ ...adminSession }),
  ),
  findProduct: vi.fn(
    async (): Promise<{
      id: string;
      name: string;
      images: { sortOrder: number; isFront: boolean }[];
    } | null> => ({ id: 'product-1', name: 'Gold ring', images: [] }),
  ),
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

vi.mock('@/features/auth/session', () => ({ getAdminSession: mocks.getAdminSession }));

vi.mock('@/features/products/server/product-image-storage', async (importOriginal) => {
  const actual =
    await importOriginal<typeof import('@/features/products/server/product-image-storage')>();
  return { ...actual, uploadProductImage: mocks.uploadProductImage };
});

vi.mock('@/features/products/server/product-image-cleanup', async (importOriginal) => {
  const actual =
    await importOriginal<typeof import('@/features/products/server/product-image-cleanup')>();
  return { ...actual, enqueueProductImageDeletions: mocks.enqueueProductImageDeletions };
});

vi.mock('@/features/shared/db/prisma', () => ({
  prisma: {
    product: { findUnique: mocks.findProduct },
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

function createUploadRequest(fileCount = 1, bytes = createPngBytes()): Request {
  const formData = new FormData();
  for (let index = 0; index < fileCount; index += 1) {
    formData.append('files', new File([bytes], `ring-${index}.png`, { type: 'image/png' }));
  }

  return new Request('http://localhost/api/admin/products/product-1/images', {
    method: 'POST',
    headers: { origin: 'http://localhost' },
    body: formData,
  });
}

const context = { params: Promise.resolve({ productId: 'product-1' }) };

describe('POST product image upload', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getAdminSession.mockResolvedValue(adminSession);
    mocks.findProduct.mockResolvedValue({ id: 'product-1', name: 'Gold ring', images: [] });
  });

  it('revalidates the products cache so the storefront shows the new image', async () => {
    const response = await POST(createUploadRequest(), context);
    const body = (await response.json()) as { images: { isFront: boolean }[] };

    expect(response.status).toBe(201);
    expect(body.images).toHaveLength(1);
    expect(body.images[0].isFront).toBe(true);
    expect(mocks.revalidateTag).toHaveBeenCalledWith('products', { expire: 0 });
    expect(mocks.revalidatePath).toHaveBeenCalledWith('/p/[slug]', 'page');
    expect(mocks.revalidatePath).toHaveBeenCalledWith('/c/[slug]', 'page');
  });

  it('rejects batched requests so every upload stays under the body limit', async () => {
    const response = await POST(createUploadRequest(2), context);
    const body = (await response.json()) as { error: string };

    expect(response.status).toBe(400);
    expect(body.error).toMatch(/exactly one image per request/i);
    expect(mocks.uploadProductImage).not.toHaveBeenCalled();
    expect(mocks.createProductImage).not.toHaveBeenCalled();
  });

  it('returns 415 when magic bytes pass but the image cannot be decoded', async () => {
    mocks.uploadProductImage.mockRejectedValueOnce(new InvalidProductImageError('corrupt'));

    const response = await POST(createUploadRequest(), context);
    const body = (await response.json()) as { error: string };

    expect(response.status).toBe(415);
    expect(body.error).toMatch(/corrupt/i);
    expect(mocks.createProductImage).not.toHaveBeenCalled();
  });

  it('returns an upload error when storage fails for a reason other than a corrupt image', async () => {
    mocks.uploadProductImage.mockRejectedValueOnce(new Error('write failed'));
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    const response = await POST(createUploadRequest(), context);
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

    const response = await POST(createUploadRequest(), context);
    const body = (await response.json()) as { error: string };

    expect(response.status).toBe(500);
    expect(body.error).toMatch(/metadata/i);
    expect(mocks.enqueueProductImageDeletions).toHaveBeenCalledTimes(1);
    expect(consoleError).toHaveBeenCalled();
    consoleError.mockRestore();
  });

  it('rejects a missing session with 403 but allows an EDITOR (products:update)', async () => {
    mocks.getAdminSession.mockResolvedValueOnce(null);
    expect((await POST(createUploadRequest(), context)).status).toBe(403);
    expect(mocks.uploadProductImage).not.toHaveBeenCalled();

    mocks.getAdminSession.mockResolvedValueOnce({ ...adminSession, role: 'EDITOR' });
    expect((await POST(createUploadRequest(), context)).status).toBe(201);
    expect(mocks.uploadProductImage).toHaveBeenCalledTimes(1);
  });

  it('rejects a missing or cross-origin Origin header with 403', async () => {
    const withoutOrigin = createUploadRequest();
    withoutOrigin.headers.delete('origin');
    expect((await POST(withoutOrigin, context)).status).toBe(403);

    const crossOrigin = createUploadRequest();
    crossOrigin.headers.set('origin', 'https://evil.example');
    expect((await POST(crossOrigin, context)).status).toBe(403);
    expect(mocks.uploadProductImage).not.toHaveBeenCalled();
  });

  it('rejects a product that does not exist with 404', async () => {
    mocks.findProduct.mockResolvedValueOnce(null);

    expect((await POST(createUploadRequest(), context)).status).toBe(404);
    expect(mocks.uploadProductImage).not.toHaveBeenCalled();
  });

  it('rejects an oversized file with 413', async () => {
    const oversized = new Uint8Array(4 * 1024 * 1024 + 1);

    expect((await POST(createUploadRequest(1, oversized), context)).status).toBe(413);
    expect(mocks.uploadProductImage).not.toHaveBeenCalled();
  });

  it('rejects bytes without image magic with 415', async () => {
    const notAnImage = new Uint8Array([1, 2, 3, 4]);

    expect((await POST(createUploadRequest(1, notAnImage), context)).status).toBe(415);
    expect(mocks.uploadProductImage).not.toHaveBeenCalled();
  });
});
