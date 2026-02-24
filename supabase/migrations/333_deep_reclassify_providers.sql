-- ============================================================================
-- Migration 333: Deep reclassification — fix ~3,750 misclassified providers
-- ============================================================================
--
-- Audit found providers whose company name clearly indicates a different
-- trade than their current specialty. This migration fixes them.
--
-- Rules: only reclassify when the name STRONGLY indicates the target trade
-- AND does NOT contain the current specialty keyword (avoid multi-trade names).
-- ============================================================================

BEGIN;

-- =============================================
-- 1. menuisier → cuisiniste (678)
-- =============================================
UPDATE providers SET specialty = 'cuisiniste'
WHERE specialty = 'menuisier'
  AND (name ILIKE '%cuisine%' OR name ILIKE '%cuisiniste%')
  AND name NOT ILIKE '%menuiser%' AND name NOT ILIKE '%menuisier%';

-- =============================================
-- 2. couvreur → zingueur (593)
-- =============================================
UPDATE providers SET specialty = 'zingueur'
WHERE specialty = 'couvreur'
  AND (name ILIKE '%zinguerie%' OR name ILIKE '%zinc%' OR name ILIKE '%gouttière%' OR name ILIKE '%gouttiere%')
  AND name NOT ILIKE '%couverture%' AND name NOT ILIKE '%couvreur%';

-- =============================================
-- 3. plombier → salle-de-bain (326)
-- =============================================
UPDATE providers SET specialty = 'salle-de-bain'
WHERE specialty = 'plombier'
  AND (name ILIKE '%salle de bain%' OR name ILIKE '%sanitaire%')
  AND name NOT ILIKE '%plomber%' AND name NOT ILIKE '%plombier%' AND name NOT ILIKE '%plomberie%';

-- =============================================
-- 4. electricien → plombier (316) — multi-trade businesses classified wrong
-- =============================================
UPDATE providers SET specialty = 'plombier'
WHERE specialty = 'electricien'
  AND (name ILIKE '%plomberie%' OR name ILIKE '%plombier%')
  AND name NOT ILIKE '%electri%' AND name NOT ILIKE '%électri%';

-- =============================================
-- 5. chauffagiste → climaticien (267)
-- =============================================
UPDATE providers SET specialty = 'climaticien'
WHERE specialty = 'chauffagiste'
  AND (name ILIKE '%climatisation%' OR name ILIKE '%frigorist%' OR name ILIKE '%froid%')
  AND name NOT ILIKE '%chauffag%' AND name NOT ILIKE '%chauffage%';

-- =============================================
-- 6. macon → couvreur (264)
-- =============================================
UPDATE providers SET specialty = 'couvreur'
WHERE specialty = 'macon'
  AND (name ILIKE '%couverture%' OR name ILIKE '%couvreur%' OR name ILIKE '%toiture%')
  AND name NOT ILIKE '%macon%' AND name NOT ILIKE '%maçon%' AND name NOT ILIKE '%maconnerie%' AND name NOT ILIKE '%maçonnerie%';

-- =============================================
-- 7. macon → terrassier (237)
-- =============================================
UPDATE providers SET specialty = 'terrassier'
WHERE specialty = 'macon'
  AND (name ILIKE '%terrassement%' OR name ILIKE '%terrassier%')
  AND name NOT ILIKE '%macon%' AND name NOT ILIKE '%maçon%' AND name NOT ILIKE '%maconnerie%' AND name NOT ILIKE '%maçonnerie%';

-- =============================================
-- 8. peintre-en-batiment → facadier (198)
-- =============================================
UPDATE providers SET specialty = 'facadier'
WHERE specialty = 'peintre-en-batiment'
  AND (name ILIKE '%facade%' OR name ILIKE '%façade%' OR name ILIKE '%ravalement%')
  AND name NOT ILIKE '%peinture%' AND name NOT ILIKE '%peintre%';

-- =============================================
-- 9. paysagiste → jardinier (191)
-- =============================================
UPDATE providers SET specialty = 'jardinier'
WHERE specialty = 'paysagiste'
  AND (name ILIKE '%jardinier%' OR name ILIKE '%jardinage%' OR name ILIKE '%tonte%' OR name ILIKE '%tondre%' OR name ILIKE '%entretien jardin%')
  AND name NOT ILIKE '%paysagist%' AND name NOT ILIKE '%paysager%';

-- =============================================
-- 10. macon → peintre-en-batiment (190)
-- =============================================
UPDATE providers SET specialty = 'peintre-en-batiment'
WHERE specialty = 'macon'
  AND (name ILIKE '%peinture%' OR name ILIKE '%peintre%')
  AND name NOT ILIKE '%macon%' AND name NOT ILIKE '%maçon%' AND name NOT ILIKE '%maconnerie%' AND name NOT ILIKE '%maçonnerie%';

-- =============================================
-- 11. menuisier → storiste (129)
-- =============================================
UPDATE providers SET specialty = 'storiste'
WHERE specialty = 'menuisier'
  AND (name ILIKE '%store%' OR name ILIKE '%volet%' OR name ILIKE '%fermeture%')
  AND name NOT ILIKE '%menuiser%' AND name NOT ILIKE '%menuisier%';

-- =============================================
-- 12. macon → facadier (117)
-- =============================================
UPDATE providers SET specialty = 'facadier'
WHERE specialty = 'macon'
  AND (name ILIKE '%facade%' OR name ILIKE '%façade%' OR name ILIKE '%ravalement%')
  AND name NOT ILIKE '%macon%' AND name NOT ILIKE '%maçon%' AND name NOT ILIKE '%construction%';

-- =============================================
-- 13. macon → charpentier (103)
-- =============================================
UPDATE providers SET specialty = 'charpentier'
WHERE specialty = 'macon'
  AND (name ILIKE '%charpent%')
  AND name NOT ILIKE '%macon%' AND name NOT ILIKE '%maçon%' AND name NOT ILIKE '%maconnerie%' AND name NOT ILIKE '%maçonnerie%';

-- =============================================
-- 14. electricien → alarme-securite (55)
-- =============================================
UPDATE providers SET specialty = 'alarme-securite'
WHERE specialty = 'electricien'
  AND (name ILIKE '%alarme%' OR name ILIKE '%surveillance%')
  AND name NOT ILIKE '%electri%' AND name NOT ILIKE '%électri%';

-- =============================================
-- 15. peintre-en-batiment → carreleur (35)
-- =============================================
UPDATE providers SET specialty = 'carreleur'
WHERE specialty = 'peintre-en-batiment'
  AND (name ILIKE '%carrelage%' OR name ILIKE '%carreleur%')
  AND name NOT ILIKE '%peinture%' AND name NOT ILIKE '%peintre%';

-- =============================================
-- 16. peintre-en-batiment → vitrier (24)
-- =============================================
UPDATE providers SET specialty = 'vitrier'
WHERE specialty = 'peintre-en-batiment'
  AND (name ILIKE '%vitrerie%' OR name ILIKE '%vitrier%' OR name ILIKE '%vitrage%')
  AND name NOT ILIKE '%peinture%' AND name NOT ILIKE '%peintre%';

-- =============================================
-- 17. chauffagiste → panneaux-solaires (13)
-- =============================================
UPDATE providers SET specialty = 'panneaux-solaires'
WHERE specialty = 'chauffagiste'
  AND (name ILIKE '%solaire%' OR name ILIKE '%photovolta%')
  AND name NOT ILIKE '%chauffag%';

-- =============================================
-- 18. peintre-en-batiment → platrier (10)
-- =============================================
UPDATE providers SET specialty = 'platrier'
WHERE specialty = 'peintre-en-batiment'
  AND (name ILIKE '%plâtrier%' OR name ILIKE '%platrier%' OR name ILIKE '%plâtrerie%')
  AND name NOT ILIKE '%peinture%' AND name NOT ILIKE '%peintre%';

-- =============================================
-- 19. electricien → panneaux-solaires (2)
-- =============================================
UPDATE providers SET specialty = 'panneaux-solaires'
WHERE specialty = 'electricien'
  AND (name ILIKE '%solaire%' OR name ILIKE '%photovolta%')
  AND name NOT ILIKE '%electri%' AND name NOT ILIKE '%électri%';

COMMIT;
