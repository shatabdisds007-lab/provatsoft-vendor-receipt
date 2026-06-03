'use client';

import { useFormContext } from 'react-hook-form';

export default function StepCustomerInfo() {
  const { register } = useFormContext();

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Customer name</label>
        <input {...register('customerName')} className="saaS-input" />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Customer email</label>
        <input {...register('customerEmail')} type="email" className="saaS-input" />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Gender</label>
        <input {...register('gender')} className="saaS-input" />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Nationality</label>
        <input {...register('nationality')} className="saaS-input" />
      </div>
    </div>
  );
}
