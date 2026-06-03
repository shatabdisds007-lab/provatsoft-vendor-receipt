-- File: 03_staging_deployment_checklist.sql
-- Purpose: Step-by-step checklist for deploying RLS migrations to staging environment.
-- This is a manual process; follow each step in order.

-- ===================================================================
-- PRE-DEPLOYMENT: BACKUP & VALIDATION (Day -1)
-- ===================================================================

-- Step 1: Backup entire staging database
-- Method: Supabase Dashboard > Backups > Create backup
-- Action: Click "Create backup now" and wait for completion
-- Expected: Backup created and listed with timestamp
-- Document: Backup ID and timestamp for rollback reference

-- Step 2: Export current schema
-- Method: Run in Supabase SQL Editor as service role
-- Query: SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public';
SELECT count(*) as public_table_count
FROM information_schema.tables 
WHERE table_schema = 'public';
-- Expected: Shows current table count (should be ~8 including system tables)
-- Document: Output for comparison post-migration

-- Step 3: Run all data validation queries from 01_data_validation_queries.sql
-- Method: Copy each query from validation file and run in SQL Editor
-- Expected: 0 rows returned for all queries
-- Action: 
--   - If any query returns rows: STOP and remediate data issues
--   - Do NOT proceed to next step until all validation queries return 0 rows
--   - Document any data issues and remediation steps applied

-- Step 4: Snapshot auth.users table (for reference during RLS testing)
-- Method: Export user list for JWT claim generation during testing
-- Query:
SELECT id, email, created_at, user_metadata
FROM auth.users
ORDER BY created_at;
-- Expected: Shows all current users
-- Action: Save result to file for use in RLS verification tests

-- Step 5: Document current RLS state
-- Method: Check if RLS is already enabled on any tables
-- Query:
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('receipts', 'receipt_pdfs', 'email_logs', 'email_queue', 'rate_limits', 'system_error_logs')
ORDER BY tablename;
-- Expected: All should show rowsecurity = false (RLS disabled)
-- Action: If any show true, note that and adjust migration strategy

-- ===================================================================
-- DEPLOYMENT: MIGRATION APPLICATION (Day 0, during maintenance window)
-- ===================================================================

-- Step 6: Schedule maintenance window (1-2 hours minimum)
-- Action: Notify all users of upcoming downtime
-- Communication: Email all admins/vendors about RLS deployment
-- Expected downtime: 30-60 minutes (during migration run)

-- Step 7: Stop application API servers
-- Method: Disable API routes or suspend Next.js processes
-- Action: Kill all running instances of the app (or pause via CI/CD)
-- Expected: All API requests return 503 Service Unavailable

-- Step 8: Apply migration UP section
-- Method: Copy the entire UP section from migration file into Supabase SQL Editor
-- Source: supabase/migrations/2026-06-02_rls_vendor_tables.sql (the first UP section)
-- Action:
--   - Paste entire UP section into Supabase SQL Editor
--   - Click Execute
--   - Wait for all statements to complete
-- Expected: No errors; policies created successfully
-- Error handling:
--   - If "policy already exists" error: this is OK (idempotent via DO IF NOT EXISTS blocks)
--   - If other errors: document error message and ROLLBACK (use DOWN section)

-- Step 9: Verify policies were created
-- Method: Query pg_policies to confirm all policies exist
-- Query:
SELECT schemaname, tablename, policyname, qual, with_check
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN ('receipts', 'receipt_pdfs', 'email_logs', 'email_queue', 'rate_limits', 'system_error_logs')
ORDER BY tablename, policyname;
-- Expected: 24 policies total (4 per table for CRUD, minus system_error_logs which is 3)
-- Action:
--   - Count rows and verify = 24
--   - Check that all table names match expected list
--   - If count < 24: investigate missing policies and re-run UP section

-- Step 10: Verify RLS is enabled on all target tables
-- Method: Query pg_tables again
-- Query:
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('receipts', 'receipt_pdfs', 'email_logs', 'email_queue', 'rate_limits', 'system_error_logs')
ORDER BY tablename;
-- Expected: All should show rowsecurity = true (RLS enabled)
-- Action:
--   - Verify all 6 tables show true
--   - If any show false: RLS was not properly enabled; investigate

-- Step 11: Test basic application connectivity (API level)
-- Method: Make test API request from app to Supabase (without full auth)
-- Action: Use Postman or curl to hit health check endpoint
--   curl -X GET https://your-app-domain/api/health
-- Expected: Response shows DB/storage/email status
-- Action:
--   - If health check fails: RLS may be blocking admin client; check admin credentials
--   - If health check passes: proceed to next step

-- ===================================================================
-- VERIFICATION: RLS TESTING (Day 0, after policies deployed)
-- ===================================================================

-- Step 12: Prepare test JWT tokens
-- Method: Generate JWT tokens for testing
-- Tool: Use Supabase Dashboard > SQL Editor > JWT Generator or jwt.io
-- Tokens needed (replace UUIDs with real IDs from Step 4):
--   - Vendor A token: {"sub": "vendor-a-uuid", "role": "vendor"}
--   - Vendor B token: {"sub": "vendor-b-uuid", "role": "vendor"}
--   - Admin token: {"sub": "admin-uuid", "role": "admin"}
-- Action: Save tokens to a secure file for testing

-- Step 13: Run RLS verification tests (from 02_rls_verification_queries.sql)
-- Method: 
--   1. Open Supabase SQL Editor
--   2. Click Authorization context selector at top
--   3. Switch to Vendor A token
--   4. Run tests from section "TEST 1: RECEIPTS TABLE ISOLATION"
-- Action:
--   - Test 1.1: Should see only Vendor A's receipts
--   - Test 1.2: Should see 0 rows for Vendor B
--   - Test 1.3 (run as Admin): Should see all receipts
--   - Repeat for all tests in verification file
-- Expected results by JWT role:
--   - Vendor: Can see only own records, cannot see other vendors' data
--   - Admin: Can see all records from all vendors
-- Error handling:
--   - If Vendor sees Vendor B data: ROLLBACK immediately (RLS not working)
--   - If Admin cannot see all data: ROLLBACK immediately (admin policy broken)

-- Step 14: Test application API with authenticated requests
-- Method: Make authenticated API requests using test tokens
-- Tool: Postman with Bearer token or curl
-- Test requests:
--   - GET /api/receipts (as Vendor A): should return only Vendor A receipts
--   - GET /api/receipts (as Admin): should return all receipts
--   - POST /api/receipts (as Vendor A with vendor_id = Vendor B): should FAIL
-- Expected:
--   - Vendor A sees only their data
--   - Admin sees all data
--   - Cross-vendor writes are blocked (403 Forbidden)
-- Action:
--   - Document results in verification matrix
--   - If any test fails: ROLLBACK and investigate

-- Step 15: Monitor error logs for RLS violations
-- Method: Check system_error_logs for "permission denied" errors
-- Query:
SELECT error_type, message, count(*) as error_count
FROM public.system_error_logs
WHERE created_at > NOW() - INTERVAL '1 hour'
GROUP BY error_type, message
ORDER BY error_count DESC;
-- Expected: 0 rows or only expected RLS test violations
-- Action:
--   - If errors present: review application logs to understand context
--   - If permissions errors are from app code: app may not be using service role correctly

-- ===================================================================
-- VERIFICATION: ROLLBACK TEST (Day 0, optional but recommended)
-- ===================================================================

-- Step 16: Test rollback procedure (OPTIONAL but recommended)
-- Method: Verify DOWN section of migration works
-- Action:
--   1. Create test snapshot of a few records
--   2. Run DOWN section (drop policies, disable RLS)
--   3. Verify RLS is disabled
--   4. Test that records are still accessible
--   5. Re-apply UP section to confirm it's idempotent
-- Purpose: Ensure rollback path is verified before production
-- Expected: Rollback succeeds, can re-enable policies without error

-- ===================================================================
-- POST-DEPLOYMENT: MONITORING & CUTOVER (Day 0-1)
-- ===================================================================

-- Step 17: Restart application servers
-- Method: Restart all Next.js instances
-- Action: Deploy app with no code changes (just restart)
-- Expected: App connects to DB successfully with RLS enabled
-- Verify: Check application logs for RLS-related errors

-- Step 18: Monitor application for RLS errors (first 24 hours)
-- Method: Set up alerts on system_error_logs for "permission denied" errors
-- Query to monitor:
SELECT error_type, COUNT(*) as error_count, MAX(created_at) as latest
FROM public.system_error_logs
WHERE error_type LIKE '%permission%' OR error_type LIKE '%RLS%'
AND created_at > NOW() - INTERVAL '24 hours'
GROUP BY error_type
ORDER BY error_count DESC;
-- Expected: 0 errors (or only expected admin operations)
-- Action:
--   - If errors spike: investigate app code for incorrect claims/auth logic
--   - If specific routes fail: check if admin client is using service role key

-- Step 19: Verify application functionality (smoke tests)
-- Method: Run full integration test suite
-- Tests:
--   1. Create receipt as Vendor A -> verify created
--   2. List receipts as Vendor A -> verify only own receipts
--   3. Generate PDF and save -> verify linked to receipt
--   4. Send email -> verify logged with receipt_id
--   5. Check email queue -> verify only own queue entries visible
-- Expected: All tests pass
-- Action: Document test results and pass/fail status

-- Step 20: Performance sanity check (optional)
-- Method: Monitor query performance with RLS enabled
-- Query: Check slow query log for RLS-related slowdowns
--   (Supabase Dashboard > Logs > Slow Queries)
-- Expected: Query execution times similar to pre-RLS (RLS adds minimal overhead)
-- Action:
--   - If significant slowdown: review policy JOIN logic
--   - Add indexes if needed (consult with DBA)

-- Step 21: Document migration success
-- Method: Create migration log entry
-- Info to document:
--   - Deployment date/time
--   - Migration version: 2026-06-02_rls_vendor_tables.sql
--   - Backup ID (from Step 1)
--   - All verification test results (from Step 13)
--   - Any issues encountered and resolution
--   - Tester name and approval
-- Action: Archive documentation in wiki/confluence for future reference

-- ===================================================================
-- ROLLBACK PROCEDURE (if needed)
-- ===================================================================

-- Step 22: EMERGENCY ROLLBACK (if RLS breaks app)
-- Prerequisites:
--   - Application is experiencing permission denied errors
--   - Verification tests have failed
--   - Cannot diagnose issue within 30 minutes
--
-- Action:
--   1. Stop application servers (prevent cascading failures)
--   2. Run DOWN section of migration (below)
--   3. Verify RLS disabled: rowsecurity = false for all tables
--   4. Restart application servers
--   5. Verify application functionality
--   6. Create incident report with error details
--   7. Schedule post-mortem meeting

-- DOWN SECTION: Run these statements to rollback RLS
-- NOTE: This is from the migration file; copy entire block below

-- Rollback: DROP all policies and DISABLE RLS (from 2026-06-02_rls_vendor_tables.sql)
-- Copy from migration file DOWN section and execute in SQL Editor

-- ===================================================================
-- CONTINGENCY: DATA RECOVERY
-- ===================================================================

-- Step 23: If data corruption occurs
-- Method: Restore from backup created in Step 1
-- Action:
--   1. Go to Supabase Dashboard > Backups
--   2. Find backup from Step 1 (by timestamp)
--   3. Click "Restore" and confirm
--   4. Wait for restore to complete (5-15 min)
--   5. Verify data integrity after restore
-- Expected: Database returns to pre-migration state
-- Warning: This will overwrite any production changes made since backup

-- ===================================================================
-- MIGRATION SIGN-OFF
-- ===================================================================

-- Deployment completed and verified by: _____________________ (Name)
-- Date: _____________________ (YYYY-MM-DD)
-- Time: _____________________ (HH:MM UTC)
-- Staging environment: _____________________ (URL)
-- 
-- All verification tests: [PASSED / FAILED]
-- Issues encountered: [NONE / describe]
-- Rollback tested: [YES / NO]
-- 
-- Approval for production deployment: [APPROVED / PENDING]
-- Approver: _____________________ (Name)
-- Date: _____________________ (YYYY-MM-DD)

-- ===================================================================
-- END OF DEPLOYMENT CHECKLIST
-- ===================================================================
