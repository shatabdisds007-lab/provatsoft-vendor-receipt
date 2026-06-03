-- File: 01_data_validation_queries.sql
-- Purpose: Data validation queries to run BEFORE deploying RLS policies.
-- These queries detect orphaned rows, invalid values, and data integrity issues.
-- Run all queries below and review results for any rows; if found, data cleanup is required.

-- ===================================================================
-- RECEIPTS TABLE VALIDATION
-- ===================================================================

-- 1.1: Check for NULL vendor_id in receipts
-- Expected: 0 rows (all receipts must have vendor_id)
SELECT id, receipt_number, vendor_id, created_at
FROM public.receipts
WHERE vendor_id IS NULL
ORDER BY created_at DESC;

-- 1.2: Check for invalid status values in receipts
-- Expected: 0 rows (only 'draft' or 'finalized' allowed)
SELECT id, receipt_number, status, vendor_id, created_at
FROM public.receipts
WHERE status NOT IN ('draft', 'finalized')
ORDER BY created_at DESC;

-- 1.3: Check for duplicate receipt_number values
-- Expected: 0 rows (receipt_number should be unique)
SELECT receipt_number, COUNT(*) as count, array_agg(id) as ids
FROM public.receipts
GROUP BY receipt_number
HAVING COUNT(*) > 1
ORDER BY count DESC;

-- 1.4: Check for receipts referencing non-existent users (vendor_id not in auth.users)
-- Note: Requires access to auth schema; may return results if users were deleted
-- Expected: 0 rows
SELECT r.id, r.receipt_number, r.vendor_id, r.created_at
FROM public.receipts r
LEFT JOIN auth.users u ON r.vendor_id = u.id
WHERE u.id IS NULL
ORDER BY r.created_at DESC;

-- 1.5: Check for receipts with orphaned pdf_id (pdf exists but receipt doesn't reference it correctly)
-- Expected: 0 rows (if pdf_id is set, corresponding receipt_pdfs row should exist)
SELECT DISTINCT r.id, r.receipt_number, r.pdf_id
FROM public.receipts r
LEFT JOIN public.receipt_pdfs p ON r.pdf_id = p.id
WHERE r.pdf_id IS NOT NULL AND p.id IS NULL
ORDER BY r.created_at DESC;

-- ===================================================================
-- RECEIPT_PDFS TABLE VALIDATION
-- ===================================================================

-- 2.1: Check for NULL vendor_id in receipt_pdfs
-- Expected: 0 rows (all PDFs must have vendor_id for ownership)
SELECT id, receipt_number, vendor_id, created_at
FROM public.receipt_pdfs
WHERE vendor_id IS NULL
ORDER BY created_at DESC;

-- 2.2: Check for duplicate receipt_number in receipt_pdfs
-- Note: This may be expected if multiple PDFs per receipt number exist; review context
-- Expected: Depends on business logic; flag for review if > 1 per receipt_number
SELECT receipt_number, COUNT(*) as count, array_agg(id) as ids
FROM public.receipt_pdfs
GROUP BY receipt_number
HAVING COUNT(*) > 1
ORDER BY count DESC;

-- 2.3: Check for receipt_pdfs referencing non-existent receipts via receipt_id
-- Expected: 0 rows (if receipt_id is set, it must exist in receipts table)
SELECT p.id, p.receipt_number, p.receipt_id, p.vendor_id
FROM public.receipt_pdfs p
LEFT JOIN public.receipts r ON p.receipt_id = r.id
WHERE p.receipt_id IS NOT NULL AND r.id IS NULL
ORDER BY p.created_at DESC;

-- 2.4: Check for receipt_pdfs with mismatched vendor_id vs linked receipt vendor_id
-- Expected: 0 rows (if pdf is linked to a receipt, vendors should match)
SELECT p.id, p.receipt_number, p.vendor_id as pdf_vendor, r.vendor_id as receipt_vendor
FROM public.receipt_pdfs p
JOIN public.receipts r ON p.receipt_id = r.id
WHERE p.vendor_id != r.vendor_id
ORDER BY p.created_at DESC;

-- 2.5: Check for NULL pdf_url in receipt_pdfs
-- Expected: 0 rows (all PDFs must have a URL for access)
SELECT id, receipt_number, vendor_id, created_at
FROM public.receipt_pdfs
WHERE pdf_url IS NULL OR pdf_url = ''
ORDER BY created_at DESC;

-- ===================================================================
-- EMAIL_LOGS TABLE VALIDATION
-- ===================================================================

-- 3.1: Check for NULL vendor_id in email_logs
-- Expected: 0 rows (all email logs must have vendor_id)
SELECT id, receipt_number, vendor_id, created_at
FROM public.email_logs
WHERE vendor_id IS NULL
ORDER BY created_at DESC;

-- 3.2: Check for email_logs referencing non-existent users (vendor_id not in auth.users)
-- Expected: 0 rows
SELECT e.id, e.receipt_number, e.vendor_id, e.created_at
FROM public.email_logs e
LEFT JOIN auth.users u ON e.vendor_id = u.id
WHERE u.id IS NULL
ORDER BY e.created_at DESC;

-- 3.3: Check for email_logs referencing non-existent receipts via receipt_id
-- Expected: 0 rows (if receipt_id is set, receipt must exist)
SELECT e.id, e.receipt_number, e.receipt_id, e.vendor_id
FROM public.email_logs e
LEFT JOIN public.receipts r ON e.receipt_id = r.id
WHERE e.receipt_id IS NOT NULL AND r.id IS NULL
ORDER BY e.created_at DESC;

-- 3.4: Check for email_logs with mismatched vendor_id vs linked receipt vendor_id
-- Expected: 0 rows
SELECT e.id, e.receipt_number, e.vendor_id as email_vendor, r.vendor_id as receipt_vendor
FROM public.email_logs e
JOIN public.receipts r ON e.receipt_id = r.id
WHERE e.vendor_id != r.vendor_id
ORDER BY e.created_at DESC;

-- 3.5: Check for invalid status values in email_logs
-- Expected: 0 rows (status should be 'pending', 'sent', 'failed', etc.)
SELECT id, receipt_number, status, vendor_id, created_at
FROM public.email_logs
WHERE status NOT IN ('pending', 'sent', 'failed', 'bounced')
ORDER BY created_at DESC;

-- ===================================================================
-- EMAIL_QUEUE TABLE VALIDATION
-- ===================================================================

-- 4.1: Check for NULL user_id in email_queue
-- Expected: 0 rows (all queue entries must have user_id)
SELECT id, recipient_email, user_id, created_at
FROM public.email_queue
WHERE user_id IS NULL
ORDER BY created_at DESC;

-- 4.2: Check for email_queue referencing non-existent users (user_id not in auth.users)
-- Expected: 0 rows
SELECT q.id, q.recipient_email, q.user_id, q.created_at
FROM public.email_queue q
LEFT JOIN auth.users u ON q.user_id = u.id
WHERE u.id IS NULL
ORDER BY q.created_at DESC;

-- 4.3: Check for email_queue referencing non-existent receipts via receipt_id
-- Expected: 0 rows (if receipt_id is set, receipt must exist)
SELECT q.id, q.recipient_email, q.receipt_id, q.user_id
FROM public.email_queue q
LEFT JOIN public.receipts r ON q.receipt_id = r.id
WHERE q.receipt_id IS NOT NULL AND r.id IS NULL
ORDER BY q.created_at DESC;

-- 4.4: Check for invalid status values in email_queue
-- Expected: 0 rows (status must be in 'pending', 'processing', 'sent', 'failed', 'retrying')
SELECT id, recipient_email, status, user_id, created_at
FROM public.email_queue
WHERE status NOT IN ('pending', 'processing', 'sent', 'failed', 'retrying')
ORDER BY created_at DESC;

-- 4.5: Check for email_queue entries with invalid attempts count
-- Expected: 0 rows (attempts should be >= 0)
SELECT id, recipient_email, attempts, user_id, created_at
FROM public.email_queue
WHERE attempts < 0 OR attempts > 10
ORDER BY created_at DESC;

-- ===================================================================
-- RATE_LIMITS TABLE VALIDATION
-- ===================================================================

-- 5.1: Check for NULL user_id in rate_limits
-- Expected: 0 rows (all rate limit entries must have user_id)
SELECT id, user_id, route, created_at
FROM public.rate_limits
WHERE user_id IS NULL
ORDER BY created_at DESC;

-- 5.2: Check for rate_limits referencing non-existent users (user_id not in auth.users)
-- Expected: 0 rows
SELECT r.id, r.user_id, r.route, r.created_at
FROM public.rate_limits r
LEFT JOIN auth.users u ON r.user_id = u.id
WHERE u.id IS NULL
ORDER BY r.created_at DESC;

-- 5.3: Check for invalid request_count in rate_limits
-- Expected: 0 rows (request_count should be >= 0)
SELECT id, user_id, route, request_count, created_at
FROM public.rate_limits
WHERE request_count < 0
ORDER BY created_at DESC;

-- ===================================================================
-- SYSTEM_ERROR_LOGS TABLE VALIDATION
-- ===================================================================

-- 6.1: Check for system_error_logs referencing non-existent users (user_id not in auth.users)
-- Note: user_id can be NULL (for system-wide errors); only check non-NULL
-- Expected: 0 rows
SELECT e.id, e.user_id, e.error_type, e.created_at
FROM public.system_error_logs e
LEFT JOIN auth.users u ON e.user_id = u.id
WHERE e.user_id IS NOT NULL AND u.id IS NULL
ORDER BY e.created_at DESC;

-- 6.2: Check for NULL error_type in system_error_logs
-- Expected: 0 rows (error_type is required for categorization)
SELECT id, user_id, error_type, created_at
FROM public.system_error_logs
WHERE error_type IS NULL OR error_type = ''
ORDER BY created_at DESC;

-- ===================================================================
-- SUBSCRIPTIONS TABLE VALIDATION
-- ===================================================================

-- 7.1: Check for NULL user_id in subscriptions (FK constraint to auth.users)
-- Expected: 0 rows (all subscriptions must have user_id)
SELECT id, user_id, plan, created_at
FROM public.subscriptions
WHERE user_id IS NULL
ORDER BY created_at DESC;

-- 7.2: Check for invalid plan values in subscriptions
-- Expected: 0 rows (plan must be 'free', 'pro', or 'enterprise')
SELECT id, user_id, plan, created_at
FROM public.subscriptions
WHERE plan NOT IN ('free', 'pro', 'enterprise')
ORDER BY created_at DESC;

-- 7.3: Check for invalid status values in subscriptions
-- Expected: 0 rows (status must be 'active', 'canceled', or 'banned')
SELECT id, user_id, status, created_at
FROM public.subscriptions
WHERE status NOT IN ('active', 'canceled', 'banned')
ORDER BY created_at DESC;

-- ===================================================================
-- SUMMARY: Count of issues by table
-- ===================================================================

-- Summary query: total row count by table (to understand data volume before RLS)
SELECT
  'receipts' as table_name,
  COUNT(*) as total_rows,
  COUNT(DISTINCT vendor_id) as unique_vendors,
  COUNT(CASE WHEN status = 'draft' THEN 1 END) as draft_count,
  COUNT(CASE WHEN status = 'finalized' THEN 1 END) as finalized_count
FROM public.receipts
UNION ALL
SELECT
  'receipt_pdfs' as table_name,
  COUNT(*) as total_rows,
  COUNT(DISTINCT vendor_id) as unique_vendors,
  NULL as draft_count,
  NULL as finalized_count
FROM public.receipt_pdfs
UNION ALL
SELECT
  'email_logs' as table_name,
  COUNT(*) as total_rows,
  COUNT(DISTINCT vendor_id) as unique_vendors,
  NULL as draft_count,
  NULL as finalized_count
FROM public.email_logs
UNION ALL
SELECT
  'email_queue' as table_name,
  COUNT(*) as total_rows,
  COUNT(DISTINCT user_id) as unique_vendors,
  NULL as draft_count,
  NULL as finalized_count
FROM public.email_queue
UNION ALL
SELECT
  'rate_limits' as table_name,
  COUNT(*) as total_rows,
  COUNT(DISTINCT user_id) as unique_vendors,
  NULL as draft_count,
  NULL as finalized_count
FROM public.rate_limits
UNION ALL
SELECT
  'system_error_logs' as table_name,
  COUNT(*) as total_rows,
  COUNT(DISTINCT user_id) as unique_vendors,
  NULL as draft_count,
  NULL as finalized_count
FROM public.system_error_logs
UNION ALL
SELECT
  'subscriptions' as table_name,
  COUNT(*) as total_rows,
  COUNT(DISTINCT user_id) as unique_vendors,
  NULL as draft_count,
  NULL as finalized_count
FROM public.subscriptions;

-- ===================================================================
-- INSTRUCTIONS
-- ===================================================================
-- Run all queries above in sequence and save results.
-- If ANY query returns rows, data cleanup is required before enabling RLS.
-- Coordinate with your DBA/ops team to remediate orphaned or invalid records.
-- Common remediation:
--   - Orphaned vendor_id/user_id: assign to a known user or delete rows
--   - Orphaned FK: delete referencing rows or update to valid FK
--   - Invalid status: update to valid enum value or delete
--   - NULL fields: provide missing values or delete rows
-- After all issues are resolved, proceed to RLS deployment.
