import Link from 'next/link';

export default function PublicNotFound() {
  return (
    <main className="mx-auto flex w-full max-w-7xl items-center justify-center px-4 py-16 sm:px-6 lg:px-8">
      <div className="w-full max-w-xl rounded-xl border border-[var(--line)] bg-background p-8 text-center">
        <p className="font-heading text-xs tracking-[0.2em] text-[var(--font-color)]">NOT FOUND</p>
        <h1 className="mt-3 font-heading text-2xl tracking-[0.08em] text-foreground">
          This page could not be found
        </h1>
        <p className="mt-3 text-sm text-[var(--font-color)]">
          The content you requested is unavailable or does not exist.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-md bg-[var(--underline-color)] px-4 py-2 text-sm font-medium text-white transition hover:opacity-95"
          >
            Go to homepage
          </Link>
          <Link
            href="/blog"
            className="inline-flex items-center justify-center rounded-md border border-[var(--line)] px-4 py-2 text-sm font-medium text-foreground transition hover:border-[var(--underline-color)]"
          >
            View blog
          </Link>
        </div>
      </div>
    </main>
  );
}
