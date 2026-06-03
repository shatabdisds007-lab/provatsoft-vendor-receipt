import { logSystemError } from '@/services/errorService';

export async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  attempts = 3,
  initialDelayMs = 1000,
  context?: {
    action?: string;
    route?: string;
    correlationId?: string | null;
  },
): Promise<T> {
  let lastError: unknown = null;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await operation();
    } catch (error: any) {
      lastError = error;
      const delayMs = initialDelayMs * 2 ** (attempt - 1);
      const retryInfo = {
        action: context?.action || 'retry_operation',
        route: context?.route || 'unknown',
        attempt,
        delayMs,
        message: error?.message || String(error),
      };

      await logSystemError({
        errorType: 'retry_attempt',
        message: `Attempt ${attempt} failed: ${retryInfo.message}`,
        stackTrace: error?.stack ? String(error.stack) : null,
        route: retryInfo.route,
        metadata: {
          action: retryInfo.action,
          attempt: retryInfo.attempt,
          delayMs: retryInfo.delayMs,
          correlationId: context?.correlationId || null,
        },
        correlationId: context?.correlationId || null,
      });

      if (attempt === attempts) {
        break;
      }
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  throw lastError;
}
