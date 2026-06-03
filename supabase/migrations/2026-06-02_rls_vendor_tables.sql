-- Migration: 2026-06-02 - Enable Row-Level Security (RLS) and add vendor ownership policies
-- Targets: receipts, receipt_pdfs, email_logs, email_queue, rate_limits, system_error_logs
-- Purpose: enforce per-vendor/user access via RLS. Admins with JWT claim "role":"admin" retain full access.
-- NOTE: This migration only creates policies (up) and provides a down-section (rollback).

-- To apply: run these statements in your Supabase / Postgres migration runner.
-- To rollback: run the "DOWN" section at the bottom of this file.

-- ===================================================================
-- UP: create RLS and policies
-- ===================================================================

DO $$
BEGIN
  -- RECEIPTS: enable RLS
  ALTER TABLE IF EXISTS public.receipts ENABLE ROW LEVEL SECURITY;

  -- SELECT
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE polname = 'receipts_select_owner' AND polrelid = 'public.receipts'::regclass) THEN
    EXECUTE $$
      CREATE POLICY receipts_select_owner ON public.receipts
      FOR SELECT
      USING (
        (vendor_id::text = auth.uid())
        OR (current_setting('jwt.claims', true) ->> 'role' = 'admin')
      );
    $$;
  END IF;

  -- INSERT: vendor must set vendor_id = auth.uid() (or be admin)
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE polname = 'receipts_insert_owner' AND polrelid = 'public.receipts'::regclass) THEN
    EXECUTE $$
      CREATE POLICY receipts_insert_owner ON public.receipts
      FOR INSERT
      WITH CHECK (
        (vendor_id::text = auth.uid())
        OR (current_setting('jwt.claims', true) ->> 'role' = 'admin')
      );
    $$;
  END IF;

  -- UPDATE: only owner may update, and only when status = 'draft' (admin can override)
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE polname = 'receipts_update_owner' AND polrelid = 'public.receipts'::regclass) THEN
    EXECUTE $$
      CREATE POLICY receipts_update_owner ON public.receipts
      FOR UPDATE
      USING (
        (vendor_id::text = auth.uid())
        OR (current_setting('jwt.claims', true) ->> 'role' = 'admin')
      )
      WITH CHECK (
        (
          (vendor_id::text = auth.uid())
          OR (current_setting('jwt.claims', true) ->> 'role' = 'admin')
        )
        AND (
          status = 'draft' OR (current_setting('jwt.claims', true) ->> 'role' = 'admin')
        )
      );
    $$;
  END IF;

  -- DELETE: only owner may delete draft receipts (admin can delete any)
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE polname = 'receipts_delete_owner' AND polrelid = 'public.receipts'::regclass) THEN
    EXECUTE $$
      CREATE POLICY receipts_delete_owner ON public.receipts
      FOR DELETE
      USING (
        (
          vendor_id::text = auth.uid() AND status = 'draft'
        )
        OR (current_setting('jwt.claims', true) ->> 'role' = 'admin')
      );
    $$;
  END IF;

  -- RECEIPT_PDFS: enable RLS
  ALTER TABLE IF EXISTS public.receipt_pdfs ENABLE ROW LEVEL SECURITY;

  -- SELECT: vendor may select their own PDFs; admin may select all
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE polname = 'receipt_pdfs_select_owner' AND polrelid = 'public.receipt_pdfs'::regclass) THEN
    EXECUTE $$
      CREATE POLICY receipt_pdfs_select_owner ON public.receipt_pdfs
      FOR SELECT
      USING (
        (vendor_id::text = auth.uid())
        OR (current_setting('jwt.claims', true) ->> 'role' = 'admin')
      );
    $$;
  END IF;

  -- INSERT: vendor may insert PDFs for themselves; if receipt_id provided it must belong to the same vendor (or admin)
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE polname = 'receipt_pdfs_insert_owner' AND polrelid = 'public.receipt_pdfs'::regclass) THEN
    EXECUTE $$
      CREATE POLICY receipt_pdfs_insert_owner ON public.receipt_pdfs
      FOR INSERT
      WITH CHECK (
        (
          vendor_id::text = auth.uid()
          OR (current_setting('jwt.claims', true) ->> 'role' = 'admin')
        )
        AND (
          receipt_id IS NULL
          OR EXISTS (
            SELECT 1 FROM public.receipts r WHERE r.id = receipt_id AND (
              r.vendor_id::text = auth.uid()
              OR (current_setting('jwt.claims', true) ->> 'role' = 'admin')
            )
          )
        )
      );
    $$;
  END IF;

  -- UPDATE: vendor may update their pdf rows; admin may update all
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE polname = 'receipt_pdfs_update_owner' AND polrelid = 'public.receipt_pdfs'::regclass) THEN
    EXECUTE $$
      CREATE POLICY receipt_pdfs_update_owner ON public.receipt_pdfs
      FOR UPDATE
      USING (
        (vendor_id::text = auth.uid())
        OR (current_setting('jwt.claims', true) ->> 'role' = 'admin')
      )
      WITH CHECK (
        (
          vendor_id::text = auth.uid()
          OR (current_setting('jwt.claims', true) ->> 'role' = 'admin')
        )
      );
    $$;
  END IF;

  -- DELETE: vendor may delete their own pdfs; admin can delete any
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE polname = 'receipt_pdfs_delete_owner' AND polrelid = 'public.receipt_pdfs'::regclass) THEN
    EXECUTE $$
      CREATE POLICY receipt_pdfs_delete_owner ON public.receipt_pdfs
      FOR DELETE
      USING (
        (vendor_id::text = auth.uid())
        OR (current_setting('jwt.claims', true) ->> 'role' = 'admin')
      );
    $$;
  END IF;

  -- EMAIL_LOGS: enable RLS
  ALTER TABLE IF EXISTS public.email_logs ENABLE ROW LEVEL SECURITY;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE polname = 'email_logs_select_owner' AND polrelid = 'public.email_logs'::regclass) THEN
    EXECUTE $$
      CREATE POLICY email_logs_select_owner ON public.email_logs
      FOR SELECT
      USING (
        (vendor_id::text = auth.uid())
        OR (current_setting('jwt.claims', true) ->> 'role' = 'admin')
      );
    $$;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE polname = 'email_logs_insert_owner' AND polrelid = 'public.email_logs'::regclass) THEN
    EXECUTE $$
      CREATE POLICY email_logs_insert_owner ON public.email_logs
      FOR INSERT
      WITH CHECK (
        (vendor_id::text = auth.uid())
        OR (current_setting('jwt.claims', true) ->> 'role' = 'admin')
      );
    $$;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE polname = 'email_logs_update_owner' AND polrelid = 'public.email_logs'::regclass) THEN
    EXECUTE $$
      CREATE POLICY email_logs_update_owner ON public.email_logs
      FOR UPDATE
      USING (
        (vendor_id::text = auth.uid())
        OR (current_setting('jwt.claims', true) ->> 'role' = 'admin')
      )
      WITH CHECK (
        (vendor_id::text = auth.uid())
        OR (current_setting('jwt.claims', true) ->> 'role' = 'admin')
      );
    $$;
  END IF;

  -- EMAIL_QUEUE: enable RLS
  ALTER TABLE IF EXISTS public.email_queue ENABLE ROW LEVEL SECURITY;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE polname = 'email_queue_select_owner' AND polrelid = 'public.email_queue'::regclass) THEN
    EXECUTE $$
      CREATE POLICY email_queue_select_owner ON public.email_queue
      FOR SELECT
      USING (
        (user_id::text = auth.uid())
        OR (current_setting('jwt.claims', true) ->> 'role' = 'admin')
      );
    $$;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE polname = 'email_queue_insert_owner' AND polrelid = 'public.email_queue'::regclass) THEN
    EXECUTE $$
      CREATE POLICY email_queue_insert_owner ON public.email_queue
      FOR INSERT
      WITH CHECK (
        (user_id::text = auth.uid())
        OR (current_setting('jwt.claims', true) ->> 'role' = 'admin')
      );
    $$;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE polname = 'email_queue_update_owner' AND polrelid = 'public.email_queue'::regclass) THEN
    EXECUTE $$
      CREATE POLICY email_queue_update_owner ON public.email_queue
      FOR UPDATE
      USING (
        (user_id::text = auth.uid())
        OR (current_setting('jwt.claims', true) ->> 'role' = 'admin')
      )
      WITH CHECK (
        (user_id::text = auth.uid())
        OR (current_setting('jwt.claims', true) ->> 'role' = 'admin')
      );
    $$;
  END IF;

  -- RATE_LIMITS: enable RLS
  ALTER TABLE IF EXISTS public.rate_limits ENABLE ROW LEVEL SECURITY;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE polname = 'rate_limits_select_owner' AND polrelid = 'public.rate_limits'::regclass) THEN
    EXECUTE $$
      CREATE POLICY rate_limits_select_owner ON public.rate_limits
      FOR SELECT
      USING (
        (user_id::text = auth.uid())
        OR (current_setting('jwt.claims', true) ->> 'role' = 'admin')
      );
    $$;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE polname = 'rate_limits_insert_owner' AND polrelid = 'public.rate_limits'::regclass) THEN
    EXECUTE $$
      CREATE POLICY rate_limits_insert_owner ON public.rate_limits
      FOR INSERT
      WITH CHECK (
        (user_id::text = auth.uid())
        OR (current_setting('jwt.claims', true) ->> 'role' = 'admin')
      );
    $$;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE polname = 'rate_limits_update_owner' AND polrelid = 'public.rate_limits'::regclass) THEN
    EXECUTE $$
      CREATE POLICY rate_limits_update_owner ON public.rate_limits
      FOR UPDATE
      USING (
        (user_id::text = auth.uid())
        OR (current_setting('jwt.claims', true) ->> 'role' = 'admin')
      )
      WITH CHECK (
        (user_id::text = auth.uid())
        OR (current_setting('jwt.claims', true) ->> 'role' = 'admin')
      );
    $$;
  END IF;

  -- SYSTEM_ERROR_LOGS: enable RLS
  ALTER TABLE IF EXISTS public.system_error_logs ENABLE ROW LEVEL SECURITY;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE polname = 'system_error_logs_select_owner' AND polrelid = 'public.system_error_logs'::regclass) THEN
    EXECUTE $$
      CREATE POLICY system_error_logs_select_owner ON public.system_error_logs
      FOR SELECT
      USING (
        (user_id IS NOT NULL AND user_id::text = auth.uid())
        OR (current_setting('jwt.claims', true) ->> 'role' = 'admin')
      );
    $$;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE polname = 'system_error_logs_insert_owner' AND polrelid = 'public.system_error_logs'::regclass) THEN
    EXECUTE $$
      CREATE POLICY system_error_logs_insert_owner ON public.system_error_logs
      FOR INSERT
      WITH CHECK (
        (user_id::text = auth.uid())
        OR (current_setting('jwt.claims', true) ->> 'role' = 'admin')
      );
    $$;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE polname = 'system_error_logs_update_owner' AND polrelid = 'public.system_error_logs'::regclass) THEN
    EXECUTE $$
      CREATE POLICY system_error_logs_update_owner ON public.system_error_logs
      FOR UPDATE
      USING (
        (user_id::text = auth.uid())
        OR (current_setting('jwt.claims', true) ->> 'role' = 'admin')
      )
      WITH CHECK (
        (user_id::text = auth.uid())
        OR (current_setting('jwt.claims', true) ->> 'role' = 'admin')
      );
    $$;
  END IF;

END$$;

-- ===================================================================
-- DOWN: rollback - drop policies and disable RLS
-- ===================================================================

-- The following commands will remove the policies created above and disable RLS on the targeted tables.
-- Run this section if you need to rollback the migration.

-- Example rollback (run each DO block below in your DB):

-- DROP policies for receipts
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE polname = 'receipts_select_owner' AND polrelid = 'public.receipts'::regclass) THEN
    EXECUTE 'DROP POLICY receipts_select_owner ON public.receipts';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_policies WHERE polname = 'receipts_insert_owner' AND polrelid = 'public.receipts'::regclass) THEN
    EXECUTE 'DROP POLICY receipts_insert_owner ON public.receipts';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_policies WHERE polname = 'receipts_update_owner' AND polrelid = 'public.receipts'::regclass) THEN
    EXECUTE 'DROP POLICY receipts_update_owner ON public.receipts';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_policies WHERE polname = 'receipts_delete_owner' AND polrelid = 'public.receipts'::regclass) THEN
    EXECUTE 'DROP POLICY receipts_delete_owner ON public.receipts';
  END IF;
  ALTER TABLE IF EXISTS public.receipts DISABLE ROW LEVEL SECURITY;
END$$;

-- DROP policies for receipt_pdfs
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE polname = 'receipt_pdfs_select_owner' AND polrelid = 'public.receipt_pdfs'::regclass) THEN
    EXECUTE 'DROP POLICY receipt_pdfs_select_owner ON public.receipt_pdfs';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_policies WHERE polname = 'receipt_pdfs_insert_owner' AND polrelid = 'public.receipt_pdfs'::regclass) THEN
    EXECUTE 'DROP POLICY receipt_pdfs_insert_owner ON public.receipt_pdfs';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_policies WHERE polname = 'receipt_pdfs_update_owner' AND polrelid = 'public.receipt_pdfs'::regclass) THEN
    EXECUTE 'DROP POLICY receipt_pdfs_update_owner ON public.receipt_pdfs';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_policies WHERE polname = 'receipt_pdfs_delete_owner' AND polrelid = 'public.receipt_pdfs'::regclass) THEN
    EXECUTE 'DROP POLICY receipt_pdfs_delete_owner ON public.receipt_pdfs';
  END IF;
  ALTER TABLE IF EXISTS public.receipt_pdfs DISABLE ROW LEVEL SECURITY;
END$$;

-- DROP policies for email_logs
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE polname = 'email_logs_select_owner' AND polrelid = 'public.email_logs'::regclass) THEN
    EXECUTE 'DROP POLICY email_logs_select_owner ON public.email_logs';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_policies WHERE polname = 'email_logs_insert_owner' AND polrelid = 'public.email_logs'::regclass) THEN
    EXECUTE 'DROP POLICY email_logs_insert_owner ON public.email_logs';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_policies WHERE polname = 'email_logs_update_owner' AND polrelid = 'public.email_logs'::regclass) THEN
    EXECUTE 'DROP POLICY email_logs_update_owner ON public.email_logs';
  END IF;
  ALTER TABLE IF EXISTS public.email_logs DISABLE ROW LEVEL SECURITY;
END$$;

-- DROP policies for email_queue
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE polname = 'email_queue_select_owner' AND polrelid = 'public.email_queue'::regclass) THEN
    EXECUTE 'DROP POLICY email_queue_select_owner ON public.email_queue';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_policies WHERE polname = 'email_queue_insert_owner' AND polrelid = 'public.email_queue'::regclass) THEN
    EXECUTE 'DROP POLICY email_queue_insert_owner ON public.email_queue';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_policies WHERE polname = 'email_queue_update_owner' AND polrelid = 'public.email_queue'::regclass) THEN
    EXECUTE 'DROP POLICY email_queue_update_owner ON public.email_queue';
  END IF;
  ALTER TABLE IF EXISTS public.email_queue DISABLE ROW LEVEL SECURITY;
END$$;

-- DROP policies for rate_limits
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE polname = 'rate_limits_select_owner' AND polrelid = 'public.rate_limits'::regclass) THEN
    EXECUTE 'DROP POLICY rate_limits_select_owner ON public.rate_limits';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_policies WHERE polname = 'rate_limits_insert_owner' AND polrelid = 'public.rate_limits'::regclass) THEN
    EXECUTE 'DROP POLICY rate_limits_insert_owner ON public.rate_limits';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_policies WHERE polname = 'rate_limits_update_owner' AND polrelid = 'public.rate_limits'::regclass) THEN
    EXECUTE 'DROP POLICY rate_limits_update_owner ON public.rate_limits';
  END IF;
  ALTER TABLE IF EXISTS public.rate_limits DISABLE ROW LEVEL SECURITY;
END$$;

-- DROP policies for system_error_logs
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE polname = 'system_error_logs_select_owner' AND polrelid = 'public.system_error_logs'::regclass) THEN
    EXECUTE 'DROP POLICY system_error_logs_select_owner ON public.system_error_logs';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_policies WHERE polname = 'system_error_logs_insert_owner' AND polrelid = 'public.system_error_logs'::regclass) THEN
    EXECUTE 'DROP POLICY system_error_logs_insert_owner ON public.system_error_logs';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_policies WHERE polname = 'system_error_logs_update_owner' AND polrelid = 'public.system_error_logs'::regclass) THEN
    EXECUTE 'DROP POLICY system_error_logs_update_owner ON public.system_error_logs';
  END IF;
  ALTER TABLE IF EXISTS public.system_error_logs DISABLE ROW LEVEL SECURITY;
END$$;

-- End of migration
