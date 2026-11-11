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
    expect(html).toContain('hover:border-red-800');
    expect(html).toContain('hover:bg-[var(--button-bg-hover)]');
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
