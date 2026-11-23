// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { HeroSlide } from '@/features/shared/domain/domain';
import { HeroSlider } from './hero-slider';

vi.mock('next/image', () => ({
  default: ({ src, alt }: { src: string; alt: string }) => (
    // eslint-disable-next-line @next/next/no-img-element -- next/image is mocked in this jsdom test.
    <img src={src} alt={alt} />
  ),
}));

vi.mock('next/link', () => ({
  default: ({
    href,
    children,
    'aria-label': ariaLabel,
    className,
  }: {
    href: string;
    children: string;
    'aria-label'?: string;
    className?: string;
  }) => (
    <a href={href} aria-label={ariaLabel} className={className}>
      {children}
    </a>
  ),
}));

const slides: HeroSlide[] = [
  {
    slide_id: 'slide-1',
    imageUrl: '/mock/hero/slide-1.svg',
    alt: 'Featured collection 1',
    title: 'Collection 1',
    subtitle: 'Collection description 1',
    linkUrl: '/c/collection-1',
    sortOrder: 1,
    status: 'VISIBLE',
  },
  {
    slide_id: 'slide-2',
    imageUrl: '/mock/hero/slide-2.svg',
    alt: 'Featured collection 2',
    title: 'Collection 2',
    subtitle: 'Collection description 2',
    linkUrl: '/c/collection-2',
    sortOrder: 2,
    status: 'VISIBLE',
  },
  {
    slide_id: 'slide-3',
    imageUrl: '/mock/hero/slide-3.svg',
    alt: 'Featured collection 3',
    title: 'Collection 3',
    subtitle: 'Collection description 3',
    linkUrl: '/c/collection-3',
    sortOrder: 3,
    status: 'VISIBLE',
  },
];

function activeDot(): string | null {
  const dots = screen.queryAllByRole('button', { name: /Go to slide/ });
  return (
    dots.find((dot) => dot.getAttribute('aria-current') === 'true')?.getAttribute('aria-label') ??
    null
  );
}

describe('HeroSlider auto slide', () => {
  beforeEach(() => vi.useFakeTimers());

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it('stays on slide 1 until 5000 ms, then advances one slide every 5000 ms and loops', () => {
    render(<HeroSlider slides={slides} />);

    expect(activeDot()).toBe('Go to slide 1');
    act(() => {
      vi.advanceTimersByTime(4999);
    });
    expect(activeDot()).toBe('Go to slide 1');
    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(activeDot()).toBe('Go to slide 2');
    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(activeDot()).toBe('Go to slide 3');
    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(activeDot()).toBe('Go to slide 1');
  });

  it('restarts the countdown when the user selects a slide', () => {
    render(<HeroSlider slides={slides} />);

    act(() => {
      vi.advanceTimersByTime(3000);
    });
    fireEvent.click(screen.getByRole('button', { name: 'Go to slide 3' }));
    expect(activeDot()).toBe('Go to slide 3');
    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(activeDot()).toBe('Go to slide 3');
    act(() => {
      vi.advanceTimersByTime(3000);
    });
    expect(activeDot()).toBe('Go to slide 1');
  });

  it('does not schedule a timer for fewer than two slides', () => {
    const single = render(<HeroSlider slides={[slides[0]]} />);

    act(() => {
      vi.advanceTimersByTime(20000);
    });
    expect(activeDot()).toBe('Go to slide 1');
    single.unmount();

    render(<HeroSlider slides={[]} />);
    act(() => {
      vi.advanceTimersByTime(20000);
    });
    expect(screen.getByText('Chưa có bộ sưu tập nổi bật.')).toBeTruthy();
  });

  it('clears the timer on unmount', () => {
    const baseline = vi.getTimerCount();

    const { unmount } = render(<HeroSlider slides={slides} />);
    expect(vi.getTimerCount()).toBe(baseline + 1);

    unmount();
    expect(vi.getTimerCount()).toBe(baseline);
  });
});
