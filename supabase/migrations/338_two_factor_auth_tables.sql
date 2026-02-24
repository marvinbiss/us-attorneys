-- Migration 338: Two-Factor Authentication tables
-- Creates two_factor_auth, security_logs tables and adds two_factor_enabled to profiles.
-- Fully idempotent (safe to re-run).

-- ============================================================
-- 1. two_factor_auth table
-- ============================================================
CREATE TABLE IF NOT EXISTS public.two_factor_auth (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  secret TEXT NOT NULL,
  backup_codes TEXT[] DEFAULT '{}',
  verified BOOLEAN DEFAULT false,
  verified_at TIMESTAMPTZ,
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

COMMENT ON TABLE public.two_factor_auth IS 'Stores TOTP secrets and backup codes for two-factor authentication.';

-- ============================================================
-- 2. security_logs table
-- ============================================================
CREATE TABLE IF NOT EXISTS public.security_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,
  details JSONB DEFAULT '{}',
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

COMMENT ON TABLE public.security_logs IS 'Audit trail for security-related events (login, 2FA, password changes, etc.).';

-- ============================================================
-- 3. Add two_factor_enabled column to profiles
-- ============================================================
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS two_factor_enabled BOOLEAN DEFAULT false;

-- ============================================================
-- 4. Indexes
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_security_logs_user_id
  ON public.security_logs(user_id);

CREATE INDEX IF NOT EXISTS idx_security_logs_event_type
  ON public.security_logs(event_type);

CREATE INDEX IF NOT EXISTS idx_security_logs_created_at
  ON public.security_logs(created_at DESC);

-- ============================================================
-- 5. RLS - two_factor_auth
-- ============================================================
ALTER TABLE public.two_factor_auth ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'two_factor_auth' AND policyname = 'Users can read own 2FA'
  ) THEN
    CREATE POLICY "Users can read own 2FA"
      ON public.two_factor_auth FOR SELECT
      USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'two_factor_auth' AND policyname = 'Users can insert own 2FA'
  ) THEN
    CREATE POLICY "Users can insert own 2FA"
      ON public.two_factor_auth FOR INSERT
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'two_factor_auth' AND policyname = 'Users can update own 2FA'
  ) THEN
    CREATE POLICY "Users can update own 2FA"
      ON public.two_factor_auth FOR UPDATE
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'two_factor_auth' AND policyname = 'Users can delete own 2FA'
  ) THEN
    CREATE POLICY "Users can delete own 2FA"
      ON public.two_factor_auth FOR DELETE
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- ============================================================
-- 6. RLS - security_logs
-- ============================================================
ALTER TABLE public.security_logs ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'security_logs' AND policyname = 'Users can read own security logs'
  ) THEN
    CREATE POLICY "Users can read own security logs"
      ON public.security_logs FOR SELECT
      USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'security_logs' AND policyname = 'Admins can read all security logs'
  ) THEN
    CREATE POLICY "Admins can read all security logs"
      ON public.security_logs FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM public.profiles
          WHERE profiles.id = auth.uid()
            AND profiles.role IN ('super_admin', 'admin')
        )
      );
  END IF;
END $$;

-- ============================================================
-- 7. updated_at trigger for two_factor_auth
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'set_updated_at_two_factor_auth'
  ) THEN
    CREATE TRIGGER set_updated_at_two_factor_auth
      BEFORE UPDATE ON public.two_factor_auth
      FOR EACH ROW
      EXECUTE FUNCTION public.handle_updated_at();
  END IF;
END $$;
