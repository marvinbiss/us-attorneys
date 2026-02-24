-- Rollback for migration 338: Two-Factor Authentication tables
-- Reverses all changes from 338_two_factor_auth_tables.sql

-- 1. Drop trigger
DROP TRIGGER IF EXISTS set_updated_at_two_factor_auth ON public.two_factor_auth;

-- 2. Drop policies on two_factor_auth
DROP POLICY IF EXISTS "Users can read own 2FA" ON public.two_factor_auth;
DROP POLICY IF EXISTS "Users can insert own 2FA" ON public.two_factor_auth;
DROP POLICY IF EXISTS "Users can update own 2FA" ON public.two_factor_auth;
DROP POLICY IF EXISTS "Users can delete own 2FA" ON public.two_factor_auth;

-- 3. Drop policies on security_logs
DROP POLICY IF EXISTS "Users can read own security logs" ON public.security_logs;
DROP POLICY IF EXISTS "Admins can read all security logs" ON public.security_logs;

-- 4. Drop indexes on security_logs
DROP INDEX IF EXISTS public.idx_security_logs_user_id;
DROP INDEX IF EXISTS public.idx_security_logs_event_type;
DROP INDEX IF EXISTS public.idx_security_logs_created_at;

-- 5. Remove two_factor_enabled column from profiles
ALTER TABLE public.profiles DROP COLUMN IF EXISTS two_factor_enabled;

-- 6. Drop tables (CASCADE removes remaining constraints)
DROP TABLE IF EXISTS public.security_logs CASCADE;
DROP TABLE IF EXISTS public.two_factor_auth CASCADE;

-- Note: handle_updated_at() function is NOT dropped because other tables may use it.
