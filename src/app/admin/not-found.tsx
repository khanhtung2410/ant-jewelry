import Link from 'next/link';

export default function AdminNotFound() {
  return (
    <main className="mx-auto mt-6 flex w-full max-w-7xl items-center justify-center rounded-xl border border-[var(--line)] bg-background p-8">
      <div className="max-w-lg text-center">
        <h1 className="font-heading text-xl tracking-[0.08em] text-foreground">Page not found</h1>
        <p className="mt-3 text-sm text-[var(--font-color)]">
          The admin page you requested does not exist.
        </p>
        <Link
          href="/admin"
          className="mt-6 inline-flex items-center justify-center rounded-md bg-[var(--underline-color)] px-4 py-2 text-sm font-medium text-white transition hover:opacity-95"
        >
          Back to admin
        </Link>
      </div>
    </main>
  );
}
