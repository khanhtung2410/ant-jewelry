'use client';

import { useRef, useState, type FormEvent, type ReactNode } from 'react';
import { useFormStatus } from 'react-dom';
import { AdminStatusToast } from './admin-status-toast';
import { ConfirmPopover } from './confirm-popover';

function PendingToast({ message }: { message: string }) {
  const { pending } = useFormStatus();
  return pending ? <AdminStatusToast message={message} /> : null;
}

/**
 * Wraps a destructive Server Action form. Replaces window.confirm with an
 * accessible in-app popover and shows a bottom-left busy indicator while the
 * action runs.
 */
export function AdminConfirmForm({
  action,
  confirmMessage,
  children,
  className = '',
  confirmLabel = 'Delete',
  danger = true,
  pendingMessage = 'Deleting…',
}: {
  action: (formData: FormData) => void;
  confirmMessage: string;
  children: ReactNode;
  className?: string;
  confirmLabel?: string;
  danger?: boolean;
  pendingMessage?: string;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const confirmedRef = useRef(false);
  const [open, setOpen] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    if (!confirmedRef.current) {
      event.preventDefault();
      setOpen(true);
      return;
    }
    confirmedRef.current = false;
  }

  function cancel() {
    setOpen(false);
    formRef.current?.querySelector<HTMLButtonElement>('button')?.focus();
  }

  function confirm() {
    confirmedRef.current = true;
    setOpen(false);
    formRef.current?.requestSubmit();
  }

  return (
    <>
      <form ref={formRef} action={action} className={className} onSubmit={handleSubmit}>
        {children}
        <PendingToast message={pendingMessage} />
      </form>
      {open ? (
        <ConfirmPopover
          message={confirmMessage}
          onConfirm={confirm}
          onCancel={cancel}
          confirmLabel={confirmLabel}
          danger={danger}
        />
      ) : null}
    </>
  );
}
