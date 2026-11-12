import { z } from 'zod';
import { requiredPathOrUrl, requiredText } from '@/features/shared/lib/form-validation';

export const heroSlideFormSchema = z.object({
  imageUrl: requiredPathOrUrl('Image URL'),
  alt: requiredText('Alt text'),
  title: requiredText('Title'),
  subtitle: z.string().trim(),
  linkUrl: requiredPathOrUrl('Link URL'),
  visible: z.boolean(),
});

export type HeroSlideFormInput = z.input<typeof heroSlideFormSchema>;
export type ValidatedHeroSlideForm = z.output<typeof heroSlideFormSchema>;
