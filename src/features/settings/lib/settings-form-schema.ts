import { z } from 'zod';
import { requiredText } from '@/features/shared/lib/form-validation';

function httpUrl(label: string) {
  return z
    .string()
    .trim()
    .min(1, `${label} is required.`)
    .max(2048, `${label} is too long.`)
    .refine((value) => /^https?:\/\//.test(value), 'Use a full http(s) URL.');
}

export const settingsFormSchema = z.object({
  siteName: requiredText('Site name').max(100, 'Site name is too long.'),
  phone: z
    .string()
    .trim()
    .min(1, 'Phone number is required.')
    .max(40, 'Phone number is too long.')
    .regex(/^[0-9+\s().-]+$/, 'Use digits, spaces, and + ( ) . - only.'),
  facebookUrl: httpUrl('Facebook URL'),
  instagramUrl: httpUrl('Instagram URL'),
  address: requiredText('Address').max(300, 'Address is too long.'),
  email: z
    .string()
    .trim()
    .min(1, 'Email is required.')
    .max(200, 'Email is too long.')
    .email('Enter a valid email address.'),
});

export type ValidatedSettingsForm = z.output<typeof settingsFormSchema>;
