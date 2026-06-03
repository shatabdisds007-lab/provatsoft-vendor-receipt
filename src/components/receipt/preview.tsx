import { ReceiptDraft } from '@/types/receipt';

interface ReceiptPreviewProps {
  draft: ReceiptDraft;
}

export function ReceiptPreview({ draft }: ReceiptPreviewProps) {
  return (
    <section className="rounded-4xl border border-white/10 bg-slate-900/70 p-6 text-slate-200">
      <div className="mb-5 flex items-center justify-between rounded-3xl bg-slate-950/80 p-4">
        <div>
          <p className="text-sm text-sky-300">Preview</p>
          <h2 className="mt-2 text-xl font-semibold text-white">{draft.companyName || 'Company Name'}</h2>
        </div>
        <div className="rounded-3xl bg-slate-800 px-4 py-2 text-xs uppercase tracking-[0.2em] text-slate-400">{(draft as any).templateId}</div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-3xl bg-slate-950/80 p-4">
          <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Customer</p>
          <p className="mt-2 text-base font-medium text-white">{draft.customerName || 'Full Name'}</p>
          <p className="mt-1 text-sm text-slate-400">{draft.university || 'University / Course'}</p>
        </div>
        <div className="rounded-3xl bg-slate-950/80 p-4">
          <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Payment</p>
          <p className="mt-2 text-base font-semibold text-white">{draft.currency} {draft.amount?.toLocaleString() || '0.00'}</p>
          <p className="mt-1 text-sm text-slate-400">{draft.paymentType || 'Payment Type'}</p>
        </div>
      </div>
    </section>
  );
}
