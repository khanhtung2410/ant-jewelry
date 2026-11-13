import { describe, expect, it } from 'vitest';
import {
  canAccessAdmin,
  canEditPrice,
  canManageBlog,
  canManageCategories,
  canManageHeroSlides,
  canManageProducts,
  canManageSettings,
  canManageUsers,
  canViewProducts,
  getPermissionsForRole,
  hasPermission,
} from './permissions';

describe('permissions', () => {
  it('grants ADMIN full admin permissions', () => {
    expect(canAccessAdmin('ADMIN')).toBe(true);
    expect(canViewProducts('ADMIN')).toBe(true);
    expect(canManageProducts('ADMIN')).toBe(true);
    expect(canEditPrice('ADMIN')).toBe(true);
    expect(canManageCategories('ADMIN')).toBe(true);
    expect(canManageBlog('ADMIN')).toBe(true);
    expect(canManageHeroSlides('ADMIN')).toBe(true);
    expect(canManageSettings('ADMIN')).toBe(true);
    expect(canManageUsers('ADMIN')).toBe(true);
  });

  it('lets EDITOR manage products except price and manage content sections', () => {
    expect(canAccessAdmin('EDITOR')).toBe(true);
    expect(canViewProducts('EDITOR')).toBe(true);
    expect(canManageProducts('EDITOR')).toBe(true);
    expect(canEditPrice('EDITOR')).toBe(false);
    expect(canManageCategories('EDITOR')).toBe(true);
    expect(canManageBlog('EDITOR')).toBe(true);
    expect(canManageHeroSlides('EDITOR')).toBe(true);
    expect(canManageSettings('EDITOR')).toBe(false);
    expect(canManageUsers('EDITOR')).toBe(false);
  });

  it('maps role permissions consistently via hasPermission', () => {
    expect(hasPermission('EDITOR', 'products:view')).toBe(true);
    expect(hasPermission('EDITOR', 'products:create')).toBe(false);
    expect(hasPermission('EDITOR', 'products:update')).toBe(true);
    expect(hasPermission('EDITOR', 'products:edit_price')).toBe(false);
    expect(hasPermission('EDITOR', 'settings:manage')).toBe(false);
    expect(hasPermission('EDITOR', 'users:manage')).toBe(false);
    expect(hasPermission('ADMIN', 'settings:manage')).toBe(true);
    expect(hasPermission('ADMIN', 'users:manage')).toBe(true);
  });

  it('returns the configured permission set for each role', () => {
    expect(getPermissionsForRole('ADMIN')).toContain('products:edit_price');
    expect(getPermissionsForRole('ADMIN')).toContain('users:manage');
    expect(getPermissionsForRole('EDITOR')).not.toContain('products:create');
    expect(getPermissionsForRole('EDITOR')).not.toContain('products:edit_price');
    expect(getPermissionsForRole('EDITOR')).not.toContain('products:delete');
    expect(getPermissionsForRole('EDITOR')).not.toContain('users:manage');
    expect(getPermissionsForRole('EDITOR')).not.toContain('settings:manage');
    expect(getPermissionsForRole('EDITOR')).toContain('products:update');
    expect(getPermissionsForRole('EDITOR')).toContain('categories:manage');
    expect(getPermissionsForRole('EDITOR')).toContain('blog:manage');
    expect(getPermissionsForRole('EDITOR')).toContain('hero_slides:manage');
  });
});
