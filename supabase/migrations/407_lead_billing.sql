-- ============================================================================
-- Migration 407: Lead Billing — CPA (Cost Per Acquisition) tracking
-- P2.17: Records charges when leads are dispatched to attorneys
-- ============================================================================

-- ============================================================================
-- 1. lead_charges table
-- ============================================================================
CREATE TABLE IF NOT EXISTS lead_charges (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  attorney_id UUID NOT NULL REFERENCES attorneys(id) ON DELETE CASCADE,
  lead_id UUID NOT NULL,
  lead_type TEXT NOT NULL DEFAULT 'standard'
    CHECK (lead_type IN ('standard', 'premium', 'exclusive')),
  amount_cents INTEGER NOT NULL
    CHECK (amount_cents > 0),
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'billed', 'paid', 'waived', 'refunded')),
  stripe_invoice_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  billed_at TIMESTAMPTZ
);

-- ============================================================================
-- 2. Indexes
-- ============================================================================
-- Primary lookup: attorney's charges by date (for monthly billing queries)
CREATE INDEX idx_lead_charges_attorney ON lead_charges(attorney_id, created_at);

-- Stripe invoice reconciliation
CREATE INDEX idx_lead_charges_invoice ON lead_charges(stripe_invoice_id)
  WHERE stripe_invoice_id IS NOT NULL;

-- Pending charges (for billing cron)
CREATE INDEX idx_lead_charges_pending ON lead_charges(status, created_at)
  WHERE status = 'pending';

-- ============================================================================
-- 3. RLS — attorneys can SELECT their own charges only
-- ============================================================================
ALTER TABLE lead_charges ENABLE ROW LEVEL SECURITY;

-- Attorneys see only their own charges
CREATE POLICY lead_charges_attorney_select
  ON lead_charges FOR SELECT
  USING (
    attorney_id IN (
      SELECT id FROM attorneys WHERE user_id = auth.uid()
    )
  );

-- Admins can do everything
CREATE POLICY lead_charges_admin_all
  ON lead_charges FOR ALL
  USING (is_admin());

-- Service role (billing cron) bypasses RLS
