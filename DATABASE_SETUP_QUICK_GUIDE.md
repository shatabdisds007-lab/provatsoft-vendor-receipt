# DATABASE SETUP QUICK GUIDE

**Date**: June 4, 2026  
**Applies To**: Supabase Production Database

---

## OPTION A: Run Complete Schema Script (Recommended)

### Step 1: Open Supabase SQL Editor
1. Go to https://supabase.com
2. Select your project (not local)
3. Go to SQL Editor (sidebar)
4. Click "New query"

### Step 2: Copy & Paste Complete Schema
1. Open file: `supabase/production-schema-complete.sql`
2. Copy entire content
3. Paste into Supabase SQL Editor
4. Click "Run" (green play button)

**Expected output**:
```
Schema creation complete

receipts
receipt_pdfs
email_logs
email_queue
subscriptions
rate_limits
system_error_logs
```

### Step 3: Verify Tables
```sql
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

Should show 7 tables created.

---

## OPTION B: Run Individual Migrations (Alternative)

If you prefer step-by-step:

### Step 1: Create Receipts Table
```bash
# Copy from: supabase/receipts.sql
# Paste in Supabase SQL Editor → Run
```

### Step 2: Create Receipt PDFs Table
```bash
# Copy from: supabase/receipt_pdfs.sql
# Paste in Supabase SQL Editor → Run
```

### Step 3: Create Email Queue Table
```bash
# Copy from: supabase/email_queue.sql
# Paste in Supabase SQL Editor → Run
```

### Step 4: Create Email Logs Table
```bash
# Copy from: supabase/email_logs.sql
# Paste in Supabase SQL Editor → Run
```

### Step 5: Create Subscriptions Table
```bash
# Copy from: supabase/subscriptions.sql
# Paste in Supabase SQL Editor → Run
```

### Step 6: Apply RLS Policies
```bash
# Copy from: supabase/migrations/2026-06-02_rls_vendor_tables.sql
# Paste in Supabase SQL Editor → Run
```

---

## OPTION C: Using Supabase CLI (If available)

```bash
# In project directory
supabase db push

# This applies all migrations in supabase/migrations/
```

---

## CREATE STORAGE BUCKET

### Via Supabase Console (GUI)

1. Go to Supabase Console
2. Click "Storage" (sidebar)
3. Click "Create New Bucket"
4. Name: `receipts`
5. Visibility: Private (requires auth)
6. Click "Create"

### Via SQL

Run in SQL Editor:
```sql
select storage.create_bucket('receipts', true);
```

---

## VERIFY SETUP IS COMPLETE

### Check Tables Exist
```sql
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

**Expected 7 tables**:
- email_logs ✓
- email_queue ✓
- rate_limits ✓
- receipt_pdfs ✓
- receipts ✓
- subscriptions ✓
- system_error_logs ✓

### Check RLS is Enabled
```sql
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY tablename;
```

**Expected**: All tables show `rowsecurity = true`

### Check Storage Bucket
1. Go to Supabase Console → Storage
2. Verify "receipts" bucket exists
3. Check permissions: Private (authenticated only)

---

## TROUBLESHOOTING

### Error: "Table already exists"
- This is OK if running complete script multiple times
- The script uses `CREATE TABLE IF NOT EXISTS`
- No data will be lost

### Error: "Extension uuid-ossp not found"
- Run: `CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`
- Then retry the full schema script

### Error: "RLS policies conflict"
- This is OK - the script checks `IF NOT EXISTS`
- Existing policies won't be recreated

### Tables exist but RLS not enabled?
- Run the migration: `supabase/migrations/2026-06-02_rls_vendor_tables.sql`
- This enables RLS on all tables

### Storage bucket won't be created?
- Try via GUI: Storage → Create New Bucket → `receipts`
- Or SQL: `select storage.create_bucket('receipts', true);`

---

## NEXT STEPS AFTER SETUP

1. ✅ Database schema created
2. ✅ Storage bucket created
3. ⏭️ **Create test user** in Supabase Auth
4. ⏭️ **Generate JWT token** for test user
5. ⏭️ **Test authenticated endpoints**
6. ⏭️ **Deploy to Vercel**

---

## QUICK CHECKLIST

- [ ] All 7 tables created
- [ ] RLS enabled on all tables
- [ ] "receipts" storage bucket exists
- [ ] Storage bucket is Private (authenticated)
- [ ] No errors in SQL execution
- [ ] Can SELECT from each table

---

## ESTIMATED TIME

| Step | Time |
|------|------|
| Copy-paste complete schema | 2 min |
| Run schema script | 1 min |
| Create storage bucket | 1 min |
| Verify setup | 2 min |
| **Total** | **~6 minutes** |

---

**Done? Proceed to PRODUCTION_DEPLOYMENT_CHECKLIST.md**
