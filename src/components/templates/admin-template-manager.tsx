'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

type Template = {
  id: string;
  name: string;
  slug: string;
  category: string;
  thumbnail?: string;
  active: boolean;
  featured: boolean;
  metadata?: any;
};

export default function AdminTemplateManager() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch('/api/templates/list')
      .then((r) => r.json())
      .then((data) => setTemplates(data.templates || []))
      .catch(() => setTemplates([]))
      .finally(() => setLoading(false));
  }, []);

  const toggleActive = async (t: Template) => {
    const res = await fetch('/api/templates/admin', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: t.id, updates: { active: !t.active } }) });
    const data = await res.json();
    if (data.template) setTemplates((cur) => cur.map((c) => (c.id === t.id ? data.template : c)));
  };

  const toggleFeatured = async (t: Template) => {
    const res = await fetch('/api/templates/admin', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: t.id, updates: { featured: !t.featured } }) });
    const data = await res.json();
    if (data.template) setTemplates((cur) => cur.map((c) => (c.id === t.id ? data.template : c)));
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold">Template Manager</h2>
      {loading && <p>Loading...</p>}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {templates.map((t) => (
          <div key={t.id} className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold text-white">{t.name}</div>
                <div className="text-xs text-slate-400">{t.slug} • {t.category}</div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => toggleFeatured(t)} className={`rounded-2xl px-3 py-1 text-xs ${t.featured ? 'bg-amber-400 text-black' : 'bg-slate-700 text-white'}`}>Feature</button>
                <button onClick={() => toggleActive(t)} className={`rounded-2xl px-3 py-1 text-xs ${t.active ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'}`}>{t.active ? 'Disable' : 'Enable'}</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
