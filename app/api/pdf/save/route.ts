import { NextRequest, NextResponse } from 'next/server';
import { getServerUserId } from '@/lib/auth';
import { incrementSubscriptionUsage, validateSubscriptionAction } from '@/lib/subscription';
import { checkRateLimit } from '@/lib/rateLimiter';
import { withApiErrorHandler } from '@/lib/apiRouteWrapper';
import { uploadFileToPath } from '../../../../services/storage.service';
import { supabaseAdmin } from '@/lib/supabaseAdminClient';
import { assignReceiptPdf } from '@/services/receiptService';

async function handler(request: NextRequest) {
  const userId = await getServerUserId(request);
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { pdfBase64, receiptNumber, fileName, metadata, receiptId } = body;
  const templateSlug = metadata?.templateSlug;

  if (!pdfBase64 || !receiptNumber || !fileName || !templateSlug) {
    return NextResponse.json({ error: 'Missing required fields or template selection.' }, { status: 400 });
  }

  if (receiptId) {
    const { data: receiptRecord, error: receiptError } = await supabaseAdmin
      .from('receipts')
      .select('id')
      .eq('id', receiptId)
      .eq('vendor_id', userId)
      .single();
    if (receiptError || !receiptRecord) {
      return NextResponse.json({ error: 'Receipt not found or unauthorized' }, { status: 403 });
    }
  }

  const validation = await validateSubscriptionAction(userId, 'generate_pdf', templateSlug);
  if (!validation.allowed) {
    return NextResponse.json({ error: validation.reason }, { status: 403 });
  }

  const rateLimit = await checkRateLimit(userId, request.url, validation.subscription?.plan as any);
  if (!rateLimit.allowed) {
    return NextResponse.json({ error: 'Rate limit exceeded. Try again later.' }, { status: 429 });
  }

  const buffer = Buffer.from(pdfBase64.replace(/^data:application\/pdf;base64,/, ''), 'base64');
  const filePath = `receipts/${userId}/${fileName}`;

  const uploadResult = await uploadFileToPath('receipts', filePath, buffer);
  const publicUrl = uploadResult.publicUrl;

  const { data: insertData, error: insertError } = await supabaseAdmin
    .from('receipt_pdfs')
    .insert([
      {
        receipt_number: receiptNumber,
        vendor_id: userId,
        pdf_url: publicUrl,
        file_name: fileName,
        metadata: metadata || {},
        receipt_id: receiptId || null,
      },
    ])
    .select('*')
    .single();

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  const pdfRecord = insertData;
  if (receiptId && pdfRecord?.id) {
    await assignReceiptPdf(userId, false, receiptId, pdfRecord.id);
  }

  const { error: usageError } = await incrementSubscriptionUsage(userId);
  if (usageError) {
    return NextResponse.json({ error: usageError.message }, { status: 500 });
  }

  return NextResponse.json({
    fileUrl: publicUrl,
    pdfUrl: publicUrl,
    receiptId: receiptId || null,
    pdfId: pdfRecord?.id || null,
    record: pdfRecord,
  });
}

export const POST = withApiErrorHandler(handler, '/api/pdf/save');
