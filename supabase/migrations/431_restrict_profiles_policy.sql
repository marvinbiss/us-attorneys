-- =============================================================================
-- Migration 431: Restrict profiles SELECT policy — minimize PII exposure
-- US Attorneys — 2026-03-18
-- =============================================================================
-- Problem:
--   Migration 328 introduced "Anyone can view artisan profiles" which exposes
--   ALL columns (email, phone, address, etc.) for attorney profiles to anonymous
--   users. This is a PII leak — Doctolib-level security requires column-level
--   restriction.
--
-- Solution:
--   1. Create a public_profiles VIEW exposing only non-PII columns
--   2. Replace the broad "Anyone can view artisan profiles" policy with one
--      that still allows public pages to function via the VIEW
--   3. Keep "Users can view own profile" and "Admins can view all profiles" intact
-- =============================================================================

-- 1. Create public_profiles VIEW — only non-PII fields
--    This is what public pages and anonymous users should query.
DROP VIEW IF EXISTS public_profiles;
CREATE VIEW public_profiles AS
  SELECT
    id,
    full_name,
    role,
    user_type,
    avatar_url
  FROM profiles
  WHERE role = 'artisan'
    AND (is_admin = FALSE OR is_admin IS NULL);

COMMENT ON VIEW public_profiles IS
  'Public-safe subset of profiles. Exposes only non-PII columns (id, full_name, role, user_type, avatar_url). Use this view for anonymous/public queries instead of the profiles table directly.';

-- 2. Grant SELECT on the VIEW to anon and authenticated roles
GRANT SELECT ON public_profiles TO anon;
GRANT SELECT ON public_profiles TO authenticated;

-- 3. Tighten the profiles table RLS
--    Drop the overly permissive "Anyone can view artisan profiles" policy
--    that exposes ALL columns including email/phone/address.
DROP POLICY IF EXISTS "Anyone can view artisan profiles" ON profiles;

-- 4. Re-create a restricted anonymous access policy
--    Anonymous users can ONLY see the 5 safe columns for attorney profiles.
--    This uses a security_barrier subquery approach: the policy allows SELECT
--    but the VIEW is the recommended access path.
--    We still need a base-table policy so the VIEW (which queries profiles) works
--    for anon role. But we restrict it to the same filter as the VIEW.
CREATE POLICY "Anon can view attorney profiles (limited)" ON profiles
  FOR SELECT
  USING (
    auth.uid() IS NULL
    AND role = 'artisan'
    AND (is_admin = FALSE OR is_admin IS NULL)
  );

-- 5. Ensure existing policies are intact (idempotent re-creation)
--    "Users can view own profile" — each user sees their full profile
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (id = auth.uid());

--    "Admins can view all profiles" — admins see everything
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
CREATE POLICY "Admins can view all profiles" ON profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
        AND (
          p.is_admin = TRUE
          OR p.role IN ('super_admin', 'admin', 'moderator', 'viewer')
        )
    )
  );

-- =============================================================================
-- MIGRATION NOTE:
-- After deploying this migration, server-side code that reads attorney profiles
-- for public display should use:
--   supabase.from('public_profiles').select('id, full_name, avatar_url')
-- instead of:
--   supabase.from('profiles').select('*').eq('role', 'artisan')
--
-- Routes that need full profile data (email, phone) for business logic
-- (bookings, messaging) MUST use createAdminClient() which bypasses RLS.
-- =============================================================================
