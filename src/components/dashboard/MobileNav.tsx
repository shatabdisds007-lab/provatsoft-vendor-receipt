'use client';

import { AnimatePresence, motion } from 'framer-motion';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { CreditCard, History, LayoutDashboard, Mail, ReceiptText, Settings, X } from 'lucide-react';

const items = [
  { href: '/dashboard/vendor', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/vendor/create-receipt', label: 'Create Receipt', icon: ReceiptText },
  { href: '/dashboard/vendor/templates', label: 'Templates', icon: LayoutDashboard },
  { href: '/dashboard/vendor/history', label: 'Receipt History', icon: History },
  { href: '/dashboard/vendor/emails', label: 'Email History', icon: Mail },
  { href: '/dashboard/vendor/subscription', label: 'Subscription', icon: CreditCard },
  { href: '/dashboard/vendor/settings', label: 'Settings', icon: Settings },
];

interface MobileNavProps {
  open: boolean;
  onClose: () => void;
}

export default function MobileNav({ open, onClose }: MobileNavProps) {
  const pathname = usePathname();

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-40 bg-slate-950/30 backdrop-blur-sm lg:hidden"
        >
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', stiffness: 280, damping: 30 }}
            className="relative h-full w-[320px] border-r border-slate-200 bg-white p-5 shadow-2xl"
          >
            <button
              type="button"
              onClick={onClose}
              className="mb-6 inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50"
              aria-label="Close mobile navigation"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="space-y-4">
              {items.map((item) => {
                const Icon = item.icon;
                const active = pathname === item.href || (item.href !== '/dashboard/vendor' && pathname.startsWith(item.href));
                return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onClose}
                  className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-sm font-medium transition ${
                    active ? 'border-blue-100 bg-blue-50 text-blue-700' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              )})}
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
