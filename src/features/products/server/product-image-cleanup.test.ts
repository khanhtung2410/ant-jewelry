import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  findMany: vi.fn(),
  deleteRow: vi.fn(async () => ({})),
  upsert: vi.fn(async () => ({})),
  deleteStored: vi.fn(async (_storageKey: string) => {}),
  transaction: vi.fn(async (operations: Promise<unknown>[]) => Promise.all(operations)),
}));

vi.mock('@/features/shared/db/prisma', () => ({
  prisma: {
    pendingImageDeletion: {
      findMany: mocks.findMany,
      delete: mocks.deleteRow,
      upsert: mocks.upsert,
    },
    $transaction: mocks.transaction,
  },
}));

vi.mock('./product-image-storage', () => ({
  deleteStoredProductImage: mocks.deleteStored,
}));

const { enqueueProductImageDeletions, processPendingProductImageDeletions } =
  await import('./product-image-cleanup');

describe('pending product image cleanup', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.findMany.mockResolvedValue([
      { id: 'row-ok', storageKey: 'products/p-1/ok.webp' },
      { id: 'row-fail', storageKey: 'products/p-1/fail.webp' },
    ]);
    mocks.deleteStored.mockImplementation(async (storageKey: string) => {
      if (storageKey.includes('fail')) {
        throw new Error('unlink failed');
      }
    });
  });

  it('logs failures, keeps the failed row queued, and does not throw', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    await expect(processPendingProductImageDeletions()).resolves.toBeUndefined();

    expect(mocks.deleteStored).toHaveBeenCalledTimes(2);
    expect(mocks.deleteRow).toHaveBeenCalledTimes(1);
    expect(mocks.deleteRow).toHaveBeenCalledWith({ where: { id: 'row-ok' } });
    expect(consoleError).toHaveBeenCalled();
    consoleError.mockRestore();
  });

  it('keeps enqueueing successful when storage deletion fails', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    await expect(enqueueProductImageDeletions(['products/p-1/fail.webp'])).resolves.toBeUndefined();

    expect(mocks.upsert).toHaveBeenCalledWith({
      where: { storageKey: 'products/p-1/fail.webp' },
      create: { storageKey: 'products/p-1/fail.webp' },
      update: {},
    });
    expect(consoleError).toHaveBeenCalled();
    consoleError.mockRestore();
  });
});
