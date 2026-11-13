import type { ReactNode } from 'react';

export function AdminTableSection({
  title,
  meta,
  children,
}: {
  title: string;
  meta?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-lg border border-[var(--line)]">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--line)] px-4 py-3">
        <h2 className="font-heading text-sm tracking-[0.08em]">{title}</h2>
        {meta ? <div className="text-xs text-[var(--font-color)]">{meta}</div> : null}
      </div>
      {children}
    </section>
  );
}

export function AdminTableEmpty({ children }: { children: ReactNode }) {
  return <p className="px-4 py-8 text-sm text-[var(--font-color)]">{children}</p>;
}
