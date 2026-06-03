import type { ReceiptDraft } from '@/types/receipt';
import { PremiumReceiptPreview } from './premium-receipt-preview';

export function EducationReceiptPreview({ draft, qrCodeUrl, watermarkUrl }: { draft: ReceiptDraft; qrCodeUrl?: string; watermarkUrl?: string }) {
  return <PremiumReceiptPreview design="modern-education" draft={draft} qrCodeUrl={qrCodeUrl} watermarkUrl={watermarkUrl} />;
}
