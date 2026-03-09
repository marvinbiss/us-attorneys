-- Covering index for provider sitemap queries
-- Replaces idx_providers_sitemap (single column) with a composite covering index
-- that serves all columns needed by /api/sitemap-providers without heap fetches.
-- This dramatically improves OFFSET pagination performance for sitemap generation.

DROP INDEX IF EXISTS idx_providers_sitemap;

CREATE INDEX idx_providers_sitemap_v2
  ON providers (updated_at DESC, id DESC)
  INCLUDE (name, slug, stable_id, specialty, address_city)
  WHERE is_active = TRUE AND noindex = FALSE;
