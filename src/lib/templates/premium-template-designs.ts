export type PremiumTemplateKey =
  | 'executive-glass'
  | 'canva-modern'
  | 'stripe-professional'
  | 'apple-minimal'
  | 'luxury-black-gold'
  | 'modern-education'
  | 'creative-agency'
  | 'neo-glass'
  | 'premium-healthcare'
  | 'ultra-modern';

export type PremiumTemplateDesign = {
  key: PremiumTemplateKey;
  name: string;
  category: 'Corporate' | 'Business' | 'Education' | 'Healthcare' | 'Government';
  description: string;
  accent: string;
  accent2: string;
  ink: string;
  muted: string;
  paper: string;
  surface: string;
  border: string;
  previewClass: string;
  shellClass: string;
  eyebrow: string;
};

export const premiumTemplateDesigns: Record<PremiumTemplateKey, PremiumTemplateDesign> = {
  'executive-glass': {
    key: 'executive-glass',
    name: 'Executive Glass',
    category: 'Corporate',
    description: 'Luxury glassmorphism receipt for boardroom and CEO payments.',
    accent: '#2563eb',
    accent2: '#93c5fd',
    ink: '#0f172a',
    muted: '#64748b',
    paper: '#eef6ff',
    surface: 'rgba(255,255,255,0.76)',
    border: 'rgba(148,163,184,0.34)',
    previewClass: 'bg-[linear-gradient(135deg,#f8fbff,#eef6ff_46%,#ffffff)]',
    shellClass: 'rounded-[24px] border border-white/70 bg-white/72 p-7 shadow-[0_24px_64px_rgba(37,99,235,0.16)] backdrop-blur-xl',
    eyebrow: 'Executive payment record',
  },
  'canva-modern': {
    key: 'canva-modern',
    name: 'Canva Modern',
    category: 'Business',
    description: 'Bold editorial blocks with playful premium brand energy.',
    accent: '#7c3aed',
    accent2: '#06b6d4',
    ink: '#111827',
    muted: '#6b7280',
    paper: '#fff7ed',
    surface: '#ffffff',
    border: '#fed7aa',
    previewClass: 'bg-[#fff7ed]',
    shellClass: 'rounded-[20px] border border-slate-900 bg-white p-6 shadow-[8px_8px_0_#111827]',
    eyebrow: 'Creative payment poster',
  },
  'stripe-professional': {
    key: 'stripe-professional',
    name: 'Stripe Professional',
    category: 'Corporate',
    description: 'Enterprise SaaS receipt with clean panels and subtle gradients.',
    accent: '#635bff',
    accent2: '#00d4ff',
    ink: '#0a2540',
    muted: '#425466',
    paper: '#f6f9fc',
    surface: '#ffffff',
    border: '#d9e2ef',
    previewClass: 'bg-[linear-gradient(135deg,#f6f9fc,#edf4ff)]',
    shellClass: 'rounded-[20px] border border-[#d9e2ef] bg-white p-7 shadow-[0_22px_56px_rgba(10,37,64,0.12)]',
    eyebrow: 'Enterprise receipt',
  },
  'apple-minimal': {
    key: 'apple-minimal',
    name: 'Apple Minimal',
    category: 'Business',
    description: 'Ultra-simple premium invoice aesthetic with quiet hierarchy.',
    accent: '#111827',
    accent2: '#d1d5db',
    ink: '#111827',
    muted: '#6b7280',
    paper: '#fbfbfd',
    surface: '#ffffff',
    border: '#e5e7eb',
    previewClass: 'bg-[#fbfbfd]',
    shellClass: 'rounded-[22px] border border-zinc-200 bg-white p-8 shadow-[0_18px_48px_rgba(0,0,0,0.08)]',
    eyebrow: 'Receipt',
  },
  'luxury-black-gold': {
    key: 'luxury-black-gold',
    name: 'Luxury Black Gold',
    category: 'Business',
    description: 'Black and gold executive receipt for premium brands.',
    accent: '#d6b25e',
    accent2: '#f7e6a7',
    ink: '#f8fafc',
    muted: '#cbd5e1',
    paper: '#050505',
    surface: '#111111',
    border: '#3f3520',
    previewClass: 'bg-[radial-gradient(circle_at_top_right,#3f2f10,transparent_36%),linear-gradient(135deg,#050505,#151515)]',
    shellClass: 'rounded-[22px] border border-[#3f3520] bg-[#0b0b0b] p-7 shadow-[0_28px_70px_rgba(0,0,0,0.48)]',
    eyebrow: 'Private client receipt',
  },
  'modern-education': {
    key: 'modern-education',
    name: 'Modern Education',
    category: 'Education',
    description: 'University admission receipt with trustworthy academic sections.',
    accent: '#0f766e',
    accent2: '#99f6e4',
    ink: '#134e4a',
    muted: '#64748b',
    paper: '#f0fdfa',
    surface: '#ffffff',
    border: '#ccfbf1',
    previewClass: 'bg-[linear-gradient(135deg,#f0fdfa,#ecfeff)]',
    shellClass: 'rounded-[22px] border border-teal-100 bg-white p-7 shadow-[0_22px_54px_rgba(15,118,110,0.14)]',
    eyebrow: 'Admission finance office',
  },
  'creative-agency': {
    key: 'creative-agency',
    name: 'Creative Agency',
    category: 'Business',
    description: 'Asymmetric marketing agency invoice with bold visual rhythm.',
    accent: '#f97316',
    accent2: '#111827',
    ink: '#111827',
    muted: '#6b7280',
    paper: '#fff7ed',
    surface: '#ffffff',
    border: '#fdba74',
    previewClass: 'bg-[linear-gradient(120deg,#fff7ed,#ffffff_48%,#ffedd5)]',
    shellClass: 'rounded-[18px] border border-orange-200 bg-white p-6 shadow-[0_22px_60px_rgba(249,115,22,0.16)]',
    eyebrow: 'Studio invoice receipt',
  },
  'neo-glass': {
    key: 'neo-glass',
    name: 'Neo Glass',
    category: 'Business',
    description: 'Floating glass cards for premium SaaS receipt experiences.',
    accent: '#14b8a6',
    accent2: '#8b5cf6',
    ink: '#f8fafc',
    muted: '#cbd5e1',
    paper: '#0f172a',
    surface: 'rgba(15,23,42,0.72)',
    border: 'rgba(255,255,255,0.16)',
    previewClass: 'bg-[radial-gradient(circle_at_10%_10%,#0f766e,transparent_30%),radial-gradient(circle_at_90%_0%,#7c3aed,transparent_30%),linear-gradient(135deg,#020617,#0f172a)]',
    shellClass: 'rounded-[24px] border border-white/15 bg-slate-950/68 p-7 text-white shadow-[0_32px_90px_rgba(2,6,23,0.52)] backdrop-blur-xl',
    eyebrow: 'Verified SaaS receipt',
  },
  'premium-healthcare': {
    key: 'premium-healthcare',
    name: 'Premium Healthcare',
    category: 'Healthcare',
    description: 'Clean trust-oriented healthcare receipt for clinics and hospitals.',
    accent: '#0284c7',
    accent2: '#7dd3fc',
    ink: '#0c4a6e',
    muted: '#64748b',
    paper: '#f0f9ff',
    surface: '#ffffff',
    border: '#bae6fd',
    previewClass: 'bg-[linear-gradient(135deg,#f0f9ff,#ffffff)]',
    shellClass: 'rounded-[22px] border border-sky-100 bg-white p-7 shadow-[0_22px_54px_rgba(2,132,199,0.12)]',
    eyebrow: 'Patient payment receipt',
  },
  'ultra-modern': {
    key: 'ultra-modern',
    name: 'Ultra Modern',
    category: 'Government',
    description: 'Futuristic SaaS dashboard receipt with strong digital hierarchy.',
    accent: '#22d3ee',
    accent2: '#a855f7',
    ink: '#e0f2fe',
    muted: '#94a3b8',
    paper: '#020617',
    surface: '#0f172a',
    border: '#1e293b',
    previewClass: 'bg-[radial-gradient(circle_at_50%_0%,#164e63,transparent_36%),linear-gradient(135deg,#020617,#111827)]',
    shellClass: 'rounded-[22px] border border-cyan-400/20 bg-slate-950 p-7 text-slate-100 shadow-[0_28px_90px_rgba(34,211,238,0.14)]',
    eyebrow: 'Digital payment telemetry',
  },
};

export const templateDesignBySlug: Record<string, PremiumTemplateKey> = {
  'executive-white': 'executive-glass',
  'university-admission': 'canva-modern',
  'corporate-blue': 'stripe-professional',
  'minimal-modern': 'apple-minimal',
  'luxury-black': 'luxury-black-gold',
  'education-branch': 'modern-education',
  'startup-style': 'creative-agency',
  'elegant-premium': 'neo-glass',
  'healthcare-receipt': 'premium-healthcare',
  'government-style': 'ultra-modern',
};

export function getPremiumTemplateDesign(keyOrSlug: PremiumTemplateKey | string) {
  const key = (templateDesignBySlug[keyOrSlug] || keyOrSlug || 'apple-minimal') as PremiumTemplateKey;
  const design = premiumTemplateDesigns[key] || premiumTemplateDesigns['apple-minimal'];
  console.log('[premium-template-designs] getPremiumTemplateDesign', { keyOrSlug, key, design });
  return design;
}
