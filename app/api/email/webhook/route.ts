import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdminClient';
import { withApiErrorHandler } from '@/lib/apiRouteWrapper';

async function handler(request: NextRequest) {
  const body = await request.json();
  // Example resend webhook payload contains: id, event ("delivered", "bounced"), to, subject
  const event = body.event || body.type || body.status;
  const resendId = body.id || body.messageId || body.resend_id;

  if (!resendId) return NextResponse.json({ ok: true });

  // Map events to status
  let status = 'sent';
  if (typeof event === 'string') {
    if (event.includes('delivered')) status = 'delivered';
    if (event.includes('bounced') || event.includes('failed') || event.includes('permanent')) status = 'failed';
  }

  // Try update by resend_id in metadata
  const { data: found } = await supabaseAdmin
    .from('email_logs')
    .select('id')
    .ilike('metadata', `%${resendId}%`)
    .limit(1);

  if (found?.length) {
    const id = found[0].id;
    await supabaseAdmin.from('email_logs').update({ status }).eq('id', id);
  }

  return NextResponse.json({ ok: true });
}

export const POST = withApiErrorHandler(handler, '/api/email/webhook');
