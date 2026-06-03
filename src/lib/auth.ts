import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdminClient';
import { validateJwtToken } from '@/lib/tokenValidator';

export async function getTokenFromRequest(request: NextRequest) {
  const authHeader = request.headers.get('authorization') || '';
  if (authHeader.toLowerCase().startsWith('bearer ')) {
    return authHeader.slice(7).trim();
  }

  const cookieToken = request.cookies.get('sb-access-token')?.value;
  return cookieToken || null;
}

export async function getServerUser(request: NextRequest) {
  // Dev mode: allow X-Dev-Test-User header for local testing when Supabase isn't configured
  if (process.env.NODE_ENV === 'development') {
    const devUser = request.headers.get('X-Dev-Test-User');
    if (devUser === 'enabled') {
      const userId = request.headers.get('X-Dev-User-Id') || 'dev-user-' + Date.now();
      return {
        id: userId,
        email: 'dev@test.local',
        user_metadata: {},
        app_metadata: {},
      } as any;
    }
  }

  const token = await getTokenFromRequest(request);
  if (!token) return null;

  try {
    await validateJwtToken(token);
  } catch (err) {
    return null;
  }

  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data?.user) {
    return null;
  }

  return data.user;
}

export async function getServerUserId(request: NextRequest) {
  const user = await getServerUser(request);
  return user?.id || null;
}

export async function isAdminUser(request: NextRequest) {
  const user = await getServerUser(request);
  if (!user) return false;

  if (process.env.NODE_ENV === 'development' && request.headers.get('X-Dev-Admin') === 'enabled') {
    return true;
  }

  const appRole = (user.app_metadata as any)?.role;
  const userRole = (user.user_metadata as any)?.role;
  const envAdmin = process.env.ADMIN_USER_ID;

  return appRole === 'admin' || userRole === 'admin' || user.id === envAdmin;
}
