import { supabaseAdmin } from '@/lib/supabaseAdminClient';
import { checkPlatformHealth } from '@/lib/healthChecker';

export async function getAdminMetrics() {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const [healthResult, errorsRes, queueRes] = await Promise.all([
    checkPlatformHealth(),
    supabaseAdmin.from('system_error_logs').select('id', { count: 'exact' }).gte('created_at', since),
    supabaseAdmin
      .from('email_queue')
      .select('status, id', { count: 'exact' })
      .in('status', ['pending', 'processing', 'sent', 'failed', 'retrying']),
  ]);

  const queueCounts = {
    pending: 0,
    processing: 0,
    sent: 0,
    failed: 0,
    retrying: 0,
  } as Record<string, number>;

  if (queueRes.data) {
    for (const row of queueRes.data as Array<{ status: string }>) {
      queueCounts[row.status] = (queueCounts[row.status] || 0) + 1;
    }
  }

  const sent = queueCounts.sent;
  const failed = queueCounts.failed;
  const successRate = sent + failed > 0 ? Math.round((sent / (sent + failed)) * 100) : 0;

  return {
    errorCount: errorsRes.count || 0,
    queue: queueCounts,
    emailSuccessRate: successRate,
    health: healthResult.services,
    latency: healthResult.latency,
  };
}
