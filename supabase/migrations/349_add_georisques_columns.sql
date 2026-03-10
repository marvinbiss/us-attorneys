-- Add Géorisques risk data columns to communes table
ALTER TABLE communes ADD COLUMN IF NOT EXISTS risque_inondation boolean DEFAULT false;
ALTER TABLE communes ADD COLUMN IF NOT EXISTS risque_argile text; -- 'fort', 'moyen', 'faible', null
ALTER TABLE communes ADD COLUMN IF NOT EXISTS zone_sismique integer; -- 1-5 (1=très faible, 5=forte)
ALTER TABLE communes ADD COLUMN IF NOT EXISTS risque_radon integer; -- 1-3 (1=faible, 3=élevé)
ALTER TABLE communes ADD COLUMN IF NOT EXISTS nb_catnat integer DEFAULT 0; -- nombre d'arrêtés CatNat
ALTER TABLE communes ADD COLUMN IF NOT EXISTS risques_principaux text[]; -- array of risk labels
ALTER TABLE communes ADD COLUMN IF NOT EXISTS georisques_enriched_at timestamptz;
