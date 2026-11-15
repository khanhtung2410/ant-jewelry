/**
 * True for absolute http(s) URLs entered by an admin. These must skip the
 * Next.js image optimizer because their hostnames are not known at build time.
 */
export function isExternalImageUrl(url: string): boolean {
  return url.startsWith('https://') || url.startsWith('http://');
}
