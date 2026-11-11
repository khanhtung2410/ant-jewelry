'use client';

import Link from 'next/link';
import { useActionState, useState } from 'react';
import { formatPrice } from '@/features/shared/lib/format-price';
import {
  saveProduct,
  toggleProductVisibility,
  type ProductFormState,
  type ProductFormValues,
} from '../actions';

const inputClassName =
  'w-full rounded-md border border-[var(--line)] bg-background px-3 py-2 text-sm font-normal';

export type AdminProductRow = {
  id: string;
  name: string;
  slug: string;
  price: number;
  status: 'VISIBLE' | 'HIDDEN';
  category: { id: string; name: string };
};

export type ProductCategoryOption = {
  id: string;
  name: string;
  type: string;
  status: 'VISIBLE' | 'HIDDEN';
};

type Props = {
  products: AdminProductRow[];
  categories: ProductCategoryOption[];
  values: ProductFormValues | null;
  selectedProductName: string | null;
  search: string;
  categoryFilter: string;
  editorView: boolean;
  saved: boolean;
};

export function ProductManagement({
  products,
  categories,
  values,
  selectedProductName,
  search,
  categoryFilter,
  editorView,
  saved,
}: Props) {
  return (
    <div>
      <div className="mb-5 rounded-lg border border-[var(--line)] p-4">
        <form
          action="/admin/products"
          method="get"
          className="grid gap-3 sm:grid-cols-[1fr_220px_auto_auto]"
        >
          <label className="text-sm font-medium">
            Search by name
            <input
              type="search"
              name="search"
              defaultValue={search}
              placeholder="Product name"
              className="mt-1 w-full rounded-md border border-[var(--line)] bg-background px-3 py-2 font-normal"
            />
          </label>
          <label className="text-sm font-medium">
            Category
            <select
              name="category"
              defaultValue={categoryFilter}
              className="mt-1 w-full rounded-md border border-[var(--line)] bg-background px-3 py-2 font-normal"
            >
              <option value="">All categories</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                  {category.status === 'HIDDEN' ? ' (hidden)' : ''}
                </option>
              ))}
            </select>
          </label>
          <button
            type="submit"
            className="self-end rounded-md bg-foreground px-4 py-2 text-sm text-background"
          >
            Filter
          </button>
          <Link
            href="/admin/products"
            className="self-end rounded-md border border-[var(--line)] px-4 py-2 text-center text-sm"
          >
            Clear
          </Link>
        </form>
      </div>

      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1.15fr)_minmax(360px,0.85fr)]">
        <section className="min-w-0 overflow-hidden rounded-lg border border-[var(--line)]">
          <div className="border-b border-[var(--line)] px-4 py-3">
            <h2 className="font-heading text-sm tracking-[0.08em]">PRODUCTS ({products.length})</h2>
          </div>
          {products.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[620px] border-collapse text-left text-sm">
                <thead className="bg-[var(--product-image-background)] text-xs uppercase tracking-wide text-[var(--font-color)]">
                  <tr>
                    <th className="px-4 py-3 font-medium">Product</th>
                    <th className="px-4 py-3 font-medium">Category</th>
                    <th className="px-4 py-3 font-medium">Price</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product) => {
                    const selectedHref = editorView
                      ? `/admin/products?view=${encodeURIComponent(product.id)}`
                      : `/admin/products?edit=${encodeURIComponent(product.id)}`;

                    return (
                      <tr key={product.id} className="border-t border-[var(--line)]">
                        <td className="px-4 py-3">
                          <Link href={selectedHref} className="font-medium hover:underline">
                            {product.name}
                          </Link>
                          <p className="mt-1 text-xs text-[var(--font-color)]">/{product.slug}</p>
                        </td>
                        <td className="px-4 py-3">{product.category.name}</td>
                        <td className="whitespace-nowrap px-4 py-3">
                          {formatPrice(product.price)} ₫
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={
                              product.status === 'VISIBLE'
                                ? 'rounded-full bg-emerald-50 px-2 py-1 text-xs text-emerald-800'
                                : 'rounded-full bg-stone-100 px-2 py-1 text-xs text-stone-700'
                            }
                          >
                            {product.status === 'VISIBLE' ? 'Published' : 'Hidden'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {editorView ? (
                            <Link href={selectedHref} className="underline underline-offset-2">
                              View
                            </Link>
                          ) : (
                            <form action={toggleProductVisibility.bind(null, product.id)}>
                              <button
                                type="submit"
                                className="whitespace-nowrap underline underline-offset-2"
                              >
                                {product.status === 'VISIBLE' ? 'Hide' : 'Publish'}
                              </button>
                            </form>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="px-4 py-8 text-sm text-[var(--font-color)]">
              No products match this filter.
            </p>
          )}
        </section>

        <section className="min-w-0 rounded-lg border border-[var(--line)] p-4 sm:p-5">
          {values ? (
            <>
              <div className="mb-4 border-b border-[var(--line)] pb-3">
                <h2 className="font-heading text-sm tracking-[0.08em]">
                  {editorView
                    ? (selectedProductName ?? 'Product details')
                    : values.productId
                      ? `EDIT ${selectedProductName ?? 'PRODUCT'}`
                      : 'NEW PRODUCT'}
                </h2>
                {editorView ? (
                  <p className="mt-1 text-xs text-[var(--font-color)]">View only</p>
                ) : null}
              </div>
              <ProductForm
                key={values.productId ?? `new-${values.categoryId}`}
                values={values}
                categories={categories}
                readOnly={editorView}
              />
            </>
          ) : (
            <div className="py-8 text-sm text-[var(--font-color)]">
              {editorView
                ? 'Select a product to view its details.'
                : 'Select a product to edit, or create a new product.'}
            </div>
          )}
        </section>
      </div>
      {saved ? (
        <p role="status" className="mt-4 text-sm text-emerald-800">
          Product saved.
        </p>
      ) : null}
    </div>
  );
}

function ProductForm({
  values,
  categories,
  readOnly,
}: {
  values: ProductFormValues;
  categories: ProductCategoryOption[];
  readOnly: boolean;
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
}: {
  action: (formData: FormData) => void;
  values: ProductFormValues;
  errors: Record<string, string[]>;
  message: string | null;
  categories: ProductCategoryOption[];
  readOnly: boolean;
  pending: boolean;
}) {
  const [categoryId, setCategoryId] = useState(values.categoryId);
  const selectedCategory = categories.find((category) => category.id === categoryId);

  return (
    <form action={action} className="space-y-4">
      {values.productId ? <input type="hidden" name="productId" value={values.productId} /> : null}
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
        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-md bg-foreground px-4 py-2.5 text-sm font-medium text-background disabled:opacity-60"
        >
          {pending ? 'Saving…' : values.productId ? 'Save product' : 'Create product'}
        </button>
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
