'use client';

import { useId, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { ProductSort } from '@/features/shared/queries';
import type { Product } from '@/features/shared/domain/domain';
import { ChevronDownIcon } from '@/features/layout/components/icons';
import { ProductCard } from './product-card';
import { ActionButton } from '@/features/layout/components/action-button';

const INITIAL_PRODUCT_COUNT = 10;
const PRODUCT_BATCH_SIZE = 10;

export function getNextVisibleProductCount(currentCount: number, totalCount: number): number {
  return Math.min(currentCount + PRODUCT_BATCH_SIZE, totalCount);
}

interface CategoryProductListingProps {
  categoryName: string;
  categorySlug: string;
  products: Product[];
  sort: ProductSort;
}

const sortOptions: { value: ProductSort; label: string }[] = [
  { value: 'price_asc', label: 'Price, Low to High' },
  { value: 'price_desc', label: 'Price, High to Low' },
  { value: 'name_asc', label: 'Name, A to Z' },
  { value: 'name_desc', label: 'Name, Z to A' },
];

export function CategoryProductListing({
  categoryName,
  categorySlug,
  products,
  sort,
}: CategoryProductListingProps) {
  const router = useRouter();
  const sortId = useId();
  const [visibleCount, setVisibleCount] = useState(INITIAL_PRODUCT_COUNT);
  const visibleProducts = products.slice(0, visibleCount);

  function handleSortChange(value: ProductSort) {
    router.push(`/c/${encodeURIComponent(categorySlug)}?sort=${value}`, { scroll: false });
  }

  return (
    <section aria-labelledby="category-title">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h1
          id="category-title"
          className="font-heading text-base font-semibold tracking-[0.08em] sm:text-lg"
        >
          {categoryName}
        </h1>

        <div className="relative">
          <label htmlFor={sortId} className="sr-only">
            Sort by
          </label>
          <select
            id={sortId}
            aria-label="Sort by"
            value={sort}
            onChange={(event) => {
              const selectedOption = sortOptions.find(
                (option) => option.value === event.currentTarget.value,
              );

              if (selectedOption) {
                handleSortChange(selectedOption.value);
              }
            }}
            className="min-w-52 appearance-none rounded-full border border-line bg-white py-2 pl-4 pr-10 text-sm text-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--control-outline)]"
          >
            {sortOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <ChevronDownIcon className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--underline-color)]" />
        </div>
      </div>

      {visibleProducts.length > 0 ? (
        <ul className="grid grid-cols-2 gap-x-4 gap-y-8 lg:grid-cols-5">
          {visibleProducts.map((product) => (
            <li key={product.product_id}>
              <ProductCard product={product} />
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted">No products in this category yet.</p>
      )}

      {visibleCount < products.length ? (
        <div className="mt-10 flex justify-center">
          <ActionButton
            onClick={() =>
              setVisibleCount((currentCount) =>
                getNextVisibleProductCount(currentCount, products.length),
              )
            }
          >
            SEE MORE
          </ActionButton>
        </div>
      ) : null}
    </section>
  );
}
