import 'server-only';

import { redirect } from 'next/navigation';
import { getAdminSession, type AdminSession } from './session';

export async function requireAdminSession(nextPath = '/admin'): Promise<AdminSession> {
  const session = await getAdminSession();
  if (!session) {
    redirect(`/admin/login?next=${encodeURIComponent(nextPath)}`);
  }
  return session;
}

export async function getOptionalAdminSession(): Promise<AdminSession | null> {
  return getAdminSession();
}
