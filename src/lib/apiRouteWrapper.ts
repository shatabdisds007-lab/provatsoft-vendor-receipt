import { NextRequest, NextResponse } from 'next/server';
import { logSystemError } from '@/services/errorService';
import { sanitizeString } from '@/lib/sanitize';
import { ApiError, isApiError } from '@/lib/errors';

export function withApiErrorHandler(
  handler: (...args: any[]) => Promise<NextResponse>,
  routeLabel?: string,
) {
  return async function (...args: any[]) {
    const request = args[0] as NextRequest;
    const context = args[1] as { params?: Record<string, string> } | undefined;
    try {
      return await handler(request, context);
    } catch (error: unknown) {
      const route = routeLabel || request.nextUrl.pathname || 'unknown';
      const correlationId = request.headers.get('x-correlation-id') || crypto.randomUUID();
      const isKnownError = isApiError(error);
      const safeMessage = isKnownError ? (error as ApiError).message : 'Internal server error';
      const status = isKnownError ? (error as ApiError).status : 500;
      const stackTrace = error instanceof Error ? sanitizeString(error.stack || '') : null;

      await logSystemError({
        errorType: isKnownError ? (error as ApiError).type : 'api_unhandled_error',
        message: sanitizeString(safeMessage),
        stackTrace,
        route,
        metadata: isKnownError ? (error as ApiError).metadata : undefined,
        correlationId,
      });

      const response = NextResponse.json(
        {
          error: safeMessage,
          correlationId,
        },
        {
          status,
        },
      );
      response.headers.set('x-correlation-id', correlationId);
      return response;
    }
  };
}
