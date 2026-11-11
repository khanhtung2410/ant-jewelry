'use client';

import Link from 'next/link';
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

type Props = {
  products: AdminProductRow[];
  categories: ProductCategoryOption[];
  totalProducts: number;
  currentPage: number;
  totalPages: number;
  search: string;
  categoryFilter: string;
  editorView: boolean;
  saved: boolean;
  dialog: {
    values: ProductFormValues;
    productName: string | null;
    closeHref: string;
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

      <section className="overflow-hidden rounded-lg border border-[var(--line)]">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--line)] px-4 py-3">
          <h2 className="font-heading text-sm tracking-[0.08em]">PRODUCTS ({totalProducts})</h2>
          {totalPages > 1 ? (
            <p className="text-xs text-[var(--font-color)]">
              Page {currentPage} of {totalPages}
            </p>
          ) : null}
        </div>

        {products.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] border-collapse text-left text-sm">
              <thead className="bg-[var(--product-image-background)] text-xs uppercase tracking-wide text-[var(--font-color)]">
                <tr>
                  <th className="px-4 py-3 font-medium">Product</th>
                  <th className="px-4 py-3 font-medium">Category</th>
                  <th className="px-4 py-3 font-medium">Brand</th>
                  <th className="px-4 py-3 font-medium">Price</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Actions</th>
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
                        <span
                          className={
                            product.status === 'VISIBLE'
                              ? 'rounded-full bg-emerald-50 px-2 py-1 text-xs text-emerald-800'
                              : 'rounded-full bg-stone-100 px-2 py-1 text-xs text-stone-700'
                          }
                        >
                          {product.status === 'VISIBLE' ? 'Published' : 'Hidden'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap items-center gap-3">
                          {editorView ? (
                            <Link
                              href={selectedHref}
                              aria-haspopup="dialog"
                              className="rounded-md border border-[var(--line)] px-3 py-1.5 text-xs font-medium transition hover:border-[var(--underline-color)] hover:text-[var(--underline-color)]"
                            >
                              View
                            </Link>
                          ) : (
                            <>
                              <Link
                                href={selectedHref}
                                aria-haspopup="dialog"
                                className="rounded-md border border-[var(--line)] px-3 py-1.5 text-xs font-medium transition hover:border-[var(--underline-color)] hover:text-[var(--underline-color)]"
                              >
                                Edit
                              </Link>
                              <form action={toggleProductVisibility.bind(null, product.id)}>
                                <button
                                  type="submit"
                                  className="whitespace-nowrap text-xs underline underline-offset-2"
                                >
                                  {product.status === 'VISIBLE' ? 'Hide' : 'Publish'}
                                </button>
                              </form>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="px-4 py-8 text-sm text-[var(--font-color)]">
            No products match this filter.
          </p>
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
      </section>

      {saved ? (
        <p role="status" className="mt-4 flex items-center gap-3 text-sm text-emerald-800">
          Product saved.
          <Link href={buildAdminProductsHref(listQuery)} className="underline underline-offset-2">
            Dismiss
          </Link>
        </p>
      ) : null}

      {dialog ? (
        <ProductFormDialog
          values={dialog.values}
          categories={categories}
          productName={dialog.productName}
          editorView={editorView}
          closeHref={dialog.closeHref}
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
