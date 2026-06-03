'use client';

import React, { useMemo, useState } from 'react';
import { ZoomIn, ZoomOut, Maximize2, Minimize2 } from 'lucide-react';
import LivePreview from './LivePreview';

export default function PreviewPanel() {
  const [zoom, setZoom] = useState(100);

  const style = useMemo(() => ({ transform: `scale(${zoom / 100})`, transformOrigin: 'top left' }), [zoom]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="text-sm font-semibold">Live Preview</div>
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
          <LivePreview />
        </div>
      </div>
    </div>
  );
}
