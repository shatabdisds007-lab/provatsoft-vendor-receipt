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
      return {
        id: request.headers.get('X-Dev-User-Id') || `dev-user-${Date.now()}`,
        email: request.headers.get('X-Dev-User-Email') || 'dev@test.local',
      };
    }
  }

  const token = getTokenFromRequest(request);
  if (!token) return null;

  try {
    const payload = await validateJwtToken(token);
    const id = typeof payload.sub === 'string' ? payload.sub : null;
    if (!id) return null;

    return {
      id,
      email: typeof payload.email === 'string' ? payload.email : undefined,
    };
  } catch {
    return null;
  }
}

async function getCurrentUserRole(request: NextRequest): Promise<'admin' | 'vendor' | null> {
  const user = await getServerUser(request);
  if (!user) return null;

  if (process.env.NODE_ENV === 'development') {
    const devRole = request.headers.get('X-Dev-User-Role');
    if (devRole === 'admin' || devRole === 'vendor') {
      return devRole;
    }
  }

  if (user.id === process.env.ADMIN_USER_ID) {
    return 'admin';
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) {
    console.error('[middleware] Missing Supabase env for role lookup');
    return null;
  }

  try {
    const response = await fetch(
      `${supabaseUrl}/rest/v1/profiles?id=eq.${encodeURIComponent(user.id)}&select=role`,
      {
        headers: {
          apikey: serviceKey,
          authorization: `Bearer ${serviceKey}`,
        },
      }
    );

    if (!response.ok) return null;

    const profiles = (await response.json()) as Array<{ role?: 'admin' | 'vendor' }>;
    const role = profiles[0]?.role;
    return role === 'admin' || role === 'vendor' ? role : null;
  } catch (error) {
    console.error('[middleware] Role lookup failed:', error);
    return null;
  }
}

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
