'use client';

import { Menu, Search } from 'lucide-react';
import NotificationDropdown from './NotificationDropdown';
import UserProfileDropdown from './UserProfileDropdown';

interface NavbarProps {
  onMobileToggle: () => void;
}

export default function Navbar({ onMobileToggle }: NavbarProps) {
  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-[1440px] items-center gap-4 px-4 sm:px-6 lg:px-8">
        <button
          type="button"
          onClick={onMobileToggle}
          className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 lg:hidden"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="flex flex-1 items-center gap-4">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              className="w-full max-w-2xl rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
              placeholder="Search receipts, templates, emails..."
              type="search"
            />
          </div>

          <div className="hidden items-center gap-3 sm:flex">
            <div className="rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700">Pro plan</div>
            <div className="hidden min-w-36 items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-600 md:flex">
              <span>742 / 1k</span>
              <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-200">
                <span className="block h-full w-[74%] rounded-full bg-blue-600" />
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <NotificationDropdown />
          <UserProfileDropdown />
        </div>
      </div>
    </header>
  );
}
