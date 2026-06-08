# Authentication & RBAC Setup Guide

**Last Updated**: June 8, 2026  
**Status**: Production Ready  
**Version**: 2.0

---

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Environment Configuration](#environment-configuration)
3. [Database Setup](#database-setup)
4. [Supabase Configuration](#supabase-configuration)
5. [Testing Authentication](#testing-authentication)
6. [Troubleshooting](#troubleshooting)

---

## Prerequisites

- Node.js 18+ installed
- Supabase project created (https://supabase.com)
- Admin access to Supabase console
- A valid Resend API key (for email)

---

## Environment Configuration

### Step 1: Create `.env.local` file

Copy `.env.example` and fill in your Supabase credentials:

```bash
cp .env.example .env.local
```

### Step 2: Get Supabase Credentials

1. Go to **Settings → API** in your Supabase project
2. Copy these values:

```env
# Required for client-side auth (public)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Required for server-side auth (secret - DO NOT expose)
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# JWT validation configuration
SUPABASE_JWT_SECRET=your_supabase_jwt_secret
SUPABASE_JWT_ISSUER=https://your-project.supabase.co

# Optional: Resend for emails
RESEND_API_KEY=your_resend_api_key

# Optional: Admin user override (for development only)
ADMIN_USER_ID=your-admin-user-uuid
```

### Step 3: Verify Environment Variables

```bash
# Run this to check if variables are set correctly
npm run dev

# Watch browser console for auth errors
# Should see no "Missing Supabase credentials" errors
```

---

## Database Setup

### Step 1: Create Profiles Table

The `profiles` table links `auth.users` to application roles.

**Run in Supabase SQL Editor:**

```sql
-- Create profiles table
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  role text not null check (role in ('admin', 'vendor')) default 'vendor',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(email)
);

-- Create indexes
create index if not exists profiles_email_idx on profiles(email);
create index if not exists profiles_role_idx on profiles(role);

-- Enable Row Level Security
alter table profiles enable row level security;

-- RLS Policy: Users can read their own profile
create policy "Users can read their own profile"
  on profiles for select
  using (auth.uid() = id);

-- RLS Policy: Admins can update user roles
create policy "Admins can update user roles"
  on profiles for update
  using ((select role from profiles where id = auth.uid()) = 'admin')
  with check ((select role from profiles where id = auth.uid()) = 'admin');

-- RLS Policy: Users can update own profile (except role)
create policy "Users can update their own profile"
  on profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id and (old.role = role or (select role from profiles where id = auth.uid()) = 'admin'));

-- Grant permissions
grant select on profiles to authenticated;
grant update on profiles to authenticated;
```

### Step 2: Create Profile Auto-Creation Trigger

This automatically creates a profile when a user signs up.

**Run in Supabase SQL Editor:**

```sql
-- Create function to handle new user signup
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

-- Create trigger
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Grant execute permission
grant execute on function public.handle_new_user() to service_role;
```

### Step 3: Create Other Required Tables

Copy the complete schema from `supabase/production-schema-complete.sql` and run it in Supabase SQL Editor.

---

## Supabase Configuration

### Step 1: Configure Auth Settings

1. Go to **Authentication → Providers**
2. Enable Email/Password provider:
   - ✅ Enable Email/Password authentication
   - ✅ Confirm email before sign-in (optional)

### Step 2: Configure JWT Secret

1. Go to **Settings → API**
2. Under "JWT Secret", verify it's set
3. Use this value for `SUPABASE_JWT_SECRET` in `.env.local`

### Step 3: Configure CORS (for local development)

1. Go to **Settings → API**
2. Add your local dev URL to CORS allowlist:
   - `http://localhost:3000`
   - `http://127.0.0.1:3000`

### Step 4: Configure Email Provider

1. Go to **Authentication → Email Templates**
2. Customize confirmation and password reset emails (optional)

---

## Testing Authentication

### Test 1: Create Test Users

**Run in Supabase SQL Editor:**

```sql
-- Create test vendor user
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'vendor@example.com',
  crypt('vendor123', gen_salt('bf')),
  now(),
  now(),
  now()
) ON CONFLICT DO NOTHING;

-- Create test admin user
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'admin@example.com',
  crypt('admin123', gen_salt('bf')),
  now(),
  now(),
  now()
) ON CONFLICT DO NOTHING;
```

**Then update their roles:**

```sql
-- Make admin@example.com an admin
UPDATE profiles 
SET role = 'admin' 
WHERE email = 'admin@example.com';
```

### Test 2: Local Testing

1. Start dev server: `npm run dev`
2. Go to `http://localhost:3000/login`
3. Login with:
   - **Vendor**: `vendor@example.com` / `vendor123`
   - **Admin**: `admin@example.com` / `admin123`

**Expected Results:**
- Vendor redirects to `/dashboard/vendor`
- Admin redirects to `/dashboard/admin`
- Console shows auth debug logs (look for `[LOGIN]` and `[AUTH]` logs)

### Test 3: Check Dashboard Access Control

1. Login as vendor
2. Try to access `/dashboard/admin`
   - Should redirect to `/unauthorized`

3. Login as admin
4. Access `/dashboard/vendor`
   - Should be allowed (admins can access vendor dashboards)

---

## Troubleshooting

### Issue: "Invalid login" Error

**Possible Causes:**
1. User email not confirmed (if email confirmation is enabled)
2. User doesn't exist
3. Wrong password

**Fix:**
```sql
-- Check if user exists
SELECT email, email_confirmed_at FROM auth.users WHERE email = 'your@email.com';

-- Manually confirm email if needed
UPDATE auth.users 
SET email_confirmed_at = now() 
WHERE email = 'your@email.com';
```

### Issue: "Unable to fetch user profile" Error

**Possible Causes:**
1. Profile table doesn't exist
2. Profile row not created (trigger failed)
3. RLS policies blocking access

**Fix:**
```sql
-- Check if profiles table exists
SELECT * FROM information_schema.tables 
WHERE table_name = 'profiles' AND table_schema = 'public';

-- Check if profile exists for user
SELECT * FROM profiles WHERE email = 'your@email.com';

-- Manually create profile if missing
INSERT INTO profiles (id, email, role) 
SELECT id, email, 'vendor' FROM auth.users 
WHERE email = 'your@email.com' 
ON CONFLICT DO NOTHING;
```

### Issue: "Forbidden - Admin access required" Error

**Possible Causes:**
1. User role is 'vendor' but trying to access admin API
2. Role not updated in profiles table

**Fix:**
```sql
-- Check user's role
SELECT id, email, role FROM profiles WHERE email = 'your@email.com';

-- Update role to admin if needed
UPDATE profiles 
SET role = 'admin' 
WHERE email = 'your@email.com';
```

### Issue: Environment Variables Not Found

**Possible Causes:**
1. `.env.local` file not created
2. Variables not set correctly
3. Development server not restarted

**Fix:**
```bash
# Check if .env.local exists
ls -la .env.local

# Verify variable format (should NOT have quotes around values)
cat .env.local

# Restart dev server
npm run dev
```

### Issue: CORS Error on Login

**Possible Causes:**
1. Supabase CORS not configured
2. Wrong Supabase URL
3. Supabase project changed

**Fix:**
1. Go to **Settings → API** in Supabase
2. Add `http://localhost:3000` to CORS allowlist
3. Verify `NEXT_PUBLIC_SUPABASE_URL` is correct

### Issue: "Missing Supabase credentials" Error

**Possible Causes:**
1. Environment variables not loaded
2. Missing `.env.local`
3. Typo in variable name

**Fix:**
```bash
# Verify environment variables are set
echo $NEXT_PUBLIC_SUPABASE_URL
echo $NEXT_PUBLIC_SUPABASE_ANON_KEY

# Restart dev server to reload .env
npm run dev
```

---

## Debug Logging

The application includes comprehensive debug logging for authentication flows.

**To view logs:**

1. **Browser Console** (Ctrl+Shift+J or F12)
   - Look for `[LOGIN]`, `[AUTH]`, `[MIDDLEWARE]` logs
   - Shows step-by-step auth flow
   - Useful for debugging client-side issues

2. **Terminal Output**
   - Server-side logs from middleware
   - Useful for middleware/redirect issues

**Example Logs:**
```
[LOGIN] Attempting login for: vendor@example.com
[LOGIN] User authenticated: 123e4567-e89b-12d3-a456-426614174000
[LOGIN] User profile fetched: { role: 'vendor' }
[LOGIN] Redirecting to vendor dashboard
[MIDDLEWARE] Processing request: /dashboard/vendor
[MIDDLEWARE] Valid token found for user: 123e4567-e89b-12d3-a456-426614174000
[MIDDLEWARE] Vendor dashboard access allowed: /dashboard/vendor
```

**To disable debug logs:**

Remove or comment out console.log statements in:
- `app/login/page.tsx`
- `middleware.ts`
- `src/lib/auth.ts`

---

## Verification Checklist

Before going to production:

- [ ] `.env.local` file created with all required variables
- [ ] Supabase project URL and keys are correct
- [ ] `profiles` table created in Supabase
- [ ] Auto-creation trigger configured
- [ ] Test users created and roles set correctly
- [ ] Login works for both admin and vendor
- [ ] Dashboard access control works (vendor can't access admin)
- [ ] No console errors during login
- [ ] Middleware logs show correct routing
- [ ] Email provider (Resend) configured for password reset
- [ ] RLS policies enabled on profiles table
- [ ] CORS configured in Supabase

---

## Quick Start Command

```bash
# 1. Install dependencies
npm install

# 2. Create environment file
cp .env.example .env.local

# 3. Add your Supabase credentials to .env.local

# 4. Run database setup (copy supabase/production-schema-complete.sql and run in Supabase SQL Editor)

# 5. Start dev server
npm run dev

# 6. Visit http://localhost:3000/login
```

---

## Support

For issues:
1. Check **Troubleshooting** section above
2. Review debug logs in browser console
3. Verify Supabase configuration
4. Check `.env.local` file permissions
5. Ensure JWT secret is correct

---

## See Also

- [Supabase Authentication Docs](https://supabase.com/docs/guides/auth)
- [Supabase JWT Configuration](https://supabase.com/docs/reference/auth/jwt)
- [Next.js Middleware](https://nextjs.org/docs/app/building-your-application/routing/middleware)
