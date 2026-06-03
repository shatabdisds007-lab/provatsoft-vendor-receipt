"use client";

import { useState } from 'react';
import PageHeader from '@/components/dashboard/PageHeader';
import Breadcrumbs from '@/components/dashboard/Breadcrumbs';
import GlassCard from '@/components/ui/GlassCard';

export default function BrandingPage() {
  const [brand, setBrand] = useState({ company: 'My Company', color: '#0ea5e9' });

  return (
    <div>
      <Breadcrumbs items={[{ label: 'Dashboard', href: '/dashboard/vendor' }, { label: 'Branding' }]} />
      <PageHeader title="Branding" description="Set company defaults: logo, colors, and brand assets." />

      <div className="grid gap-6 lg:grid-cols-3">
        <GlassCard title="Visual identity">
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm text-slate-300">Company name</label>
              <input className="w-full rounded-2xl border border-white/10 bg-slate-900/80 px-3 py-3 text-sm text-slate-100" value={brand.company} onChange={(e) => setBrand({ ...brand, company: e.target.value })} />
            </div>
            <div>
              <label className="mb-1 block text-sm text-slate-300">Primary color</label>
              <input type="color" className="h-12 w-24 rounded-2xl border border-white/10 p-1" value={brand.color} onChange={(e) => setBrand({ ...brand, color: e.target.value })} />
            </div>
            <div>
              <label className="mb-1 block text-sm text-slate-300">Upload logo</label>
              <div className="mt-2 flex items-center gap-3">
                <div className="h-12 w-12 rounded-2xl bg-slate-900/70" />
                <button className="rounded-2xl bg-slate-800 px-4 py-2 text-sm font-semibold">Upload</button>
              </div>
            </div>
          </div>
        </GlassCard>

        <GlassCard title="Brand preview">
          <div className="rounded-2xl border border-white/6 bg-gradient-to-br p-6" style={{ background: 'linear-gradient(135deg, rgba(14,165,233,0.08), rgba(99,102,241,0.04))' }}>
            <div className="mb-4 flex items-center gap-3">
              <div style={{ background: brand.color }} className="h-12 w-12 rounded-2xl" />
              <div>
                <p className="text-lg font-semibold text-white">{brand.company}</p>
                <p className="text-xs text-slate-400">Receipt branding preview</p>
              </div>
            </div>
            <div className="h-48 rounded-lg border border-white/6 bg-slate-950/70 p-4 text-sm text-slate-300">PDF &amp; email preview area</div>
          </div>
        </GlassCard>

        <GlassCard title="Defaults">
          <div className="space-y-3">
            <div className="rounded-2xl bg-slate-950/70 px-4 py-3 text-sm text-slate-300">Currency: INR</div>
            <div className="rounded-2xl bg-slate-950/70 px-4 py-3 text-sm text-slate-300">Timezone: Asia/Kolkata</div>
            <button className="w-full rounded-2xl bg-sky-500 px-4 py-3 text-sm font-semibold">Save branding</button>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
