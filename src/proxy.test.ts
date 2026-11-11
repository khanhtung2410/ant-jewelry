import { NextRequest } from 'next/server';
import { describe, expect, it } from 'vitest';
import { proxy } from './proxy';

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
