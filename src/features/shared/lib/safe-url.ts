const httpUrlPattern = /^https?:\/\//i;
// A leading "//" is a protocol-relative URL, not a site path, and would leak
// the request to another host. Browsers also treat "/\\" like "//".
const safeRootPathPattern = /^\/(?![/\\])/;
const safeFragmentPattern = /^#/;

export function isHttpUrl(value: string): boolean {
  return httpUrlPattern.test(value);
}

export function isSafeRootPath(value: string): boolean {
  return safeRootPathPattern.test(value);
}

export function isPathOrHttpUrl(value: string): boolean {
  return isSafeRootPath(value) || isHttpUrl(value);
}

/**
 * Allows absolute http(s) URLs, root-relative paths (`/blog`) and in-page
 * fragments. Rejects protocol-relative URLs (`//evil.com`, `/\evil.com`) and
 * any other scheme such as `javascript:` or `data:`.
 */
export function isSafeLinkHref(href: string): boolean {
  return isHttpUrl(href) || isSafeRootPath(href) || safeFragmentPattern.test(href);
}

/**
 * Images only support http(s) sources and root-relative paths. Fragments make
 * no sense for an image and protocol-relative URLs would leak the request to
 * another host.
 */
export function isSafeImageSrc(src: string): boolean {
  return isHttpUrl(src) || isSafeRootPath(src);
}
