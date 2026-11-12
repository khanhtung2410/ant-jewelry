export default function PublicLoading() {
  return (
    <main
      aria-busy="true"
      aria-live="polite"
      className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8"
    >
      <div className="rounded-xl border border-[var(--line)] bg-background p-8 text-center">
        <p role="status" className="text-sm text-[var(--font-color)]">
          Loading page...
        </p>
      </div>
    </main>
  );
}
