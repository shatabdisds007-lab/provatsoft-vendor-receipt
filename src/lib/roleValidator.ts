/**
 * Server-side role validation helpers
 * These functions should be used only on the server side
 * Never expose role information to client without verification
 */

import { NextRequest } from 'next/server';
import { getUserRole } from './auth';
import type { UserRole } from '@/types/auth';

/**
 * Validate that user has a specific role
 * @param request NextRequest object
 * @param requiredRole The role required for access
 * @returns true if user has the required role
 */
export async function validateUserRole(
  request: NextRequest,
  requiredRole: UserRole,
): Promise<boolean> {
  const role = await getUserRole(request);
  return role === requiredRole;
}

/**
 * Validate that user has admin or specified role
 * @param request NextRequest object
 * @param allowedRoles Roles that are allowed (admin is always allowed)
 * @returns true if user has one of the allowed roles
 */
export async function validateUserRoles(
  request: NextRequest,
  allowedRoles: UserRole[],
): Promise<boolean> {
  const role = await getUserRole(request);
  return role === 'admin' || (role !== null && allowedRoles.includes(role));
}

/**
 * Assert user has required role or throw error
 * @param request NextRequest object
 * @param requiredRole The role required for access
 * @throws Error if user doesn't have the required role
 */
export async function assertUserRole(
  request: NextRequest,
  requiredRole: UserRole,
): Promise<void> {
  const hasRole = await validateUserRole(request, requiredRole);
  if (!hasRole) {
    throw new Error(`User does not have required role: ${requiredRole}`);
  }
}

/**
 * Assert user has admin role
 * @param request NextRequest object
 * @throws Error if user is not admin
 */
export async function assertAdminRole(request: NextRequest): Promise<void> {
  const hasRole = await validateUserRole(request, 'admin');
  if (!hasRole) {
    throw new Error('User is not an admin');
  }
}
