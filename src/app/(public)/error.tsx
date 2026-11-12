'use client';

import { useEffect } from 'react';

export default function PublicError({
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
    <main className="mx-auto flex w-full max-w-7xl items-center justify-center px-4 py-16 sm:px-6 lg:px-8">
      <div className="w-full max-w-xl rounded-xl border border-[var(--line)] bg-background p-8 text-center">
        <h1 className="font-heading text-2xl tracking-[0.08em] text-foreground">
          Unable to load this page
        </h1>
        <p className="mt-3 text-sm text-[var(--font-color)]">
          Something went wrong while loading this content. Please try again.
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
