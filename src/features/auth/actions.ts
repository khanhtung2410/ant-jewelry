'use server';

import { redirect } from 'next/navigation';
import bcrypt from 'bcryptjs';
import { prisma } from '@/features/shared/db/prisma';
import { handleAuthActionError, invalidCredentialsState, type AuthActionState } from './errors';
import { clearAdminSessionCookie, setAdminSessionCookie } from './session';

export type LoginState = AuthActionState;

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function resolveNextPath(nextValue: FormDataEntryValue | null): string {
  return typeof nextValue === 'string' && nextValue.startsWith('/admin') ? nextValue : '/admin';
}

export async function loginAction(_prevState: LoginState, formData: FormData): Promise<LoginState> {
  const emailValue = formData.get('email');
  const passwordValue = formData.get('password');

  const email = typeof emailValue === 'string' ? normalizeEmail(emailValue) : '';
  const password = typeof passwordValue === 'string' ? passwordValue : '';
  const nextPath = resolveNextPath(formData.get('next'));

  if (!email || !password) {
    return invalidCredentialsState();
  }

  let user: {
    id: string;
    email: string;
    name: string | null;
    passwordHash: string;
    role: 'ADMIN' | 'EDITOR';
    locked: boolean;
  } | null = null;
  try {
    user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        passwordHash: true,
        role: true,
        locked: true,
      },
    });
  } catch (error) {
    return handleAuthActionError('Admin login could not load the user record:', error);
  }

  if (!user) {
    return invalidCredentialsState();
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid || user.locked) {
    return invalidCredentialsState();
  }

  try {
    await setAdminSessionCookie({
      userId: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    });
  } catch (error) {
    return handleAuthActionError('Admin login could not create a session:', error);
  }

  redirect(nextPath);
}

export async function logoutAction(): Promise<void> {
  await clearAdminSessionCookie();
  redirect('/admin/login');
}
