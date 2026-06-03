'use client';

type UpgradeModalProps = {
  open: boolean;
  onClose: () => void;
  currentPlan: string;
};

const PLANS = [
  {
    id: 'free',
    name: 'Free',
    price: 'Free',
    description: 'Get started with 10 monthly receipts, 3 templates and watermark support.',
    highlights: ['10 receipts / month', '3 template selection', 'Watermarked PDFs', 'Email disabled'],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '$29 / month',
    description: 'More templates, email delivery and a big increase in monthly receipt volume.',
    highlights: ['500 receipts / month', 'All templates', 'Email enabled', 'Optional watermark'],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 'Custom',
    description: 'Unlimited receipts, white-label support and priority generation for teams.',
    highlights: ['Unlimited receipts', 'Priority generation', 'White-label support', 'Dedicated onboarding'],
  },
];

export default function UpgradeModal({ open, onClose, currentPlan }: UpgradeModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/70 px-4 py-6">
      <div className="w-full max-w-4xl rounded-3xl border border-white/10 bg-slate-900 p-6 shadow-2xl backdrop-blur-xl sm:p-8">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.35em] text-sky-300">Upgrade plan</p>
            <h2 className="mt-2 text-3xl font-semibold text-white">Choose your next subscription tier</h2>
          </div>
          <button onClick={onClose} className="rounded-2xl border border-slate-700 bg-slate-800 px-4 py-2 text-sm text-slate-200 hover:bg-slate-700">
            Close
          </button>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {PLANS.map((plan) => (
            <div key={plan.id} className={`rounded-3xl border p-6 ${plan.id === currentPlan ? 'border-sky-500 bg-slate-950' : 'border-slate-800 bg-slate-900'}`}>
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <p className="text-lg font-semibold text-white">{plan.name}</p>
                  <p className="text-sm text-slate-400">{plan.description}</p>
                </div>
                {plan.id === currentPlan ? (
                  <span className="rounded-full bg-sky-500 px-3 py-1 text-xs font-semibold uppercase text-black">Current</span>
                ) : null}
              </div>
              <div className="mb-6 text-3xl font-semibold text-white">{plan.price}</div>
              <ul className="space-y-2 text-sm text-slate-300">
                {plan.highlights.map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="mt-1 h-2.5 w-2.5 rounded-full bg-sky-500" />
                    {item}
                  </li>
                ))}
              </ul>
              <button
                type="button"
                className="mt-8 w-full rounded-2xl bg-slate-800 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-700"
              >
                Contact sales
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
