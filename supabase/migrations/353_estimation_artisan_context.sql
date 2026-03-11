-- =============================================================================
-- Migration 353 : Ajouter artisan_public_id à estimation_leads
-- 2026-03-11
-- =============================================================================
-- Permet de lier un lead au profil artisan consulté (fiche individuelle)

ALTER TABLE estimation_leads
  ADD COLUMN IF NOT EXISTS artisan_public_id text;

COMMENT ON COLUMN estimation_leads.artisan_public_id IS
  'stable_id ou slug de l''artisan consulté. NULL si lead depuis page listing.';

-- Index pour requêtes admin filtrées par artisan
CREATE INDEX IF NOT EXISTS idx_estimation_leads_artisan
  ON estimation_leads (artisan_public_id)
  WHERE artisan_public_id IS NOT NULL;
