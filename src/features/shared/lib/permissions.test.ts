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

  it('limits EDITOR to read-only products and blog management', () => {
    expect(canAccessAdmin('EDITOR')).toBe(true);
    expect(canViewProducts('EDITOR')).toBe(true);
    expect(canManageProducts('EDITOR')).toBe(false);
    expect(canEditPrice('EDITOR')).toBe(false);
    expect(canManageCategories('EDITOR')).toBe(false);
    expect(canManageBlog('EDITOR')).toBe(true);
    expect(canManageHeroSlides('EDITOR')).toBe(false);
    expect(canManageSettings('EDITOR')).toBe(false);
    expect(canManageUsers('EDITOR')).toBe(false);
  });

  it('maps role permissions consistently via hasPermission', () => {
    expect(hasPermission('EDITOR', 'products:view')).toBe(true);
    expect(hasPermission('EDITOR', 'products:update')).toBe(false);
    expect(hasPermission('EDITOR', 'products:edit_price')).toBe(false);
    expect(hasPermission('EDITOR', 'settings:manage')).toBe(false);
    expect(hasPermission('EDITOR', 'users:manage')).toBe(false);
    expect(hasPermission('ADMIN', 'settings:manage')).toBe(true);
    expect(hasPermission('ADMIN', 'users:manage')).toBe(true);
  });

  it('returns the configured permission set for each role', () => {
    expect(getPermissionsForRole('ADMIN')).toContain('products:edit_price');
    expect(getPermissionsForRole('ADMIN')).toContain('users:manage');
    expect(getPermissionsForRole('EDITOR')).not.toContain('products:edit_price');
    expect(getPermissionsForRole('EDITOR')).not.toContain('products:update');
    expect(getPermissionsForRole('EDITOR')).not.toContain('users:manage');
    expect(getPermissionsForRole('EDITOR')).not.toContain('settings:manage');
  });
});
