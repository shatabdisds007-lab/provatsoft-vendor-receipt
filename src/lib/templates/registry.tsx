import dynamic from 'next/dynamic';
import type { ReceiptTemplateId } from '@/data/templates';

// Lazy-load preview components
const EducationPreview = dynamic(() => import('@/components/receipt/education-preview').then((m) => m.EducationReceiptPreview), { ssr: false });
const UniversityAdmissionPreview = dynamic(() => import('@/components/receipt/university-admission-preview').then((m) => m.UniversityAdmissionPreview), { ssr: false });
const CorporateBluePreview = dynamic(() => import('@/components/receipt/corporate-blue-preview').then((m) => m.CorporateBluePreview), { ssr: false });
const ExecutiveWhitePreview = dynamic(() => import('@/components/receipt/executive-white-preview').then((m) => m.ExecutiveWhitePreview), { ssr: false });
const MinimalModernPreview = dynamic(() => import('@/components/receipt/minimal-modern-preview').then((m) => m.MinimalModernPreview), { ssr: false });
const StartupStylePreview = dynamic(() => import('@/components/receipt/startup-style-preview').then((m) => m.StartupStylePreview), { ssr: false });
const ElegantPremiumPreview = dynamic(() => import('@/components/receipt/elegant-premium-preview').then((m) => m.ElegantPremiumPreview), { ssr: false });
const LuxuryBlackPreview = dynamic(() => import('@/components/receipt/luxury-black-preview').then((m) => m.LuxuryBlackPreview), { ssr: false });
const GovernmentStylePreview = dynamic(() => import('@/components/receipt/government-style-preview').then((m) => m.GovernmentStylePreview), { ssr: false });
const NgoDonationPreview = dynamic(() => import('@/components/receipt/ngo-donation-preview').then((m) => m.NgoDonationPreview), { ssr: false });
const HealthcarePreview = dynamic(() => import('@/components/receipt/healthcare-preview').then((m) => m.HealthcarePreview), { ssr: false });

export const templateRegistry: Record<ReceiptTemplateId, { preview: any; pdfComponent?: any; category?: string }> = {
  'education-branch': { preview: EducationPreview, category: 'Education' },
  'university-admission': { preview: UniversityAdmissionPreview, category: 'Education' },
  'corporate-blue': { preview: CorporateBluePreview, category: 'Corporate' },
  'executive-white': { preview: ExecutiveWhitePreview, category: 'Corporate' },
  'minimal-modern': { preview: MinimalModernPreview, category: 'Business' },
  'startup-style': { preview: StartupStylePreview, category: 'Business' },
  'elegant-premium': { preview: ElegantPremiumPreview, category: 'Business' },
  'luxury-black': { preview: LuxuryBlackPreview, category: 'Business' },
  'government-style': { preview: GovernmentStylePreview, category: 'Government' },
  'ngo-donation': { preview: NgoDonationPreview, category: 'NGO' },
  'healthcare-receipt': { preview: HealthcarePreview, category: 'Healthcare' },
};
