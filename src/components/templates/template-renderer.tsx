'use client';

import React from 'react';
import { templateRegistry } from '@/lib/templates/registry';
import type { ReceiptDraft } from '@/types/receipt';
import type { ReceiptTemplateId } from '@/data/templates';

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
  const entry = templateRegistry[slug as ReceiptTemplateId];
  console.log('[TemplateRenderer] Rendering slug:', slug, 'entry found:', Boolean(entry));
  if (!entry) {
    console.error('[TemplateRenderer] Template registry missing entry for slug:', slug);
    return <div>Template not found</div>;
  }
  const Preview = entry.preview;
  return (
    <div>
      <Preview draft={draft} qrCodeUrl={qrCodeUrl} watermarkUrl={draft.watermarkUrl} />
    </div>
  );
}
