'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';
import type { HeroSlide } from '@/features/shared/domain/domain';
import { shouldSkipImageOptimizer } from '@/features/shared/lib/image-url';
import { isSafeLinkHref } from '@/features/shared/lib/safe-url';
import { ActionButton } from './action-button';
import { ArrowButton } from './arrow-button';

interface HeroSliderProps {
  slides: HeroSlide[];
}

const AUTO_SLIDE_INTERVAL_MS = 5000;

export function HeroSlider({ slides }: HeroSliderProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [isFocusWithin, setIsFocusWithin] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const currentIndex = Math.min(activeIndex, Math.max(slides.length - 1, 0));
  const activeSlide = slides[currentIndex];

  useEffect(() => {
    const query =
      typeof window.matchMedia === 'function'
        ? window.matchMedia('(prefers-reduced-motion: reduce)')
        : null;
    if (!query) {
      return;
    }
    const update = () => setPrefersReducedMotion(query.matches);
    update();
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);

  const isAutoAdvancing =
    slides.length >= 2 && !isHovered && !isFocusWithin && !prefersReducedMotion;

  useEffect(() => {
    if (!isAutoAdvancing) {
      return;
    }
    const timer = window.setTimeout(() => {
      setActiveIndex((current) => (Math.min(current, slides.length - 1) + 1) % slides.length);
    }, AUTO_SLIDE_INTERVAL_MS);
    return () => window.clearTimeout(timer);
  }, [isAutoAdvancing, currentIndex, slides.length]);

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
    <section
      aria-label="Featured collections"
      aria-roledescription="carousel"
      className="w-full"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onFocus={() => setIsFocusWithin(true)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
          setIsFocusWithin(false);
        }
      }}
    >
      <div className="relative aspect-[16/9] overflow-hidden bg-product-image sm:aspect-[2/1] lg:aspect-[64/30]">
        <Image
          src={activeSlide.imageUrl}
          alt={activeSlide.alt}
          fill
          unoptimized={shouldSkipImageOptimizer(activeSlide.imageUrl)}
          sizes="100vw"
          priority
          loading="eager"
          fetchPriority="high"
          className="object-cover object-left"
        />

        <div className="sr-only" aria-live={isAutoAdvancing ? 'off' : 'polite'}>
          <p>{activeSlide.title}</p>
          <p>{activeSlide.subtitle}</p>
        </div>

        {isSafeLinkHref(activeSlide.linkUrl) ? (
          <ActionButton
            href={activeSlide.linkUrl}
            aria-label={`EXPLORE NOW: ${activeSlide.title}`}
            className="absolute bottom-8 left-1/2 -translate-x-1/2 text-[10px] sm:text-xs lg:text-sm"
          >
            EXPLORE NOW
          </ActionButton>
        ) : null}

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
