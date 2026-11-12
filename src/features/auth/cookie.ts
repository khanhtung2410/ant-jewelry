import {
  SESSION_COOKIE_NAME,
  SESSION_MAX_AGE_SECONDS,
  verifySessionToken,
  type AdminSession,
} from './session-token';

export { SESSION_COOKIE_NAME, SESSION_MAX_AGE_SECONDS };

type CookieReader = {
  get(name: string): { value: string } | undefined;
};

type SessionCookieOptions = {
  httpOnly: true;
  sameSite: 'lax';
  secure: boolean;
  path: '/';
  maxAge: number;
};

export function getSessionCookieOptions(maxAge = SESSION_MAX_AGE_SECONDS): SessionCookieOptions {
  return {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge,
  };
}

export function readSessionToken(cookies: CookieReader): string | undefined {
  const value = cookies.get(SESSION_COOKIE_NAME)?.value;
  return typeof value === 'string' && value.length > 0 ? value : undefined;
}

export function readValidatedSession(
  cookies: CookieReader,
  secret: string | undefined = process.env.AUTH_SECRET,
): AdminSession | null {
  const token = readSessionToken(cookies);
  return verifySessionToken(token, secret);
}
