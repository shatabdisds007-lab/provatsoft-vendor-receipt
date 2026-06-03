'use client';

import { useEffect, useState } from 'react';

type SystemHealth = {
  db: boolean;
  storage: boolean;
  email: boolean;
};

type MetricsResponse = {
  errorCount: number;
  emailSuccessRate: number;
  latency: number;
  health: SystemHealth;
  queue: {
    pending: number;
    processing: number;
    sent: number;
    failed: number;
    retrying: number;
  };
};

export default function ObservabilityDashboard() {
  const [metrics, setMetrics] = useState<MetricsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    async function refresh() {
      try {
        const response = await fetch('/api/admin/system-metrics');
        const payload = await response.json();
        if (!response.ok) {
          throw new Error(payload.error || 'Unable to load metrics');
        }
        if (mounted) {
          setMetrics(payload);
        }
      } catch (err: any) {
        if (mounted) {
          setError(err?.message || 'Unable to load metrics');
        }
      }
    }

    refresh();
    const interval = setInterval(refresh, 15000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  return (
    <section className="rounded-3xl border border-white/10 bg-slate-950/80 p-6 shadow-sm">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-white">Observability dashboard</h2>
          <p className="mt-1 text-sm text-slate-400">Live health, queue, and error telemetry for production operations.</p>
        </div>
      </div>

      {error ? (
        <div className="rounded-2xl bg-rose-950/70 p-4 text-sm text-rose-200">{error}</div>
      ) : metrics ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-3xl bg-slate-900/80 p-5">
            <p className="text-sm uppercase tracking-[0.35em] text-slate-500">Database</p>
            <p className="mt-3 text-3xl font-semibold text-white">{metrics.health.db ? 'Healthy' : 'Unhealthy'}</p>
          </div>
          <div className="rounded-3xl bg-slate-900/80 p-5">
            <p className="text-sm uppercase tracking-[0.35em] text-slate-500">Storage</p>
            <p className="mt-3 text-3xl font-semibold text-white">{metrics.health.storage ? 'Healthy' : 'Unhealthy'}</p>
          </div>
          <div className="rounded-3xl bg-slate-900/80 p-5">
            <p className="text-sm uppercase tracking-[0.35em] text-slate-500">Email service</p>
            <p className="mt-3 text-3xl font-semibold text-white">{metrics.health.email ? 'Healthy' : 'Unhealthy'}</p>
          </div>
          <div className="rounded-3xl bg-slate-900/80 p-5">
            <p className="text-sm uppercase tracking-[0.35em] text-slate-500">API latency</p>
            <p className="mt-3 text-3xl font-semibold text-white">{metrics.latency}ms</p>
          </div>
          <div className="rounded-3xl bg-slate-900/80 p-5">
            <p className="text-sm uppercase tracking-[0.35em] text-slate-500">Error volume</p>
            <p className="mt-3 text-3xl font-semibold text-white">{metrics.errorCount}</p>
          </div>
          <div className="rounded-3xl bg-slate-900/80 p-5">
            <p className="text-sm uppercase tracking-[0.35em] text-slate-500">Email success</p>
            <p className="mt-3 text-3xl font-semibold text-white">{metrics.emailSuccessRate}%</p>
          </div>
          <div className="rounded-3xl bg-slate-900/80 p-5">
            <p className="text-sm uppercase tracking-[0.35em] text-slate-500">Queue pending</p>
            <p className="mt-3 text-3xl font-semibold text-white">{metrics.queue.pending}</p>
          </div>
          <div className="rounded-3xl bg-slate-900/80 p-5">
            <p className="text-sm uppercase tracking-[0.35em] text-slate-500">Queue processing</p>
            <p className="mt-3 text-3xl font-semibold text-white">{metrics.queue.processing}</p>
          </div>
          <div className="rounded-3xl bg-slate-900/80 p-5">
            <p className="text-sm uppercase tracking-[0.35em] text-slate-500">Queue retrying</p>
            <p className="mt-3 text-3xl font-semibold text-white">{metrics.queue.retrying}</p>
          </div>
          <div className="rounded-3xl bg-slate-900/80 p-5">
            <p className="text-sm uppercase tracking-[0.35em] text-slate-500">Queue failed</p>
            <p className="mt-3 text-3xl font-semibold text-white">{metrics.queue.failed}</p>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl bg-slate-900/80 p-4 text-sm text-slate-400">Loading observability data…</div>
      )}
    </section>
  );
}
