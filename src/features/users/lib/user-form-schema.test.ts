import { describe, expect, it } from 'vitest';
import { createUserSchema, updateUserAccessSchema } from './user-form-schema';

describe('createUserSchema', () => {
  it('normalizes email and accepts a valid account', () => {
    const parsed = createUserSchema.parse({
      name: '  Content Editor ',
      email: '  Editor@Example.com ',
      password: 'Editor@123',
      role: 'EDITOR',
    });

    expect(parsed.email).toBe('editor@example.com');
    expect(parsed.name).toBe('Content Editor');
    expect(parsed.role).toBe('EDITOR');
  });

  it('rejects short passwords', () => {
    const result = createUserSchema.safeParse({
      name: '',
      email: 'editor@example.com',
      password: 'short',
      role: 'EDITOR',
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toMatch(/at least 8/i);
    }
  });

  it('rejects invalid email addresses and roles', () => {
    const result = createUserSchema.safeParse({
      name: '',
      email: 'not-an-email',
      password: 'Editor@123',
      role: 'OWNER',
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      const fields = result.error.issues.map((issue) => issue.path[0]);
      expect(fields).toContain('email');
      expect(fields).toContain('role');
    }
  });
});

describe('updateUserAccessSchema', () => {
  it('requires a user, a known role, and a boolean lock state', () => {
    expect(
      updateUserAccessSchema.safeParse({ userId: 'user-1', role: 'ADMIN', locked: true }).success,
    ).toBe(true);
    expect(
      updateUserAccessSchema.safeParse({ userId: '', role: 'ADMIN', locked: false }).success,
    ).toBe(false);
    expect(
      updateUserAccessSchema.safeParse({ userId: 'user-1', role: 'OWNER', locked: false }).success,
    ).toBe(false);
  });
});
