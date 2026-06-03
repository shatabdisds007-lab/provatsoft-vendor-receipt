import type { ReceiptTemplateId } from '@/data/templates';

// Static imports to avoid client-side chunk loading failures during dynamic imports
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

export type PdfTemplateLoader = () => Promise<any>;

const registry: Record<ReceiptTemplateId, PdfTemplateLoader> = {
  'executive-white': async () => ExecutiveGlassPdf,
  'university-admission': async () => CanvaModernPdf,
  'corporate-blue': async () => StripeProfessionalPdf,
  'minimal-modern': async () => AppleMinimalPdf,
  'luxury-black': async () => LuxuryBlackGoldPdf,
  'education-branch': async () => SimpleReceiptPdf,
  'startup-style': async () => CreativeAgencyPdf,
  'elegant-premium': async () => NeoGlassPdf,
  'ngo-donation': async () => NgoPdf,
  'healthcare-receipt': async () => PremiumHealthcarePdf,
  'government-style': async () => UltraModernPdf,
};

const pdfCache = new Map<string, any>();

export async function getPdfComponent(slug: ReceiptTemplateId | string) {
  const key = (slug || 'minimal-modern') as ReceiptTemplateId;
  console.log('[pdf-registry] request for', key);
  if (pdfCache.has(key)) {
    console.log('[pdf-registry] cache hit for', key);
    return pdfCache.get(key);
  }

  const loader = registry[key] || registry['minimal-modern'];
  console.log('[pdf-registry] loading component for', key);
  const loaded = await loader();
  console.log('[pdf-registry] loaded component for', key, typeof loaded);
  pdfCache.set(key, loaded);
  return loaded;
}
