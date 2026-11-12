import { z } from 'zod';

export type FieldErrors = Record<string, string[]>;

export type FormState<TValues> = {
  values: TValues;
  fieldErrors: FieldErrors;
  message: string | null;
};

export function formatZodIssues(issues: { path: PropertyKey[]; message: string }[]): FieldErrors {
  const fieldErrors: FieldErrors = {};

  for (const issue of issues) {
    const field = issue.path.map(String).join('.') || 'form';
    fieldErrors[field] = [...(fieldErrors[field] ?? []), issue.message];
  }

  return fieldErrors;
}

export function formState<TValues>(
  values: TValues,
  fieldErrors: FieldErrors = {},
  message: string | null = null,
): FormState<TValues> {
  return { values, fieldErrors, message };
}

export function readFormString(formData: FormData, key: string): string {
  return String(formData.get(key) ?? '');
}

export function readFormBoolean(formData: FormData, key: string): boolean {
  return formData.get(key) === 'on' || formData.get(key) === 'true';
}

export const slugSchema = z
  .string()
  .trim()
  .min(1, 'Slug is required.')
  .regex(/^[a-z0-9-]+$/, 'Use lowercase letters, numbers, and hyphens only.');

export function requiredText(label: string) {
  return z.string().trim().min(1, `${label} is required.`);
}

export const sortOrderInputSchema = z
  .string()
  .trim()
  .regex(/^\d+$/, 'Sort order must be a whole number.')
  .transform((value) => Number(value))
  .refine(
    (value) => Number.isSafeInteger(value) && value >= 0,
    'Sort order must be zero or greater.',
  );

export function isPathOrUrl(value: string): boolean {
  return value.startsWith('/') || /^https?:\/\//.test(value);
}

export function requiredPathOrUrl(label: string) {
  return z
    .string()
    .trim()
    .min(1, `${label} is required.`)
    .refine(isPathOrUrl, 'Use a site path (starting with /) or an http(s) URL.');
}

export function optionalPathOrUrl(label: string) {
  return z
    .string()
    .trim()
    .refine((value) => value === '' || isPathOrUrl(value), `${label} must be a site path or URL.`);
}

export const dateInputSchema = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Enter a valid date.')
  .refine(isValidDateInput, 'Enter a valid date.');

export function isValidDateInput(value: string): boolean {
  const [year, month, day] = value.split('-').map(Number);
  if (!year || !month || !day) return false;
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day
  );
}
