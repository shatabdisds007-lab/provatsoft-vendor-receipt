-- File: 02_rls_verification_queries.sql
-- Purpose: RLS verification queries to run AFTER deploying RLS policies.
-- These queries test that policies enforce vendor isolation, admin access, and ownership checks.
-- NOTE: These queries should be run with different JWT claims to verify policy enforcement.

-- ===================================================================
-- TEST CONTEXT SETUP
-- ===================================================================
-- To test RLS policies, you need to run queries with different JWT contexts:
--
-- 1. VENDOR USER (normal vendor with role claim not set or role != 'admin')
--    - Set JWT claims: {"sub": "<vendor_uuid>", "role": "vendor"}
--    - Expected: can only see/modify own records
--
-- 2. ADMIN USER (admin with role claim = 'admin')
--    - Set JWT claims: {"sub": "<admin_uuid>", "role": "admin"}
--    - Expected: can see/modify all records
--
-- 3. OTHER VENDOR USER (different vendor)
--    - Set JWT claims: {"sub": "<other_vendor_uuid>", "role": "vendor"}
--    - Expected: cannot see records belonging to the first vendor

-- In Supabase Dashboard:
-- 1. Go to SQL Editor
-- 2. Switch the authorization context using the JWT editor
-- 3. Run each test query set below with the appropriate JWT claims
-- 4. Verify the results match expectations

-- ===================================================================
-- TEST 1: RECEIPTS TABLE ISOLATION
-- ===================================================================

-- 1.1: Vendor A should only see their own receipts
-- Run as: Vendor A with JWT claim {"sub": "vendor-a-uuid", "role": "vendor"}
-- Expected: Only receipts where vendor_id = 'vendor-a-uuid'
SELECT id, receipt_number, vendor_id, status
FROM public.receipts
ORDER BY created_at DESC;

-- 1.2: Vendor A should NOT see Vendor B's receipts
-- Run as: Vendor A; verify results do NOT include receipts where vendor_id = 'vendor-b-uuid'
-- Expected: 0 rows if results are properly filtered
SELECT COUNT(*) as vendor_b_visible_count
FROM public.receipts
WHERE vendor_id = 'vendor-b-uuid';

-- 1.3: Admin should see all receipts
-- Run as: Admin with JWT claim {"role": "admin"}
-- Expected: Receipts from all vendors visible
SELECT vendor_id, COUNT(*) as receipt_count
FROM public.receipts
GROUP BY vendor_id
ORDER BY receipt_count DESC;

-- 1.4: Vendor cannot insert receipt with different vendor_id
-- Run as: Vendor A; attempt this insert (should fail with RLS error):
-- INSERT INTO public.receipts (vendor_id, receipt_number, template_id, status, company_data, customer_data, payment_data, additional_data, amount, currency)
-- VALUES ('vendor-b-uuid', 'TEST-001', 'test', 'draft', '{}', '{}', '{}', '{}', 0, 'INR');
-- Expected: RLS policy violation error (permission denied)

-- 1.5: Vendor can update their own draft receipt
-- Run as: Vendor A; update their draft receipt (should succeed):
-- UPDATE public.receipts SET status = 'draft' WHERE id = '<vendor-a-draft-receipt-id>';
-- Expected: 1 row updated

-- 1.6: Vendor CANNOT update their own finalized receipt
-- Run as: Vendor A; attempt to update finalized (should fail):
-- UPDATE public.receipts SET status = 'draft' WHERE id = '<vendor-a-finalized-receipt-id>';
-- Expected: 0 rows updated (policy blocks it)

-- 1.7: Vendor CANNOT delete finalized receipt
-- Run as: Vendor A; attempt to delete finalized (should fail):
-- DELETE FROM public.receipts WHERE id = '<vendor-a-finalized-receipt-id>';
-- Expected: 0 rows deleted (policy blocks it)

-- 1.8: Vendor CAN delete their own draft receipt
-- Run as: Vendor A; delete draft (should succeed):
-- DELETE FROM public.receipts WHERE id = '<vendor-a-draft-receipt-id>';
-- Expected: 1 row deleted

-- 1.9: Admin CAN update finalized receipt
-- Run as: Admin; update finalized (should succeed):
-- UPDATE public.receipts SET status = 'draft' WHERE id = '<vendor-a-finalized-receipt-id>';
-- Expected: 1 row updated

-- ===================================================================
-- TEST 2: RECEIPT_PDFS TABLE ISOLATION
-- ===================================================================

-- 2.1: Vendor A should see their own PDFs
-- Run as: Vendor A
-- Expected: Only PDFs where vendor_id = 'vendor-a-uuid'
SELECT id, receipt_number, vendor_id
FROM public.receipt_pdfs
WHERE vendor_id = (SELECT auth.uid()::text)
ORDER BY created_at DESC;

-- 2.2: Vendor A should see PDFs linked to their receipts
-- Run as: Vendor A
-- Expected: PDFs linked to receipts belonging to Vendor A
SELECT p.id, p.receipt_number, p.receipt_id, r.vendor_id
FROM public.receipt_pdfs p
JOIN public.receipts r ON p.receipt_id = r.id
ORDER BY p.created_at DESC;

-- 2.3: Vendor A should NOT see Vendor B's PDFs
-- Run as: Vendor A
-- Expected: 0 rows
SELECT COUNT(*) as vendor_b_pdf_count
FROM public.receipt_pdfs
WHERE vendor_id = 'vendor-b-uuid';

-- 2.4: Admin should see all PDFs
-- Run as: Admin
-- Expected: PDFs from all vendors visible
SELECT vendor_id, COUNT(*) as pdf_count
FROM public.receipt_pdfs
GROUP BY vendor_id
ORDER BY pdf_count DESC;

-- 2.5: Vendor cannot insert PDF with different vendor_id
-- Run as: Vendor A; attempt this insert (should fail):
-- INSERT INTO public.receipt_pdfs (vendor_id, receipt_number, pdf_url, file_name)
-- VALUES ('vendor-b-uuid', 'TEST-PDF-001', 'https://example.com/test.pdf', 'test.pdf');
-- Expected: RLS policy violation error

-- 2.6: Vendor can insert PDF with their own vendor_id
-- Run as: Vendor A; insert PDF (should succeed):
-- INSERT INTO public.receipt_pdfs (vendor_id, receipt_number, pdf_url, file_name)
-- VALUES (auth.uid(), 'VENDOR-A-PDF-001', 'https://example.com/test.pdf', 'test.pdf');
-- Expected: 1 row inserted

-- ===================================================================
-- TEST 3: EMAIL_LOGS TABLE ISOLATION
-- ===================================================================

-- 3.1: Vendor A should only see email logs for their own records
-- Run as: Vendor A
-- Expected: Email logs where vendor_id = 'vendor-a-uuid' OR receipt belongs to Vendor A
SELECT id, receipt_number, vendor_id, recipient_email
FROM public.email_logs
ORDER BY created_at DESC;

-- 3.2: Vendor A should NOT see Vendor B's email logs
-- Run as: Vendor A
-- Expected: 0 rows
SELECT COUNT(*) as vendor_b_email_count
FROM public.email_logs
WHERE vendor_id = 'vendor-b-uuid';

-- 3.3: Admin should see all email logs
-- Run as: Admin
-- Expected: Email logs from all vendors visible
SELECT vendor_id, COUNT(*) as email_count
FROM public.email_logs
GROUP BY vendor_id
ORDER BY email_count DESC;

-- ===================================================================
-- TEST 4: EMAIL_QUEUE TABLE ISOLATION
-- ===================================================================

-- 4.1: Vendor A should only see email queue entries for themselves
-- Run as: Vendor A (where user_id in JWT = vendor-a-uuid)
-- Expected: Queue entries where user_id = 'vendor-a-uuid'
SELECT id, recipient_email, user_id, status
FROM public.email_queue
ORDER BY created_at DESC;

-- 4.2: Vendor A should NOT see Vendor B's email queue entries
-- Run as: Vendor A
-- Expected: 0 rows
SELECT COUNT(*) as vendor_b_queue_count
FROM public.email_queue
WHERE user_id = 'vendor-b-uuid';

-- 4.3: Admin should see all email queue entries
-- Run as: Admin
-- Expected: Queue entries from all users visible
SELECT user_id, COUNT(*) as queue_count
FROM public.email_queue
GROUP BY user_id
ORDER BY queue_count DESC;

-- 4.4: Vendor can insert queue entry for themselves
-- Run as: Vendor A; insert (should succeed):
-- INSERT INTO public.email_queue (user_id, recipient_email, subject, body)
-- VALUES (auth.uid(), 'test@example.com', 'Test', '{}');
-- Expected: 1 row inserted

-- 4.5: Vendor cannot insert queue entry for different user
-- Run as: Vendor A; attempt insert (should fail):
-- INSERT INTO public.email_queue (user_id, recipient_email, subject, body)
-- VALUES ('vendor-b-uuid', 'test@example.com', 'Test', '{}');
-- Expected: RLS policy violation error

-- ===================================================================
-- TEST 5: RATE_LIMITS TABLE ISOLATION
-- ===================================================================

-- 5.1: Vendor A should only see rate limit entries for themselves
-- Run as: Vendor A
-- Expected: Rate limit entries where user_id = 'vendor-a-uuid'
SELECT id, user_id, route, request_count
FROM public.rate_limits
ORDER BY created_at DESC;

-- 5.2: Vendor A should NOT see Vendor B's rate limit entries
-- Run as: Vendor A
-- Expected: 0 rows
SELECT COUNT(*) as vendor_b_rate_count
FROM public.rate_limits
WHERE user_id = 'vendor-b-uuid';

-- 5.3: Admin should see all rate limit entries
-- Run as: Admin
-- Expected: Rate limit entries from all users visible
SELECT user_id, COUNT(*) as rate_count
FROM public.rate_limits
GROUP BY user_id
ORDER BY rate_count DESC;

-- ===================================================================
-- TEST 6: SYSTEM_ERROR_LOGS TABLE ISOLATION
-- ===================================================================

-- 6.1: Vendor A should only see system error logs for themselves
-- Run as: Vendor A
-- Expected: Error logs where user_id = 'vendor-a-uuid' (or user_id IS NULL for system-wide errors)
SELECT id, user_id, error_type
FROM public.system_error_logs
WHERE user_id IS NULL OR user_id::text = auth.uid()
ORDER BY created_at DESC;

-- 6.2: Vendor A should NOT see Vendor B's error logs
-- Run as: Vendor A
-- Expected: 0 rows
SELECT COUNT(*) as vendor_b_error_count
FROM public.system_error_logs
WHERE user_id IS NOT NULL AND user_id::text != auth.uid();

-- 6.3: Admin should see all error logs
-- Run as: Admin
-- Expected: Error logs from all users visible (including system-wide)
SELECT user_id, COUNT(*) as error_count
FROM public.system_error_logs
GROUP BY user_id
ORDER BY error_count DESC;

-- ===================================================================
-- TEST SUMMARY DASHBOARD
-- ===================================================================

-- After running all tests, use this query to summarize RLS enforcement:
-- Run as: Admin (to get full visibility)
-- Expected: Shows record counts by table and ownership distribution

SELECT
  'receipts' as table_name,
  COUNT(*) as total_rows,
  COUNT(DISTINCT vendor_id) as unique_owners,
  MIN(created_at) as oldest_record,
  MAX(created_at) as newest_record
FROM public.receipts
UNION ALL
SELECT
  'receipt_pdfs' as table_name,
  COUNT(*) as total_rows,
  COUNT(DISTINCT vendor_id) as unique_owners,
  MIN(created_at) as oldest_record,
  MAX(created_at) as newest_record
FROM public.receipt_pdfs
UNION ALL
SELECT
  'email_logs' as table_name,
  COUNT(*) as total_rows,
  COUNT(DISTINCT vendor_id) as unique_owners,
  MIN(created_at) as oldest_record,
  MAX(created_at) as newest_record
FROM public.email_logs
UNION ALL
SELECT
  'email_queue' as table_name,
  COUNT(*) as total_rows,
  COUNT(DISTINCT user_id) as unique_owners,
  MIN(created_at) as oldest_record,
  MAX(created_at) as newest_record
FROM public.email_queue
UNION ALL
SELECT
  'rate_limits' as table_name,
  COUNT(*) as total_rows,
  COUNT(DISTINCT user_id) as unique_owners,
  MIN(created_at) as oldest_record,
  MAX(created_at) as newest_record
FROM public.rate_limits
UNION ALL
SELECT
  'system_error_logs' as table_name,
  COUNT(*) as total_rows,
  COUNT(DISTINCT user_id) as unique_owners,
  MIN(created_at) as oldest_record,
  MAX(created_at) as newest_record
FROM public.system_error_logs;

-- ===================================================================
-- INSTRUCTIONS FOR VERIFICATION
-- ===================================================================
--
-- STEP 1: Prepare test user accounts (in Supabase Auth)
--   - Create Vendor A user with ID: vendor-a-uuid (replace with real UUID)
--   - Create Vendor B user with ID: vendor-b-uuid (replace with real UUID)
--   - Create Admin user with ID: admin-uuid (replace with real UUID)
--   - Assign Vendor A some receipts/PDFs/logs (use test data)
--   - Assign Vendor B some receipts/PDFs/logs (use test data)
--
-- STEP 2: Test in Supabase Dashboard SQL Editor
--   - For each test set, switch JWT context using the dashboard editor
--   - Run the corresponding query and verify result
--   - Document results in a verification matrix (see table below)
--
-- STEP 3: Verification Matrix (to be filled after testing)
--   Test ID | JWT Role | Expected Result | Actual Result | Pass/Fail
--   --------|----------|-----------------|---------------|----------
--   1.1     | vendor-a | Own receipts     | [run query]   | [result]
--   1.2     | vendor-a | No vendor-b data | [run query]   | [result]
--   1.3     | admin    | All receipts     | [run query]   | [result]
--   ... (repeat for all tests)
--
-- STEP 4: If any tests FAIL
--   - Review policy SQL in migration file
--   - Check JWT claims are being set correctly
--   - Verify auth.uid() is returning expected user ID
--   - Contact Supabase support if RLS behavior is unexpected
--
-- STEP 5: If all tests PASS
--   - Document pass date and tester name
--   - Proceed to production deployment
--   - Enable monitoring for RLS-related errors
