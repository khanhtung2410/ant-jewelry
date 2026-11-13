'use client';

import type { HTMLAttributes, ReactNode } from 'react';

export function AdminTabList({
  label,
  children,
  className = '',
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      role="tablist"
      aria-label={label}
      className={`flex rounded-md border border-[var(--line)] p-0.5 ${className}`}
    >
      {children}
    </div>
  );
}

export function AdminTabButton({
  id,
  panelId,
  active,
  onClick,
  grow = false,
  children,
}: {
  id?: string;
  panelId?: string;
  active: boolean;
  onClick: () => void;
  grow?: boolean;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      role="tab"
      id={id}
      aria-selected={active}
      aria-controls={panelId}
      onClick={onClick}
      className={`${grow ? 'flex-1 ' : ''}rounded px-3 py-1.5 text-xs font-medium transition ${
        active ? 'bg-foreground text-background' : 'text-[var(--font-color)] hover:text-foreground'
      }`}
    >
      {children}
    </button>
  );
}

export function AdminTabPanel({
  id,
  labelledBy,
  active,
  children,
  className = '',
}: {
  id?: string;
  labelledBy?: string;
  active?: boolean;
  children: ReactNode;
  className?: string;
}) {
  const panelProps: HTMLAttributes<HTMLDivElement> =
    id && labelledBy && active !== undefined
      ? { id, role: 'tabpanel', 'aria-labelledby': labelledBy, hidden: !active }
      : {};

  return (
    <div {...panelProps} className={className}>
      {children}
    </div>
  );
}
