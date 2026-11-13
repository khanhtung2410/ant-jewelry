import 'server-only';

import { prisma } from '@/features/shared/db/prisma';
import { deleteStoredProductImage } from './local-image-storage';

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
  const pending = await prisma.pendingImageDeletion.findMany({
    orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
  });
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
    throw new AggregateError(failures, 'Some product images could not be removed from storage.');
  }
}

export function getProductRevalidationPaths(): [string, 'page'?][] {
  return [['/admin/products'], ['/', 'page'], ['/c/[slug]', 'page'], ['/p/[slug]', 'page']];
}
