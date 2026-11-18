'use client';

/**
 * Bottom-left progress/result notice for admin actions that can take time
 * (uploading several files, deleting images). Uses the existing design tokens
 * and announces updates to screen readers.
 */
export function AdminStatusToast({ message, busy = true }: { message: string; busy?: boolean }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-4 left-4 z-[80] flex max-w-[calc(100vw-2rem)] items-center gap-3 rounded-md border border-[var(--line)] bg-background px-4 py-3 text-sm text-[var(--font-color)] shadow-lg"
    >
      {busy ? (
        <span
          aria-hidden="true"
          className="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-[var(--underline-color)] border-t-transparent"
        />
      ) : (
        <span
          aria-hidden="true"
          className="h-2 w-2 shrink-0 rounded-full bg-[var(--underline-color)]"
        />
      )}
      <span>{message}</span>
    </div>
  );
}
