import type { ReactNode } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { StatusPage, StatusPageLink } from './status-page';

vi.mock('next/link', () => ({
  default: ({
    href,
    children,
    className,
  }: {
    href: string;
    children: ReactNode;
    className?: string;
  }) => (
    <a href={href} className={className}>
      {children}
    </a>
  ),
}));

describe('StatusPage', () => {
  it('renders the shared panel with primary and secondary actions', () => {
    const html = renderToStaticMarkup(
      <StatusPage eyebrow="NOT FOUND" title="Missing page" description="It is gone.">
        <StatusPageLink href="/">Home</StatusPageLink>
        <StatusPageLink href="/blog" variant="secondary">
          Blog
        </StatusPageLink>
      </StatusPage>,
    );

    expect(html).toContain('NOT FOUND');
    expect(html).toContain('Missing page');
    expect(html).toContain('It is gone.');
    expect(html).toContain('href="/"');
    expect(html).toContain('href="/blog"');
    expect(html).toContain('hover:opacity-95');
    expect(html).toContain('border-[var(--line)]');
  });

  it('omits the eyebrow and action row when they are not provided', () => {
    const html = renderToStaticMarkup(<StatusPage title="Only title" description="Only text." />);

    expect(html).toContain('Only title');
    expect(html).not.toContain('tracking-[0.2em]');
    expect(html).not.toContain('flex-wrap');
  });
});
