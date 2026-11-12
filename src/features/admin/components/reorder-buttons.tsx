'use client';

export function ReorderButtons({
  label,
  position,
  disabledUp,
  disabledDown,
  upAction,
  downAction,
}: {
  label: string;
  position?: number;
  disabledUp: boolean;
  disabledDown: boolean;
  upAction: (formData: FormData) => void | Promise<void>;
  downAction: (formData: FormData) => void | Promise<void>;
}) {
  return (
    <div className="flex items-center gap-1">
      <form action={upAction}>
        <button
          type="submit"
          aria-label={`Move ${label} up`}
          disabled={disabledUp}
          className="inline-flex size-7 items-center justify-center rounded-md border border-[var(--line)] text-xs transition hover:border-[var(--underline-color)] disabled:opacity-30"
        >
          ↑
        </button>
      </form>
      <form action={downAction}>
        <button
          type="submit"
          aria-label={`Move ${label} down`}
          disabled={disabledDown}
          className="inline-flex size-7 items-center justify-center rounded-md border border-[var(--line)] text-xs transition hover:border-[var(--underline-color)] disabled:opacity-30"
        >
          ↓
        </button>
      </form>
      {position ? <span className="ml-1 text-xs text-[var(--font-color)]">#{position}</span> : null}
    </div>
  );
}
