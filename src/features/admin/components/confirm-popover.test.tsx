// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
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
    expect(html).not.toContain('border-[var(--danger-border)]');
  });

  it('uses the danger style for destructive confirmation', () => {
    const html = renderToStaticMarkup(
      <ConfirmPopover
        message="Delete?"
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
        confirmLabel="Delete"
        danger
      />,
    );

    expect(html).toContain('border-[var(--danger-border)]');
    expect(html).toContain('text-[var(--danger-text)]');
  });
});

afterEach(() => cleanup());

describe('ConfirmPopover interactions', () => {
  it('starts focus on Cancel and wraps Tab inside the dialog', async () => {
    const user = userEvent.setup();
    render(
      <ConfirmPopover
        message="Delete this image?"
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
        confirmLabel="Delete"
        danger
      />,
    );

    const cancel = screen.getByRole('button', { name: 'Cancel' });
    const confirm = screen.getByRole('button', { name: 'Delete' });
    expect(document.activeElement).toBe(cancel);

    await user.tab();
    expect(document.activeElement).toBe(confirm);

    await user.tab();
    expect(document.activeElement).toBe(cancel);

    await user.tab({ shift: true });
    expect(document.activeElement).toBe(confirm);
  });

  it('cancels on Escape and on backdrop click, and confirms only on the confirm button', () => {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();
    const { container } = render(
      <ConfirmPopover
        message="Delete?"
        onConfirm={onConfirm}
        onCancel={onCancel}
        confirmLabel="Delete"
      />,
    );

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onConfirm).not.toHaveBeenCalled();

    fireEvent.mouseDown(container.firstElementChild as Element);
    expect(onCancel).toHaveBeenCalledTimes(2);

    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onCancel).toHaveBeenCalledTimes(3);

    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('does not steal focus when the parent re-renders with a new onCancel', async () => {
    const user = userEvent.setup();
    const { rerender } = render(
      <ConfirmPopover
        message="Delete?"
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
        confirmLabel="Delete"
      />,
    );
    const confirm = screen.getByRole('button', { name: 'Delete' });
    await user.tab();
    expect(document.activeElement).toBe(confirm);

    rerender(
      <ConfirmPopover
        message="Delete?"
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
        confirmLabel="Delete"
      />,
    );
    expect(document.activeElement, 'focus stays on Confirm across re-render').toBe(confirm);
  });

  it('disables the confirm button while busy', () => {
    render(
      <ConfirmPopover
        message="Deleting?"
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
        confirmLabel="Delete"
        busy
      />,
    );
    expect((screen.getByRole('button', { name: 'Delete' }) as HTMLButtonElement).disabled).toBe(
      true,
    );
  });
});
