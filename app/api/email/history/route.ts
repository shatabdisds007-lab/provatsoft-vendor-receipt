import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdminClient';
import { getServerUserId } from '@/lib/auth';
import { withApiErrorHandler } from '@/lib/apiRouteWrapper';

async function handler(request: NextRequest) {
  const userId = await getServerUserId(request);
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data, error } = await supabaseAdmin
    .from('email_logs')
    .select('id, receipt_number, recipient_email, subject, status, pdf_url, sent_at, created_at, metadata')
    .eq('vendor_id', userId)
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ emails: data });
}

export const POST = withApiErrorHandler(handler, '/api/email/history');
