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
import { PRODUCT_TYPES } from '@/features/shared/domain/domain';
import {
  saveCategory,
  type CategoryFormState,
  type CategoryFormValues,
} from '../actions/categories';

export function CategoryFormDialog({
  values,
  closeHref,
}: {
  values: CategoryFormValues;
  closeHref: string;
}) {
  const initialState: CategoryFormState = {
    values,
    fieldErrors: {},
    message: null,
  };
  const [state, formAction, pending] = useActionState(saveCategory, initialState);

  return (
    <AdminDialog
      title={values.categoryId ? `Edit ${values.name}` : 'New category'}
      description="Categories control the home page sections and storefront navigation order."
      closeHref={closeHref}
    >
      <form action={formAction} className="space-y-4">
        {values.categoryId ? (
          <input type="hidden" name="categoryId" value={values.categoryId} />
        ) : null}
        <input type="hidden" name="returnTo" value={closeHref} />

        <FormField label="Name" error={state.fieldErrors.name?.[0]}>
          <input name="name" defaultValue={state.values.name} className={inputClassName} />
        </FormField>

        <FormField
          label="Slug"
          hint="Used in the category URL, for example /c/wedding-ring."
          error={state.fieldErrors.slug?.[0]}
        >
          <input name="slug" defaultValue={state.values.slug} className={inputClassName} />
        </FormField>

        <FormField
          label="Product type"
          hint="Each product type can belong to one category."
          error={state.fieldErrors.type?.[0]}
        >
          <select name="type" defaultValue={state.values.type} className={inputClassName}>
            <option value="">Choose product type</option>
            {PRODUCT_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </FormField>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="visible"
            defaultChecked={state.values.visible}
            className="size-4 accent-foreground"
          />
          Show in storefront navigation and home page
        </label>

        <FormAlert message={state.message} />
        {state.fieldErrors.form?.map((error) => (
          <p key={error} role="alert" className="text-sm text-red-700">
            {error}
          </p>
        ))}

        <FormActions>
          <FormCancelButton closeHref={closeHref} />
          <FormSubmitButton pending={pending}>
            {values.categoryId ? 'Save category' : 'Create category'}
          </FormSubmitButton>
        </FormActions>
      </form>
    </AdminDialog>
  );
}
