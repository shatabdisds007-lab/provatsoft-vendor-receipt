import { NextRequest } from 'next/server';
import type { AuthUser, UserRole } from '@/types/auth';

export const PUBLIC_USER_ID = '00000000-0000-0000-0000-000000000000';

const publicUser: AuthUser = {
  id: PUBLIC_USER_ID,
  email: 'public@provatsoft.local',
  role: 'admin',
};

export async function getTokenFromRequest(_request: NextRequest) {
  return null;
}

export async function getServerUser(_request: NextRequest) {
  return {
    id: publicUser.id,
    email: publicUser.email,
    user_metadata: { role: publicUser.role },
    app_metadata: { role: publicUser.role },
  } as any;
}

export async function getServerUserId(_request: NextRequest) {
  return publicUser.id;
}

export async function isAdminUser(_request: NextRequest) {
  return true;
}

export async function getServerUserProfile(_request: NextRequest): Promise<AuthUser> {
  return publicUser;
}

export async function getUserRole(_request: NextRequest): Promise<UserRole> {
  return publicUser.role;
}

export async function isAdmin(_request: NextRequest): Promise<boolean> {
  return true;
}
