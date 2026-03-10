-- Migration 350: Table d'agrégation pour le Baromètre des Artisans
-- Stocke les statistiques pré-calculées par métier × géographie

CREATE TABLE IF NOT EXISTS barometre_stats (
  id SERIAL PRIMARY KEY,
  -- Dimension métier
  metier TEXT NOT NULL,
  metier_slug TEXT NOT NULL,
  -- Dimension géographique (nullable = stats nationales)
  ville TEXT,
  ville_slug TEXT,
  departement TEXT,
  departement_code TEXT,
  region TEXT,
  region_slug TEXT,
  -- Métriques
  nb_artisans INTEGER DEFAULT 0,
  note_moyenne NUMERIC(3,2),
  nb_avis INTEGER DEFAULT 0,
  taux_verification NUMERIC(5,4) DEFAULT 0,
  -- NB: pas de prix en base providers — on utilise les données barometre.ts statiques
  -- variation_trimestre sera calculée par diff avec le snapshot précédent
  variation_trimestre NUMERIC(5,2),
  -- Timestamps
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index composite pour les lookups fréquents
CREATE UNIQUE INDEX IF NOT EXISTS idx_barometre_stats_metier_geo
  ON barometre_stats (metier_slug, COALESCE(ville_slug, ''), COALESCE(departement_code, ''), COALESCE(region_slug, ''));

CREATE INDEX IF NOT EXISTS idx_barometre_stats_region ON barometre_stats (region_slug) WHERE region_slug IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_barometre_stats_dept ON barometre_stats (departement_code) WHERE departement_code IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_barometre_stats_metier ON barometre_stats (metier_slug);

-- RLS: lecture publique, écriture service_role uniquement
ALTER TABLE barometre_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Lecture publique barometre_stats"
  ON barometre_stats FOR SELECT
  USING (true);

COMMENT ON TABLE barometre_stats IS 'Statistiques agrégées pour le Baromètre des Artisans. Mis à jour par le script aggregate-barometre.ts via service_role.';
