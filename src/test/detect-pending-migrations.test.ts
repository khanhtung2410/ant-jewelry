import { describe, expect, it } from 'vitest';
import { hasPendingMigrations } from '../../scripts/detect-pending-migrations.mjs';

describe('hasPendingMigrations', () => {
  it('detects the real Prisma phrase for an unapplied migration', () => {
    const output = [
      'Database schema is not up to date.',
      'Following migration have not yet been applied:',
      '20261118100000_add_product_image_blobs',
    ].join('\n');

    expect(hasPendingMigrations(output)).toBe(true);
  });

  it('detects the plural form of the Prisma phrase', () => {
    const output =
      'Following migrations have not yet been applied:\n20261118100000_first\n20261118100001_second';

    expect(hasPendingMigrations(output)).toBe(true);
  });

  it('treats an up-to-date database as having no pending migrations', () => {
    expect(hasPendingMigrations('Database schema is up to date')).toBe(false);
  });

  it('treats the explicit no-pending message as having no pending migrations', () => {
    expect(hasPendingMigrations('No pending migrations')).toBe(false);
  });

  it('treats empty output as having no pending migrations', () => {
    expect(hasPendingMigrations('')).toBe(false);
  });
});
