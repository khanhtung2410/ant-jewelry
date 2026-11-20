import type { ReactNode } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { ActionButton } from './action-button';

vi.mock('next/link', () => ({
  default: ({
    href,
    children,
    className,
    'aria-label': ariaLabel,
  }: {
    href: string;
    children: ReactNode;
    className?: string;
    'aria-label'?: string;
  }) => (
    <a href={href} className={className} aria-label={ariaLabel}>
      {children}
    </a>
  ),
}));

describe('ActionButton', () => {
  it('renders an enabled button as a link without changing its supplied size', () => {
    const html = renderToStaticMarkup(
      <ActionButton href="/collection" className="h-10 w-36">
        EXPLORE NOW
      </ActionButton>,
    );

    expect(html).toContain('href="/collection"');
    expect(html).toContain('h-10 w-36');
    expect(html).toContain('EXPLORE NOW');
    expect(html).toContain('bg-[var(--component-action-button-background)]');
    expect(html).toContain('text-[var(--component-action-button-text)]');
    expect(html).toContain('hover:bg-[var(--component-action-button-hover-background)]');
    expect(html).toContain('hover:text-[var(--component-action-button-hover-text)]');
    expect(html).not.toContain('disabled=""');
  });

  it('renders a disabled button without a navigable link', () => {
    const html = renderToStaticMarkup(
      <ActionButton href="/collection" disabled className="h-10 w-36">
        EXPLORE NOW
      </ActionButton>,
    );

    expect(html).toContain('<button');
    expect(html).toContain('disabled=""');
    expect(html).toContain(
      'cursor-not-allowed bg-[var(--component-action-button-background)] text-[var(--component-action-button-text)]',
    );
    expect(html).not.toContain('hover:bg-[var(--component-action-button-hover-background)]');
    expect(html).not.toContain('href="/collection"');
    expect(html).toContain('h-10 w-36');
  });
});
