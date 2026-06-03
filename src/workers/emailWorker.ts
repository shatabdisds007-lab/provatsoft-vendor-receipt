import { processEmailQueue } from '@/lib/emailQueue';
import { logSystemError } from '@/services/errorService';

export async function runEmailWorker(batchSize = 10) {
  try {
    return await processEmailQueue(batchSize);
  } catch (error: any) {
    await logSystemError({
      errorType: 'worker_email_queue_failure',
      message: error?.message || 'Email worker failed unexpectedly',
      stackTrace: error?.stack || String(error),
      route: '/workers/emailWorker',
    });
    throw error;
  }
}
