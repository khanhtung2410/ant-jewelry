import type { MouseEventHandler } from 'react';

interface ArrowButtonProps {
  direction: 'left' | 'right';
  'aria-label': string;
  onClick: MouseEventHandler<HTMLButtonElement>;
  className?: string;
  disabled?: boolean;
}

export function ArrowButton({
  direction,
  'aria-label': ariaLabel,
  onClick,
  className = '',
  disabled = false,
}: ArrowButtonProps) {
  const classes = [
    'inline-flex h-[30px] w-[30px] items-center justify-center rounded-full border-2 border-[var(--component-arrow-button-border)] bg-[var(--component-arrow-button-background)] text-[var(--component-arrow-button-text)] transition-colors duration-200',
    'hover:border-[var(--component-arrow-button-hover-border)] hover:bg-[var(--component-arrow-button-hover-background)] hover:text-[var(--component-arrow-button-hover-text)]',
    'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--control-outline)] disabled:cursor-not-allowed disabled:opacity-40',
    className,
  ]
    .filter(Boolean)
    .join(' ')
    .trim();

  return (
    <button
      type="button"
      aria-label={ariaLabel}
      onClick={onClick}
      disabled={disabled}
      className={classes}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth="2.5"
        stroke="currentColor"
        aria-hidden="true"
        className={`h-6 w-6${direction === 'left' ? ' rotate-180' : ''}`}
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
      </svg>
    </button>
  );
}
