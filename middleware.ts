/**
 * PHASE 6: MIDDLEWARE SECURITY
 * Role-based routing and authentication protection
 *
 * CRITICAL: Never trust client-provided role values.
 * Always validate against Supabase.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerUser, getCurrentUserRole } from '@/lib/auth/getCurrentUserRole';

// Public routes - no authentication required
const PUBLIC_ROUTES = ['/', '/login', '/unauthorized', '/pricing', '/templates'];

// Public API routes
const PUBLIC_API_ROUTES = [
  '/api/health',
  '/api/templates/list',
  '/api/templates/sample',
  '/api/email/webhook',
  '/api/pdf/render',
  '/api/health/supabase',
];

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const correlationId = request.headers.get('x-correlation-id') || crypto.randomUUID();

  // Add correlation ID to all responses
  const setCorrelationId = (response: NextResponse) => {
    response.headers.set('x-correlation-id', correlationId);
    return response;
  };

  // ====== PHASE 6A: Public page routes ======
  if (PUBLIC_ROUTES.some((route) => pathname === route || pathname.startsWith(`${route}/`))) {
    return setCorrelationId(NextResponse.next());
  }

  // ====== PHASE 6B: Public API routes ======
  if (PUBLIC_API_ROUTES.some((route) => pathname === route || pathname.startsWith(`${route}/`))) {
    return setCorrelationId(NextResponse.next());
  }

  // ====== PHASE 6C: Protected API routes ======
  if (pathname.startsWith('/api')) {
    const user = await getServerUser(request);

    // Unauthenticated API access
    if (!user) {
      const response = NextResponse.json(
        { error: 'Unauthorized', correlationId },
        { status: 401 }
      );
      return setCorrelationId(response);
    }

    // Admin-only API routes
    if (pathname.startsWith('/api/admin')) {
      const role = await getCurrentUserRole(request);

      if (role !== 'admin') {
        const response = NextResponse.json(
          { error: 'Forbidden - Admin access required', correlationId },
          { status: 403 }
        );
        return setCorrelationId(response);
      }
    }

    return setCorrelationId(NextResponse.next());
  }

  // ====== PHASE 6D: Protected dashboard routes ======
  if (pathname.startsWith('/dashboard')) {
    const user = await getServerUser(request);

    // Redirect to login if not authenticated
    if (!user) {
      const response = NextResponse.redirect(new URL('/login', request.url));
      return setCorrelationId(response);
    }

    // Fetch user role - must be server-side
    const role = await getCurrentUserRole(request);

    // Admin-only dashboard routes
    if (pathname.startsWith('/dashboard/admin')) {
      if (role !== 'admin') {
        const response = NextResponse.redirect(new URL('/unauthorized', request.url));
        return setCorrelationId(response);
      }
    }

    // Vendor dashboard (vendor + admin can access)
    if (pathname.startsWith('/dashboard/vendor')) {
      if (role !== 'vendor' && role !== 'admin') {
        const response = NextResponse.redirect(new URL('/unauthorized', request.url));
        return setCorrelationId(response);
      }
    }

    return setCorrelationId(NextResponse.next());
  }

  return setCorrelationId(NextResponse.next());
}

export const config = {
  matcher: ['/api/:path*', '/dashboard/:path*', '/:path*'],
};
