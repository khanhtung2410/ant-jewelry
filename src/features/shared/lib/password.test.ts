import bcrypt from 'bcryptjs';
import { describe, expect, it } from 'vitest';
import { BCRYPT_COST, DUMMY_PASSWORD_HASH } from './password';

describe('shared bcrypt cost', () => {
  it('generates the login dummy hash at the shared cost', () => {
    expect(bcrypt.getRounds(DUMMY_PASSWORD_HASH)).toBe(BCRYPT_COST);
  });

  it('hashes new passwords at the shared cost', async () => {
    const hash = await bcrypt.hash('Example@123', BCRYPT_COST);
    expect(bcrypt.getRounds(hash)).toBe(BCRYPT_COST);
    await expect(bcrypt.compare('Example@123', hash)).resolves.toBe(true);
  });

  it('never matches the dummy hash', async () => {
    await expect(bcrypt.compare('anything', DUMMY_PASSWORD_HASH)).resolves.toBe(false);
  });
});
