-- ============================================================================
-- Migration 330: Massive NAF → specialty mapping for full database coherence
-- ============================================================================
--
-- Complete NAF → specialty mapping. Supersedes 324_fix_specialty_coherence.sql
-- which was never applied to production.
--
-- This migration assigns specialty to ALL providers with a valid code_naf
-- but NULL specialty, covering every NAF code in our service-naf-mapping.
--
-- Strategy for shared NAF codes (1 NAF → multiple services):
--   We assign the PRIMARY/core trade. Sub-specialties (salle-de-bain,
--   domoticien, climaticien, etc.) are handled via provider_services or
--   manual curation.
--
-- Format: code_naf is stored with or without dot (43.22A or 4322A).
--   We handle both via IN(...) clauses.
--
-- ============================================================================

BEGIN;

-- -------------------------------------------------------
-- 0. Fix any 'isolation' specialty → 'isolation-thermique' (correct slug)
-- -------------------------------------------------------

UPDATE providers
SET specialty = 'isolation-thermique'
WHERE specialty = 'isolation';

-- -------------------------------------------------------
-- 0b. Mappings from 324_fix_specialty_coherence (never applied to prod)
-- -------------------------------------------------------

-- 43.31Z — Travaux de plâtrerie → platrier
UPDATE providers SET specialty = 'platrier'
WHERE code_naf IN ('4331Z', '43.31Z') AND specialty IS NULL;

-- 43.32B — Menuiserie métallique / serrurerie → serrurier
UPDATE providers SET specialty = 'serrurier'
WHERE code_naf IN ('4332B', '43.32B') AND specialty IS NULL;

-- 43.39Z — Autres travaux de finition → solier
UPDATE providers SET specialty = 'solier'
WHERE code_naf IN ('4339Z', '43.39Z') AND specialty IS NULL;

-- 43.29A — Travaux d'isolation → isolation-thermique
UPDATE providers SET specialty = 'isolation-thermique'
WHERE code_naf IN ('4329A', '43.29A') AND specialty IS NULL;

-- -------------------------------------------------------
-- 1. Core BTP trades — unambiguous primary mappings
-- -------------------------------------------------------

-- 43.22A — Travaux d'installation d'eau et de gaz → plombier
-- (also used by pisciniste, salle-de-bain — sub-specialties)
UPDATE providers SET specialty = 'plombier'
WHERE code_naf IN ('4322A', '43.22A') AND specialty IS NULL;

-- 43.21A — Travaux d'installation électrique dans tous locaux → electricien
-- (also used by domoticien, borne-recharge, alarme-securite, antenniste — sub-specialties)
UPDATE providers SET specialty = 'electricien'
WHERE code_naf IN ('4321A', '43.21A') AND specialty IS NULL;

-- 43.21B — Travaux d'installation électrique sur la voie publique → electricien
UPDATE providers SET specialty = 'electricien'
WHERE code_naf IN ('4321B', '43.21B') AND specialty IS NULL;

-- 43.22B — Travaux d'installation d'équipements thermiques et de climatisation → chauffagiste
-- (also used by climaticien, pompe-a-chaleur, renovation-energetique — sub-specialties)
UPDATE providers SET specialty = 'chauffagiste'
WHERE code_naf IN ('4322B', '43.22B') AND specialty IS NULL;

-- 43.34Z — Travaux de peinture et vitrerie → peintre-en-batiment
-- (also used by vitrier, miroitier, facadier — sub-specialties)
UPDATE providers SET specialty = 'peintre-en-batiment'
WHERE code_naf IN ('4334Z', '43.34Z') AND specialty IS NULL;

-- 43.32A — Travaux de menuiserie bois et PVC → menuisier
-- (also used by storiste — sub-specialty)
UPDATE providers SET specialty = 'menuisier'
WHERE code_naf IN ('4332A', '43.32A') AND specialty IS NULL;

-- 43.33Z — Travaux de revêtement des sols et des murs → carreleur
-- (also used by solier, poseur-de-parquet, salle-de-bain — sub-specialties)
-- Note: 43.39Z → solier handled in section 0b above
UPDATE providers SET specialty = 'carreleur'
WHERE code_naf IN ('4333Z', '43.33Z') AND specialty IS NULL;

-- 43.91B — Travaux de couverture par éléments → couvreur
-- (also used by zingueur — sub-specialty)
UPDATE providers SET specialty = 'couvreur'
WHERE code_naf IN ('4391B', '43.91B') AND specialty IS NULL;

-- 43.99C — Travaux de maçonnerie générale et gros œuvre de bâtiment → macon
-- (also used by facadier — sub-specialty)
UPDATE providers SET specialty = 'macon'
WHERE code_naf IN ('4399C', '43.99C') AND specialty IS NULL;

-- -------------------------------------------------------
-- 2. Specialized BTP trades
-- -------------------------------------------------------

-- 43.12A — Travaux de terrassement courants et travaux préparatoires → terrassier
UPDATE providers SET specialty = 'terrassier'
WHERE code_naf IN ('4312A', '43.12A') AND specialty IS NULL;

-- 43.12B — Travaux de terrassement spécialisés ou de grande masse → terrassier
UPDATE providers SET specialty = 'terrassier'
WHERE code_naf IN ('4312B', '43.12B') AND specialty IS NULL;

-- 43.91A — Travaux de charpente → charpentier
UPDATE providers SET specialty = 'charpentier'
WHERE code_naf IN ('4391A', '43.91A') AND specialty IS NULL;

-- 43.99A — Travaux d'étanchéification → etancheiste
UPDATE providers SET specialty = 'etancheiste'
WHERE code_naf IN ('4399A', '43.99A') AND specialty IS NULL;

-- 25.11Z — Fabrication de structures métalliques et de parties de structures → metallier
-- (also used by ferronnier — sub-specialty, ferronnier is artisanal metalwork)
UPDATE providers SET specialty = 'metallier'
WHERE code_naf IN ('2511Z', '25.11Z') AND specialty IS NULL;

-- 43.32C — Agencement de lieux de vente → cuisiniste
UPDATE providers SET specialty = 'cuisiniste'
WHERE code_naf IN ('4332C', '43.32C') AND specialty IS NULL;

-- 31.02Z — Fabrication de meubles de cuisine → cuisiniste
UPDATE providers SET specialty = 'cuisiniste'
WHERE code_naf IN ('3102Z', '31.02Z') AND specialty IS NULL;

-- 43.29B — Autres travaux d'installation n.c.a. → ascensoriste
UPDATE providers SET specialty = 'ascensoriste'
WHERE code_naf IN ('4329B', '43.29B') AND specialty IS NULL;

-- -------------------------------------------------------
-- 3. Aménagement intérieur & design
-- -------------------------------------------------------

-- 71.11Z — Activités d'architecture → architecte-interieur
-- (paysagiste concepteur also uses 7111Z, but 81.30Z is their primary)
UPDATE providers SET specialty = 'architecte-interieur'
WHERE code_naf IN ('7111Z', '71.11Z') AND specialty IS NULL;

-- 74.10Z — Activités spécialisées de design → decorateur
UPDATE providers SET specialty = 'decorateur'
WHERE code_naf IN ('7410Z', '74.10Z') AND specialty IS NULL;

-- -------------------------------------------------------
-- 4. Extérieur & paysage
-- -------------------------------------------------------

-- 81.30Z — Services d'aménagement paysager → paysagiste
-- (jardinier also maps here, but paysagiste is the literal NAF meaning)
UPDATE providers SET specialty = 'paysagiste'
WHERE code_naf IN ('8130Z', '81.30Z') AND specialty IS NULL;

-- -------------------------------------------------------
-- 5. Énergie & isolation
-- -------------------------------------------------------

-- 43.29A → isolation-thermique already handled in section 0b above

-- -------------------------------------------------------
-- 6. Diagnostics & études techniques
-- -------------------------------------------------------

-- 71.20B — Analyses, essais et inspections techniques → diagnostiqueur
UPDATE providers SET specialty = 'diagnostiqueur'
WHERE code_naf IN ('7120B', '71.20B') AND specialty IS NULL;

-- 71.12B — Ingénierie, études techniques → geometre
UPDATE providers SET specialty = 'geometre'
WHERE code_naf IN ('7112B', '71.12B') AND specialty IS NULL;

-- -------------------------------------------------------
-- 7. Services & maintenance
-- -------------------------------------------------------

-- 81.21Z — Nettoyage courant des bâtiments → nettoyage
UPDATE providers SET specialty = 'nettoyage'
WHERE code_naf IN ('8121Z', '81.21Z') AND specialty IS NULL;

-- 81.22Z — Autres activités de nettoyage des bâtiments → nettoyage
UPDATE providers SET specialty = 'nettoyage'
WHERE code_naf IN ('8122Z', '81.22Z') AND specialty IS NULL;

-- 81.29A — Désinfection, désinsectisation, dératisation → desinsectisation
-- (also used by deratisation — same trade family)
UPDATE providers SET specialty = 'desinsectisation'
WHERE code_naf IN ('8129A', '81.29A') AND specialty IS NULL;

-- 81.29B — Autres activités de nettoyage n.c.a. → ramoneur
UPDATE providers SET specialty = 'ramoneur'
WHERE code_naf IN ('8129B', '81.29B') AND specialty IS NULL;

-- 49.42Z — Services de déménagement → demenageur
UPDATE providers SET specialty = 'demenageur'
WHERE code_naf IN ('4942Z', '49.42Z') AND specialty IS NULL;

-- -------------------------------------------------------
-- 8. Additional case normalization (catch remaining inconsistencies)
-- -------------------------------------------------------

UPDATE providers SET specialty = 'plombier' WHERE specialty IN ('Plombier', 'PLOMBIER');
UPDATE providers SET specialty = 'electricien' WHERE specialty IN ('Electricien', 'Électricien', 'ELECTRICIEN');
UPDATE providers SET specialty = 'chauffagiste' WHERE specialty IN ('Chauffagiste', 'CHAUFFAGISTE');
UPDATE providers SET specialty = 'menuisier' WHERE specialty IN ('Menuisier', 'MENUISIER');
UPDATE providers SET specialty = 'serrurier' WHERE specialty IN ('Serrurier', 'SERRURIER');
UPDATE providers SET specialty = 'carreleur' WHERE specialty IN ('Carreleur', 'CARRELEUR');
UPDATE providers SET specialty = 'couvreur' WHERE specialty IN ('Couvreur', 'COUVREUR');
UPDATE providers SET specialty = 'macon' WHERE specialty IN ('Macon', 'Maçon', 'MACON', 'MAÇON');
UPDATE providers SET specialty = 'peintre-en-batiment' WHERE specialty IN ('Peintre', 'Peintre en bâtiment', 'PEINTRE');
UPDATE providers SET specialty = 'charpentier' WHERE specialty IN ('Charpentier', 'CHARPENTIER');
UPDATE providers SET specialty = 'paysagiste' WHERE specialty IN ('Paysagiste', 'PAYSAGISTE');
UPDATE providers SET specialty = 'diagnostiqueur' WHERE specialty IN ('Diagnostiqueur', 'DIAGNOSTIQUEUR');
UPDATE providers SET specialty = 'decorateur' WHERE specialty IN ('Decorateur', 'Décorateur', 'DECORATEUR');
UPDATE providers SET specialty = 'architecte-interieur' WHERE specialty IN ('Architecte intérieur', 'Architecte d''intérieur', 'architecte interieur');
UPDATE providers SET specialty = 'demenageur' WHERE specialty IN ('Demenageur', 'Déménageur', 'DEMENAGEUR');
UPDATE providers SET specialty = 'geometre' WHERE specialty IN ('Geometre', 'Géomètre', 'GEOMETRE');
UPDATE providers SET specialty = 'metallier' WHERE specialty IN ('Metallier', 'Métallier', 'METALLIER');
UPDATE providers SET specialty = 'ferronnier' WHERE specialty IN ('Ferronnier', 'FERRONNIER');
UPDATE providers SET specialty = 'etancheiste' WHERE specialty IN ('Etancheiste', 'Étanchéiste', 'ETANCHEISTE');
UPDATE providers SET specialty = 'facadier' WHERE specialty IN ('Facadier', 'Façadier', 'FACADIER');
UPDATE providers SET specialty = 'cuisiniste' WHERE specialty IN ('Cuisiniste', 'CUISINISTE');
UPDATE providers SET specialty = 'nettoyage' WHERE specialty IN ('Nettoyage', 'NETTOYAGE');
UPDATE providers SET specialty = 'ramoneur' WHERE specialty IN ('Ramoneur', 'RAMONEUR');
UPDATE providers SET specialty = 'vitrier' WHERE specialty IN ('Vitrier', 'VITRIER');
UPDATE providers SET specialty = 'jardinier' WHERE specialty IN ('Jardinier', 'JARDINIER');

COMMIT;
