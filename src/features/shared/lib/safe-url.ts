const httpUrlPattern = /^https?:\/\//i;
// A leading "//" is a protocol-relative URL, not a site path, and would leak
// the request to another host. Browsers also treat "/\\" like "//".
const safeRootPathPattern = /^\/(?![/\\])/;
const safeFragmentPattern = /^#/;
// Browsers strip ASCII tab/newline characters before resolving a URL, so
// "/\t/evil.com" navigates to protocol-relative "//evil.com". Trimming the ends
// is not enough; reject control characters and whitespace inside the value.
const unsafeUrlCharacterPattern = /[\s\u0000-\u001f\u007f-\u009f]/;

function hasUnsafeUrlCharacter(value: string): boolean {
  return unsafeUrlCharacterPattern.test(value);
}

export function isHttpUrl(value: string): boolean {
  return !hasUnsafeUrlCharacter(value) && httpUrlPattern.test(value);
}

export function isSafeRootPath(value: string): boolean {
  return !hasUnsafeUrlCharacter(value) && safeRootPathPattern.test(value);
}

export function isPathOrHttpUrl(value: string): boolean {
  return isSafeRootPath(value) || isHttpUrl(value);
}

/**
 * Allows absolute http(s) URLs, root-relative paths (`/blog`) and in-page
 * fragments. Rejects protocol-relative URLs (`//evil.com`, `/\evil.com`),
 * control characters or whitespace anywhere in the value, and any other scheme
 * such as `javascript:` or `data:`.
 */
export function isSafeLinkHref(href: string): boolean {
  if (hasUnsafeUrlCharacter(href)) return false;
  return isHttpUrl(href) || isSafeRootPath(href) || safeFragmentPattern.test(href);
}

/**
 * Images only support http(s) sources and root-relative paths. Fragments make
 * no sense for an image and protocol-relative URLs would leak the request to
 * another host.
 */
export function isSafeImageSrc(src: string): boolean {
  if (hasUnsafeUrlCharacter(src)) return false;
  return isHttpUrl(src) || isSafeRootPath(src);
}
