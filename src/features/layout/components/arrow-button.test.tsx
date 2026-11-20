import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { ArrowButton } from './arrow-button';

describe('ArrowButton', () => {
  it('renders a 30px left arrow button with the supplied hover styles', () => {
    const html = renderToStaticMarkup(
      <ArrowButton direction="left" aria-label="Previous slide" onClick={() => {}} />,
    );

    expect(html).toContain('aria-label="Previous slide"');
    expect(html).toContain('h-[30px] w-[30px]');
    expect(html).toContain('border-[var(--component-arrow-button-border)]');
    expect(html).toContain('bg-[var(--component-arrow-button-background)]');
    expect(html).toContain('text-[var(--component-arrow-button-text)]');
    expect(html).toContain('hover:border-[var(--component-arrow-button-hover-border)]');
    expect(html).toContain('hover:bg-[var(--component-arrow-button-hover-background)]');
    expect(html).toContain('hover:text-[var(--component-arrow-button-hover-text)]');
    expect(html).toContain('class="h-6 w-6 rotate-180"');
    expect(html).toContain('d="M8.25 4.5l7.5 7.5-7.5 7.5"');
  });

  it('renders a right arrow and supports disabled buttons', () => {
    const html = renderToStaticMarkup(
      <ArrowButton direction="right" aria-label="Next products" onClick={() => {}} disabled />,
    );

    expect(html).toContain('aria-label="Next products"');
    expect(html).toContain('class="h-6 w-6"');
    expect(html).toContain('disabled=""');
  });
});
