-- ============================================================================
-- Migration 334: Reclassify jardiniers from paysagiste
-- ============================================================================
--
-- NAF 81.30Z covers both paysagistes (conception) and jardiniers (entretien).
-- This migration uses company name to distinguish:
--   - Garden maintenance keywords → jardinier
--   - Landscape design keywords → stay paysagiste
--   - No keyword (personal names) → stay paysagiste (can't differentiate)
--
-- Expected: ~5,000+ providers reclassified to jardinier
-- ============================================================================

BEGIN;

-- Companies with garden maintenance keywords → jardinier
-- Only if name does NOT also contain paysagiste keywords
UPDATE providers SET specialty = 'jardinier'
WHERE specialty = 'paysagiste'
  AND (
    -- Jardin/jardinage
    name ILIKE '%jardin%'
    -- Élagage
    OR name ILIKE '%elagage%'
    OR name ILIKE '%élagage%'
    OR name ILIKE '%elagueur%'
    OR name ILIKE '%élagueur%'
    -- Espaces verts
    OR name ILIKE '%espaces verts%'
    OR name ILIKE '%espace vert%'
    -- Entretien
    OR name ILIKE '%entretien%'
    -- Tonte/pelouse/gazon
    OR name ILIKE '%tonte%'
    OR name ILIKE '%pelouse%'
    OR name ILIKE '%gazon%'
    OR name ILIKE '%tondeuse%'
    -- Débroussaillage
    OR name ILIKE '%debroussaillage%'
    OR name ILIKE '%débroussaillage%'
    -- Haie/taille
    OR name ILIKE '%taille de haie%'
    OR name ILIKE '%taille haie%'
    -- Arrosage
    OR name ILIKE '%arrosage%'
    -- Motoculture
    OR name ILIKE '%motoculture%'
  )
  -- Exclude if name clearly indicates paysagiste
  AND name NOT ILIKE '%paysagist%'
  AND name NOT ILIKE '%paysager%'
  AND name NOT ILIKE '%conception%'
  AND name NOT ILIKE '%architecte%';

COMMIT;
