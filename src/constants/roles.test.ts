import { describe, expect, it } from 'vitest';
import { ROLE_CONFIG, ROLE_OPTIONS, adminRole, getRoleLabel, isAdminRole } from './roles';

describe('roles constants', () => {
  it('guards admin roles', () => {
    expect(isAdminRole(adminRole.ADMIN)).toBe(true);
    expect(isAdminRole(adminRole.EDITOR)).toBe(true);
    expect(isAdminRole('USER')).toBe(false);
    expect(isAdminRole(undefined)).toBe(false);
  });

  it('returns labels for valid roles and falls back to raw value', () => {
    expect(getRoleLabel(adminRole.ADMIN)).toBe(ROLE_CONFIG[adminRole.ADMIN].label);
    expect(getRoleLabel(adminRole.EDITOR)).toBe(ROLE_CONFIG[adminRole.EDITOR].label);
    expect(getRoleLabel('UNKNOWN' as never)).toBe('UNKNOWN');
  });

  it('exports role options in display order with matching labels', () => {
    expect(ROLE_OPTIONS).toEqual([
      { value: adminRole.EDITOR, label: ROLE_CONFIG[adminRole.EDITOR].label },
      { value: adminRole.ADMIN, label: ROLE_CONFIG[adminRole.ADMIN].label },
    ]);
  });
});
