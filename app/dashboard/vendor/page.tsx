import Link from 'next/link';
import { ArrowUpRight, FileText, Mail, Palette, Plus, Zap } from 'lucide-react';
import PageHeader from '@/components/dashboard/PageHeader';
import StatsCard from '@/components/ui/StatsCard';
import UsageMeter from '@/components/subscription/usage-meter';

const kpis = [
  { title: 'Total Receipts', value: '12,840', delta: '+12.4%', icon: <FileText className="h-5 w-5" />, description: 'Across all workspaces' },
  { title: 'Emails Sent', value: '8,392', delta: '+8.1%', icon: <Mail className="h-5 w-5" />, description: 'Delivered this month' },
  { title: 'Active Templates', value: '18', delta: '+3', icon: <Palette className="h-5 w-5" />, description: 'Ready for generation' },
  { title: 'Monthly Usage', value: '74%', delta: '+6%', icon: <Zap className="h-5 w-5" />, description: '742 of 1,000 receipts' },
];

const activity = [
  { id: 'PS-2026-001240', customer: 'Acme Holdings', type: 'Receipt created', amount: 'BDT 12,500', status: 'Generated', time: '4 min ago' },
  { id: 'PS-2026-001239', customer: 'Northstar School', type: 'Email sent', amount: 'BDT 8,200', status: 'Delivered', time: '18 min ago' },
  { id: 'PS-2026-001238', customer: 'Bright Clinic', type: 'Template used', amount: 'BDT 3,900', status: 'Previewed', time: '42 min ago' },
  { id: 'PS-2026-001237', customer: 'Union Market', type: 'Receipt exported', amount: 'BDT 22,100', status: 'Downloaded', time: '1 hr ago' },
];

const chartBars = [44, 62, 54, 76, 68, 88, 74, 92, 81, 96, 84, 90];

export default function VendorDashboardPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="A focused operating view for receipt creation, email delivery, templates, and subscription usage."
        statusLabel="Live workspace"
        actions={
          <>
            <Link href="/dashboard/vendor/templates" className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50">
              Templates
            </Link>
            <Link href="/dashboard/vendor/create-receipt" className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-blue-600/20 transition hover:bg-blue-700">
              <Plus className="h-4 w-4" />
              Create Receipt
            </Link>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((item) => (
          <StatsCard key={item.title} {...item} />
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.4fr_0.9fr]">
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-card">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-950">Receipt volume</h2>
              <p className="mt-1 text-sm text-slate-500">Monthly generation trend</p>
            </div>
            <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">Last 12 months</div>
          </div>
          <div className="mt-8 flex h-64 items-end gap-3">
            {chartBars.map((height, index) => (
              <div key={index} className="flex flex-1 flex-col items-center gap-2">
                <div className="w-full rounded-t-xl bg-blue-600/90 transition-all hover:bg-blue-700" style={{ height: `${height}%` }} />
                <span className="text-[11px] text-slate-400">{index + 1}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-card">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-950">Subscription</h2>
              <p className="mt-1 text-sm text-slate-500">Plan and usage status</p>
            </div>
            <ArrowUpRight className="h-5 w-5 text-slate-400" />
          </div>
          <div className="mt-5">
            <UsageMeter />
          </div>
        </section>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white shadow-card">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 p-6">
          <div>
            <h2 className="text-lg font-semibold text-slate-950">Recent activity</h2>
            <p className="mt-1 text-sm text-slate-500">Latest receipts, emails, exports, and template actions.</p>
          </div>
          <Link href="/dashboard/vendor/history" className="text-sm font-semibold text-blue-700 hover:text-blue-800">
            View history
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-6 py-3">Receipt</th>
                <th className="px-6 py-3">Customer</th>
                <th className="px-6 py-3">Activity</th>
                <th className="px-6 py-3">Amount</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {activity.map((row) => (
                <tr key={row.id} className="transition hover:bg-slate-50">
                  <td className="whitespace-nowrap px-6 py-4 font-medium text-slate-950">{row.id}</td>
                  <td className="whitespace-nowrap px-6 py-4">{row.customer}</td>
                  <td className="whitespace-nowrap px-6 py-4">{row.type}</td>
                  <td className="whitespace-nowrap px-6 py-4">{row.amount}</td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">{row.status}</span>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-slate-500">{row.time}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
