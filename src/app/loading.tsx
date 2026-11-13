export default function Loading() {
  return (
    <main
      aria-busy="true"
      aria-live="polite"
      className="flex min-h-[50vh] items-center justify-center px-4 py-16"
    >
      <div className="w-full max-w-md rounded-xl border border-[var(--line)] bg-background p-6 text-center shadow-sm">
        <p className="font-heading text-xs tracking-[0.2em] text-[var(--font-color)]">
          ANT JEWELRY
        </p>
        <p role="status" className="mt-3 text-sm text-[var(--font-color)]">
          Loading...
        </p>
      </div>
    </main>
  );
}
