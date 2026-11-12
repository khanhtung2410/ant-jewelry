export function buildAdminRedirect(
  returnTo: string,
  allowedPath: string,
  params: Record<string, string | null>,
): string {
  let url: URL;

  try {
    url = new URL(returnTo, 'http://localhost');
  } catch {
    url = new URL(allowedPath, 'http://localhost');
  }

  if (url.pathname !== allowedPath) {
    url = new URL(allowedPath, 'http://localhost');
  }

  for (const [key, value] of Object.entries(params)) {
    if (value === null) {
      url.searchParams.delete(key);
    } else {
      url.searchParams.set(key, value);
    }
  }

  const query = url.searchParams.toString();
  return query ? `${url.pathname}?${query}` : url.pathname;
}

export function buildSavedRedirect(returnTo: string, allowedPath: string): string {
  return buildAdminRedirect(returnTo, allowedPath, {
    edit: null,
    view: null,
    new: null,
    error: null,
    saved: '1',
  });
}
