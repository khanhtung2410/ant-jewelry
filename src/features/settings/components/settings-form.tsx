'use client';

import { useActionState } from 'react';
import {
  FormAlert,
  FormField,
  FormSubmitButton,
  inputClassName,
} from '@/features/admin/components/form-controls';
import { saveSettings, type SettingsFormState, type SettingsFormValues } from '../actions';

export function SettingsForm({ values }: { values: SettingsFormValues }) {
  const initialState: SettingsFormState = {
    values,
    fieldErrors: {},
    message: null,
  };
  const [state, formAction, pending] = useActionState(saveSettings, initialState);

  return (
    <form action={formAction} className="max-w-3xl space-y-6">
      <section className="space-y-4 rounded-lg border border-[var(--line)] p-4">
        <div>
          <h2 className="font-heading text-sm tracking-[0.08em]">CONTACT DETAILS</h2>
          <p className="mt-1 text-xs text-[var(--font-color)]">
            These values appear in the storefront header, footer, and contact popover.
          </p>
        </div>

        <FormField label="Site name" error={state.fieldErrors.siteName?.[0]}>
          <input name="siteName" defaultValue={state.values.siteName} className={inputClassName} />
        </FormField>

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Phone number" error={state.fieldErrors.phone?.[0]}>
            <input name="phone" defaultValue={state.values.phone} className={inputClassName} />
          </FormField>

          <FormField label="Email" error={state.fieldErrors.email?.[0]}>
            <input
              type="email"
              name="email"
              defaultValue={state.values.email}
              className={inputClassName}
            />
          </FormField>
        </div>

        <FormField label="Address" error={state.fieldErrors.address?.[0]}>
          <textarea
            name="address"
            defaultValue={state.values.address}
            rows={3}
            className={inputClassName}
          />
        </FormField>
      </section>

      <section className="space-y-4 rounded-lg border border-[var(--line)] p-4">
        <div>
          <h2 className="font-heading text-sm tracking-[0.08em]">SOCIAL LINKS</h2>
          <p className="mt-1 text-xs text-[var(--font-color)]">
            Use full URLs, including https://.
          </p>
        </div>

        <FormField label="Facebook URL" error={state.fieldErrors.facebookUrl?.[0]}>
          <input
            type="url"
            name="facebookUrl"
            defaultValue={state.values.facebookUrl}
            className={inputClassName}
          />
        </FormField>

        <FormField label="Instagram URL" error={state.fieldErrors.instagramUrl?.[0]}>
          <input
            type="url"
            name="instagramUrl"
            defaultValue={state.values.instagramUrl}
            className={inputClassName}
          />
        </FormField>
      </section>

      <FormAlert message={state.message} />
      {state.fieldErrors.form?.map((error) => (
        <p key={error} role="alert" className="text-sm text-red-700">
          {error}
        </p>
      ))}

      <div className="flex justify-end">
        <FormSubmitButton pending={pending}>Save settings</FormSubmitButton>
      </div>
    </form>
  );
}
