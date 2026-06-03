'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Eye, Sparkles } from 'lucide-react';
import { getPremiumTemplateDesign } from '@/lib/templates/premium-template-designs';

interface TemplateCardProps {
  id: string;
  name: string;
  slug: string;
  category: string;
  thumbnail?: string;
  active: boolean;
  featured: boolean;
  premium?: boolean;
  onUse: (slug: string) => void;
  onPreview: (slug: string) => void;
}

export function TemplateCard({ id, name, slug, category, thumbnail, active, featured, premium, onUse, onPreview }: TemplateCardProps) {
  const design = getPremiumTemplateDesign(slug);
  const dark = ['luxury-black-gold', 'neo-glass', 'ultra-modern'].includes(design.key);

  return (
    <motion.div
      whileHover={{ y: -6, scale: 1.02 }}
      transition={{ duration: 0.24, ease: 'easeOut' }}
      className="group rounded-2xl border border-slate-200 bg-white p-4 shadow-sm hover:shadow-lg transition-shadow"
    >
      <div className="relative h-64 overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
        {thumbnail ? (
          <img src={thumbnail} alt={name} className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]" />
        ) : (
          <div className={`h-full p-4 ${design.previewClass}`}>
            <div className={`flex h-full flex-col justify-between overflow-hidden ${dark ? 'text-white' : 'text-slate-950'} ${design.shellClass.replace('p-8', 'p-4').replace('p-10', 'p-4').replace('p-7', 'p-4').replace('p-6', 'p-4')}`}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className={`text-[9px] font-black uppercase tracking-[0.22em] ${dark ? 'text-white/60' : 'text-slate-500'}`}>{design.category}</p>
                  <p className="mt-2 max-w-[150px] text-lg font-black leading-tight">{name}</p>
                </div>
                <div className="h-10 w-10 rounded-2xl" style={{ background: design.accent }} />
              </div>
              <div>
                <div className="mb-3 h-2 w-24 rounded-full" style={{ background: design.accent2 }} />
                <div className={`rounded-2xl border p-3 ${dark ? 'border-white/10 bg-white/10' : 'border-slate-200 bg-white/80'}`}>
                  <p className={`text-[9px] font-bold uppercase tracking-[0.18em] ${dark ? 'text-white/50' : 'text-slate-400'}`}>Amount</p>
                  <p className="mt-1 text-2xl font-black">BDT 35K</p>
                </div>
              </div>
            </div>
          </div>
        )}
        {featured && (
          <div className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">
            <Sparkles className="h-3 w-3" />
            Featured
          </div>
        )}
        {premium && (
          <div className="absolute left-3 top-12 inline-flex items-center gap-1 rounded-full bg-purple-600 px-3 py-1 text-xs font-semibold text-white">
            Premium
          </div>
        )}
        <div className="absolute right-3 top-3 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-slate-700 shadow-sm">
          {active ? 'Active' : 'Draft'}
        </div>
      </div>
      <div className="mt-4 flex items-start justify-between gap-4">
        <div>
          <div className="text-sm font-semibold text-slate-950">{name}</div>
          <div className="mt-1 text-xs text-slate-500">{category}</div>
        </div>
        <div className="flex shrink-0 gap-2">
          <button onClick={() => onPreview(slug)} className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50" aria-label={`Preview ${name}`}>
            <Eye className="h-4 w-4" />
          </button>
          <button onClick={() => onUse(slug)} className="rounded-xl bg-gradient-to-r from-blue-600 to-sky-500 px-3 py-2 text-xs font-semibold text-white transition hover:from-blue-700 hover:to-sky-600">Use Template</button>
        </div>
      </div>
    </motion.div>
  );
}
