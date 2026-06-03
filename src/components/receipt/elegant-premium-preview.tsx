import type { ReceiptDraft } from '@/types/receipt';
import { PremiumReceiptPreview } from './premium-receipt-preview';

export function ElegantPremiumPreview({ draft, qrCodeUrl, watermarkUrl }: { draft: ReceiptDraft; qrCodeUrl?: string; watermarkUrl?: string }) {
  return <PremiumReceiptPreview design="neo-glass" draft={draft} qrCodeUrl={qrCodeUrl} watermarkUrl={watermarkUrl} />;
}
