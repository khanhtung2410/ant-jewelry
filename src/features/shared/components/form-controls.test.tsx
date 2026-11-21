// @vitest-environment jsdom
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState, type FormEvent } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { FormSubmitButton } from '@/features/admin/components/form-controls';

afterEach(() => cleanup());

function DelayedActionForm({ action }: { action: () => Promise<void> }) {
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    try {
      await action();
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <FormSubmitButton pending={pending}>Save product</FormSubmitButton>
    </form>
  );
}

describe('FormSubmitButton', () => {
  it('renders its idle label and stays enabled when not pending', () => {
    render(<FormSubmitButton pending={false}>Create user</FormSubmitButton>);
    const button = screen.getByRole('button', { name: 'Create user' });

    expect(button.hasAttribute('disabled')).toBe(false);
    expect(button.getAttribute('type')).toBe('submit');
    expect(button.textContent).not.toContain('Saving');
  });

  it('is disabled and shows the pending label while the action is still running', async () => {
    const deferred: { resolve: () => void } = { resolve: () => {} };
    const action = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          deferred.resolve = resolve;
        }),
    );
    const user = userEvent.setup();
    render(<DelayedActionForm action={action} />);

    const idleButton = screen.getByRole('button', { name: 'Save product' });
    await user.click(idleButton);

    const pendingButton = screen.getByRole('button', { name: 'Saving…' });
    await waitFor(() => expect(pendingButton.hasAttribute('disabled')).toBe(true));
    expect(action).toHaveBeenCalledTimes(1);

    // A second click while the first action is in flight must not submit again.
    await user.click(pendingButton);
    expect(action).toHaveBeenCalledTimes(1);

    deferred.resolve();
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Save product' }).hasAttribute('disabled')).toBe(
        false,
      ),
    );
    expect(action).toHaveBeenCalledTimes(1);
  });
});
