import type { ReactNode } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  categoryFindMany: vi.fn(async (): Promise<unknown[]> => []),
  productCount: vi.fn(async (): Promise<number> => 0),
  productFindMany: vi.fn(async (): Promise<unknown[]> => []),
  productFindUnique: vi.fn(async (): Promise<unknown> => null),
}));

vi.mock('next/link', () => ({
  default: ({ href, children }: { href: string; children: ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}));

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
  updateTag: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: vi.fn(), push: vi.fn() }),
  redirect: vi.fn(),
}));

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

vi.mock('@/features/shared/db/prisma', () => ({
  prisma: {
    category: { findMany: mocks.categoryFindMany },
    product: {
      count: mocks.productCount,
      findMany: mocks.productFindMany,
      findUnique: mocks.productFindUnique,
    },
  },
}));

const { default: AdminProductsPage } = await import('./page');

describe('admin products page permission gating (R1.1b)', () => {
  it('hides New product and ignores ?new=1 for an EDITOR', async () => {
    const html = renderToStaticMarkup(
      await AdminProductsPage({ searchParams: Promise.resolve({ new: '1' }) }),
    );

    expect(html).not.toContain('New product');
    expect(mocks.productFindUnique).not.toHaveBeenCalled();
  });

  it('hides the delete product button for an EDITOR editing a product', async () => {
    mocks.categoryFindMany.mockResolvedValueOnce([
      { id: 'c-1', name: 'Rings', type: 'WEDDING RING', status: 'VISIBLE' },
    ]);
    mocks.productCount.mockResolvedValueOnce(1);
    mocks.productFindMany.mockResolvedValueOnce([
      {
        id: 'p-1',
        name: 'Gold ring',
        slug: 'gold-ring',
        brand: 'ANT',
        price: 1_000_000,
        status: 'VISIBLE',
        categoryId: 'c-1',
        category: { id: 'c-1', name: 'Rings' },
      },
    ]);
    mocks.productFindUnique.mockResolvedValueOnce({
      id: 'p-1',
      name: 'Gold ring',
      slug: 'gold-ring',
      categoryId: 'c-1',
      brand: 'ANT',
      price: 1_000_000,
      description: 'A ring',
      details: null,
      status: 'VISIBLE',
      colors: [],
      images: [],
    });

    const html = renderToStaticMarkup(
      await AdminProductsPage({ searchParams: Promise.resolve({ edit: 'p-1' }) }),
    );

    expect(html).toContain('Edit Gold ring');
    expect(html).not.toContain('Delete product');
  });
});
