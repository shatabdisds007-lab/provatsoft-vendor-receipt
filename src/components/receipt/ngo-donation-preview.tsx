import type { ReceiptDraft } from '@/types/receipt';

export function NgoDonationPreview({ draft, qrCodeUrl, watermarkUrl }: { draft: ReceiptDraft; qrCodeUrl?: string; watermarkUrl?: string }) {
  return (
    <article className="relative overflow-hidden rounded-3xl border border-emerald-200 bg-white shadow-lg">
      {watermarkUrl ? (
        <img
          src={watermarkUrl}
          alt="Watermark"
          className="pointer-events-none absolute inset-0 m-auto h-[70%] w-[70%] opacity-10 object-contain"
        />
      ) : null}
      <div className="bg-emerald-600 px-8 py-6 text-white">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-3xl border border-emerald-200 bg-white/10">
              {draft.companyLogoUrl ? (
                <img src={draft.companyLogoUrl} alt="Company logo" className="h-12 w-12 object-contain" />
              ) : (
                <span className="text-xs uppercase tracking-[0.3em] text-emerald-200">Logo</span>
              )}
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-emerald-200">Donation Receipt</p>
              <h1 className="text-3xl font-black">{draft.companyName || 'Charity Org'}</h1>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs uppercase tracking-[0.35em] text-emerald-200">Donor</p>
            <p className="mt-2 text-xl font-semibold">{draft.customerName}</p>
            <p className="text-sm text-emerald-100">{draft.date}</p>
          </div>
        </div>
      </div>
      <div className="space-y-6 p-8">
        <div className="rounded-3xl border border-emerald-100 bg-emerald-50 p-6">
          <p className="text-xs uppercase tracking-[0.35em] text-emerald-700">Donation For</p>
          <p className="mt-3 text-lg font-semibold text-emerald-900">{draft.paymentPurpose || 'Community Program'}</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-3xl border border-emerald-100 bg-white p-6">
            <p className="text-xs uppercase tracking-[0.35em] text-slate-500">Email</p>
            <p className="mt-3 text-sm text-slate-900">{draft.customerEmail || 'donor@example.com'}</p>
          </div>
          <div className="rounded-3xl bg-emerald-50 p-6 text-right">
            <p className="text-xs uppercase tracking-[0.35em] text-emerald-700">Amount</p>
            <p className="mt-4 text-4xl font-black text-emerald-900">{draft.currency} {draft.amount.toLocaleString()}</p>
          </div>
        </div>
        <div className="rounded-3xl border border-emerald-100 bg-white p-6 text-sm text-slate-600">
          <p>{draft.notes || 'Thank you for donating. Your contribution supports our mission and community initiatives.'}</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-[1fr_auto] items-start">
          <div className="rounded-3xl border border-emerald-100 bg-white p-4 text-center">
            {draft.signatureUrl ? (
              <img src={draft.signatureUrl} alt="Signature" className="mx-auto h-14 object-contain" />
            ) : (
              <span className="text-sm uppercase text-emerald-700">Authorized Signature</span>
            )}
          </div>
          <div className="rounded-3xl border border-emerald-100 bg-white p-4 text-center">
            {draft.stampUrl ? (
              <img src={draft.stampUrl} alt="Stamp" className="mx-auto h-14 object-contain" />
            ) : (
              <span className="text-sm uppercase text-emerald-700">Official Stamp</span>
            )}
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          {qrCodeUrl ? (
            <img src={qrCodeUrl} alt="QR Code" className="h-24 w-24 rounded-xl object-contain" />
          ) : (
            <div className="flex h-24 w-24 items-center justify-center rounded-xl border border-dashed border-emerald-200 text-xs text-emerald-500">QR</div>
          )}
        </div>
      </div>
    </article>
  );
}
