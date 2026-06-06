import type { ReceiptTemplateId } from '@/data/templates';
import {
  ExecutiveGlassPdf,
  CanvaModernPdf,
  StripeProfessionalPdf,
  AppleMinimalPdf,
  LuxuryBlackGoldPdf,
  ModernEducationPdf,
  CreativeAgencyPdf,
  NeoGlassPdf,
  PremiumHealthcarePdf,
  UltraModernPdf,
} from '@/components/pdf-templates/premium-receipt-pdf';
import { NgoPdf } from '@/components/pdf-templates/ngo-pdf';
import { SimpleReceiptPdf } from '@/lib/templates/simple-receipt-pdf';

const pdfComponentMap: Record<ReceiptTemplateId, React.ComponentType<any>> = {
  'executive-white': ExecutiveGlassPdf,
  'university-admission': CanvaModernPdf,
  'corporate-blue': StripeProfessionalPdf,
  'minimal-modern': AppleMinimalPdf,
  'luxury-black': LuxuryBlackGoldPdf,
  'education-branch': SimpleReceiptPdf,
  'startup-style': CreativeAgencyPdf,
  'elegant-premium': NeoGlassPdf,
  'ngo-donation': NgoPdf,
  'healthcare-receipt': PremiumHealthcarePdf,
  'government-style': UltraModernPdf,
};

export { pdfComponentMap };

export function getPdfComponent(slug: ReceiptTemplateId | string) {
  const key = (slug || 'education-branch') as ReceiptTemplateId;
  const component = pdfComponentMap[key];
  if (!component) {
    console.error('[REGISTRY ERROR] missing PDF component for slug:', key);
  }
  return component;
}
