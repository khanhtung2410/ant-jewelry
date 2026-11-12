'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, type ReactNode } from 'react';

export const inputClassName =
  'w-full rounded-md border border-[var(--line)] bg-background px-3 py-2 text-sm font-normal';

export const readOnlyInputClassName = `${inputClassName} bg-[var(--product-image-background)]`;

export function FormField({
  label,
  error,
  hint,
  children,
}: {
  label: string;
  error?: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className="block space-y-1 text-sm font-medium">
      {label}
      {children}
      {hint ? (
        <span className="block text-xs font-normal text-[var(--font-color)]">{hint}</span>
      ) : null}
      {error ? <span className="block text-xs font-normal text-red-700">{error}</span> : null}
    </label>
  );
}

export function FormAlert({ message }: { message: string | null }) {
  if (!message) return null;

  return (
    <p
      role="alert"
      className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
    >
      {message}
    </p>
  );
}

export function FormActions({ children }: { children: ReactNode }) {
  return (
    <div className="sticky bottom-0 -mx-5 flex flex-col-reverse gap-2 border-t border-[var(--line)] bg-background px-5 py-3 sm:flex-row sm:justify-end">
      {children}
    </div>
  );
}

export function ImageUrlField({
  label,
  name,
  defaultValue,
  error,
  hint,
  previewAlt,
  previewClassName = 'aspect-[4/3] w-full max-w-xs',
}: {
  label: string;
  name: string;
  defaultValue: string;
  error?: string;
  hint?: string;
  previewAlt?: string;
  previewClassName?: string;
}) {
  const [value, setValue] = useState(defaultValue);
  const preview = value.trim();

  return (
    <div className="space-y-2">
      <FormField label={label} hint={hint} error={error}>
        <input
          name={name}
          value={value}
          onChange={(event) => setValue(event.target.value)}
          className={inputClassName}
        />
      </FormField>
      {preview ? (
        <div
          className={`relative overflow-hidden rounded-md border border-[var(--line)] bg-[var(--product-image-background)] ${previewClassName}`}
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- admin preview of an arbitrary image URL */}
          <img
            src={preview}
            alt={previewAlt ?? 'Image preview'}
            className="h-full w-full object-cover"
          />
        </div>
      ) : null}
    </div>
  );
}

export function FormCancelButton({ closeHref }: { closeHref?: string }) {
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={() => {
        if (closeHref) {
          router.replace(closeHref);
          return;
        }

        const dialog = document.querySelector('dialog[open]');
        if (dialog instanceof HTMLDialogElement) dialog.close();
      }}
      className="rounded-md border border-[var(--line)] px-4 py-2 text-sm font-medium transition hover:border-[var(--underline-color)]"
    >
      Cancel
    </button>
  );
}

export function FormSubmitButton({
  pending,
  pendingLabel = 'Saving…',
  children,
}: {
  pending: boolean;
  pendingLabel?: string;
  children: ReactNode;
}) {
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background disabled:opacity-60"
    >
      {pending ? pendingLabel : children}
    </button>
  );
}

export function SavedNotice({ message, dismissHref }: { message: string; dismissHref: string }) {
  return (
    <p role="status" className="mt-4 flex items-center gap-3 text-sm text-emerald-800">
      {message}
      <Link href={dismissHref} className="underline underline-offset-2">
        Dismiss
      </Link>
    </p>
  );
}
