create table if not exists subscriptions (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  plan text not null default 'free' check (plan in ('free','pro','enterprise')),
  status text not null default 'active' check (status in ('active','canceled','banned')),
  current_usage integer not null default 0,
  usage_limit integer,
  reset_date date not null,
  plan_id text,
  stripe_customer_id text,
  stripe_subscription_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists subscriptions_user_id_unique on subscriptions(user_id);

create or replace function set_updated_at_timestamp()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger update_subscriptions_updated_at
before update on subscriptions
for each row execute procedure set_updated_at_timestamp();
