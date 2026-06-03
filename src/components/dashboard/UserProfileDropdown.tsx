'use client';

import { useState } from 'react';
import { ChevronDown, LogOut, Settings, UserCircle2 } from 'lucide-react';

const items = [
  { label: 'Profile', icon: UserCircle2, href: '/dashboard/vendor/settings' },
  { label: 'Settings', icon: Settings, href: '/dashboard/vendor/settings' },
  { label: 'Sign out', icon: LogOut, href: '/logout' },
];

export default function UserProfileDropdown() {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-2.5 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 sm:px-3"
      >
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-900 text-[11px] font-semibold text-white">AD</span>
        <span className="hidden sm:inline">Admin</span>
        <ChevronDown className="h-4 w-4 text-slate-400" />
      </button>
      {open ? (
        <div className="absolute right-0 z-30 mt-3 w-56 rounded-2xl border border-slate-200 bg-white p-3 shadow-xl shadow-slate-200/70">
          <div className="mb-3 rounded-xl bg-slate-50 px-3 py-3 text-sm text-slate-500">Account actions</div>
          <div className="space-y-2">
            {items.map((item) => (
              <a
                key={item.label}
                href={item.href}
                className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-slate-700 transition hover:bg-slate-50"
              >
                <item.icon className="h-4 w-4 text-blue-600" />
                <span>{item.label}</span>
              </a>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
