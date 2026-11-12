import type { Role } from '@/features/shared/domain/domain';
import type { StatusConfig } from './statuses';

export const adminRole = {
  ADMIN: 'ADMIN',
  EDITOR: 'EDITOR',
} as const;

export type AdminRoleType = (typeof adminRole)[keyof typeof adminRole];

export const ROLE_CONFIG: Record<AdminRoleType, StatusConfig> = {
  [adminRole.ADMIN]: { label: 'Quản trị viên', bg: '#DBEAFE', color: '#1E40AF' },
  [adminRole.EDITOR]: { label: 'Biên tập viên', bg: '#F1F5F9', color: '#334155' },
};

export const ROLE_OPTIONS: ReadonlyArray<{ value: AdminRoleType; label: string }> = [
  { value: adminRole.EDITOR, label: ROLE_CONFIG[adminRole.EDITOR].label },
  { value: adminRole.ADMIN, label: ROLE_CONFIG[adminRole.ADMIN].label },
];

export function isAdminRole(value: unknown): value is AdminRoleType {
  return value === adminRole.ADMIN || value === adminRole.EDITOR;
}

export function getRoleLabel(role: Role): string {
  return ROLE_CONFIG[role]?.label ?? role;
}
