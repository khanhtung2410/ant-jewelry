import { buildSavedRedirect } from '@/features/admin/lib/admin-redirect';

export type AdminCategoriesHrefOptions = {
  edit?: string;
  create?: boolean;
  saved?: boolean;
};

export function buildAdminCategoriesHref(options: AdminCategoriesHrefOptions = {}): string {
  const params = new URLSearchParams();

  if (options.edit) params.set('edit', options.edit);
  if (options.create) params.set('new', '1');
  if (options.saved) params.set('saved', '1');

  const query = params.toString();
  return query ? `/admin/categories?${query}` : '/admin/categories';
}

export function savedCategoriesRedirect(returnTo: string): string {
  return buildSavedRedirect(returnTo, '/admin/categories');
}
