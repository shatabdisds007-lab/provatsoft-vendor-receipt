import type { ReactNode } from 'react';
import DashboardShell from '@/components/dashboard/DashboardShell';

export const metadata = {
  title: 'Dashboard | Provatsoft',
  description: 'Premium enterprise dashboard for receipt operations and platform monitoring.',
};

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return <DashboardShell>{children}</DashboardShell>;
}
