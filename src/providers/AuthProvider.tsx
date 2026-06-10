'use client';

import React, { createContext, useContext } from 'react';
import type { AuthContextType, Profile, UserRole } from '@/types/auth';

export const PUBLIC_USER_ID = '00000000-0000-0000-0000-000000000000';

const publicProfile: Profile = {
  id: PUBLIC_USER_ID,
  email: 'public@provatsoft.local',
  role: 'admin',
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const value: AuthContextType = {
    user: publicProfile,
    profile: publicProfile,
    role: publicProfile.role,
    loading: false,
    error: null,
    signOut: async () => undefined,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function useIsAdmin(): boolean {
  return true;
}

export function useIsVendor(): boolean {
  return true;
}
