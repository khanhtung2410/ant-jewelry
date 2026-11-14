import Link from 'next/link';
import { AdminPageHeader } from '@/features/admin/components/admin-page-header';
import { AccessDenied } from '@/features/admin/components/access-denied';
import { firstSearchParam, type SearchParam } from '@/features/admin/lib/admin-search-params';
import { getAdminSession } from '@/features/auth/session';
import { visibilityStatus } from '@/constants/statuses';
import {
  ProductManagement,
  type AdminProductImage,
} from '@/features/products/components/product-management';
import type { ProductFormValues } from '@/features/products/actions';
import {
  ADMIN_PRODUCTS_PAGE_SIZE,
  buildAdminProductsHref,
  resolveAdminProductsPage,
} from '@/features/products/lib/admin-product-list';
import { formatPrice } from '@/features/shared/lib/format-price';
import { prisma } from '@/features/shared/db/prisma';
import {
  canEditPrice,
  canManageProducts,
  canViewProducts,
} from '@/features/shared/lib/permissions';

export const instant = false;

type AdminProductsPageProps = {
  searchParams: Promise<
    Partial<Record<'search' | 'category' | 'edit' | 'view' | 'saved' | 'page' | 'new', SearchParam>>
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
  const canManageProductsAccess = canManageProducts(session.role);
  const canEditProductPrice = canEditPrice(session.role);
  const editorView = !canManageProductsAccess;
  const createRequested = canManageProductsAccess && firstSearchParam(params.new) === '1';
  const selectedProductId = createRequested
    ? ''
    : firstSearchParam(editorView ? params.view : params.edit);

  const listWhere = {
    ...(search ? { name: { contains: search } } : {}),
    ...(categoryFilter ? { categoryId: categoryFilter } : {}),
  };

  const [categories, totalProducts] = await Promise.all([
    prisma.category.findMany({
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      select: { id: true, name: true, type: true, status: true },
    }),
    prisma.product.count({ where: listWhere }),
  ]);

  const { page: currentPage, totalPages } = resolveAdminProductsPage(
    firstSearchParam(params.page),
    totalProducts,
    ADMIN_PRODUCTS_PAGE_SIZE,
  );

  const [products, selectedProduct] = await Promise.all([
    prisma.product.findMany({
      where: listWhere,
      include: { category: { select: { id: true, name: true } } },
      orderBy: [{ updatedAt: 'desc' }, { name: 'asc' }],
      skip: (currentPage - 1) * ADMIN_PRODUCTS_PAGE_SIZE,
      take: ADMIN_PRODUCTS_PAGE_SIZE,
    }),
    selectedProductId
      ? prisma.product.findUnique({
          where: { id: selectedProductId },
          include: {
            colors: { orderBy: { createdAt: 'asc' } },
            images: { orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }] },
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
        brand: selectedProduct.brand,
        price: formatPrice(selectedProduct.price),
        description: selectedProduct.description,
        details: detailsToText(selectedProduct.details),
        colors: selectedProduct.colors.map((color) => ({
          id: color.id,
          name: color.name,
          hex: color.hex,
        })),
        published: selectedProduct.status === visibilityStatus.VISIBLE,
      }
    : createRequested
      ? {
          name: '',
          slug: '',
          categoryId: defaultCategory?.id ?? '',
          brand: '',
          price: '',
          description: '',
          details: '',
          colors: [],
          published: false,
        }
      : null;

  const closeHref = buildAdminProductsHref({
    search,
    category: categoryFilter,
    page: currentPage,
  });

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
              href={buildAdminProductsHref({
                search,
                category: categoryFilter,
                page: currentPage,
                create: true,
              })}
              aria-haspopup="dialog"
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
          brand: product.brand,
          price: product.price,
          status: product.status,
          category: product.category,
        }))}
        categories={categories}
        totalProducts={totalProducts}
        currentPage={currentPage}
        totalPages={totalPages}
        search={search}
        categoryFilter={categoryFilter}
        editorView={editorView}
        canEditPrice={canEditProductPrice}
        saved={firstSearchParam(params.saved) === '1'}
        dialog={
          values
            ? {
                values,
                productName: selectedProduct?.name ?? null,
                closeHref,
                images: selectedProduct
                  ? selectedProduct.images.map((image): AdminProductImage => ({
                      id: image.id,
                      url: image.url,
                      alt: image.alt,
                      isFront: image.isFront,
                      isHover: image.isHover,
                      sortOrder: image.sortOrder,
                      productColorId: image.productColorId,
                    }))
                  : [],
              }
            : null
        }
      />
    </div>
  );
}

function detailsToText(value: unknown): string {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return '';
  }

  return Object.entries(value)
    .map(([name, detail]) => `${name}: ${String(detail)}`)
    .join('\n');
}
