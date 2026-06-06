/**
 * PHASE 5: SESSION PROVIDER
 * Client-side auth context and hook for accessing user profile and role
 */

'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import type { AuthContextType, Profile, UserRole } from '@/types/auth';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export interface AuthProviderProps {
  children: React.ReactNode;
}

/**
 * AuthProvider: Wraps app with session and profile tracking
 * Usage: Wrap your app in <AuthProvider> at the layout level
 */
export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<{ id: string; email: string } | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Load user session and profile on mount
   */
  useEffect(() => {
    const loadSession = async () => {
      try {
        setLoading(true);
        setError(null);

        // Get current session
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session?.user) {
          setUser(null);
          setProfile(null);
          setRole(null);
          return;
        }

        setUser({
          id: session.user.id,
          email: session.user.email || '',
        });

        // Fetch profile with role
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (profileError) {
          setError('Failed to load profile');
          return;
        }

        if (profileData) {
          setProfile({
            id: profileData.id,
            email: profileData.email,
            role: profileData.role,
            created_at: profileData.created_at,
            updated_at: profileData.updated_at,
          });
          setRole(profileData.role);
        }
      } catch (err) {
        console.error('[AuthProvider] Load session error:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    loadSession();

    // Subscribe to auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event: any, session: any) => {
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        if (session?.user) {
          setUser({
            id: session.user.id,
            email: session.user.email || '',
          });

          // Refetch profile
          const { data: profileData } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();

          if (profileData) {
            setProfile({
              id: profileData.id,
              email: profileData.email,
              role: profileData.role,
              created_at: profileData.created_at,
              updated_at: profileData.updated_at,
            });
            setRole(profileData.role);
          }
        }
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setProfile(null);
        setRole(null);
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  /**
   * Sign out handler
   */
  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setProfile(null);
      setRole(null);
    } catch (err) {
      console.error('[AuthProvider] Sign out error:', err);
      setError(err instanceof Error ? err.message : 'Failed to sign out');
    }
  };

  const value: AuthContextType = {
    user: user && role ? { ...user, role } : null,
    profile,
    role,
    loading,
    error,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * useAuth hook
 * Access current user, profile, and role in any client component
 *
 * Usage:
 * ```
 * const { user, profile, role, loading } = useAuth();
 * if (role === 'admin') { ... }
 * ```
 */
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

/**
 * Hook for checking if user is admin
 */
export function useIsAdmin(): boolean {
  const { role, loading } = useAuth();
  return !loading && role === 'admin';
}

/**
 * Hook for checking if user is vendor
 */
export function useIsVendor(): boolean {
  const { role, loading } = useAuth();
  return !loading && (role === 'vendor' || role === 'admin');
}
