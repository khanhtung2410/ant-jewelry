import type { Role } from '@/features/shared/domain/domain';

export type AdminPermission =
  | 'products:view'
  | 'products:create'
  | 'products:update'
  | 'products:delete'
  | 'products:edit_price'
  | 'categories:manage'
  | 'blog:manage'
  | 'hero_slides:manage'
  | 'settings:manage'
  | 'users:manage';

const ADMIN_PERMISSIONS = new Set<AdminPermission>([
  'products:view',
  'products:create',
  'products:update',
  'products:delete',
  'products:edit_price',
  'categories:manage',
  'blog:manage',
  'hero_slides:manage',
  'settings:manage',
  'users:manage',
]);

const EDITOR_PERMISSIONS = new Set<AdminPermission>([
  'products:view',
  'products:create',
  'products:update',
  'categories:manage',
  'blog:manage',
  'hero_slides:manage',
]);

export const ROLE_PERMISSIONS: Record<Role, readonly AdminPermission[]> = {
  ADMIN: [...ADMIN_PERMISSIONS],
  EDITOR: [...EDITOR_PERMISSIONS],
};

export function hasPermission(role: Role, permission: AdminPermission): boolean {
  return ROLE_PERMISSIONS[role].includes(permission);
}

export function canAccessAdmin(role: Role): boolean {
  return role === 'ADMIN' || role === 'EDITOR';
}

export function canManageProducts(role: Role): boolean {
  return hasPermission(role, 'products:update');
}

export function canViewProducts(role: Role): boolean {
  return hasPermission(role, 'products:view');
}

export function canEditPrice(role: Role): boolean {
  return hasPermission(role, 'products:edit_price');
}

export function canManageCategories(role: Role): boolean {
  return hasPermission(role, 'categories:manage');
}

export function canManageBlog(role: Role): boolean {
  return hasPermission(role, 'blog:manage');
}

export function canManageHeroSlides(role: Role): boolean {
  return hasPermission(role, 'hero_slides:manage');
}

export function canManageSettings(role: Role): boolean {
  return hasPermission(role, 'settings:manage');
}

export function canManageUsers(role: Role): boolean {
  return hasPermission(role, 'users:manage');
}

export function getPermissionsForRole(role: Role): readonly AdminPermission[] {
  return ROLE_PERMISSIONS[role];
}
