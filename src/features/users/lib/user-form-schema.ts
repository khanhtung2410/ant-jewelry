import { z } from 'zod';
import { adminRole } from '@/constants/roles';

export const ROLE_OPTIONS = [adminRole.ADMIN, adminRole.EDITOR] as const;

// Mirrors AUTH_MESSAGES.PASSWORD_WHITESPACE so create, update and login all
// produce the same clear error; passwords are never silently normalized.
const PASSWORD_WHITESPACE_ERROR = 'Password must not start or end with whitespace.';

export const createUserSchema = z.object({
  name: z.string().trim().max(80, 'Name is too long.'),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .min(1, 'Email is required.')
    .max(200, 'Email is too long.')
    .email('Enter a valid email address.'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters.')
    .max(72, 'Password must be at most 72 characters.')
    .refine((value) => value === value.trim(), PASSWORD_WHITESPACE_ERROR),
  role: z.enum(ROLE_OPTIONS),
});

export const updateUserAccessSchema = z.object({
  userId: z.string().min(1, 'Choose a user.'),
  role: z.enum(ROLE_OPTIONS),
  locked: z.boolean(),
  password: z
    .string()
    .max(72, 'Password must be at most 72 characters.')
    .refine((value) => value === value.trim(), PASSWORD_WHITESPACE_ERROR)
    .refine((value) => value === '' || value.length >= 8, 'Password must be at least 8 characters.')
    .optional(),
});

export type ValidatedCreateUser = z.output<typeof createUserSchema>;
export type ValidatedUserAccess = z.output<typeof updateUserAccessSchema>;
