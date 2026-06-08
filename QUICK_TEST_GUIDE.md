# Quick Testing Guide - Authentication & RBAC

**Date**: June 8, 2026  
**Purpose**: Verify login, roles, and access control are working correctly  
**Time Required**: 15-20 minutes

---

## Pre-Test Checklist

- [ ] `.env.local` file created with Supabase credentials
- [ ] `npm install` has been run
- [ ] Supabase `profiles` table created
- [ ] Test users created in Supabase Auth
- [ ] Dev server can be started (`npm run dev`)
- [ ] Browser DevTools available (F12)

---

## Step 1: Validate Setup (5 minutes)

### Run Validation Script

```bash
npm run validate:auth
```

**Expected Output:**
```
✓ PASS `.env.local` file exists - ...
✓ PASS NEXT_PUBLIC_SUPABASE_URL is set
✓ PASS NEXT_PUBLIC_SUPABASE_ANON_KEY is set
✓ PASS SUPABASE_SERVICE_ROLE_KEY is set
✓ PASS SUPABASE_JWT_SECRET is set
...
✓ All checks passed!
```

**If validation fails:**
- Follow the error messages
- Check `AUTH_SETUP_GUIDE.md` for fixes
- Don't proceed until all checks pass

---

## Step 2: Start Development Server (2 minutes)

```bash
npm run dev
```

**Expected Output:**
```
  ▲ Next.js 15.5.19
  - Local:        http://localhost:3000
  - Environments: .env.local
```

**Verify:**
- No errors in terminal
- Port 3000 is available
- Browser can access http://localhost:3000

---

## Step 3: Test Vendor Login (5 minutes)

### Open Login Page

1. Go to `http://localhost:3000/login`
2. Open Browser DevTools: **F12** → **Console**

### Enter Vendor Credentials

- Email: `vendor@example.com`
- Password: `vendor123`
- Click **Sign in**

### Watch Console Logs

You should see logs like:

```
[LOGIN] Attempting login for: vendor@example.com
[LOGIN] User authenticated: <user-id>
[LOGIN] User profile fetched: { role: 'vendor' }
[LOGIN] Redirecting to vendor dashboard
```

### Verify Redirect

- Should redirect to: `http://localhost:3000/dashboard/vendor`
- Dashboard should load
- Sidebar should show "Vendor Dashboard"

**If login fails:**
- Check console for error messages
- Verify email/password in Supabase Auth
- Check profiles table has vendor user entry

---

## Step 4: Test Admin Login (5 minutes)

### Go Back to Login

1. Visit `http://localhost:3000/login`
2. Clear browser cache (DevTools → Application → Clear storage)
3. Open Console tab again

### Enter Admin Credentials

- Email: `admin@example.com`
- Password: `admin123`
- Click **Sign in**

### Watch Console Logs

```
[LOGIN] Attempting login for: admin@example.com
[LOGIN] User authenticated: <admin-user-id>
[LOGIN] User profile fetched: { role: 'admin' }
[LOGIN] Redirecting to admin dashboard
```

### Verify Redirect

- Should redirect to: `http://localhost:3000/dashboard/admin`
- Dashboard should load
- Sidebar should show "Admin Dashboard"

**If admin login fails:**
- Check profiles table: `SELECT * FROM profiles WHERE email = 'admin@example.com'`
- Verify role is 'admin' (not 'vendor')
- Update if needed: `UPDATE profiles SET role = 'admin' WHERE email = 'admin@example.com'`

---

## Step 5: Test Access Control (5 minutes)

### Test 1: Vendor Cannot Access Admin Dashboard

1. Login as vendor (from Step 3)
2. Try to manually navigate to `http://localhost:3000/dashboard/admin`

**Expected Result:**
- Redirected to `/unauthorized` page
- Should NOT see admin dashboard

### Test 2: Admin Can Access Vendor Dashboard

1. Login as admin (from Step 4)
2. Navigate to `http://localhost:3000/dashboard/vendor`

**Expected Result:**
- Dashboard loads successfully
- Can see vendor dashboard content
- No unauthorized error

### Test 3: Check Middleware Logs

1. Open DevTools Network tab
2. Open DevTools Console
3. Look for middleware logs like:

```
[MIDDLEWARE] Processing request: /dashboard/admin
[MIDDLEWARE] Valid token found for user: <admin-user-id>
[MIDDLEWARE] Fetching role for user: <admin-user-id>
[MIDDLEWARE] User role from database: admin
[MIDDLEWARE] Admin dashboard access allowed: /dashboard/admin
```

---

## Step 6: Test API Authentication (5 minutes)

### Test Unauthenticated API Access

1. Open DevTools → Network tab
2. Logout (clear cookies/session)
3. Run in console:

```javascript
fetch('http://localhost:3000/api/receipts', {
  method: 'GET',
  headers: { 'Content-Type': 'application/json' }
})
.then(r => r.json())
.then(d => console.log(d))
```

**Expected Result:**
```javascript
{ error: 'Unauthorized' }
// Status: 401
```

### Test Authenticated API Access

1. Login as vendor
2. Run in console:

```javascript
fetch('http://localhost:3000/api/receipts', {
  method: 'GET',
  headers: { 'Content-Type': 'application/json' }
})
.then(r => r.json())
.then(d => console.log(d))
```

**Expected Result:**
```javascript
{
  receipts: [
    // ... list of receipts ...
  ]
}
// Status: 200
```

### Test Admin API Access

1. Logout and login as admin
2. Run in console:

```javascript
fetch('http://localhost:3000/api/admin/users', {
  method: 'GET',
  headers: { 'Content-Type': 'application/json' }
})
.then(r => r.json())
.then(d => console.log(d))
```

**Expected Result:**
```javascript
{
  success: true,
  data: [
    // ... all user profiles ...
  ],
  count: 2
}
// Status: 200
```

### Test Non-Admin Cannot Access Admin API

1. Logout and login as vendor
2. Try the admin API from above

**Expected Result:**
```javascript
{ error: 'Forbidden' }
// Status: 403
```

---

## Step 7: Test Profile Auto-Creation (Optional)

### Create New User in Supabase

1. Go to Supabase console → Authentication → Users
2. Click "Add user"
3. Create new user:
   - Email: `newuser@example.com`
   - Password: `newuser123`

### Verify Profile Created

1. Login with new user at `/login`
2. Should be redirected to `/dashboard/vendor` (default role)
3. Check profiles table:

```sql
SELECT * FROM profiles WHERE email = 'newuser@example.com'
```

**Expected Result:**
- Row exists
- Role is 'vendor'
- Email matches

---

## Debug Commands Reference

### Check Environment Variables

```bash
# Linux/Mac
echo $NEXT_PUBLIC_SUPABASE_URL

# PowerShell
$env:NEXT_PUBLIC_SUPABASE_URL
```

### View Terminal Logs

Look for:
- `[MIDDLEWARE]` - Route protection logs
- `[AUTH]` - Auth utility logs  
- `[LOGIN]` - Login page logs

### Check Database State

```sql
-- See all profiles
SELECT id, email, role, created_at FROM profiles;

-- See specific user
SELECT * FROM profiles WHERE email = 'vendor@example.com';

-- Update user role
UPDATE profiles SET role = 'admin' WHERE email = 'admin@example.com';

-- Check auth users
SELECT id, email, email_confirmed_at FROM auth.users;
```

### Test With curl

```bash
# Create JWT token first (get from login)
TOKEN="your_token_here"

# Test protected API
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3000/api/receipts

# Should return receipts list
```

---

## Common Issues & Fixes

### Issue: "Invalid login"
- **Cause**: User not found or wrong password
- **Fix**: Verify user exists in Supabase Auth
- **Fix**: Confirm email is correct
- **Fix**: Reset password in Supabase console

### Issue: "Unable to fetch user profile"
- **Cause**: Profile table doesn't exist
- **Fix**: Run profiles.sql in Supabase SQL Editor
- **Cause**: Trigger didn't create profile
- **Fix**: Manually create profile in database

### Issue: "Unauthorized" at `/dashboard/vendor`
- **Cause**: Not logged in
- **Fix**: Clear cookies and login again
- **Cause**: JWT token expired
- **Fix**: Refresh page or login again

### Issue: "Forbidden" at `/dashboard/admin` (as vendor)
- **Cause**: Role is not 'admin'
- **Fix**: This is correct behavior!
- **Info**: Vendors cannot access admin dashboard

### Issue: Login works but no redirect
- **Cause**: Role is null/missing
- **Fix**: Check profiles table for role value
- **Fix**: Default to vendor will be used
- **Info**: Should see redirect logs in console

### Issue: Console logs not showing
- **Cause**: DevTools not open
- **Fix**: Open DevTools with F12 before login
- **Cause**: Log level filtered
- **Fix**: Check DevTools filter (should be "All levels")

---

## Success Checklist

After running all tests, verify:

- [ ] Validation script passes all checks
- [ ] Dev server starts without errors
- [ ] Vendor can login and see vendor dashboard
- [ ] Admin can login and see admin dashboard
- [ ] Vendor cannot access admin dashboard
- [ ] Admin can access vendor dashboard
- [ ] Console shows `[LOGIN]` logs during login
- [ ] Console shows `[MIDDLEWARE]` logs on navigation
- [ ] Unauthenticated API returns 401
- [ ] Authenticated API returns data
- [ ] Admin-only API works for admin
- [ ] Admin-only API returns 403 for vendor
- [ ] New users get vendor role by default
- [ ] No JavaScript errors in console
- [ ] No Supabase errors in terminal

**If all checks pass: ✅ Authentication is working correctly!**

---

## Next Steps

1. **If tests pass:**
   - Review AUTH_SETUP_GUIDE.md for production deployment
   - Set environment variables on Vercel/deployment platform
   - Test on staging environment
   - Deploy to production

2. **If tests fail:**
   - Check error messages in console
   - Review AUTH_SETUP_GUIDE.md Troubleshooting section
   - Run `npm run validate:auth` again
   - Check database setup in Supabase

---

## Useful Links

- Auth Setup Guide: `AUTH_SETUP_GUIDE.md`
- Implementation Summary: `AUTHENTICATION_IMPLEMENTATION_SUMMARY.md`
- Supabase Console: https://supabase.com
- Next.js Docs: https://nextjs.org/docs
- Supabase Auth Docs: https://supabase.com/docs/guides/auth

---

**Test Date**: _______________  
**Tested By**: _______________  
**All Tests Passed**: ☐ Yes ☐ No

---
