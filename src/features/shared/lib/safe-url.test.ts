import { describe, expect, it } from 'vitest';
import { isPathOrHttpUrl, isSafeImageSrc, isSafeLinkHref } from './safe-url';

describe('safe url validation', () => {
  it('rejects control characters and whitespace inside paths', () => {
    const unsafePaths = [
      '/\t/evil.com',
      '/\n/evil.com',
      '/\r/evil.com',
      '/ /evil.com',
      '/\u0000/evil.com',
      '/\u007f/evil.com',
    ];

    for (const value of unsafePaths) {
      expect(isPathOrHttpUrl(value)).toBe(false);
      expect(isSafeLinkHref(value)).toBe(false);
      expect(isSafeImageSrc(value)).toBe(false);
    }
  });

  it('rejects whitespace anywhere in absolute urls', () => {
    expect(isSafeLinkHref('https://example.com/a\tb')).toBe(false);
    expect(isSafeLinkHref('https://example.com/a b')).toBe(false);
    expect(isSafeImageSrc('https://example.com/a\nb.png')).toBe(false);
  });

  it('rejects protocol-relative and backslash paths', () => {
    expect(isPathOrHttpUrl('//evil.com')).toBe(false);
    expect(isPathOrHttpUrl('/\\evil.com')).toBe(false);
    expect(isSafeLinkHref('/\\evil.com')).toBe(false);
    expect(isSafeImageSrc('/\\evil.com/a.png')).toBe(false);
  });

  it('keeps safe paths, http(s) urls and fragments', () => {
    expect(isPathOrHttpUrl('/blog')).toBe(true);
    expect(isPathOrHttpUrl('https://example.com/blog')).toBe(true);
    expect(isSafeLinkHref('/blog/abc')).toBe(true);
    expect(isSafeLinkHref('https://example.com/blog')).toBe(true);
    expect(isSafeLinkHref('#section')).toBe(true);
    expect(isSafeImageSrc('/mock/blog/cover.svg')).toBe(true);
    expect(isSafeImageSrc('https://example.com/cover.jpg')).toBe(true);
  });
});
