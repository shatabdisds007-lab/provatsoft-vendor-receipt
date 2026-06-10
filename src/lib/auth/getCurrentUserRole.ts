import { NextRequest } from 'next/server';
import type { Profile, UserRole } from '@/types/auth';

export const PUBLIC_USER_ID = '00000000-0000-0000-0000-000000000000';

const publicProfile: Profile = {
  id: PUBLIC_USER_ID,
  email: 'public@provatsoft.local',
  role: 'admin',
  created_at: new Date(0).toISOString(),
  updated_at: new Date(0).toISOString(),
};

export async function getTokenFromRequest(_request: NextRequest): Promise<string | null> {
  return null;
}

export async function getServerUser(_request: NextRequest) {
  return {
    id: publicProfile.id,
    email: publicProfile.email,
    user_metadata: { role: publicProfile.role },
    app_metadata: { role: publicProfile.role },
  } as any;
}

export async function getServerUserId(_request: NextRequest): Promise<string> {
  return publicProfile.id;
}

export async function getCurrentUserRole(_request: NextRequest): Promise<UserRole> {
  return publicProfile.role;
}

export async function getCurrentProfile(_request: NextRequest): Promise<Profile> {
  return publicProfile;
}

export async function isAdminUser(_request: NextRequest): Promise<boolean> {
  return true;
}

export async function isVendorUser(_request: NextRequest): Promise<boolean> {
  return true;
}
