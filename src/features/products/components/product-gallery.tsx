'use client';

import Image from 'next/image';
import { useState } from 'react';
import type { ProductImage } from '@/features/shared/domain/domain';
import {
  GALLERY_THUMBNAIL_COUNT,
  getThumbnailWindowStart,
} from '@/features/products/lib/product-gallery';
import { ArrowButton } from '@/features/layout/components/arrow-button';

interface ProductGalleryProps {
  images: ProductImage[];
  productName: string;
}

export function ProductGallery({ images, productName }: ProductGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [windowStart, setWindowStart] = useState(0);
  const total = images.length;

  if (total === 0) {
    return <div className="product-image-frame aspect-square" aria-hidden="true" />;
  }

  const safeActive = Math.min(activeIndex, total - 1);
  const activeImage = images[safeActive];
  const start = getThumbnailWindowStart(safeActive, windowStart, total);
  const visibleImages = images.slice(start, start + GALLERY_THUMBNAIL_COUNT);

  function selectImage(index: number) {
    setActiveIndex(index);
    setWindowStart((current) => getThumbnailWindowStart(index, current, total));
  }

  return (
    <div>
      <div className="product-image-frame relative aspect-square overflow-hidden">
        <Image
          src={activeImage.url}
          alt={activeImage.alt}
          fill
          priority
          sizes="(max-width: 1024px) 100vw, 50vw"
          className="object-cover"
        />
      </div>

      <div className="mt-4 flex items-center gap-3">
        <ArrowButton
          direction="left"
          aria-label="Previous product image"
          onClick={() => selectImage((safeActive - 1 + total) % total)}
        />

        <ul
          className="flex flex-1 items-center justify-center gap-2 sm:gap-3"
          aria-label="Product images"
        >
          {visibleImages.map((image, offset) => {
            const index = start + offset;
            const selected = index === safeActive;

            return (
              <li key={image.imageId}>
                <button
                  type="button"
                  aria-label={`View ${image.alt}`}
                  aria-pressed={selected}
                  onClick={() => selectImage(index)}
                  className={[
                    'product-image-frame relative block h-16 w-16 overflow-hidden border-2 transition-colors sm:h-24 sm:w-24',
                    'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--control-outline)]',
                    selected
                      ? 'border-[var(--underline-color)]'
                      : 'border-transparent hover:border-line',
                  ].join(' ')}
                >
                  <Image
                    src={image.url}
                    alt=""
                    aria-hidden="true"
                    fill
                    sizes="96px"
                    className="object-cover"
                  />
                </button>
              </li>
            );
          })}
        </ul>

        <ArrowButton
          direction="right"
          aria-label="Next product image"
          onClick={() => selectImage((safeActive + 1) % total)}
        />
      </div>

      <p className="sr-only" aria-live="polite">
        {`${productName}: image ${safeActive + 1} of ${total}`}
      </p>
    </div>
  );
}
