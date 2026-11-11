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
    'inline-flex h-[30px] w-[30px] items-center justify-center rounded-full border-2 border-neutral-800 bg-white/50 text-[var(--font-color)] transition-colors duration-200',
    'hover:border-[var(--underline-color)] hover:bg-neutral-200 hover:text-[var(--underline-color)]',
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
