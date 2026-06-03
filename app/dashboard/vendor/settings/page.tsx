'use client';

import type { ReactNode } from 'react';
import { useState } from 'react';
import { Bell, Building2, LockKeyhole, ShieldCheck, UserRound } from 'lucide-react';
import PageHeader from '@/components/dashboard/PageHeader';
import Breadcrumbs from '@/components/dashboard/Breadcrumbs';

const sections = [
  { id: 'profile', label: 'Profile', icon: UserRound },
  { id: 'branding', label: 'Branding', icon: Building2 },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'security', label: 'Security', icon: LockKeyhole },
];

export default function SettingsPage() {
  const [profile, setProfile] = useState({ name: 'Admin', email: 'admin@example.com', company: 'Provatsoft Vendor' });
  const [active, setActive] = useState('profile');

  return (
    <div>
      <Breadcrumbs items={[{ label: 'Dashboard', href: '/dashboard/vendor' }, { label: 'Settings' }]} />
      <PageHeader title="Settings" description="Manage profile, branding, notification, and security preferences." />

      <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
        <aside className="rounded-2xl border border-slate-200 bg-white p-3 shadow-card">
          {sections.map((section) => {
            const Icon = section.icon;
            const selected = active === section.id;
            return (
              <button
                key={section.id}
                type="button"
                onClick={() => setActive(section.id)}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition ${
                  selected ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-950'
                }`}
              >
                <Icon className="h-4 w-4" />
                {section.label}
              </button>
            );
          })}
        </aside>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-card">
          {active === 'profile' ? (
            <div className="space-y-5">
              <PanelHeader title="Profile" description="Personal and company information used across receipts." />
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Name"><input className="saaS-input" value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} /></Field>
                <Field label="Email"><input className="saaS-input" value={profile.email} onChange={(e) => setProfile({ ...profile, email: e.target.value })} /></Field>
                <Field label="Company"><input className="saaS-input" value={profile.company} onChange={(e) => setProfile({ ...profile, company: e.target.value })} /></Field>
                <Field label="Timezone"><select className="saaS-input" defaultValue="Asia/Dhaka"><option>Asia/Dhaka</option><option>Asia/Kolkata</option><option>UTC</option></select></Field>
              </div>
              <SaveButton />
            </div>
          ) : null}

          {active === 'branding' ? (
            <div className="space-y-5">
              <PanelHeader title="Branding" description="Receipt logo, brand color, footer, and PDF identity settings." />
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Brand color"><input className="saaS-input" defaultValue="#2563EB" /></Field>
                <Field label="Receipt footer"><input className="saaS-input" defaultValue="Thank you for your payment." /></Field>
              </div>
              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-500">Upload logo, signature, and stamp assets from your existing branding workflow.</div>
              <SaveButton />
            </div>
          ) : null}

          {active === 'notifications' ? (
            <div className="space-y-5">
              <PanelHeader title="Notifications" description="Choose when workspace members receive operational updates." />
              {['Receipt generated', 'Email delivery failed', 'Monthly usage threshold', 'Template rendering issue'].map((item) => (
                <label key={item} className="flex items-center justify-between rounded-xl border border-slate-200 p-4">
                  <span className="text-sm font-medium text-slate-700">{item}</span>
                  <input type="checkbox" defaultChecked className="h-4 w-4 accent-blue-600" />
                </label>
              ))}
              <SaveButton />
            </div>
          ) : null}

          {active === 'security' ? (
            <div className="space-y-5">
              <PanelHeader title="Security" description="Protect account access and keep audit controls visible." />
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                <div className="flex items-center gap-3 text-sm font-semibold text-emerald-800">
                  <ShieldCheck className="h-4 w-4" />
                  Two-step verification ready
                </div>
                <p className="mt-2 text-sm text-emerald-700">Security settings are prepared for your existing authentication flow.</p>
              </div>
              <Field label="Session timeout"><select className="saaS-input" defaultValue="30 minutes"><option>15 minutes</option><option>30 minutes</option><option>1 hour</option></select></Field>
              <SaveButton />
            </div>
          ) : null}
        </section>
      </div>
    </div>
  );
}

function PanelHeader({ title, description }: { title: string; description: string }) {
  return (
    <div className="border-b border-slate-200 pb-5">
      <h2 className="text-xl font-semibold text-slate-950">{title}</h2>
      <p className="mt-1 text-sm text-slate-500">{description}</p>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      {children}
    </label>
  );
}

function SaveButton() {
  return <button className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700">Save changes</button>;
}
