'use client';

import { useEffect, useState } from 'react';
import { useFormContext } from 'react-hook-form';

export default function LivePreview() {
  const { watch } = useFormContext();
  const values = watch();
  const [local, setLocal] = useState(values);

  useEffect(() => {
    const sub = watch((v) => setLocal(v));
    return () => sub.unsubscribe();
  }, [watch]);

  return (
    <div className="max-w-none break-words rounded-xl border border-slate-200 bg-slate-50 p-5 text-slate-700">
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="text-lg font-bold text-slate-950">{local.companyName || 'Company name'}</div>
          <div className="text-sm text-slate-500">{local.companyAddress}</div>
        </div>
        <div className="text-right">
          <div className="text-sm text-slate-500">Receipt</div>
          <div className="font-mono text-sm font-semibold text-slate-950">{local.receiptNumber || '-'}</div>
        </div>
      </div>

      <hr className="my-4 border-slate-200" />

      <div>
        <div className="text-sm text-slate-500">Received from</div>
        <div className="text-base font-semibold text-slate-950">{local.customerName || 'Customer name'}</div>
        <div className="text-sm text-slate-500">{local.customerEmail}</div>
      </div>

      <div className="my-4 rounded-xl border border-blue-100 bg-blue-50 p-4">
        <div className="text-sm font-medium text-blue-700">Amount</div>
        <div className="mt-1 text-2xl font-bold text-slate-950">
          {(local.amount ?? 0).toFixed(2)} {local.currency || ''}
        </div>
        <div className="text-sm text-slate-600">Paid: {(local.paidAmount ?? 0).toFixed(2)}</div>
      </div>

      <div className="text-sm text-slate-500">{local.notes}</div>

      <div className="mt-6 flex items-center justify-between">
        <div>
          <div className="text-xs text-slate-400">Received by</div>
          <div className="text-sm font-medium text-slate-800">{local.receivedBy}</div>
        </div>
        <div className="text-right">
          <div className="text-xs text-slate-400">Date</div>
          <div className="text-sm font-medium text-slate-800">{local.date}</div>
        </div>
      </div>
    </div>
  );
}
