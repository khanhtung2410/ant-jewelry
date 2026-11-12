export function getSiteUrl(): URL {
  const configuredUrl =
    process.env.SITE_URL?.trim() ||
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : 'http://localhost:3000');

  return new URL(new URL(configuredUrl).origin);
}
