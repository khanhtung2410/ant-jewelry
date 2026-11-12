import { buildSavedRedirect } from '@/features/admin/lib/admin-redirect';

export type AdminHeroSlidesHrefOptions = {
  edit?: string;
  create?: boolean;
  saved?: boolean;
};

export function buildAdminHeroSlidesHref(options: AdminHeroSlidesHrefOptions = {}): string {
  const params = new URLSearchParams();

  if (options.edit) params.set('edit', options.edit);
  if (options.create) params.set('new', '1');
  if (options.saved) params.set('saved', '1');

  const query = params.toString();
  return query ? `/admin/hero-slides?${query}` : '/admin/hero-slides';
}

export function savedHeroSlidesRedirect(returnTo: string): string {
  return buildSavedRedirect(returnTo, '/admin/hero-slides');
}
