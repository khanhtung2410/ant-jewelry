'use client';

import Link from 'next/link';
import { VISIBILITY_STATUS, visibilityStatus } from '@/constants/statuses';
import { SavedNotice } from '@/features/admin/components/form-controls';
import {
  AdminActionButton,
  AdminActionLink,
  AdminTableActions,
} from '@/features/admin/components/admin-table-actions';
import {
  AdminTableEmpty,
  AdminTableSection,
} from '@/features/admin/components/admin-table-section';
import { StatusBadge } from '@/features/admin/components/status-badge';
import { formatPrice } from '@/features/shared/lib/format-price';
import { toggleProductVisibility, type ProductFormValues } from '../actions';
import {
  ADMIN_PRODUCTS_PAGE_SIZE,
  buildAdminProductsHref,
  getPaginationItems,
} from '../lib/admin-product-list';
import { ProductFormDialog, type ProductCategoryOption } from './product-form-dialog';

export type AdminProductRow = {
  id: string;
  name: string;
  slug: string;
  brand: string;
  price: number;
  status: 'VISIBLE' | 'HIDDEN';
  category: { id: string; name: string };
};

export type AdminProductImage = {
  id: string;
  url: string;
  alt: string;
  isFront: boolean;
  isHover: boolean;
  sortOrder: number;
  productColorId: string | null;
};

type Props = {
  products: AdminProductRow[];
  categories: ProductCategoryOption[];
  totalProducts: number;
  currentPage: number;
  totalPages: number;
  search: string;
  categoryFilter: string;
  editorView: boolean;
  canEditPrice: boolean;
  saved: boolean;
  dialog: {
    values: ProductFormValues;
    productName: string | null;
    closeHref: string;
    images: AdminProductImage[];
  } | null;
};

export function ProductManagement({
  products,
  categories,
  totalProducts,
  currentPage,
  totalPages,
  search,
  categoryFilter,
  editorView,
  canEditPrice,
  saved,
  dialog,
}: Props) {
  const listQuery = { search, category: categoryFilter, page: currentPage };
  const firstItem = totalProducts === 0 ? 0 : (currentPage - 1) * ADMIN_PRODUCTS_PAGE_SIZE + 1;
  const lastItem = Math.min(currentPage * ADMIN_PRODUCTS_PAGE_SIZE, totalProducts);

  return (
    <div>
      <div className="mb-5 rounded-lg border border-[var(--line)] p-4">
        <form
          action="/admin/products"
          method="get"
          className="grid gap-3 sm:grid-cols-[1fr_220px_auto_auto]"
        >
          <label className="text-sm font-medium">
            Search by name
            <input
              type="search"
              name="search"
              defaultValue={search}
              placeholder="Product name"
              className="mt-1 w-full rounded-md border border-[var(--line)] bg-background px-3 py-2 font-normal"
            />
          </label>
          <label className="text-sm font-medium">
            Category
            <select
              name="category"
              defaultValue={categoryFilter}
              className="mt-1 w-full rounded-md border border-[var(--line)] bg-background px-3 py-2 font-normal"
            >
              <option value="">All categories</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                  {category.status === 'HIDDEN' ? ' (hidden)' : ''}
                </option>
              ))}
            </select>
          </label>
          <button
            type="submit"
            className="self-end rounded-md bg-foreground px-4 py-2 text-sm text-background"
          >
            Filter
          </button>
          <Link
            href="/admin/products"
            className="self-end rounded-md border border-[var(--line)] px-4 py-2 text-center text-sm"
          >
            Clear
          </Link>
        </form>
      </div>

      <AdminTableSection
        title={`PRODUCTS (${totalProducts})`}
        meta={totalPages > 1 ? `Page ${currentPage} of ${totalPages}` : null}
      >
        {products.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] border-collapse text-left text-sm">
              <thead className="bg-[var(--product-image-background)] text-xs uppercase tracking-wide text-[var(--font-color)]">
                <tr>
                  <th className="px-4 py-3 font-medium">Product</th>
                  <th className="px-4 py-3 font-medium">Category</th>
                  <th className="px-4 py-3 font-medium">Brand</th>
                  <th className="px-4 py-3 font-medium">Price</th>
                  <th className="w-[7rem] px-4 py-3 font-medium">Status</th>
                  <th className="w-[12rem] px-4 py-3 text-center font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => {
                  const selectedHref = editorView
                    ? buildAdminProductsHref({ ...listQuery, view: product.id })
                    : buildAdminProductsHref({ ...listQuery, edit: product.id });

                  return (
                    <tr key={product.id} className="border-t border-[var(--line)] align-top">
                      <td className="px-4 py-3">
                        <p className="font-medium">{product.name}</p>
                        <p className="mt-1 text-xs text-[var(--font-color)]">/{product.slug}</p>
                      </td>
                      <td className="px-4 py-3">{product.category.name}</td>
                      <td className="px-4 py-3">{product.brand}</td>
                      <td className="whitespace-nowrap px-4 py-3">
                        {formatPrice(product.price)} ₫
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge
                          config={VISIBILITY_STATUS[product.status]}
                          className="min-w-[5rem]"
                        />
                      </td>
                      <td className="px-4 py-3 text-center">
                        <AdminTableActions wrap={false}>
                          {editorView ? (
                            <AdminActionLink href={selectedHref} aria-haspopup="dialog">
                              View
                            </AdminActionLink>
                          ) : (
                            <>
                              <AdminActionLink href={selectedHref} aria-haspopup="dialog">
                                Edit
                              </AdminActionLink>
                              <form action={toggleProductVisibility.bind(null, product.id)}>
                                <AdminActionButton
                                  type="submit"
                                  className="w-[6rem] whitespace-nowrap"
                                >
                                  {product.status === visibilityStatus.VISIBLE ? 'Ẩn' : 'Hiển thị'}
                                </AdminActionButton>
                              </form>
                            </>
                          )}
                        </AdminTableActions>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <AdminTableEmpty>No products match this filter.</AdminTableEmpty>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--line)] px-4 py-3 text-sm">
          <p className="text-[var(--font-color)]">
            {totalProducts === 0
              ? 'No products to show'
              : `Showing ${firstItem}–${lastItem} of ${totalProducts}`}
          </p>
          {totalPages > 1 ? (
            <nav aria-label="Product list pagination" className="flex flex-wrap items-center gap-1">
              <PaginationLink
                href={buildAdminProductsHref({ ...listQuery, page: currentPage - 1 })}
                disabled={currentPage <= 1}
              >
                Previous
              </PaginationLink>
              {getPaginationItems(currentPage, totalPages).map((item, index) =>
                item === 'ellipsis' ? (
                  <span
                    key={`ellipsis-${index}`}
                    aria-hidden="true"
                    className="px-2 text-[var(--font-color)]"
                  >
                    …
                  </span>
                ) : (
                  <PaginationLink
                    key={item}
                    href={buildAdminProductsHref({ ...listQuery, page: item })}
                    active={item === currentPage}
                  >
                    {item}
                  </PaginationLink>
                ),
              )}
              <PaginationLink
                href={buildAdminProductsHref({ ...listQuery, page: currentPage + 1 })}
                disabled={currentPage >= totalPages}
              >
                Next
              </PaginationLink>
            </nav>
          ) : null}
        </div>
      </AdminTableSection>

      {saved ? (
        <SavedNotice message="Product saved." dismissHref={buildAdminProductsHref(listQuery)} />
      ) : null}

      {dialog ? (
        <ProductFormDialog
          values={dialog.values}
          categories={categories}
          productName={dialog.productName}
          editorView={editorView}
          canEditPrice={canEditPrice}
          closeHref={dialog.closeHref}
          images={dialog.images}
        />
      ) : null}
    </div>
  );
}

function PaginationLink({
  href,
  children,
  active = false,
  disabled = false,
}: {
  href: string;
  children: React.ReactNode;
  active?: boolean;
  disabled?: boolean;
}) {
  const baseClassName =
    'inline-flex min-w-9 items-center justify-center rounded-md border px-2.5 py-1.5 text-xs font-medium transition';

  if (disabled) {
    return (
      <span
        aria-disabled="true"
        className={`${baseClassName} border-[var(--line)] text-[var(--font-color)] opacity-40`}
      >
        {children}
      </span>
    );
  }

  return (
    <Link
      href={href}
      aria-current={active ? 'page' : undefined}
      className={`${baseClassName} ${
        active
          ? 'border-[var(--underline-color)] bg-[var(--underline-color)] text-white'
          : 'border-[var(--line)] hover:border-[var(--underline-color)] hover:text-[var(--underline-color)]'
      }`}
    >
      {children}
    </Link>
  );
}
