/* eslint-disable @typescript-eslint/no-explicit-any */
import Link from 'next/link';
import { AccessDenied } from '@/features/admin/components/access-denied';
import { AdminPageHeader } from '@/features/admin/components/admin-page-header';
import { firstSearchParam, type SearchParam } from '@/features/admin/lib/admin-search-params';
import { getAdminSession } from '@/features/auth/session';
import type { CategoryFormValues } from '@/features/products/actions/categories';
import { CategoryManagement } from '@/features/products/components/category-management';
import { buildAdminCategoriesHref } from '@/features/products/lib/admin-category-list';
import { visibilityStatus } from '@/constants/statuses';
import { prisma } from '@/features/shared/db/prisma';
import { canManageCategories } from '@/features/shared/lib/permissions';

export const instant = false;

type AdminCategoriesPageProps = {
  searchParams: Promise<Partial<Record<'edit' | 'new' | 'saved', SearchParam>>>;
};

export default async function AdminCategoriesPage({ searchParams }: AdminCategoriesPageProps) {
  const session = await getAdminSession();
  if (!session) return null;
  if (!canManageCategories(session.role)) {
    return <AccessDenied message="You do not have permission to manage categories." />;
  }

  const params = await searchParams;
  const editId = firstSearchParam(params.edit);
  const createRequested = firstSearchParam(params.new) === '1';
  const [categories, products] = await Promise.all([
    (prisma.orm.public.Category as any)
      .orderBy([(c: any) => c.sortOrder.asc(), (c: any) => c.name.asc()])
      .all(),
    (prisma.orm.public.Product as any).all(),
  ]);
  const selectedCategory = editId
    ? categories.find((category: any) => category.id === editId)
    : null;
  const counts = new Map<string, number>();
  for (const p of products) {
    counts.set(p.categoryId, (counts.get(p.categoryId) ?? 0) + 1);
  }

  const values: CategoryFormValues | null = selectedCategory
    ? {
        categoryId: selectedCategory.id,
        name: selectedCategory.name,
        slug: selectedCategory.slug,
        type: selectedCategory.type,
        visible: selectedCategory.status === visibilityStatus.VISIBLE,
      }
    : createRequested
      ? {
          name: '',
          slug: '',
          type: '',
          visible: true,
        }
      : null;

  const closeHref = buildAdminCategoriesHref();

  return (
    <div>
      <AdminPageHeader
        title="Categories"
        description="Manage storefront categories, their display order, and visibility."
        actions={
          <Link
            href={buildAdminCategoriesHref({ create: true })}
            aria-haspopup="dialog"
            className="rounded-md bg-foreground px-3 py-2 text-sm text-background"
          >
            New category
          </Link>
        }
      />
      <CategoryManagement
        categories={categories.map((category: any) => ({
          id: category.id,
          name: category.name,
          slug: category.slug,
          type: category.type,
          status: category.status,
          sortOrder: category.sortOrder,
          productCount: counts.get(category.id) ?? 0,
        }))}
        saved={firstSearchParam(params.saved) === '1'}
        dialog={values ? { values, closeHref } : null}
      />
    </div>
  );
}
