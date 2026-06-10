/**
 * PHASE 6: MIDDLEWARE SECURITY
 * Role-based routing and authentication protection
 *
 * CRITICAL: Never trust client-provided role values.
 * Always validate against Supabase.
 */

import { NextRequest, NextResponse } from 'next/server';
import { validateJwtToken } from '@/lib/tokenValidator';

type MiddlewareUser = {
  id: string;
  email?: string;
};

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
  '/api/auth/dev-confirm',
];

function getTokenFromRequest(request: NextRequest): string | null {
  const authHeader = request.headers.get('authorization') || '';
  if (authHeader.toLowerCase().startsWith('bearer ')) {
    return authHeader.slice(7).trim();
  }

  return request.cookies.get('sb-access-token')?.value || null;
}

async function getServerUser(request: NextRequest): Promise<MiddlewareUser | null> {
  if (process.env.NODE_ENV === 'development') {
    const devUser = request.headers.get('X-Dev-Test-User');
    if (devUser === 'enabled') {
      const devUserId = request.headers.get('X-Dev-User-Id') || `dev-user-${Date.now()}`;
      console.log('[MIDDLEWARE] Dev mode enabled for user:', devUserId);
      return {
        id: devUserId,
        email: request.headers.get('X-Dev-User-Email') || 'dev@test.local',
      };
    }
  }

  const token = getTokenFromRequest(request);
  if (!token) {
    console.log('[MIDDLEWARE] No token found in request');
    return null;
  }

  try {
    const payload = await validateJwtToken(token);
    const id = typeof payload.sub === 'string' ? payload.sub : null;
    if (!id) {
      console.log('[MIDDLEWARE] No user ID in token payload');
      return null;
    }

    console.log('[MIDDLEWARE] Valid token found for user:', id);
    return {
      id,
      email: typeof payload.email === 'string' ? payload.email : undefined,
    };
  } catch (err) {
    console.log('[MIDDLEWARE] Token validation failed:', err);
    return null;
  }
}

async function getCurrentUserRole(request: NextRequest): Promise<'admin' | 'vendor' | null> {
  const user = await getServerUser(request);
  if (!user) {
    console.log('[MIDDLEWARE] No user found for role check');
    return null;
  }

  console.log('[MIDDLEWARE] Fetching role for user:', user.id);

  if (process.env.NODE_ENV === 'development') {
    const devRole = request.headers.get('X-Dev-User-Role');
    if (devRole === 'admin' || devRole === 'vendor') {
      console.log('[MIDDLEWARE] Dev mode: using role from header:', devRole);
      return devRole;
    }
  }

  if (user.id === process.env.ADMIN_USER_ID) {
    console.log('[MIDDLEWARE] User is environment admin');
    return 'admin';
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) {
    console.error('[MIDDLEWARE] Missing Supabase env for role lookup');
    return null;
  }

  try {
    console.log('[MIDDLEWARE] Querying profiles table for role');
    const response = await fetch(
      `${supabaseUrl}/rest/v1/profiles?id=eq.${encodeURIComponent(user.id)}&select=role`,
      {
        headers: {
          apikey: serviceKey,
          authorization: `Bearer ${serviceKey}`,
        },
      }
    );

    if (!response.ok) {
      console.error('[MIDDLEWARE] Profile query failed with status:', response.status);
      return null;
    }

    const profiles = (await response.json()) as Array<{ role?: 'admin' | 'vendor' }>;
    const role = profiles[0]?.role;
    console.log('[MIDDLEWARE] User role from database:', role || 'NOT FOUND');
    return role === 'admin' || role === 'vendor' ? role : null;
  } catch (error) {
    console.error('[MIDDLEWARE] Role lookup failed:', error);
    return null;
  }
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const correlationId = request.headers.get('x-correlation-id') || crypto.randomUUID();

  console.log('[MIDDLEWARE] Processing request:', { pathname, correlationId });

  // Add correlation ID to all responses
  const setCorrelationId = (response: NextResponse) => {
    response.headers.set('x-correlation-id', correlationId);
    return response;
  };

  // ====== PHASE 6A: Public page routes ======
  if (PUBLIC_ROUTES.some((route) => pathname === route || pathname.startsWith(`${route}/`))) {
    console.log('[MIDDLEWARE] Public route allowed:', pathname);
    return setCorrelationId(NextResponse.next());
  }

  // ====== PHASE 6B: Public API routes ======
  if (PUBLIC_API_ROUTES.some((route) => pathname === route || pathname.startsWith(`${route}/`))) {
    console.log('[MIDDLEWARE] Public API route allowed:', pathname);
    return setCorrelationId(NextResponse.next());
  }

  // ====== PHASE 6C: Protected API routes ======
  if (pathname.startsWith('/api')) {
    const user = await getServerUser(request);

    // Unauthenticated API access
    if (!user) {
      console.log('[MIDDLEWARE] Unauthorized API access:', pathname);
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
        console.log('[MIDDLEWARE] Forbidden admin API access:', { pathname, role });
        const response = NextResponse.json(
          { error: 'Forbidden - Admin access required', correlationId },
          { status: 403 }
        );
        return setCorrelationId(response);
      }
    }

    console.log('[MIDDLEWARE] Authorized API access:', pathname);
    return setCorrelationId(NextResponse.next());
  }

  // ====== PHASE 6D: Protected dashboard routes ======
  if (pathname.startsWith('/dashboard')) {
    const user = await getServerUser(request);

    // Redirect to login if not authenticated
    if (!user) {
      console.log('[MIDDLEWARE] Unauthenticated dashboard access, redirecting to login:', pathname);
      const response = NextResponse.redirect(new URL('/login', request.url));
      return setCorrelationId(response);
    }

    // Fetch user role - must be server-side
    const role = await getCurrentUserRole(request);

    // Admin-only dashboard routes
    if (pathname.startsWith('/dashboard/admin')) {
      if (role !== 'admin') {
        console.log('[MIDDLEWARE] Non-admin dashboard access attempt:', { pathname, role });
        const response = NextResponse.redirect(new URL('/unauthorized', request.url));
        return setCorrelationId(response);
      }
      console.log('[MIDDLEWARE] Admin dashboard access allowed:', pathname);
    }

    // Vendor dashboard (vendor + admin can access)
    if (pathname.startsWith('/dashboard/vendor')) {
      if (role !== 'vendor' && role !== 'admin') {
        console.log('[MIDDLEWARE] Invalid role for vendor dashboard:', { pathname, role });
        const response = NextResponse.redirect(new URL('/unauthorized', request.url));
        return setCorrelationId(response);
      }
      console.log('[MIDDLEWARE] Vendor dashboard access allowed:', { pathname, role });
    }

    return setCorrelationId(NextResponse.next());
  }

  console.log('[MIDDLEWARE] Default route allowed:', pathname);
  return setCorrelationId(NextResponse.next());
}

export const config = {
  matcher: ['/api/:path*', '/dashboard/:path*', '/:path*'],
};
