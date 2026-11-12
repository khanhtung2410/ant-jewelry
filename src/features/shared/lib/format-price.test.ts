import { describe, expect, it } from 'vitest';
import { formatPrice } from './format-price';

describe('formatPrice', () => {
  it('formats ten million VND with dot separators', () => {
    expect(formatPrice(10000000)).toBe('10.000.000');
  });

  it('leaves amounts below one thousand unchanged', () => {
    expect(formatPrice(0)).toBe('0');
    expect(formatPrice(999)).toBe('999');
  });

  it('groups digits in threes', () => {
    expect(formatPrice(1000)).toBe('1.000');
    expect(formatPrice(12500000)).toBe('12.500.000');
    expect(formatPrice(1234567890)).toBe('1.234.567.890');
  });

  it('formats negative amounts with a leading sign', () => {
    expect(formatPrice(-1234567)).toBe('-1.234.567');
  });

  it('rounds fractional amounts to the nearest dong', () => {
    expect(formatPrice(1500.4)).toBe('1.500');
    expect(formatPrice(1500.6)).toBe('1.501');
  });
});
