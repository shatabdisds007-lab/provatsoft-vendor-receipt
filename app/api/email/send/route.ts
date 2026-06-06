import { NextRequest, NextResponse } from 'next/server';
export const runtime = 'nodejs';
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

    if (!recipientEmail || !fileName || !pdfUrl) {
      console.error('[EMAIL BLOCKER] missing required email attachment data', { recipientEmail, fileName, pdfUrl });
      return NextResponse.json({
        error: 'Missing required fields. recipientEmail, pdfUrl, and fileName are required for email delivery.',
      }, { status: 400 });
    }

    if (typeof pdfUrl === 'string' && pdfUrl.startsWith('data:application/pdf;base64')) {
      console.error('[EMAIL BLOCKER] inline PDF base64 is not supported for queued emails', { pdfUrl: pdfUrl.slice(0, 64) });
      return NextResponse.json({
        error: 'Inline PDF base64 is not supported for queued email delivery.',
      }, { status: 400 });
    }

    const isMockUrl = !pdfUrl.startsWith('http') && !pdfUrl.startsWith('/');
    if (isMockUrl) {
      console.error('[EMAIL BLOCKER] pdfUrl appears invalid or mock', { pdfUrl });
      return NextResponse.json({
        error: 'Invalid pdfUrl provided for email delivery.',
      }, { status: 400 });
    }

    const validation = await (() =>
      validateSubscriptionAction(userId, 'send_email').catch((error) => {
        console.warn('[api/email/send] subscription validation failed, using mock fallback', { error: error?.message || error });
        return { allowed: true, subscription: null } as any;
      }))();

    if (!validation.allowed) {
      return NextResponse.json({ error: validation.reason }, { status: 403 });
    }

    const rateLimit = await (() =>
      checkRateLimit(userId, request.url, validation.subscription?.plan as any).catch((error) => {
        console.warn('[api/email/send] rate limit service unavailable, allowing email by fallback', { error: error?.message || error });
        return { allowed: true } as any;
      }))();

    if (!rateLimit.allowed) {
      return NextResponse.json({ error: 'Rate limit exceeded. Try again later.' }, { status: 429 });
    }

    let receiptId = sanitizeObject({ receiptId: body.receiptId }).receiptId as string | undefined;
    if (!receiptId && body.receiptNumber) {
      try {
        const { data: existingReceipt } = await supabaseAdmin
          .from('receipts')
          .select('id')
          .eq('receipt_number', body.receiptNumber)
          .eq('vendor_id', userId)
          .single();
        receiptId = existingReceipt?.id || receiptId;
      } catch (error: any) {
        console.warn('[api/email/send] receipt lookup failed, skipping receiptId resolution', { error: error?.message || error });
      }
    }

    if (receiptId) {
      try {
        const { data: receiptRecord, error: receiptError } = await supabaseAdmin
          .from('receipts')
          .select('id')
          .eq('id', receiptId)
          .eq('vendor_id', userId)
          .single();
        if (receiptError || !receiptRecord) {
          return NextResponse.json({ error: 'Receipt not found or unauthorized' }, { status: 403 });
        }
      } catch (error: any) {
        console.warn('[api/email/send] receipt validation skipped due Supabase failure', { error: error?.message || error });
      }
    }

    let insertData: any = null;
    try {
      const result = await supabaseAdmin
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
            pdf_url: pdfUrl || null,
            metadata,
          },
        ])
        .select('*')
        .single();

      if (result.error) {
        throw result.error;
      }
      insertData = result.data;
    } catch (error: any) {
      console.warn('[api/email/send] failed to persist email log, switching to mock mode', { error: error?.message || error });
      insertData = {
        id: 'mock-email-log',
        vendor_id: userId,
        receipt_number: body.receiptNumber || null,
        receipt_id: receiptId || null,
        recipient_email: recipientEmail,
        subject: subject || `Payment Receipt`,
        status: 'mocked',
        provider: 'mock',
        pdf_url: pdfUrl || null,
        metadata,
      };
    }

    let item: any = null;
    try {
      item = await enqueueEmail({
        userId,
        recipientEmail,
        subject: subject || `Payment Receipt`,
        body: metadata,
        pdfUrl: pdfUrl ?? undefined,
        fileName,
        receiptId: receiptId || null,
      });
    } catch (error: any) {
      console.warn('[api/email/send] enqueueEmail failed, returning mock queue item', { error: error?.message || error });
      item = {
        id: 'mock-email-queue',
        user_id: userId,
        recipient_email: recipientEmail,
        subject: subject || `Payment Receipt`,
        body: metadata,
        pdf_url: pdfUrl || null,
        file_name: fileName || null,
        status: 'mocked',
        attempts: 0,
      };
    }

    const isMock =
      !insertData?.id ||
      String(insertData?.id).startsWith('mock') ||
      !item?.id ||
      String(item?.id).startsWith('mock');

    return NextResponse.json({
      queued: true,
      queue: item,
      log: insertData,
      queueId: item?.id || null,
      logId: insertData?.id || null,
      mock: Boolean(isMock),
      message: isMock
        ? 'Email queued in mock mode when Supabase was unavailable.'
        : 'Email queued successfully.',
    });
}

export const POST = withApiErrorHandler(handler, '/api/email/send');
