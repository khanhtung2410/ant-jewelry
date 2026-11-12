import { z } from 'zod';

export const ROLE_OPTIONS = ['ADMIN', 'EDITOR'] as const;

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
    .max(72, 'Password must be at most 72 characters.'),
  role: z.enum(ROLE_OPTIONS),
});

export const updateUserAccessSchema = z.object({
  userId: z.string().min(1, 'Choose a user.'),
  role: z.enum(ROLE_OPTIONS),
  locked: z.boolean(),
});

export type ValidatedCreateUser = z.output<typeof createUserSchema>;
export type ValidatedUserAccess = z.output<typeof updateUserAccessSchema>;
