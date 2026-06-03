'use client';

import type { ReactNode } from 'react';
import { motion } from 'framer-motion';

interface StatsCardProps {
  title: string;
  value: string;
  delta?: string;
  icon?: ReactNode;
  description?: string;
  className?: string;
}

export default function StatsCard({ title, value, delta, icon, description, className = '' }: StatsCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      whileHover={{ y: -2 }}
      className={`rounded-2xl border border-slate-200 bg-white p-5 shadow-card ${className}`}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">{value}</p>
        </div>
        {icon ? <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">{icon}</div> : null}
      </div>
      {description || delta ? (
        <div className="mt-4 flex flex-wrap items-center gap-2 text-sm text-slate-500">
          {description ? <span>{description}</span> : null}
          {delta ? <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">{delta}</span> : null}
        </div>
      ) : null}
    </motion.div>
  );
}
