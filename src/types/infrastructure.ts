export type HealthServices = {
  db: boolean;
  storage: boolean;
  email: boolean;
};

export type HealthCheckResult = {
  status: 'healthy' | 'degraded' | 'down';
  services: HealthServices;
  latency: number;
  timestamp: string;
};

export type SystemErrorMetadata = Record<string, unknown>;

export type SystemErrorRow = {
  id: string;
  user_id: string | null;
  error_type: string;
  message: string | null;
  stack_trace: string | null;
  route: string;
  metadata: SystemErrorMetadata;
  correlation_id: string | null;
  created_at: string;
};

export type EmailQueueStatus = 'pending' | 'processing' | 'sent' | 'failed' | 'retrying';

export type EmailQueueItem = {
  id: string;
  user_id: string;
  receipt_id: string | null;
  recipient_email: string;
  subject: string;
  body: Record<string, unknown>;
  pdf_url: string | null;
  file_name: string | null;
  status: EmailQueueStatus;
  attempts: number;
  next_try_at: string;
  last_error: string | null;
  created_at: string;
  updated_at: string;
};

export type PdfGenerationStatus = 'success' | 'fallback' | 'error';

export type PdfGenerationLogRow = {
  id: string;
  template_slug: string;
  template_name: string;
  status: PdfGenerationStatus;
  receipt_number: string | null;
  pdf_url: string | null;
  file_name: string | null;
  fallback_used: boolean;
  message: string | null;
  generated_at: string;
  created_at: string;
};
