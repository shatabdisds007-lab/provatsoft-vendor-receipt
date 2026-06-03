import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdminClient';
import { isAdminUser } from '@/lib/auth';
import { withApiErrorHandler } from '@/lib/apiRouteWrapper';

async function handler(request: NextRequest) {
  const isAdmin = await isAdminUser(request);
  if (!isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const [{ count: errorCount }, { data: pendingMail }, { data: sentMail }, { data: failedMail }] = await Promise.all([
    supabaseAdmin.from('system_error_logs').select('id', { count: 'exact' }).gte('created_at', since),
    supabaseAdmin.from('email_queue').select('id').eq('status', 'pending'),
    supabaseAdmin.from('email_queue').select('id').eq('status', 'sent'),
    supabaseAdmin.from('email_queue').select('id').eq('status', 'failed'),
  ]);

  return NextResponse.json({
    errorCount: errorCount || 0,
    emailQueue: {
      pending: pendingMail?.length || 0,
      sent: sentMail?.length || 0,
      failed: failedMail?.length || 0,
    },
    emailSuccessRate:
      pendingMail && sentMail && failedMail ? Math.round((sentMail.length / Math.max(1, sentMail.length + failedMail.length)) * 100) : 0,
    latency: { estimateMs: 100 },
  });
}

export const GET = withApiErrorHandler(handler, '/api/admin/system-metrics');
