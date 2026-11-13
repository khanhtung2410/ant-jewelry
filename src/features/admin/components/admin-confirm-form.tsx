'use client';

import type { ReactNode } from 'react';

export function AdminConfirmForm({
  action,
  confirmMessage,
  children,
  className = '',
}: {
  action: (formData: FormData) => void;
  confirmMessage: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <form
      action={action}
      className={className}
      onSubmit={(event) => {
        if (!window.confirm(confirmMessage)) {
          event.preventDefault();
        }
      }}
    >
      {children}
    </form>
  );
}
