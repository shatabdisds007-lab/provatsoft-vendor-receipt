create table if not exists pdf_generation_logs (
  id uuid default uuid_generate_v4() primary key,
  template_id uuid,
  template_slug text not null,
  template_name text not null,
  status text not null,
  receipt_number text,
  pdf_url text,
  file_name text,
  message text,
  generated_at timestamptz default now(),
  created_at timestamptz default now()
);
