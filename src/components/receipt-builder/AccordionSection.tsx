'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface Props {
  title: string;
  subtitle?: string;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

export default function AccordionSection({ title, subtitle, open, onToggle, children }: Props) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white">
      <button type="button" onClick={onToggle} className="w-full flex items-center justify-between gap-4 p-4">
        <div>
          <div className="text-sm font-semibold text-slate-900">{title}</div>
          {subtitle ? <div className="text-xs text-slate-500">{subtitle}</div> : null}
        </div>
        <div className="text-sm text-slate-500">{open ? 'Hide' : 'Open'}</div>
      </button>
      <motion.div initial={false} animate={{ height: open ? 'auto' : 0, opacity: open ? 1 : 0 }} transition={{ duration: 0.25 }} className="overflow-hidden px-4 pb-4">
        {open ? <div className="pt-2">{children}</div> : null}
      </motion.div>
    </div>
  );
}
