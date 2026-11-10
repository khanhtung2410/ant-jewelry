'use client';

import Link from 'next/link';
import { useId, useRef } from 'react';
import type { Product } from '@/types/domain';
import { ArrowButton } from './arrow-button';
import { ProductCard } from './product-card';

// Keeping these exports in case they are used elsewhere in your app
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
  const scrollRef = useRef<HTMLUListElement>(null);

  // Function to slide exactly 1 product left or right
  const handleScroll = (direction: 'next' | 'prev') => {
    const container = scrollRef.current;
    if (!container) return;

    const firstItem = container.firstElementChild as HTMLElement;
    if (!firstItem) return;

    // Calculate the exact width of one item + the gap
    const itemWidth = firstItem.getBoundingClientRect().width;
    const gap = parseFloat(window.getComputedStyle(container).gap || '0');
    const scrollAmount = itemWidth + gap;

    if (direction === 'next') {
      // If we are at the end, loop back to the start
      if (container.scrollLeft + container.clientWidth >= container.scrollWidth - 10) {
        container.scrollTo({ left: 0, behavior: 'smooth' });
      } else {
        container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
      }
    } else {
      // If we are at the start, loop to the end
      if (container.scrollLeft <= 10) {
        container.scrollTo({ left: container.scrollWidth, behavior: 'smooth' });
      } else {
        container.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
      }
    }
  };

  return (
    <section aria-labelledby={headingId} className={className}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <h2 id={headingId} className="font-heading text-lg tracking-[0.08em]">
          {title}
        </h2>
        <Link
          href={viewAllHref}
          className="font-heading text-xs uppercase tracking-[0.12em] underline-offset-4 decoration-2 transition-colors hover:underline hover:decoration-[var(--underline-color)]"
        >
          VIEW PRODUCTS
        </Link>
      </div>

      {products.length > 0 ? (
        <ul
          ref={scrollRef}
          /*
            - snap-x snap-mandatory: enables native CSS snapping
            - overflow-x-auto: allows horizontal scrolling
            - [scrollbar-width:none]: hides the scrollbar
          */
          className="mt-6 flex snap-x snap-mandatory gap-4 overflow-x-auto pb-4 scroll-smooth [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
        >
          {products.map((product) => (
            <li
              key={product.product_id}
              /*
                - w-[calc(...)]: dynamically sets the width so exactly 2, 3, or 5 items fit
                - shrink-0: prevents items from squishing
                - snap-start: snaps the item perfectly to the left edge
              */
              className="w-[calc(50%-0.5rem)] shrink-0 snap-start sm:w-[calc(33.333%-0.66rem)] lg:w-[calc(20%-0.8rem)]"
            >
              <ProductCard product={product} />
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-6 text-sm text-muted">Chưa có sản phẩm.</p>
      )}

      <div className="mt-8 flex justify-end gap-2">
        <ArrowButton
          direction="left"
          aria-label="Previous products"
          onClick={() => handleScroll('prev')}
        />
        <ArrowButton
          direction="right"
          aria-label="Next products"
          onClick={() => handleScroll('next')}
        />
      </div>
    </section>
  );
}
