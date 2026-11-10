import { getCategoryBySlug } from '@/lib/queries/categories';
import { NextResponse, type NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  const slug = request.nextUrl.pathname.slice('/c/'.length);

  if (!getCategoryBySlug(slug)) {
    return NextResponse.rewrite(new URL('/not-found', request.url), { status: 404 });
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/c/:slug',
};
