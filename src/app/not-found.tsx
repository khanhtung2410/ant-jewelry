import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="flex min-h-[60vh] items-center justify-center px-4 py-16">
      <div className="w-full max-w-lg rounded-xl border border-[var(--line)] bg-background p-8 text-center shadow-sm">
        <p className="font-heading text-xs tracking-[0.2em] text-[var(--font-color)]">ANT JEWELRY</p>
        <h1 className="mt-3 font-heading text-2xl tracking-[0.08em] text-foreground">Page not found</h1>
        <p className="mt-3 text-sm text-[var(--font-color)]">
          The page you are looking for does not exist or may have been moved.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-md bg-[var(--underline-color)] px-4 py-2 text-sm font-medium text-white transition hover:opacity-95"
          >
            Back to home
          </Link>
        </div>
      </div>
    </main>
  );
}
