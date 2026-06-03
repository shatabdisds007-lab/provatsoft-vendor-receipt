import { supabaseAdmin } from '@/lib/supabaseAdminClient';
import { SubscriptionPlan } from '@/lib/subscription';
import { RateLimitError } from '@/lib/errors';

const RATE_LIMITS: Record<SubscriptionPlan, number | null> = {
  free: 10,
  pro: 60,
  enterprise: null,
};

const inMemoryStore = new Map<string, { count: number; expiresAt: number }>();

function getRouteKey(route: string) {
  try {
    const url = new URL(route);
    return url.pathname;
  } catch {
    return route.split('?')[0];
  }
}

function getWindowKey() {
  const now = new Date();
  now.setMilliseconds(0);
  now.setSeconds(0);
  return now.toISOString();
}

function cleanExpiredMemoryEntries() {
  const now = Date.now();
  for (const [key, value] of inMemoryStore.entries()) {
    if (value.expiresAt <= now) {
      inMemoryStore.delete(key);
    }
  }
}

async function incrementSupabaseCount(userId: string, routeKey: string, windowStart: string) {
  const { data, error } = await supabaseAdmin
    .from('rate_limits')
    .select('id,request_count')
    .eq('user_id', userId)
    .eq('route', routeKey)
    .eq('window_start', windowStart)
    .single();

  if (error && error.code !== 'PGRST116') {
    throw error;
  }

  if (!data) {
    const { data: inserted, error: insertError } = await supabaseAdmin.from('rate_limits').insert([
      {
        user_id: userId,
        route: routeKey,
        window_start: windowStart,
        request_count: 1,
      },
    ]).select('*').single();

    if (insertError) {
      throw insertError;
    }

    return { request_count: 1, id: inserted.id };
  }

  const { error: updateError } = await supabaseAdmin
    .from('rate_limits')
    .update({ request_count: data.request_count + 1, updated_at: new Date().toISOString() })
    .eq('id', data.id);

  if (updateError) {
    throw updateError;
  }

  return { request_count: data.request_count + 1, id: data.id };
}

export async function checkRateLimit(userId: string, route: string, plan: SubscriptionPlan) {
  const limit = RATE_LIMITS[plan];
  if (limit === null) {
    return { allowed: true, remaining: Infinity };
  }

  const routeKey = getRouteKey(route);
  const windowStart = getWindowKey();
  const storeKey = `${userId}:${routeKey}:${windowStart}`;

  try {
    const state = await incrementSupabaseCount(userId, routeKey, windowStart);
    if (state.request_count > limit) {
      return { allowed: false, remaining: 0 };
    }
    return { allowed: true, remaining: limit - state.request_count };
  } catch (error: any) {
    cleanExpiredMemoryEntries();
    const existing = inMemoryStore.get(storeKey);
    const now = Date.now();

    if (!existing || existing.expiresAt <= now) {
      inMemoryStore.set(storeKey, { count: 1, expiresAt: now + 61_000 });
      return { allowed: true, remaining: limit - 1 };
    }

    const nextCount = existing.count + 1;
    inMemoryStore.set(storeKey, { count: nextCount, expiresAt: existing.expiresAt });

    if (nextCount > limit) {
      return { allowed: false, remaining: 0 };
    }

    return { allowed: true, remaining: limit - nextCount };
  }
}

export function enforceRateLimit(userId: string, route: string, plan: SubscriptionPlan) {
  return checkRateLimit(userId, route, plan).then((result) => {
    if (!result.allowed) {
      throw new RateLimitError('Rate limit exceeded');
    }
    return result;
  });
}
