create table if not exists email_queue (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid not null,
  receipt_id uuid,
  recipient_email text not null,
  subject text not null,
  body jsonb default '{}'::jsonb,
  pdf_url text,
  file_name text,
  status text not null default 'pending' check (status in ('pending','processing','sent','failed','retrying')),
  attempts integer not null default 0,
  next_try_at timestamptz not null default now(),
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists email_queue_status_idx on email_queue(status);
create index if not exists email_queue_next_try_at_idx on email_queue(next_try_at);
