import { ReceiptHistory } from '@/components/receipt/receipt-history';
import PageHeader from '@/components/dashboard/PageHeader';
import Breadcrumbs from '@/components/dashboard/Breadcrumbs';

export default function VendorHistoryPage() {
  return (
    <div>
        <Breadcrumbs items={[{ label: 'Dashboard', href: '/dashboard/vendor' }, { label: 'Receipt history' }]} />
        <PageHeader title="Receipt History" description="All generated receipts, downloadable PDFs and metadata." />
        <ReceiptHistory />
    </div>
  );
}
