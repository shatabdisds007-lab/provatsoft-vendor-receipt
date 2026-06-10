import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <section className="mx-auto flex min-h-screen max-w-7xl flex-col justify-center px-6 py-12 lg:px-8">
        <div className="rounded-4xl border border-white/10 bg-slate-900/80 p-10 shadow-glow backdrop-blur-xl">
          <p className="text-sm uppercase tracking-[0.4em] text-sky-300">Receipt SaaS Platform</p>
          <h1 className="mt-6 text-5xl font-semibold tracking-tight text-white sm:text-6xl">
            Multi-template receipt generator for enterprise brands.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
            Build premium education, corporate, tuition and admission receipts with branded PDFs, email delivery, and admin/vendor workflows.
          </p>
          <div className="mt-10 flex flex-wrap gap-4">
            <Link href="/dashboard/vendor" className="rounded-2xl bg-sky-500 px-6 py-3 text-sm font-semibold text-white transition hover:bg-sky-400">
              Open Dashboard
            </Link>
            <Link href="/dashboard/vendor" className="rounded-2xl border border-slate-700 bg-slate-800 px-6 py-3 text-sm font-semibold text-slate-100 transition hover:bg-slate-700">
              Vendor Dashboard
            </Link>
            <Link href="/dashboard/admin" className="rounded-2xl border border-slate-700 bg-slate-800 px-6 py-3 text-sm font-semibold text-slate-100 transition hover:bg-slate-700">
              Admin Dashboard
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
