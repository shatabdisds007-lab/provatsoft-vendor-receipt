import { NextRequest, NextResponse } from 'next/server';
import { getServerUserId, isAdminUser } from '@/lib/auth';
import { withApiErrorHandler } from '@/lib/apiRouteWrapper';
import { createReceipt, listReceipts } from '@/services/receiptService';
import { ReceiptDraft } from '@/types/receipt';

async function handler(request: NextRequest) {
  const userId = await getServerUserId(request);
  const isAdmin = await isAdminUser(request);
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (request.method === 'GET') {
    const url = new URL(request.url);
    const status = (url.searchParams.get('status') as any) || undefined;
    const receiptNumber = url.searchParams.get('receiptNumber') || undefined;
    const templateId = url.searchParams.get('templateId') || undefined;
    const latest = url.searchParams.get('latest') === 'true';

    const receipts = await listReceipts(userId, isAdmin, { status, receiptNumber, templateId, latest });
    const payload = latest ? { receipt: receipts[0] || null } : { receipts };
    return NextResponse.json(payload);
  }

  if (request.method === 'POST') {
    const body = await request.json();
    const receiptDraft = body as ReceiptDraft;
    const receipt = await createReceipt(userId, receiptDraft);
    return NextResponse.json({ receipt });
  }

  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}

export const GET = withApiErrorHandler(handler, '/api/receipts');
export const POST = withApiErrorHandler(handler, '/api/receipts');
