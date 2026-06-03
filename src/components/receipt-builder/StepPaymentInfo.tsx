'use client';

import { useFormContext } from 'react-hook-form';

export default function StepPaymentInfo() {
  const { register } = useFormContext();

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Amount</label>
        <input {...register('amount', { valueAsNumber: true })} type="number" className="saaS-input" />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Paid amount</label>
        <input {...register('paidAmount', { valueAsNumber: true })} type="number" className="saaS-input" />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Payment type</label>
        <input {...register('paymentType')} className="saaS-input" />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Cheque / Ref</label>
        <input {...register('chequeNumber')} className="saaS-input" />
      </div>
    </div>
  );
}
