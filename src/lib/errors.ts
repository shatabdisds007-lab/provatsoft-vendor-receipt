export class ApiError extends Error {
  public status: number;
  public type: string;
  public metadata?: Record<string, unknown>;

  constructor(status: number, type: string, message: string, metadata?: Record<string, unknown>) {
    super(message);
    this.status = status;
    this.type = type;
    this.metadata = metadata;
    this.name = 'ApiError';
  }
}

export class UnauthorizedError extends ApiError {
  constructor(message = 'Unauthorized') {
    super(401, 'unauthorized', message, { safe: true });
  }
}

export class ForbiddenError extends ApiError {
  constructor(message = 'Forbidden') {
    super(403, 'forbidden', message, { safe: true });
  }
}

export class RateLimitError extends ApiError {
  constructor(message = 'Rate limit exceeded') {
    super(429, 'rate_limit_exceeded', message, { safe: true });
  }
}

export class BadRequestError extends ApiError {
  constructor(message = 'Bad request') {
    super(400, 'bad_request', message, { safe: true });
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}
