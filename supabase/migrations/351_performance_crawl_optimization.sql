-- =============================================================================
-- Migration 351 : Performance optimization for Google crawl speed
-- 2026-03-11
-- =============================================================================
-- Objectif: Réduire le temps de réponse serveur sous 200ms
--
-- 1. Vue matérialisée mv_provider_stats (page /a-propos)
-- 2. Covering index pour getAllProviders() tri (phone, is_verified, name)
-- 3. Index trigram pour admin ilike sur devis_requests (pg_trgm activé en 303)
-- 4. Fonction refresh_provider_stats() pour cron
-- =============================================================================

-- ============================================================================
-- 1. VUE MATÉRIALISÉE : statistiques globales pour /a-propos
-- ============================================================================
-- Remplace les 3 requêtes O(n) sur 350K+ rows par une seule lecture.
-- Distincte de mv_provider_counts (312) qui agrège par specialty × city.
-- Celle-ci fournit des agrégats globaux pour la page /a-propos.
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_provider_stats AS
SELECT
  COUNT(*) FILTER (WHERE is_active = true) AS active_count,
  COUNT(DISTINCT address_city) FILTER (WHERE is_active = true) AS unique_cities,
  COALESCE(SUM(review_count) FILTER (WHERE is_active = true AND review_count > 0), 0) AS total_reviews,
  COUNT(*) FILTER (WHERE is_active = true AND review_count > 0) AS providers_with_reviews,
  NOW() AS last_refreshed
FROM providers;

-- Index unique requis pour REFRESH CONCURRENTLY
CREATE UNIQUE INDEX IF NOT EXISTS mv_provider_stats_unique
  ON mv_provider_stats (active_count, unique_cities);

-- ============================================================================
-- 2. COVERING INDEX pour getAllProviders()
-- ============================================================================
-- Le tri courant est (phone DESC NULLS LAST, is_verified DESC, name ASC)
-- avec filtre is_active = TRUE. Ce covering index sert toutes les colonnes
-- nécessaires depuis l'index, sans heap fetch.
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_providers_active_listing
  ON providers (is_active, phone DESC NULLS LAST, is_verified DESC, name ASC)
  INCLUDE (id, stable_id, slug, specialty, address_city, rating_average, review_count, latitude, longitude)
  WHERE is_active = TRUE;

-- ============================================================================
-- 3. INDEX TRIGRAM pour admin ilike sur devis_requests
-- ============================================================================
-- Pour /api/admin/leads qui utilise ilike('%city%', '%service%')
-- pg_trgm est activé depuis migration 303.
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_devis_requests_city_service_trgm
  ON devis_requests USING gin (city gin_trgm_ops, service_name gin_trgm_ops);

-- ============================================================================
-- 4. FONCTION : refresh mv_provider_stats (appelée par cron)
-- ============================================================================
CREATE OR REPLACE FUNCTION refresh_provider_stats()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_provider_stats;
  ANALYZE mv_provider_stats;
END;
$$;

COMMENT ON FUNCTION refresh_provider_stats IS
  'Rafraîchit mv_provider_stats + ANALYZE. Appelée par cron ou après refresh_artisan_stats().';

-- ============================================================================
-- 5. ÉTENDRE refresh_artisan_stats() pour inclure mv_provider_stats
-- ============================================================================
CREATE OR REPLACE FUNCTION refresh_artisan_stats()
RETURNS VOID AS $fn$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_artisan_counts_by_dept;
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_artisan_counts_by_city;
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_artisan_counts_by_region;
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_provider_counts;
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_provider_stats;
  -- Update stats after MV refresh (monitor-vacuum-analyze.md)
  ANALYZE mv_provider_counts;
  ANALYZE mv_provider_stats;
END;
$fn$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION refresh_artisan_stats IS
  'Rafraîchit les 5 vues matérialisées + ANALYZE. À appeler après collecte/enrichissement.';

-- ============================================================================
-- COMMENTAIRES
-- ============================================================================
COMMENT ON MATERIALIZED VIEW mv_provider_stats IS
  'Statistiques globales providers pour /a-propos. Rafraîchie par refresh_provider_stats() ou refresh_artisan_stats().';

COMMENT ON INDEX idx_providers_active_listing IS
  'Covering index pour getAllProviders() — tri phone/is_verified/name avec colonnes INCLUDE. Évite heap fetch.';

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================
