import { Resend } from 'resend';
import { supabaseAdmin } from '@/lib/supabaseAdminClient';
import { logSystemError } from '@/lib/errorLogger';
import { retryWithBackoff } from '@/lib/retry';

let resend: Resend | null = null;

function getResendClient() {
  if (!resend) {
    const resendApiKey = process.env.RESEND_API_KEY || '';
    if (!resendApiKey) {
      throw new Error('RESEND_API_KEY env required for email queue processing');
    }
    resend = new Resend(resendApiKey);
  }
  return resend;
}

export type EmailQueuePayload = {
  userId: string;
  recipientEmail: string;
  subject: string;
  body: Record<string, unknown>;
  pdfUrl?: string;
  fileName?: string;
  receiptId?: string | null;
};

export async function enqueueEmail({
  userId,
  recipientEmail,
  subject,
  body,
  pdfUrl,
  fileName,
  receiptId,
}: {
  userId: string;
  recipientEmail: string;
  subject: string;
  body: Record<string, unknown>;
  pdfUrl?: string;
  fileName?: string;
  receiptId?: string | null;
}) {
  const { data, error } = await supabaseAdmin
    .from('email_queue')
    .insert([
      {
        user_id: userId,
        receipt_id: receiptId || null,
        recipient_email: recipientEmail,
        subject,
        body,
        pdf_url: pdfUrl || null,
        file_name: fileName || null,
        status: 'pending',
        attempts: 0,
      },
    ])
    .select('*')
    .single();

  if (error) throw error;
  return data;
}

export async function processEmailQueue(batchSize = 10) {
  const now = new Date().toISOString();
  const { data: queueItems, error } = await supabaseAdmin
    .from('email_queue')
    .select('*')
    .in('status', ['pending', 'retrying'])
    .lte('next_try_at', now)
    .order('created_at', { ascending: true })
    .limit(batchSize);

  if (error) {
    throw error;
  }

  if (!queueItems || queueItems.length === 0) {
    return [];
  }

  const results = [];
  for (const item of queueItems) {
    await supabaseAdmin.from('email_queue').update({ status: 'processing', updated_at: new Date().toISOString() }).eq('id', item.id);

    try {
      const sendResult = await retryWithBackoff(async () => {
        if (!item.pdf_url || !item.file_name) {
          throw new Error('Email queue item missing attachment metadata');
        }

        const pdfResponse = await fetch(item.pdf_url);
        if (!pdfResponse.ok) {
          throw new Error('Failed to fetch queued PDF for email delivery');
        }

        const buffer = await pdfResponse.arrayBuffer();
        const base64 = Buffer.from(buffer).toString('base64');

        const response = await getResendClient().emails.send({
          from: `Receipt Service <no-reply@provatsoft.com>`,
          to: item.recipient_email,
          subject: item.subject,
          html: `<p>Your receipt is attached.</p>`,
          attachments: [
            {
              type: 'application/pdf',
              name: item.file_name,
              data: base64,
            } as any,
          ] as any,
        });

        return response;
      }, 3, 500);

      await supabaseAdmin.from('email_queue').update({ status: 'sent', attempts: item.attempts + 1, updated_at: new Date().toISOString() }).eq('id', item.id);
      results.push({ id: item.id, status: 'sent', resend: sendResult });
    } catch (error: any) {
      const attempts = (item.attempts || 0) + 1;
      const nextTryAt = new Date(Date.now() + Math.pow(2, attempts) * 1000).toISOString();
      const status = attempts >= 3 ? 'failed' : 'retrying';
      await supabaseAdmin
        .from('email_queue')
        .update({
          status,
          attempts,
          last_error: error?.message || 'Unknown error',
          next_try_at: nextTryAt,
          updated_at: new Date().toISOString(),
        })
        .eq('id', item.id);

      await logSystemError({
        userId: item.user_id,
        errorType: 'email_queue_failure',
        stackTrace: error?.stack || String(error),
        route: '/api/email/process-queue',
      });
      results.push({ id: item.id, status, error: error?.message });
    }
  }

  return results;
}
