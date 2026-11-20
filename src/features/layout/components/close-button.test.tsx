import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { CloseButton } from './close-button';

describe('CloseButton', () => {
  it('renders a close button with default label and icon', () => {
    const html = renderToStaticMarkup(<CloseButton />);

    expect(html).toContain('<button');
    expect(html).toContain('type="button"');
    expect(html).toContain('aria-label="Close"');
    expect(html).toContain('h-[30px] w-[30px]');
    expect(html).toContain('bg-[var(--component-close-button-background)]');
    expect(html).toContain('text-[var(--component-close-button-text)]');
    expect(html).toContain('hover:border-[var(--component-close-button-hover-border)]');
    expect(html).toContain('hover:bg-[var(--component-close-button-hover-background)]');
    expect(html).toContain('focus-visible:outline-[var(--component-close-button-outline)]');
    expect(html).toContain('d="M6 18L18 6M6 6l12 12"');
  });

  it('supports a custom accessible label and extra classes', () => {
    const html = renderToStaticMarkup(
      <CloseButton ariaLabel="Close contact popover" className="absolute right-0 top-0" />,
    );

    expect(html).toContain('aria-label="Close contact popover"');
    expect(html).toContain('absolute right-0 top-0');
  });
});
