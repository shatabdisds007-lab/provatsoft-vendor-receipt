'use client';

import React, { useEffect, useState } from 'react';
import { TemplateCard } from './template-card';
import PreviewModal from './preview-modal';
import Breadcrumbs from '@/components/dashboard/Breadcrumbs';
import PageHeader from '@/components/dashboard/PageHeader';
import { Search } from 'lucide-react';

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

const categories = ['All', 'Education', 'Corporate', 'Business', 'Healthcare', 'NGO', 'Government'];
const zoomOptions = [50, 75, 100, 125, 150];

const normalizeCategory = (category?: string) => {
  if (!category) return '';
  const normalized = category.toLowerCase();
  if (normalized === 'ngo') return 'NGO';
  return `${normalized.charAt(0).toUpperCase()}${normalized.slice(1)}`;
};

export default function TemplatesGallery() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [filter, setFilter] = useState('All');
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [previewSlug, setPreviewSlug] = useState<string | null>(null);
  const [zoom, setZoom] = useState(100);
  const [mode, setMode] = useState<'desktop'|'tablet'|'mobile'>('desktop');
  const [query, setQuery] = useState('');

  useEffect(() => {
    console.log('[TemplatesGallery] Fetching templates from /api/templates/list');
    fetch('/api/templates/list')
      .then((r) => {
        console.log('[TemplatesGallery] API response status:', r.status);
        return r.json();
      })
      .then((data) => {
        console.log('[TemplatesGallery] Received data:', data);
        const tmpl = (data.templates || []).map((template: any) => ({
          ...template,
          category: normalizeCategory(template.category),
        }));
        console.log('[TemplatesGallery] Normalized and setting', tmpl.length, 'templates');
        setTemplates(tmpl);
      })
      .catch((err) => {
        console.error('[TemplatesGallery] Fetch error:', err);
        setTemplates([]);
      });
  }, []);

  const onUse = (slug: string) => {
    // persist to localStorage so builder picks it up
    localStorage.setItem('selected_template', slug);
    setSelectedTemplate(slug);
    alert('Template selected: ' + slug);
  };

  const onPreview = (slug: string) => {
    setPreviewSlug(slug);
  };

  const filtered = templates.filter((t) => {
    const categoryMatch = filter === 'All' ? true : normalizeCategory(t.category) === normalizeCategory(filter);
    const queryMatch = `${t.name} ${t.slug} ${t.category}`.toLowerCase().includes(query.toLowerCase());
    return categoryMatch && queryMatch;
  });

  useEffect(() => {
    console.log('[TemplatesGallery] Filtered templates count:', filtered.length, 'filter:', filter, 'query:', query);
  }, [filtered.length, filter, query]);

  return (
    <div className="space-y-6">
      <Breadcrumbs items={[{ label: 'Dashboard', href: '/dashboard/vendor' }, { label: 'Templates' }]} />
      <PageHeader title="Template Gallery" description="Browse premium receipt templates, preview layouts, and choose the best fit for each customer journey." />

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-card">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative w-full lg:max-w-md">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="saaS-input pl-10"
              placeholder="Search templates..."
              type="search"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {categories.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setFilter(c)}
                className={`rounded-full px-3 py-2 text-sm font-medium transition ${
                  filter === c ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/20' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {c}
              </button>
            ))}
            <select value={String(zoom)} onChange={(e) => setZoom(Number(e.target.value))} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10">
              {zoomOptions.map((z) => (
                <option key={z} value={z}>{z}%</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((t) => (
          <TemplateCard key={t.id} {...t} premium={t.metadata?.premium} onUse={onUse} onPreview={onPreview} />
        ))}
      </div>

      {previewSlug && (
        <PreviewModal slug={previewSlug} onClose={() => setPreviewSlug(null)} />
      )}
    </div>
  );
}
