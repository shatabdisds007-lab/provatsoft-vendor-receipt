import type { ChangeEvent } from 'react';

interface FileUploadProps {
  label: string;
  accept?: string;
  onChange: (file: File | null) => void;
  fileName?: string;
}

export function FileUpload({ label, accept, onChange, fileName }: FileUploadProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-slate-200">{label}</label>
        {fileName ? <span className="text-xs text-slate-400">{fileName}</span> : null}
      </div>
      <input
        type="file"
        accept={accept}
        onChange={(event: ChangeEvent<HTMLInputElement>) => {
          const file = event.target.files?.[0] ?? null;
          onChange(file);
        }}
        className="w-full rounded-2xl border border-slate-700 bg-slate-900/90 px-4 py-3 text-sm text-slate-100 file:cursor-pointer file:rounded-xl file:border-0 file:bg-slate-800 file:px-3 file:py-2 file:text-slate-100"
      />
    </div>
  );
}
