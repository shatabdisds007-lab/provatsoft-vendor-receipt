import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdminClient';
import { setSubscriptionPlan, setSubscriptionStatus, resetSubscriptionUsage, getSubscriptionByUserId, getSubscriptionStats, ensureSubscriptionForUser, SubscriptionPlan, SubscriptionStatus } from '@/lib/subscription';
import { isAdminUser, getServerUserId } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const isAdmin = await isAdminUser(request);
  if (!isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = await getServerUserId(request);
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const subscription = await ensureSubscriptionForUser(userId);
  if (!subscription) {
    return NextResponse.json({ error: 'Unable to resolve subscription' }, { status: 500 });
  }

  const stats = await getSubscriptionStats();
  const { data, error } = await supabaseAdmin.from('subscriptions').select('*').order('updated_at', { ascending: false });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ subscription, stats, subscriptions: data });
}

export async function PATCH(request: NextRequest) {
  const isAdmin = await isAdminUser(request);
  if (!isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const targetUserId = body.userId as string;
  const plan = body.plan as SubscriptionPlan | undefined;
  const status = body.status as SubscriptionStatus | undefined;
  const resetUsage = body.resetUsage as boolean | undefined;

  if (!targetUserId) {
    return NextResponse.json({ error: 'User ID is required.' }, { status: 400 });
  }

  let result;
  if (plan) {
    result = await setSubscriptionPlan(targetUserId, plan);
    if (result.error) {
      return NextResponse.json({ error: result.error.message }, { status: 500 });
    }
  }

  if (status) {
    result = await setSubscriptionStatus(targetUserId, status);
    if (result.error) {
      return NextResponse.json({ error: result.error.message }, { status: 500 });
    }
  }

  if (resetUsage) {
    result = await resetSubscriptionUsage(targetUserId);
    if (result.error) {
      return NextResponse.json({ error: result.error.message }, { status: 500 });
    }
  }

  const subscription = await getSubscriptionByUserId(targetUserId);
  return NextResponse.json({ subscription });
}
