'use client';

import type { MouseEvent } from 'react';
import { ArrowButton } from '@/features/layout/components/arrow-button';

function scrollCarousel(event: MouseEvent<HTMLButtonElement>, direction: 'next' | 'prev') {
  const section = event.currentTarget.closest('[data-product-carousel]');
  const container = section?.querySelector<HTMLUListElement>('[data-product-carousel-items]');
  const firstItem = container?.firstElementChild;

  if (!container || !(firstItem instanceof HTMLElement)) {
    return;
  }

  const itemWidth = firstItem.getBoundingClientRect().width;
  const gap = parseFloat(window.getComputedStyle(container).gap || '0');
  const scrollAmount = itemWidth + gap;

  if (direction === 'next') {
    if (container.scrollLeft + container.clientWidth >= container.scrollWidth - 10) {
      container.scrollTo({ left: 0, behavior: 'smooth' });
    } else {
      container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  } else if (container.scrollLeft <= 10) {
    container.scrollTo({ left: container.scrollWidth, behavior: 'smooth' });
  } else {
    container.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
  }
}

export function CarouselControls() {
  return (
    <div className="mt-8 flex justify-end gap-2">
      <ArrowButton
        direction="left"
        aria-label="Previous products"
        onClick={(event) => scrollCarousel(event, 'prev')}
      />
      <ArrowButton
        direction="right"
        aria-label="Next products"
        onClick={(event) => scrollCarousel(event, 'next')}
      />
    </div>
  );
}
