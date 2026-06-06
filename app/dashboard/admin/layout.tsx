'use client';

import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/providers/AuthProvider';
import DashboardShell from '@/components/dashboard/DashboardShell';

interface AdminLayoutProps {
  children: ReactNode;
}

/**
 * PHASE 8: ADMIN DASHBOARD LAYOUT
 * Protects admin routes with role-based access
 */
export default function AdminLayout({ children }: AdminLayoutProps) {
  const router = useRouter();
  const { user, role, loading } = useAuth();
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    if (loading) return;

    // Redirect if not authenticated
    if (!user) {
      router.push('/login');
      return;
    }

    // Redirect if not admin
    if (role !== 'admin') {
      router.push('/unauthorized');
      return;
    }

    setAuthorized(true);
  }, [user, role, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-slate-600">Authenticating...</div>
      </div>
    );
  }

  if (!authorized) {
    return null;
  }

  return <DashboardShell>{children}</DashboardShell>;
}
