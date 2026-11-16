import type { ProductCardData } from '@/features/shared/domain/domain';
import { createVndPrice } from '@/features/shared/domain/domain';
import { describe, expect, it } from 'vitest';
import { appendProductCardPage } from './category-product-pagination';

function product(id: string): ProductCardData {
  return {
    product_id: id,
    name: `Product ${id}`,
    slug: `product-${id}`,
    price: createVndPrice(1_000_000),
    colors: [],
    images: [],
  };
}

describe('appendProductCardPage', () => {
  it('keeps the current cards and appends the next server page in order', () => {
    const merged = appendProductCardPage(
      [product('a'), product('b')],
      [product('c'), product('d')],
    );

    expect(merged.map((item) => item.product_id)).toEqual(['a', 'b', 'c', 'd']);
  });

  it('ignores products that are already rendered', () => {
    const merged = appendProductCardPage(
      [product('a'), product('b')],
      [product('b'), product('c')],
    );

    expect(merged.map((item) => item.product_id)).toEqual(['a', 'b', 'c']);
  });

  it('returns the current list unchanged when the page is empty', () => {
    const current = [product('a')];

    expect(appendProductCardPage(current, [])).toEqual(current);
  });
});
