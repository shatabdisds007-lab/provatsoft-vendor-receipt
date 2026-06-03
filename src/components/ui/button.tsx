import type { ButtonHTMLAttributes } from 'react';
import { cn } from '../../lib/utils';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
}

export function Button({ className, variant = 'primary', ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-500/15 disabled:pointer-events-none disabled:opacity-50',
        variant === 'primary' && 'bg-blue-600 text-white shadow-sm shadow-blue-600/20 hover:bg-blue-700',
        variant === 'secondary' && 'border border-slate-200 bg-white text-slate-700 shadow-sm hover:bg-slate-50',
        variant === 'ghost' && 'bg-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900',
        className,
      )}
      {...props}
    />
  );
}
