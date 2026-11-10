import { NextRequest } from 'next/server';
import { describe, expect, it } from 'vitest';
import { proxy } from './proxy';

describe('category route proxy', () => {
  it('passes through visible category slugs', () => {
    const response = proxy(new NextRequest('http://localhost/c/wedding-ring'));

    expect(response.status).toBe(200);
    expect(response.headers.get('x-middleware-next')).toBe('1');
  });

  it('rewrites unknown category slugs to a 404 response', () => {
    const response = proxy(new NextRequest('http://localhost/c/missing-category'));

    expect(response.status).toBe(404);
    expect(response.headers.get('x-middleware-rewrite')).toContain('/not-found');
  });
});
