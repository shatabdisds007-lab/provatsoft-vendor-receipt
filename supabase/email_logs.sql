-- Supabase SQL for email logs

create table if not exists email_logs (
  id uuid default uuid_generate_v4() primary key,
  vendor_id uuid not null,
  receipt_id uuid,
  receipt_number text,
  recipient_email text not null,
  subject text not null,
  status text not null default 'pending',
  provider text not null default 'resend',
  pdf_url text,
  error_message text,
  sent_at timestamptz,
  created_at timestamptz default now(),
  metadata jsonb default '{}'::jsonb
);

create index if not exists email_logs_vendor_id_idx on email_logs(vendor_id);
create index if not exists email_logs_status_idx on email_logs(status);
