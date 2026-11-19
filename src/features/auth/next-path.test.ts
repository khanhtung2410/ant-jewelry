import { describe, expect, it } from 'vitest';
import { resolveAdminNextPath } from './next-path';

describe('resolveAdminNextPath', () => {
  it('keeps in-site admin paths', () => {
    expect(resolveAdminNextPath('/admin/products')).toBe('/admin/products');
    expect(resolveAdminNextPath('/admin/products?search=ring')).toBe('/admin/products?search=ring');
  });

  it('rejects external, protocol-relative and traversal targets', () => {
    for (const value of [
      'https://evil.com/admin',
      '//evil.com/admin',
      '/admin/../../settings',
      '/admin\\..\\settings',
      '/admin/login?next=/admin/users',
      '/administrator',
      '/admin/path\u0000',
      42,
      null,
    ]) {
      expect(resolveAdminNextPath(value)).toBe('/admin');
    }
  });
});
