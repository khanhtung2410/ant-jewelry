import { describe, expect, it, vi } from 'vitest';
import { ProductPageContent } from './product-page-content';

vi.mock('next/navigation', () => ({
  notFound: () => {
    throw new Error('NOT_FOUND');
  },
}));

describe('ProductPageContent', () => {
  it('returns a 404 for an unknown product slug', async () => {
    await expect(
      ProductPageContent({ params: Promise.resolve({ slug: 'missing-product' }) }),
    ).rejects.toThrow('NOT_FOUND');
  });

  it('returns a 404 for a hidden product slug', async () => {
    await expect(
      ProductPageContent({ params: Promise.resolve({ slug: 'dawn-stud-earrings' }) }),
    ).rejects.toThrow('NOT_FOUND');
  });

  it('renders a visible product', async () => {
    await expect(
      ProductPageContent({ params: Promise.resolve({ slug: 'aurora-band' }) }),
    ).resolves.toBeTruthy();
  });
});
