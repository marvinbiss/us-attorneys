-- ============================================================================
-- Migration 336: Deep redistribution — fix oversized categories & noindex
-- ============================================================================
--
-- Audit found major structural issues:
--
-- 1. GEOMETRE (51,644): NAF 71.12B = "Ingénierie, études techniques" is FAR
--    too broad. Only ~740 are actual géomètres-experts. The rest are generic
--    engineering/consulting firms with no place in an artisan directory.
--    Fix: noindex non-artisan firms, move diagnostiqueurs to correct specialty.
--
-- 2. ELECTRICIEN → ANTENNISTE: 1,630 fiber optic installers (name = "*fibre*")
--    with no "electri" in name should be antenniste, not electricien.
--
-- 3. MENUISIER: 151 charpentiers, 113 parqueteurs hidden in menuisier.
--
-- 4. Other: peintre→isolation, macon→pisciniste.
--
-- Expected: ~2,175 reclassified + ~50,800 noindexed
-- ============================================================================

SET statement_timeout = '600s';

BEGIN;

-- =============================================
-- A. GEOMETRE CLEANUP (NAF 71.12B)
-- =============================================

-- A1. geometre → diagnostiqueur (~92)
-- Companies with "diagnostic" in name that are NOT actual geometres
UPDATE providers SET specialty = 'diagnostiqueur'
WHERE specialty = 'geometre'
  AND code_naf = '71.12B'
  AND (name ILIKE '%diagnostic%' OR name ILIKE '%dpe%' OR name ILIKE '%amiante%')
  AND name NOT ILIKE '%geometr%'
  AND name NOT ILIKE '%topograph%'
  AND name NOT ILIKE '%foncier%'
  AND name NOT ILIKE '%bornage%';

-- A2. noindex non-artisan engineering firms from 71.12B (~50,800)
-- Keep as geometre: geometre, topograph, foncier, bornage, arpent, cadastr,
-- mesurage, expert (many géomètres-experts use just "expert" in name)
-- Everything else → noindex (engineering firms, consultants, IT companies...)
UPDATE providers SET noindex = true
WHERE specialty = 'geometre'
  AND code_naf = '71.12B'
  AND name NOT ILIKE '%geometr%'
  AND name NOT ILIKE '%topograph%'
  AND name NOT ILIKE '%foncier%'
  AND name NOT ILIKE '%bornage%'
  AND name NOT ILIKE '%arpent%'
  AND name NOT ILIKE '%cadastr%'
  AND name NOT ILIKE '%mesurage%'
  AND name NOT ILIKE '%expert%';

-- =============================================
-- B. ELECTRICIEN → ANTENNISTE (fibre optic, ~1,630)
-- =============================================
UPDATE providers SET specialty = 'antenniste'
WHERE specialty = 'electricien'
  AND (name ILIKE '%fibre%' OR name ILIKE '%fibre optique%' OR name ILIKE '%ftth%')
  AND name NOT ILIKE '%electri%'
  AND name NOT ILIKE '%électri%';

-- =============================================
-- C. MENUISIER RECLASSIFICATIONS
-- =============================================

-- C1. menuisier → charpentier (~151)
UPDATE providers SET specialty = 'charpentier'
WHERE specialty = 'menuisier'
  AND (name ILIKE '%charpent%')
  AND name NOT ILIKE '%menuiser%'
  AND name NOT ILIKE '%menuisier%'
  AND name NOT ILIKE '%menuiserie%';

-- C2. menuisier → poseur-de-parquet (~113)
UPDATE providers SET specialty = 'poseur-de-parquet'
WHERE specialty = 'menuisier'
  AND (name ILIKE '%parquet%' OR name ILIKE '%parqueteur%')
  AND name NOT ILIKE '%menuiser%'
  AND name NOT ILIKE '%menuisier%'
  AND name NOT ILIKE '%menuiserie%';

-- =============================================
-- D. PEINTRE → ISOLATION-THERMIQUE (~70)
-- =============================================
UPDATE providers SET specialty = 'isolation-thermique'
WHERE specialty = 'peintre-en-batiment'
  AND (name ILIKE '%isolation%' OR name ILIKE '%isolant%')
  AND name NOT ILIKE '%peinture%'
  AND name NOT ILIKE '%peintre%';

-- =============================================
-- E. MACON → PISCINISTE (~119)
-- =============================================
UPDATE providers SET specialty = 'pisciniste'
WHERE specialty = 'macon'
  AND (name ILIKE '%piscine%' OR name ILIKE '%pisciniste%' OR name ILIKE '%bassin%')
  AND name NOT ILIKE '%macon%'
  AND name NOT ILIKE '%maçon%'
  AND name NOT ILIKE '%construction%';

COMMIT;
