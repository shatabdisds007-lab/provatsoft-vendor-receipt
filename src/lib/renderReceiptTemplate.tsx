import React from 'react';
import { PreviewTemplate } from '@/components/templates/TemplateRegistryClient';
import { receiptTemplateIds } from '@/data/templates';
import type { ReceiptDraft } from '@/types/receipt';
import type { ReceiptTemplateId } from '@/data/templates';
// Direct PDF component imports for server-side rendering
import { ExecutiveGlassPdf, CanvaModernPdf, StripeProfessionalPdf, AppleMinimalPdf, LuxuryBlackGoldPdf, ModernEducationPdf, CreativeAgencyPdf, NeoGlassPdf, PremiumHealthcarePdf, UltraModernPdf } from '@/components/pdf-templates/premium-receipt-pdf';
import { NgoPdf } from '@/components/pdf-templates/ngo-pdf';
import { SimpleReceiptPdf } from '@/lib/templates/simple-receipt-pdf';
import { MinimalTestPdf } from '@/lib/templates/minimal-test-pdf';

export type ReceiptRenderMode = 'preview' | 'print' | 'pdf';
export type ReceiptTemplateDraft = ReceiptDraft & {
  qrCodeUrl?: string;
  watermarkUrl?: string;
};

function resolveTemplateSlug(slug: string | null | undefined): ReceiptTemplateId {
  return (slug || 'education-branch') as ReceiptTemplateId;
}

function getPdfComponent(slug: ReceiptTemplateId) {
  if (typeof window !== 'undefined') {
    throw new Error('[RENDER] PDF rendering is only available on the server');
  }

  const componentMap: Record<ReceiptTemplateId, React.ComponentType<any>> = {
    'executive-white': MinimalTestPdf, // Using test component for troubleshooting
    'university-admission': MinimalTestPdf,
    'corporate-blue': MinimalTestPdf,
    'minimal-modern': MinimalTestPdf,
    'luxury-black': MinimalTestPdf,
    'education-branch': SimpleReceiptPdf,
    'startup-style': MinimalTestPdf,
    'elegant-premium': MinimalTestPdf,
    'ngo-donation': MinimalTestPdf,
    'healthcare-receipt': MinimalTestPdf,
    'government-style': MinimalTestPdf,
  };

  const component = componentMap[slug];
  if (!component) {
    throw new Error(`Missing PDF component for template: ${slug}`);
  }

  return component;
}

export { getPdfComponent };

function validateTemplateSlug(slug: string | null | undefined): ReceiptTemplateId {
  const key = (slug || 'education-branch') as ReceiptTemplateId;

  if (!receiptTemplateIds.includes(key)) {
    console.error('[REGISTRY ERROR] invalid template slug:', key);
    throw new Error(`Invalid template slug: ${key}`);
  }

  return key;
}

function getElementName(element: React.ReactElement) {
  const type = element.type;
  if (typeof type === 'string') {
    return type;
  }

  const component = type as { displayName?: string; name?: string };
  return component.displayName || component.name || 'UnknownComponent';
}

function logRenderElement(tag: string, element: React.ReactElement) {
  console.log(`[${tag}] component type:`, getElementName(element));
  console.log(`[${tag}] props:`, element.props);
}

export function renderReceiptTemplate(
  slug: string | null,
  draft: ReceiptTemplateDraft,
  mode: ReceiptRenderMode = 'preview',
) {
  const key = validateTemplateSlug(slug);
  console.log('[RENDER] template slug:', key);
  console.log('[RENDER] mode:', mode);
  console.log('[DRAFT DEBUG] full receipt object:', {
    companyName: draft.companyName,
    branchName: draft.branchName,
    customerName: draft.customerName,
    amount: draft.amount,
    totalAmount: draft.totalAmount,
    paidAmount: draft.paidAmount,
    date: draft.date,
    paymentType: draft.paymentType,
    notes: draft.notes,
    receiptNumber: draft.receiptNumber,
    currency: draft.currency,
    qrCodeUrl: draft.qrCodeUrl,
    watermarkUrl: draft.watermarkUrl,
  });

  if (mode === 'pdf') {
    const PdfComponent = getPdfComponent(key);
    if (!PdfComponent) {
      throw new Error(`Missing PDF component for template slug: ${key}`);
    }

    const element = <PdfComponent draft={draft} qrCodeUrl={draft.qrCodeUrl} watermarkUrl={draft.watermarkUrl} />;
    logRenderElement('PDF TREE', element);
    return element;
  }

  const element = <PreviewTemplate slug={key} draft={draft} qrCodeUrl={draft.qrCodeUrl} watermarkUrl={draft.watermarkUrl} />;
  logRenderElement(mode === 'print' ? 'PRINT TREE' : 'PREVIEW TREE', element);
  return element;
}

export function ReceiptTemplateRenderer({
  slug,
  draft,
  qrCodeUrl,
  watermarkUrl,
  mode = 'preview',
}: {
  slug: string | null;
  draft: ReceiptDraft;
  qrCodeUrl?: string;
  watermarkUrl?: string;
  mode?: ReceiptRenderMode;
}) {
  return renderReceiptTemplate(
    slug,
    { ...draft, qrCodeUrl, watermarkUrl },
    mode,
  );
}
