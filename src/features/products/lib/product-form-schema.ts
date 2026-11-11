import { z } from 'zod';

const colorSchema = z.object({
  id: z.string(),
  name: z.string().trim().min(1, 'Color name is required.'),
  hex: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Use a hex color in #RRGGBB format.'),
});

export const productFormSchema = z.object({
  name: z.string().trim().min(1, 'Product name is required.'),
  slug: z
    .string()
    .trim()
    .regex(/^[a-z0-9-]+$/, 'Use lowercase letters, numbers, and hyphens only.'),
  categoryId: z.string().min(1, 'Choose a category.'),
  type: z.string().min(1, 'Choose a category.'),
  brand: z.string().trim().min(1, 'Brand is required.'),
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
