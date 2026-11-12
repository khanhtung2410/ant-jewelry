import { describe, expect, it } from 'vitest';
import {
  buildAdminProductsHref,
  getPaginationItems,
  resolveAdminProductsPage,
  savedProductsRedirect,
} from './admin-product-list';

describe('buildAdminProductsHref', () => {
  it('returns the bare list URL when no options are provided', () => {
    expect(buildAdminProductsHref()).toBe('/admin/products');
  });

  it('keeps search, category, and a non-first page', () => {
    const href = buildAdminProductsHref({ search: ' ring ', category: 'cat-1', page: 3 });

    expect(href).toBe('/admin/products?search=ring&category=cat-1&page=3');
  });

  it('omits page 1 and empty filters', () => {
    expect(buildAdminProductsHref({ search: '  ', category: '', page: 1 })).toBe('/admin/products');
  });

  it('adds dialog and status parameters', () => {
    expect(buildAdminProductsHref({ page: 2, edit: 'p-1' })).toBe(
      '/admin/products?page=2&edit=p-1',
    );
    expect(buildAdminProductsHref({ create: true })).toBe('/admin/products?new=1');
    expect(buildAdminProductsHref({ view: 'p-2' })).toBe('/admin/products?view=p-2');
    expect(buildAdminProductsHref({ saved: true })).toBe('/admin/products?saved=1');
  });
});

describe('resolveAdminProductsPage', () => {
  it('clamps invalid and out-of-range page numbers', () => {
    expect(resolveAdminProductsPage(undefined, 20)).toEqual({
      page: 1,
      totalPages: 3,
      firstItem: 1,
      lastItem: 8,
    });
    expect(resolveAdminProductsPage('abc', 20).page).toBe(1);
    expect(resolveAdminProductsPage('-2', 20).page).toBe(1);
    expect(resolveAdminProductsPage('99', 20).page).toBe(3);
  });

  it('reports the visible item range for the current page', () => {
    expect(resolveAdminProductsPage(2, 20)).toEqual({
      page: 2,
      totalPages: 3,
      firstItem: 9,
      lastItem: 16,
    });
  });

  it('handles an empty result set', () => {
    expect(resolveAdminProductsPage(1, 0)).toEqual({
      page: 1,
      totalPages: 1,
      firstItem: 0,
      lastItem: 0,
    });
  });
});

describe('getPaginationItems', () => {
  it('lists every page when there are at most seven', () => {
    expect(getPaginationItems(1, 1)).toEqual([1]);
    expect(getPaginationItems(3, 7)).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });

  it('adds ellipses around the current page for long ranges', () => {
    expect(getPaginationItems(1, 10)).toEqual([1, 2, 'ellipsis', 10]);
    expect(getPaginationItems(5, 10)).toEqual([1, 'ellipsis', 4, 5, 6, 'ellipsis', 10]);
    expect(getPaginationItems(10, 10)).toEqual([1, 'ellipsis', 9, 10]);
  });
});

describe('savedProductsRedirect', () => {
  it('returns to the list and clears the dialog parameters', () => {
    const result = savedProductsRedirect('/admin/products?search=ring&page=2&edit=p-1&saved=1');

    expect(result).toBe('/admin/products?search=ring&page=2&saved=1');
  });

  it('falls back to the default list for unexpected targets', () => {
    expect(savedProductsRedirect('https://example.com/evil')).toBe('/admin/products?saved=1');
    expect(savedProductsRedirect('')).toBe('/admin/products?saved=1');
  });
});
