import { NextRequest, NextResponse } from 'next/server';
import { isAdminUser } from '@/lib/auth';
import { processEmailQueue } from '@/lib/emailQueue';
import { withApiErrorHandler } from '@/lib/apiRouteWrapper';

async function handler(request: NextRequest) {
  const isAdmin = await isAdminUser(request);
  if (!isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const results = await processEmailQueue(20);
  return NextResponse.json({ results });
}

export const POST = withApiErrorHandler(handler, '/api/email/process-queue');
