import { describe, expect, it } from 'vitest';
import { settingsFormSchema } from './settings-form-schema';

const validSettings = {
  siteName: 'ANT JEWELRY',
  phone: '0900 000 000',
  facebookUrl: 'https://www.facebook.com/example.antjewelry',
  instagramUrl: 'https://www.instagram.com/example.antjewelry',
  address: '1A Tang Bat Ho, Ha Noi',
  email: 'hello@example.com',
};

describe('settingsFormSchema', () => {
  it('accepts valid contact settings and trims values', () => {
    const parsed = settingsFormSchema.parse({
      ...validSettings,
      siteName: '  ANT JEWELRY  ',
      phone: ' 0900 000 000 ',
    });

    expect(parsed.siteName).toBe('ANT JEWELRY');
    expect(parsed.phone).toBe('0900 000 000');
  });

  it('rejects an invalid phone number', () => {
    const result = settingsFormSchema.safeParse({ ...validSettings, phone: 'call-us' });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toMatch(/digits/i);
    }
  });

  it('rejects an invalid email address', () => {
    const result = settingsFormSchema.safeParse({ ...validSettings, email: 'not-an-email' });

    expect(result.success).toBe(false);
  });

  it('requires full http(s) social URLs', () => {
    const result = settingsFormSchema.safeParse({
      ...validSettings,
      facebookUrl: 'facebook.com/example',
    });

    expect(result.success).toBe(false);
  });

  it('requires contact fields', () => {
    const result = settingsFormSchema.safeParse({
      ...validSettings,
      address: ' ',
      phone: '',
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      const fields = result.error.issues.map((issue) => issue.path[0]);
      expect(fields).toContain('address');
      expect(fields).toContain('phone');
    }
  });
});
