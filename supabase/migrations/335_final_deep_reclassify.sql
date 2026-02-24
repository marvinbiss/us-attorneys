-- ============================================================================
-- Migration 335: Final deep reclassification — fix ~4,600+ misclassified providers
-- ============================================================================
--
-- Comprehensive audit found additional patterns missed by migrations 332-334.
-- This migration handles:
--   1. Slug normalization (decorateur → decorateur-interieur)
--   2. serrurier → metallier (metallerie/soudure/chaudronnerie businesses)
--   3. Name-based sub-specialty reclassifications
--   4. NULL specialty assignment by company name
--
-- Total estimated: ~4,600 providers reclassified
-- ============================================================================

-- Increase timeout for large UPDATE operations
SET statement_timeout = '300s';

BEGIN;

-- =============================================
-- 1. FIX SLUG: decorateur → decorateur-interieur (2,933)
-- =============================================
UPDATE providers SET specialty = 'decorateur-interieur'
WHERE specialty = 'decorateur';

-- =============================================
-- 2. serrurier → metallier (metallerie in name, ~931)
-- =============================================
UPDATE providers SET specialty = 'metallier'
WHERE specialty = 'serrurier'
  AND (name ILIKE '%metalleri%' OR name ILIKE '%métalleri%')
  AND name NOT ILIKE '%serrurier%'
  AND name NOT ILIKE '%serrurerie%';

-- =============================================
-- 3. serrurier → metallier (soudure in name, ~121)
-- =============================================
UPDATE providers SET specialty = 'metallier'
WHERE specialty = 'serrurier'
  AND (name ILIKE '%soudure%' OR name ILIKE '%soudeur%')
  AND name NOT ILIKE '%serrurier%'
  AND name NOT ILIKE '%serrurerie%';

-- =============================================
-- 4. serrurier → metallier (chaudronnerie/construction metallique, ~53)
-- =============================================
UPDATE providers SET specialty = 'metallier'
WHERE specialty = 'serrurier'
  AND (name ILIKE '%chaudronneri%' OR name ILIKE '%construction metallique%' OR name ILIKE '%construction métallique%')
  AND name NOT ILIKE '%serrurier%'
  AND name NOT ILIKE '%serrurerie%';

-- =============================================
-- 5. couvreur → etancheiste (etancheite in name, ~179)
-- =============================================
UPDATE providers SET specialty = 'etancheiste'
WHERE specialty = 'couvreur'
  AND (name ILIKE '%etanchei%' OR name ILIKE '%étanchéi%')
  AND name NOT ILIKE '%couverture%'
  AND name NOT ILIKE '%couvreur%'
  AND name NOT ILIKE '%toiture%';

-- =============================================
-- 6. macon → facadier (enduit in name, ~150)
-- =============================================
UPDATE providers SET specialty = 'facadier'
WHERE specialty = 'macon'
  AND (name ILIKE '%enduit%' OR name ILIKE '%crepis%' OR name ILIKE '%crépis%')
  AND name NOT ILIKE '%macon%'
  AND name NOT ILIKE '%maçon%'
  AND name NOT ILIKE '%construction%';

-- =============================================
-- 7. macon → isolation-thermique (isolation in name, ~149)
-- =============================================
UPDATE providers SET specialty = 'isolation-thermique'
WHERE specialty = 'macon'
  AND (name ILIKE '%isolation%' OR name ILIKE '%isolant%')
  AND name NOT ILIKE '%macon%'
  AND name NOT ILIKE '%maçon%'
  AND name NOT ILIKE '%construction%';

-- =============================================
-- 8. chauffagiste → ramoneur (cheminee/ramonage/fumisterie, ~139)
-- =============================================
UPDATE providers SET specialty = 'ramoneur'
WHERE specialty = 'chauffagiste'
  AND (
    name ILIKE '%cheminee%' OR name ILIKE '%cheminée%'
    OR name ILIKE '%ramonage%' OR name ILIKE '%ramoneur%'
    OR name ILIKE '%fumisterie%'
  )
  AND name NOT ILIKE '%chauffag%';

-- =============================================
-- 9. peintre-en-batiment → platrier (platre/placo, ~70)
-- =============================================
UPDATE providers SET specialty = 'platrier'
WHERE specialty = 'peintre-en-batiment'
  AND (
    name ILIKE '%platr%' OR name ILIKE '%plâtr%'
    OR name ILIKE '%placo%' OR name ILIKE '%placoplatre%'
    OR name ILIKE '%plaquist%'
  )
  AND name NOT ILIKE '%peinture%'
  AND name NOT ILIKE '%peintre%';

-- =============================================
-- 10. carreleur → solier (moquette/revetement sol, ~47)
-- =============================================
UPDATE providers SET specialty = 'solier'
WHERE specialty = 'carreleur'
  AND (
    name ILIKE '%moquette%'
    OR name ILIKE '%revetement sol%' OR name ILIKE '%revêtement sol%'
    OR name ILIKE '%sol souple%'
    OR name ILIKE '%linoleum%' OR name ILIKE '%lino %'
  )
  AND name NOT ILIKE '%carrelage%'
  AND name NOT ILIKE '%carreleur%';

-- =============================================
-- 11. electricien → ascensoriste (ascenseur, ~23)
-- =============================================
UPDATE providers SET specialty = 'ascensoriste'
WHERE specialty = 'electricien'
  AND (name ILIKE '%ascenseur%' OR name ILIKE '%monte-charge%' OR name ILIKE '%elevateur%' OR name ILIKE '%élévateur%')
  AND name NOT ILIKE '%electri%'
  AND name NOT ILIKE '%électri%';

-- =============================================
-- 12. desinsectisation → nettoyage (~16)
-- =============================================
UPDATE providers SET specialty = 'nettoyage'
WHERE specialty = 'desinsectisation'
  AND (name ILIKE '%nettoyage%' OR name ILIKE '%proprete%' OR name ILIKE '%propreté%')
  AND name NOT ILIKE '%insect%'
  AND name NOT ILIKE '%nuisible%';

-- =============================================
-- 13. NULL specialty → assign by company name (154 providers)
-- =============================================

-- plombier
UPDATE providers SET specialty = 'plombier'
WHERE specialty IS NULL
  AND (name ILIKE '%plombier%' OR name ILIKE '%plomberie%');

-- electricien
UPDATE providers SET specialty = 'electricien'
WHERE specialty IS NULL
  AND (name ILIKE '%electri%' OR name ILIKE '%électri%');

-- peintre-en-batiment
UPDATE providers SET specialty = 'peintre-en-batiment'
WHERE specialty IS NULL
  AND (name ILIKE '%peintre%' OR name ILIKE '%peinture%');

-- menuisier
UPDATE providers SET specialty = 'menuisier'
WHERE specialty IS NULL
  AND (name ILIKE '%menuisier%' OR name ILIKE '%menuiserie%');

-- macon
UPDATE providers SET specialty = 'macon'
WHERE specialty IS NULL
  AND (name ILIKE '%macon%' OR name ILIKE '%maçon%' OR name ILIKE '%maconnerie%' OR name ILIKE '%maçonnerie%');

-- couvreur
UPDATE providers SET specialty = 'couvreur'
WHERE specialty IS NULL
  AND (name ILIKE '%couvreur%' OR name ILIKE '%couverture%' OR name ILIKE '%toiture%');

-- carreleur
UPDATE providers SET specialty = 'carreleur'
WHERE specialty IS NULL
  AND (name ILIKE '%carreleur%' OR name ILIKE '%carrelage%');

-- platrier (plaquiste)
UPDATE providers SET specialty = 'platrier'
WHERE specialty IS NULL
  AND (name ILIKE '%plaquist%' OR name ILIKE '%platrier%' OR name ILIKE '%plâtrier%' OR name ILIKE '%placo%');

-- isolation-thermique
UPDATE providers SET specialty = 'isolation-thermique'
WHERE specialty IS NULL
  AND (name ILIKE '%isolation%' OR name ILIKE '%isolant%');

-- charpentier
UPDATE providers SET specialty = 'charpentier'
WHERE specialty IS NULL
  AND (name ILIKE '%charpent%');

-- serrurier
UPDATE providers SET specialty = 'serrurier'
WHERE specialty IS NULL
  AND (name ILIKE '%serrurier%' OR name ILIKE '%serrurerie%');

-- chauffagiste
UPDATE providers SET specialty = 'chauffagiste'
WHERE specialty IS NULL
  AND (name ILIKE '%chauffag%');

-- jardinier
UPDATE providers SET specialty = 'jardinier'
WHERE specialty IS NULL
  AND (name ILIKE '%jardin%' OR name ILIKE '%elagage%' OR name ILIKE '%espaces verts%');

-- paysagiste
UPDATE providers SET specialty = 'paysagiste'
WHERE specialty IS NULL
  AND (name ILIKE '%paysagist%');

-- renovation (generic)
UPDATE providers SET specialty = 'macon'
WHERE specialty IS NULL
  AND (name ILIKE '%renovation%' OR name ILIKE '%rénovation%' OR name ILIKE '%renov %');

COMMIT;
