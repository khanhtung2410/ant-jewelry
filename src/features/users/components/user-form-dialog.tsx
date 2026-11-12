'use client';

import { useActionState } from 'react';
import { AdminDialog } from '@/features/admin/components/admin-dialog';
import {
  FormActions,
  FormAlert,
  FormCancelButton,
  FormField,
  FormSubmitButton,
  inputClassName,
} from '@/features/admin/components/form-controls';
import { createUser, type CreateUserFormState } from '../actions';

export function UserFormDialog({ closeHref }: { closeHref: string }) {
  const initialState: CreateUserFormState = {
    values: { name: '', email: '', role: 'EDITOR' },
    fieldErrors: {},
    message: null,
  };
  const [state, formAction, pending] = useActionState(createUser, initialState);

  return (
    <AdminDialog
      title="New user"
      description="Create an internal account and assign its role."
      closeHref={closeHref}
      size="sm"
    >
      <form action={formAction} className="space-y-4">
        <FormField label="Name (optional)" error={state.fieldErrors.name?.[0]}>
          <input name="name" defaultValue={state.values.name} className={inputClassName} />
        </FormField>

        <FormField label="Email" error={state.fieldErrors.email?.[0]}>
          <input
            type="email"
            name="email"
            defaultValue={state.values.email}
            autoComplete="off"
            className={inputClassName}
          />
        </FormField>

        <FormField
          label="Password"
          hint="At least 8 characters."
          error={state.fieldErrors.password?.[0]}
        >
          <input
            type="password"
            name="password"
            autoComplete="new-password"
            className={inputClassName}
          />
        </FormField>

        <FormField label="Role" error={state.fieldErrors.role?.[0]}>
          <select name="role" defaultValue={state.values.role} className={inputClassName}>
            <option value="EDITOR">EDITOR</option>
            <option value="ADMIN">ADMIN</option>
          </select>
        </FormField>

        <FormAlert message={state.message} />
        {state.fieldErrors.form?.map((error) => (
          <p key={error} role="alert" className="text-sm text-red-700">
            {error}
          </p>
        ))}

        <FormActions>
          <FormCancelButton closeHref={closeHref} />
          <FormSubmitButton pending={pending}>Create user</FormSubmitButton>
        </FormActions>
      </form>
    </AdminDialog>
  );
}
