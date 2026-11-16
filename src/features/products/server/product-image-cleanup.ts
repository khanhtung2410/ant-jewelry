import 'server-only';
/* eslint-disable @typescript-eslint/no-explicit-any */

import { prisma } from '@/features/shared/db/prisma';
import { deleteStoredProductImage } from './product-image-storage';

export async function enqueueProductImageDeletions(storageKeys: string[]): Promise<void> {
  if (storageKeys.length === 0) {
    return;
  }

  for (const storageKey of storageKeys) {
    const existing = await (prisma.orm.public.PendingImageDeletion as any)
      .where({ storageKey })
      .first();
    if (!existing) {
      await (prisma.orm.public.PendingImageDeletion as any).create({ storageKey });
    }
  }
  await processPendingProductImageDeletions();
}

export async function processPendingProductImageDeletions(): Promise<void> {
  const pending = await (prisma.orm.public.PendingImageDeletion as any)
    .orderBy([(d: any) => d.createdAt.asc(), (d: any) => d.id.asc()])
    .all();
  const failures: Error[] = [];

  for (const deletion of pending) {
    try {
      await deleteStoredProductImage(deletion.storageKey);
      await (prisma.orm.public.PendingImageDeletion as any).where({ id: deletion.id }).delete();
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
