'use client';

import React, { useEffect, useState } from 'react';

interface Props {
  draftApi: any;
}

export default function AutosaveIndicator({ draftApi }: Props) {
  const [status, setStatus] = useState<'idle'|'saving'|'saved'|'failed'>('idle');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  useEffect(() => {
    if (draftApi.isDirty) {
      setStatus('saving');
    } else {
      // saved
      setStatus('saved');
      setLastSaved(new Date());
      const t = setTimeout(() => setStatus('idle'), 3000);
      return () => clearTimeout(t);
    }
  }, [draftApi.isDirty]);

  return (
    <div className="inline-flex items-center gap-3">
      <div className="text-xs text-slate-600">
        {status === 'saving' && 'Saving...'}
        {status === 'saved' && lastSaved && `Saved just now`}
        {status === 'idle' && 'All changes saved'}
      </div>
      <div className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-600">{draftApi.isDirty ? 'Draft' : 'Saved'}</div>
    </div>
  );
}
