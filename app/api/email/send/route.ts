import { NextRequest, NextResponse } from 'next/server';
import { getServerUserId } from '@/lib/auth';
import { validateSubscriptionAction } from '@/lib/subscription';
import { enqueueEmail } from '@/lib/emailQueue';
import { sanitizeObject } from '@/lib/sanitize';
import { supabaseAdmin } from '@/lib/supabaseAdminClient';
import { checkRateLimit } from '@/lib/rateLimiter';
import { withApiErrorHandler } from '@/lib/apiRouteWrapper';

async function handler(request: NextRequest) {
  const userId = await getServerUserId(request);
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

    const body = await request.json();
    const recipientEmail = sanitizeObject({ recipientEmail: body.recipientEmail }).recipientEmail as string;
    const pdfUrl = sanitizeObject({ pdfUrl: body.pdfUrl }).pdfUrl as string;
    const fileName = sanitizeObject({ fileName: body.fileName }).fileName as string;
    const subject = sanitizeObject({ subject: body.subject }).subject as string;
    const metadata = sanitizeObject(body.metadata || {});

    if (!recipientEmail || !pdfUrl || !fileName) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const validation = await validateSubscriptionAction(userId, 'send_email');
    if (!validation.allowed) {
      return NextResponse.json({ error: validation.reason }, { status: 403 });
    }

    const rateLimit = await checkRateLimit(userId, request.url, validation.subscription?.plan as any);
    if (!rateLimit.allowed) {
      return NextResponse.json({ error: 'Rate limit exceeded. Try again later.' }, { status: 429 });
    }

    let receiptId = sanitizeObject({ receiptId: body.receiptId }).receiptId as string | undefined;
    if (!receiptId && body.receiptNumber) {
      const { data: existingReceipt } = await supabaseAdmin
        .from('receipts')
        .select('id')
        .eq('receipt_number', body.receiptNumber)
        .eq('vendor_id', userId)
        .single();
      receiptId = existingReceipt?.id || receiptId;
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

    const { data: insertData, error: insertErr } = await supabaseAdmin
      .from('email_logs')
      .insert([
        {
          vendor_id: userId,
          receipt_number: body.receiptNumber || null,
          receipt_id: receiptId || null,
          recipient_email: recipientEmail,
          subject: subject || `Payment Receipt`,
          status: 'pending',
          provider: 'resend',
          pdf_url: pdfUrl,
          metadata,
        },
      ])
      .select('*')
      .single();

    if (insertErr) {
      return NextResponse.json({ error: insertErr.message }, { status: 500 });
    }

    const item = await enqueueEmail({
      userId,
      recipientEmail,
      subject: subject || `Payment Receipt`,
      body: metadata,
      pdfUrl,
      fileName,
      receiptId: receiptId || null,
    });

    return NextResponse.json({
      queued: true,
      queue: item,
      log: insertData,
      queueId: item?.id || null,
      logId: insertData?.id || null,
    });
}

export const POST = withApiErrorHandler(handler, '/api/email/send');
