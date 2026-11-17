'use server';

import { redirect } from 'next/navigation';
import bcrypt from 'bcryptjs';
import { prisma } from '@/features/shared/db/prisma';
import { DUMMY_PASSWORD_HASH } from '@/features/shared/lib/password';
import { getClientIp } from './client-ip';
import {
  handleAuthActionError,
  invalidCredentialsState,
  loginRateLimitedState,
  type AuthActionState,
} from './errors';
import { clearFailedLogins, isLoginRateLimited, recordFailedLogin } from './login-rate-limit';
import { revokeAdminSession, setAdminSessionCookie } from './session';

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

  const clientIp = await getClientIp();

  let user: {
    id: string;
    email: string;
    name: string | null;
    passwordHash: string;
    role: 'ADMIN' | 'EDITOR';
    locked: boolean;
    sessionVersion: number;
  } | null = null;

  try {
    if (await isLoginRateLimited(email, clientIp)) {
      return loginRateLimitedState();
    }

    user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        passwordHash: true,
        role: true,
        locked: true,
        sessionVersion: true,
      },
    });
  } catch (error) {
    return handleAuthActionError('Admin login could not load the user record:', error);
  }

  let valid: boolean;
  try {
    valid = await bcrypt.compare(password, user?.passwordHash ?? DUMMY_PASSWORD_HASH);
  } catch (error) {
    return handleAuthActionError('Admin login could not verify the password:', error);
  }

  if (!user || !valid || user.locked) {
    try {
      await recordFailedLogin(email, clientIp);
    } catch (error) {
      console.error('Admin login could not record a failed attempt:', error);
    }

    return invalidCredentialsState();
  }

  try {
    await clearFailedLogins(email, clientIp);
  } catch (error) {
    console.error('Admin login could not clear failed attempts:', error);
  }

  try {
    await setAdminSessionCookie({
      userId: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
      sessionVersion: user.sessionVersion,
    });
  } catch (error) {
    return handleAuthActionError('Admin login could not create a session:', error);
  }

  redirect(nextPath);
}

export async function logoutAction(): Promise<void> {
  await revokeAdminSession();
  redirect('/admin/login');
}
