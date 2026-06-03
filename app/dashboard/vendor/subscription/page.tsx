import Breadcrumbs from '@/components/dashboard/Breadcrumbs';
import PageHeader from '@/components/dashboard/PageHeader';
import UsageMeter from '@/components/subscription/usage-meter';

export default function VendorSubscriptionPage() {
  return (
    <div>
      <Breadcrumbs items={[{ label: 'Dashboard', href: '/dashboard/vendor' }, { label: 'Subscription' }]} />
      <PageHeader title="Subscription" description="Monitor plan status, receipt usage, limits, and upgrade options." />
      <div className="max-w-3xl">
        <UsageMeter />
      </div>
    </div>
  );
}
