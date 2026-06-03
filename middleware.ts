import { NextRequest, NextResponse } from 'next/server';
import { getServerUser, isAdminUser } from '@/lib/auth';

const publicApiPaths = ['/api/health', '/api/templates/list', '/api/templates/sample', '/api/email/webhook', '/api/pdf/render'];

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const correlationId = request.headers.get('x-correlation-id') || crypto.randomUUID();

  if (!pathname.startsWith('/api')) {
    const response = NextResponse.next();
    response.headers.set('x-correlation-id', correlationId);
    return response;
  }

  if (publicApiPaths.some((path) => pathname === path || pathname.startsWith(`${path}/`))) {
    const response = NextResponse.next();
    response.headers.set('x-correlation-id', correlationId);
    return response;
  }

  if (pathname.startsWith('/api/admin')) {
    const isAdmin = await isAdminUser(request);
    if (!isAdmin) {
      const response = NextResponse.json({ error: 'Unauthorized', correlationId }, { status: 401 });
      response.headers.set('x-correlation-id', correlationId);
      return response;
    }
    const response = NextResponse.next();
    response.headers.set('x-correlation-id', correlationId);
    return response;
  }

  const user = await getServerUser(request);
  if (!user) {
    const response = NextResponse.json({ error: 'Unauthorized', correlationId }, { status: 401 });
    response.headers.set('x-correlation-id', correlationId);
    return response;
  }

  const response = NextResponse.next();
  response.headers.set('x-correlation-id', correlationId);
  return response;
}

export const config = {
  matcher: ['/api/:path*'],
};
