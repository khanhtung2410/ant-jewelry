import Link from 'next/link';
import type { ComponentProps, ReactNode } from 'react';

const actionClassName =
  'inline-flex items-center justify-center whitespace-nowrap rounded-md border px-3 py-1.5 text-xs font-medium transition';
const actionVariantClassNames = {
  default:
    'border-[var(--component-admin-action-border)] hover:border-[var(--component-admin-action-hover-border)] hover:text-[var(--component-admin-action-hover-text)]',
  danger:
    'border-[var(--component-admin-action-danger-border)] text-[var(--component-admin-action-danger-text)] hover:border-[var(--component-admin-action-danger-hover-border)]',
};

export function AdminTableActions({
  children,
  className = '',
  wrap = true,
}: {
  children: ReactNode;
  className?: string;
  wrap?: boolean;
}) {
  return (
    <div
      className={`flex ${
        wrap ? 'flex-wrap' : 'flex-nowrap'
      } items-center justify-center gap-2 ${className}`}
    >
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
