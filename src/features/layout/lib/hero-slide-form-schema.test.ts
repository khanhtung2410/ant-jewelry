import { describe, expect, it } from 'vitest';
import { heroSlideFormSchema } from './hero-slide-form-schema';

const validSlide = {
  imageUrl: '/mock/hero/slide.webp',
  alt: 'Bộ sưu tập nhẫn cưới',
  title: 'WEDDING RINGS',
  subtitle: 'Dấu ấn của một lời hứa bền lâu',
  linkUrl: '/c/wedding-ring',
  visible: true,
};

describe('heroSlideFormSchema', () => {
  it('accepts a valid slide and allows an empty subtitle', () => {
    expect(heroSlideFormSchema.parse(validSlide)).toEqual(validSlide);
    expect(heroSlideFormSchema.safeParse({ ...validSlide, subtitle: '' }).success).toBe(true);
  });

  it('rejects missing required fields and unsafe links', () => {
    const result = heroSlideFormSchema.safeParse({
      ...validSlide,
      imageUrl: '',
      title: '  ',
      linkUrl: 'javascript:alert(1)',
    });

    expect(result.success).toBe(false);
    if (result.success) return;

    expect(result.error.issues.map((issue) => issue.path[0])).toEqual(
      expect.arrayContaining(['imageUrl', 'title', 'linkUrl']),
    );
  });
});
