'use client';

import dynamic from 'next/dynamic';
import type { ComponentType } from 'react';
import type { ReceiptDraft } from '@/types/receipt';
import type { ReceiptTemplateId } from '@/data/templates';

const EducationPreview = dynamic(
  () => import('@/components/receipt/education-preview').then((mod) => mod.EducationReceiptPreview),
  { ssr: false },
);
const UniversityAdmissionPreview = dynamic(
  () => import('@/components/receipt/university-admission-preview').then((mod) => mod.UniversityAdmissionPreview),
  { ssr: false },
);
const CorporateBluePreview = dynamic(
  () => import('@/components/receipt/corporate-blue-preview').then((mod) => mod.CorporateBluePreview),
  { ssr: false },
);
const ExecutiveWhitePreview = dynamic(
  () => import('@/components/receipt/executive-white-preview').then((mod) => mod.ExecutiveWhitePreview),
  { ssr: false },
);
const MinimalModernPreview = dynamic(
  () => import('@/components/receipt/minimal-modern-preview').then((mod) => mod.MinimalModernPreview),
  { ssr: false },
);
const StartupStylePreview = dynamic(
  () => import('@/components/receipt/startup-style-preview').then((mod) => mod.StartupStylePreview),
  { ssr: false },
);
const ElegantPremiumPreview = dynamic(
  () => import('@/components/receipt/elegant-premium-preview').then((mod) => mod.ElegantPremiumPreview),
  { ssr: false },
);
const LuxuryBlackPreview = dynamic(
  () => import('@/components/receipt/luxury-black-preview').then((mod) => mod.LuxuryBlackPreview),
  { ssr: false },
);
const GovernmentStylePreview = dynamic(
  () => import('@/components/receipt/government-style-preview').then((mod) => mod.GovernmentStylePreview),
  { ssr: false },
);
const NgoDonationPreview = dynamic(
  () => import('@/components/receipt/ngo-donation-preview').then((mod) => mod.NgoDonationPreview),
  { ssr: false },
);
const HealthcarePreview = dynamic(
  () => import('@/components/receipt/healthcare-preview').then((mod) => mod.HealthcarePreview),
  { ssr: false },
);

const clientTemplateRegistry: Record<ReceiptTemplateId, ComponentType<any>> = {
  'education-branch': EducationPreview,
  'university-admission': UniversityAdmissionPreview,
  'corporate-blue': CorporateBluePreview,
  'executive-white': ExecutiveWhitePreview,
  'minimal-modern': MinimalModernPreview,
  'startup-style': StartupStylePreview,
  'elegant-premium': ElegantPremiumPreview,
  'luxury-black': LuxuryBlackPreview,
  'government-style': GovernmentStylePreview,
  'ngo-donation': NgoDonationPreview,
  'healthcare-receipt': HealthcarePreview,
};

function getClientPreviewComponent(slug: string | null | undefined) {
  const key = (slug || 'education-branch') as ReceiptTemplateId;
  const component = clientTemplateRegistry[key];

  if (!component) {
    console.error('[REGISTRY ERROR] missing preview component for slug:', key);
    throw new Error(`Missing preview component for template slug: ${key}`);
  }

  return component;
}

interface PreviewTemplateProps {
  slug: string | null;
  draft: ReceiptDraft;
  qrCodeUrl?: string;
  watermarkUrl?: string;
}

export function PreviewTemplate({ slug, draft, qrCodeUrl, watermarkUrl }: PreviewTemplateProps) {
  const TemplateComponent = getClientPreviewComponent(slug);
  return <TemplateComponent draft={draft} qrCodeUrl={qrCodeUrl} watermarkUrl={watermarkUrl} />;
}
