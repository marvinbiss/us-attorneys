-- ============================================================================
-- Migration 332: Reclassify sub-specialties based on company name patterns
-- ============================================================================
--
-- Problem: Many sub-specialties share the same NAF code as their parent trade.
-- Solution: Use company name (ILIKE) to identify the actual specialty.
--
-- Only reclassifies providers whose name CLEARLY indicates the sub-specialty.
-- Providers with ambiguous names keep their parent specialty.
-- ============================================================================

BEGIN;

-- =============================================
-- 1. FROM electricien (43.21A) → sub-specialties
-- =============================================

-- domoticien
UPDATE providers SET specialty = 'domoticien'
WHERE specialty = 'electricien'
  AND (name ILIKE '%domotique%' OR name ILIKE '%domotiq%' OR name ILIKE '%smart home%' OR name ILIKE '%maison connect%');

-- alarme-securite
UPDATE providers SET specialty = 'alarme-securite'
WHERE specialty = 'electricien'
  AND (name ILIKE '%alarme%' OR name ILIKE '%surveillance%' OR name ILIKE '%vidéosurveillance%'
    OR name ILIKE '%videosurveillance%' OR name ILIKE '%télésurveillance%'
    OR name ILIKE '%securite incendie%' OR name ILIKE '%sécurité incendie%'
    OR name ILIKE '%detection incendie%' OR name ILIKE '%détection incendie%')
  AND name NOT ILIKE '%electricit%' AND name NOT ILIKE '%electrique%';

-- antenniste
UPDATE providers SET specialty = 'antenniste'
WHERE specialty = 'electricien'
  AND (name ILIKE '%antenne%' OR name ILIKE '%satellite%' OR name ILIKE '%parabole%'
    OR name ILIKE '%tnt%' OR name ILIKE '%fibre optique%');

-- borne-recharge
UPDATE providers SET specialty = 'borne-recharge'
WHERE specialty = 'electricien'
  AND (name ILIKE '%borne de recharge%' OR name ILIKE '%borne recharge%'
    OR name ILIKE '%irve%' OR name ILIKE '%recharge vehicule%'
    OR name ILIKE '%recharge véhicule%' OR name ILIKE '%borne electrique%');

-- panneaux-solaires (electriciens who do solar)
UPDATE providers SET specialty = 'panneaux-solaires'
WHERE specialty = 'electricien'
  AND (name ILIKE '%solaire%' OR name ILIKE '%photovolta%' OR name ILIKE '%solar%'
    OR name ILIKE '%panneau%solai%')
  AND name NOT ILIKE '%chauff%' AND name NOT ILIKE '%thermiq%';

-- =============================================
-- 2. FROM chauffagiste (43.22B) → sub-specialties
-- =============================================

-- climaticien
UPDATE providers SET specialty = 'climaticien'
WHERE specialty = 'chauffagiste'
  AND (name ILIKE '%climatisation%' OR name ILIKE '%climatiseur%'
    OR name ILIKE '%froid%' OR name ILIKE '% clim %' OR name ILIKE '%clim-%'
    OR name ILIKE '%frigoriste%' OR name ILIKE '%frigorifique%'
    OR name ILIKE '%réfrigér%' OR name ILIKE '%refriger%')
  AND name NOT ILIKE '%chauffag%';

-- pompe-a-chaleur
UPDATE providers SET specialty = 'pompe-a-chaleur'
WHERE specialty = 'chauffagiste'
  AND (name ILIKE '%pompe a chaleur%' OR name ILIKE '%pompe à chaleur%'
    OR name ILIKE '% pac %' OR name ILIKE '%geotherm%' OR name ILIKE '%géotherm%'
    OR name ILIKE '%aerotherm%' OR name ILIKE '%aérotherm%');

-- panneaux-solaires (chauffagistes who do solar thermal)
UPDATE providers SET specialty = 'panneaux-solaires'
WHERE specialty = 'chauffagiste'
  AND (name ILIKE '%solaire%' OR name ILIKE '%photovolta%' OR name ILIKE '%solar%')
  AND name NOT ILIKE '%chauffag%';

-- renovation-energetique
UPDATE providers SET specialty = 'renovation-energetique'
WHERE specialty = 'chauffagiste'
  AND (name ILIKE '%renovation energetique%' OR name ILIKE '%rénovation énergétique%'
    OR name ILIKE '%renov%energi%' OR name ILIKE '%performance energetique%'
    OR name ILIKE '%performance énergétique%' OR name ILIKE '%audit energetique%'
    OR name ILIKE '%audit énergétique%');

-- =============================================
-- 3. FROM plombier (43.22A) → sub-specialties
-- =============================================

-- pisciniste
UPDATE providers SET specialty = 'pisciniste'
WHERE specialty = 'plombier'
  AND (name ILIKE '%piscine%' OR name ILIKE '%bassin%' OR name ILIKE '%pisciniste%'
    OR name ILIKE '%aqua%');

-- salle-de-bain
UPDATE providers SET specialty = 'salle-de-bain'
WHERE specialty = 'plombier'
  AND (name ILIKE '%salle de bain%' OR name ILIKE '%salle d''eau%'
    OR name ILIKE '%sanitaire%' OR name ILIKE '%balnéo%' OR name ILIKE '%balneo%')
  AND name NOT ILIKE '%plomber%' AND name NOT ILIKE '%plombier%';

-- =============================================
-- 4. FROM couvreur (43.91B) → zingueur
-- =============================================

UPDATE providers SET specialty = 'zingueur'
WHERE specialty = 'couvreur'
  AND (name ILIKE '%zinguerie%' OR name ILIKE '%zinc%' OR name ILIKE '%gouttière%'
    OR name ILIKE '%gouttiere%' OR name ILIKE '%chéneau%' OR name ILIKE '%cheneau%')
  AND name NOT ILIKE '%couverture%' AND name NOT ILIKE '%couvreur%';

-- =============================================
-- 5. FROM serrurier/metallier (43.32B / 25.11Z) → ferronnier
-- =============================================

UPDATE providers SET specialty = 'ferronnier'
WHERE specialty IN ('serrurier', 'metallier')
  AND (name ILIKE '%ferronnerie%' OR name ILIKE '%fer forgé%' OR name ILIKE '%fer forge%'
    OR name ILIKE '%ferronnier%' OR name ILIKE '%forge%art%');

-- =============================================
-- 6. FROM carreleur (43.33Z) → poseur-de-parquet
-- =============================================

UPDATE providers SET specialty = 'poseur-de-parquet'
WHERE specialty IN ('carreleur', 'solier')
  AND (name ILIKE '%parquet%' OR name ILIKE '%plancher%' OR name ILIKE '%parqueteur%');

-- =============================================
-- 7. FROM peintre-en-batiment (43.34Z) → miroitier / vitrier
-- =============================================

-- miroitier
UPDATE providers SET specialty = 'miroitier'
WHERE specialty = 'peintre-en-batiment'
  AND (name ILIKE '%miroiterie%' OR name ILIKE '%miroir%' OR name ILIKE '%miroitier%');

-- vitrier (reclassify from peintre if clearly vitrier)
UPDATE providers SET specialty = 'vitrier'
WHERE specialty = 'peintre-en-batiment'
  AND (name ILIKE '%vitrerie%' OR name ILIKE '%vitrier%' OR name ILIKE '%vitrage%'
    OR name ILIKE '%double vitrage%' OR name ILIKE '%verre%')
  AND name NOT ILIKE '%peinture%' AND name NOT ILIKE '%peintre%';

-- facadier (reclassify from peintre if clearly facade)
UPDATE providers SET specialty = 'facadier'
WHERE specialty = 'peintre-en-batiment'
  AND (name ILIKE '%facade%' OR name ILIKE '%façade%' OR name ILIKE '%ravalement%'
    OR name ILIKE '%enduit%' OR name ILIKE '%crépis%' OR name ILIKE '%crepis%')
  AND name NOT ILIKE '%peinture%' AND name NOT ILIKE '%peintre%';

-- =============================================
-- 8. FROM menuisier (43.32A) → storiste
-- =============================================

UPDATE providers SET specialty = 'storiste'
WHERE specialty = 'menuisier'
  AND (name ILIKE '%store%' OR name ILIKE '%volet%' OR name ILIKE '%fermeture%'
    OR name ILIKE '%pergola%' OR name ILIKE '%brise soleil%')
  AND name NOT ILIKE '%menuiser%';

-- =============================================
-- 9. FROM desinsectisation (81.29A) → deratisation
-- =============================================

UPDATE providers SET specialty = 'deratisation'
WHERE specialty = 'desinsectisation'
  AND (name ILIKE '%dératisation%' OR name ILIKE '%deratisation%'
    OR name ILIKE '%rongeur%' OR name ILIKE '%rat %' OR name ILIKE '%souris%'
    OR name ILIKE '%nuisible%');

-- =============================================
-- 10. FROM macon (43.99C) → facadier (macons who do facades)
-- =============================================

UPDATE providers SET specialty = 'facadier'
WHERE specialty = 'macon'
  AND (name ILIKE '%facade%' OR name ILIKE '%façade%' OR name ILIKE '%ravalement%')
  AND name NOT ILIKE '%macon%' AND name NOT ILIKE '%maçon%' AND name NOT ILIKE '%construction%';

-- =============================================
-- 11. FROM isolation-thermique → renovation-energetique
-- =============================================

UPDATE providers SET specialty = 'renovation-energetique'
WHERE specialty = 'isolation-thermique'
  AND (name ILIKE '%renovation energetique%' OR name ILIKE '%rénovation énergétique%'
    OR name ILIKE '%renov%energi%');

COMMIT;
