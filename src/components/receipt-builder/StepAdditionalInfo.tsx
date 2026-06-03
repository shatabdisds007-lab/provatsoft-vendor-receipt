'use client';

import { useFormContext } from 'react-hook-form';

export default function StepAdditionalInfo() {
  const { register } = useFormContext();

  return (
    <div className="grid gap-4">
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Notes</label>
        <textarea {...register('notes')} rows={3} className="saaS-input" />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Terms</label>
        <textarea {...register('terms')} rows={3} className="saaS-input" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Received by</label>
          <input {...register('receivedBy')} className="saaS-input" />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Designation</label>
          <input {...register('designation')} className="saaS-input" />
        </div>
      </div>
    </div>
  );
}
