'use server';

import { redirect } from 'next/navigation';
import bcrypt from 'bcryptjs';
import { prisma } from '@/features/shared/db/prisma';
import { clearAdminSessionCookie, setAdminSessionCookie } from './session';

export type LoginState = {
  error?: string;
};

const GENERIC_LOGIN_ERROR = 'Invalid email or password.';
const LOGIN_UNAVAILABLE_ERROR = 'Sign-in is temporarily unavailable. Please try again later.';

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export async function loginAction(_prevState: LoginState, formData: FormData): Promise<LoginState> {
  const emailValue = formData.get('email');
  const passwordValue = formData.get('password');
  const nextValue = formData.get('next');

  const email = typeof emailValue === 'string' ? normalizeEmail(emailValue) : '';
  const password = typeof passwordValue === 'string' ? passwordValue : '';
  const nextPath =
    typeof nextValue === 'string' && nextValue.startsWith('/admin') ? nextValue : '/admin';

  if (!email || !password) {
    return { error: GENERIC_LOGIN_ERROR };
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
    console.error('Admin login could not load the user record:', error);
    return { error: LOGIN_UNAVAILABLE_ERROR };
  }

  if (!user) {
    return { error: GENERIC_LOGIN_ERROR };
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid || user.locked) {
    return { error: GENERIC_LOGIN_ERROR };
  }

  try {
    await setAdminSessionCookie({
      userId: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    });
  } catch (error) {
    console.error('Admin login could not create a session:', error);
    return { error: LOGIN_UNAVAILABLE_ERROR };
  }

  redirect(nextPath);
}

export async function logoutAction(): Promise<void> {
  await clearAdminSessionCookie();
  redirect('/admin/login');
}
