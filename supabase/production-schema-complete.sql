-- ============================================================
-- SUPABASE COMPLETE SCHEMA SETUP
-- For: Production Database Initialization
-- ============================================================
-- Run this file in Supabase SQL Editor to set up all tables
-- Tables included: receipts, receipt_pdfs, email_queue, email_logs, subscriptions
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- 1. RECEIPTS TABLE (Core receipt documents)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.receipts (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  vendor_id uuid NOT NULL,
  receipt_number text NOT NULL,
  template_id text NOT NULL,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'finalized')),
  company_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  customer_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  payment_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  additional_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  amount numeric NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'INR',
  pdf_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS receipts_receipt_number_unique ON public.receipts(receipt_number);
CREATE INDEX IF NOT EXISTS receipts_vendor_id_idx ON public.receipts(vendor_id);
CREATE INDEX IF NOT EXISTS receipts_status_idx ON public.receipts(status);
CREATE INDEX IF NOT EXISTS receipts_receipt_number_idx ON public.receipts(receipt_number);

-- Update trigger for receipts
CREATE OR REPLACE FUNCTION update_receipts_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS receipts_set_updated_at ON public.receipts;
CREATE TRIGGER receipts_set_updated_at
  BEFORE UPDATE ON public.receipts
  FOR EACH ROW
  EXECUTE FUNCTION update_receipts_updated_at_column();

-- ============================================================
-- 2. RECEIPT_PDFS TABLE (PDF metadata and storage refs)
-- ============================================================

CREATE SEQUENCE IF NOT EXISTS receipt_number_seq START 1;

CREATE OR REPLACE FUNCTION next_receipt_number()
RETURNS bigint AS $$
BEGIN
  RETURN nextval('receipt_number_seq');
END;
$$ LANGUAGE plpgsql;

CREATE TABLE IF NOT EXISTS public.receipt_pdfs (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  receipt_id uuid,
  receipt_number text NOT NULL,
  vendor_id uuid NOT NULL,
  pdf_url text NOT NULL,
  file_name text NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS receipt_pdfs_receipt_number_unique ON public.receipt_pdfs(receipt_number);
CREATE INDEX IF NOT EXISTS receipt_pdfs_vendor_id_idx ON public.receipt_pdfs(vendor_id);
CREATE INDEX IF NOT EXISTS receipt_pdfs_receipt_id_idx ON public.receipt_pdfs(receipt_id);

-- Foreign key relationship
ALTER TABLE IF EXISTS public.receipt_pdfs
  ADD CONSTRAINT IF NOT EXISTS receipt_pdfs_receipt_fk 
  FOREIGN KEY (receipt_id) REFERENCES public.receipts(id) ON DELETE SET NULL;

-- ============================================================
-- 3. EMAIL_LOGS TABLE (Email sending history)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.email_logs (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  vendor_id uuid NOT NULL,
  receipt_id uuid,
  receipt_number text,
  recipient_email text NOT NULL,
  subject text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  provider text NOT NULL DEFAULT 'resend',
  pdf_url text,
  error_message text,
  sent_at timestamptz,
  created_at timestamptz DEFAULT now(),
  metadata jsonb DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS email_logs_vendor_id_idx ON public.email_logs(vendor_id);
CREATE INDEX IF NOT EXISTS email_logs_status_idx ON public.email_logs(status);
CREATE INDEX IF NOT EXISTS email_logs_recipient_email_idx ON public.email_logs(recipient_email);
CREATE INDEX IF NOT EXISTS email_logs_created_at_idx ON public.email_logs(created_at);

-- ============================================================
-- 4. EMAIL_QUEUE TABLE (Pending emails queue)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.email_queue (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id uuid NOT NULL,
  receipt_id uuid,
  recipient_email text NOT NULL,
  subject text NOT NULL,
  body jsonb DEFAULT '{}'::jsonb,
  pdf_url text,
  file_name text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','processing','sent','failed','retrying')),
  attempts integer NOT NULL DEFAULT 0,
  next_try_at timestamptz NOT NULL DEFAULT now(),
  last_error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS email_queue_status_idx ON public.email_queue(status);
CREATE INDEX IF NOT EXISTS email_queue_next_try_at_idx ON public.email_queue(next_try_at);
CREATE INDEX IF NOT EXISTS email_queue_user_id_idx ON public.email_queue(user_id);
CREATE INDEX IF NOT EXISTS email_queue_updated_at_idx ON public.email_queue(updated_at);

-- Update trigger for email_queue
CREATE OR REPLACE FUNCTION update_email_queue_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS email_queue_update_trigger ON public.email_queue;
CREATE TRIGGER email_queue_update_trigger
  BEFORE UPDATE ON public.email_queue
  FOR EACH ROW
  EXECUTE FUNCTION update_email_queue_updated_at();

-- ============================================================
-- 5. SUBSCRIPTIONS TABLE (User subscription tiers)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.subscriptions (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan text NOT NULL DEFAULT 'free' CHECK (plan IN ('free','pro','enterprise')),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','canceled','banned')),
  current_usage integer NOT NULL DEFAULT 0,
  usage_limit integer,
  reset_date date NOT NULL,
  plan_id text,
  stripe_customer_id text,
  stripe_subscription_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS subscriptions_user_id_unique ON public.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS subscriptions_plan_idx ON public.subscriptions(plan);
CREATE INDEX IF NOT EXISTS subscriptions_status_idx ON public.subscriptions(status);

-- Update trigger for subscriptions
CREATE OR REPLACE FUNCTION update_subscriptions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS subscriptions_update_trigger ON public.subscriptions;
CREATE TRIGGER subscriptions_update_trigger
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_subscriptions_updated_at();

-- ============================================================
-- 6. RATE_LIMITS TABLE (API rate limiting)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.rate_limits (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id uuid NOT NULL,
  endpoint text NOT NULL,
  request_count integer NOT NULL DEFAULT 1,
  window_start timestamptz NOT NULL DEFAULT now(),
  window_end timestamptz NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS rate_limits_user_id_endpoint_idx ON public.rate_limits(user_id, endpoint);
CREATE INDEX IF NOT EXISTS rate_limits_window_end_idx ON public.rate_limits(window_end);

-- ============================================================
-- 7. SYSTEM_ERROR_LOGS TABLE (System error tracking)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.system_error_logs (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  error_type text NOT NULL,
  error_message text NOT NULL,
  error_stack text,
  route text,
  user_id uuid,
  context jsonb DEFAULT '{}'::jsonb,
  severity text NOT NULL DEFAULT 'error' CHECK (severity IN ('debug', 'info', 'warning', 'error', 'critical')),
  resolved boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS system_error_logs_error_type_idx ON public.system_error_logs(error_type);
CREATE INDEX IF NOT EXISTS system_error_logs_route_idx ON public.system_error_logs(route);
CREATE INDEX IF NOT EXISTS system_error_logs_severity_idx ON public.system_error_logs(severity);
CREATE INDEX IF NOT EXISTS system_error_logs_created_at_idx ON public.system_error_logs(created_at);

-- ============================================================
-- 8. ENABLE ROW-LEVEL SECURITY (RLS)
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE public.receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.receipt_pdfs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_error_logs ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 9. RLS POLICIES - RECEIPTS
-- ============================================================

CREATE POLICY "receipts_select_owner" ON public.receipts
  FOR SELECT USING (
    (vendor_id::text = auth.uid())
    OR (current_setting('jwt.claims', true) ->> 'role' = 'admin')
  );

CREATE POLICY "receipts_insert_owner" ON public.receipts
  FOR INSERT WITH CHECK (
    (vendor_id::text = auth.uid())
    OR (current_setting('jwt.claims', true) ->> 'role' = 'admin')
  );

CREATE POLICY "receipts_update_owner" ON public.receipts
  FOR UPDATE USING (
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

CREATE POLICY "receipts_delete_owner" ON public.receipts
  FOR DELETE USING (
    (
      vendor_id::text = auth.uid() AND status = 'draft'
    )
    OR (current_setting('jwt.claims', true) ->> 'role' = 'admin')
  );

-- ============================================================
-- 10. RLS POLICIES - RECEIPT_PDFS
-- ============================================================

CREATE POLICY "receipt_pdfs_select_owner" ON public.receipt_pdfs
  FOR SELECT USING (
    (vendor_id::text = auth.uid())
    OR (current_setting('jwt.claims', true) ->> 'role' = 'admin')
  );

CREATE POLICY "receipt_pdfs_insert_owner" ON public.receipt_pdfs
  FOR INSERT WITH CHECK (
    (
      vendor_id::text = auth.uid()
      OR (current_setting('jwt.claims', true) ->> 'role' = 'admin')
    )
  );

CREATE POLICY "receipt_pdfs_update_owner" ON public.receipt_pdfs
  FOR UPDATE USING (
    (vendor_id::text = auth.uid())
    OR (current_setting('jwt.claims', true) ->> 'role' = 'admin')
  );

CREATE POLICY "receipt_pdfs_delete_owner" ON public.receipt_pdfs
  FOR DELETE USING (
    (vendor_id::text = auth.uid())
    OR (current_setting('jwt.claims', true) ->> 'role' = 'admin')
  );

-- ============================================================
-- 11. RLS POLICIES - EMAIL_LOGS
-- ============================================================

CREATE POLICY "email_logs_select_owner" ON public.email_logs
  FOR SELECT USING (
    (vendor_id::text = auth.uid())
    OR (current_setting('jwt.claims', true) ->> 'role' = 'admin')
  );

CREATE POLICY "email_logs_insert_owner" ON public.email_logs
  FOR INSERT WITH CHECK (
    (vendor_id::text = auth.uid())
    OR (current_setting('jwt.claims', true) ->> 'role' = 'admin')
  );

CREATE POLICY "email_logs_update_owner" ON public.email_logs
  FOR UPDATE USING (
    (vendor_id::text = auth.uid())
    OR (current_setting('jwt.claims', true) ->> 'role' = 'admin')
  );

-- ============================================================
-- 12. RLS POLICIES - EMAIL_QUEUE
-- ============================================================

CREATE POLICY "email_queue_select_owner" ON public.email_queue
  FOR SELECT USING (
    (user_id::text = auth.uid())
    OR (current_setting('jwt.claims', true) ->> 'role' = 'admin')
  );

CREATE POLICY "email_queue_insert_owner" ON public.email_queue
  FOR INSERT WITH CHECK (
    (user_id::text = auth.uid())
    OR (current_setting('jwt.claims', true) ->> 'role' = 'admin')
  );

-- ============================================================
-- 13. RLS POLICIES - SUBSCRIPTIONS
-- ============================================================

CREATE POLICY "subscriptions_select_owner" ON public.subscriptions
  FOR SELECT USING (
    (user_id::text = auth.uid())
    OR (current_setting('jwt.claims', true) ->> 'role' = 'admin')
  );

CREATE POLICY "subscriptions_insert_owner" ON public.subscriptions
  FOR INSERT WITH CHECK (
    user_id::text = auth.uid()
    OR (current_setting('jwt.claims', true) ->> 'role' = 'admin')
  );

-- ============================================================
-- 14. COMPLETION
-- ============================================================

-- Verify all tables are created
SELECT 'Schema creation complete' as status;

-- List all created tables
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
