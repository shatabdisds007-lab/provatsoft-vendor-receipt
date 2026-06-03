import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdminClient';
import { withApiErrorHandler } from '@/lib/apiRouteWrapper';

async function handler() {
  const { data, error } = await supabaseAdmin.rpc('next_receipt_number');

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const receiptNumber = `PS-2026-${String(data).padStart(6, '0')}`;
  return NextResponse.json({ receiptNumber });
}

export const GET = withApiErrorHandler(handler, '/api/receipt-number');
