create table if not exists system_error_logs (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid,
  error_type text not null,
  message text,
  stack_trace text,
  route text,
  created_at timestamptz default now()
);

create index if not exists system_error_logs_user_id_idx on system_error_logs(user_id);
