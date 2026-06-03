import type { ReceiptDraft } from '@/types/receipt';
import type { ReactNode } from 'react';
import { getPremiumTemplateDesign, type PremiumTemplateKey } from '@/lib/templates/premium-template-designs';

type PremiumReceiptPreviewProps = {
  draft: ReceiptDraft;
  qrCodeUrl?: string;
  watermarkUrl?: string;
  design: PremiumTemplateKey | string;
};

const previewFont = 'Inter, ui-sans-serif, system-ui, Helvetica, Arial, sans-serif';

function PreviewShell({
  children,
  className,
  watermarkUrl,
}: {
  children: ReactNode;
  className: string;
  watermarkUrl?: string;
}) {
  return (
    <article className={`${className} relative`} style={{ fontFamily: previewFont }}>
      {children}
      {watermarkUrl ? (
        <img
          src={watermarkUrl}
          alt="Watermark"
          className="pointer-events-none absolute inset-0 m-auto h-[260px] w-auto opacity-10"
          style={{ top: '40%' }}
        />
      ) : null}
    </article>
  );
}

function money(draft: ReceiptDraft) {
  return `${draft.currency || 'BDT'} ${(draft.amount || 0).toLocaleString()}`;
}

function formatValue(value?: string | number | null, fallback = 'Not provided') {
  if (value === undefined || value === null || value === '') return fallback;
  return String(value);
}

function due(draft: ReceiptDraft) {
  return `${draft.currency || 'BDT'} ${Math.max((draft.totalAmount || 0) - (draft.paidAmount || 0), 0).toLocaleString()}`;
}

function Logo({ draft, dark = false, accent }: { draft: ReceiptDraft; dark?: boolean; accent: string }) {
  return (
    <div className="flex max-w-[280px] flex-row-reverse items-center gap-3 text-right">
      <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl border bg-white/90 shadow-sm" style={{ borderColor: `${accent}33` }}>
        {draft.companyLogoUrl ? (
          <img src={draft.companyLogoUrl} alt="Company logo" className="h-10 w-10 object-contain" />
        ) : (
          <span className="text-base font-black" style={{ color: accent }}>{(draft.companyName || 'P').slice(0, 1)}</span>
        )}
      </div>
      <div>
        <h3 className={`text-lg font-black leading-tight tracking-tight ${dark ? 'text-white' : 'text-slate-950'}`}>{draft.companyName || 'Provatsoft'}</h3>
        <p className={`mt-1 text-[12px] leading-5 ${dark ? 'text-slate-300' : 'text-slate-500'}`}>{draft.branchName || draft.companyAddress}</p>
      </div>
    </div>
  );
}

function QrBlock({ qrCodeUrl, dark = false, label = 'Scan to verify' }: { qrCodeUrl?: string; dark?: boolean; label?: string }) {
  return (
    <div className={`grid w-28 place-items-center rounded-2xl border p-3 text-center ${dark ? 'border-white/15 bg-white/10 text-slate-200' : 'border-slate-200 bg-white text-slate-500'}`}>
      {qrCodeUrl ? <img src={qrCodeUrl} alt="QR code" className="h-16 w-16 rounded-lg object-contain" /> : <div className={`grid h-16 w-16 place-items-center rounded-lg border border-dashed text-xs ${dark ? 'border-white/30 text-slate-300' : 'border-slate-300 text-slate-400'}`}>QR</div>}
      <p className="mt-2 text-[9px] font-bold uppercase tracking-[0.18em]">{label}</p>
    </div>
  );
}

function SignatureZone({ draft, dark = false, accent }: { draft: ReceiptDraft; dark?: boolean; accent: string }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <div className={`rounded-2xl border p-4 ${dark ? 'border-white/15 bg-white/10' : 'border-slate-200 bg-white/75'}`}>
        <p className={`text-[9px] font-bold uppercase tracking-[0.2em] ${dark ? 'text-slate-300' : 'text-slate-500'}`}>Authorized by</p>
        <div className="mt-3 h-10">
          {draft.signatureUrl ? <img src={draft.signatureUrl} alt="Signature" className="h-full object-contain" /> : <div className="h-px w-36 translate-y-8" style={{ background: accent }} />}
        </div>
        <p className={`text-sm font-bold ${dark ? 'text-white' : 'text-slate-950'}`}>{draft.receivedBy || 'Accounts Lead'}</p>
        <p className={`text-[11px] ${dark ? 'text-slate-400' : 'text-slate-500'}`}>{draft.designation || 'Finance Manager'}</p>
        {draft.terms ? (
          <p className={`mt-3 text-[10px] ${dark ? 'text-slate-300' : 'text-slate-500'} italic leading-5`}>{draft.terms}</p>
        ) : null}
      </div>
      <div className={`rounded-2xl border p-4 ${dark ? 'border-white/15 bg-white/10' : 'border-slate-200 bg-white/75'}`}>
        <p className={`text-[9px] font-bold uppercase tracking-[0.2em] ${dark ? 'text-slate-300' : 'text-slate-500'}`}>Official stamp</p>
        <div className="mt-3 grid h-16 place-items-center rounded-xl border border-dashed" style={{ borderColor: `${accent}66` }}>
          {draft.stampUrl ? <img src={draft.stampUrl} alt="Stamp" className="h-12 object-contain" /> : <span className="text-[10px] font-bold uppercase tracking-[0.18em]" style={{ color: accent }}>Verified</span>}
        </div>
      </div>
    </div>
  );
}

function DetailGrid({ draft, dark = false }: { draft: ReceiptDraft; dark?: boolean }) {
  const cls = dark ? 'border-white/10 bg-white/10 text-white' : 'border-slate-200 bg-white text-slate-950';
  const label = dark ? 'text-slate-400' : 'text-slate-500';
  return (
    <div className="grid gap-2 sm:grid-cols-3">
      {[
        ['Receipt No', draft.receiptNumber],
        ['Reference', draft.referenceNumber],
        ['Date', draft.date],
        ['Payment', draft.paymentType],
        ['Purpose', draft.paymentPurpose],
        ['Due', due(draft)],
      ].map(([name, value]) => (
        <div key={name} className={`rounded-xl border p-3 ${cls}`}>
          <p className={`text-[9px] font-bold uppercase tracking-[0.16em] ${label}`}>{name}</p>
          <p className="mt-1.5 text-xs font-bold leading-5">{formatValue(value)}</p>
        </div>
      ))}
    </div>
  );
}

function ContactStrip({ draft, dark = false }: { draft: ReceiptDraft; dark?: boolean }) {
  const text = dark ? 'text-slate-300' : 'text-slate-500';
  const divider = dark ? 'bg-white/15' : 'bg-slate-200';
  const items = [draft.phone, draft.email, draft.website, draft.companyAddress].filter(Boolean);

  if (!items.length) return null;

  return (
    <div className={`flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] leading-5 ${text}`}>
      {items.map((item, index) => (
        <span key={`${item}-${index}`} className="inline-flex items-center gap-3">
          {index > 0 ? <span className={`h-1 w-1 rounded-full ${divider}`} /> : null}
          <span>{item}</span>
        </span>
      ))}
    </div>
  );
}

function CustomerPanel({ draft, dark = false, accent }: { draft: ReceiptDraft; dark?: boolean; accent: string }) {
  return (
    <div className={`rounded-2xl border p-5 ${dark ? 'border-white/15 bg-white/10' : 'border-slate-200 bg-white'}`}>
      <p className={`text-[9px] font-black uppercase tracking-[0.2em] ${dark ? 'text-slate-400' : 'text-slate-500'}`}>Received from</p>
      <h2 className={`mt-3 text-2xl font-black leading-tight tracking-normal ${dark ? 'text-white' : 'text-slate-950'}`}>{formatValue(draft.customerName, 'Customer name')}</h2>
      <p className={`mt-1 text-xs ${dark ? 'text-slate-400' : 'text-slate-500'}`}>{formatValue(draft.customerEmail, 'Customer email')}</p>
      <div className="mt-4 h-1 w-16 rounded-full" style={{ background: accent }} />
      <p className={`mt-4 text-sm italic leading-6 ${dark ? 'text-slate-300' : 'text-slate-600'}`}>
        {formatValue(draft.paymentPurpose, 'Payment purpose')}
        {draft.notes ? ` - ${draft.notes}` : ''}
      </p>
    </div>
  );
}

function ReceiptLine({ label, value, strong = false }: { label: string; value?: string | number | null; strong?: boolean }) {
  return (
    <div className="grid grid-cols-[140px_14px_1fr] items-baseline gap-2 text-sm">
      <span className="font-bold text-slate-900">{label}</span>
      <span className="font-bold text-slate-500">:</span>
      <span className={`${strong ? 'font-black text-blue-800' : 'font-bold text-slate-700'}`}>{formatValue(value, '-')}</span>
    </div>
  );
}

function PaymentCheck({ label, checked }: { label: string; checked: boolean }) {
  return (
    <span className="inline-flex items-center gap-2 text-sm font-bold text-slate-900">
      <span className={`grid h-5 w-5 place-items-center border ${checked ? 'border-blue-700 bg-blue-50 text-blue-800' : 'border-slate-400 bg-white text-transparent'}`}>
        <span className={`h-3 w-1.5 rotate-45 border-b-2 border-r-2 ${checked ? 'border-blue-800' : 'border-transparent'}`} />
      </span>
      {label}
    </span>
  );
}

export function PremiumReceiptPreview({ draft, qrCodeUrl, watermarkUrl, design }: PremiumReceiptPreviewProps) {
  const spec = getPremiumTemplateDesign(design);
  const dark = ['luxury-black-gold', 'neo-glass', 'ultra-modern'].includes(spec.key);

  if (spec.key === 'canva-modern') {
    return (
      <PreviewShell className={`${spec.previewClass} rounded-[28px] p-4 font-sans text-slate-950`} watermarkUrl={watermarkUrl}>
        <div className={spec.shellClass}>
          <div className="mb-5 flex items-start justify-between gap-6">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-violet-700">{spec.eyebrow}</p>
              <p className="mt-2 font-mono text-xs font-bold text-slate-500">{draft.receiptNumber}</p>
            </div>
            <Logo draft={draft} accent={spec.accent} />
          </div>
          <div className="grid gap-5 lg:grid-cols-[0.95fr_1.05fr]">
            <div className="rounded-2xl bg-[#6d28d9] p-6 text-white">
              <h2 className="text-4xl font-black leading-tight tracking-tight">Payment received</h2>
              <div className="mt-6 rounded-2xl bg-white p-5 text-slate-950 shadow-xl">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Amount paid</p>
                <p className="mt-2 text-5xl font-black leading-tight">{money(draft)}</p>
                <p className="mt-2 text-sm italic leading-6 text-slate-500">{draft.amountInWords}</p>
              </div>
              <div className="mt-5"><ContactStrip draft={draft} dark /></div>
            </div>
            <div className="space-y-4">
              <CustomerPanel draft={draft} accent={spec.accent} />
              <DetailGrid draft={draft} />
            </div>
          </div>
          <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_auto]">
            <SignatureZone draft={draft} accent={spec.accent} />
            <QrBlock qrCodeUrl={qrCodeUrl} />
          </div>
        </div>
      </PreviewShell>
    );
  }

  if (spec.key === 'apple-minimal') {
    return (
      <PreviewShell className={`${spec.previewClass} rounded-[28px] p-5 font-sans`} watermarkUrl={watermarkUrl}>
        <div className={spec.shellClass}>
          <div className="flex items-start justify-between gap-8">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-zinc-400">{spec.eyebrow}</p>
              <p className="mt-2 font-mono text-xs font-semibold text-zinc-900">{draft.receiptNumber}</p>
            </div>
            <Logo draft={draft} accent={spec.accent} />
          </div>
          <div className="mt-10 grid gap-8 lg:grid-cols-[0.95fr_1.05fr]">
            <div>
              <p className="text-xs text-zinc-500">Received from</p>
              <h2 className="mt-3 text-3xl font-semibold leading-tight tracking-normal text-zinc-950">{draft.customerName}</h2>
              <p className="mt-4 max-w-sm text-sm italic leading-6 text-zinc-500">{draft.paymentPurpose}. {draft.notes}</p>
              <div className="mt-6"><ContactStrip draft={draft} /></div>
            </div>
            <div className="text-right">
              <p className="text-xs text-zinc-500">Amount paid</p>
              <p className="mt-2 text-5xl font-black leading-tight tracking-tight text-zinc-950">{money(draft)}</p>
              <p className="mt-2 text-sm italic text-zinc-500">{draft.amountInWords}</p>
              <div className="mt-6 text-left">
                <DetailGrid draft={draft} />
              </div>
            </div>
          </div>
          <div className="mt-8 grid gap-4 lg:grid-cols-[1fr_auto]">
            <SignatureZone draft={draft} accent={spec.accent} />
            <QrBlock qrCodeUrl={qrCodeUrl} />
          </div>
        </div>
      </PreviewShell>
    );
  }

  if (spec.key === 'luxury-black-gold') {
    return (
      <PreviewShell className={`${spec.previewClass} rounded-[28px] p-4 font-sans text-white`} watermarkUrl={watermarkUrl}>
        <div className={spec.shellClass}>
          <div className="border-b border-[#d6b25e]/30 pb-6">
            <div className="flex items-start justify-between gap-6">
              <div>
                <div className="inline-flex rounded-full border border-[#d6b25e]/40 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.24em] text-[#f7e6a7]">Settled</div>
                <p className="mt-3 font-mono text-xs text-slate-400">{draft.receiptNumber}</p>
              </div>
              <Logo draft={draft} dark accent={spec.accent} />
            </div>
            <div className="mt-8 grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.26em] text-[#d6b25e]">{spec.eyebrow}</p>
                <h2 className="mt-4 text-4xl font-black leading-tight text-white">{draft.customerName}</h2>
                <p className="mt-3 text-base italic leading-7 text-slate-300">{draft.paymentPurpose}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-400">Premium amount</p>
                <p className="mt-2 text-4xl font-black leading-tight text-[#f7e6a7]">{money(draft)}</p>
                <p className="mt-2 text-xs italic text-slate-400">{draft.amountInWords}</p>
              </div>
            </div>
            <div className="mt-5"><ContactStrip draft={draft} dark /></div>
          </div>
          <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_220px]">
            <div className="space-y-5">
              <DetailGrid draft={draft} dark />
              <SignatureZone draft={draft} dark accent={spec.accent} />
            </div>
            <QrBlock qrCodeUrl={qrCodeUrl} dark label="Private verification" />
          </div>
        </div>
      </PreviewShell>
    );
  }

  if (spec.key === 'creative-agency') {
    return (
      <PreviewShell className={`${spec.previewClass} rounded-[28px] p-4 font-sans`} watermarkUrl={watermarkUrl}>
        <div className={spec.shellClass}>
          <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
            <aside className="rounded-2xl bg-slate-950 p-5 text-white">
              <p className="text-[10px] font-black uppercase tracking-[0.24em] text-orange-300">{spec.eyebrow}</p>
              <p className="mt-7 text-5xl font-black leading-none text-orange-400">PAID</p>
              <p className="mt-6 text-xs italic leading-5 text-slate-300">{draft.amountInWords}</p>
              <div className="mt-7"><ContactStrip draft={draft} dark /></div>
              <div className="mt-7"><QrBlock qrCodeUrl={qrCodeUrl} dark /></div>
            </aside>
            <main>
              <div className="flex items-start justify-between gap-6">
                <div className="rounded-2xl bg-orange-100 px-5 py-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-700">Receipt</p>
                  <p className="mt-2 font-black">{draft.receiptNumber}</p>
                </div>
                <Logo draft={draft} accent={spec.accent} />
              </div>
              <div className="mt-7 rounded-2xl bg-orange-500 p-6 text-white shadow-xl">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-orange-100">Amount paid</p>
                <p className="mt-2 text-5xl font-black leading-tight">{money(draft)}</p>
              </div>
              <div className="mt-6 grid gap-4 lg:grid-cols-2">
                <CustomerPanel draft={draft} accent={spec.accent} />
                <DetailGrid draft={draft} />
              </div>
              <div className="mt-5"><SignatureZone draft={draft} accent={spec.accent} /></div>
            </main>
          </div>
        </div>
      </PreviewShell>
    );
  }

  if (spec.key === 'modern-education') {
    const balanceDue = Math.max((draft.totalAmount || 0) - (draft.paidAmount || 0), 0);
    const isCash = (draft.paymentType || '').toLowerCase().includes('cash');
    const isCheque = (draft.paymentType || '').toLowerCase().includes('cheque');

    return (
      <PreviewShell className={`${spec.previewClass} rounded-[28px] p-4 font-sans text-slate-950`} watermarkUrl={watermarkUrl}>
        <div className="overflow-hidden rounded-[22px] border border-blue-200 bg-white shadow-[0_24px_70px_rgba(30,64,175,0.14)]">
          <div className="grid min-h-[760px] lg:grid-cols-[82px_1fr]">
            <aside className="relative hidden bg-blue-800 lg:block">
              <div className="absolute inset-x-0 top-6 grid place-items-center">
                <div className="h-12 w-12 rounded-xl bg-white/95 shadow-sm" />
              </div>
              <p className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rotate-[-90deg] whitespace-nowrap text-4xl font-black uppercase tracking-[0.2em] text-white">
                Payment Receipt
              </p>
            </aside>

            <main className="relative p-7">
              <div className="pointer-events-none absolute -right-12 -top-12 h-28 w-28 rounded-full bg-blue-500/20" />
              <div className="pointer-events-none absolute -bottom-16 -left-16 h-36 w-36 rounded-full bg-emerald-400/20" />
              <div className="pointer-events-none absolute -bottom-14 -right-10 h-32 w-32 rounded-full bg-rose-400/20" />

              <header className="relative grid gap-5 border-b-2 border-blue-700 pb-5 lg:grid-cols-[1fr_310px]">
                <div>
                  <p className="text-sm font-black text-blue-700">{draft.branchName || 'Education Branch'}</p>
                  <h1 className="mt-1 text-4xl font-black leading-none tracking-normal">
                    <span className="text-emerald-600">Provat</span><span className="text-pink-600">Soft</span>
                    <span className="block text-3xl text-slate-800">Ecosystem</span>
                  </h1>
                  <p className="mt-3 text-sm font-bold text-sky-600">
                    Knowledge, <span className="text-emerald-600">Analyze</span>, <span className="text-red-600">Decision</span>, Execute
                  </p>
                  <div className="mt-4"><ContactStrip draft={draft} /></div>
                </div>

                <div className="space-y-4">
                  <Logo draft={draft} accent={spec.accent} />
                  <div className="rounded-xl border border-blue-300 bg-blue-50 p-3">
                    <div className="grid grid-cols-[1fr_1.35fr] overflow-hidden rounded-lg border border-blue-700 bg-white">
                      <div className="bg-blue-800 px-3 py-2 text-[10px] font-black uppercase leading-4 tracking-[0.12em] text-white">
                        Auto generated receipt no.
                      </div>
                      <div className="grid place-items-center px-3 py-2 text-lg font-black text-red-600">
                        {draft.receiptNumber}
                      </div>
                    </div>
                    <div className="mt-3 space-y-2">
                      <ReceiptLine label="Ref No." value={draft.referenceNumber} />
                      <ReceiptLine label="Date" value={draft.date} strong />
                      <ReceiptLine label="Account No." value={draft.chequeNumber || 'N/A'} />
                    </div>
                  </div>
                </div>
              </header>

              <section className="relative mt-5 rounded-xl border border-blue-300 bg-blue-50/70 p-5">
                <div className="grid gap-x-8 gap-y-3 lg:grid-cols-2">
                  <div className="space-y-3">
                    <ReceiptLine label="Name of the Student" value={draft.customerName} strong />
                    <ReceiptLine label="Gender" value={draft.gender} strong />
                    <ReceiptLine label="Father's Name" value={draft.fatherName} strong />
                  </div>
                  <div className="space-y-3 border-blue-300 lg:border-l lg:pl-8">
                    <ReceiptLine label="Date of Birth" value={draft.dateOfBirth} strong />
                    <ReceiptLine label="Nationality" value={draft.nationality} strong />
                    <ReceiptLine label="University" value={draft.university} strong />
                  </div>
                </div>
              </section>

              <section className="relative mt-5 grid gap-5 lg:grid-cols-[1fr_270px]">
                <div className="space-y-3">
                  <ReceiptLine label="Amount (In Word)" value={draft.amountInWords} strong />
                  <ReceiptLine label="For Payment of" value={draft.paymentPurpose} strong />
                  <div className="grid gap-3 text-sm font-bold text-slate-900 sm:grid-cols-[auto_1fr_auto_1fr]">
                    <span>From</span>
                    <span className="border-b border-slate-400 pb-1 text-blue-800">{draft.paymentPeriod || draft.date}</span>
                    <span>to</span>
                    <span className="border-b border-slate-400 pb-1 text-blue-800">{draft.date}</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-6 gap-y-3 pt-1">
                    <span className="text-sm font-black text-slate-900">Paid by</span>
                    <PaymentCheck label="Cash" checked={isCash || !isCheque} />
                    <PaymentCheck label="Other" checked={!isCash && !isCheque} />
                    <PaymentCheck label="Cheque" checked={isCheque} />
                    <span className="min-w-[220px] flex-1 border-b border-slate-400 pb-1 text-sm font-bold text-slate-700">
                      Cheque No.: {draft.chequeNumber || '-'}
                    </span>
                  </div>
                </div>

                <div className="rounded-xl border-2 border-blue-400 bg-white p-4 text-right shadow-sm">
                  <p className="text-sm font-black text-slate-900">Amount</p>
                  <p className="mt-2 text-4xl font-black leading-none text-blue-800">{money(draft)}</p>
                </div>
              </section>

              <section className="relative mt-5 grid gap-4 lg:grid-cols-[1.05fr_0.62fr_0.95fr]">
                <div className="rounded-xl border border-blue-300 bg-white p-4">
                  <ReceiptLine label="Received by" value={draft.receivedBy} strong />
                  <p className="mt-1 pl-[156px] text-xs font-bold leading-5 text-slate-700">{draft.designation || 'Managing Director'}</p>
                  <div className="mt-4 grid grid-cols-[96px_1fr] items-end gap-3">
                    <span className="text-sm font-bold text-slate-900">Signature :</span>
                    <div className="h-12 border-b border-slate-400">
                      {draft.signatureUrl ? <img src={draft.signatureUrl} alt="Signature" className="h-full object-contain" /> : null}
                    </div>
                    <span className="text-sm font-bold text-slate-900">Date :</span>
                    <span className="border-b border-slate-400 pb-1 text-sm font-black text-blue-800">{draft.date}</span>
                  </div>
                </div>

                <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
                  <p className="text-xl font-black text-blue-800">Note:</p>
                  <ul className="mt-3 space-y-2 text-xs font-semibold leading-5 text-slate-700">
                    <li>No file can be withdrawn.</li>
                    <li>{draft.notes || 'No refund are paid.'}</li>
                  </ul>
                </div>

                <div className="overflow-hidden rounded-xl border border-blue-300 bg-white">
                  {[
                    ['Account Amount', draft.totalAmount || draft.amount],
                    ['This Payment', draft.paidAmount || draft.amount],
                    ['Balance Due', balanceDue],
                  ].map(([label, value]) => (
                    <div key={label} className="grid grid-cols-[1fr_1.15fr] border-b border-blue-200 last:border-b-0">
                      <div className="bg-blue-50 px-4 py-3 text-sm font-black text-slate-900">{label}</div>
                      <div className="px-4 py-3 text-xl font-black text-blue-800">{draft.currency || 'BDT'} {Number(value).toLocaleString()}</div>
                    </div>
                  ))}
                </div>
              </section>

              <footer className="relative mt-5 text-center">
                <div className="mx-auto grid max-w-[760px] grid-cols-[1fr_auto_1fr] items-center gap-4">
                  <div className="h-1 rounded-full bg-gradient-to-r from-sky-500 via-emerald-500 to-lime-400" />
                  <p className="font-serif text-lg italic text-blue-800">Empowering Education, Enabling Excellence</p>
                  <div className="h-1 rounded-full bg-gradient-to-r from-red-500 via-pink-500 to-sky-500" />
                </div>
                <p className="mt-3 text-xs font-semibold text-slate-700">This payment receipt is generated and approved by Provatsoft Payment System Software.</p>
              </footer>
            </main>
          </div>
        </div>
      </PreviewShell>
    );
  }

  if (spec.key === 'premium-healthcare') {
    return (
      <PreviewShell className={`${spec.previewClass} rounded-[28px] p-4 font-sans`} watermarkUrl={watermarkUrl}>
        <div className={spec.shellClass}>
          <div className="rounded-2xl p-6 text-white" style={{ background: `linear-gradient(135deg, ${spec.accent}, ${spec.accent2})` }}>
            <div className="flex items-start justify-between gap-6">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-white/75">{spec.eyebrow}</p>
                <p className="mt-2 font-mono text-xs font-bold">{draft.receiptNumber}</p>
              </div>
              <Logo draft={draft} dark accent="#ffffff" />
            </div>
            <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_auto]">
              <div>
                <p className="text-xs text-white/80">Patient</p>
                <h2 className="mt-2 text-3xl font-black leading-tight">{draft.customerName}</h2>
                <p className="mt-3 text-sm italic text-white/80">{draft.paymentPurpose}</p>
              </div>
              <div className="rounded-2xl bg-white/20 p-5 text-right backdrop-blur">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/75">Amount</p>
                <p className="mt-2 text-5xl font-black leading-tight">{money(draft)}</p>
              </div>
            </div>
            <div className="mt-5"><ContactStrip draft={draft} dark /></div>
          </div>
          <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_160px]">
            <div className="space-y-5">
              <DetailGrid draft={draft} />
              <SignatureZone draft={draft} accent={spec.accent} />
            </div>
            <QrBlock qrCodeUrl={qrCodeUrl} label="Patient verify" />
          </div>
        </div>
      </PreviewShell>
    );
  }

  if (spec.key === 'neo-glass' || spec.key === 'ultra-modern') {
    return (
      <PreviewShell className={`${spec.previewClass} rounded-[28px] p-4 font-sans text-white`} watermarkUrl={watermarkUrl}>
        <div className={spec.shellClass}>
          <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
            <div className="rounded-2xl border border-white/15 bg-white/10 p-6 backdrop-blur-xl">
              <div className="flex items-start justify-between gap-6">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.24em] text-cyan-200">{spec.eyebrow}</p>
                  <p className="mt-2 font-mono text-xs text-slate-400">{draft.receiptNumber}</p>
                </div>
                <Logo draft={draft} dark accent={spec.accent} />
              </div>
              <h2 className="mt-8 text-5xl font-black leading-tight text-white">{money(draft)}</h2>
              <p className="mt-3 text-sm italic leading-6 text-slate-300">{draft.amountInWords}</p>
              <div className="mt-6"><ContactStrip draft={draft} dark /></div>
            </div>
            <div className="space-y-4">
              <CustomerPanel draft={draft} dark accent={spec.accent} />
              <QrBlock qrCodeUrl={qrCodeUrl} dark label="Chain verified" />
            </div>
          </div>
          <div className="mt-5 space-y-5">
            <DetailGrid draft={draft} dark />
            <SignatureZone draft={draft} dark accent={spec.accent} />
          </div>
        </div>
      </PreviewShell>
    );
  }

  return (
    <PreviewShell className={`${spec.previewClass} rounded-[28px] p-4 font-sans`} watermarkUrl={watermarkUrl}>
      <div className={spec.shellClass}>
        <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
          <div className="rounded-2xl p-5 text-white shadow-xl" style={{ background: `linear-gradient(135deg, ${spec.accent}, ${spec.accent2})` }}>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/75">Premium amount</p>
            <p className="mt-2 text-5xl font-black leading-tight">{money(draft)}</p>
            <p className="mt-2 text-sm italic text-white/80">{draft.amountInWords}</p>
          </div>
          <Logo draft={draft} dark={dark} accent={spec.accent} />
        </div>
        <div className="mt-8 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <CustomerPanel draft={draft} dark={dark} accent={spec.accent} />
          <DetailGrid draft={draft} />
        </div>
        <div className="mt-5"><ContactStrip draft={draft} dark={dark} /></div>
        <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_auto]">
          <SignatureZone draft={draft} accent={spec.accent} />
          <QrBlock qrCodeUrl={qrCodeUrl} />
        </div>
      </div>
    </PreviewShell>
  );
}
