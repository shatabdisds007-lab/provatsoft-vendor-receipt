'use client';

import type { ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
  statusLabel?: string;
}

export default function PageHeader({ title, description, actions, statusLabel }: PageHeaderProps) {
  return (
    <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-card">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <p className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">Dashboard</p>
            {statusLabel ? <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">{statusLabel}</span> : null}
          </div>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">{title}</h1>
          {description ? <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500">{description}</p> : null}
        </div>
        {actions ? <div className="flex items-center gap-3">{actions}</div> : null}
      </div>
    </div>
  );
}
