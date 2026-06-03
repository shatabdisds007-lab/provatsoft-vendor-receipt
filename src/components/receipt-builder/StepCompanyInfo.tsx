'use client';

import { useFormContext } from 'react-hook-form';

export default function StepCompanyInfo() {
  const { register, formState } = useFormContext();

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Company name</label>
        <input {...register('companyName')} className="saaS-input" />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Branch</label>
        <input {...register('branchName')} className="saaS-input" />
      </div>
      <div className="sm:col-span-2">
        <label className="mb-1 block text-sm font-medium text-slate-700">Address</label>
        <input {...register('companyAddress')} className="saaS-input" />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Phone</label>
        <input {...register('phone')} className="saaS-input" />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Email</label>
        <input {...register('email')} type="email" className="saaS-input" />
      </div>
    </div>
  );
}
