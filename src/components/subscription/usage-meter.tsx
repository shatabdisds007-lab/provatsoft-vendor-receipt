'use client';

import { useEffect, useState } from 'react';
import UpgradeModal from '@/components/subscription/upgrade-modal';
import { supabase } from '@/lib/supabaseClient';

type SubscriptionResponse = {
  subscription: {
    plan: string;
    status: string;
    current_usage: number;
    usage_limit: number | null;
    reset_date: string;
    plan_id: string | null;
    stripe_customer_id: string | null;
    stripe_subscription_id: string | null;
  };
};

export default function UsageMeter() {
  const [subscription, setSubscription] = useState<SubscriptionResponse['subscription'] | null>(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadSubscription() {
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const token = sessionData?.session?.access_token;
        const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};

        const response = await fetch('/api/guard', { headers });
        const data = await response.json();
        if (data.error) {
          setError(data.error);
          return;
        }

        setSubscription(data.subscription);
      } catch (err) {
        setError('Unable to load subscription status.');
      } finally {
        setLoading(false);
      }
    }

    loadSubscription();
  }, []);

  if (loading) {
    return (
      <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5">
        <div className="saaS-skeleton h-4 w-32" />
        <div className="saaS-skeleton h-8 w-48" />
        <div className="saaS-skeleton h-3 w-full rounded-full" />
      </div>
    );
  }

  if (!subscription) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-700">
        {error || 'No subscription data available.'}
      </div>
    );
  }

  const usageLimit = subscription.usage_limit ?? (subscription.current_usage || 0);
  const usagePercent = subscription.usage_limit ? Math.min((subscription.current_usage / usageLimit) * 100, 100) : 100;
  const limitLabel = subscription.usage_limit === null ? 'unlimited' : subscription.usage_limit;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 text-slate-950">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500">Subscription</p>
          <div className="mt-2 flex items-center gap-3">
            <span className="rounded-full bg-blue-50 px-3 py-1 text-sm font-semibold text-blue-700">
              {subscription.plan}
            </span>
            <span className="text-sm text-slate-500">{subscription.status}</span>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setShowModal(true)}
          className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
        >
          Upgrade plan
        </button>
      </div>

      <div className="mt-6 space-y-4">
        <div className="flex items-center justify-between text-sm text-slate-500">
          <span>Receipts used</span>
          <span>
            {subscription.current_usage} / {limitLabel}
          </span>
        </div>
        <div className="h-3 overflow-hidden rounded-full bg-slate-100">
          <div className="h-full rounded-full bg-blue-600 transition-all" style={{ width: `${usagePercent}%` }} />
        </div>
        <div className="text-sm text-slate-500">
          Reset date: <span className="text-slate-800">{subscription.reset_date}</span>
        </div>
      </div>

      <UpgradeModal open={showModal} onClose={() => setShowModal(false)} currentPlan={subscription.plan} />
    </div>
  );
}
