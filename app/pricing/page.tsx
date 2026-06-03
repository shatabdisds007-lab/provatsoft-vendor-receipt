export default function PricingPage() {
  return (
    <main className="min-h-screen bg-slate-950 px-6 py-16 text-slate-100">
      <div className="mx-auto max-w-7xl space-y-10">
        <section className="rounded-[2rem] border border-white/10 bg-slate-900/80 p-10 shadow-glow backdrop-blur-xl">
          <div className="max-w-3xl space-y-4">
            <p className="text-sm uppercase tracking-[0.35em] text-sky-300">Subscription plans</p>
            <h1 className="text-5xl font-semibold text-white">Choose the best SaaS plan for your receipt workflow</h1>
            <p className="text-lg text-slate-400">
              Start with free receipts and unlock custom templates, email delivery, higher monthly usage, and enterprise white-label support.
            </p>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-3">
          <div className="rounded-[2rem] border border-slate-800 bg-slate-950/90 p-8">
            <div className="mb-5 space-y-3">
              <p className="text-sm uppercase tracking-[0.35em] text-emerald-300">Free</p>
              <h2 className="text-3xl font-semibold text-white">Free Plan</h2>
              <p className="text-slate-400">Perfect for solo vendors who want to try core receipt generation.</p>
            </div>
            <div className="space-y-4 border-t border-slate-800 pt-5 text-sm text-slate-300">
              <p>10 receipts / month</p>
              <p>3 professional templates</p>
              <p>Watermark enabled</p>
              <p>Email delivery disabled</p>
            </div>
          </div>
          <div className="rounded-[2rem] border border-sky-500 bg-slate-950/95 p-8 shadow-xl">
            <div className="mb-5 space-y-3">
              <p className="text-sm uppercase tracking-[0.35em] text-sky-300">Pro</p>
              <h2 className="text-3xl font-semibold text-white">Pro Plan</h2>
              <p className="text-slate-400">For growing vendors who need full template access and email automation.</p>
            </div>
            <div className="space-y-4 border-t border-slate-800 pt-5 text-sm text-slate-300">
              <p>500 receipts / month</p>
              <p>All templates unlocked</p>
              <p>Email delivery enabled</p>
              <p>Optional watermark</p>
            </div>
          </div>
          <div className="rounded-[2rem] border border-slate-800 bg-slate-950/90 p-8">
            <div className="mb-5 space-y-3">
              <p className="text-sm uppercase tracking-[0.35em] text-slate-300">Enterprise</p>
              <h2 className="text-3xl font-semibold text-white">Enterprise Plan</h2>
              <p className="text-slate-400">Unlimited receipts, priority generation, and white-label experience.</p>
            </div>
            <div className="space-y-4 border-t border-slate-800 pt-5 text-sm text-slate-300">
              <p>Unlimited receipts</p>
              <p>Full platform access</p>
              <p>Priority generation</p>
              <p>White-label support</p>
            </div>
          </div>
        </section>

        <section className="rounded-[2rem] border border-slate-800 bg-slate-950/90 p-8">
          <h2 className="text-3xl font-semibold text-white">Payment-ready subscription schema</h2>
          <p className="mt-4 text-slate-400">The platform is prepared for Stripe-ready billing with plan IDs and customer/subscription identifiers in the database.</p>
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-4">
              <p className="text-sm uppercase tracking-[0.35em] text-slate-400">Stripe fields</p>
              <ul className="mt-4 space-y-2 text-sm text-slate-200">
                <li>plan_id</li>
                <li>stripe_customer_id</li>
                <li>stripe_subscription_id</li>
              </ul>
            </div>
            <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-4">
              <p className="text-sm uppercase tracking-[0.35em] text-slate-400">Plan readiness</p>
              <ul className="mt-4 space-y-2 text-sm text-slate-200">
                <li>usage limits enforced</li>
                <li>email delivery gated</li>
                <li>template access gating</li>
              </ul>
            </div>
            <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-4">
              <p className="text-sm uppercase tracking-[0.35em] text-slate-400">Admin controls</p>
              <ul className="mt-4 space-y-2 text-sm text-slate-200">
                <li>plan change</li>
                <li>usage reset</li>
                <li>ban/unban users</li>
              </ul>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
