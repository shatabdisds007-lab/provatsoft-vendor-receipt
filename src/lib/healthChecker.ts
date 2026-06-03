import { supabaseAdmin } from '@/lib/supabaseAdminClient';
import type { HealthServices } from '@/types/infrastructure';

const API_TIMEOUT_MS = 3000;

function withTimeout<T>(promise: Promise<T>, timeoutMs: number, label: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error(`${label} probe timed out`)), timeoutMs)),
  ]);
}

export async function checkPlatformHealth(): Promise<{ services: HealthServices; latency: number }> {
  const startedAt = Date.now();
  const services: HealthServices = { db: false, storage: false, email: false };

  try {
    const resp = await supabaseAdmin.from('subscriptions').select('id').limit(1);
    if (!resp.error) {
      services.db = true;
    }
  } catch {
    services.db = false;
  }

  try {
    const resp = await supabaseAdmin.storage.from('receipts').list('', { limit: 1 });
    if (!resp.error) {
      services.storage = true;
    }
  } catch {
    services.storage = false;
  }

  try {
    const resendApiKey = process.env.RESEND_API_KEY || '';
    if (resendApiKey) {
      const response = await withTimeout(
        fetch('https://api.resend.com/v1/senders', {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${resendApiKey}`,
            'Content-Type': 'application/json',
          },
        }),
        API_TIMEOUT_MS,
        'email',
      );

      if (response.ok) {
        services.email = true;
      }
    }
  } catch {
    services.email = false;
  }

  const latency = Date.now() - startedAt;
  return { services, latency };
}
