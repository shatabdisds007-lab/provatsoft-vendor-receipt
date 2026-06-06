// Server-only module for loading PDF components
import type { ReceiptTemplateId } from '@/data/templates';

let pdfComponentMap: Record<string, any> | null = null;
let getPdfComponentFn: ((slug: ReceiptTemplateId | string) => any) | null = null;

export async function getPdfComponentAsync(slug: ReceiptTemplateId | string) {
  if (typeof window !== 'undefined') {
    throw new Error('[PDF LOADER] Cannot load PDF components on client');
  }

  // Lazy load on first use
  if (!getPdfComponentFn) {
    try {
      const module = await import('@/lib/templates/pdf-component-map');
      getPdfComponentFn = module.getPdfComponent;
    } catch (error) {
      console.error('[PDF LOADER] Failed to import pdf-component-map:', error);
      throw error;
    }
  }

  if (!getPdfComponentFn) {
    throw new Error('[PDF LOADER] getPdfComponent function not found');
  }

  return getPdfComponentFn(slug);
}

export function getPdfComponentSync(slug: ReceiptTemplateId | string) {
  if (typeof window !== 'undefined') {
    throw new Error('[PDF LOADER] Cannot load PDF components on client');
  }

  // For sync loading, we need to require
  try {
    // Use dynamic require to get the actual module
    const pdfComponentMap = require('@/lib/templates/pdf-component-map');
    const component = pdfComponentMap.getPdfComponent?.(slug);
    
    if (!component) {
      throw new Error(`No PDF component found for slug: ${slug}`);
    }
    
    return component;
  } catch (error: any) {
    console.error('[PDF LOADER] Sync load failed:', error?.message || error);
    throw new Error(`Failed to load PDF component for ${slug}: ${error?.message || 'unknown error'}`);
  }
}
