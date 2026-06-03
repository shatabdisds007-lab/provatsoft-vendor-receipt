import type { ReactNode } from 'react';

interface FieldProps {
  label: string;
  description?: string;
  children: ReactNode;
}

export function Field({ label, description, children }: FieldProps) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-slate-700">{label}</label>
      {description ? <p className="text-xs text-slate-500">{description}</p> : null}
      {children}
    </div>
  );
}
