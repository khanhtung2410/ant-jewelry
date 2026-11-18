import { describe, expect, it } from 'vitest';
import { isExternalImageUrl } from './image-url';

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

  it('keeps site paths and protocol-relative URLs on the optimizer', () => {
    expect(isExternalImageUrl('/uploads/ring.webp')).toBe(false);
    expect(isExternalImageUrl('//cdn.example.com/a.jpg')).toBe(false);
    expect(isExternalImageUrl('/\\cdn.example.com/a.jpg')).toBe(false);
    expect(isExternalImageUrl('data:image/png;base64,AAAA')).toBe(false);
  });
});
