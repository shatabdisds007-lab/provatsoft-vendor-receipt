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

/**
 * Get user profile from profiles table with role information
 * This is the server-side method for fetching user with role
 * @param request NextRequest object
 * @returns User profile with role or null if not found
 */
export async function getServerUserProfile(request: NextRequest): Promise<AuthUser | null> {
  const user = await getServerUser(request);
  if (!user) return null;

  // Dev mode support
  if (process.env.NODE_ENV === 'development') {
    const devRole = request.headers.get('X-Dev-User-Role') as UserRole | null;
    if (devRole) {
      return {
        id: user.id,
        email: user.email || 'dev@test.local',
        role: devRole,
      };
    }
  }

  // Check env-based admin override
  if (user.id === process.env.ADMIN_USER_ID) {
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

    if (error || !profile) {
      console.error('Failed to fetch user profile:', error);
      return null;
    }

    return {
      id: profile.id,
      email: profile.email,
      role: profile.role as UserRole,
    };
  } catch (err) {
    console.error('Error fetching user profile:', err);
    return null;
  }
}

/**
 * Get user role from profiles table
 * @param request NextRequest object
 * @returns User role or null if not found
 */
export async function getUserRole(request: NextRequest): Promise<UserRole | null> {
  const profile = await getServerUserProfile(request);
  return profile?.role || null;
}

/**
 * Check if user is admin (server-side validation)
 * Fetches role from profiles table instead of metadata
 * @param request NextRequest object
 * @returns true if user is admin, false otherwise
 */
export async function isAdmin(request: NextRequest): Promise<boolean> {
  const role = await getUserRole(request);
  return role === 'admin';
}
