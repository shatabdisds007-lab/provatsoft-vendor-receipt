import { supabaseAdmin } from '@/lib/supabaseAdminClient';
import type { ReceiptTemplateId } from '@/data/templates';

export type SubscriptionPlan = 'free' | 'pro' | 'enterprise';
export type SubscriptionStatus = 'active' | 'canceled' | 'banned';

export type SubscriptionRow = {
  id: string;
  user_id: string;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  current_usage: number;
  usage_limit: number | null;
  reset_date: string;
  plan_id: string | null;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  created_at: string;
  updated_at: string;
};

const FREE_TEMPLATE_SLUGS: ReceiptTemplateId[] = ['education-branch', 'corporate-blue', 'minimal-modern'];

const PLAN_CONFIGS: Record<SubscriptionPlan, { usageLimit: number | null; canEmail: boolean; isUnlimited: boolean; planId: string }> = {
  free: {
    usageLimit: 10,
    canEmail: false,
    isUnlimited: false,
    planId: 'free_monthly',
  },
  pro: {
    usageLimit: 500,
    canEmail: true,
    isUnlimited: false,
    planId: 'pro_monthly',
  },
  enterprise: {
    usageLimit: null,
    canEmail: true,
    isUnlimited: true,
    planId: 'enterprise_unlimited',
  },
};

function isDevelopmentTestUser(userId: string) {
  return process.env.NODE_ENV === 'development' && (userId.startsWith('dev-') || userId === '00000000-0000-4000-8000-000000000001');
}

function getNextResetDate() {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
}

function formatResetDate(dateValue: string | Date) {
  const date = typeof dateValue === 'string' ? new Date(dateValue) : dateValue;
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())).toISOString().slice(0, 10);
}

export async function getSubscriptionByUserId(userId: string) {
  const { data, error } = await supabaseAdmin.from('subscriptions').select('*').eq('user_id', userId).single();
  if (error) return null;
  return data as SubscriptionRow;
}

export async function createDefaultSubscription(userId: string) {
  const { data, error } = await supabaseAdmin
    .from('subscriptions')
    .insert([
      {
        user_id: userId,
        plan: 'free',
        status: 'active',
        current_usage: 0,
        usage_limit: PLAN_CONFIGS.free.usageLimit,
        reset_date: formatResetDate(getNextResetDate()),
        plan_id: PLAN_CONFIGS.free.planId,
      },
    ])
    .select('*')
    .single();

  if (error) {
    return null;
  }

  return data as SubscriptionRow;
}

export async function ensureSubscriptionForUser(userId: string) {
  let subscription = await getSubscriptionByUserId(userId);
  if (!subscription) {
    subscription = await createDefaultSubscription(userId);
  }

  if (!subscription) {
    return null;
  }

  const resetDate = new Date(subscription.reset_date);
  const now = new Date();
  if (resetDate <= now) {
    const nextReset = formatResetDate(getNextResetDate());
    const { data, error } = await supabaseAdmin
      .from('subscriptions')
      .update({ current_usage: 0, reset_date: nextReset, updated_at: new Date().toISOString() })
      .eq('user_id', userId)
      .select('*')
      .single();

    if (!error && data) {
      subscription = data as SubscriptionRow;
    }
  }

  return subscription;
}

export function hasTemplateAccess(plan: SubscriptionPlan, templateSlug: string) {
  if (plan === 'free') {
    return FREE_TEMPLATE_SLUGS.includes(templateSlug as ReceiptTemplateId);
  }
  return true;
}

export function canSendEmail(plan: SubscriptionPlan) {
  return plan !== 'free';
}

export function getPlanConfig(plan: SubscriptionPlan) {
  return PLAN_CONFIGS[plan];
}

export function isUnlimitedPlan(plan: SubscriptionPlan) {
  return PLAN_CONFIGS[plan].isUnlimited;
}

export async function validateSubscriptionAction(
  userId: string,
  action: 'generate_pdf' | 'send_email' | 'batch_generate',
  templateSlug?: string,
) {
  if (isDevelopmentTestUser(userId)) {
    return {
      allowed: true,
      subscription: {
        id: 'dev-subscription',
        user_id: userId,
        plan: 'enterprise',
        status: 'active',
        current_usage: 0,
        usage_limit: null,
        reset_date: formatResetDate(getNextResetDate()),
        plan_id: PLAN_CONFIGS.enterprise.planId,
        stripe_customer_id: null,
        stripe_subscription_id: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as SubscriptionRow,
    };
  }

  const subscription = await ensureSubscriptionForUser(userId);
  if (!subscription) {
    return { allowed: false, reason: 'Unable to resolve subscription' };
  }

  if (subscription.status === 'canceled') {
    return { allowed: false, reason: 'Subscription canceled. Please reactivate your plan.' };
  }

  if (subscription.status === 'banned') {
    return { allowed: false, reason: 'User is banned. Contact support for access.' };
  }

  if (action === 'generate_pdf' || action === 'batch_generate') {
    if (templateSlug && !hasTemplateAccess(subscription.plan, templateSlug)) {
      return {
        allowed: false,
        reason: 'Your current plan does not include access to that template. Upgrade to unlock all templates.',
      };
    }

    if (!isUnlimitedPlan(subscription.plan) && subscription.usage_limit !== null && subscription.current_usage >= subscription.usage_limit) {
      return { allowed: false, reason: 'Receipt limit exceeded. Upgrade or wait for your monthly limit to reset.' };
    }
  }

  if (action === 'send_email') {
    if (!canSendEmail(subscription.plan)) {
      return { allowed: false, reason: 'Email delivery is only available on Pro and Enterprise plans.' };
    }
  }

  return { allowed: true, subscription };
}

export async function incrementSubscriptionUsage(userId: string) {
  if (isDevelopmentTestUser(userId)) {
    return { subscription: null, error: null };
  }

  const subscription = await ensureSubscriptionForUser(userId);
  if (!subscription) {
    return { error: new Error('Unable to resolve subscription') };
  }

  if (!isUnlimitedPlan(subscription.plan) && subscription.usage_limit !== null && subscription.current_usage >= subscription.usage_limit) {
    return { error: new Error('Usage limit reached') };
  }

  const { data, error } = await supabaseAdmin
    .from('subscriptions')
    .update({ current_usage: subscription.current_usage + 1, updated_at: new Date().toISOString() })
    .eq('user_id', userId)
    .select('*')
    .single();

  return { subscription: data as SubscriptionRow | null, error };
}

export async function resetSubscriptionUsage(userId: string) {
  const nextReset = formatResetDate(getNextResetDate());
  const { data, error } = await supabaseAdmin
    .from('subscriptions')
    .update({ current_usage: 0, reset_date: nextReset, updated_at: new Date().toISOString() })
    .eq('user_id', userId)
    .select('*')
    .single();

  return { subscription: data as SubscriptionRow | null, error };
}

export async function setSubscriptionPlan(userId: string, plan: SubscriptionPlan) {
  const config = PLAN_CONFIGS[plan];
  const nextReset = formatResetDate(getNextResetDate());

  const { data, error } = await supabaseAdmin
    .from('subscriptions')
    .upsert(
      {
        user_id: userId,
        plan,
        status: 'active',
        usage_limit: config.usageLimit,
        reset_date: nextReset,
        plan_id: config.planId,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' },
    )
    .select('*')
    .single();

  return { subscription: data as SubscriptionRow | null, error };
}

export async function setSubscriptionStatus(userId: string, status: SubscriptionStatus) {
  const { data, error } = await supabaseAdmin
    .from('subscriptions')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('user_id', userId)
    .select('*')
    .single();

  return { subscription: data as SubscriptionRow | null, error };
}

export async function getSubscriptionStats() {
  const { data, error } = await supabaseAdmin.from('subscriptions').select('*');
  if (error || !data) {
    return null;
  }

  const rows = data as SubscriptionRow[];
  const counts = rows.reduce(
    (acc, row) => {
      acc.total += 1;
      acc[`${row.plan}_count` as 'free_count' | 'pro_count' | 'enterprise_count'] += 1;
      acc[`${row.status}_count` as 'active_count' | 'canceled_count' | 'banned_count'] += 1;
      acc.total_usage += row.current_usage;
      if (row.usage_limit) acc.total_limit += row.usage_limit;
      return acc;
    },
    {
      total: 0,
      free_count: 0,
      pro_count: 0,
      enterprise_count: 0,
      active_count: 0,
      canceled_count: 0,
      banned_count: 0,
      total_usage: 0,
      total_limit: 0,
    },
  );

  return counts;
}
