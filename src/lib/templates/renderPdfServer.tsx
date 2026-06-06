import React from 'react';
import { renderToBuffer } from '@react-pdf/renderer';
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
    console.log('[PDF INPUT] templateSlug:', key, 'draft:', {
      companyName: draft.companyName,
      branchName: draft.branchName,
      customerName: draft.customerName,
      amount: draft.amount,
      totalAmount: draft.totalAmount,
      paidAmount: draft.paidAmount,
      date: draft.date,
      paymentType: draft.paymentType,
      receiptNumber: draft.receiptNumber,
      currency: draft.currency,
      notes: draft.notes,
    }, 'watermarkUrl:', watermarkUrl, 'qrCodeUrl:', qrCodeUrl);
    console.log('[PDF] generation start', { templateSlug: key, receiptNumber: draft.receiptNumber });
    const buffer = await retryWithBackoff(
      async () => {
        console.log('[PDF] rendering template for', key);
        
        // Get the PDF component
        const PdfComponent = getPdfComponent(key);
        console.log('[PDF] Got component:', PdfComponent.name || 'unknown');
        
        try {
          // Create element with React.createElement
          const element = React.createElement(PdfComponent, {
            draft,
            watermarkUrl,
            qrCodeUrl
          });
          
          console.log('[PDF] Created element, calling renderToBuffer');
          const pdfBuffer = await renderToBuffer(element);
          console.log('[PDF] renderToBuffer success', { templateSlug: key, length: pdfBuffer.length });
          return pdfBuffer;
        } catch (renderError: any) {
          console.error('[PDF] renderToBuffer error:', renderError?.message || renderError);
          throw renderError;
        }
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

    console.log('[PDF OUTPUT] buffer size:', buffer.length);
    return buffer;
  } catch (error: any) {
    console.error('[PDF] generation failed for', key, error?.message || error);
    await logPdfGenerationEvent({
      templateSlug: key,
      templateName,
      status: 'error',
      receiptNumber: draft.receiptNumber || null,
      fallbackUsed: false,
      message: error?.message || 'PDF generation failed',
    });
    throw new Error(`PDF generation failed for template ${key}: ${error?.message || 'unknown error'}`);
  }
}
