import { describe, expect, it } from 'vitest';
import { parseClientIp } from './client-ip';

describe('parseClientIp', () => {
  it('uses the first address in x-forwarded-for', () => {
    expect(parseClientIp('203.0.113.7, 10.0.0.1', null)).toBe('203.0.113.7');
  });

  it('trims surrounding whitespace', () => {
    expect(parseClientIp('  203.0.113.8  ', '10.0.0.2')).toBe('203.0.113.8');
  });

  it('falls back to x-real-ip', () => {
    expect(parseClientIp(null, ' 203.0.113.9 ')).toBe('203.0.113.9');
  });

  it('uses a shared unknown bucket without proxy headers', () => {
    expect(parseClientIp(null, null)).toBe('unknown');
    expect(parseClientIp('', '')).toBe('unknown');
  });

  it('caps spoofed header values before storing them', () => {
    expect(parseClientIp('a'.repeat(200), null)).toHaveLength(64);
  });
});
