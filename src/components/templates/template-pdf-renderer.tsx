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
    let payload: any = null;
    const contentType = response.headers.get('content-type');
    try {
      payload = await response.json();
    } catch (e) {
      try {
        payload = await response.text();
      } catch (e2) {
        payload = null;
      }
    }

    console.error('[template-pdf-renderer] server PDF render failed', { key, status: response.status, contentType, payload });
    throw new Error((payload && payload.error) || `Server PDF render failed with status ${response.status}`);
  }

  const blob = await response.blob();
  console.log('[template-pdf-renderer] server PDF blob generated', { key, size: blob.size });
  return blob;
}

export function printPdfBlob(blob: Blob) {
  const url = URL.createObjectURL(blob);
  const iframe = document.createElement('iframe');

  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  iframe.setAttribute('aria-hidden', 'true');

  const cleanup = () => {
    setTimeout(() => {
      iframe.remove();
      URL.revokeObjectURL(url);
    }, 1000);
  };

  iframe.onload = () => {
    const frameWindow = iframe.contentWindow;

    if (!frameWindow) {
      const popup = window.open(url, '_blank');
      popup?.addEventListener('load', () => popup.print(), { once: true });
      cleanup();
      return;
    }

    frameWindow.focus();
    frameWindow.addEventListener('afterprint', cleanup, { once: true });
    frameWindow.print();
    setTimeout(cleanup, 60000);
  };

  iframe.src = url;
  document.body.appendChild(iframe);
}

export async function printPdfBlobForTemplate(slug: string | null, draft: ReceiptDraft, watermarkUrl?: string, qrCodeUrl?: string) {
  const blob = await renderPdfBlobForTemplate(slug, draft, watermarkUrl, qrCodeUrl);
  printPdfBlob(blob);
  return blob;
}
