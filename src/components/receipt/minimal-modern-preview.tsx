import type { ReceiptDraft } from '@/types/receipt';
import { PremiumReceiptPreview } from './premium-receipt-preview';

export function MinimalModernPreview({ draft, qrCodeUrl, watermarkUrl }: { draft: ReceiptDraft; qrCodeUrl?: string; watermarkUrl?: string }) {
  return <PremiumReceiptPreview design="apple-minimal" draft={draft} qrCodeUrl={qrCodeUrl} watermarkUrl={watermarkUrl} />;
}
