'use client';

import { useActionState } from 'react';
import { AdminDialog } from '@/features/admin/components/admin-dialog';
import {
  FormActions,
  FormAlert,
  FormCancelButton,
  FormField,
  FormSubmitButton,
  ImageUrlField,
  inputClassName,
} from '@/features/admin/components/form-controls';
import { saveHeroSlide, type HeroSlideFormState, type HeroSlideFormValues } from '../actions';

export function HeroSlideFormDialog({
  values,
  closeHref,
}: {
  values: HeroSlideFormValues;
  closeHref: string;
}) {
  const initialState: HeroSlideFormState = {
    values,
    fieldErrors: {},
    message: null,
  };
  const [state, formAction, pending] = useActionState(saveHeroSlide, initialState);

  return (
    <AdminDialog
      title={values.heroSlideId ? `Edit ${values.title}` : 'New hero slide'}
      description="Visible slides rotate on the home page in the order shown in the list."
      closeHref={closeHref}
      size="lg"
    >
      <form action={formAction} className="space-y-4">
        {values.heroSlideId ? (
          <input type="hidden" name="heroSlideId" value={values.heroSlideId} />
        ) : null}
        <input type="hidden" name="returnTo" value={closeHref} />

        <ImageUrlField
          label="Image URL"
          name="imageUrl"
          defaultValue={state.values.imageUrl}
          hint="Use a site path (starting with /) or an http(s) URL."
          error={state.fieldErrors.imageUrl?.[0]}
          previewAlt="Hero slide preview"
          previewClassName="aspect-[16/9] w-full max-w-md"
        />

        <FormField
          label="Alt text"
          hint="Describes the image for screen readers."
          error={state.fieldErrors.alt?.[0]}
        >
          <input name="alt" defaultValue={state.values.alt} className={inputClassName} />
        </FormField>

        <FormField label="Title" error={state.fieldErrors.title?.[0]}>
          <input name="title" defaultValue={state.values.title} className={inputClassName} />
        </FormField>

        <FormField label="Subtitle" error={state.fieldErrors.subtitle?.[0]}>
          <input name="subtitle" defaultValue={state.values.subtitle} className={inputClassName} />
        </FormField>

        <FormField
          label="Link URL"
          hint="Where the “Explore now” button should go."
          error={state.fieldErrors.linkUrl?.[0]}
        >
          <input name="linkUrl" defaultValue={state.values.linkUrl} className={inputClassName} />
        </FormField>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="visible"
            defaultChecked={state.values.visible}
            className="size-4 accent-foreground"
          />
          Show on the home page
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
            {values.heroSlideId ? 'Save slide' : 'Create slide'}
          </FormSubmitButton>
        </FormActions>
      </form>
    </AdminDialog>
  );
}
