import { describe, expect, it } from 'vitest';
import { buildAdminRedirect, buildSavedRedirect } from './admin-redirect';

describe('buildAdminRedirect', () => {
  it('keeps an in-site return target and its query', () => {
    expect(
      buildAdminRedirect('/admin/products?search=ring', '/admin/products', { edit: null }),
    ).toBe('/admin/products?search=ring');
  });

  it('falls back to the allowed path for external and protocol-relative URLs', () => {
    for (const returnTo of [
      'https://evil.example/admin/products',
      '//evil.example/admin/products',
      'javascript:alert(1)',
      '/admin/users',
    ]) {
      expect(buildAdminRedirect(returnTo, '/admin/products', {})).toBe('/admin/products');
    }
  });

  it('applies param overrides and strips removed keys', () => {
    expect(
      buildAdminRedirect('/admin/blog?saved=1&edit=abc', '/admin/blog', {
        edit: null,
        saved: '1',
      }),
    ).toBe('/admin/blog?saved=1');
  });
});

describe('buildSavedRedirect', () => {
  it('always returns the allowed admin path with saved=1', () => {
    expect(buildSavedRedirect('//evil.example', '/admin/categories')).toBe(
      '/admin/categories?saved=1',
    );
  });
});
