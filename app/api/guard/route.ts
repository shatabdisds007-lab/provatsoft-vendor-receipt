import { NextRequest, NextResponse } from 'next/server';
import { getServerUserId } from '@/lib/auth';
import { ensureSubscriptionForUser, validateSubscriptionAction } from '@/lib/subscription';
import { withApiErrorHandler } from '@/lib/apiRouteWrapper';

async function handlerGet(request: NextRequest) {
  const userId = await getServerUserId(request);
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const subscription = await ensureSubscriptionForUser(userId);
  if (!subscription) {
    return NextResponse.json({ error: 'Subscription not found' }, { status: 404 });
  }

  return NextResponse.json({ subscription });
}

async function handler(request: NextRequest) {
  const userId = await getServerUserId(request);
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const action = body.action as 'generate_pdf' | 'send_email' | 'batch_generate';
  const templateSlug = body.templateSlug as string | undefined;

  if (!action) {
    return NextResponse.json({ error: 'Action is required.' }, { status: 400 });
  }

  const validation = await validateSubscriptionAction(userId, action, templateSlug);
  return NextResponse.json(validation);
}

export const GET = withApiErrorHandler(handlerGet, '/api/guard');
export const POST = withApiErrorHandler(handler, '/api/guard');
