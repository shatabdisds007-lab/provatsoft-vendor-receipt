-- Create profiles table linked to auth.users with role-based access
-- This table extends auth.users with application-specific role data

create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  role text not null check (role in ('admin', 'vendor')) default 'vendor',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(email)
);

-- Create indexes for performance
create index if not exists profiles_email_idx on profiles(email);
create index if not exists profiles_role_idx on profiles(role);

-- Create update trigger for updated_at
create trigger profiles_set_updated_at
  before update on profiles
  for each row
  execute function update_updated_at_column();

-- Enable Row Level Security
alter table profiles enable row level security;

-- RLS Policies for profiles table

-- Allow authenticated users to read their own profile
create policy "Users can read their own profile"
  on profiles for select
  using (auth.uid() = id);

-- Allow authenticated users to read other profiles (needed for admin listings)
-- In production, you may want to restrict this further
create policy "Users can read all profiles"
  on profiles for select
  using (true);

-- Allow admins to update any profile's role
create policy "Admins can update user roles"
  on profiles for update
  using (
    (select role from profiles where id = auth.uid()) = 'admin'
  )
  with check (
    (select role from profiles where id = auth.uid()) = 'admin'
  );

-- Allow users to update their own profile (except role)
create policy "Users can update their own profile"
  on profiles for update
  using (auth.uid() = id)
  with check (
    auth.uid() = id and
    -- Prevent users from changing their own role
    (old.role = role or (select role from profiles where id = auth.uid()) = 'admin')
  );

-- Prevent inserts through RLS (profiles created only via auth trigger)
-- But we'll allow service role via direct SQL
create policy "Service role can insert profiles"
  on profiles for insert
  with check (true);

-- Allow service role delete
create policy "Service role can delete profiles"
  on profiles for delete
  using (true);

-- Grant permissions
grant select on profiles to authenticated;
grant select on profiles to anon;
grant update on profiles to authenticated;

-- Create a function to handle profile creation on user signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, role)
  values (new.id, new.email, 'vendor')
  on conflict (id) do update
  set email = new.email, updated_at = now();
  return new;
end;
$$;

-- Create trigger for automatic profile creation
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Add admin check function for middleware/auth functions
create or replace function public.is_admin(user_id uuid)
returns boolean
language sql
security definer set search_path = public
as $$
  select (select role from profiles where id = user_id) = 'admin';
$$;

-- Grant execute on functions
grant execute on function public.handle_new_user() to service_role;
grant execute on function public.is_admin(uuid) to authenticated, anon;
