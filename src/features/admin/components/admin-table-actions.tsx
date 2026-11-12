import Link from 'next/link';
import type { ComponentProps, ReactNode } from 'react';

const actionClassName =
  'inline-flex items-center justify-center whitespace-nowrap rounded-md border px-3 py-1.5 text-xs font-medium transition';
const actionVariantClassNames = {
  default:
    'border-[var(--line)] hover:border-[var(--underline-color)] hover:text-[var(--underline-color)]',
  danger: 'border-red-200 text-red-700 hover:border-red-700',
};

export function AdminTableActions({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex flex-wrap items-center justify-center gap-2 ${className}`}>
      {children}
    </div>
  );
}

export function AdminActionLink({
  variant = 'default',
  className = '',
  ...props
}: ComponentProps<typeof Link> & { variant?: keyof typeof actionVariantClassNames }) {
  return (
    <Link
      {...props}
      className={`${actionClassName} ${actionVariantClassNames[variant]} ${className}`}
    />
  );
}

export function AdminActionButton({
  variant = 'default',
  className = '',
  ...props
}: ComponentProps<'button'> & { variant?: keyof typeof actionVariantClassNames }) {
  return (
    <button
      {...props}
      className={`${actionClassName} ${actionVariantClassNames[variant]} ${className}`}
    />
  );
}
