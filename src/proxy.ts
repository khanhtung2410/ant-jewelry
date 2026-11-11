import { NextResponse, type NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  void request;
  return NextResponse.next();
}

export const config = {
  matcher: '/c/:slug',
};
