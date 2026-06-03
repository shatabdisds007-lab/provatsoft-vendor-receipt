'use client';

import React from 'react';
import { Save, FileText, Mail, Printer, Copy } from 'lucide-react';

interface Props {
  onSave: () => void;
  onGenerate: () => void;
  onEmail: () => void;
  onPrint: () => void;
  onDuplicate: () => void;
  rightContent?: React.ReactNode;
}

export default function TopActionBar({ onSave, onGenerate, onEmail, onPrint, onDuplicate, rightContent }: Props) {
  return (
    <div className="sticky top-4 z-40 mb-4 flex items-center justify-between gap-4 rounded-2xl bg-white/80 px-4 py-3 backdrop-blur-sm">
      <div className="flex items-center gap-3">
        <button onClick={onSave} className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700">
          <Save className="h-4 w-4" /> Save Draft
        </button>
        <button onClick={onGenerate} className="inline-flex items-center gap-2 rounded-xl bg-white border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
          <FileText className="h-4 w-4" /> Generate PDF
        </button>
        <button onClick={onEmail} className="inline-flex items-center gap-2 rounded-xl bg-white border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
          <Mail className="h-4 w-4" /> Send Email
        </button>
        <button onClick={onPrint} className="inline-flex items-center gap-2 rounded-xl bg-white border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
          <Printer className="h-4 w-4" /> Print
        </button>
        <button onClick={onDuplicate} className="inline-flex items-center gap-2 rounded-xl bg-white border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
          <Copy className="h-4 w-4" /> Duplicate
        </button>
      </div>
      <div className="flex items-center gap-3">{rightContent}</div>
    </div>
  );
}
