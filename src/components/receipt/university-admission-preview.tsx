import type { ReceiptDraft } from '@/types/receipt';
import { PremiumReceiptPreview } from './premium-receipt-preview';

export function UniversityAdmissionPreview({ draft, qrCodeUrl, watermarkUrl }: { draft: ReceiptDraft; qrCodeUrl?: string; watermarkUrl?: string }) {
  return <PremiumReceiptPreview design="canva-modern" draft={draft} qrCodeUrl={qrCodeUrl} watermarkUrl={watermarkUrl} />;
}
