import { headers } from 'next/headers';

const MAX_CLIENT_IP_LENGTH = 64;

/**
 * Prefers the first hop of `x-forwarded-for` because proxies append their own
 * addresses to the end. On Vercel the platform replaces the incoming header
 * with the real client chain, so the leftmost entry is the client rather than
 * a browser-supplied value; switching to the rightmost hop would be wrong
 * here. Falls back to `x-real-ip`, then to a shared bucket so deployments
 * without proxy headers still get rate limiting.
 */
export function parseClientIp(forwardedFor: string | null, realIp: string | null): string {
  const candidate = forwardedFor?.split(',')[0]?.trim() || realIp?.trim() || '';

  return candidate ? candidate.slice(0, MAX_CLIENT_IP_LENGTH) : 'unknown';
}

export async function getClientIp(): Promise<string> {
  try {
    const requestHeaders = await headers();
    return parseClientIp(requestHeaders.get('x-forwarded-for'), requestHeaders.get('x-real-ip'));
  } catch {
    // Unit tests and non-request contexts have no header store.
    return 'unknown';
  }
}
