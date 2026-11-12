import { z } from 'zod';
import { publishStatus } from '@/constants/statuses';
import {
  dateInputSchema,
  requiredPathOrUrl,
  requiredText,
  slugSchema,
} from '@/features/shared/lib/form-validation';

export const blogPostFormSchema = z.object({
  title: requiredText('Title'),
  slug: slugSchema,
  summary: requiredText('Summary'),
  body: requiredText('Body'),
  coverImageUrl: requiredPathOrUrl('Cover image URL'),
  publishedAt: dateInputSchema,
  status: z.enum([publishStatus.DRAFT, publishStatus.PUBLISHED], {
    message: 'Choose a status.',
  }),
});

export type BlogPostFormInput = z.input<typeof blogPostFormSchema>;
export type ValidatedBlogPostForm = z.output<typeof blogPostFormSchema>;
