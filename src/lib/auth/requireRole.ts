/**
 * PHASE 10: ADMIN SERVER VALIDATION HELPER
 * Verify admin access on server-side (APIs, server components)
 *
 * USAGE:
 * ```typescript
 * const profile = await requireAdmin(request);
 * // profile is guaranteed to be admin role
 * ```
 */

import { NextRequest } from 'next/server';
import { getCurrentProfile } from '@/lib/auth/getCurrentUserRole';
import type { Profile } from '@/types/auth';

export class UnauthorizedError extends Error {
  constructor(message = 'Unauthorized') {
    super(message);
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenError extends Error {
  constructor(message = 'Forbidden') {
    super(message);
    this.name = 'ForbiddenError';
  }
}

/**
 * PHASE 10: Require admin role
 * Throws ForbiddenError if user is not admin
 *
 * @param request NextRequest object
 * @returns Profile of admin user
 * @throws UnauthorizedError if not authenticated
 * @throws ForbiddenError if not admin
 */
export async function requireAdmin(request: NextRequest): Promise<Profile> {
  const profile = await getCurrentProfile(request);

  if (!profile) {
    throw new UnauthorizedError('Not authenticated');
  }

  if (profile.role !== 'admin') {
    throw new ForbiddenError('Admin access required');
  }

  return profile;
}

/**
 * Require vendor or admin role
 */
export async function requireVendor(request: NextRequest): Promise<Profile> {
  const profile = await getCurrentProfile(request);

  if (!profile) {
    throw new UnauthorizedError('Not authenticated');
  }

  if (profile.role !== 'vendor' && profile.role !== 'admin') {
    throw new ForbiddenError('Vendor or admin access required');
  }

  return profile;
}

/**
 * Require any authenticated user
 */
export async function requireAuth(request: NextRequest): Promise<Profile> {
  const profile = await getCurrentProfile(request);

  if (!profile) {
    throw new UnauthorizedError('Not authenticated');
  }

  return profile;
}
