'use client';

import type { ReceiptDraft } from '@/types/receipt';

export async function renderPdfBlobForTemplate(slug: string | null, draft: ReceiptDraft, watermarkUrl?: string, qrCodeUrl?: string) {
  const key = slug || 'education-branch';
  console.log('[template-pdf-renderer] renderPdfBlobForTemplate start', { key, draft, watermarkUrl, qrCodeUrl });
  const response = await fetch('/api/pdf/render', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ slug: key, draft, watermarkUrl, qrCodeUrl }),
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    console.error('[template-pdf-renderer] server PDF render failed', { key, status: response.status, payload });
    throw new Error(payload?.error || `Server PDF render failed with status ${response.status}`);
  }

  const blob = await response.blob();
  console.log('[template-pdf-renderer] server PDF blob generated', { key, size: blob.size });
  return blob;
}
