'use client';

import { useId, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import type { ProductSort } from '@/features/shared/queries';
import type { ProductCardData } from '@/features/shared/domain/domain';
import { ChevronDownIcon } from '@/features/layout/components/icons';
import { loadMoreCategoryProducts } from '@/features/products/actions/category-products';
import { PRODUCT_CARD_PAGE_SIZE } from '@/features/products/lib/product-card-page';
import { ProductCard } from './product-card';
import { ActionButton } from '@/features/layout/components/action-button';

interface CategoryProductListingProps {
  categoryName: string;
  categorySlug: string;
  products: ProductCardData[];
  hasMore: boolean;
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
  products: initialProducts,
  hasMore: initialHasMore,
  sort,
}: CategoryProductListingProps) {
  const router = useRouter();
  const sortId = useId();
  const [products, setProducts] = useState(initialProducts);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isLoading, startTransition] = useTransition();

  function handleSortChange(value: ProductSort) {
    router.push(`/c/${encodeURIComponent(categorySlug)}?sort=${value}`, { scroll: false });
  }

  function handleSeeMore() {
    setLoadError(null);
    startTransition(async () => {
      try {
        const nextPage = await loadMoreCategoryProducts({
          categorySlug,
          sort,
          offset: products.length,
          limit: PRODUCT_CARD_PAGE_SIZE,
        });
        setProducts((current) => [...current, ...nextPage.products]);
        setHasMore(nextPage.hasMore);
      } catch {
        setLoadError('Could not load more products. Please try again.');
      }
    });
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

      {products.length > 0 ? (
        <ul className="grid grid-cols-2 gap-x-4 gap-y-8 lg:grid-cols-5">
          {products.map((product) => (
            <li key={product.product_id}>
              <ProductCard product={product} />
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted">No products in this category yet.</p>
      )}

      {loadError ? (
        <p role="alert" className="mt-6 text-center text-sm text-red-700">
          {loadError}
        </p>
      ) : null}

      {hasMore ? (
        <div className="mt-10 flex justify-center">
          <ActionButton
            onClick={handleSeeMore}
            disabled={isLoading}
            ariaLabel={isLoading ? 'Loading more products' : 'See more products'}
          >
            {isLoading ? 'LOADING...' : 'SEE MORE'}
          </ActionButton>
        </div>
      ) : null}
    </section>
  );
}
