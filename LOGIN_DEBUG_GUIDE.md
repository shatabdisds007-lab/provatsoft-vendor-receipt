# 🔍 LOGIN AUTHENTICATION - DEBUGGING GUIDE

**Status**: Debugging in Progress  
**Issue**: "Invalid login credentials" error  
**Date**: June 8, 2026

---

## 📋 Root Cause Analysis

The error **"Invalid login credentials"** from Supabase means:

1. ❌ User email doesn't exist in Supabase Auth
2. ❌ Password is incorrect
3. ❌ Email not confirmed (if email confirmation enabled)
4. ❌ User is disabled/deactivated

**Most likely**: Test users haven't been created yet!

---

## ✅ STEP 1: Verify Test Users Exist

### Go to Supabase Console

1. Open https://supabase.com
2. Select your project
3. Go to **Authentication → Users**
4. Check if test users exist:
   - `vendor@test.com`
   - `admin@test.com`

**If users DON'T exist**: Follow **Step 2**  
**If users exist**: Follow **Step 3**

---

## 🆕 STEP 2: Create Test Users in Supabase

### Method A: Supabase Dashboard UI (Easiest)

1. Go to **Authentication → Users** in Supabase console
2. Click **Add user** button
3. Create Vendor User:
   - Email: `vendor@test.com`
   - Password: `VendorTest123!`
   - Auto confirm email: ✅ YES
4. Click **Save**

5. Repeat for Admin User:
   - Email: `admin@test.com`
   - Password: `AdminTest123!`
   - Auto confirm email: ✅ YES

### Method B: SQL (If Dashboard doesn't work)

Copy & paste in **SQL Editor**:

```sql
-- Create vendor user
INSERT INTO auth.users (
  instance_id, id, aud, role, email, encrypted_password, 
  email_confirmed_at, created_at, updated_at
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated', 'authenticated',
  'vendor@test.com',
  crypt('VendorTest123!', gen_salt('bf')),
  now(), now(), now()
) ON CONFLICT DO NOTHING;

-- Create admin user
INSERT INTO auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, created_at, updated_at
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated', 'authenticated',
  'admin@test.com',
  crypt('AdminTest123!', gen_salt('bf')),
  now(), now(), now()
) ON CONFLICT DO NOTHING;
```

---

## 👤 STEP 3: Verify Profiles Table

### Check if profiles table exists

Go to **SQL Editor** and run:

```sql
SELECT table_name FROM information_schema.tables 
WHERE table_name = 'profiles' AND table_schema = 'public';
```

**If table doesn't exist**: Follow **Profiles Setup** below  
**If table exists**: Go to **Step 4**

### Profiles Setup

Run this in SQL Editor:

```sql
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  role text not null check (role in ('admin', 'vendor')) default 'vendor',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(email)
);

create index if not exists profiles_email_idx on profiles(email);
create index if not exists profiles_role_idx on profiles(role);

alter table profiles enable row level security;

create policy "Users can read their own profile"
  on profiles for select
  using (auth.uid() = id);

create policy "Service role can insert" 
  on profiles for insert 
  with check (true);
```

---

## 🔄 STEP 4: Create Profiles for Test Users

After users exist in `auth.users`, create their profiles:

```sql
-- Get the actual user IDs from auth.users
SELECT id, email FROM auth.users WHERE email IN ('vendor@test.com', 'admin@test.com');

-- Then use those IDs to create profiles:
INSERT INTO profiles (id, email, role) VALUES
  ('USER_ID_FROM_ABOVE', 'vendor@test.com', 'vendor'),
  ('OTHER_USER_ID_FROM_ABOVE', 'admin@test.com', 'admin')
ON CONFLICT DO NOTHING;
```

Or simpler - use this in SQL Editor:

```sql
-- Create profiles for all users that don't have one
INSERT INTO profiles (id, email, role)
SELECT id, email, 'vendor'
FROM auth.users
WHERE email NOT IN (SELECT email FROM profiles)
ON CONFLICT DO NOTHING;

-- Update admin role
UPDATE profiles SET role = 'admin' WHERE email = 'admin@test.com';
```

---

## 🧪 STEP 5: Test Login with Debug Logs

### 1. Open Browser DevTools
- Press **F12** or **Ctrl+Shift+J**
- Go to **Console** tab

### 2. Start Dev Server
```bash
npm run dev
```

### 3. Go to Login Page
- Visit: http://localhost:3000/login

### 4. Enter Test Credentials
**For Vendor:**
- Email: `vendor@test.com`
- Password: `VendorTest123!`

### 5. Watch Console Logs

You should see logs like:

```
[LOGIN] ===== LOGIN ATTEMPT START =====
[LOGIN] Email: vendor@test.com
[LOGIN] Password length: 13
[LOGIN] Supabase URL: https://your-project.s...
[LOGIN] Supabase Key exists: true
[LOGIN] Calling supabase.auth.signInWithPassword...
[LOGIN] SignInWithPassword response received
[LOGIN] ✅ User authenticated successfully
[LOGIN] User ID: 123e4567-e89b-12d3-a456-426614174000
[LOGIN] User Email: vendor@test.com
[LOGIN] Fetching user profile from database...
[LOGIN] Profile fetch completed
[LOGIN] ✅ User profile found
[LOGIN] User Role: vendor
[LOGIN] ✅ Redirecting to VENDOR dashboard
[LOGIN] ===== LOGIN ATTEMPT COMPLETE =====
```

---

## ❌ Troubleshooting Login Errors

### Error: "Email or password is incorrect"

**Check:**
1. Email exists in `auth.users` table
   ```sql
   SELECT email FROM auth.users WHERE email = 'vendor@test.com';
   ```

2. Password is correct (try recreating user with new password)

3. Email is confirmed:
   ```sql
   SELECT email, email_confirmed_at FROM auth.users 
   WHERE email = 'vendor@test.com';
   ```

**Fix if not confirmed:**
```sql
UPDATE auth.users 
SET email_confirmed_at = now() 
WHERE email = 'vendor@test.com';
```

### Error: "Please confirm your email"

```sql
-- Confirm email for test user
UPDATE auth.users 
SET email_confirmed_at = now() 
WHERE email = 'vendor@test.com';
```

### Error: "This email is not registered"

```sql
-- Check if email exists
SELECT email FROM auth.users WHERE email = 'vendor@test.com';

-- If not, create user in Supabase dashboard or use SQL above
```

### Login succeeds but profile error

```sql
-- Check if profile exists
SELECT * FROM profiles WHERE email = 'vendor@test.com';

-- If missing, create it
INSERT INTO profiles (id, email, role)
SELECT id, email, 'vendor'
FROM auth.users
WHERE email = 'vendor@test.com'
ON CONFLICT DO NOTHING;
```

### Login succeeds but no redirect

1. Check browser console for JavaScript errors
2. Check if profile has a role:
   ```sql
   SELECT role FROM profiles WHERE email = 'vendor@test.com';
   ```
3. Check network tab - do you see redirect request?

---

## 🔧 Environment Variable Verification

Verify all required variables are set correctly:

```bash
npm run validate:auth
```

Output should show:
```
✓ PASS NEXT_PUBLIC_SUPABASE_URL is set
✓ PASS NEXT_PUBLIC_SUPABASE_ANON_KEY is set
```

If not, check `.env.local` file:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...your_anon_key
SUPABASE_SERVICE_ROLE_KEY=eyJ...service_key
```

**Important**: No placeholder values like `your_supabase_url` - must be actual credentials!

---

## 📊 Database Verification Checklist

Run these in SQL Editor to verify setup:

```sql
-- Check auth.users exists
SELECT COUNT(*) as user_count FROM auth.users;

-- Check profiles table exists
SELECT COUNT(*) as profile_count FROM profiles;

-- Check test users exist
SELECT email, email_confirmed_at FROM auth.users 
WHERE email IN ('vendor@test.com', 'admin@test.com');

-- Check test profiles exist
SELECT email, role FROM profiles 
WHERE email IN ('vendor@test.com', 'admin@test.com');
```

All queries should return data. If any return 0 rows, follow the setup steps above.

---

## 🚀 Final Login Test

After completing all steps above:

1. Open http://localhost:3000/login
2. Open DevTools Console (F12)
3. Enter credentials:
   - Vendor: `vendor@test.com` / `VendorTest123!`
   - Admin: `admin@test.com` / `AdminTest123!`
4. Check console logs for `[LOGIN]` prefixed messages
5. Should redirect to correct dashboard

**Expected Result:**
- ✅ Console shows successful auth flow
- ✅ Redirects to `/dashboard/vendor` or `/dashboard/admin`
- ✅ Dashboard loads correctly
- ✅ No errors in console

---

## 📝 Debug Checklist

Complete this checklist before assuming system is broken:

- [ ] Test users created in Supabase Auth dashboard
- [ ] Users have `email_confirmed_at` set (not NULL)
- [ ] Profiles table exists in database
- [ ] Profile rows exist for test users
- [ ] Profiles have correct role ('vendor' or 'admin')
- [ ] Environment variables verified with `npm run validate:auth`
- [ ] `.env.local` has actual credentials (not placeholders)
- [ ] Dev server restarted after env changes
- [ ] Browser cache cleared (F12 → Application → Clear storage)
- [ ] DevTools console open during login test

---

## 💡 What to Look For in Console

**Successful login sequence:**
```
[LOGIN] ===== LOGIN ATTEMPT START =====
[LOGIN] Email: vendor@test.com
...
[LOGIN] ✅ User authenticated successfully
[LOGIN] ✅ User profile found
[LOGIN] ✅ Redirecting to VENDOR dashboard
[LOGIN] ===== LOGIN ATTEMPT COMPLETE =====
```

**If you see error:**
```
[LOGIN] Sign-in error details: {
  message: "Invalid login credentials",
  status: 400,
  code: "invalid_credentials"
}
```

→ User doesn't exist or password is wrong → Create test user

---

## 🎯 Next Steps

1. **Complete steps 1-4** above (takes ~5 minutes)
2. **Test login** with improved debug logging
3. **Check console output** for `[LOGIN]` logs
4. **Report back** with:
   - Console log output
   - Error message (if any)
   - Steps completed

---

## 📞 Support

If login still fails after completing all steps:

1. Share console log output (screenshot or copy-paste)
2. Verify test user exists: `SELECT * FROM auth.users WHERE email = 'vendor@test.com';`
3. Verify profile exists: `SELECT * FROM profiles WHERE email = 'vendor@test.com';`
4. Check Supabase project settings → Authentication → Confirm emails enabled?

---

**Document Created**: June 8, 2026  
**Purpose**: Debug "Invalid login credentials" error  
**Status**: Use this to verify setup and test login
