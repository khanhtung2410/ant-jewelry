export default function AdminLoading() {
  return (
    <main
      aria-busy="true"
      aria-live="polite"
      className="mx-auto mt-6 w-full max-w-7xl rounded-xl border border-[var(--line)] bg-background p-6"
    >
      <p role="status" className="text-sm text-[var(--font-color)]">
        Loading admin...
      </p>
    </main>
  );
}
