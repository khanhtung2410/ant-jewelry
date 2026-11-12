'use client';

import { useEffect } from 'react';

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="mx-auto mt-6 flex w-full max-w-7xl items-center justify-center rounded-xl border border-[var(--line)] bg-background p-8">
      <div className="max-w-lg text-center">
        <h1 className="font-heading text-xl tracking-[0.08em] text-foreground">
          Something went wrong
        </h1>
        <p className="mt-3 text-sm text-[var(--font-color)]">
          An error occurred while loading this admin page.
        </p>
        <button
          type="button"
          onClick={() => reset()}
          className="mt-6 inline-flex items-center justify-center rounded-md bg-[var(--underline-color)] px-4 py-2 text-sm font-medium text-white transition hover:opacity-95"
        >
          Try again
        </button>
      </div>
    </main>
  );
}
