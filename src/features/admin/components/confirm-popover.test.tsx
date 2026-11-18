import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { ConfirmPopover } from './confirm-popover';

describe('ConfirmPopover', () => {
  it('renders an accessible dialog with the confirmation message and actions', () => {
    const html = renderToStaticMarkup(
      <ConfirmPopover message="Delete this image?" onConfirm={vi.fn()} onCancel={vi.fn()} />,
    );

    expect(html).toContain('role="dialog"');
    expect(html).toContain('aria-modal="true"');
    expect(html).toContain('Delete this image?');
    expect(html).toContain('Cancel');
    expect(html).toContain('Delete');
  });
});
