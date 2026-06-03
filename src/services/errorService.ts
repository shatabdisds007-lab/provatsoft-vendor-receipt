import { supabaseAdmin } from '@/lib/supabaseAdminClient';
import { sanitizeString, sanitizeObject } from '@/lib/sanitize';
import type { SystemErrorMetadata } from '@/types/infrastructure';

export type SystemErrorPayload = {
  userId?: string | null;
  errorType: string;
  message?: string | null;
  stackTrace?: string | null;
  route: string;
  metadata?: SystemErrorMetadata;
  correlationId?: string | null;
};

export async function logSystemError(payload: SystemErrorPayload) {
  try {
    await supabaseAdmin.from('system_error_logs').insert([
      {
        user_id: payload.userId || null,
        error_type: sanitizeString(payload.errorType),
        message: payload.message ? sanitizeString(payload.message) : null,
        stack_trace: payload.stackTrace ? sanitizeString(payload.stackTrace) : null,
        route: sanitizeString(payload.route),
        metadata: sanitizeObject(payload.metadata || {}),
        correlation_id: sanitizeString(payload.correlationId || '' ) || null,
      },
    ]);
  } catch (error) {
    console.error('System error logger failed', error);
  }
}
