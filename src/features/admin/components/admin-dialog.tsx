'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useId, useRef, type ReactNode } from 'react';
import { CloseIcon } from '@/features/layout/components/icons';

export function AdminDialog({
  title,
  description,
  closeHref,
  children,
  size = 'md',
}: {
  title: string;
  description?: string;
  closeHref: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg';
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const router = useRouter();
  const titleId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog || dialog.open) return;
    dialog.showModal();
  }, []);

  const close = () => router.replace(closeHref);

  const maxWidth = size === 'sm' ? 'max-w-lg' : size === 'lg' ? 'max-w-4xl' : 'max-w-2xl';

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      onCancel={(event) => {
        event.preventDefault();
        close();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) close();
      }}
      className={`m-auto max-h-[calc(100vh-2rem)] w-[calc(100vw-2rem)] ${maxWidth} overflow-hidden rounded-xl border border-[var(--line)] bg-background p-0 text-foreground shadow-2xl backdrop:bg-black/45`}
    >
      <div className="flex items-start justify-between gap-4 border-b border-[var(--line)] px-5 py-4">
        <div className="min-w-0">
          <h2 id={titleId} className="truncate font-heading text-lg tracking-[0.06em]">
            {title}
          </h2>
          {description ? (
            <p className="mt-1 text-xs text-[var(--font-color)]">{description}</p>
          ) : null}
        </div>
        <button
          type="button"
          onClick={close}
          aria-label="Close dialog"
          className="rounded-md p-1.5 text-[var(--font-color)] transition hover:bg-[var(--product-image-background)] hover:text-foreground"
        >
          <CloseIcon className="h-4 w-4" />
        </button>
      </div>

      <div className="max-h-[calc(100vh-10rem)] overflow-y-auto px-5 py-4">{children}</div>
    </dialog>
  );
}
