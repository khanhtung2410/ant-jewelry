'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import type { HeroSlide } from '@/types/domain';

interface HeroSliderProps {
  slides: HeroSlide[];
}

export function HeroSlider({ slides }: HeroSliderProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const currentIndex = Math.min(activeIndex, Math.max(slides.length - 1, 0));
  const activeSlide = slides[currentIndex];

  if (!activeSlide) {
    return (
      <section
        aria-label="Featured collections"
        className="mx-auto flex aspect-[16/9] w-full items-center justify-center bg-product-image px-4 text-center text-sm text-muted sm:aspect-[2/1] lg:aspect-[64/30]"
      >
        Chưa có bộ sưu tập nổi bật.
      </section>
    );
  }

  return (
    <section aria-label="Featured collections" aria-roledescription="carousel" className="w-full">
      <div className="relative aspect-[16/9] overflow-hidden bg-product-image sm:aspect-[2/1] lg:aspect-[64/30]">
        <Image
          src={activeSlide.imageUrl}
          alt={activeSlide.alt}
          fill
          sizes="100vw"
          loading="eager"
          fetchPriority="high"
          className="object-cover object-left"
        />

        <div className="sr-only">
          <h1>{activeSlide.title}</h1>
          <p>{activeSlide.subtitle}</p>
        </div>

        <Link
          href={activeSlide.linkUrl}
          aria-label={`Explore ${activeSlide.title}`}
          className="absolute left-[8.33%] top-[60%] inline-flex h-[7.1%] min-h-10 w-[13.55%] min-w-36 items-center justify-center rounded-full bg-[var(--underline-color)] px-3 font-heading text-[10px] text-white transition-colors hover:bg-[var(--font-color)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--underline-color)] sm:text-xs lg:text-sm"
        >
          EXPLORE NOW
        </Link>

        <div className="absolute bottom-[8%] right-[8%] flex gap-3">
          <button
            type="button"
            aria-label="Previous slide"
            disabled={currentIndex === 0}
            onClick={() => setActiveIndex(Math.max(0, currentIndex - 1))}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border-2 border-[var(--underline-color)] bg-product-image text-2xl leading-none text-[var(--underline-color)] transition-colors enabled:hover:bg-[var(--underline-color)] enabled:hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--underline-color)] disabled:border-muted/50 disabled:bg-muted/40 disabled:text-muted sm:h-12 sm:w-12"
          >
            <span aria-hidden="true">‹</span>
          </button>
          <button
            type="button"
            aria-label="Next slide"
            disabled={currentIndex === slides.length - 1}
            onClick={() => setActiveIndex(Math.min(slides.length - 1, currentIndex + 1))}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border-2 border-[var(--underline-color)] bg-product-image text-2xl leading-none text-[var(--underline-color)] transition-colors enabled:hover:bg-[var(--underline-color)] enabled:hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--underline-color)] disabled:border-muted/50 disabled:bg-muted/40 disabled:text-muted sm:h-12 sm:w-12"
          >
            <span aria-hidden="true">›</span>
          </button>
        </div>
      </div>

      <div role="group" aria-label="Choose a slide" className="mt-4 flex justify-center gap-2">
        {slides.map((slide, index) => (
          <button
            key={slide.slide_id}
            type="button"
            aria-label={`Go to slide ${index + 1}`}
            aria-current={index === currentIndex ? 'true' : undefined}
            onClick={() => setActiveIndex(index)}
            className={`h-2 rounded-full transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--underline-color)] ${
              index === currentIndex
                ? 'w-8 bg-[var(--underline-color)]'
                : 'w-2 bg-line hover:bg-[var(--underline-color)]'
            }`}
          />
        ))}
      </div>
    </section>
  );
}
