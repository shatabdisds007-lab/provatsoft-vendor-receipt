'use client';

import { useState } from 'react';
import { Bell, CheckCircle2, XCircle } from 'lucide-react';

const notifications = [
  { title: 'Payment receipt queued', description: 'Receipt #2026-0001 will be delivered shortly.', type: 'success' },
  { title: 'Template rendering stable', description: 'Minimal fallback stayed within service thresholds.', type: 'success' },
  { title: 'New admin login', description: 'A new admin session started 12m ago.', type: 'warning' },
];

export default function NotificationDropdown() {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50"
        aria-label="Notifications"
      >
        <Bell className="h-4 w-4" />
      </button>

      {open ? (
        <div className="absolute right-0 z-30 mt-3 w-80 rounded-2xl border border-slate-200 bg-white p-4 shadow-xl shadow-slate-200/70">
          <div className="flex items-center justify-between pb-3">
            <div>
              <p className="text-sm font-semibold text-slate-950">Notifications</p>
              <p className="text-xs text-slate-500">Latest operational alerts</p>
            </div>
            <span className="rounded-full bg-emerald-50 px-2 py-1 text-[11px] font-semibold text-emerald-700">Live</span>
          </div>
          <div className="space-y-3">
            {notifications.map((item) => (
              <div key={item.title} className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
                <div className="flex items-center gap-3">
                  {item.type === 'success' ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  ) : (
                    <XCircle className="h-4 w-4 text-amber-500" />
                  )}
                  <p className="font-medium text-slate-950">{item.title}</p>
                </div>
                <p className="mt-2 text-slate-500">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
