import { describe, expect, it } from 'vitest';
import { formatPublishedDate, toDateInputValue } from './format-date';

describe('formatPublishedDate', () => {
  it('formats dates as dd/MM/yyyy in Vietnam time', () => {
    expect(formatPublishedDate('2026-10-28T09:00:00+07:00')).toBe('28/10/2026');
    expect(formatPublishedDate('2026-10-27T20:30:00Z')).toBe('28/10/2026');
  });
});

describe('toDateInputValue', () => {
  it('returns yyyy-mm-dd in Vietnam time for date inputs', () => {
    expect(toDateInputValue('2026-10-28T09:00:00+07:00')).toBe('2026-10-28');
    expect(toDateInputValue('2026-10-27T20:30:00Z')).toBe('2026-10-28');
  });
});
