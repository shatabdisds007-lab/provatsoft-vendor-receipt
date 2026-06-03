'use client';

import type { ReactNode } from 'react';
import { motion } from 'framer-motion';

interface GlassCardProps {
  title?: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
}

export default function GlassCard({ title, description, children, footer, className = '' }: GlassCardProps) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className={`overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-card ${className}`}
    >
      {title ? (
        <div className="mb-4 flex flex-col gap-2">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-lg font-semibold tracking-tight text-slate-950">{title}</h2>
          </div>
          {description ? <p className="text-sm text-slate-500">{description}</p> : null}
        </div>
      ) : null}
      <div className="space-y-4">{children}</div>
      {footer ? <div className="mt-6 border-t border-slate-200 pt-4">{footer}</div> : null}
    </motion.section>
  );
}
