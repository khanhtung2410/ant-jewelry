/**
 * True for absolute http(s) URLs entered by an admin. These must skip the
 * Next.js image optimizer because their hostnames are not known at build time.
 */
export function isExternalImageUrl(url: string): boolean {
  // URL validators accept http(s) case-insensitively, so this check must too;
  // otherwise HTTPS://... images reach the optimizer with an unconfigured host.
  return /^https?:\/\//i.test(url);
}

/** URLs of admin-uploaded images stored in ProductImageBlob. */
export function isStoredUploadUrl(url: string): boolean {
  return url.startsWith('/uploads/');
}

/**
 * Stored uploads are already resized when saved and are served from the app's
 * own route; routing them through /_next/image adds a cold-start failure mode
 * and a redundant resize on Vercel.
 */
export function shouldSkipImageOptimizer(url: string): boolean {
  return isExternalImageUrl(url) || isStoredUploadUrl(url);
}
