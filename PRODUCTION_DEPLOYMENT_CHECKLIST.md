# PRODUCTION DEPLOYMENT CHECKLIST

**Date**: June 4, 2026  
**Target**: Vercel + Supabase Production  
**Status**: Ready for review

---

## SECTION 1: ENVIRONMENT VARIABLES

### Required Variables (Must be set before deployment)

```env
# Supabase (Public - safe to expose in browser)
NEXT_PUBLIC_SUPABASE_URL=https://rrxhqelzarshilqunzta.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_x65etvp4kHeTZf02iEiw9Q_hEYwNjSM

# Supabase (Server-only - NEVER expose to client)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_JWT_SECRET=your-jwt-secret-key
SUPABASE_JWT_ISSUER=https://rrxhqelzarshilqunzta.supabase.co

# Email Provider
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxx

# Optional: Admin user for testing
ADMIN_USER_ID=11111111-1111-1111-1111-111111111111
```

### Vercel Setup Steps

1. **Go to Vercel Dashboard**
   - Select your project (provatsoft-vendor-receipt)
   - Go to Settings → Environment Variables

2. **Add Variables**
   ```
   NEXT_PUBLIC_SUPABASE_URL = [from Supabase console]
   NEXT_PUBLIC_SUPABASE_ANON_KEY = [from Supabase console]
   SUPABASE_SERVICE_ROLE_KEY = [from Supabase console] (hidden)
   SUPABASE_JWT_SECRET = [from Supabase console] (hidden)
   SUPABASE_JWT_ISSUER = [same as NEXT_PUBLIC_SUPABASE_URL]
   RESEND_API_KEY = [from Resend dashboard] (hidden)
   ```

3. **Mark as Secret**
   - ✓ SUPABASE_SERVICE_ROLE_KEY
   - ✓ SUPABASE_JWT_SECRET
   - ✓ RESEND_API_KEY

4. **Verify in Vercel**
   - Public vars show in "Environment Variables" tab
   - Secret vars show as [Protected]

---

## SECTION 2: SUPABASE SETUP

### Database Tables (Must exist)

- [ ] `receipts` - Receipt documents
- [ ] `receipt_pdfs` - PDF metadata and storage refs
- [ ] `email_logs` - Email sending history
- [ ] `email_queue` - Pending emails queue
- [ ] `subscriptions` - User subscription tiers
- [ ] `rate_limits` - Rate limiting per user
- [ ] `system_error_logs` - System error tracking

### Setup Steps

1. **Run Migrations**
   ```bash
   # In your local Supabase project directory
   supabase migration up
   ```

2. **Or manually create tables**
   ```sql
   -- Copy SQL from supabase/*.sql files
   -- Execute in Supabase SQL Editor (Production database)
   ```

3. **Enable Row-Level Security (RLS)**
   ```bash
   supabase migration up
   # Or manually run: supabase/migrations/2026-06-02_rls_vendor_tables.sql
   ```

4. **Verify Tables Exist**
   ```sql
   SELECT table_name FROM information_schema.tables 
   WHERE table_schema = 'public';
   ```

   Expected output:
   ```
   receipts
   receipt_pdfs
   email_logs
   email_queue
   subscriptions
   rate_limits
   system_error_logs
   ```

### Storage Bucket Setup

1. **Create "receipts" Bucket**
   - Go to Supabase Console → Storage
   - Click "Create New Bucket"
   - Name: `receipts`
   - Visibility: Private (require auth)

2. **Upload Policies**
   ```
   - Authenticated users can upload to their own folder
   - Authenticated users can download all receipts
   - Admin can upload/delete anywhere
   ```

3. **Or use SQL**
   ```sql
   select storage.create_bucket('receipts', true);
   ```

### RLS Policies (Production Security)

- [ ] Receipts table has RLS enabled
- [ ] Receipt_pdfs table has RLS enabled
- [ ] Email_logs table has RLS enabled
- [ ] Email_queue table has RLS enabled
- [ ] All policies use `vendor_id` and JWT claims for authorization

**Important**: RLS must be enabled to prevent users from accessing other users' data.

---

## SECTION 3: EMAIL DELIVERY (RESEND)

### Setup Steps

1. **Get Resend API Key**
   - Go to https://resend.com
   - Create account or sign in
   - Go to API Keys section
   - Copy your API key

2. **Add to Vercel**
   ```
   RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxx
   ```

3. **Verify Domain (Optional but Recommended)**
   - In Resend: Domains → Add Domain
   - Add your custom domain (e.g., noreply@yourdomain.com)
   - Verify DNS records
   - Use custom domain in email sends

4. **Test Email Sending**
   ```bash
   npm run test:e2e
   # Test endpoint: POST /api/email/process-queue
   ```

---

## SECTION 4: API ROUTES (All Configured)

| Route | Method | Auth | Purpose | Status |
|-------|--------|------|---------|--------|
| `/api/health/supabase` | GET | No | System health check | ✓ Ready |
| `/api/pdf/render` | POST | No | Generate PDF | ✓ Ready |
| `/api/pdf/save` | POST | Yes | Save PDF to Supabase | ✓ Ready |
| `/api/email/send` | POST | Yes | Send email | ✓ Ready |
| `/api/email/queue` | POST | Yes | Queue email job | ✓ Ready |
| `/api/email/process-queue` | POST | Admin | Process queued emails | ✓ Ready |

All routes have `export const runtime = 'nodejs'` set for Node.js execution.

---

## SECTION 5: DEPLOYMENT TO VERCEL

### Step-by-Step

1. **Ensure Git is up to date**
   ```bash
   git add .
   git commit -m "Production deployment"
   git push origin main
   ```

2. **Connect to Vercel** (if not already connected)
   ```bash
   vercel link
   ```

3. **Set production environment variables**
   - Vercel Dashboard → Project → Settings → Environment Variables
   - Add all variables from SECTION 1
   - Ensure "Production" environment is selected

4. **Deploy**
   ```bash
   vercel deploy --prod
   ```

5. **Verify Deployment**
   - Check Vercel deployment logs (no errors)
   - Test health endpoint: `https://your-domain.vercel.app/api/health/supabase`
   - Should return: `{"status":"ok","message":"Supabase is accessible..."}`

---

## SECTION 6: POST-DEPLOYMENT VERIFICATION

### Immediate Checks (After deployment)

- [ ] Health check returns 200: `GET /api/health/supabase`
- [ ] PDF render works: `POST /api/pdf/render` (test with sample data)
- [ ] Protected routes reject unauthenticated access (401)
- [ ] Vercel logs show no startup errors
- [ ] Environment variables are loaded correctly

### Functional Tests

- [ ] Create test user in Supabase Auth
- [ ] Generate JWT token for test user
- [ ] Test `/api/pdf/save` with valid token → PDF saved to Supabase
- [ ] Test `/api/email/send` with valid token → Email queued
- [ ] Verify email arrives via Resend
- [ ] Test `/api/receipts/history` → Returns user's receipts

### Production Monitoring

- [ ] Set up error tracking (Sentry, LogRocket, etc.)
- [ ] Monitor Vercel logs for runtime errors
- [ ] Monitor Supabase for DB connection issues
- [ ] Monitor Resend for failed emails

---

## SECTION 7: VERIFICATION SCRIPTS

### Run Local Validation
```bash
# Check all production requirements
node scripts/validate-production-readiness.js
```

### Run End-to-End Tests
```bash
# Start dev server
npm run dev

# In another terminal
node scripts/test-e2e.js
```

### Database Verification
```sql
-- Run in Supabase SQL Editor
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

---

## SECTION 8: TROUBLESHOOTING

### Issue: "SUPABASE_SERVICE_ROLE_KEY missing"
- **Cause**: Environment variable not set in Vercel
- **Fix**: Go to Vercel → Settings → Environment Variables → Add SUPABASE_SERVICE_ROLE_KEY

### Issue: "Cannot find the table 'receipts'"
- **Cause**: Database migration not applied
- **Fix**: Run `supabase migration up` in your Supabase project

### Issue: "Email not sending"
- **Cause**: RESEND_API_KEY invalid or email queue not processing
- **Fix**: Verify API key in Resend dashboard, check Vercel logs

### Issue: "401 Unauthorized on protected routes"
- **Cause**: No JWT token provided or JWT invalid
- **Fix**: Generate valid JWT from Supabase Auth, include in Authorization header

### Issue: "CORS errors on frontend"
- **Cause**: Frontend not sending correct headers
- **Fix**: Verify middleware allows cross-origin requests

---

## SECTION 9: FINAL CHECKLIST BEFORE GOING LIVE

### Code
- [ ] All API routes have `export const runtime = 'nodejs'`
- [ ] No console.log debugging left in production code
- [ ] Error handling is clean and user-friendly
- [ ] Authentication middleware is working
- [ ] RLS policies are in place

### Infrastructure
- [ ] All environment variables set in Vercel
- [ ] Supabase database migration complete
- [ ] Storage bucket "receipts" created and accessible
- [ ] Resend API key valid and configured
- [ ] Domain DNS (if custom domain used)

### Testing
- [ ] Validation script passes: `node scripts/validate-production-readiness.js`
- [ ] E2E tests pass: `node scripts/test-e2e.js`
- [ ] Manual test: PDF generation works
- [ ] Manual test: Protected routes enforce auth
- [ ] Manual test: Health check returns 200

### Documentation
- [ ] This checklist completed
- [ ] Environment variables documented (secure)
- [ ] Deployment steps documented
- [ ] Troubleshooting guide available
- [ ] On-call runbook prepared

### Security
- [ ] Service role key NEVER exposed to client
- [ ] JWT secret stored securely
- [ ] RLS prevents data leaks
- [ ] Rate limiting enabled
- [ ] CORS properly configured

---

## DEPLOYMENT SIGN-OFF

| Item | Status | Verified By | Date |
|------|--------|-------------|------|
| Code Review | ⏳ Pending | - | - |
| Database Ready | ⏳ Pending | - | - |
| Email Ready | ⏳ Pending | - | - |
| Tests Passing | ⏳ Pending | - | - |
| Security Audit | ⏳ Pending | - | - |

---

## SUPPORT & CONTACTS

**Supabase Support**: https://supabase.com/support  
**Resend Support**: https://resend.com/support  
**Vercel Support**: https://vercel.com/support  

**On-Call**: [Your contact info]  
**Documentation**: [Your docs URL]

---

**Version**: 1.0  
**Last Updated**: June 4, 2026  
**Ready to Deploy**: Yes ✓
