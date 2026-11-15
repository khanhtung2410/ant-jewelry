import { beforeEach, describe, expect, it, vi } from 'vitest';
import { revalidateProductPages } from './product-revalidation';

const mocks = vi.hoisted(() => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
}));

vi.mock('next/cache', () => ({
  revalidatePath: mocks.revalidatePath,
  revalidateTag: mocks.revalidateTag,
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe('revalidateProductPages', () => {
  it('marks the products tag stale and revalidates product pages for Server Actions', () => {
    revalidateProductPages();

    expect(mocks.revalidateTag).toHaveBeenCalledWith('products', 'max');
    expect(mocks.revalidatePath).toHaveBeenCalledWith('/admin/products');
    expect(mocks.revalidatePath).toHaveBeenCalledWith('/', 'page');
    expect(mocks.revalidatePath).toHaveBeenCalledWith('/c/[slug]', 'page');
    expect(mocks.revalidatePath).toHaveBeenCalledWith('/p/[slug]', 'page');
  });

  it('expires the products tag immediately for Route Handlers', () => {
    revalidateProductPages({ immediate: true });

    expect(mocks.revalidateTag).toHaveBeenCalledWith('products', { expire: 0 });
  });
});
