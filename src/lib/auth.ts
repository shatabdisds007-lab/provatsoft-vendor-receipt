import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdminClient';
import { validateJwtToken } from '@/lib/tokenValidator';
import type { UserRole, AuthUser } from '@/types/auth';

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
      console.log('[AUTH] Dev mode enabled for user:', userId);
      return {
        id: userId,
        email: 'dev@test.local',
        user_metadata: {},
        app_metadata: {},
      } as any;
    }
  }

  const token = await getTokenFromRequest(request);
  if (!token) {
    console.log('[AUTH] No token found in request');
    return null;
  }

  try {
    await validateJwtToken(token);
  } catch (err) {
    console.log('[AUTH] Token validation failed:', err);
    return null;
  }

  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data?.user) {
    console.log('[AUTH] Failed to get user from token:', error);
    return null;
  }

  console.log('[AUTH] Valid user found:', data.user.id);
  return data.user;
}

export async function getServerUserId(request: NextRequest) {
  const user = await getServerUser(request);
  const userId = user?.id || null;
  console.log('[AUTH] getServerUserId returning:', userId);
  return userId;
}

export async function isAdminUser(request: NextRequest) {
  const user = await getServerUser(request);
  if (!user) {
    console.log('[AUTH] isAdminUser: no user');
    return false;
  }

  if (process.env.NODE_ENV === 'development' && request.headers.get('X-Dev-Admin') === 'enabled') {
    console.log('[AUTH] isAdminUser: dev mode admin');
    return true;
  }

  const appRole = (user.app_metadata as any)?.role;
  const userRole = (user.user_metadata as any)?.role;
  const envAdmin = process.env.ADMIN_USER_ID;

  const isAdmin = appRole === 'admin' || userRole === 'admin' || user.id === envAdmin;
  console.log('[AUTH] isAdminUser check:', { isAdmin, appRole, userRole, isEnvAdmin: user.id === envAdmin });
  return isAdmin;
}

/**
 * Get user profile from profiles table with role information
 * This is the server-side method for fetching user with role
 * @param request NextRequest object
 * @returns User profile with role or null if not found
 */
export async function getServerUserProfile(request: NextRequest): Promise<AuthUser | null> {
  const user = await getServerUser(request);
  if (!user) {
    console.log('[AUTH] No server user found for profile fetch');
    return null;
  }

  console.log('[AUTH] Fetching profile for user:', user.id);

  // Dev mode support
  if (process.env.NODE_ENV === 'development') {
    const devRole = request.headers.get('X-Dev-User-Role') as UserRole | null;
    if (devRole) {
      console.log('[AUTH] Dev mode: using role from header:', devRole);
      return {
        id: user.id,
        email: user.email || 'dev@test.local',
        role: devRole,
      };
    }
  }

  // Check env-based admin override
  if (user.id === process.env.ADMIN_USER_ID) {
    console.log('[AUTH] User is environment admin override');
    return {
      id: user.id,
      email: user.email || '',
      role: 'admin',
    };
  }

  try {
    // Fetch profile from database with role information
    const { data: profile, error } = await supabaseAdmin
      .from('profiles')
      .select('id, email, role')
      .eq('id', user.id)
      .single();

    if (error) {
      console.warn('[AUTH] Profile fetch error:', error);
      // Return user with default vendor role if profile doesn't exist
      console.log('[AUTH] Defaulting to vendor role for user:', user.id);
      return {
        id: user.id,
        email: user.email || '',
        role: 'vendor',
      };
    }

    if (!profile) {
      console.warn('[AUTH] No profile data returned for user:', user.id);
      return {
        id: user.id,
        email: user.email || '',
        role: 'vendor',
      };
    }

    const role = profile.role || 'vendor';
    console.log('[AUTH] User profile fetched:', { role });
    return {
      id: profile.id,
      email: profile.email,
      role: role as UserRole,
    };
  } catch (err) {
    console.error('[AUTH] Error fetching user profile:', err);
    // Return default vendor role on error
    return {
      id: user.id,
      email: user.email || '',
      role: 'vendor',
    };
  }
}

/**
 * Get user role from profiles table
 * @param request NextRequest object
 * @returns User role or null if not found
 */
export async function getUserRole(request: NextRequest): Promise<UserRole | null> {
  const profile = await getServerUserProfile(request);
  const role = profile?.role || null;
  console.log('[AUTH] getUserRole returning:', role);
  return role;
}

/**
 * Check if user is admin (server-side validation)
 * Fetches role from profiles table instead of metadata
 * @param request NextRequest object
 * @returns true if user is admin, false otherwise
 */
export async function isAdmin(request: NextRequest): Promise<boolean> {
  const role = await getUserRole(request);
  const isAdminUser = role === 'admin';
  console.log('[AUTH] isAdmin check:', isAdminUser);
  return isAdminUser;
}
