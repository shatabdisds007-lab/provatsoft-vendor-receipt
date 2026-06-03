'use client';

import { useEffect, useState } from 'react';

type Metrics = {
  errorCount: number;
  emailQueue: {
    pending: number;
    sent: number;
    failed: number;
  };
  emailSuccessRate: number;
  latency: {
    estimateMs: number;
  };
};

export default function SystemMetricsPanel() {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const response = await fetch('/api/admin/system-metrics');
        const payload = await response.json();
        if (!response.ok) {
          setError(payload.error || 'Unable to load metrics');
          return;
        }
        setMetrics(payload);
      } catch (err) {
        setError('Unable to load metrics');
      }
    }
    load();
  }, []);

  return (
    <section className="rounded-3xl border border-white/10 bg-slate-950/80 p-6">
      <div className="mb-4 flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-white">System metrics</h2>
          <p className="mt-1 text-sm text-slate-400">Live queue and error status for core production systems.</p>
        </div>
      </div>
      {error ? (
        <div className="rounded-2xl bg-rose-950/60 p-4 text-sm text-rose-200">{error}</div>
      ) : metrics ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-3xl bg-slate-900/80 p-4">
            <p className="text-sm uppercase tracking-[0.35em] text-slate-500">Errors (24h)</p>
            <p className="mt-3 text-3xl font-semibold text-white">{metrics.errorCount}</p>
          </div>
          <div className="rounded-3xl bg-slate-900/80 p-4">
            <p className="text-sm uppercase tracking-[0.35em] text-slate-500">Email queue</p>
            <p className="mt-3 text-3xl font-semibold text-white">{metrics.emailQueue.pending}</p>
            <p className="mt-2 text-sm text-slate-400">Sent: {metrics.emailQueue.sent} · Failed: {metrics.emailQueue.failed}</p>
          </div>
          <div className="rounded-3xl bg-slate-900/80 p-4">
            <p className="text-sm uppercase tracking-[0.35em] text-slate-500">Success rate</p>
            <p className="mt-3 text-3xl font-semibold text-white">{metrics.emailSuccessRate}%</p>
          </div>
          <div className="rounded-3xl bg-slate-900/80 p-4">
            <p className="text-sm uppercase tracking-[0.35em] text-slate-500">Queue latency</p>
            <p className="mt-3 text-3xl font-semibold text-white">{metrics.latency.estimateMs}ms</p>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl bg-slate-900/80 p-4 text-sm text-slate-400">Loading metrics…</div>
      )}
    </section>
  );
}
