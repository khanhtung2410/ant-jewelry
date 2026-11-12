import { z } from 'zod';
import { requiredText, slugSchema } from '@/features/shared/lib/form-validation';

const colorSchema = z.object({
  id: z.string(),
  name: requiredText('Color name'),
  hex: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Use a hex color in #RRGGBB format.'),
});

export const productFormSchema = z.object({
  name: requiredText('Product name'),
  slug: slugSchema,
  categoryId: z.string().min(1, 'Choose a category.'),
  type: z.string().min(1, 'Choose a category.'),
  brand: requiredText('Brand'),
  price: z
    .string()
    .trim()
    .regex(/^(?:\d+|\d{1,3}(?:\.\d{3})+)$/, 'Enter a positive integer price.')
    .transform((value) => Number(value.replaceAll('.', '')))
    .refine(
      (value) => Number.isSafeInteger(value) && value > 0,
      'Price must be a positive integer.',
    ),
  description: z.string().trim().min(1, 'Description is required.'),
  details: z.string().superRefine((value, context) => {
    value.split(/\r?\n/).forEach((line, index) => {
      if (line.trim() && (!line.includes(':') || !line.slice(0, line.indexOf(':')).trim())) {
        context.addIssue({
          code: 'custom',
          message: `Use “name: value” on line ${index + 1}.`,
        });
      }
    });
  }),
  colors: z.array(colorSchema),
  published: z.boolean(),
});

export type ProductFormInput = z.input<typeof productFormSchema>;
export type ValidatedProductForm = z.output<typeof productFormSchema>;

export function parseProductDetails(value: string): Record<string, string> {
  return Object.fromEntries(
    value
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const separator = line.indexOf(':');
        return [line.slice(0, separator).trim(), line.slice(separator + 1).trim()];
      }),
  );
}
