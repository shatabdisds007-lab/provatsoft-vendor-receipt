/**
 * PHASE 3: SERVER ROLE SERVICE
 * Server-side user role and profile management
 *
 * CRITICAL: Never trust client-provided role values.
 * Always verify against Supabase profiles table.
 */

import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdminClient';
import { validateJwtToken } from '@/lib/tokenValidator';
import type { UserRole, Profile } from '@/types/auth';

/**
 * Extract JWT token from request headers or cookies
 */
export async function getTokenFromRequest(request: NextRequest): Promise<string | null> {
  const authHeader = request.headers.get('authorization') || '';
  if (authHeader.toLowerCase().startsWith('bearer ')) {
    return authHeader.slice(7).trim();
  }

  const cookieToken = request.cookies.get('sb-access-token')?.value;
  return cookieToken || null;
}

/**
 * Get authenticated user from Supabase auth
 */
export async function getServerUser(request: NextRequest) {
  // Dev mode support for local testing
  if (process.env.NODE_ENV === 'development') {
    const devUser = request.headers.get('X-Dev-Test-User');
    if (devUser === 'enabled') {
      const userId = request.headers.get('X-Dev-User-Id') || 'dev-user-' + Date.now();
      return {
        id: userId,
        email: request.headers.get('X-Dev-User-Email') || 'dev@test.local',
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

/**
 * Get user ID from request
 */
export async function getServerUserId(request: NextRequest): Promise<string | null> {
  const user = await getServerUser(request);
  return user?.id || null;
}

/**
 * PHASE 3: Get user role from profiles table
 * This is the primary server-side role lookup function.
 *
 * SECURITY: Always fetches from database, never caches.
 */
export async function getCurrentUserRole(request: NextRequest): Promise<UserRole | null> {
  try {
    const user = await getServerUser(request);
    if (!user) return null;

    // Dev mode: allow override
    if (process.env.NODE_ENV === 'development') {
      const devRole = request.headers.get('X-Dev-User-Role') as UserRole | null;
      if (devRole && ['vendor', 'admin'].includes(devRole)) {
        return devRole;
      }
    }

    // Check env-based admin override
    if (user.id === process.env.ADMIN_USER_ID) {
      return 'admin';
    }

    // Query profiles table - this is the source of truth
    const { data: profile, error } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (error || !profile) {
      return null;
    }

    return profile.role as UserRole;
  } catch (err) {
    console.error('[getCurrentUserRole] Error:', err);
    return null;
  }
}

/**
 * PHASE 3: Get full user profile including role
 * Helper function that returns complete profile info
 */
export async function getCurrentProfile(request: NextRequest): Promise<Profile | null> {
  try {
    const user = await getServerUser(request);
    if (!user) return null;

    // Dev mode support
    if (process.env.NODE_ENV === 'development') {
      const devRole = request.headers.get('X-Dev-User-Role') as UserRole | null;
      if (devRole && ['vendor', 'admin'].includes(devRole)) {
        return {
          id: user.id,
          email: user.email || 'dev@test.local',
          role: devRole,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
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

    // Query profiles table - source of truth
    const { data: profile, error } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error || !profile) {
      return null;
    }

    return {
      id: profile.id,
      email: profile.email,
      role: profile.role as UserRole,
      created_at: profile.created_at,
      updated_at: profile.updated_at,
    };
  } catch (err) {
    console.error('[getCurrentProfile] Error:', err);
    return null;
  }
}

/**
 * Check if user is admin
 */
export async function isAdminUser(request: NextRequest): Promise<boolean> {
  const role = await getCurrentUserRole(request);
  return role === 'admin';
}

/**
 * Check if user is vendor (including admins for compatibility)
 */
export async function isVendorUser(request: NextRequest): Promise<boolean> {
  const role = await getCurrentUserRole(request);
  return role === 'vendor' || role === 'admin';
}
