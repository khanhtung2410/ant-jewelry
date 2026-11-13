'use client';

import { useActionState, useId, useState } from 'react';
import { AdminDialog } from '@/features/admin/components/admin-dialog';
import {
  AdminTabButton,
  AdminTabList,
  AdminTabPanel,
} from '@/features/admin/components/admin-tabs';
import {
  FormActions,
  FormAlert,
  FormCancelButton,
  FormField,
  FormSubmitButton,
  inputClassName,
  readOnlyInputClassName,
} from '@/features/admin/components/form-controls';
import { saveProduct, type ProductFormState, type ProductFormValues } from '../actions';
import { ProductImageManagement } from './product-image-management';

export type ProductCategoryOption = {
  id: string;
  name: string;
  type: string;
  status: 'VISIBLE' | 'HIDDEN';
};

type ProductImage = {
  id: string;
  url: string;
  alt: string;
  isFront: boolean;
  isHover: boolean;
  sortOrder: number;
  productColorId: string | null;
};

export function ProductFormDialog({
  values,
  categories,
  productName,
  editorView,
  closeHref,
  images = [],
}: {
  values: ProductFormValues;
  categories: ProductCategoryOption[];
  productName: string | null;
  editorView: boolean;
  closeHref: string;
  images?: ProductImage[];
}) {
  const [tab, setTab] = useState<ProductDialogTab>('details');
  const tabsId = useId();
  const detailsTabId = `${tabsId}-details-tab`;
  const detailsPanelId = `${tabsId}-details-panel`;
  const imagesTabId = `${tabsId}-images-tab`;
  const imagesPanelId = `${tabsId}-images-panel`;
  const canManageImages = !editorView;
  const imagesTabLabel =
    values.productId && images.length > 0 ? `Images (${images.length})` : 'Images';

  const title = editorView
    ? (productName ?? 'Product details')
    : values.productId
      ? `Edit ${productName ?? 'product'}`
      : 'New product';

  return (
    <AdminDialog
      title={title}
      description={
        editorView
          ? 'View only — product changes are restricted to ADMIN accounts.'
          : 'Changes are saved to the storefront immediately.'
      }
      closeHref={closeHref}
      size="lg"
    >
      {canManageImages ? (
        <AdminTabList label="Product editor sections" className="mb-5">
          <AdminTabButton
            id={detailsTabId}
            panelId={detailsPanelId}
            active={tab === 'details'}
            onClick={() => setTab('details')}
            grow
          >
            Details
          </AdminTabButton>
          <AdminTabButton
            id={imagesTabId}
            panelId={imagesPanelId}
            active={tab === 'images'}
            onClick={() => setTab('images')}
            grow
          >
            {imagesTabLabel}
          </AdminTabButton>
        </AdminTabList>
      ) : null}

      <AdminTabPanel
        id={canManageImages ? detailsPanelId : undefined}
        labelledBy={canManageImages ? detailsTabId : undefined}
        active={canManageImages ? tab === 'details' : undefined}
      >
        <ProductForm
          key={values.productId ?? `new-${values.categoryId}`}
          values={values}
          categories={categories}
          readOnly={editorView}
          closeHref={closeHref}
        />
      </AdminTabPanel>

      {canManageImages ? (
        <AdminTabPanel id={imagesPanelId} labelledBy={imagesTabId} active={tab === 'images'}>
          {values.productId ? (
            <ProductImageManagement
              productId={values.productId}
              productName={productName ?? values.name}
              images={images}
              colors={values.colors.filter(
                (color): color is { id: string; name: string; hex: string } => Boolean(color.id),
              )}
              className="pt-1"
            />
          ) : (
            <section>
              <h3 className="font-heading text-sm tracking-[0.08em]">PRODUCT IMAGES</h3>
              <p className="mt-2 text-sm text-[var(--font-color)]">
                Save this product first to upload and manage images (JPG, PNG, or WebP; up to 5 MB
                each). After saving, open Edit and switch to the Images tab to reorder images,
                choose cover and hover images, assign images to colors, and delete images with
                storage cleanup.
              </p>
            </section>
          )}
        </AdminTabPanel>
      ) : null}
    </AdminDialog>
  );
}

type ProductDialogTab = 'details' | 'images';

function ProductForm({
  values,
  categories,
  readOnly,
  closeHref,
}: {
  values: ProductFormValues;
  categories: ProductCategoryOption[];
  readOnly: boolean;
  closeHref: string;
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
      returnTo={closeHref}
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
}: {
  action: (formData: FormData) => void;
  values: ProductFormValues;
  errors: Record<string, string[]>;
  message: string | null;
  categories: ProductCategoryOption[];
  readOnly: boolean;
  pending: boolean;
  returnTo: string;
}) {
  const [categoryId, setCategoryId] = useState(values.categoryId);
  const selectedCategory = categories.find((category) => category.id === categoryId);

  return (
    <form action={action} className="space-y-4">
      {values.productId ? <input type="hidden" name="productId" value={values.productId} /> : null}
      <input type="hidden" name="returnTo" value={returnTo} />
      <fieldset disabled={readOnly} className="space-y-4 disabled:opacity-80">
        <FormField label="Name" error={errors.name?.[0]}>
          <input
            name="name"
            defaultValue={values.name}
            readOnly={readOnly}
            className={readOnly ? readOnlyInputClassName : inputClassName}
          />
        </FormField>
        <FormField label="Slug" error={errors.slug?.[0]}>
          <input
            name="slug"
            defaultValue={values.slug}
            readOnly={readOnly}
            className={readOnly ? readOnlyInputClassName : inputClassName}
          />
        </FormField>
        <FormField label="Category" error={errors.categoryId?.[0]}>
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
        </FormField>
        <FormField label="Type" error={errors.type?.[0]}>
          <input type="hidden" name="type" value={selectedCategory?.type ?? values.type} />
          <input
            value={selectedCategory?.type ?? values.type}
            readOnly
            className={readOnlyInputClassName}
          />
        </FormField>
        <FormField label="Brand" error={errors.brand?.[0]}>
          <input
            name="brand"
            defaultValue={values.brand}
            readOnly={readOnly}
            className={readOnly ? readOnlyInputClassName : inputClassName}
          />
        </FormField>
        <FormField label="Price (VND)" error={errors.price?.[0]}>
          <input
            name="price"
            inputMode="numeric"
            defaultValue={values.price}
            readOnly={readOnly}
            className={readOnly ? readOnlyInputClassName : inputClassName}
          />
        </FormField>
        <FormField label="Description" error={errors.description?.[0]}>
          <textarea
            name="description"
            defaultValue={values.description}
            readOnly={readOnly}
            rows={3}
            className={readOnly ? readOnlyInputClassName : inputClassName}
          />
        </FormField>
        <FormField label="Details (one “name: value” per line)" error={errors.details?.[0]}>
          <textarea
            name="details"
            defaultValue={values.details}
            readOnly={readOnly}
            rows={4}
            className={readOnly ? readOnlyInputClassName : inputClassName}
          />
        </FormField>
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

      <FormAlert message={message} />
      {errors.form?.map((error) => (
        <p key={error} role="alert" className="text-sm text-red-700">
          {error}
        </p>
      ))}
      {!readOnly ? (
        <FormActions>
          <FormCancelButton closeHref={returnTo} />
          <FormSubmitButton pending={pending}>
            {values.productId ? 'Save product' : 'Create product'}
          </FormSubmitButton>
        </FormActions>
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
              className={readOnly ? readOnlyInputClassName : inputClassName}
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
              className={readOnly ? readOnlyInputClassName : inputClassName}
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
