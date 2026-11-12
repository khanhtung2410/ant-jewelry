import { buildSavedRedirect } from '@/features/admin/lib/admin-redirect';

export type AdminBlogHrefOptions = {
  edit?: string;
  create?: boolean;
  saved?: boolean;
};

export function buildAdminBlogHref(options: AdminBlogHrefOptions = {}): string {
  const params = new URLSearchParams();

  if (options.edit) params.set('edit', options.edit);
  if (options.create) params.set('new', '1');
  if (options.saved) params.set('saved', '1');

  const query = params.toString();
  return query ? `/admin/blog?${query}` : '/admin/blog';
}

export function savedBlogRedirect(returnTo: string): string {
  return buildSavedRedirect(returnTo, '/admin/blog');
}
