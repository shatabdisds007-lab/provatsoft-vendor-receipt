import type { ReceiptDraft } from '@/types/receipt';
import { PremiumReceiptPreview } from './premium-receipt-preview';

export function HealthcarePreview({ draft, qrCodeUrl, watermarkUrl }: { draft: ReceiptDraft; qrCodeUrl?: string; watermarkUrl?: string }) {
  return <PremiumReceiptPreview design="premium-healthcare" draft={draft} qrCodeUrl={qrCodeUrl} watermarkUrl={watermarkUrl} />;
}
