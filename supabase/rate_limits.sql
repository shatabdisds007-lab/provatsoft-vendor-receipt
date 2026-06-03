create table if not exists rate_limits (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid not null,
  route text not null,
  window_start timestamptz not null,
  request_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists rate_limits_user_route_window_unique on rate_limits(user_id, route, window_start);

create or replace function set_rate_limits_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger update_rate_limits_updated_at
before update on rate_limits
for each row execute procedure set_rate_limits_updated_at();
