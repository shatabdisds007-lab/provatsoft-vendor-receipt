import { supabaseAdmin } from '@/lib/supabaseAdminClient';

export async function exportPlatformData() {
  const [receiptsRes, subscriptionsRes, logsRes, queueRes, usersRes] = await Promise.all([
    supabaseAdmin.from('receipt_pdfs').select('*'),
    supabaseAdmin.from('subscriptions').select('*'),
    supabaseAdmin.from('system_error_logs').select('*'),
    supabaseAdmin.from('email_queue').select('*'),
    supabaseAdmin.from('auth.users').select('id,email,user_metadata,app_metadata,created_at'),
  ]);

  if (receiptsRes.error || subscriptionsRes.error || logsRes.error || queueRes.error || usersRes.error) {
    throw new Error(
      [receiptsRes.error?.message, subscriptionsRes.error?.message, logsRes.error?.message, queueRes.error?.message, usersRes.error?.message]
        .filter(Boolean)
        .join(' | '),
    );
  }

  return {
    receipts: receiptsRes.data || [],
    subscriptions: subscriptionsRes.data || [],
    system_error_logs: logsRes.data || [],
    email_queue: queueRes.data || [],
    users: usersRes.data || [],
  };
}
