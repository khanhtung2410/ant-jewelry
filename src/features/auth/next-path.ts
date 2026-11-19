/**
 * Resolves the post-login `next` target from untrusted input (query string or
 * FormData). Only in-site `/admin/...` paths are allowed: external URLs,
 * protocol-relative URLs, path traversal and the login page itself fall back
 * to `/admin`, so the value can never become an open redirect or a login loop.
 */
export function resolveAdminNextPath(value: unknown): string {
  if (typeof value !== 'string') return '/admin';
  if (!value.startsWith('/admin/')) return '/admin';
  if (value.startsWith('/admin/login')) return '/admin';
  if (value.startsWith('//') || value.includes('\\') || value.includes('..')) return '/admin';
  if (/[\u0000-\u001f\u007f]/.test(value)) return '/admin';
  return value;
}
