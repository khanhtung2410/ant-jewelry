export const ADMIN_PRODUCTS_PAGE_SIZE = 8;

export type AdminProductsQuery = {
  search?: string;
  category?: string;
  page?: number;
};

export type AdminProductsHrefOptions = AdminProductsQuery & {
  edit?: string;
  view?: string;
  create?: boolean;
  saved?: boolean;
};

export function buildAdminProductsHref(options: AdminProductsHrefOptions = {}): string {
  const params = new URLSearchParams();
  const search = options.search?.trim();

  if (search) params.set('search', search);
  if (options.category) params.set('category', options.category);
  if (options.page && options.page > 1) params.set('page', String(Math.floor(options.page)));
  if (options.edit) params.set('edit', options.edit);
  if (options.view) params.set('view', options.view);
  if (options.create) params.set('new', '1');
  if (options.saved) params.set('saved', '1');

  const query = params.toString();
  return query ? `/admin/products?${query}` : '/admin/products';
}

export function resolveAdminProductsPage(
  rawPage: string | number | undefined,
  totalItems: number,
  pageSize = ADMIN_PRODUCTS_PAGE_SIZE,
): { page: number; totalPages: number; firstItem: number; lastItem: number } {
  const safeTotal = Math.max(0, totalItems);
  const totalPages = Math.max(1, Math.ceil(safeTotal / pageSize));
  const parsed = typeof rawPage === 'number' ? rawPage : Number(rawPage);
  const requested = Number.isFinite(parsed) && parsed >= 1 ? Math.floor(parsed) : 1;
  const page = Math.min(requested, totalPages);

  return {
    page,
    totalPages,
    firstItem: safeTotal === 0 ? 0 : (page - 1) * pageSize + 1,
    lastItem: Math.min(page * pageSize, safeTotal),
  };
}

export type PaginationItem = number | 'ellipsis';

export function getPaginationItems(currentPage: number, totalPages: number): PaginationItem[] {
  if (totalPages <= 0) return [];
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const items: PaginationItem[] = [1];
  const start = Math.max(2, currentPage - 1);
  const end = Math.min(totalPages - 1, currentPage + 1);

  if (start > 2) items.push('ellipsis');
  for (let page = start; page <= end; page += 1) items.push(page);
  if (end < totalPages - 1) items.push('ellipsis');
  items.push(totalPages);

  return items;
}

export function savedProductsRedirect(returnTo: string): string {
  const fallback = buildAdminProductsHref({ saved: true });

  try {
    const url = new URL(returnTo, 'http://localhost');
    if (url.pathname !== '/admin/products') return fallback;

    url.searchParams.delete('edit');
    url.searchParams.delete('view');
    url.searchParams.delete('new');
    url.searchParams.set('saved', '1');

    return `${url.pathname}?${url.searchParams.toString()}`;
  } catch {
    return fallback;
  }
}
