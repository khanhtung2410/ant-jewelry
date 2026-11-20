import { describe, expect, it } from 'vitest';
import { isExternalImageUrl, shouldSkipImageOptimizer } from './image-url';

describe('isExternalImageUrl', () => {
  it('treats uppercase HTTPS URLs as external images', () => {
    expect(isExternalImageUrl('HTTPS://cdn.example.com/a.jpg')).toBe(true);
  });

  it('matches the http(s) scheme case-insensitively', () => {
    expect(isExternalImageUrl('HTTP://cdn.example.com/a.jpg')).toBe(true);
    expect(isExternalImageUrl('HtTpS://cdn.example.com/a.jpg')).toBe(true);
    expect(isExternalImageUrl('https://cdn.example.com/a.jpg')).toBe(true);
    expect(isExternalImageUrl('http://cdn.example.com/a.jpg')).toBe(true);
  });

  it('sends stored uploads through the optimizer but skips external URLs', () => {
    expect(shouldSkipImageOptimizer('/uploads/products/p-1/cover.webp')).toBe(false);
    expect(shouldSkipImageOptimizer('HTTPS://cdn.example.com/a.jpg')).toBe(true);
    expect(shouldSkipImageOptimizer('/mock/hero/slide-1.webp')).toBe(false);
  });

  it('keeps site paths and protocol-relative URLs on the optimizer', () => {
    expect(isExternalImageUrl('/uploads/ring.webp')).toBe(false);
    expect(isExternalImageUrl('//cdn.example.com/a.jpg')).toBe(false);
    expect(isExternalImageUrl('/\\cdn.example.com/a.jpg')).toBe(false);
    expect(isExternalImageUrl('data:image/png;base64,AAAA')).toBe(false);
  });
});
