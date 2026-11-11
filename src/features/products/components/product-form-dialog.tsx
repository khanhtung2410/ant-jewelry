'use client';

import { useRouter } from 'next/navigation';
import { useActionState, useEffect, useId, useRef, useState } from 'react';
import { CloseIcon } from '@/features/layout/components/icons';
import { saveProduct, type ProductFormState, type ProductFormValues } from '../actions';

const inputClassName =
  'w-full rounded-md border border-[var(--line)] bg-background px-3 py-2 text-sm font-normal';

export type ProductCategoryOption = {
  id: string;
  name: string;
  type: string;
  status: 'VISIBLE' | 'HIDDEN';
};

export function ProductFormDialog({
  values,
  categories,
  productName,
  editorView,
  closeHref,
}: {
  values: ProductFormValues;
  categories: ProductCategoryOption[];
  productName: string | null;
  editorView: boolean;
  closeHref: string;
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

  const title = editorView
    ? (productName ?? 'Product details')
    : values.productId
      ? `Edit ${productName ?? 'product'}`
      : 'New product';

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
      className="m-auto max-h-[calc(100vh-2rem)] w-[calc(100vw-2rem)] max-w-2xl overflow-hidden rounded-xl border border-[var(--line)] bg-background p-0 text-foreground shadow-2xl backdrop:bg-black/45"
    >
      <div className="flex items-start justify-between gap-4 border-b border-[var(--line)] px-5 py-4">
        <div className="min-w-0">
          <h2 id={titleId} className="truncate font-heading text-lg tracking-[0.06em]">
            {title}
          </h2>
          <p className="mt-1 text-xs text-[var(--font-color)]">
            {editorView
              ? 'View only — product changes are restricted to ADMIN accounts.'
              : 'Changes are saved to the storefront immediately.'}
          </p>
        </div>
        <button
          type="button"
          onClick={close}
          aria-label="Close product form"
          className="rounded-md p-1.5 text-[var(--font-color)] transition hover:bg-[var(--product-image-background)] hover:text-foreground"
        >
          <CloseIcon className="h-4 w-4" />
        </button>
      </div>

      <div className="max-h-[calc(100vh-10rem)] overflow-y-auto px-5 py-4">
        <ProductForm
          key={values.productId ?? `new-${values.categoryId}`}
          values={values}
          categories={categories}
          readOnly={editorView}
          returnTo={closeHref}
          onCancel={close}
        />
      </div>
    </dialog>
  );
}

function ProductForm({
  values,
  categories,
  readOnly,
  returnTo,
  onCancel,
}: {
  values: ProductFormValues;
  categories: ProductCategoryOption[];
  readOnly: boolean;
  returnTo: string;
  onCancel: () => void;
}) {
  const initialState: ProductFormState = {
    values,
    fieldErrors: {},
    message: null,
  };
  const [state, formAction, pending] = useActionState(saveProduct, initialState);

  return (
    <ProductFormFields
      key={JSON.stringify(state.values)}
      action={formAction}
      values={state.values}
      errors={state.fieldErrors}
      message={state.message}
      categories={categories}
      readOnly={readOnly}
      pending={pending}
      returnTo={returnTo}
      onCancel={onCancel}
    />
  );
}

function ProductFormFields({
  action,
  values,
  errors,
  message,
  categories,
  readOnly,
  pending,
  returnTo,
  onCancel,
}: {
  action: (formData: FormData) => void;
  values: ProductFormValues;
  errors: Record<string, string[]>;
  message: string | null;
  categories: ProductCategoryOption[];
  readOnly: boolean;
  pending: boolean;
  returnTo: string;
  onCancel: () => void;
}) {
  const [categoryId, setCategoryId] = useState(values.categoryId);
  const selectedCategory = categories.find((category) => category.id === categoryId);

  return (
    <form action={action} className="space-y-4">
      {values.productId ? <input type="hidden" name="productId" value={values.productId} /> : null}
      <input type="hidden" name="returnTo" value={returnTo} />
      <fieldset disabled={readOnly} className="space-y-4 disabled:opacity-80">
        <Field label="Name" error={errors.name?.[0]}>
          <input
            name="name"
            defaultValue={values.name}
            readOnly={readOnly}
            className={inputClassName}
          />
        </Field>
        <Field label="Slug" error={errors.slug?.[0]}>
          <input
            name="slug"
            defaultValue={values.slug}
            readOnly={readOnly}
            className={inputClassName}
          />
        </Field>
        <Field label="Category" error={errors.categoryId?.[0]}>
          <select
            name="categoryId"
            value={categoryId}
            onChange={(event) => setCategoryId(event.target.value)}
            className={inputClassName}
          >
            <option value="">Choose category</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
                {category.status === 'HIDDEN' ? ' (hidden)' : ''}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Type" error={errors.type?.[0]}>
          <input type="hidden" name="type" value={selectedCategory?.type ?? values.type} />
          <input
            value={selectedCategory?.type ?? values.type}
            readOnly
            className={`${inputClassName} bg-[var(--product-image-background)]`}
          />
        </Field>
        <Field label="Brand" error={errors.brand?.[0]}>
          <input
            name="brand"
            defaultValue={values.brand}
            readOnly={readOnly}
            className={inputClassName}
          />
        </Field>
        <Field label="Price (VND)" error={errors.price?.[0]}>
          <input
            name="price"
            inputMode="numeric"
            defaultValue={values.price}
            readOnly={readOnly}
            className={inputClassName}
          />
        </Field>
        <Field label="Description" error={errors.description?.[0]}>
          <textarea
            name="description"
            defaultValue={values.description}
            readOnly={readOnly}
            rows={3}
            className={inputClassName}
          />
        </Field>
        <Field label="Details (one “name: value” per line)" error={errors.details?.[0]}>
          <textarea
            name="details"
            defaultValue={values.details}
            readOnly={readOnly}
            rows={4}
            className={inputClassName}
          />
        </Field>
        <ColorFields colors={values.colors} errors={errors} readOnly={readOnly} />
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="published"
            defaultChecked={values.published}
            className="size-4 accent-foreground"
          />
          Published on storefront
        </label>
      </fieldset>

      {message ? (
        <p role="alert" className="text-sm text-red-700">
          {message}
        </p>
      ) : null}
      {errors.form?.map((error) => (
        <p key={error} role="alert" className="text-sm text-red-700">
          {error}
        </p>
      ))}
      {!readOnly ? (
        <div className="sticky bottom-0 -mx-5 flex flex-col-reverse gap-2 border-t border-[var(--line)] bg-background px-5 py-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-md border border-[var(--line)] px-4 py-2 text-sm font-medium transition hover:border-[var(--underline-color)]"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={pending}
            className="rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background disabled:opacity-60"
          >
            {pending ? 'Saving…' : values.productId ? 'Save product' : 'Create product'}
          </button>
        </div>
      ) : null}
    </form>
  );
}

function ColorFields({
  colors,
  errors,
  readOnly,
}: {
  colors: ProductFormValues['colors'];
  errors: Record<string, string[]>;
  readOnly: boolean;
}) {
  const [rows, setRows] = useState(colors);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium">Colors</p>
        {!readOnly ? (
          <button
            type="button"
            onClick={() => setRows((current) => [...current, { id: '', name: '', hex: '' }])}
            className="text-xs underline underline-offset-2"
          >
            Add color
          </button>
        ) : null}
      </div>
      {rows.map((color, index) => (
        <div
          key={`${color.id || 'new'}-${index}`}
          className="grid grid-cols-[1fr_130px_auto] gap-2"
        >
          <input type="hidden" name="colorId" value={color.id} />
          <div>
            <input
              name="colorName"
              defaultValue={color.name}
              readOnly={readOnly}
              aria-label={`Color ${index + 1} name`}
              placeholder="Color name"
              className={inputClassName}
            />
            {errors[`colors.${index}.name`]?.[0] ? (
              <p className="mt-1 text-xs text-red-700">{errors[`colors.${index}.name`][0]}</p>
            ) : null}
          </div>
          <div>
            <input
              name="colorHex"
              defaultValue={color.hex}
              readOnly={readOnly}
              aria-label={`Color ${index + 1} hex`}
              placeholder="#RRGGBB"
              className={inputClassName}
            />
            {errors[`colors.${index}.hex`]?.[0] ? (
              <p className="mt-1 text-xs text-red-700">{errors[`colors.${index}.hex`][0]}</p>
            ) : null}
          </div>
          {!readOnly ? (
            <button
              type="button"
              aria-label={`Remove color ${index + 1}`}
              onClick={() =>
                setRows((current) => current.filter((_, rowIndex) => rowIndex !== index))
              }
              className="px-2 text-sm text-[var(--font-color)] hover:text-red-700"
            >
              Remove
            </button>
          ) : (
            <span aria-hidden="true" />
          )}
        </div>
      ))}
      {errors.colors?.[0] ? <p className="text-xs text-red-700">{errors.colors[0]}</p> : null}
    </div>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-1 text-sm font-medium">
      {label}
      {children}
      {error ? <span className="block text-xs font-normal text-red-700">{error}</span> : null}
    </label>
  );
}
