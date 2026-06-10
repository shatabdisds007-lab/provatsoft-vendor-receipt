import type { ReactNode } from 'react';
import DashboardShell from '@/components/dashboard/DashboardShell';

interface AdminLayoutProps {
  children: ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  return <DashboardShell>{children}</DashboardShell>;
}
