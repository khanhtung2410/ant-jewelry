import { NextResponse, type NextRequest } from 'next/server';
import { readValidatedSession } from '@/features/auth/cookie';

function isAdminLoginPath(pathname: string): boolean {
  return pathname === '/admin/login' || pathname.startsWith('/admin/login/');
}

function isAdminPath(pathname: string): boolean {
  return pathname === '/admin' || pathname.startsWith('/admin/');
}

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  if (pathname.startsWith('/c/')) {
    return NextResponse.next();
  }

  if (!isAdminPath(pathname) || isAdminLoginPath(pathname)) {
    return NextResponse.next();
  }

  const session = readValidatedSession(request.cookies);

  if (!session) {
    const loginUrl = new URL('/admin/login', request.url);
    loginUrl.searchParams.set('next', `${pathname}${search}`);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/c/:slug', '/admin/:path*'],
};
