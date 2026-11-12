import { afterEach, describe, expect, it, vi } from 'vitest';
import { getSiteUrl } from './site-url';

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('getSiteUrl', () => {
  it('uses the configured site origin', () => {
    vi.stubEnv('SITE_URL', 'https://ant-jewelry.example/store');

    expect(getSiteUrl().toString()).toBe('https://ant-jewelry.example/');
  });

  it('uses the Vercel production URL when SITE_URL is unset', () => {
    vi.stubEnv('SITE_URL', '');
    vi.stubEnv('VERCEL_PROJECT_PRODUCTION_URL', 'ant-jewelry.example');

    expect(getSiteUrl().toString()).toBe('https://ant-jewelry.example/');
  });

  it('falls back to localhost outside a configured deployment', () => {
    vi.stubEnv('SITE_URL', '');
    vi.stubEnv('VERCEL_PROJECT_PRODUCTION_URL', '');

    expect(getSiteUrl().toString()).toBe('http://localhost:3000/');
  });
});
