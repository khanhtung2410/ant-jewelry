import type { MouseEventHandler } from 'react';

interface CloseButtonProps {
  onClick?: MouseEventHandler<HTMLButtonElement>;
  ariaLabel?: string;
  className?: string;
}

export function CloseButton({ onClick, ariaLabel = 'Close', className = '' }: CloseButtonProps) {
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      onClick={onClick}
      className={`group inline-flex h-[30px] w-[30px] items-center justify-center rounded-full border-2
        border-[var(--neutral-strong)] bg-[var(--button-bg-normal)] text-[var(--neutral-strong)] transition-colors duration-200 
        hover:border-[var(--danger-strong)] hover:bg-[var(--button-bg-hover)] hover:text-[var(--danger-text)] 
        focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--danger-strong)] ${className}`.trim()}
    >
      {/* X Icon SVG */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth="3"
        stroke="currentColor"
        className="h-5 w-5"
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
      </svg>
    </button>
  );
}
