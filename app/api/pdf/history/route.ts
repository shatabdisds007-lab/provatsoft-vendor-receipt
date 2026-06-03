import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdminClient';
import { getServerUserId } from '@/lib/auth';
import { withApiErrorHandler } from '@/lib/apiRouteWrapper';

async function handler(request: NextRequest) {
  const userId = await getServerUserId(request);
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const url = new URL(request.url);
  const receiptNumberFromQuery = url.searchParams.get('receiptNumber') || null;
  let receiptNumber = receiptNumberFromQuery;

  if (request.method === 'POST') {
    const body = await request.json().catch(() => ({}));
    receiptNumber = receiptNumber || (body?.receiptNumber as string | null) || null;
  }

  const query = supabaseAdmin
    .from('receipts')
    .select('id, receipt_number, template_id, status, created_at, updated_at, amount, currency, company_data, customer_data, payment_data, additional_data, pdf_id')
    .eq('vendor_id', userId)
    .order('created_at', { ascending: false });

  if (receiptNumber) {
    query.eq('receipt_number', receiptNumber);
  }

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const receipts = data || [];
  const pdfIds = receipts.filter((receipt: any) => receipt.pdf_id).map((receipt: any) => receipt.pdf_id);
  const pdfs = pdfIds.length > 0 ? await supabaseAdmin.from('receipt_pdfs').select('id, pdf_url').in('id', pdfIds) : { data: [] };
  const pdfUrlMap = (pdfs.data || []).reduce((acc: Record<string, string>, row: any) => {
    if (row.id && row.pdf_url) acc[row.id] = row.pdf_url;
    return acc;
  }, {} as Record<string, string>);

  const formatted = receipts.map((receipt: any) => ({
    ...receipt,
    pdf_url: receipt.pdf_id ? pdfUrlMap[receipt.pdf_id] || null : null,
  }));

  return NextResponse.json({ receipts: formatted, data: formatted, fileUrl: formatted[0]?.pdf_url || null });
}

export const GET = withApiErrorHandler(handler, '/api/pdf/history');
export const POST = withApiErrorHandler(handler, '/api/pdf/history');
