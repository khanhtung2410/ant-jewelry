import { NextRequest } from 'next/server';
import { afterEach, describe, expect, it } from 'vitest';
import { createSessionToken, SESSION_COOKIE_NAME } from '@/features/auth/session-token';
import { proxy } from './proxy';

const originalSecret = process.env.AUTH_SECRET;

afterEach(() => {
  if (originalSecret === undefined) {
    delete process.env.AUTH_SECRET;
  } else {
    process.env.AUTH_SECRET = originalSecret;
  }
});

describe('category route proxy', () => {
  it('passes through category requests to route handling', () => {
    const response = proxy(new NextRequest('http://localhost/c/wedding-ring'));

    expect(response.status).toBe(200);
    expect(response.headers.get('x-middleware-next')).toBe('1');
  });

  it('does not rewrite unknown category slugs at the proxy layer', () => {
    const response = proxy(new NextRequest('http://localhost/c/missing-category'));

    expect(response.status).toBe(200);
    expect(response.headers.get('x-middleware-next')).toBe('1');
    expect(response.headers.get('x-middleware-rewrite')).toBeNull();
  });
});

describe('admin route proxy', () => {
  it('redirects unauthenticated admin requests to login with next path', () => {
    process.env.AUTH_SECRET = 'test-secret';
    const response = proxy(new NextRequest('http://localhost/admin/products?tab=all'));

    expect(response.status).toBeGreaterThanOrEqual(300);
    expect(response.status).toBeLessThan(400);
    expect(response.headers.get('location')).toBe(
      'http://localhost/admin/login?next=%2Fadmin%2Fproducts%3Ftab%3Dall',
    );
  });

  it('allows admin login page without a session', () => {
    process.env.AUTH_SECRET = 'test-secret';
    const response = proxy(new NextRequest('http://localhost/admin/login?next=%2Fadmin'));

    expect(response.status).toBe(200);
    expect(response.headers.get('x-middleware-next')).toBe('1');
  });

  it('allows authenticated admin requests with a valid session cookie', () => {
    process.env.AUTH_SECRET = 'test-secret';
    const token = createSessionToken(
      {
        userId: 'user-1',
        email: 'admin@antjewelry.local',
        role: 'ADMIN',
        name: 'Admin',
      },
      'test-secret',
    );

    const request = new NextRequest('http://localhost/admin');
    request.cookies.set(SESSION_COOKIE_NAME, token);
    const response = proxy(request);

    expect(response.status).toBe(200);
    expect(response.headers.get('x-middleware-next')).toBe('1');
  });
});
