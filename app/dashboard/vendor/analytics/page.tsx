import PageHeader from '@/components/dashboard/PageHeader';
import Breadcrumbs from '@/components/dashboard/Breadcrumbs';
import GlassCard from '@/components/ui/GlassCard';
import StatsCard from '@/components/ui/StatsCard';

export default function AnalyticsPage() {
  return (
    <div>
      <Breadcrumbs items={[{ label: 'Dashboard', href: '/dashboard/vendor' }, { label: 'Analytics' }]} />
      <PageHeader title="Analytics" description="Usage, delivery, and performance metrics." />

      <div className="grid gap-6 sm:grid-cols-3">
        <StatsCard title="Monthly receipts" value="1,248" delta="+6.2%" />
        <StatsCard title="Emails sent" value="3,412" delta="+2.1%" />
        <StatsCard title="PDF render success" value="99.7%" delta="-0.1%" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <GlassCard title="Traffic over time">
          <div className="h-64 rounded-lg border border-white/6 bg-slate-950/70 p-4 text-sm text-slate-300">Chart placeholder (daily receipts)</div>
        </GlassCard>

        <GlassCard title="Email delivery">
          <div className="h-64 rounded-lg border border-white/6 bg-slate-950/70 p-4 text-sm text-slate-300">Chart placeholder (delivery &amp; failures)</div>
        </GlassCard>
      </div>
    </div>
  );
}
