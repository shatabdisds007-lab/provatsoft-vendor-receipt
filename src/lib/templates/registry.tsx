import type { ReceiptTemplateId } from '@/data/templates';

export const templateRegistry: Record<ReceiptTemplateId, { slug: ReceiptTemplateId; category: string }> = {
  'education-branch': { slug: 'education-branch', category: 'Education' },
  'university-admission': { slug: 'university-admission', category: 'Education' },
  'corporate-blue': { slug: 'corporate-blue', category: 'Corporate' },
  'executive-white': { slug: 'executive-white', category: 'Corporate' },
  'minimal-modern': { slug: 'minimal-modern', category: 'Business' },
  'startup-style': { slug: 'startup-style', category: 'Business' },
  'elegant-premium': { slug: 'elegant-premium', category: 'Business' },
  'luxury-black': { slug: 'luxury-black', category: 'Business' },
  'government-style': { slug: 'government-style', category: 'Government' },
  'ngo-donation': { slug: 'ngo-donation', category: 'NGO' },
  'healthcare-receipt': { slug: 'healthcare-receipt', category: 'Healthcare' },
};
