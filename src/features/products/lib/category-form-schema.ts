import { z } from 'zod';
import { PRODUCT_TYPES } from '@/features/shared/domain/domain';
import { requiredText, slugSchema } from '@/features/shared/lib/form-validation';

export const categoryFormSchema = z.object({
  name: requiredText('Category name'),
  slug: slugSchema,
  type: z.enum(PRODUCT_TYPES, { message: 'Choose a product type.' }),
  visible: z.boolean(),
});

export type CategoryFormInput = z.input<typeof categoryFormSchema>;
export type ValidatedCategoryForm = z.output<typeof categoryFormSchema>;
