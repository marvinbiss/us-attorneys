-- ============================================================================
-- Migration 337: Maximum refinement — fix inflated/deflated categories
-- ============================================================================
--
-- Deep audit revealed 3 major structural problems:
--
-- 1. SOLIER (25,945): 25,761 from NAF 43.39Z "Autres travaux de finition"
--    (catch-all code). Only ~100 are real soliers. The rest are generic
--    finishing contractors with personal names. Fix: noindex generics,
--    reclassify identifiable ones.
--
-- 2. CHAUFFAGISTE (37K): After SIRENE collection, thousands of climaticien,
--    PAC, and energy companies landed in chauffagiste (same NAF 43.22B).
--    Migrations 332-333 ran BEFORE collection, so new providers need the
--    same sub-specialty extraction.
--
-- 3. PLATRIER (52K): 659 isolation companies misclassified as platrier
--    (NAF 43.31Z, name says "isolation" but no plâtrerie keywords).
--
-- Expected: ~27,500 fixes (3,900 reclassified + ~22,500 noindexed)
-- ============================================================================

SET statement_timeout = '600s';

BEGIN;

-- =============================================
-- A. SOLIER 43.39Z CLEANUP
-- =============================================

-- A1. solier → peintre-en-batiment: companies with peinture/peintre (~107)
UPDATE providers SET specialty = 'peintre-en-batiment'
WHERE specialty = 'solier'
  AND code_naf = '43.39Z'
  AND (name ILIKE '%peinture%' OR name ILIKE '%peintre%')
  AND name NOT ILIKE '%sol %' AND name NOT ILIKE '%moquette%';

-- A2. solier → nettoyage: cleaning companies (~209)
UPDATE providers SET specialty = 'nettoyage'
WHERE specialty = 'solier'
  AND code_naf = '43.39Z'
  AND (name ILIKE '%nettoyage%' OR name ILIKE '%proprete%' OR name ILIKE '%propreté%')
  AND name NOT ILIKE '%sol %' AND name NOT ILIKE '%moquette%';

-- A3. solier → decorateur-interieur: decoration companies (~448)
UPDATE providers SET specialty = 'decorateur-interieur'
WHERE specialty = 'solier'
  AND code_naf = '43.39Z'
  AND (name ILIKE '%decoration%' OR name ILIKE '%décoration%' OR name ILIKE '%decorat%')
  AND name NOT ILIKE '%peinture%'
  AND name NOT ILIKE '%sol %' AND name NOT ILIKE '%moquette%';

-- A4. noindex solier 43.39Z with NO identifiable floor keyword (~22,500)
-- These are "autres travaux de finition" generics (personal names, acronyms)
-- that should NOT appear in solier search results
UPDATE providers SET noindex = true
WHERE specialty = 'solier'
  AND code_naf = '43.39Z'
  AND name NOT ILIKE '%sol souple%'
  AND name NOT ILIKE '%solier%'
  AND name NOT ILIKE '%moquette%'
  AND name NOT ILIKE '%revetement sol%'
  AND name NOT ILIKE '%revêtement sol%'
  AND name NOT ILIKE '%lino%'
  AND name NOT ILIKE '%vinyle%'
  AND name NOT ILIKE '%parquet%'
  AND name NOT ILIKE '%plancher%';

-- =============================================
-- B. CHAUFFAGISTE SUB-SPECIALTY EXTRACTION
-- (new providers collected after migrations 332-333)
-- =============================================

-- B1. chauffagiste → climaticien: "clim" abbreviation (~3,655)
-- "clim" is universally used for climatisation in French trade names
UPDATE providers SET specialty = 'climaticien'
WHERE specialty = 'chauffagiste'
  AND (
    name ILIKE '%clim%'
    OR name ILIKE '%frigorist%'
    OR name ILIKE '%frigorif%'
    OR name ILIKE '%refriger%'
    OR name ILIKE '%réfrigér%'
  )
  AND name NOT ILIKE '%chauffag%';

-- B2. chauffagiste → pompe-a-chaleur: PAC companies (~107)
UPDATE providers SET specialty = 'pompe-a-chaleur'
WHERE specialty = 'chauffagiste'
  AND (
    name ILIKE '%pompe%chaleur%'
    OR name ILIKE '% pac %'
    OR name ILIKE '% pac'
    OR name ILIKE '%pac %'
    OR name ILIKE '%-pac%'
    OR name ILIKE '%pac-%'
    OR name ILIKE '%geotherm%'
    OR name ILIKE '%géotherm%'
    OR name ILIKE '%aerotherm%'
    OR name ILIKE '%aérotherm%'
  )
  AND name NOT ILIKE '%chauffag%'
  AND name NOT ILIKE '%paca%'
  AND name NOT ILIKE '%pack%'
  AND name NOT ILIKE '%impact%';

-- B3. chauffagiste → panneaux-solaires: renewable energy (~133)
UPDATE providers SET specialty = 'panneaux-solaires'
WHERE specialty = 'chauffagiste'
  AND (
    name ILIKE '%renouvelable%'
    OR name ILIKE '%photovolta%'
    OR name ILIKE '%solaire%'
  )
  AND name NOT ILIKE '%chauffag%';

-- B4. chauffagiste → ramoneur: chimney/flue companies
UPDATE providers SET specialty = 'ramoneur'
WHERE specialty = 'chauffagiste'
  AND (
    name ILIKE '%ramonage%' OR name ILIKE '%ramoneur%'
    OR name ILIKE '%cheminee%' OR name ILIKE '%cheminée%'
    OR name ILIKE '%fumisterie%'
  )
  AND name NOT ILIKE '%chauffag%';

-- =============================================
-- C. PLATRIER → ISOLATION-THERMIQUE (~659)
-- =============================================
-- Companies in NAF 43.31Z with "isolation" in name but no plâtrerie keyword
UPDATE providers SET specialty = 'isolation-thermique'
WHERE specialty = 'platrier'
  AND (name ILIKE '%isolation%' OR name ILIKE '%isolant%')
  AND name NOT ILIKE '%platr%'
  AND name NOT ILIKE '%plâtr%'
  AND name NOT ILIKE '%placo%'
  AND name NOT ILIKE '%plaquist%';

-- =============================================
-- D. ADDITIONAL FINE-TUNING
-- =============================================

-- D1. electricien → domoticien: domotique companies sans electri (~50+)
UPDATE providers SET specialty = 'domoticien'
WHERE specialty = 'electricien'
  AND (name ILIKE '%domotique%' OR name ILIKE '%domotiq%' OR name ILIKE '%smart home%'
    OR name ILIKE '%maison connect%' OR name ILIKE '%maison intelli%')
  AND name NOT ILIKE '%electri%'
  AND name NOT ILIKE '%électri%';

-- D2. electricien → alarme-securite: security companies sans electri
UPDATE providers SET specialty = 'alarme-securite'
WHERE specialty = 'electricien'
  AND (name ILIKE '%alarme%' OR name ILIKE '%surveillance%' OR name ILIKE '%securite%'
    OR name ILIKE '%sécurité%' OR name ILIKE '%telesurveillance%' OR name ILIKE '%vidéosurveillance%')
  AND name NOT ILIKE '%electri%'
  AND name NOT ILIKE '%électri%';

-- D3. electricien → panneaux-solaires: solar companies sans electri
UPDATE providers SET specialty = 'panneaux-solaires'
WHERE specialty = 'electricien'
  AND (name ILIKE '%solaire%' OR name ILIKE '%photovolta%' OR name ILIKE '%solar%')
  AND name NOT ILIKE '%electri%'
  AND name NOT ILIKE '%électri%';

-- D4. electricien → borne-recharge: IRVE companies sans electri
UPDATE providers SET specialty = 'borne-recharge'
WHERE specialty = 'electricien'
  AND (name ILIKE '%borne%recharge%' OR name ILIKE '%irve%' OR name ILIKE '%recharge%vehicule%')
  AND name NOT ILIKE '%electri%'
  AND name NOT ILIKE '%électri%';

-- D5. macon → terrassier: terrassement sans macon
UPDATE providers SET specialty = 'terrassier'
WHERE specialty = 'macon'
  AND (name ILIKE '%terrassement%' OR name ILIKE '%terrassier%' OR name ILIKE '%demolition%' OR name ILIKE '%démolition%')
  AND name NOT ILIKE '%macon%'
  AND name NOT ILIKE '%maçon%'
  AND name NOT ILIKE '%construction%';

-- D6. macon → couvreur: couverture/toiture sans macon
UPDATE providers SET specialty = 'couvreur'
WHERE specialty = 'macon'
  AND (name ILIKE '%couverture%' OR name ILIKE '%couvreur%' OR name ILIKE '%toiture%')
  AND name NOT ILIKE '%macon%'
  AND name NOT ILIKE '%maçon%'
  AND name NOT ILIKE '%construction%';

-- D7. macon → charpentier: charpente sans macon
UPDATE providers SET specialty = 'charpentier'
WHERE specialty = 'macon'
  AND (name ILIKE '%charpent%')
  AND name NOT ILIKE '%macon%'
  AND name NOT ILIKE '%maçon%'
  AND name NOT ILIKE '%construction%';

-- D8. macon → facadier: facade/ravalement sans macon
UPDATE providers SET specialty = 'facadier'
WHERE specialty = 'macon'
  AND (name ILIKE '%facade%' OR name ILIKE '%façade%' OR name ILIKE '%ravalement%')
  AND name NOT ILIKE '%macon%'
  AND name NOT ILIKE '%maçon%'
  AND name NOT ILIKE '%construction%';

-- D9. peintre → facadier: facade/ravalement sans peinture/peintre
UPDATE providers SET specialty = 'facadier'
WHERE specialty = 'peintre-en-batiment'
  AND (name ILIKE '%facade%' OR name ILIKE '%façade%' OR name ILIKE '%ravalement%')
  AND name NOT ILIKE '%peinture%'
  AND name NOT ILIKE '%peintre%';

-- D10. peintre → platrier: platre/placo/plaquiste sans peinture/peintre
UPDATE providers SET specialty = 'platrier'
WHERE specialty = 'peintre-en-batiment'
  AND (name ILIKE '%platr%' OR name ILIKE '%plâtr%' OR name ILIKE '%placo%' OR name ILIKE '%plaquist%')
  AND name NOT ILIKE '%peinture%'
  AND name NOT ILIKE '%peintre%';

-- D11. peintre → vitrier: vitrerie/vitrier sans peinture
UPDATE providers SET specialty = 'vitrier'
WHERE specialty = 'peintre-en-batiment'
  AND (name ILIKE '%vitrerie%' OR name ILIKE '%vitrier%' OR name ILIKE '%miroiterie%')
  AND name NOT ILIKE '%peinture%'
  AND name NOT ILIKE '%peintre%';

-- D12. couvreur → zingueur: zinguerie/zinc/gouttiere sans couverture
UPDATE providers SET specialty = 'zingueur'
WHERE specialty = 'couvreur'
  AND (name ILIKE '%zinguerie%' OR name ILIKE '%zinc%' OR name ILIKE '%gouttiere%' OR name ILIKE '%gouttière%')
  AND name NOT ILIKE '%couverture%'
  AND name NOT ILIKE '%couvreur%'
  AND name NOT ILIKE '%toiture%';

COMMIT;
