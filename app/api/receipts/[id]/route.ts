import { NextRequest, NextResponse } from 'next/server';
import { getServerUserId, isAdminUser } from '@/lib/auth';
import { withApiErrorHandler } from '@/lib/apiRouteWrapper';
import { deleteDraftReceipt, getReceiptById, updateReceipt } from '@/services/receiptService';
import { ReceiptDraft } from '@/types/receipt';

async function handler(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getServerUserId(request);
  const isAdmin = await isAdminUser(request);
  const { id: receiptId } = await params;

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (request.method === 'GET') {
    const receipt = await getReceiptById(userId, isAdmin, receiptId);
    if (!receipt) {
      return NextResponse.json({ error: 'Receipt not found' }, { status: 404 });
    }
    return NextResponse.json({ receipt });
  }

  if (request.method === 'PUT') {
    const body = await request.json();
    const draft = body as ReceiptDraft;
    const receipt = await updateReceipt(userId, isAdmin, receiptId, draft);
    return NextResponse.json({ receipt });
  }

  if (request.method === 'DELETE') {
    await deleteDraftReceipt(userId, isAdmin, receiptId);
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}

export const GET = withApiErrorHandler(handler, '/api/receipts/[id]');
export const PUT = withApiErrorHandler(handler, '/api/receipts/[id]');
export const DELETE = withApiErrorHandler(handler, '/api/receipts/[id]');
