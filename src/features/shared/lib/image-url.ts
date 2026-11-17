/**
 * True for absolute http(s) URLs entered by an admin. These must skip the
 * Next.js image optimizer because their hostnames are not known at build time.
 */
export function isExternalImageUrl(url: string): boolean {
  // URL validators accept http(s) case-insensitively, so this check must too;
  // otherwise HTTPS://... images reach the optimizer with an unconfigured host.
  return /^https?:\/\//i.test(url);
}
