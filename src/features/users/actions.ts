'use server';
/* eslint-disable @typescript-eslint/no-explicit-any */

import bcrypt from 'bcryptjs';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { adminRole } from '@/constants/roles';
import { getAdminSession } from '@/features/auth/session';
import { prisma, isUniqueConstraintError } from '@/features/shared/db/prisma';
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
const SERIALIZABLE_TRANSACTION_ATTEMPTS = 3;

class LastActiveAdminError extends Error {}
class UserNotFoundError extends Error {}

function isRetryableTransactionError(error: unknown): boolean {
  const code = (error as { code?: string } | null)?.code;
  if (code === 'P2034') return true;
  return (
    error instanceof Error &&
    /write conflict|deadlock|database is locked|SQLITE_BUSY|serialization failure|could not serialize/i.test(
      error.message,
    )
  );
}

async function runSerializableTransaction<T>(
  operation: (transaction: any) => Promise<T>,
): Promise<T> {
  for (let attempt = 1; ; attempt += 1) {
    try {
      return await prisma.transaction(operation);
    } catch (error) {
      if (attempt >= SERIALIZABLE_TRANSACTION_ATTEMPTS || !isRetryableTransactionError(error)) {
        throw error;
      }
    }
  }
}

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
    await (prisma.orm.public.User as any).create({
      name: parsed.data.name || null,
      email: parsed.data.email,
      role: parsed.data.role,
      passwordHash: await bcrypt.hash(parsed.data.password, 10),
    });
  } catch (error) {
    if (isUniqueConstraintError(error)) {
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

  const parsed = updateUserAccessSchema.safeParse({
    ...values,
    password: readFormString(formData, 'password'),
  });
  if (!parsed.success) {
    return formState(values, formatZodIssues(parsed.error.issues));
  }

  const passwordHash = parsed.data.password ? await bcrypt.hash(parsed.data.password, 10) : null;

  try {
    await runSerializableTransaction(async (transaction) => {
      const current = await transaction.orm.public.User.where({ id: parsed.data.userId }).first();
      if (!current) {
        throw new UserNotFoundError();
      }

      const next = { role: parsed.data.role, locked: parsed.data.locked };
      const isLosingAdminAccess =
        current.role === adminRole.ADMIN &&
        !current.locked &&
        (next.role !== adminRole.ADMIN || next.locked);
      const otherActiveAdmins = isLosingAdminAccess ? await transaction.orm.public.User.all() : [];
      const otherActiveAdminCount = isLosingAdminAccess
        ? otherActiveAdmins.filter(
            (u: any) => u.role === adminRole.ADMIN && !u.locked && u.id !== parsed.data.userId,
          ).length
        : 0;

      if (wouldRemoveLastActiveAdmin({ current, next, otherActiveAdminCount })) {
        throw new LastActiveAdminError();
      }

      const accessChanged =
        current.role !== next.role || current.locked !== next.locked || passwordHash !== null;

      await transaction.orm.public.User.where({ id: parsed.data.userId }).update({
        ...next,
        ...(passwordHash ? { passwordHash } : {}),
        ...(accessChanged ? { sessionVersion: (current.sessionVersion ?? 0) + 1 } : {}),
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
