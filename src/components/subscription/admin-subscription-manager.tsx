'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

type SubscriptionRow = {
  id: string;
  user_id: string;
  plan: string;
  status: string;
  current_usage: number;
  usage_limit: number | null;
  reset_date: string;
  plan_id: string | null;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  created_at: string;
  updated_at: string;
};

type Stats = {
  total: number;
  free_count: number;
  pro_count: number;
  enterprise_count: number;
  active_count: number;
  canceled_count: number;
  banned_count: number;
  total_usage: number;
  total_limit: number;
};

const PLAN_OPTIONS = ['free', 'pro', 'enterprise'] as const;
const STATUS_OPTIONS = ['active', 'canceled', 'banned'] as const;

export default function AdminSubscriptionManager() {
  const [subscriptions, setSubscriptions] = useState<SubscriptionRow[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  const fetchSubscriptions = async () => {
    setLoading(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;
      const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};

      const response = await fetch('/api/admin/subscriptions', { headers });
      const data = await response.json();
      if (data.error) {
        setMessage(data.error);
        return;
      }
      setSubscriptions(data.subscriptions || []);
      setStats(data.stats || null);
    } catch (err) {
      setMessage('Unable to load subscriptions.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (userId: string, payload: Record<string, any>) => {
    setMessage('');
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;
      const headers: Record<string, string> = token
        ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
        : { 'Content-Type': 'application/json' };

      const response = await fetch('/api/admin/subscriptions', {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ userId, ...payload }),
      });
      const data = await response.json();
      if (data.error) {
        setMessage(data.error);
        return;
      }

      setMessage('Subscription updated.');
      fetchSubscriptions();
    } catch (err) {
      setMessage('Unable to update subscription.');
    }
  };

  return (
    <div className="rounded-[2rem] border border-white/10 bg-slate-900/80 p-6 shadow-glow backdrop-blur-xl text-slate-100">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.35em] text-sky-300">Subscription operations</p>
          <h2 className="mt-2 text-3xl font-semibold text-white">Admin subscription control</h2>
        </div>
        <button
          type="button"
          onClick={fetchSubscriptions}
          className="rounded-2xl bg-slate-800 px-5 py-3 text-sm font-semibold text-slate-100 transition hover:bg-slate-700"
        >
          Refresh data
        </button>
      </div>

      {message ? <div className="mb-5 rounded-3xl bg-rose-500/10 p-4 text-sm text-rose-200">{message}</div> : null}

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-3xl border border-slate-800 bg-slate-950/90 p-5">
          <p className="text-sm uppercase tracking-[0.35em] text-slate-400">Total users</p>
          <p className="mt-3 text-3xl font-semibold text-white">{stats?.total ?? 0}</p>
        </div>
        <div className="rounded-3xl border border-slate-800 bg-slate-950/90 p-5">
          <p className="text-sm uppercase tracking-[0.35em] text-slate-400">Active subscriptions</p>
          <p className="mt-3 text-3xl font-semibold text-white">{stats?.active_count ?? 0}</p>
        </div>
        <div className="rounded-3xl border border-slate-800 bg-slate-950/90 p-5">
          <p className="text-sm uppercase tracking-[0.35em] text-slate-400">Receipts used</p>
          <p className="mt-3 text-3xl font-semibold text-white">{stats?.total_usage ?? 0}</p>
        </div>
      </div>

      <div className="mt-8 overflow-x-auto rounded-3xl border border-slate-800 bg-slate-950/90">
        <table className="min-w-full border-separate border-spacing-0 text-left text-sm text-slate-300">
          <thead>
            <tr>
              <th className="border-b border-slate-800 px-4 py-4 font-semibold text-slate-400">User ID</th>
              <th className="border-b border-slate-800 px-4 py-4 font-semibold text-slate-400">Plan</th>
              <th className="border-b border-slate-800 px-4 py-4 font-semibold text-slate-400">Status</th>
              <th className="border-b border-slate-800 px-4 py-4 font-semibold text-slate-400">Usage</th>
              <th className="border-b border-slate-800 px-4 py-4 font-semibold text-slate-400">Reset date</th>
              <th className="border-b border-slate-800 px-4 py-4 font-semibold text-slate-400">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-slate-400">
                  Loading subscriptions…
                </td>
              </tr>
            ) : subscriptions.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-slate-400">
                  No subscriptions found.
                </td>
              </tr>
            ) : (
              subscriptions.map((row) => (
                <tr key={row.id} className="border-t border-slate-800">
                  <td className="px-4 py-4 font-mono text-slate-200">{row.user_id}</td>
                  <td className="px-4 py-4 text-slate-100">{row.plan}</td>
                  <td className="px-4 py-4 text-slate-100">{row.status}</td>
                  <td className="px-4 py-4 text-slate-100">
                    {row.current_usage} / {row.usage_limit ?? '∞'}
                  </td>
                  <td className="px-4 py-4 text-slate-100">{row.reset_date}</td>
                  <td className="px-4 py-4 space-y-2">
                    <select
                      value={row.plan}
                      onChange={(event) => handleUpdate(row.user_id, { plan: event.target.value })}
                      className="w-full rounded-2xl border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-100"
                    >
                      {PLAN_OPTIONS.map((plan) => (
                        <option key={plan} value={plan}>
                          {plan}
                        </option>
                      ))}
                    </select>
                    <select
                      value={row.status}
                      onChange={(event) => handleUpdate(row.user_id, { status: event.target.value })}
                      className="w-full rounded-2xl border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-100"
                    >
                      {STATUS_OPTIONS.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => handleUpdate(row.user_id, { resetUsage: true })}
                      className="w-full rounded-2xl bg-slate-800 px-3 py-2 text-sm font-semibold text-slate-100 transition hover:bg-slate-700"
                    >
                      Reset usage
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
