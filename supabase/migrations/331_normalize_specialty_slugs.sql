-- ============================================================================
-- Migration 331: Normalize ALL specialty values to match service slugs
-- ============================================================================
--
-- Migration 330 only assigned specialty WHERE NULL. This migration fixes
-- pre-existing specialty values that don't match our service slugs:
--   - 'peintre' (93K) → 'peintre-en-batiment'
--   - 'finition' (25K) → 'solier'
--   - 'menuisier-metallique' (23K) → 'serrurier'
--   - Various Google-sourced descriptive names → nearest service slug
--   - Case normalization leftovers
--
-- ============================================================================

BEGIN;

-- -------------------------------------------------------
-- 1. Major renames (>1000 rows)
-- -------------------------------------------------------

-- 'peintre' → 'peintre-en-batiment' (93,619 rows)
UPDATE providers SET specialty = 'peintre-en-batiment'
WHERE specialty = 'peintre';

-- 'finition' → 'solier' (25,766 rows)
UPDATE providers SET specialty = 'solier'
WHERE specialty = 'finition';

-- 'menuisier-metallique' → 'serrurier' (23,079 rows)
-- NAF 43.32B = "Travaux de menuiserie métallique et serrurerie"
-- Our service slug for this trade is 'serrurier'
UPDATE providers SET specialty = 'serrurier'
WHERE specialty = 'menuisier-metallique';

-- -------------------------------------------------------
-- 2. Case normalization leftovers
-- -------------------------------------------------------

UPDATE providers SET specialty = 'platrier'
WHERE specialty IN ('Plâtrier', 'Plâtrier.ère');

UPDATE providers SET specialty = 'climaticien'
WHERE specialty = 'Climaticien';

UPDATE providers SET specialty = 'terrassier'
WHERE specialty IN ('Terrassier', 'Entreprise de terrassement');

UPDATE providers SET specialty = 'facadier'
WHERE specialty = 'Façadier';

-- -------------------------------------------------------
-- 3. Google-sourced descriptive specialty names → correct slugs
-- -------------------------------------------------------

-- Menuiserie variants
UPDATE providers SET specialty = 'menuisier'
WHERE specialty IN ('Atelier de menuiserie', 'Fabricant de meubles');

-- Vitrier/miroitier variants
UPDATE providers SET specialty = 'vitrier'
WHERE specialty IN ('Vitrerie-miroiterie', 'Miroiterie', 'Magasin de fenêtres en PVC');

-- Serrurier variants
UPDATE providers SET specialty = 'serrurier'
WHERE specialty IN ('Service de serrurerie d''urgence');

-- Electricien variants
UPDATE providers SET specialty = 'electricien'
WHERE specialty = 'Service d''installation électrique';

-- Plombier variants
UPDATE providers SET specialty = 'plombier'
WHERE specialty = 'Magasin de matériel de plomberie';

-- Isolation variants
UPDATE providers SET specialty = 'isolation-thermique'
WHERE specialty = 'Entrepreneur spécialisé dans l''isolation';

-- Platrier variants
UPDATE providers SET specialty = 'platrier'
WHERE specialty = 'Entrepreneur de cloisons sèches';

-- Carreleur / solier variants
UPDATE providers SET specialty = 'solier'
WHERE specialty = 'Entrepreneur spécialisé dans les revêtements de sol';

-- Climaticien variants
UPDATE providers SET specialty = 'climaticien'
WHERE specialty = 'Fournisseur de systèmes de climatisation';

-- Salle de bain
UPDATE providers SET specialty = 'salle-de-bain'
WHERE specialty = 'Spécialiste de la salle de bains';

-- Maçon / construction variants
UPDATE providers SET specialty = 'macon'
WHERE specialty IN (
  'Entreprise de construction',
  'Constructeur de maisons personnalisées',
  'Constructeur immobilier',
  'Société de travaux publics',
  'Travaux généraux'
);

-- Demolition → terrassier (closest match)
UPDATE providers SET specialty = 'terrassier'
WHERE specialty = 'Entrepreneur spécialisé dans la démolition';

-- Dépanneur → serrurier (most common meaning in French construction context)
UPDATE providers SET specialty = 'serrurier'
WHERE specialty = 'Dépanneur';

-- Service de réparation → generic, set NULL to avoid wrong mapping
UPDATE providers SET specialty = NULL
WHERE specialty = 'Service de réparation';

-- -------------------------------------------------------
-- 4. Non-trade entries → set specialty to NULL
-- These are not construction trades and should not have a specialty
-- -------------------------------------------------------

UPDATE providers SET specialty = NULL
WHERE specialty IN (
  'Appartement de vacances',
  'Artisanat',
  'Église catholique',
  'Établissement vinicole',
  'Fabricant',
  'Magasin',
  'Magasin de meubles',
  'Musée',
  'Pâtisserie',
  'Pont',
  'Scierie',
  'Siège social',
  'Entrepreneur',
  'Ingénieur en environnement'
);

COMMIT;
