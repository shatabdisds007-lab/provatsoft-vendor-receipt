export const receiptTemplates = [
  { id: 'executive-white', name: 'Executive Glass', category: 'corporate', description: 'Luxury glassmorphism receipt with frosted panels and an executive blue-white finish.', enabled: true },
  { id: 'university-admission', name: 'Canva Modern', category: 'business', description: 'Bold editorial receipt with visual blocks, strong hierarchy, and creative brand energy.', enabled: true },
  { id: 'corporate-blue', name: 'Stripe Professional', category: 'corporate', description: 'Clean enterprise SaaS receipt with Stripe-inspired whitespace and subtle gradients.', enabled: true },
  { id: 'minimal-modern', name: 'Apple Minimal', category: 'business', description: 'Quiet premium invoice aesthetic with disciplined typography and extreme simplicity.', enabled: true },
  { id: 'luxury-black', name: 'Luxury Black Gold', category: 'business', description: 'Black and gold executive receipt for premium, private-client transactions.', enabled: true },
  { id: 'education-branch', name: 'Modern Education', category: 'education', description: 'University admission receipt with trust-building sections and modern academic cards.', enabled: true },
  { id: 'startup-style', name: 'Creative Agency', category: 'business', description: 'Asymmetric agency receipt with bold visuals and marketing-studio composition.', enabled: true },
  { id: 'elegant-premium', name: 'Neo Glass', category: 'business', description: 'Floating glass cards with premium SaaS depth and futuristic verification zones.', enabled: true },
  { id: 'ngo-donation', name: 'NGO Donation', category: 'business', description: 'Trust-forward donation receipt with donor clarity, verification, stamp, and signature support.', enabled: true },
  { id: 'healthcare-receipt', name: 'Premium Healthcare', category: 'healthcare', description: 'Clean healthcare receipt designed around trust, clarity, and patient confidence.', enabled: true },
  { id: 'government-style', name: 'Ultra Modern', category: 'government', description: 'Futuristic SaaS dashboard receipt with digital gradients and strong telemetry-style hierarchy.', enabled: true },
] as const;

export type ReceiptTemplateId = (typeof receiptTemplates)[number]['id'];
export type ReceiptTemplate = {
  id: ReceiptTemplateId;
  name: string;
  category: 'education' | 'corporate' | 'business' | 'healthcare' | 'government';
  description: string;
  enabled: boolean;
};
