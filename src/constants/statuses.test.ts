import { describe, expect, it, vi } from 'vitest';
import { adminRole } from './roles';
import {
  ACCOUNT_STATUS_CONFIG,
  BLOG_POST_STATUS,
  UNKNOWN_STATUS_CONFIG,
  VISIBILITY_STATUS,
  accountStatus,
  getAccountStatusConfig,
  isPublishStatus,
  isVisibilityStatus,
  publishStatus,
  visibilityStatus,
} from './statuses';

describe('statuses constants', () => {
  it('guards visibility statuses', () => {
    expect(isVisibilityStatus(visibilityStatus.VISIBLE)).toBe(true);
    expect(isVisibilityStatus(visibilityStatus.HIDDEN)).toBe(true);
    expect(isVisibilityStatus('INVALID')).toBe(false);
    expect(isVisibilityStatus(null)).toBe(false);
  });

  it('guards publish statuses', () => {
    expect(isPublishStatus(publishStatus.DRAFT)).toBe(true);
    expect(isPublishStatus(publishStatus.PUBLISHED)).toBe(true);
    expect(isPublishStatus('VISIBLE')).toBe(false);
  });

  it('returns account status config for locked and active users', () => {
    expect(getAccountStatusConfig(true)).toEqual(ACCOUNT_STATUS_CONFIG[accountStatus.LOCKED]);
    expect(getAccountStatusConfig(false)).toEqual(ACCOUNT_STATUS_CONFIG[accountStatus.ACTIVE]);
  });

  it('falls back to unknown config for unknown visibility status keys', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(VISIBILITY_STATUS['NOT_A_STATUS' as never]).toEqual(UNKNOWN_STATUS_CONFIG);
    expect(BLOG_POST_STATUS['NOT_A_STATUS' as never]).toEqual(UNKNOWN_STATUS_CONFIG);
    warn.mockRestore();
  });

  it('stays quiet when Fast Refresh inspects the config objects', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(VISIBILITY_STATUS['$$typeof' as never]).toBeUndefined();
    expect(VISIBILITY_STATUS['then' as never]).toBeUndefined();
    expect(warn).not.toHaveBeenCalled();
    warn.mockRestore();
  });

  it('keeps role values distinct from status constants context', () => {
    expect(isVisibilityStatus(adminRole.ADMIN)).toBe(false);
  });
});
