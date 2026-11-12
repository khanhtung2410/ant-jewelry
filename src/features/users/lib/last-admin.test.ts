import { describe, expect, it } from 'vitest';
import { wouldRemoveLastActiveAdmin } from './last-admin';

const activeAdmin = { role: 'ADMIN' as const, locked: false };
const activeEditor = { role: 'EDITOR' as const, locked: false };

describe('wouldRemoveLastActiveAdmin', () => {
  it('blocks demoting the last active ADMIN', () => {
    expect(
      wouldRemoveLastActiveAdmin({
        current: activeAdmin,
        next: activeEditor,
        otherActiveAdminCount: 0,
      }),
    ).toBe(true);
  });

  it('blocks locking the last active ADMIN', () => {
    expect(
      wouldRemoveLastActiveAdmin({
        current: activeAdmin,
        next: { role: 'ADMIN', locked: true },
        otherActiveAdminCount: 0,
      }),
    ).toBe(true);
  });

  it('allows changing an ADMIN when another active ADMIN remains', () => {
    expect(
      wouldRemoveLastActiveAdmin({
        current: activeAdmin,
        next: activeEditor,
        otherActiveAdminCount: 1,
      }),
    ).toBe(false);
  });

  it('ignores users who are not active ADMINs', () => {
    expect(
      wouldRemoveLastActiveAdmin({
        current: activeEditor,
        next: { role: 'EDITOR', locked: true },
        otherActiveAdminCount: 0,
      }),
    ).toBe(false);
    expect(
      wouldRemoveLastActiveAdmin({
        current: { role: 'ADMIN', locked: true },
        next: activeEditor,
        otherActiveAdminCount: 0,
      }),
    ).toBe(false);
  });

  it('allows access changes that keep the ADMIN active', () => {
    expect(
      wouldRemoveLastActiveAdmin({
        current: activeAdmin,
        next: { role: 'ADMIN', locked: false },
        otherActiveAdminCount: 0,
      }),
    ).toBe(false);
  });
});
