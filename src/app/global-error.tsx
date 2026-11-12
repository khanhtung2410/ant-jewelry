'use client';

import { useEffect } from 'react';

export default function GlobalError({
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
    <html lang="en">
      <body className="min-h-screen bg-background text-foreground antialiased">
        <main className="flex min-h-screen items-center justify-center px-4 py-16">
          <div className="w-full max-w-lg rounded-xl border border-[var(--line)] bg-white p-8 text-center shadow-sm">
            <p className="text-xs tracking-[0.2em] text-[var(--font-color,#666)]">ANT JEWELRY</p>
            <h1 className="mt-3 text-2xl font-semibold tracking-[0.04em]">Something went wrong</h1>
            <p className="mt-3 text-sm text-[var(--font-color,#666)]">
              A critical error occurred. Please try again.
            </p>
            <button
              type="button"
              onClick={() => reset()}
              className="mt-6 inline-flex items-center justify-center rounded-md bg-[#265649] px-4 py-2 text-sm font-medium text-white transition hover:opacity-95"
            >
              Try again
            </button>
          </div>
        </main>
      </body>
    </html>
  );
}
