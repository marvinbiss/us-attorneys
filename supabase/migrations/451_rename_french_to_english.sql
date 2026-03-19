-- Migration 451: Rename ALL French column/table names to English
-- Covers: barometre_stats, prestations_tarifs, coefficients_geo, estimation_leads,
--         reviews (artisan_response), profiles (role='artisan'), opening_hours JSONB

-- ============================================================
-- 1. barometre_stats — rename French columns to English
-- ============================================================

ALTER TABLE IF EXISTS barometre_stats RENAME COLUMN metier TO specialty;
ALTER TABLE IF EXISTS barometre_stats RENAME COLUMN metier_slug TO specialty_slug;
ALTER TABLE IF EXISTS barometre_stats RENAME COLUMN ville TO city;
ALTER TABLE IF EXISTS barometre_stats RENAME COLUMN ville_slug TO city_slug;
ALTER TABLE IF EXISTS barometre_stats RENAME COLUMN departement TO state_name;
ALTER TABLE IF EXISTS barometre_stats RENAME COLUMN departement_code TO state_code;
ALTER TABLE IF EXISTS barometre_stats RENAME COLUMN nb_artisans TO attorney_count;
ALTER TABLE IF EXISTS barometre_stats RENAME COLUMN note_moyenne TO average_rating;
ALTER TABLE IF EXISTS barometre_stats RENAME COLUMN nb_avis TO review_count;
ALTER TABLE IF EXISTS barometre_stats RENAME COLUMN taux_verification TO verification_rate;
ALTER TABLE IF EXISTS barometre_stats RENAME COLUMN variation_trimestre TO quarterly_variation;

-- Recreate indexes with English names (drop old French-named ones)
DROP INDEX IF EXISTS idx_barometre_stats_metier_geo;
DROP INDEX IF EXISTS idx_barometre_stats_region;
DROP INDEX IF EXISTS idx_barometre_stats_dept;
DROP INDEX IF EXISTS idx_barometre_stats_metier;

CREATE UNIQUE INDEX IF NOT EXISTS idx_barometre_stats_specialty_geo
  ON barometre_stats (specialty_slug, COALESCE(city_slug, ''), COALESCE(state_code, ''), COALESCE(region_slug, ''));

CREATE INDEX IF NOT EXISTS idx_barometre_stats_region ON barometre_stats (region_slug) WHERE region_slug IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_barometre_stats_state ON barometre_stats (state_code) WHERE state_code IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_barometre_stats_specialty ON barometre_stats (specialty_slug);

-- Update table comment
COMMENT ON TABLE barometre_stats IS 'Aggregated statistics for the Attorney Barometer. Refreshed by aggregate-barometre.ts via service_role.';

-- Update RLS policy name
ALTER POLICY "Lecture publique barometre_stats" ON barometre_stats RENAME TO "Public read barometre_stats";

-- ============================================================
-- 2. prestations_tarifs → service_pricing
-- ============================================================

ALTER TABLE IF EXISTS prestations_tarifs RENAME TO service_pricing;

ALTER TABLE IF EXISTS service_pricing RENAME COLUMN metier TO service_type;
ALTER TABLE IF EXISTS service_pricing RENAME COLUMN prestation TO service_name;
ALTER TABLE IF EXISTS service_pricing RENAME COLUMN unite TO unit_type;
ALTER TABLE IF EXISTS service_pricing RENAME COLUMN prix_min TO price_min;
ALTER TABLE IF EXISTS service_pricing RENAME COLUMN prix_max TO price_max;
ALTER TABLE IF EXISTS service_pricing RENAME COLUMN fiabilite TO reliability;

-- Update CHECK constraint (recreate with English values)
ALTER TABLE IF EXISTS service_pricing DROP CONSTRAINT IF EXISTS chk_unite;
ALTER TABLE IF EXISTS service_pricing ADD CONSTRAINT chk_unit_type
  CHECK (unit_type IN ('flat_rate', 'sq_ft', 'linear_ft', 'service_call', 'hourly',
                       'forfait', 'm²', 'mètre linéaire', 'intervention', 'heure'));
-- NOTE: keeps old French values valid for existing data; new inserts should use English values

ALTER TABLE IF EXISTS service_pricing DROP CONSTRAINT IF EXISTS chk_prix;
ALTER TABLE IF EXISTS service_pricing ADD CONSTRAINT chk_price CHECK (price_min > 0 AND price_max >= price_min);

-- Rename index
DROP INDEX IF EXISTS idx_prestations_metier;
CREATE INDEX IF NOT EXISTS idx_service_pricing_type ON service_pricing(service_type);

-- Rename RLS policies
ALTER POLICY "prestations_tarifs_select_public" ON service_pricing RENAME TO "service_pricing_select_public";
ALTER POLICY "prestations_tarifs_insert_service_role" ON service_pricing RENAME TO "service_pricing_insert_service_role";
ALTER POLICY "prestations_tarifs_update_service_role" ON service_pricing RENAME TO "service_pricing_update_service_role";
ALTER POLICY "prestations_tarifs_delete_service_role" ON service_pricing RENAME TO "service_pricing_delete_service_role";

-- ============================================================
-- 3. coefficients_geo → geographic_coefficients
-- ============================================================

ALTER TABLE IF EXISTS coefficients_geo RENAME TO geographic_coefficients;

ALTER TABLE IF EXISTS geographic_coefficients RENAME COLUMN departement TO state_code;

-- Rename RLS policies
ALTER POLICY "coefficients_geo_select_public" ON geographic_coefficients RENAME TO "geographic_coefficients_select_public";
ALTER POLICY "coefficients_geo_insert_service_role" ON geographic_coefficients RENAME TO "geographic_coefficients_insert_service_role";
ALTER POLICY "coefficients_geo_update_service_role" ON geographic_coefficients RENAME TO "geographic_coefficients_update_service_role";
ALTER POLICY "coefficients_geo_delete_service_role" ON geographic_coefficients RENAME TO "geographic_coefficients_delete_service_role";

-- ============================================================
-- 4. estimation_leads — rename French columns
-- ============================================================

ALTER TABLE IF EXISTS estimation_leads RENAME COLUMN nom TO name;
ALTER TABLE IF EXISTS estimation_leads RENAME COLUMN telephone TO phone;
ALTER TABLE IF EXISTS estimation_leads RENAME COLUMN metier TO specialty;
ALTER TABLE IF EXISTS estimation_leads RENAME COLUMN ville TO city;
ALTER TABLE IF EXISTS estimation_leads RENAME COLUMN departement TO state;
ALTER TABLE IF EXISTS estimation_leads RENAME COLUMN description_projet TO project_description;
ALTER TABLE IF EXISTS estimation_leads RENAME COLUMN artisan_public_id TO attorney_public_id;

-- ============================================================
-- 5. reviews — rename artisan columns
-- ============================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reviews' AND column_name = 'artisan_response') THEN
    ALTER TABLE reviews RENAME COLUMN artisan_response TO attorney_response;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reviews' AND column_name = 'artisan_responded_at') THEN
    ALTER TABLE reviews RENAME COLUMN artisan_responded_at TO attorney_responded_at;
  END IF;
END $$;

-- ============================================================
-- 6. profiles.role — change 'artisan' value to 'attorney'
-- ============================================================

UPDATE profiles SET role = 'attorney' WHERE role = 'artisan';

-- ============================================================
-- 7. opening_hours JSONB — rename French keys to English
-- Day names: lundi→monday, mardi→tuesday, mercredi→wednesday,
--            jeudi→thursday, vendredi→friday, samedi→saturday, dimanche→sunday
-- Field names: ouvert→open, debut→start, fin→end
-- ============================================================

UPDATE attorneys
SET opening_hours = (
  SELECT jsonb_object_agg(
    CASE key
      WHEN 'lundi' THEN 'monday'
      WHEN 'mardi' THEN 'tuesday'
      WHEN 'mercredi' THEN 'wednesday'
      WHEN 'jeudi' THEN 'thursday'
      WHEN 'vendredi' THEN 'friday'
      WHEN 'samedi' THEN 'saturday'
      WHEN 'dimanche' THEN 'sunday'
      ELSE key
    END,
    jsonb_build_object(
      'open', COALESCE((value->>'ouvert')::boolean, false),
      'start', COALESCE(value->>'debut', ''),
      'end', COALESCE(value->>'fin', '')
    )
  )
  FROM jsonb_each(opening_hours)
)
WHERE opening_hours IS NOT NULL AND opening_hours != '{}'::jsonb;

-- ============================================================
-- 8. devis_requests → quote_requests
-- ============================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'devis_requests') THEN
    ALTER TABLE devis_requests RENAME TO quote_requests;
  END IF;
END $$;
