'use server';

import { Prisma } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { getAdminSession } from '@/features/auth/session';
import { prisma } from '@/features/shared/db/prisma';
import {
  formatZodIssues,
  formState,
  readFormBoolean,
  readFormString,
  type FormState,
} from '@/features/shared/lib/form-validation';
import { canManageUsers } from '@/features/shared/lib/permissions';
import { createUserSchema, updateUserAccessSchema } from './lib/user-form-schema';
import { wouldRemoveLastActiveAdmin } from './lib/last-admin';

const DUPLICATE_EMAIL_ERROR = 'This email address is already in use.';
const LAST_ADMIN_ERROR = 'At least one active ADMIN account must remain.';

class LastActiveAdminError extends Error {}
class UserNotFoundError extends Error {}

export type CreateUserFormValues = {
  name: string;
  email: string;
  role: string;
};

export type CreateUserFormState = FormState<CreateUserFormValues>;

export type UserAccessFormValues = {
  userId: string;
  role: string;
  locked: boolean;
};

export type UserAccessFormState = FormState<UserAccessFormValues>;

function readCreateUserFormValues(formData: FormData): CreateUserFormValues {
  return {
    name: readFormString(formData, 'name'),
    email: readFormString(formData, 'email'),
    role: readFormString(formData, 'role'),
  };
}

function readUserAccessFormValues(formData: FormData): UserAccessFormValues {
  return {
    userId: readFormString(formData, 'userId'),
    role: readFormString(formData, 'role'),
    locked: readFormBoolean(formData, 'locked'),
  };
}

export async function createUser(
  _previousState: CreateUserFormState,
  formData: FormData,
): Promise<CreateUserFormState> {
  const values = readCreateUserFormValues(formData);
  const session = await getAdminSession();
  if (!session || !canManageUsers(session.role)) {
    return formState(values, { form: ['You do not have permission to manage users.'] });
  }

  const parsed = createUserSchema.safeParse({
    ...values,
    password: readFormString(formData, 'password'),
  });
  if (!parsed.success) {
    return formState(values, formatZodIssues(parsed.error.issues));
  }

  try {
    await prisma.user.create({
      data: {
        name: parsed.data.name || null,
        email: parsed.data.email,
        role: parsed.data.role,
        passwordHash: await bcrypt.hash(parsed.data.password, 10),
      },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return formState(values, { email: [DUPLICATE_EMAIL_ERROR] });
    }
    throw error;
  }

  revalidatePath('/admin/users');
  redirect('/admin/users?saved=1');
}

export async function saveUserAccess(
  _previousState: UserAccessFormState,
  formData: FormData,
): Promise<UserAccessFormState> {
  const values = readUserAccessFormValues(formData);
  const session = await getAdminSession();
  if (!session || !canManageUsers(session.role)) {
    return formState(values, { form: ['You do not have permission to manage users.'] });
  }

  const parsed = updateUserAccessSchema.safeParse(values);
  if (!parsed.success) {
    return formState(values, formatZodIssues(parsed.error.issues));
  }

  try {
    await prisma.$transaction(async (transaction) => {
      const current = await transaction.user.findUnique({
        where: { id: parsed.data.userId },
        select: { role: true, locked: true },
      });
      if (!current) {
        throw new UserNotFoundError();
      }

      const next = { role: parsed.data.role, locked: parsed.data.locked };
      const isLosingAdminAccess =
        current.role === 'ADMIN' && !current.locked && (next.role !== 'ADMIN' || next.locked);
      const otherActiveAdminCount = isLosingAdminAccess
        ? await transaction.user.count({
            where: { role: 'ADMIN', locked: false, id: { not: parsed.data.userId } },
          })
        : 0;

      if (wouldRemoveLastActiveAdmin({ current, next, otherActiveAdminCount })) {
        throw new LastActiveAdminError();
      }

      await transaction.user.update({
        where: { id: parsed.data.userId },
        data: next,
      });
    });
  } catch (error) {
    if (error instanceof LastActiveAdminError) {
      return formState(values, { form: [LAST_ADMIN_ERROR] });
    }
    if (error instanceof UserNotFoundError) {
      return formState(values, { form: ['This user no longer exists.'] });
    }
    throw error;
  }

  revalidatePath('/admin/users');
  redirect('/admin/users?saved=1');
}
