import Link from 'next/link';
import AdminSubscriptionManager from '@/components/subscription/admin-subscription-manager';
import SystemMetricsPanel from '@/components/admin/system-metrics-panel';

export default function AdminDashboardPage() {
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
        </div>

        <AdminSubscriptionManager />

        <div className="grid gap-6 lg:grid-cols-3">
          <section className="rounded-3xl border border-white/10 bg-slate-950/80 p-6">
            <h2 className="text-xl font-semibold text-white">Platform insights</h2>
            <p className="mt-3 text-sm text-slate-400">
              View analytics, global settings, email logs, and payment history from one secure admin interface.
            </p>
          </section>
          <section className="rounded-3xl border border-white/10 bg-slate-950/80 p-6">
            <h2 className="text-xl font-semibold text-white">Template management</h2>
            <p className="mt-3 text-sm text-slate-400">Enable or disable premium receipt templates, upload brand assets, and define company-wide defaults.</p>
          </section>
          <section className="rounded-3xl border border-white/10 bg-slate-950/80 p-6">
            <h2 className="text-xl font-semibold text-white">User and vendor control</h2>
            <p className="mt-3 text-sm text-slate-400">Manage vendors, monitor activity, and enforce institutional receipt standards.</p>
          </section>
        </div>

        <SystemMetricsPanel />
      </div>
    </main>
  );
}
