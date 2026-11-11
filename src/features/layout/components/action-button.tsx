import Link from 'next/link';
import type { ReactNode, ButtonHTMLAttributes, AnchorHTMLAttributes, Ref } from 'react';

interface ActionButtonProps extends Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  'className' | 'children' | 'disabled' | 'aria-label'
> {
  href?: string;
  children: ReactNode;
  className?: string;
  disabled?: boolean;
  ariaLabel?: string;
  ref?: Ref<HTMLButtonElement>;
}

export function ActionButton({
  href,
  children,
  className = '',
  disabled = false,
  ariaLabel,
  ref,
  type,
  ...props
}: ActionButtonProps) {
  const classes = [
    'inline-flex items-center justify-center rounded-full font-heading transition-colors min-h-7 px-2',
    'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--control-outline)]',
    disabled
      ? 'cursor-not-allowed bg-white/50 text-foreground opacity-50'
      : 'bg-white/50 text-foreground hover:bg-[var(--underline-color)] hover:text-white',
    className,
  ]
    .filter(Boolean)
    .join(' ')
    .trim();

  // Render Link if href is provided and it's not disabled
  if (href && !disabled) {
    return (
      <Link
        href={href}
        aria-label={ariaLabel}
        className={classes}
        // Cast props to anchor attributes to satisfy Next.js Link
        {...(props as AnchorHTMLAttributes<HTMLAnchorElement>)}
      >
        {children}
      </Link>
    );
  }

  // Render standard button
  return (
    <button
      ref={ref}
      type={type || 'button'}
      aria-label={ariaLabel}
      disabled={disabled}
      className={classes}
      {...props}
    >
      {children}
    </button>
  );
}
