import Link from 'next/link';
import type { ReactNode } from 'react';

const actionClassName =
  'inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition';
const actionVariantClassNames = {
  primary: 'bg-[var(--underline-color)] text-white hover:opacity-95',
  secondary: 'border border-[var(--line)] text-foreground hover:border-[var(--underline-color)]',
};

export function StatusPage({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow?: string;
  title: string;
  description: string;
  children?: ReactNode;
}) {
  return (
    <main className="flex min-h-[60vh] w-full items-center justify-center px-4 py-16 sm:px-6 lg:px-8">
      <div className="w-full max-w-lg rounded-xl border border-[var(--line)] bg-background p-8 text-center">
        {eyebrow ? (
          <p className="font-heading text-xs tracking-[0.2em] text-[var(--font-color)]">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="mt-3 font-heading text-2xl tracking-[0.08em] text-foreground">{title}</h1>
        <p className="mt-3 text-sm text-[var(--font-color)]">{description}</p>
        {children ? (
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">{children}</div>
        ) : null}
      </div>
    </main>
  );
}

export function StatusPageLink({
  href,
  children,
  variant = 'primary',
}: {
  href: string;
  children: ReactNode;
  variant?: keyof typeof actionVariantClassNames;
}) {
  return (
    <Link href={href} className={`${actionClassName} ${actionVariantClassNames[variant]}`}>
      {children}
    </Link>
  );
}
