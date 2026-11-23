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

const sixSlides: HeroSlide[] = [
  ...slides,
  {
    slide_id: 'slide-4',
    imageUrl: '/mock/hero/slide-4.svg',
    alt: 'Featured collection 4',
    title: 'Collection 4',
    subtitle: 'Collection description 4',
    linkUrl: '/c/collection-4',
    sortOrder: 4,
    status: 'VISIBLE',
  },
  {
    slide_id: 'slide-5',
    imageUrl: '/mock/hero/slide-5.svg',
    alt: 'Featured collection 5',
    title: 'Collection 5',
    subtitle: 'Collection description 5',
    linkUrl: '/c/collection-5',
    sortOrder: 5,
    status: 'VISIBLE',
  },
  {
    slide_id: 'slide-6',
    imageUrl: '/mock/hero/slide-6.svg',
    alt: 'Featured collection 6',
    title: 'Collection 6',
    subtitle: 'Collection description 6',
    linkUrl: '/c/collection-6',
    sortOrder: 6,
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

function stubReducedMotion(matches: boolean): (next: boolean) => void {
  let current = matches;
  const listeners = new Set<() => void>();
  const mediaQueryList = {
    get matches() {
      return current;
    },
    media: '(prefers-reduced-motion: reduce)',
    addEventListener: (_type: string, listener: () => void) => listeners.add(listener),
    removeEventListener: (_type: string, listener: () => void) => listeners.delete(listener),
  };
  vi.stubGlobal('matchMedia', () => mediaQueryList);
  return (next: boolean) => {
    current = next;
    listeners.forEach((listener) => listener());
  };
}

describe('HeroSlider auto slide', () => {
  beforeEach(() => vi.useFakeTimers());

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
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

  it('keeps advancing when the slides prop shrinks while mounted', () => {
    const { rerender } = render(<HeroSlider slides={sixSlides} />);

    act(() => {
      vi.advanceTimersByTime(5000);
    });
    act(() => {
      vi.advanceTimersByTime(5000);
    });
    act(() => {
      vi.advanceTimersByTime(5000);
    });
    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(activeDot()).toBe('Go to slide 5');

    rerender(<HeroSlider slides={sixSlides.slice(0, 3)} />);
    expect(activeDot()).toBe('Go to slide 3');

    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(activeDot()).toBe('Go to slide 1');
  });

  it('pauses auto slide while the pointer is over the slider', () => {
    const { container } = render(<HeroSlider slides={slides} />);
    const carousel = container.querySelector('section')!;

    act(() => {
      vi.advanceTimersByTime(4000);
    });
    fireEvent.mouseEnter(carousel);
    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(activeDot()).toBe('Go to slide 1');

    fireEvent.mouseLeave(carousel);
    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(activeDot()).toBe('Go to slide 2');
  });

  it('pauses auto slide while focus is inside the slider and resumes when focus leaves', () => {
    render(<HeroSlider slides={slides} />);
    const firstDot = screen.getByRole('button', { name: 'Go to slide 1' });

    act(() => {
      firstDot.focus();
    });
    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(activeDot()).toBe('Go to slide 1');

    act(() => {
      firstDot.blur();
    });
    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(activeDot()).toBe('Go to slide 2');
  });

  it('never auto slides when the user prefers reduced motion', () => {
    stubReducedMotion(true);
    const { container } = render(<HeroSlider slides={slides} />);

    act(() => {
      vi.advanceTimersByTime(20000);
    });
    expect(activeDot()).toBe('Go to slide 1');
    expect(container.querySelector('[aria-live]')?.getAttribute('aria-live')).toBe('polite');
    expect(screen.queryByRole('button', { name: /automatic slide changes/i })).toBeNull();
  });

  it('stops auto advancing when the reduced motion preference changes', () => {
    const setReducedMotion = stubReducedMotion(false);
    render(<HeroSlider slides={slides} />);

    act(() => {
      vi.advanceTimersByTime(4000);
    });
    act(() => {
      setReducedMotion(true);
    });
    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(activeDot()).toBe('Go to slide 1');
  });

  it('pauses and resumes from the Pause/Play button and updates the live region', () => {
    const { container } = render(<HeroSlider slides={slides} />);
    const liveRegion = () => container.querySelector('[aria-live]');

    expect(liveRegion()?.getAttribute('aria-live')).toBe('off');
    fireEvent.click(screen.getByRole('button', { name: 'Pause automatic slide changes' }));
    expect(liveRegion()?.getAttribute('aria-live')).toBe('polite');
    expect(screen.getByRole('button', { name: 'Resume automatic slide changes' })).toBeTruthy();

    act(() => {
      vi.advanceTimersByTime(10000);
    });
    expect(activeDot()).toBe('Go to slide 1');

    fireEvent.click(screen.getByRole('button', { name: 'Resume automatic slide changes' }));
    expect(liveRegion()?.getAttribute('aria-live')).toBe('off');
    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(activeDot()).toBe('Go to slide 2');
  });
});
