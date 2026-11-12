'use client';

import Image from 'next/image';
import { useState } from 'react';
import type { HeroSlide } from '@/features/shared/domain/domain';
import { ActionButton } from './action-button';
import { ArrowButton } from './arrow-button';

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
          preload
          className="object-cover object-left"
        />

        <div className="sr-only">
          <h1>{activeSlide.title}</h1>
          <p>{activeSlide.subtitle}</p>
        </div>

        <ActionButton
          href={activeSlide.linkUrl}
          aria-label={`Explore ${activeSlide.title}`}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 text-[10px] sm:text-xs lg:text-sm"
        >
          EXPLORE NOW
        </ActionButton>

        <div className="pointer-events-none absolute inset-x-0 top-1/2 flex -translate-y-1/2 items-center justify-between px-[8%]">
          <ArrowButton
            direction="left"
            aria-label="Previous slide"
            onClick={() => setActiveIndex((currentIndex - 1 + slides.length) % slides.length)}
            className="pointer-events-auto"
          />
          <ArrowButton
            direction="right"
            aria-label="Next slide"
            onClick={() => setActiveIndex((currentIndex + 1) % slides.length)}
            className="pointer-events-auto"
          />
        </div>
        <div
          role="group"
          aria-label="Choose a slide"
          className="absolute bottom-4 left-1/2 mt-0 flex -translate-x-1/2 justify-center gap-2"
        >
          {slides.map((slide, index) => (
            <button
              key={slide.slide_id}
              type="button"
              aria-label={`Go to slide ${index + 1}`}
              aria-current={index === currentIndex ? 'true' : undefined}
              onClick={() => setActiveIndex(index)}
              className={`h-2 w-2 rounded-full transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--underline-color)] ${
                index === currentIndex ? 'bg-[var(--underline-color)]' : 'bg-white'
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
