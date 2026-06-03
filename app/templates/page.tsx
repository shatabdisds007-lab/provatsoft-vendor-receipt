import React from 'react';
import TemplatesGallery from '@/components/templates/templates-gallery';

export default function TemplatesPage() {
  return (
    <main className="min-h-screen bg-slate-950 px-6 py-10 text-slate-100">
      <div className="mx-auto max-w-7xl">
        <TemplatesGallery />
      </div>
    </main>
  );
}
