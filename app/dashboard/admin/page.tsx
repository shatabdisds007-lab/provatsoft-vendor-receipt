'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import Link from 'next/link';
import { Users, Receipt, Mail, Settings } from 'lucide-react';
import AdminSubscriptionManager from '@/components/subscription/admin-subscription-manager';
import SystemMetricsPanel from '@/components/admin/system-metrics-panel';

interface DashboardStats {
  totalUsers: number;
  totalReceipts: number;
  pendingEmails: number;
  adminCount: number;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalReceipts: 0,
    pendingEmails: 0,
    adminCount: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Fetch total users
        const { count: usersCount } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true });

        // Fetch total receipts
        const { count: receiptsCount } = await supabase
          .from('receipts')
          .select('*', { count: 'exact', head: true });

        // Fetch pending emails
        const { count: emailsCount } = await supabase
          .from('email_queue')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'pending');

        // Fetch admin count
        const { count: adminsCount } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .eq('role', 'admin');

        setStats({
          totalUsers: usersCount || 0,
          totalReceipts: receiptsCount || 0,
          pendingEmails: emailsCount || 0,
          adminCount: adminsCount || 0,
        });
      } catch (err) {
        console.error('Failed to fetch stats:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-10 text-slate-100">
      <div className="mx-auto max-w-6xl space-y-8">
        <div className="rounded-4xl border border-white/10 bg-slate-900/80 p-8 shadow-glow backdrop-blur-xl">
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.35em] text-sky-300">Admin dashboard</p>
              <h1 className="mt-3 text-4xl font-semibold text-white">Enterprise receipt operations</h1>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link href="/dashboard/admin/templates" className="rounded-2xl bg-sky-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-sky-400">
                Manage Templates
              </Link>
            </div>
          </div>

          {/* Stats Grid */}
          {!loading && (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div className="rounded-lg bg-slate-800/50 p-4">
                <p className="text-xs font-medium text-slate-400">Total Users</p>
                <p className="mt-2 text-2xl font-bold text-white">{stats.totalUsers}</p>
              </div>
              <div className="rounded-lg bg-slate-800/50 p-4">
                <p className="text-xs font-medium text-slate-400">Total Receipts</p>
                <p className="mt-2 text-2xl font-bold text-white">{stats.totalReceipts}</p>
              </div>
              <div className="rounded-lg bg-slate-800/50 p-4">
                <p className="text-xs font-medium text-slate-400">Pending Emails</p>
                <p className="mt-2 text-2xl font-bold text-white">{stats.pendingEmails}</p>
              </div>
              <div className="rounded-lg bg-slate-800/50 p-4">
                <p className="text-xs font-medium text-slate-400">Admin Users</p>
                <p className="mt-2 text-2xl font-bold text-white">{stats.adminCount}</p>
              </div>
            </div>
          )}
        </div>

        <AdminSubscriptionManager />

        {/* Management Cards */}
        <div className="grid gap-6 lg:grid-cols-3">
          <Link href="/dashboard/admin/users" className="group rounded-3xl border border-white/10 bg-slate-950/80 p-6 hover:border-white/20 hover:shadow-glow transition">
            <div className="flex items-center gap-3 mb-4">
              <Users className="h-6 w-6 text-sky-400" />
              <h2 className="text-xl font-semibold text-white">Users Management</h2>
            </div>
            <p className="text-sm text-slate-400">
              View all users, manage roles, and control platform access
            </p>
          </Link>

          <Link href="/dashboard/admin/receipts" className="group rounded-3xl border border-white/10 bg-slate-950/80 p-6 hover:border-white/20 hover:shadow-glow transition">
            <div className="flex items-center gap-3 mb-4">
              <Receipt className="h-6 w-6 text-sky-400" />
              <h2 className="text-xl font-semibold text-white">Receipts Monitoring</h2>
            </div>
            <p className="text-sm text-slate-400">
              Track all receipts created by vendors across the platform
            </p>
          </Link>

          <Link href="/dashboard/admin/email-logs" className="group rounded-3xl border border-white/10 bg-slate-950/80 p-6 hover:border-white/20 hover:shadow-glow transition">
            <div className="flex items-center gap-3 mb-4">
              <Mail className="h-6 w-6 text-sky-400" />
              <h2 className="text-xl font-semibold text-white">Email Logs</h2>
            </div>
            <p className="text-sm text-slate-400">
              Monitor email delivery status and debug communication issues
            </p>
          </Link>
        </div>

        <SystemMetricsPanel />
      </div>
    </main>
  );
}
