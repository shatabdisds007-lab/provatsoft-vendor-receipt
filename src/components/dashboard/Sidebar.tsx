'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { CreditCard, History, LayoutDashboard, Mail, ReceiptText, Settings } from 'lucide-react';

const navItems = [
  { href: '/dashboard/vendor', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/vendor/create-receipt', label: 'Create Receipt', icon: ReceiptText },
  { href: '/dashboard/vendor/templates', label: 'Templates', icon: LayoutDashboard },
  { href: '/dashboard/vendor/history', label: 'Receipt History', icon: History },
  { href: '/dashboard/vendor/emails', label: 'Email History', icon: Mail },
  { href: '/dashboard/vendor/subscription', label: 'Subscription', icon: CreditCard },
  { href: '/dashboard/vendor/settings', label: 'Settings', icon: Settings },
];

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export default function Sidebar({ open, onClose }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-[280px] shrink-0 flex-col border-r border-slate-200 bg-white/95 p-5 shadow-sm backdrop-blur lg:flex">
      <div className="mb-8 flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600 text-white shadow-glow">
          <span className="text-lg font-semibold">P</span>
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-950">Provatsoft</p>
          <p className="text-xs text-slate-500">Vendor receipts</p>
        </div>
      </div>

      <nav className="space-y-1.5">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href || (item.href !== '/dashboard/vendor' && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`group flex items-center gap-3 rounded-xl border px-3 py-2.5 text-sm font-medium transition ${
                active
                  ? 'border-blue-100 bg-blue-50 text-blue-700 shadow-sm'
                  : 'border-transparent text-slate-600 hover:bg-slate-50 hover:text-slate-950'
              }`}
            >
              <Icon className={`h-4 w-4 transition ${active ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-700'}`} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Usage</p>
        <div className="mt-4 space-y-3">
          <div className="flex items-center justify-between text-sm text-slate-600">
            <span>Receipts</span>
            <span className="font-semibold text-slate-950">742 / 1k</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-slate-200">
            <div className="h-full w-[74%] rounded-full bg-blue-600" />
          </div>
          <p className="text-xs text-slate-500">Pro plan renews Jun 30</p>
        </div>
      </div>
    </aside>
  );
}
