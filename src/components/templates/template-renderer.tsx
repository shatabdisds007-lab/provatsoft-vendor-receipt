'use client';

import { renderReceiptTemplate } from '@/lib/renderReceiptTemplate';
import type { ReceiptDraft } from '@/types/receipt';

interface TemplateRendererProps {
  slug: string | null;
  draft: ReceiptDraft;
  qrCodeUrl?: string;
  watermarkUrl?: string;
}

export function TemplateRenderer({ slug, draft, qrCodeUrl, watermarkUrl }: TemplateRendererProps) {
  if (!slug) {
    console.log('[TemplateRenderer] No slug provided');
    return null;
  }

  return (
    <div>
      {renderReceiptTemplate(
        slug,
        { ...draft, qrCodeUrl, watermarkUrl } as any,
        'preview',
      )}
    </div>
  );
}
