'use client';

import Link from 'next/link';
import { useId, useState } from 'react';
import type { Product } from '@/types/domain';
import { ProductCard } from './product-card';

export const CAROUSEL_PAGE_SIZE = 5;

export interface CarouselPage {
  items: Product[];
  page: number;
  totalPages: number;
  hasPrevious: boolean;
  hasNext: boolean;
}

export function getCarouselPage(
  products: Product[],
  requestedPage: number,
  pageSize = CAROUSEL_PAGE_SIZE,
): CarouselPage {
  const totalPages = Math.max(1, Math.ceil(products.length / pageSize));
  const page = Math.min(Math.max(requestedPage, 0), totalPages - 1);
  const start = page * pageSize;

  return {
    items: products.slice(start, start + pageSize),
    page,
    totalPages,
    hasPrevious: page > 0,
    hasNext: page < totalPages - 1,
  };
}

interface CarouselProps {
  title: string;
  products: Product[];
  viewAllHref: string;
  className?: string;
}

export function Carousel({ title, products, viewAllHref, className = '' }: CarouselProps) {
  const headingId = useId();
  const [page, setPage] = useState(0);
  const view = getCarouselPage(products, page);

  return (
    <section aria-labelledby={headingId} className={className}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <h2 id={headingId} className="font-heading text-lg tracking-[0.08em]">
          {title}
        </h2>
        <Link
          href={viewAllHref}
          className="font-heading text-xs uppercase tracking-[0.12em] underline underline-offset-4 transition-colors hover:text-muted"
        >
          VIEW PRODUCTS
        </Link>
      </div>

      {view.items.length > 0 ? (
        <ul className="mt-6 grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-5">
          {view.items.map((product) => (
            <li key={product.product_id}>
              <ProductCard product={product} />
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-6 text-sm text-muted">Chưa có sản phẩm.</p>
      )}

      <div className="mt-8 flex justify-end gap-2">
        <button
          type="button"
          aria-label="Previous products"
          onClick={() => setPage(view.page - 1)}
          disabled={!view.hasPrevious}
          className="inline-flex h-12 w-12 items-center justify-center rounded-full border-2 border-[var(--underline-color)] bg-product-image text-2xl leading-none text-[var(--underline-color)] transition-colors enabled:hover:bg-[var(--underline-color)] enabled:hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--underline-color)] disabled:cursor-not-allowed disabled:border-muted/50 disabled:bg-muted/40 disabled:text-muted"
        >
          <span aria-hidden="true">‹</span>
        </button>
        <button
          type="button"
          aria-label="Next products"
          onClick={() => setPage(view.page + 1)}
          disabled={!view.hasNext}
          className="inline-flex h-12 w-12 items-center justify-center rounded-full border-2 border-[var(--underline-color)] bg-product-image text-2xl leading-none text-[var(--underline-color)] transition-colors enabled:hover:bg-[var(--underline-color)] enabled:hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--underline-color)] disabled:cursor-not-allowed disabled:border-muted/50 disabled:bg-muted/40 disabled:text-muted"
        >
          <span aria-hidden="true">›</span>
        </button>
      </div>
    </section>
  );
}
