import { getPdfComponent as getPdfComponentFromMap } from '@/lib/templates/pdf-component-map';
import type { ReceiptTemplateId } from '@/data/templates';

export function getPdfComponent(slug: ReceiptTemplateId | string) {
  const key = (slug || 'education-branch') as ReceiptTemplateId;
  console.log('[pdf-registry] request for', key);
  const component = getPdfComponentFromMap(key);
  if (!component) {
    throw new Error(`[pdf-registry] Missing PDF component for slug: ${key}`);
  }
  console.log('[pdf-registry] loaded component for', key);
  return component;
}
