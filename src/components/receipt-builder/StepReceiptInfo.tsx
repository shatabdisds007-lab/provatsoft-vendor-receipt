'use client';

import { useFormContext } from 'react-hook-form';

export default function StepReceiptInfo() {
  const { register } = useFormContext();

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Receipt number</label>
        <input {...register('receiptNumber')} className="saaS-input" />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Reference</label>
        <input {...register('referenceNumber')} className="saaS-input" />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Date</label>
        <input {...register('date')} type="date" className="saaS-input" />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Currency</label>
        <input {...register('currency')} className="saaS-input" />
      </div>
      <div className="sm:col-span-2">
        <label className="mb-1 block text-sm font-medium text-slate-700">Payment purpose</label>
        <input {...register('paymentPurpose')} className="saaS-input" />
      </div>
    </div>
  );
}
