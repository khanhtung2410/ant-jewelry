import Link from 'next/link';
import { AdminPageHeader } from '@/features/admin/components/admin-page-header';
import { AccessDenied } from '@/features/admin/components/access-denied';
import { getAdminSession } from '@/features/auth/session';
import { ProductManagement } from '@/features/products/components/product-management';
import type { ProductFormValues } from '@/features/products/actions';
import { formatPrice } from '@/features/shared/lib/format-price';
import { prisma } from '@/features/shared/db/prisma';
import { canViewProducts } from '@/features/shared/lib/permissions';

export const instant = false;

type SearchParam = string | string[] | undefined;

type AdminProductsPageProps = {
  searchParams: Promise<
    Partial<Record<'search' | 'category' | 'edit' | 'view' | 'saved', SearchParam>>
  >;
};

export default async function AdminProductsPage({ searchParams }: AdminProductsPageProps) {
  const session = await getAdminSession();
  if (!session) return null;
  if (!canViewProducts(session.role)) {
    return <AccessDenied message="You do not have permission to view products." />;
  }

  const params = await searchParams;
  const search = firstSearchParam(params.search).trim();
  const categoryFilter = firstSearchParam(params.category);
  const editorView = session.role === 'EDITOR';
  const selectedProductId = firstSearchParam(editorView ? params.view : params.edit);
  const [categories, products, selectedProduct] = await Promise.all([
    prisma.category.findMany({
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      select: { id: true, name: true, type: true, status: true },
    }),
    prisma.product.findMany({
      where: {
        ...(search ? { name: { contains: search } } : {}),
        ...(categoryFilter ? { categoryId: categoryFilter } : {}),
      },
      include: { category: { select: { id: true, name: true } } },
      orderBy: [{ updatedAt: 'desc' }, { name: 'asc' }],
    }),
    selectedProductId
      ? prisma.product.findUnique({
          where: { id: selectedProductId },
          include: {
            colors: { orderBy: { createdAt: 'asc' } },
          },
        })
      : Promise.resolve(null),
  ]);
  const selectedCategory = categories.find((category) => category.id === categoryFilter);
  const defaultCategory = selectedCategory ?? categories[0];
  const values: ProductFormValues | null = selectedProduct
    ? {
        productId: selectedProduct.id,
        name: selectedProduct.name,
        slug: selectedProduct.slug,
        categoryId: selectedProduct.categoryId,
        type: selectedProduct.type,
        brand: selectedProduct.brand,
        price: formatPrice(selectedProduct.price),
        description: selectedProduct.description,
        details: detailsToText(selectedProduct.details),
        colors: selectedProduct.colors.map((color) => ({
          id: color.id,
          name: color.name,
          hex: color.hex,
        })),
        published: selectedProduct.status === 'VISIBLE',
      }
    : !editorView
      ? {
          name: '',
          slug: '',
          categoryId: defaultCategory?.id ?? '',
          type: defaultCategory?.type ?? '',
          brand: '',
          price: '',
          description: '',
          details: '',
          colors: [],
          published: false,
        }
      : null;

  return (
    <div>
      <AdminPageHeader
        title="Products"
        description={
          editorView
            ? 'View product information and prices. Product changes are restricted to ADMIN accounts.'
            : 'Search, filter, create, and update storefront products.'
        }
        actions={
          !editorView ? (
            <Link
              href="/admin/products"
              className="rounded-md bg-foreground px-3 py-2 text-sm text-background"
            >
              New product
            </Link>
          ) : undefined
        }
      />
      <ProductManagement
        products={products.map((product) => ({
          id: product.id,
          name: product.name,
          slug: product.slug,
          price: product.price,
          status: product.status,
          category: product.category,
        }))}
        categories={categories}
        values={values}
        selectedProductName={selectedProduct?.name ?? null}
        search={search}
        categoryFilter={categoryFilter}
        editorView={editorView}
        saved={firstSearchParam(params.saved) === '1'}
      />
    </div>
  );
}

function firstSearchParam(value: SearchParam): string {
  return Array.isArray(value) ? (value[0] ?? '') : (value ?? '');
}

function detailsToText(value: unknown): string {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return '';
  }

  return Object.entries(value)
    .map(([name, detail]) => `${name}: ${String(detail)}`)
    .join('\n');
}
