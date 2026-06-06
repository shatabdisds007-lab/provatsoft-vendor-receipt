'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useFormContext } from 'react-hook-form';
import { ZoomIn, ZoomOut, Maximize2, Minimize2 } from 'lucide-react';
import { TemplateRenderer } from '@/components/templates/template-renderer';
import type { ReceiptDraft } from '@/types/receipt';

export default function PreviewPanel() {
  const { watch } = useFormContext();
  const [zoom, setZoom] = useState(100);
  const [localDraft, setLocalDraft] = useState<ReceiptDraft>({} as ReceiptDraft);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('education-branch');

  useEffect(() => {
    const stored = typeof window !== 'undefined' ? window.localStorage.getItem('selected_template') : null;
    setSelectedTemplate(stored || 'education-branch');
  }, []);

  useEffect(() => {
    const subscription = watch((value) => {
      setLocalDraft(value as ReceiptDraft);
    });
    return () => subscription.unsubscribe();
  }, [watch]);

  const style = useMemo(() => ({ transform: `scale(${zoom / 100})`, transformOrigin: 'top left' }), [zoom]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="text-sm font-semibold">Template Preview</div>
        <div className="flex items-center gap-2">
          <button onClick={() => setZoom((z) => Math.max(25, z - 25))} className="rounded-md p-2 hover:bg-slate-100"><ZoomOut className="h-4 w-4" /></button>
          <button onClick={() => setZoom((z) => Math.min(200, z + 25))} className="rounded-md p-2 hover:bg-slate-100"><ZoomIn className="h-4 w-4" /></button>
          <button onClick={() => setZoom(100)} className="rounded-md p-2 hover:bg-slate-100">100%</button>
          <button onClick={() => setZoom(100)} className="rounded-md p-2 hover:bg-slate-100"><Maximize2 className="h-4 w-4" /></button>
          <button onClick={() => setZoom(50)} className="rounded-md p-2 hover:bg-slate-100"><Minimize2 className="h-4 w-4" /></button>
        </div>
      </div>

      <div className="sticky top-28 rounded-2xl border border-slate-200 bg-white p-4">
        <div className="overflow-auto rounded-xl bg-slate-50 p-4" style={style}>
          <TemplateRenderer slug={selectedTemplate} draft={localDraft} qrCodeUrl={(localDraft as any)?.qrCodeUrl} watermarkUrl={(localDraft as any)?.watermarkUrl} />
        </div>
      </div>
    </div>
  );
}
