import { describe, expect, it, vi } from 'vitest';
import { CategoryPageContent } from './category-page-content';

vi.mock('next/navigation', () => ({
  notFound: () => {
    throw new Error('NOT_FOUND');
  },
  redirect: (url: string) => {
    throw new Error(`REDIRECT:${url}`);
  },
  useRouter: () => ({ push: vi.fn() }),
}));

describe('CategoryPageContent', () => {
  it('redirects an invalid sort value to the default sort in the URL', async () => {
    await expect(
      CategoryPageContent({
        params: Promise.resolve({ slug: 'wedding-ring' }),
        searchParams: Promise.resolve({ sort: 'invalid' }),
      }),
    ).rejects.toThrow('REDIRECT:/c/wedding-ring?sort=price_asc');
  });

  it('returns a 404 for an unknown category slug', async () => {
    await expect(
      CategoryPageContent({
        params: Promise.resolve({ slug: 'missing-category' }),
        searchParams: Promise.resolve({}),
      }),
    ).rejects.toThrow('NOT_FOUND');
  });
});
