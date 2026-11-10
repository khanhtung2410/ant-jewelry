import Link from 'next/link';
import type { ReactNode } from 'react';

interface ActionButtonProps {
  href: string;
  children: ReactNode;
  className?: string;
  disabled?: boolean;
  ariaLabel?: string;
}

export function ActionButton({
  href,
  children,
  className = '',
  disabled = false,
  ariaLabel,
}: ActionButtonProps) {
  const classes = [
    'inline-flex items-center justify-center rounded-full font-heading transition-colors min-h-7 px-2',
    'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--control-outline)]',
    disabled
      ? 'cursor-not-allowed bg-white/50 text-foreground'
      : 'bg-white/50 text-foreground hover:bg-[var(--underline-color)] hover:text-white',
    className,
  ].join(' ');

  if (disabled) {
    return (
      <button type="button" aria-label={ariaLabel} disabled className={classes}>
        {children}
      </button>
    );
  }

  return (
    <Link href={href} aria-label={ariaLabel} className={classes}>
      {children}
    </Link>
  );
}
