'use client';

import { useEffect, useId, useRef } from 'react';

/**
 * Accessible confirmation popover used instead of the browser's blocking
 * window.confirm(). Escape and backdrop click cancel; focus starts on Cancel.
 */
export function ConfirmPopover({
  message,
  onConfirm,
  onCancel,
  confirmLabel = 'Confirm',
  busy = false,
}: {
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmLabel?: string;
  busy?: boolean;
}) {
  const titleId = useId();
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    cancelRef.current?.focus();
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault();
        onCancel();
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onCancel]);

  return (
    <div
      className="fixed inset-0 z-[70] grid place-items-center bg-black/40 p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onCancel();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="w-full max-w-sm rounded-lg border border-[var(--line)] bg-background p-5 shadow-xl"
      >
        <h2
          id={titleId}
          className="font-heading text-sm tracking-[0.08em] text-[var(--font-color)]"
        >
          CONFIRM ACTION
        </h2>
        <p className="mt-3 text-sm text-[var(--font-color)]">{message}</p>
        <div className="mt-6 flex justify-end gap-2">
          <button
            ref={cancelRef}
            type="button"
            onClick={onCancel}
            className="rounded-md border border-[var(--line)] px-3 py-2 text-sm"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className="rounded-md bg-[var(--underline-color)] px-3 py-2 text-sm text-background transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
