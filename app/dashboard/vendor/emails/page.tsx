import { EmailHistory } from '@/components/receipt/email-history';
import PageHeader from '@/components/dashboard/PageHeader';
import Breadcrumbs from '@/components/dashboard/Breadcrumbs';

export default function VendorEmailsPage() {
  return (
    <div>
      <Breadcrumbs items={[{ label: 'Dashboard', href: '/dashboard/vendor' }, { label: 'Email history' }]} />
      <PageHeader title="Email History" description="Review delivery status, resend receipts, and export message records." />
      <EmailHistory />
    </div>
  );
}
