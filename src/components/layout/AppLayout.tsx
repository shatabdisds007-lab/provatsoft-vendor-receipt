import type { ReactNode } from 'react';
import { motion } from 'framer-motion';

type AppLayoutProps = {
  children: ReactNode;
  header?: ReactNode;
  footer?: ReactNode;
};

export default function AppLayout({ children, header, footer }: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.18),_transparent_25%),radial-gradient(circle_at_bottom_right,_rgba(99,102,241,0.14),_transparent_18%)]" />
      <div className="relative mx-auto flex min-h-screen max-w-[1680px] flex-col px-4 py-4 sm:px-6 lg:px-8">
        {header ? (
          <header className="mb-6 rounded-[32px] border border-white/10 bg-slate-900/75 p-4 shadow-2xl shadow-slate-950/20 backdrop-blur-xl">
            {header}
          </header>
        ) : null}
        <motion.main
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: 'easeOut' }}
          className="relative flex-1 overflow-hidden rounded-[36px] border border-white/10 bg-slate-900/80 shadow-2xl shadow-slate-950/20 backdrop-blur-xl"
        >
          {children}
        </motion.main>
        {footer ? (
          <footer className="mt-6 rounded-[32px] border border-white/10 bg-slate-900/75 p-4 text-sm text-slate-400 shadow-inner shadow-slate-950/10 backdrop-blur-xl">
            {footer}
          </footer>
        ) : null}
      </div>
    </div>
  );
}
