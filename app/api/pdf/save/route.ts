import { NextRequest, NextResponse } from 'next/server';
export const runtime = 'nodejs';
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

  console.log('[api/pdf/save] uploading file to storage', { filePath, fileName, length: buffer.length });
  let publicUrl: string | null = null;
  try {
    const uploadResult = await uploadFileToPath('receipts', filePath, buffer);
    publicUrl = uploadResult.publicUrl;
  } catch (error: any) {
    console.warn('[api/pdf/save] storage upload failed, falling back to local-only save', { error: error?.message || error });
    return NextResponse.json({
      fileUrl: null,
      pdfUrl: null,
      receiptId: receiptId || null,
      pdfId: null,
      record: null,
      fallback: true,
      message: 'Supabase storage unavailable. PDF generated locally only.',
    });
  }

  let pdfRecord: any = null;
  try {
    const result = await supabaseAdmin
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

    if (result.error) {
      throw result.error;
    }
    pdfRecord = result.data;
  } catch (error: any) {
    console.warn('[api/pdf/save] receipt_pdfs insert failed, preserving fileUrl when possible', { error: error?.message || error });
    return NextResponse.json({
      fileUrl: publicUrl,
      pdfUrl: publicUrl,
      receiptId: receiptId || null,
      pdfId: null,
      record: null,
      fallback: true,
      message: 'PDF uploaded but metadata save failed. Local use still available.',
    });
  }

  try {
    const { error: usageError } = await incrementSubscriptionUsage(userId);
    if (usageError) {
      console.warn('[api/pdf/save] subscription usage increment failed', { error: usageError.message });
    }
  } catch (error: any) {
    console.warn('[api/pdf/save] subscription usage increment threw error', { error: error?.message || error });
  }

  if (receiptId && pdfRecord?.id) {
    try {
      await assignReceiptPdf(userId, false, receiptId, pdfRecord.id);
    } catch (error: any) {
      console.warn('[api/pdf/save] assignReceiptPdf failed', { error: error?.message || error });
    }
  }

  return NextResponse.json({
    fileUrl: publicUrl,
    pdfUrl: publicUrl,
    receiptId: receiptId || null,
    pdfId: pdfRecord?.id || null,
    record: pdfRecord,
    fallback: false,
  });
}

export const POST = withApiErrorHandler(handler, '/api/pdf/save');
