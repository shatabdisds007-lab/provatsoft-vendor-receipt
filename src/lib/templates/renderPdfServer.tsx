const React = require('react');
import { renderPdfWithWorker } from '@/lib/pdfWorkerClient';
import { getPdfComponent } from '@/lib/templates/pdf-registry';
import { retryWithBackoff } from '@/lib/retry';
import { logPdfGenerationEvent } from '@/services/pdfGenerationService';
import type { ReceiptDraft } from '@/types/receipt';

export async function renderPdfBufferForTemplate(
  slug: string | null,
  draft: ReceiptDraft,
  watermarkUrl?: string,
  qrCodeUrl?: string,
): Promise<Buffer> {
  const key = slug || 'education-branch';
  const templateName = key.replace(/-/g, ' ');

  try {
    console.log('[renderPdfServer] start PDF generation', { key, receiptNumber: draft.receiptNumber });
    const buffer = await retryWithBackoff(
      async () => {
        console.log('[renderPdfServer] calling worker for PDF generation', { key, draft: { receiptNumber: draft.receiptNumber, companyName: draft.companyName } });
        const pdfBuffer = await renderPdfWithWorker(draft);
        console.log('[renderPdfServer] worker returned PDF buffer', { length: pdfBuffer.length });
        return pdfBuffer;
      },
      3,
      1000,
      { action: 'pdf_generation', route: `/lib/templates/renderPdfServer/${key}` },
    );

    await logPdfGenerationEvent({
      templateSlug: key,
      templateName,
      status: 'success',
      receiptNumber: draft.receiptNumber || null,
      fallbackUsed: false,
    });

    return buffer;
  } catch (error: any) {
    console.error('[renderPdfServer] PDF generation failed for', key, error?.message || error);
    await logPdfGenerationEvent({
      templateSlug: key,
      templateName,
      status: 'fallback',
      receiptNumber: draft.receiptNumber || null,
      fallbackUsed: true,
      message: error?.message || 'PDF generation fell back to minimal template',
    });
    const fallback = await fallbackPdf(draft, watermarkUrl, qrCodeUrl, key);
    console.log('[renderPdfServer] returning fallback buffer length', fallback?.length);
    return fallback;
  }
}

async function fallbackPdf(draft: ReceiptDraft, watermarkUrl?: string, qrCodeUrl?: string, key = 'minimal-modern'): Promise<Buffer> {
  console.log('[renderPdfServer] fallbackPdf calling worker', { key });
  try {
    return await renderPdfWithWorker(draft);
  } catch (err: any) {
    console.error('[renderPdfServer] fallbackPdf worker call failed for', key, { message: err?.message, stack: err?.stack });
    throw err;
  }
}
