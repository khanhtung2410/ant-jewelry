import 'server-only';

import { prisma } from '@/features/shared/db/prisma';
import { deleteStoredProductImage } from './product-image-storage';

export async function enqueueProductImageDeletions(storageKeys: string[]): Promise<void> {
  if (storageKeys.length === 0) {
    return;
  }

  await prisma.$transaction(
    storageKeys.map((storageKey) =>
      prisma.pendingImageDeletion.upsert({
        where: { storageKey },
        create: { storageKey },
        update: {},
      }),
    ),
  );
  await processPendingProductImageDeletions();
}

export async function processPendingProductImageDeletions(): Promise<void> {
  let pending: Awaited<ReturnType<typeof prisma.pendingImageDeletion.findMany>>;
  try {
    pending = await prisma.pendingImageDeletion.findMany({
      orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
    });
  } catch (error) {
    // Even a DB failure while reading the queue must not fail the action that
    // just queued an image deletion; the rows stay for a later retry.
    console.error('Could not load pending product image deletions:', error);
    return;
  }
  const failures: Error[] = [];

  for (const deletion of pending) {
    try {
      await deleteStoredProductImage(deletion.storageKey);
      await prisma.pendingImageDeletion.delete({ where: { id: deletion.id } });
    } catch (error) {
      failures.push(
        error instanceof Error ? error : new Error('Unknown product image cleanup failure.'),
      );
    }
  }

  if (failures.length > 0) {
    // Failed rows are deliberately left in PendingImageDeletion so a later
    // save/deletion retries them. Cleanup is best-effort and must never fail
    // the product action that queued it.
    console.error(
      `${failures.length} product image(s) could not be removed from storage; they remain queued for retry.`,
      ...failures,
    );
  }
}

export function getProductRevalidationPaths(): [string, 'page'?][] {
  return [['/admin/products'], ['/', 'page'], ['/c/[slug]', 'page'], ['/p/[slug]', 'page']];
}
