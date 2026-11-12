import { describe, expect, it } from 'vitest';
import { buildAdminBlogHref, savedBlogRedirect } from '@/features/blog/lib/admin-blog-list';
import { buildAdminHeroSlidesHref, savedHeroSlidesRedirect } from './admin-hero-list';

describe('admin blog and hero hrefs', () => {
  it('builds dialog URLs and omits empty values', () => {
    expect(buildAdminBlogHref()).toBe('/admin/blog');
    expect(buildAdminBlogHref({ edit: 'post-1' })).toBe('/admin/blog?edit=post-1');
    expect(buildAdminBlogHref({ create: true, saved: true })).toBe('/admin/blog?new=1&saved=1');

    expect(buildAdminHeroSlidesHref()).toBe('/admin/hero-slides');
    expect(buildAdminHeroSlidesHref({ edit: 'slide-1' })).toBe('/admin/hero-slides?edit=slide-1');
  });

  it('redirects back to the list and clears dialog parameters', () => {
    expect(savedBlogRedirect('/admin/blog?edit=post-1&saved=1')).toBe('/admin/blog?saved=1');
    expect(savedBlogRedirect('https://example.com/evil')).toBe('/admin/blog?saved=1');

    expect(savedHeroSlidesRedirect('/admin/hero-slides?new=1&edit=slide-1')).toBe(
      '/admin/hero-slides?saved=1',
    );
    expect(savedHeroSlidesRedirect('')).toBe('/admin/hero-slides?saved=1');
  });
});
