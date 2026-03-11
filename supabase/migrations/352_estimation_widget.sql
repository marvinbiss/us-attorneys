-- Migration 352: Tables pour le widget d'estimation de prix
-- Crée prestations_tarifs, coefficients_geo, estimation_leads
-- Insère les 101 départements français et les prestations pour 46 métiers

-- ============================================================
-- TABLE 1 : prestations_tarifs
-- ============================================================

CREATE TABLE IF NOT EXISTS prestations_tarifs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  metier text NOT NULL,
  prestation text NOT NULL,
  unite text NOT NULL DEFAULT 'forfait',
  prix_min numeric NOT NULL,
  prix_max numeric NOT NULL,
  source text DEFAULT 'moyenne_marche',
  fiabilite numeric DEFAULT 0.7,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT chk_unite CHECK (unite IN ('forfait', 'm²', 'mètre linéaire', 'intervention', 'heure')),
  CONSTRAINT chk_prix CHECK (prix_min > 0 AND prix_max >= prix_min),
  CONSTRAINT chk_fiabilite CHECK (fiabilite >= 0 AND fiabilite <= 1)
);

CREATE INDEX idx_prestations_metier ON prestations_tarifs(metier);

-- ============================================================
-- TABLE 2 : coefficients_geo
-- ============================================================

CREATE TABLE IF NOT EXISTS coefficients_geo (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  departement text NOT NULL UNIQUE,
  coefficient numeric NOT NULL DEFAULT 1.0,
  label text NOT NULL,
  CONSTRAINT chk_coefficient CHECK (coefficient > 0 AND coefficient <= 2.0)
);

-- ============================================================
-- TABLE 3 : estimation_leads
-- ============================================================

CREATE TABLE IF NOT EXISTS estimation_leads (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  nom text,
  telephone text NOT NULL,
  email text,
  metier text NOT NULL,
  ville text NOT NULL,
  departement text NOT NULL,
  description_projet text,
  estimation_min numeric,
  estimation_max numeric,
  source text NOT NULL DEFAULT 'chat',
  conversation_history jsonb,
  page_url text,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT chk_source CHECK (source IN ('chat', 'callback'))
);

CREATE INDEX idx_estimation_leads_created ON estimation_leads(created_at DESC);

-- ============================================================
-- RLS Policies
-- ============================================================

ALTER TABLE prestations_tarifs ENABLE ROW LEVEL SECURITY;
ALTER TABLE coefficients_geo ENABLE ROW LEVEL SECURITY;
ALTER TABLE estimation_leads ENABLE ROW LEVEL SECURITY;

-- prestations_tarifs : SELECT public, INSERT/UPDATE/DELETE service_role only
CREATE POLICY "prestations_tarifs_select_public"
  ON prestations_tarifs FOR SELECT
  USING (true);

CREATE POLICY "prestations_tarifs_insert_service_role"
  ON prestations_tarifs FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY "prestations_tarifs_update_service_role"
  ON prestations_tarifs FOR UPDATE
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "prestations_tarifs_delete_service_role"
  ON prestations_tarifs FOR DELETE
  TO service_role
  USING (true);

-- coefficients_geo : SELECT public, INSERT/UPDATE/DELETE service_role only
CREATE POLICY "coefficients_geo_select_public"
  ON coefficients_geo FOR SELECT
  USING (true);

CREATE POLICY "coefficients_geo_insert_service_role"
  ON coefficients_geo FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY "coefficients_geo_update_service_role"
  ON coefficients_geo FOR UPDATE
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "coefficients_geo_delete_service_role"
  ON coefficients_geo FOR DELETE
  TO service_role
  USING (true);

-- estimation_leads : INSERT public (pour le widget), SELECT service_role only
CREATE POLICY "estimation_leads_insert_public"
  ON estimation_leads FOR INSERT
  WITH CHECK (true);

CREATE POLICY "estimation_leads_select_service_role"
  ON estimation_leads FOR SELECT
  TO service_role
  USING (true);

-- ============================================================
-- DONNÉES : Coefficients géographiques (101 départements)
-- ============================================================

INSERT INTO coefficients_geo (departement, coefficient, label) VALUES
  ('01', 0.95, 'Ain'),
  ('02', 0.90, 'Aisne'),
  ('03', 0.88, 'Allier'),
  ('04', 0.90, 'Alpes-de-Haute-Provence'),
  ('05', 0.90, 'Hautes-Alpes'),
  ('06', 1.20, 'Alpes-Maritimes'),
  ('07', 0.90, 'Ardèche'),
  ('08', 0.88, 'Ardennes'),
  ('09', 0.85, 'Ariège'),
  ('10', 0.90, 'Aube'),
  ('11', 0.88, 'Aude'),
  ('12', 0.87, 'Aveyron'),
  ('13', 1.15, 'Bouches-du-Rhône'),
  ('14', 0.95, 'Calvados'),
  ('15', 0.85, 'Cantal'),
  ('16', 0.88, 'Charente'),
  ('17', 0.92, 'Charente-Maritime'),
  ('18', 0.88, 'Cher'),
  ('19', 0.87, 'Corrèze'),
  ('2A', 1.05, 'Corse-du-Sud'),
  ('2B', 1.05, 'Haute-Corse'),
  ('21', 0.98, 'Côte-d''Or'),
  ('22', 0.90, 'Côtes-d''Armor'),
  ('23', 0.85, 'Creuse'),
  ('24', 0.88, 'Dordogne'),
  ('25', 0.95, 'Doubs'),
  ('26', 0.95, 'Drôme'),
  ('27', 0.95, 'Eure'),
  ('28', 0.93, 'Eure-et-Loir'),
  ('29', 0.92, 'Finistère'),
  ('30', 0.95, 'Gard'),
  ('31', 1.10, 'Haute-Garonne'),
  ('32', 0.85, 'Gers'),
  ('33', 1.10, 'Gironde'),
  ('34', 1.05, 'Hérault'),
  ('35', 1.00, 'Ille-et-Vilaine'),
  ('36', 0.87, 'Indre'),
  ('37', 0.95, 'Indre-et-Loire'),
  ('38', 1.05, 'Isère'),
  ('39', 0.88, 'Jura'),
  ('40', 0.90, 'Landes'),
  ('41', 0.90, 'Loir-et-Cher'),
  ('42', 1.00, 'Loire'),
  ('43', 0.88, 'Haute-Loire'),
  ('44', 1.10, 'Loire-Atlantique'),
  ('45', 0.95, 'Loiret'),
  ('46', 0.85, 'Lot'),
  ('47', 0.88, 'Lot-et-Garonne'),
  ('48', 0.85, 'Lozère'),
  ('49', 0.95, 'Maine-et-Loire'),
  ('50', 0.88, 'Manche'),
  ('51', 0.93, 'Marne'),
  ('52', 0.87, 'Haute-Marne'),
  ('53', 0.88, 'Mayenne'),
  ('54', 0.98, 'Meurthe-et-Moselle'),
  ('55', 0.87, 'Meuse'),
  ('56', 0.92, 'Morbihan'),
  ('57', 0.95, 'Moselle'),
  ('58', 0.87, 'Nièvre'),
  ('59', 1.10, 'Nord'),
  ('60', 1.00, 'Oise'),
  ('61', 0.88, 'Orne'),
  ('62', 0.95, 'Pas-de-Calais'),
  ('63', 0.98, 'Puy-de-Dôme'),
  ('64', 0.98, 'Pyrénées-Atlantiques'),
  ('65', 0.88, 'Hautes-Pyrénées'),
  ('66', 0.92, 'Pyrénées-Orientales'),
  ('67', 1.10, 'Bas-Rhin'),
  ('68', 1.00, 'Haut-Rhin'),
  ('69', 1.15, 'Rhône'),
  ('70', 0.87, 'Haute-Saône'),
  ('71', 0.90, 'Saône-et-Loire'),
  ('72', 0.92, 'Sarthe'),
  ('73', 1.00, 'Savoie'),
  ('74', 1.10, 'Haute-Savoie'),
  ('75', 1.40, 'Paris'),
  ('76', 1.00, 'Seine-Maritime'),
  ('77', 1.15, 'Seine-et-Marne'),
  ('78', 1.25, 'Yvelines'),
  ('79', 0.88, 'Deux-Sèvres'),
  ('80', 0.92, 'Somme'),
  ('81', 0.90, 'Tarn'),
  ('82', 0.88, 'Tarn-et-Garonne'),
  ('83', 1.05, 'Var'),
  ('84', 0.98, 'Vaucluse'),
  ('85', 0.92, 'Vendée'),
  ('86', 0.90, 'Vienne'),
  ('87', 0.90, 'Haute-Vienne'),
  ('88', 0.88, 'Vosges'),
  ('89', 0.90, 'Yonne'),
  ('90', 0.90, 'Territoire de Belfort'),
  ('91', 1.25, 'Essonne'),
  ('92', 1.35, 'Hauts-de-Seine'),
  ('93', 1.25, 'Seine-Saint-Denis'),
  ('94', 1.25, 'Val-de-Marne'),
  ('95', 1.25, 'Val-d''Oise'),
  ('971', 1.30, 'Guadeloupe'),
  ('972', 1.30, 'Martinique'),
  ('973', 1.35, 'Guyane'),
  ('974', 1.25, 'La Réunion'),
  ('976', 1.20, 'Mayotte');

-- ============================================================
-- DONNÉES : Prestations par métier (46 métiers)
-- ============================================================

-- -------------------------------------------------------
-- 1. PLOMBIER (15 prestations)
-- -------------------------------------------------------
INSERT INTO prestations_tarifs (metier, prestation, unite, prix_min, prix_max, fiabilite) VALUES
  ('plombier', 'Réparation fuite simple', 'forfait', 80, 150, 0.85),
  ('plombier', 'Débouchage canalisation', 'forfait', 100, 250, 0.85),
  ('plombier', 'Remplacement robinet mitigeur', 'forfait', 120, 250, 0.80),
  ('plombier', 'Installation chauffe-eau électrique', 'forfait', 350, 800, 0.80),
  ('plombier', 'Installation chauffe-eau thermodynamique', 'forfait', 2500, 4500, 0.75),
  ('plombier', 'Installation douche italienne', 'forfait', 2000, 5000, 0.70),
  ('plombier', 'Rénovation salle de bain', 'm²', 800, 1500, 0.65),
  ('plombier', 'Pose WC classique', 'forfait', 250, 500, 0.80),
  ('plombier', 'Pose WC suspendu', 'forfait', 400, 900, 0.80),
  ('plombier', 'Recherche de fuite', 'forfait', 200, 600, 0.75),
  ('plombier', 'Intervention urgence soir/week-end', 'intervention', 150, 350, 0.80),
  ('plombier', 'Remplacement ballon eau chaude', 'forfait', 400, 1200, 0.80),
  ('plombier', 'Raccordement machine à laver', 'forfait', 80, 180, 0.85),
  ('plombier', 'Remplacement siphon', 'forfait', 60, 120, 0.90),
  ('plombier', 'Détartrage chauffe-eau', 'forfait', 100, 200, 0.85);

-- -------------------------------------------------------
-- 2. ÉLECTRICIEN (12 prestations)
-- -------------------------------------------------------
INSERT INTO prestations_tarifs (metier, prestation, unite, prix_min, prix_max, fiabilite) VALUES
  ('electricien', 'Remplacement tableau électrique', 'forfait', 800, 1800, 0.80),
  ('electricien', 'Mise aux normes appartement', 'forfait', 3000, 6000, 0.70),
  ('electricien', 'Mise aux normes maison', 'forfait', 5000, 12000, 0.65),
  ('electricien', 'Installation prise électrique', 'forfait', 60, 120, 0.90),
  ('electricien', 'Installation interrupteur', 'forfait', 50, 100, 0.90),
  ('electricien', 'Diagnostic panne électrique', 'intervention', 80, 200, 0.85),
  ('electricien', 'Installation spot/luminaire', 'forfait', 50, 150, 0.85),
  ('electricien', 'Tirage de câble', 'mètre linéaire', 15, 40, 0.80),
  ('electricien', 'Installation VMC simple flux', 'forfait', 400, 800, 0.80),
  ('electricien', 'Installation VMC double flux', 'forfait', 2000, 4000, 0.75),
  ('electricien', 'Intervention urgence soir/week-end', 'intervention', 150, 350, 0.80),
  ('electricien', 'Installation borne recharge VE', 'forfait', 1200, 2500, 0.75);

-- -------------------------------------------------------
-- 3. SERRURIER (10 prestations)
-- -------------------------------------------------------
INSERT INTO prestations_tarifs (metier, prestation, unite, prix_min, prix_max, fiabilite) VALUES
  ('serrurier', 'Ouverture porte claquée', 'intervention', 80, 150, 0.85),
  ('serrurier', 'Ouverture porte blindée', 'intervention', 150, 350, 0.80),
  ('serrurier', 'Remplacement serrure standard', 'forfait', 120, 250, 0.85),
  ('serrurier', 'Remplacement serrure 3 points', 'forfait', 250, 600, 0.80),
  ('serrurier', 'Installation porte blindée', 'forfait', 1500, 3500, 0.70),
  ('serrurier', 'Remplacement cylindre/barillet', 'forfait', 80, 200, 0.85),
  ('serrurier', 'Intervention urgence soir/week-end', 'intervention', 150, 400, 0.80),
  ('serrurier', 'Reproduction de clé', 'forfait', 5, 30, 0.90),
  ('serrurier', 'Installation digicode', 'forfait', 300, 800, 0.75),
  ('serrurier', 'Blindage porte existante', 'forfait', 500, 1200, 0.75);

-- -------------------------------------------------------
-- 4. CHAUFFAGISTE (12 prestations)
-- -------------------------------------------------------
INSERT INTO prestations_tarifs (metier, prestation, unite, prix_min, prix_max, fiabilite) VALUES
  ('chauffagiste', 'Entretien chaudière gaz annuel', 'forfait', 80, 180, 0.90),
  ('chauffagiste', 'Entretien chaudière fioul annuel', 'forfait', 100, 200, 0.90),
  ('chauffagiste', 'Remplacement chaudière gaz condensation', 'forfait', 3500, 7000, 0.75),
  ('chauffagiste', 'Installation pompe à chaleur air/eau', 'forfait', 8000, 16000, 0.65),
  ('chauffagiste', 'Installation pompe à chaleur air/air', 'forfait', 3000, 7000, 0.70),
  ('chauffagiste', 'Installation plancher chauffant', 'm²', 50, 100, 0.70),
  ('chauffagiste', 'Remplacement radiateur', 'forfait', 200, 600, 0.80),
  ('chauffagiste', 'Désembouage circuit chauffage', 'forfait', 400, 900, 0.75),
  ('chauffagiste', 'Installation thermostat connecté', 'forfait', 200, 500, 0.80),
  ('chauffagiste', 'Réparation chaudière', 'intervention', 150, 500, 0.75),
  ('chauffagiste', 'Purge radiateurs (logement complet)', 'forfait', 80, 200, 0.85),
  ('chauffagiste', 'Installation chauffe-eau solaire', 'forfait', 4000, 8000, 0.65);

-- -------------------------------------------------------
-- 5. COUVREUR (12 prestations)
-- -------------------------------------------------------
INSERT INTO prestations_tarifs (metier, prestation, unite, prix_min, prix_max, fiabilite) VALUES
  ('couvreur', 'Réparation fuite toiture', 'forfait', 200, 600, 0.75),
  ('couvreur', 'Remplacement tuiles cassées', 'forfait', 150, 400, 0.80),
  ('couvreur', 'Réfection toiture complète', 'm²', 80, 200, 0.65),
  ('couvreur', 'Nettoyage/démoussage toiture', 'm²', 15, 35, 0.85),
  ('couvreur', 'Installation velux/fenêtre de toit', 'forfait', 800, 2000, 0.75),
  ('couvreur', 'Pose gouttières', 'mètre linéaire', 30, 80, 0.80),
  ('couvreur', 'Réparation cheminée', 'forfait', 300, 1200, 0.70),
  ('couvreur', 'Isolation toiture par extérieur (sarking)', 'm²', 100, 250, 0.65),
  ('couvreur', 'Pose écran sous-toiture', 'm²', 15, 30, 0.80),
  ('couvreur', 'Remplacement faîtage', 'mètre linéaire', 40, 90, 0.75),
  ('couvreur', 'Traitement charpente', 'm²', 20, 50, 0.75),
  ('couvreur', 'Zinguerie (remplacement noue/solin)', 'mètre linéaire', 50, 120, 0.75);

-- -------------------------------------------------------
-- 6. PEINTRE EN BÂTIMENT (12 prestations)
-- -------------------------------------------------------
INSERT INTO prestations_tarifs (metier, prestation, unite, prix_min, prix_max, fiabilite) VALUES
  ('peintre-en-batiment', 'Peinture murs (par pièce ~12m²)', 'forfait', 200, 500, 0.80),
  ('peintre-en-batiment', 'Peinture plafond (par pièce ~12m²)', 'forfait', 150, 400, 0.80),
  ('peintre-en-batiment', 'Peinture appartement complet (T3)', 'forfait', 2000, 5000, 0.70),
  ('peintre-en-batiment', 'Peinture façade extérieure', 'm²', 25, 60, 0.70),
  ('peintre-en-batiment', 'Pose papier peint', 'm²', 15, 40, 0.80),
  ('peintre-en-batiment', 'Lessivage murs avant peinture', 'm²', 3, 8, 0.85),
  ('peintre-en-batiment', 'Enduit de rebouchage/lissage', 'm²', 10, 25, 0.80),
  ('peintre-en-batiment', 'Peinture boiseries/portes', 'forfait', 50, 150, 0.85),
  ('peintre-en-batiment', 'Peinture escalier', 'forfait', 300, 800, 0.75),
  ('peintre-en-batiment', 'Peinture effet décoratif (béton ciré, stuc)', 'm²', 40, 100, 0.70),
  ('peintre-en-batiment', 'Ravalement façade complet', 'm²', 40, 100, 0.65),
  ('peintre-en-batiment', 'Traitement anti-humidité murs', 'm²', 20, 50, 0.70);

-- -------------------------------------------------------
-- 7. CARRELEUR (10 prestations)
-- -------------------------------------------------------
INSERT INTO prestations_tarifs (metier, prestation, unite, prix_min, prix_max, fiabilite) VALUES
  ('carreleur', 'Pose carrelage sol intérieur', 'm²', 30, 70, 0.80),
  ('carreleur', 'Pose carrelage mural', 'm²', 35, 80, 0.80),
  ('carreleur', 'Pose carrelage grand format (>60x60)', 'm²', 45, 100, 0.75),
  ('carreleur', 'Pose mosaïque', 'm²', 50, 120, 0.75),
  ('carreleur', 'Pose faïence salle de bain', 'm²', 35, 80, 0.80),
  ('carreleur', 'Ragréage sol', 'm²', 15, 30, 0.85),
  ('carreleur', 'Dépose ancien carrelage', 'm²', 15, 35, 0.85),
  ('carreleur', 'Pose carrelage terrasse extérieure', 'm²', 40, 90, 0.75),
  ('carreleur', 'Réfection joints carrelage', 'mètre linéaire', 5, 15, 0.85),
  ('carreleur', 'Pose receveur de douche + carrelage', 'forfait', 500, 1200, 0.75);

-- -------------------------------------------------------
-- 8. MENUISIER (12 prestations)
-- -------------------------------------------------------
INSERT INTO prestations_tarifs (metier, prestation, unite, prix_min, prix_max, fiabilite) VALUES
  ('menuisier', 'Pose fenêtre PVC double vitrage', 'forfait', 300, 700, 0.80),
  ('menuisier', 'Pose fenêtre bois', 'forfait', 400, 900, 0.75),
  ('menuisier', 'Pose fenêtre aluminium', 'forfait', 500, 1100, 0.75),
  ('menuisier', 'Pose porte intérieure', 'forfait', 150, 400, 0.85),
  ('menuisier', 'Pose porte d''entrée', 'forfait', 800, 2500, 0.70),
  ('menuisier', 'Pose volets roulants', 'forfait', 300, 800, 0.80),
  ('menuisier', 'Création placard sur mesure', 'forfait', 500, 2000, 0.70),
  ('menuisier', 'Pose escalier bois', 'forfait', 2000, 6000, 0.65),
  ('menuisier', 'Pose terrasse bois', 'm²', 80, 180, 0.70),
  ('menuisier', 'Réparation fenêtre/porte', 'forfait', 80, 250, 0.80),
  ('menuisier', 'Pose bardage bois extérieur', 'm²', 60, 150, 0.70),
  ('menuisier', 'Aménagement sous-pente/combles', 'm²', 100, 250, 0.65);

-- -------------------------------------------------------
-- 9. MAÇON (12 prestations)
-- -------------------------------------------------------
INSERT INTO prestations_tarifs (metier, prestation, unite, prix_min, prix_max, fiabilite) VALUES
  ('macon', 'Coulage dalle béton', 'm²', 50, 120, 0.75),
  ('macon', 'Montage mur en parpaings', 'm²', 40, 90, 0.80),
  ('macon', 'Montage mur en briques', 'm²', 50, 110, 0.75),
  ('macon', 'Ouverture mur porteur (avec IPN)', 'forfait', 2000, 5000, 0.65),
  ('macon', 'Création extension maison', 'm²', 1000, 2200, 0.60),
  ('macon', 'Construction muret/clôture', 'mètre linéaire', 80, 200, 0.75),
  ('macon', 'Réparation fissures façade', 'mètre linéaire', 30, 80, 0.75),
  ('macon', 'Chape béton', 'm²', 20, 45, 0.80),
  ('macon', 'Démolition cloison', 'forfait', 300, 800, 0.80),
  ('macon', 'Seuil de porte/appui de fenêtre', 'forfait', 100, 300, 0.80),
  ('macon', 'Rejointoiement pierre', 'm²', 40, 100, 0.70),
  ('macon', 'Création escalier béton', 'forfait', 1500, 4000, 0.65);

-- -------------------------------------------------------
-- 10. PLAQUISTE (10 prestations)
-- -------------------------------------------------------
INSERT INTO prestations_tarifs (metier, prestation, unite, prix_min, prix_max, fiabilite) VALUES
  ('platrier', 'Pose placo BA13 standard', 'm²', 20, 40, 0.85),
  ('platrier', 'Pose placo hydrofuge (salle de bain)', 'm²', 25, 50, 0.80),
  ('platrier', 'Pose placo phonique', 'm²', 30, 55, 0.80),
  ('platrier', 'Faux plafond suspendu', 'm²', 30, 60, 0.80),
  ('platrier', 'Faux plafond avec spots intégrés', 'm²', 45, 80, 0.75),
  ('platrier', 'Cloison placo avec isolation', 'm²', 35, 70, 0.80),
  ('platrier', 'Doublage mur avec isolation', 'm²', 30, 60, 0.80),
  ('platrier', 'Bandes et joints placo', 'm²', 8, 15, 0.85),
  ('platrier', 'Création niche/bibliothèque en placo', 'forfait', 200, 600, 0.75),
  ('platrier', 'Habillage sous-pente', 'm²', 35, 70, 0.75);

-- -------------------------------------------------------
-- 11. CHARPENTIER (10 prestations)
-- -------------------------------------------------------
INSERT INTO prestations_tarifs (metier, prestation, unite, prix_min, prix_max, fiabilite) VALUES
  ('charpentier', 'Charpente traditionnelle neuve', 'm²', 80, 180, 0.65),
  ('charpentier', 'Charpente fermettes industrielles', 'm²', 50, 100, 0.70),
  ('charpentier', 'Réparation/renforcement charpente', 'forfait', 500, 3000, 0.65),
  ('charpentier', 'Traitement charpente (injection)', 'm²', 20, 50, 0.80),
  ('charpentier', 'Surélévation toiture', 'm²', 800, 1800, 0.55),
  ('charpentier', 'Aménagement combles (structure)', 'm²', 200, 500, 0.65),
  ('charpentier', 'Pose poutre apparente décorative', 'mètre linéaire', 50, 150, 0.75),
  ('charpentier', 'Construction ossature bois', 'm²', 150, 350, 0.60),
  ('charpentier', 'Remplacement pannes/chevrons', 'forfait', 300, 1500, 0.70),
  ('charpentier', 'Lucarne/chien-assis', 'forfait', 3000, 8000, 0.60);

-- -------------------------------------------------------
-- 12. VITRIER (10 prestations)
-- -------------------------------------------------------
INSERT INTO prestations_tarifs (metier, prestation, unite, prix_min, prix_max, fiabilite) VALUES
  ('vitrier', 'Remplacement simple vitrage', 'forfait', 80, 200, 0.85),
  ('vitrier', 'Remplacement double vitrage', 'forfait', 150, 400, 0.80),
  ('vitrier', 'Pose vitrine commerce', 'm²', 100, 300, 0.70),
  ('vitrier', 'Remplacement verre sécurit/trempé', 'forfait', 200, 500, 0.75),
  ('vitrier', 'Pose miroir sur mesure', 'm²', 80, 200, 0.80),
  ('vitrier', 'Vitrage anti-effraction', 'forfait', 250, 600, 0.75),
  ('vitrier', 'Survitrage fenêtre existante', 'forfait', 100, 250, 0.80),
  ('vitrier', 'Dépannage urgence vitrage cassé', 'intervention', 120, 300, 0.80),
  ('vitrier', 'Pose crédence verre cuisine', 'mètre linéaire', 100, 250, 0.75),
  ('vitrier', 'Pose paroi de douche en verre', 'forfait', 300, 900, 0.75);

-- -------------------------------------------------------
-- 13. CLIMATICIEN (10 prestations)
-- -------------------------------------------------------
INSERT INTO prestations_tarifs (metier, prestation, unite, prix_min, prix_max, fiabilite) VALUES
  ('climaticien', 'Installation climatisation monosplit', 'forfait', 1200, 2500, 0.80),
  ('climaticien', 'Installation climatisation multisplit (2 unités)', 'forfait', 2500, 5000, 0.75),
  ('climaticien', 'Installation climatisation multisplit (3 unités)', 'forfait', 3500, 7000, 0.70),
  ('climaticien', 'Entretien climatisation annuel', 'forfait', 100, 200, 0.90),
  ('climaticien', 'Recharge gaz réfrigérant', 'forfait', 150, 350, 0.80),
  ('climaticien', 'Dépannage/réparation climatisation', 'intervention', 100, 300, 0.75),
  ('climaticien', 'Installation climatisation gainable', 'forfait', 5000, 12000, 0.65),
  ('climaticien', 'Installation climatisation réversible', 'forfait', 1500, 3500, 0.75),
  ('climaticien', 'Dépose et remplacement unité extérieure', 'forfait', 500, 1500, 0.75),
  ('climaticien', 'Installation climatisation cassette', 'forfait', 2000, 5000, 0.70);

-- -------------------------------------------------------
-- 14. TERRASSIER (10 prestations)
-- -------------------------------------------------------
INSERT INTO prestations_tarifs (metier, prestation, unite, prix_min, prix_max, fiabilite) VALUES
  ('terrassier', 'Terrassement terrain plat', 'm²', 8, 20, 0.75),
  ('terrassier', 'Décaissement terrain', 'm²', 10, 25, 0.75),
  ('terrassier', 'Fouilles fondations maison', 'mètre linéaire', 30, 80, 0.70),
  ('terrassier', 'Creusement piscine', 'forfait', 2000, 5000, 0.65),
  ('terrassier', 'Enrochement/talus', 'mètre linéaire', 80, 200, 0.65),
  ('terrassier', 'Viabilisation terrain', 'forfait', 3000, 10000, 0.60),
  ('terrassier', 'Pose regard/drainage', 'mètre linéaire', 30, 70, 0.75),
  ('terrassier', 'Assainissement individuel (fosse)', 'forfait', 5000, 12000, 0.60),
  ('terrassier', 'Remblaiement terrain', 'm²', 5, 15, 0.80),
  ('terrassier', 'Création allée/chemin d''accès', 'm²', 20, 60, 0.70);

-- -------------------------------------------------------
-- 15. FAÇADIER (10 prestations)
-- -------------------------------------------------------
INSERT INTO prestations_tarifs (metier, prestation, unite, prix_min, prix_max, fiabilite) VALUES
  ('facadier', 'Ravalement façade (nettoyage + peinture)', 'm²', 30, 70, 0.75),
  ('facadier', 'Enduit façade monocouche', 'm²', 25, 55, 0.80),
  ('facadier', 'Enduit façade traditionnel (3 couches)', 'm²', 40, 80, 0.70),
  ('facadier', 'ITE (isolation thermique extérieure)', 'm²', 100, 200, 0.65),
  ('facadier', 'Crépis décoratif', 'm²', 30, 65, 0.75),
  ('facadier', 'Réparation fissures façade', 'mètre linéaire', 20, 60, 0.75),
  ('facadier', 'Hydrofugation façade', 'm²', 10, 25, 0.85),
  ('facadier', 'Piquage ancien enduit', 'm²', 15, 35, 0.80),
  ('facadier', 'Pose bardage extérieur', 'm²', 60, 150, 0.65),
  ('facadier', 'Rejointoiement pierres de taille', 'm²', 50, 120, 0.70);

-- -------------------------------------------------------
-- 16. ÉTANCHÉISTE (10 prestations)
-- -------------------------------------------------------
INSERT INTO prestations_tarifs (metier, prestation, unite, prix_min, prix_max, fiabilite) VALUES
  ('etancheiste', 'Étanchéité toiture-terrasse bitume', 'm²', 40, 90, 0.75),
  ('etancheiste', 'Étanchéité toiture-terrasse résine', 'm²', 50, 110, 0.70),
  ('etancheiste', 'Étanchéité sous-sol/cave', 'm²', 30, 80, 0.70),
  ('etancheiste', 'Cuvelage cave', 'm²', 100, 250, 0.60),
  ('etancheiste', 'Étanchéité terrasse carrelée (SEL)', 'm²', 35, 70, 0.75),
  ('etancheiste', 'Traitement remontées capillaires', 'mètre linéaire', 50, 150, 0.65),
  ('etancheiste', 'Membrane EPDM toiture plate', 'm²', 45, 100, 0.75),
  ('etancheiste', 'Réparation ponctuelle étanchéité', 'forfait', 200, 600, 0.75),
  ('etancheiste', 'Étanchéité balcon/loggia', 'm²', 40, 90, 0.75),
  ('etancheiste', 'Végétalisation toiture-terrasse', 'm²', 60, 150, 0.60);

-- -------------------------------------------------------
-- 17. DOMOTICIEN (10 prestations)
-- -------------------------------------------------------
INSERT INTO prestations_tarifs (metier, prestation, unite, prix_min, prix_max, fiabilite) VALUES
  ('domoticien', 'Installation système domotique complet', 'forfait', 3000, 10000, 0.60),
  ('domoticien', 'Installation éclairage connecté (pièce)', 'forfait', 200, 500, 0.80),
  ('domoticien', 'Installation volets roulants connectés', 'forfait', 300, 700, 0.80),
  ('domoticien', 'Installation thermostat intelligent', 'forfait', 200, 500, 0.85),
  ('domoticien', 'Configuration box domotique', 'forfait', 150, 400, 0.80),
  ('domoticien', 'Installation vidéophone connecté', 'forfait', 300, 800, 0.80),
  ('domoticien', 'Scénarios automatisation (par pièce)', 'forfait', 100, 300, 0.75),
  ('domoticien', 'Installation portail motorisé connecté', 'forfait', 800, 2000, 0.70),
  ('domoticien', 'Installation serrure connectée', 'forfait', 200, 500, 0.80),
  ('domoticien', 'Audit et conseil domotique', 'intervention', 100, 300, 0.85);

-- -------------------------------------------------------
-- 18. SOUDEUR (10 prestations)
-- -------------------------------------------------------
INSERT INTO prestations_tarifs (metier, prestation, unite, prix_min, prix_max, fiabilite) VALUES
  ('metallier', 'Soudure réparation grille/portail', 'forfait', 80, 250, 0.80),
  ('metallier', 'Fabrication garde-corps métallique', 'mètre linéaire', 150, 350, 0.70),
  ('metallier', 'Fabrication portail sur mesure', 'forfait', 1500, 4000, 0.65),
  ('metallier', 'Fabrication escalier métallique', 'forfait', 3000, 8000, 0.60),
  ('metallier', 'Soudure inox (alimentaire/déco)', 'heure', 60, 120, 0.75),
  ('metallier', 'Soudure aluminium', 'heure', 70, 130, 0.75),
  ('metallier', 'Réparation structure métallique', 'forfait', 200, 800, 0.70),
  ('metallier', 'Fabrication pergola métallique', 'forfait', 2000, 6000, 0.65),
  ('metallier', 'Fabrication marquise/auvent', 'forfait', 500, 2000, 0.70),
  ('metallier', 'Pose serrurerie métallique (grilles)', 'm²', 100, 250, 0.70);

-- -------------------------------------------------------
-- 19. RAMONEUR (8 prestations)
-- -------------------------------------------------------
INSERT INTO prestations_tarifs (metier, prestation, unite, prix_min, prix_max, fiabilite) VALUES
  ('ramoneur', 'Ramonage cheminée foyer ouvert', 'forfait', 50, 100, 0.90),
  ('ramoneur', 'Ramonage cheminée insert/poêle bois', 'forfait', 60, 120, 0.90),
  ('ramoneur', 'Ramonage chaudière fioul', 'forfait', 60, 130, 0.85),
  ('ramoneur', 'Ramonage conduit inox', 'forfait', 70, 140, 0.85),
  ('ramoneur', 'Débistrage conduit (mécanique)', 'forfait', 200, 500, 0.75),
  ('ramoneur', 'Tubage conduit cheminée', 'mètre linéaire', 50, 120, 0.70),
  ('ramoneur', 'Test fumigène étanchéité conduit', 'forfait', 80, 180, 0.80),
  ('ramoneur', 'Pose chapeau de cheminée', 'forfait', 100, 300, 0.80);

-- -------------------------------------------------------
-- 20. PISCINISTE (10 prestations)
-- -------------------------------------------------------
INSERT INTO prestations_tarifs (metier, prestation, unite, prix_min, prix_max, fiabilite) VALUES
  ('pisciniste', 'Construction piscine coque 8x4m', 'forfait', 15000, 30000, 0.55),
  ('pisciniste', 'Construction piscine béton 8x4m', 'forfait', 25000, 50000, 0.50),
  ('pisciniste', 'Liner piscine (remplacement)', 'forfait', 2000, 5000, 0.70),
  ('pisciniste', 'Installation pompe à chaleur piscine', 'forfait', 2000, 5000, 0.70),
  ('pisciniste', 'Rénovation piscine (étanchéité)', 'forfait', 3000, 8000, 0.60),
  ('pisciniste', 'Installation volet roulant piscine', 'forfait', 3000, 8000, 0.65),
  ('pisciniste', 'Hivernage piscine', 'forfait', 150, 350, 0.85),
  ('pisciniste', 'Mise en route printanière', 'forfait', 150, 300, 0.85),
  ('pisciniste', 'Remplacement pompe de filtration', 'forfait', 300, 800, 0.80),
  ('pisciniste', 'Construction piscine naturelle', 'forfait', 20000, 50000, 0.50);

-- -------------------------------------------------------
-- 21. JARDINIER-PAYSAGISTE (12 prestations)
-- -------------------------------------------------------
INSERT INTO prestations_tarifs (metier, prestation, unite, prix_min, prix_max, fiabilite) VALUES
  ('paysagiste', 'Tonte pelouse (jardin ~200m²)', 'forfait', 30, 60, 0.90),
  ('paysagiste', 'Taille de haie', 'mètre linéaire', 5, 15, 0.85),
  ('paysagiste', 'Élagage arbre moyen', 'forfait', 200, 600, 0.70),
  ('paysagiste', 'Abattage arbre', 'forfait', 300, 1500, 0.60),
  ('paysagiste', 'Création jardin paysager', 'm²', 30, 80, 0.60),
  ('paysagiste', 'Engazonnement (semis)', 'm²', 5, 12, 0.85),
  ('paysagiste', 'Pose gazon en rouleau', 'm²', 10, 25, 0.80),
  ('paysagiste', 'Création terrasse bois', 'm²', 80, 180, 0.70),
  ('paysagiste', 'Installation arrosage automatique', 'forfait', 1500, 4000, 0.65),
  ('paysagiste', 'Dessouchage', 'forfait', 100, 400, 0.70),
  ('paysagiste', 'Entretien annuel jardin (forfait)', 'forfait', 1200, 3000, 0.75),
  ('paysagiste', 'Clôture/grillage', 'mètre linéaire', 30, 80, 0.80);

-- -------------------------------------------------------
-- 22. ÉBÉNISTE (10 prestations)
-- -------------------------------------------------------
INSERT INTO prestations_tarifs (metier, prestation, unite, prix_min, prix_max, fiabilite) VALUES
  ('ebeniste', 'Restauration meuble ancien', 'forfait', 300, 1500, 0.60),
  ('ebeniste', 'Fabrication meuble sur mesure', 'forfait', 1000, 5000, 0.55),
  ('ebeniste', 'Fabrication bibliothèque sur mesure', 'forfait', 1500, 5000, 0.60),
  ('ebeniste', 'Fabrication table sur mesure', 'forfait', 800, 3000, 0.60),
  ('ebeniste', 'Placage/marqueterie réparation', 'forfait', 200, 800, 0.65),
  ('ebeniste', 'Remise en état parquet ancien', 'm²', 30, 70, 0.70),
  ('ebeniste', 'Fabrication plan de travail bois massif', 'mètre linéaire', 150, 400, 0.65),
  ('ebeniste', 'Création dressing bois sur mesure', 'forfait', 2000, 6000, 0.55),
  ('ebeniste', 'Réparation/collage meuble', 'forfait', 80, 300, 0.75),
  ('ebeniste', 'Finition/vernissage meuble', 'forfait', 100, 400, 0.70);

-- -------------------------------------------------------
-- 23. TAPISSIER (10 prestations)
-- -------------------------------------------------------
INSERT INTO prestations_tarifs (metier, prestation, unite, prix_min, prix_max, fiabilite) VALUES
  ('decorateur', 'Réfection fauteuil classique', 'forfait', 300, 800, 0.70),
  ('decorateur', 'Réfection canapé 2 places', 'forfait', 600, 1500, 0.65),
  ('decorateur', 'Réfection canapé 3 places', 'forfait', 800, 2000, 0.60),
  ('decorateur', 'Réfection assise chaise', 'forfait', 80, 200, 0.80),
  ('decorateur', 'Pose tissu mural tendu', 'm²', 30, 80, 0.70),
  ('decorateur', 'Confection rideaux sur mesure', 'mètre linéaire', 40, 120, 0.70),
  ('decorateur', 'Pose stores intérieurs', 'forfait', 100, 300, 0.80),
  ('decorateur', 'Création tête de lit capitonnée', 'forfait', 300, 800, 0.70),
  ('decorateur', 'Mousse sur mesure (assise)', 'forfait', 50, 200, 0.80),
  ('decorateur', 'Conseil décoration intérieure', 'heure', 50, 100, 0.80);

-- -------------------------------------------------------
-- 24. MIROITIER (10 prestations)
-- -------------------------------------------------------
INSERT INTO prestations_tarifs (metier, prestation, unite, prix_min, prix_max, fiabilite) VALUES
  ('miroitier', 'Pose miroir mural sur mesure', 'm²', 80, 200, 0.80),
  ('miroitier', 'Remplacement glace armoire', 'forfait', 100, 300, 0.80),
  ('miroitier', 'Pose crédence miroir cuisine', 'mètre linéaire', 100, 250, 0.75),
  ('miroitier', 'Découpe verre sur mesure', 'm²', 50, 150, 0.85),
  ('miroitier', 'Pose vitrage isolant (double/triple)', 'forfait', 200, 500, 0.75),
  ('miroitier', 'Remplacement vitre table en verre', 'forfait', 80, 250, 0.80),
  ('miroitier', 'Pose cloison vitrée intérieure', 'm²', 200, 500, 0.65),
  ('miroitier', 'Miroir salle de bain rétroéclairé', 'forfait', 200, 600, 0.75),
  ('miroitier', 'Remplacement vitrage fenêtre', 'forfait', 100, 350, 0.80),
  ('miroitier', 'Pose garde-corps en verre', 'mètre linéaire', 200, 500, 0.65);

-- -------------------------------------------------------
-- 25. FERRONNIER (10 prestations)
-- -------------------------------------------------------
INSERT INTO prestations_tarifs (metier, prestation, unite, prix_min, prix_max, fiabilite) VALUES
  ('ferronnier', 'Fabrication grille de défense fenêtre', 'forfait', 200, 600, 0.75),
  ('ferronnier', 'Fabrication rampe d''escalier fer forgé', 'mètre linéaire', 150, 400, 0.65),
  ('ferronnier', 'Fabrication portail fer forgé', 'forfait', 2000, 6000, 0.55),
  ('ferronnier', 'Fabrication garde-corps fer forgé', 'mètre linéaire', 200, 500, 0.65),
  ('ferronnier', 'Réparation portail/grille existant', 'forfait', 100, 400, 0.75),
  ('ferronnier', 'Fabrication marquise fer forgé', 'forfait', 600, 2000, 0.65),
  ('ferronnier', 'Fabrication mobilier jardin fer forgé', 'forfait', 300, 1200, 0.60),
  ('ferronnier', 'Ferronnerie décorative (applique, console)', 'forfait', 100, 500, 0.65),
  ('ferronnier', 'Restauration ferronnerie ancienne', 'forfait', 200, 1000, 0.60),
  ('ferronnier', 'Fabrication treille/pergola fer forgé', 'forfait', 1000, 3500, 0.60);

-- -------------------------------------------------------
-- 26. ZINGUEUR (10 prestations)
-- -------------------------------------------------------
INSERT INTO prestations_tarifs (metier, prestation, unite, prix_min, prix_max, fiabilite) VALUES
  ('zingueur', 'Pose gouttière zinc', 'mètre linéaire', 40, 90, 0.80),
  ('zingueur', 'Pose gouttière aluminium', 'mètre linéaire', 30, 70, 0.80),
  ('zingueur', 'Pose gouttière PVC', 'mètre linéaire', 20, 50, 0.85),
  ('zingueur', 'Remplacement descente EP', 'mètre linéaire', 25, 60, 0.80),
  ('zingueur', 'Réparation gouttière percée', 'forfait', 80, 200, 0.85),
  ('zingueur', 'Pose habillage bandeau/sous-face', 'mètre linéaire', 30, 70, 0.80),
  ('zingueur', 'Pose noue zinc', 'mètre linéaire', 60, 140, 0.75),
  ('zingueur', 'Pose solin/abergement', 'mètre linéaire', 40, 100, 0.75),
  ('zingueur', 'Rénovation complète zinguerie maison', 'forfait', 2000, 5000, 0.65),
  ('zingueur', 'Pose cuvette de toit zinc', 'forfait', 300, 800, 0.70);

-- -------------------------------------------------------
-- 27. FUMISTE (8 prestations)
-- -------------------------------------------------------
INSERT INTO prestations_tarifs (metier, prestation, unite, prix_min, prix_max, fiabilite) VALUES
  ('ramoneur', 'Installation insert cheminée', 'forfait', 1500, 4000, 0.70),
  ('ramoneur', 'Installation poêle à bois', 'forfait', 1000, 3000, 0.70),
  ('ramoneur', 'Installation poêle à granulés', 'forfait', 2000, 5000, 0.70),
  ('ramoneur', 'Tubage conduit cheminée complet', 'forfait', 1000, 3000, 0.70),
  ('ramoneur', 'Chemisage conduit maçonné', 'forfait', 1500, 4000, 0.60),
  ('ramoneur', 'Création conduit de fumée neuf', 'forfait', 2000, 5000, 0.60),
  ('ramoneur', 'Réparation/rénovation conduit', 'forfait', 500, 1500, 0.65),
  ('ramoneur', 'Diagnostic conduit fumée', 'intervention', 100, 250, 0.85);

-- -------------------------------------------------------
-- 28. CALORIFUGEUR (8 prestations)
-- -------------------------------------------------------
INSERT INTO prestations_tarifs (metier, prestation, unite, prix_min, prix_max, fiabilite) VALUES
  ('isolation-thermique', 'Isolation combles perdus soufflage', 'm²', 15, 35, 0.85),
  ('isolation-thermique', 'Isolation combles aménagés (rampants)', 'm²', 35, 70, 0.75),
  ('isolation-thermique', 'Isolation murs par intérieur', 'm²', 30, 60, 0.75),
  ('isolation-thermique', 'Isolation murs par extérieur (ITE)', 'm²', 100, 200, 0.65),
  ('isolation-thermique', 'Isolation plancher bas', 'm²', 20, 45, 0.80),
  ('isolation-thermique', 'Isolation tuyauterie (calorifugeage)', 'mètre linéaire', 10, 30, 0.85),
  ('isolation-thermique', 'Isolation phonique cloison', 'm²', 30, 60, 0.75),
  ('isolation-thermique', 'Isolation toiture-terrasse', 'm²', 40, 90, 0.70);

-- -------------------------------------------------------
-- 29. CORDISTE (8 prestations)
-- -------------------------------------------------------
INSERT INTO prestations_tarifs (metier, prestation, unite, prix_min, prix_max, fiabilite) VALUES
  ('facadier', 'Nettoyage façade sur corde', 'm²', 20, 50, 0.70),
  ('facadier', 'Réparation façade en hauteur (cordiste)', 'forfait', 500, 2000, 0.60),
  ('facadier', 'Pose filet anti-pigeon', 'm²', 15, 40, 0.75),
  ('facadier', 'Peinture pylône/structure métallique', 'forfait', 1000, 4000, 0.55),
  ('facadier', 'Inspection visuelle façade', 'forfait', 300, 800, 0.75),
  ('facadier', 'Réparation toiture sans échafaudage', 'forfait', 400, 1500, 0.60),
  ('facadier', 'Pose banderole/enseigne en hauteur', 'forfait', 200, 600, 0.75),
  ('facadier', 'Élagage sur corde', 'forfait', 300, 1000, 0.65);

-- -------------------------------------------------------
-- 30. DIAGNOSTIQUEUR IMMOBILIER (10 prestations)
-- -------------------------------------------------------
INSERT INTO prestations_tarifs (metier, prestation, unite, prix_min, prix_max, fiabilite) VALUES
  ('diagnostiqueur', 'DPE (diagnostic performance énergétique)', 'forfait', 100, 250, 0.85),
  ('diagnostiqueur', 'Diagnostic amiante', 'forfait', 80, 200, 0.85),
  ('diagnostiqueur', 'Diagnostic plomb (CREP)', 'forfait', 100, 250, 0.85),
  ('diagnostiqueur', 'Diagnostic électricité', 'forfait', 80, 180, 0.85),
  ('diagnostiqueur', 'Diagnostic gaz', 'forfait', 80, 180, 0.85),
  ('diagnostiqueur', 'Diagnostic termites', 'forfait', 80, 200, 0.85),
  ('diagnostiqueur', 'Pack vente complet (6 diagnostics)', 'forfait', 300, 600, 0.80),
  ('diagnostiqueur', 'Pack location (DPE + électricité + gaz)', 'forfait', 200, 400, 0.80),
  ('diagnostiqueur', 'Mesurage loi Carrez', 'forfait', 70, 150, 0.90),
  ('diagnostiqueur', 'Audit énergétique réglementaire', 'forfait', 500, 1200, 0.70);

-- -------------------------------------------------------
-- 31. GÉOMÈTRE (10 prestations)
-- -------------------------------------------------------
INSERT INTO prestations_tarifs (metier, prestation, unite, prix_min, prix_max, fiabilite) VALUES
  ('geometre', 'Bornage terrain', 'forfait', 800, 2000, 0.70),
  ('geometre', 'Plan topographique', 'forfait', 500, 1500, 0.70),
  ('geometre', 'Division parcellaire', 'forfait', 1000, 3000, 0.65),
  ('geometre', 'Implantation construction', 'forfait', 400, 1000, 0.75),
  ('geometre', 'Mesurage loi Carrez', 'forfait', 70, 200, 0.85),
  ('geometre', 'Plan de situation', 'forfait', 200, 500, 0.80),
  ('geometre', 'Relevé intérieur (plan de maison)', 'forfait', 300, 800, 0.75),
  ('geometre', 'Étude de sol (coordination)', 'forfait', 1000, 2500, 0.65),
  ('geometre', 'Copropriété (état descriptif de division)', 'forfait', 1500, 4000, 0.60),
  ('geometre', 'Certificat de conformité', 'forfait', 300, 800, 0.75);

-- -------------------------------------------------------
-- 32. ARCHITECTE D'INTÉRIEUR (10 prestations)
-- -------------------------------------------------------
INSERT INTO prestations_tarifs (metier, prestation, unite, prix_min, prix_max, fiabilite) VALUES
  ('architecte-interieur', 'Consultation/conseil décoration', 'heure', 60, 150, 0.85),
  ('architecte-interieur', 'Étude d''aménagement (plans + moodboard)', 'forfait', 500, 2000, 0.70),
  ('architecte-interieur', 'Projet complet rénovation (suivi inclus)', 'forfait', 3000, 15000, 0.55),
  ('architecte-interieur', 'Plans 3D/perspectives', 'forfait', 300, 1000, 0.75),
  ('architecte-interieur', 'Shopping list mobilier/déco', 'forfait', 200, 600, 0.80),
  ('architecte-interieur', 'Suivi de chantier', 'heure', 50, 100, 0.75),
  ('architecte-interieur', 'Home staging (mise en valeur vente)', 'forfait', 500, 3000, 0.65),
  ('architecte-interieur', 'Aménagement cuisine (conception)', 'forfait', 500, 2000, 0.70),
  ('architecte-interieur', 'Aménagement bureau/commerce', 'm²', 50, 150, 0.65),
  ('architecte-interieur', 'Colorimétrie et choix matériaux', 'forfait', 200, 500, 0.80);

-- -------------------------------------------------------
-- 33. CUISINISTE (10 prestations)
-- -------------------------------------------------------
INSERT INTO prestations_tarifs (metier, prestation, unite, prix_min, prix_max, fiabilite) VALUES
  ('cuisiniste', 'Cuisine équipée entrée de gamme (pose incluse)', 'forfait', 3000, 6000, 0.70),
  ('cuisiniste', 'Cuisine équipée milieu de gamme (pose incluse)', 'forfait', 6000, 12000, 0.65),
  ('cuisiniste', 'Cuisine équipée haut de gamme (pose incluse)', 'forfait', 12000, 30000, 0.55),
  ('cuisiniste', 'Pose seule cuisine (sans meubles)', 'forfait', 1000, 3000, 0.75),
  ('cuisiniste', 'Remplacement plan de travail', 'mètre linéaire', 100, 400, 0.75),
  ('cuisiniste', 'Pose crédence', 'mètre linéaire', 40, 120, 0.80),
  ('cuisiniste', 'Remplacement façades (relooking)', 'forfait', 1500, 4000, 0.65),
  ('cuisiniste', 'Installation îlot central', 'forfait', 1500, 5000, 0.60),
  ('cuisiniste', 'Conception/étude cuisine sur mesure', 'forfait', 200, 500, 0.80),
  ('cuisiniste', 'Raccordement électroménager', 'forfait', 100, 300, 0.85);

-- -------------------------------------------------------
-- 34. INSTALLATEUR SALLE DE BAIN (10 prestations)
-- -------------------------------------------------------
INSERT INTO prestations_tarifs (metier, prestation, unite, prix_min, prix_max, fiabilite) VALUES
  ('salle-de-bain', 'Rénovation complète salle de bain (3-5m²)', 'forfait', 4000, 10000, 0.60),
  ('salle-de-bain', 'Rénovation complète salle de bain (5-8m²)', 'forfait', 7000, 15000, 0.55),
  ('salle-de-bain', 'Remplacement baignoire par douche', 'forfait', 2000, 5000, 0.70),
  ('salle-de-bain', 'Installation douche italienne', 'forfait', 2500, 6000, 0.65),
  ('salle-de-bain', 'Pose meuble vasque', 'forfait', 200, 600, 0.80),
  ('salle-de-bain', 'Pose carrelage salle de bain', 'm²', 35, 80, 0.80),
  ('salle-de-bain', 'Pose baignoire balnéo', 'forfait', 1000, 3000, 0.70),
  ('salle-de-bain', 'Installation sèche-serviettes', 'forfait', 150, 400, 0.85),
  ('salle-de-bain', 'Création salle d''eau (dans chambre)', 'forfait', 5000, 12000, 0.55),
  ('salle-de-bain', 'Adaptation PMR salle de bain', 'forfait', 3000, 8000, 0.60);

-- -------------------------------------------------------
-- 35. POSEUR DE PARQUET (10 prestations)
-- -------------------------------------------------------
INSERT INTO prestations_tarifs (metier, prestation, unite, prix_min, prix_max, fiabilite) VALUES
  ('poseur-de-parquet', 'Pose parquet flottant stratifié', 'm²', 15, 35, 0.85),
  ('poseur-de-parquet', 'Pose parquet contrecollé clipsable', 'm²', 25, 50, 0.80),
  ('poseur-de-parquet', 'Pose parquet massif cloué', 'm²', 40, 80, 0.75),
  ('poseur-de-parquet', 'Pose parquet massif collé', 'm²', 35, 70, 0.75),
  ('poseur-de-parquet', 'Ponçage/vitrification parquet', 'm²', 20, 45, 0.80),
  ('poseur-de-parquet', 'Ponçage/huilage parquet', 'm²', 22, 50, 0.80),
  ('poseur-de-parquet', 'Réparation lames parquet endommagées', 'forfait', 100, 400, 0.75),
  ('poseur-de-parquet', 'Pose plinthes', 'mètre linéaire', 5, 15, 0.85),
  ('poseur-de-parquet', 'Pose sous-couche isolante', 'm²', 3, 8, 0.90),
  ('poseur-de-parquet', 'Dépose ancien revêtement sol', 'm²', 5, 15, 0.85);

-- -------------------------------------------------------
-- 36. INSTALLATEUR DE STORES (10 prestations)
-- -------------------------------------------------------
INSERT INTO prestations_tarifs (metier, prestation, unite, prix_min, prix_max, fiabilite) VALUES
  ('storiste', 'Pose store banne motorisé', 'forfait', 1000, 3000, 0.75),
  ('storiste', 'Pose store banne manuel', 'forfait', 500, 1500, 0.80),
  ('storiste', 'Pose store vénitien intérieur', 'forfait', 80, 200, 0.85),
  ('storiste', 'Pose store enrouleur', 'forfait', 60, 150, 0.85),
  ('storiste', 'Pose volet roulant électrique', 'forfait', 300, 800, 0.80),
  ('storiste', 'Pose volet roulant manuel', 'forfait', 200, 500, 0.80),
  ('storiste', 'Motorisation volet roulant existant', 'forfait', 200, 500, 0.80),
  ('storiste', 'Réparation store banne', 'forfait', 100, 400, 0.75),
  ('storiste', 'Remplacement toile store banne', 'forfait', 300, 800, 0.75),
  ('storiste', 'Pose brise-soleil orientable (BSO)', 'forfait', 400, 1000, 0.75);

-- -------------------------------------------------------
-- 37. INSTALLATEUR ALARME/SÉCURITÉ (10 prestations)
-- -------------------------------------------------------
INSERT INTO prestations_tarifs (metier, prestation, unite, prix_min, prix_max, fiabilite) VALUES
  ('alarme-securite', 'Installation alarme sans fil (maison)', 'forfait', 500, 1500, 0.80),
  ('alarme-securite', 'Installation alarme filaire (maison)', 'forfait', 1000, 3000, 0.70),
  ('alarme-securite', 'Installation vidéosurveillance (4 caméras)', 'forfait', 800, 2500, 0.75),
  ('alarme-securite', 'Installation interphone/visiophone', 'forfait', 200, 600, 0.80),
  ('alarme-securite', 'Installation détecteur de fumée', 'forfait', 30, 80, 0.90),
  ('alarme-securite', 'Maintenance/vérification système alarme', 'forfait', 80, 200, 0.85),
  ('alarme-securite', 'Installation contrôle d''accès', 'forfait', 500, 2000, 0.70),
  ('alarme-securite', 'Installation caméra IP supplémentaire', 'forfait', 150, 400, 0.80),
  ('alarme-securite', 'Télésurveillance (abonnement annuel)', 'forfait', 200, 500, 0.80),
  ('alarme-securite', 'Installation alarme commerce/bureau', 'forfait', 1000, 4000, 0.65);

-- -------------------------------------------------------
-- 38. INSTALLATEUR FIBRE / ANTENNISTE (10 prestations)
-- -------------------------------------------------------
INSERT INTO prestations_tarifs (metier, prestation, unite, prix_min, prix_max, fiabilite) VALUES
  ('antenniste', 'Installation antenne TNT', 'forfait', 100, 300, 0.85),
  ('antenniste', 'Installation parabole satellite', 'forfait', 150, 400, 0.80),
  ('antenniste', 'Raccordement fibre optique intérieur', 'forfait', 80, 200, 0.85),
  ('antenniste', 'Installation prise RJ45/réseau', 'forfait', 50, 120, 0.85),
  ('antenniste', 'Câblage réseau maison complète', 'forfait', 500, 1500, 0.70),
  ('antenniste', 'Installation amplificateur signal', 'forfait', 80, 200, 0.85),
  ('antenniste', 'Installation distribution TV multi-pièces', 'forfait', 200, 600, 0.75),
  ('antenniste', 'Réparation/réorientation antenne', 'intervention', 80, 200, 0.80),
  ('antenniste', 'Installation réseau WiFi professionnel', 'forfait', 300, 1000, 0.70),
  ('antenniste', 'Tirage câble fibre/ethernet', 'mètre linéaire', 5, 15, 0.80);

-- -------------------------------------------------------
-- 39. DÉSINSECTISEUR (10 prestations)
-- -------------------------------------------------------
INSERT INTO prestations_tarifs (metier, prestation, unite, prix_min, prix_max, fiabilite) VALUES
  ('desinsectisation', 'Traitement punaises de lit (appartement)', 'forfait', 200, 600, 0.75),
  ('desinsectisation', 'Traitement punaises de lit (maison)', 'forfait', 400, 1000, 0.70),
  ('desinsectisation', 'Destruction nid de guêpes/frelons', 'forfait', 80, 200, 0.85),
  ('desinsectisation', 'Destruction nid de frelons asiatiques', 'forfait', 100, 250, 0.85),
  ('desinsectisation', 'Traitement cafards/blattes', 'forfait', 100, 300, 0.80),
  ('desinsectisation', 'Traitement fourmis', 'forfait', 80, 200, 0.80),
  ('desinsectisation', 'Traitement puces (logement)', 'forfait', 150, 400, 0.75),
  ('desinsectisation', 'Traitement mites alimentaires/textiles', 'forfait', 100, 250, 0.80),
  ('desinsectisation', 'Traitement termites (diagnostic + traitement)', 'forfait', 1000, 3000, 0.60),
  ('desinsectisation', 'Contrat annuel désinsectisation pro', 'forfait', 500, 1500, 0.70);

-- -------------------------------------------------------
-- 40. DÉRATISEUR (8 prestations)
-- -------------------------------------------------------
INSERT INTO prestations_tarifs (metier, prestation, unite, prix_min, prix_max, fiabilite) VALUES
  ('deratisation', 'Dératisation maison individuelle', 'forfait', 100, 300, 0.80),
  ('deratisation', 'Dératisation appartement', 'forfait', 80, 200, 0.80),
  ('deratisation', 'Dératisation local commercial', 'forfait', 150, 400, 0.75),
  ('deratisation', 'Dératisation cave/sous-sol', 'forfait', 80, 200, 0.80),
  ('deratisation', 'Pose pièges mécaniques', 'forfait', 50, 150, 0.85),
  ('deratisation', 'Rebouchage points d''entrée rongeurs', 'forfait', 100, 300, 0.80),
  ('deratisation', 'Contrat annuel dératisation', 'forfait', 300, 800, 0.75),
  ('deratisation', 'Dératisation urgente (restaurant/commerce)', 'intervention', 150, 400, 0.75);

-- -------------------------------------------------------
-- 41. NETTOYEUR PROFESSIONNEL (10 prestations)
-- -------------------------------------------------------
INSERT INTO prestations_tarifs (metier, prestation, unite, prix_min, prix_max, fiabilite) VALUES
  ('nettoyage', 'Nettoyage fin de chantier (appartement)', 'forfait', 200, 500, 0.80),
  ('nettoyage', 'Nettoyage fin de chantier (maison)', 'forfait', 400, 1000, 0.75),
  ('nettoyage', 'Nettoyage déménagement/remise en état', 'forfait', 150, 400, 0.80),
  ('nettoyage', 'Nettoyage vitres (appartement)', 'forfait', 80, 200, 0.85),
  ('nettoyage', 'Nettoyage moquette/tapis', 'm²', 3, 8, 0.85),
  ('nettoyage', 'Nettoyage canapé/fauteuil', 'forfait', 50, 150, 0.85),
  ('nettoyage', 'Nettoyage haute pression façade', 'm²', 5, 15, 0.80),
  ('nettoyage', 'Débarras logement complet', 'forfait', 500, 2000, 0.65),
  ('nettoyage', 'Nettoyage après sinistre (incendie/dégât des eaux)', 'forfait', 500, 3000, 0.60),
  ('nettoyage', 'Entretien régulier bureaux (mensuel)', 'forfait', 200, 600, 0.80);

-- -------------------------------------------------------
-- 42. DÉMÉNAGEUR (10 prestations)
-- -------------------------------------------------------
INSERT INTO prestations_tarifs (metier, prestation, unite, prix_min, prix_max, fiabilite) VALUES
  ('demenageur', 'Déménagement studio (<30m³)', 'forfait', 400, 900, 0.75),
  ('demenageur', 'Déménagement T2 (30-40m³)', 'forfait', 700, 1500, 0.70),
  ('demenageur', 'Déménagement T3 (40-60m³)', 'forfait', 1000, 2500, 0.65),
  ('demenageur', 'Déménagement T4/maison (60-80m³)', 'forfait', 1500, 3500, 0.60),
  ('demenageur', 'Déménagement longue distance (>500km)', 'forfait', 2000, 5000, 0.55),
  ('demenageur', 'Monte-meuble (location)', 'heure', 100, 250, 0.80),
  ('demenageur', 'Emballage/déballage complet', 'forfait', 300, 800, 0.75),
  ('demenageur', 'Garde-meuble (par mois, 5m³)', 'forfait', 50, 150, 0.80),
  ('demenageur', 'Déménagement piano/objet lourd', 'forfait', 200, 600, 0.70),
  ('demenageur', 'Déménagement entreprise/bureau', 'forfait', 1500, 5000, 0.55);

-- -------------------------------------------------------
-- 43. INSTALLATEUR POÊLE (10 prestations)
-- -------------------------------------------------------
INSERT INTO prestations_tarifs (metier, prestation, unite, prix_min, prix_max, fiabilite) VALUES
  ('installateur-poele', 'Installation poêle à bois', 'forfait', 1000, 3000, 0.75),
  ('installateur-poele', 'Installation poêle à granulés', 'forfait', 2000, 5000, 0.70),
  ('installateur-poele', 'Installation poêle de masse', 'forfait', 5000, 15000, 0.55),
  ('installateur-poele', 'Installation insert cheminée', 'forfait', 1500, 4000, 0.70),
  ('installateur-poele', 'Création conduit fumée (tubage)', 'forfait', 1000, 3000, 0.70),
  ('installateur-poele', 'Raccordement poêle (conduit existant)', 'forfait', 300, 800, 0.80),
  ('installateur-poele', 'Entretien/nettoyage poêle à granulés', 'forfait', 100, 250, 0.85),
  ('installateur-poele', 'Réparation poêle (pièces + main d''oeuvre)', 'forfait', 150, 500, 0.70),
  ('installateur-poele', 'Installation poêle bouilleur (hydraulique)', 'forfait', 3000, 8000, 0.60),
  ('installateur-poele', 'Habillage/parement autour poêle', 'forfait', 300, 1000, 0.75);

-- -------------------------------------------------------
-- 44. INSTALLATEUR PHOTOVOLTAÏQUE (10 prestations)
-- -------------------------------------------------------
INSERT INTO prestations_tarifs (metier, prestation, unite, prix_min, prix_max, fiabilite) VALUES
  ('panneaux-solaires', 'Installation panneaux solaires 3 kWc', 'forfait', 7000, 12000, 0.70),
  ('panneaux-solaires', 'Installation panneaux solaires 6 kWc', 'forfait', 12000, 18000, 0.65),
  ('panneaux-solaires', 'Installation panneaux solaires 9 kWc', 'forfait', 16000, 25000, 0.60),
  ('panneaux-solaires', 'Installation micro-onduleurs', 'forfait', 500, 1500, 0.75),
  ('panneaux-solaires', 'Installation batterie stockage', 'forfait', 4000, 10000, 0.60),
  ('panneaux-solaires', 'Nettoyage panneaux solaires', 'forfait', 100, 250, 0.85),
  ('panneaux-solaires', 'Maintenance/contrôle annuel', 'forfait', 100, 250, 0.85),
  ('panneaux-solaires', 'Remplacement onduleur', 'forfait', 500, 1500, 0.75),
  ('panneaux-solaires', 'Dépannage installation existante', 'intervention', 100, 300, 0.75),
  ('panneaux-solaires', 'Carport solaire', 'forfait', 8000, 18000, 0.55);

-- -------------------------------------------------------
-- 45. ASCENSORISTE (10 prestations)
-- -------------------------------------------------------
INSERT INTO prestations_tarifs (metier, prestation, unite, prix_min, prix_max, fiabilite) VALUES
  ('ascensoriste', 'Installation ascenseur particulier (2 niveaux)', 'forfait', 15000, 30000, 0.50),
  ('ascensoriste', 'Installation monte-escalier droit', 'forfait', 3000, 6000, 0.70),
  ('ascensoriste', 'Installation monte-escalier tournant', 'forfait', 6000, 12000, 0.65),
  ('ascensoriste', 'Installation plateforme élévatrice PMR', 'forfait', 8000, 20000, 0.55),
  ('ascensoriste', 'Contrat entretien ascenseur (annuel)', 'forfait', 1500, 3500, 0.75),
  ('ascensoriste', 'Modernisation cabine ascenseur', 'forfait', 5000, 15000, 0.55),
  ('ascensoriste', 'Dépannage ascenseur', 'intervention', 150, 400, 0.80),
  ('ascensoriste', 'Remplacement portes palières', 'forfait', 2000, 5000, 0.65),
  ('ascensoriste', 'Mise aux normes ascenseur', 'forfait', 5000, 20000, 0.50),
  ('ascensoriste', 'Installation mini-ascenseur (gaine existante)', 'forfait', 10000, 25000, 0.50);

-- -------------------------------------------------------
-- 46. INSTALLATEUR DOMOTIQUE (lié au slug domoticien)
-- -------------------------------------------------------
-- Déjà couvert par le métier domoticien (section 17)
-- Ajout de prestations complémentaires axées "installation"

INSERT INTO prestations_tarifs (metier, prestation, unite, prix_min, prix_max, fiabilite) VALUES
  ('domoticien', 'Installation réseau KNX filaire', 'forfait', 5000, 15000, 0.55),
  ('domoticien', 'Installation réseau Zigbee/Z-Wave', 'forfait', 500, 2000, 0.75),
  ('domoticien', 'Installation store connecté motorisé', 'forfait', 300, 800, 0.80),
  ('domoticien', 'Intégration système audio multiroom', 'forfait', 1000, 5000, 0.60),
  ('domoticien', 'Installation détecteurs connectés (fumée/eau/mouvement)', 'forfait', 100, 300, 0.85);

-- -------------------------------------------------------
-- MÉTIERS SUPPLÉMENTAIRES depuis trade-content.ts
-- (slugs spécifiques au fichier)
-- -------------------------------------------------------

-- SOLIER (poseur revêtement sol souple)
INSERT INTO prestations_tarifs (metier, prestation, unite, prix_min, prix_max, fiabilite) VALUES
  ('solier', 'Pose lino/vinyle en rouleau', 'm²', 15, 30, 0.85),
  ('solier', 'Pose dalles PVC clipsables', 'm²', 15, 35, 0.85),
  ('solier', 'Pose moquette', 'm²', 10, 25, 0.85),
  ('solier', 'Pose sol vinyle lames (LVT)', 'm²', 20, 45, 0.80),
  ('solier', 'Ragréage sol avant pose', 'm²', 10, 25, 0.85),
  ('solier', 'Dépose ancien revêtement', 'm²', 5, 15, 0.85),
  ('solier', 'Pose sol PVC soudé (professionnel)', 'm²', 25, 50, 0.75),
  ('solier', 'Pose jonc de mer/sisal', 'm²', 20, 40, 0.80);

-- POMPE À CHALEUR (installateur PAC)
INSERT INTO prestations_tarifs (metier, prestation, unite, prix_min, prix_max, fiabilite) VALUES
  ('pompe-a-chaleur', 'Installation PAC air/eau', 'forfait', 8000, 16000, 0.65),
  ('pompe-a-chaleur', 'Installation PAC air/air (monosplit)', 'forfait', 1200, 2500, 0.80),
  ('pompe-a-chaleur', 'Installation PAC air/air (multisplit)', 'forfait', 3000, 7000, 0.70),
  ('pompe-a-chaleur', 'Installation PAC géothermique', 'forfait', 15000, 30000, 0.50),
  ('pompe-a-chaleur', 'Installation ballon thermodynamique', 'forfait', 2500, 4500, 0.75),
  ('pompe-a-chaleur', 'Entretien annuel PAC', 'forfait', 150, 300, 0.85),
  ('pompe-a-chaleur', 'Dépannage/réparation PAC', 'intervention', 150, 500, 0.70),
  ('pompe-a-chaleur', 'Remplacement compresseur PAC', 'forfait', 1500, 3500, 0.65),
  ('pompe-a-chaleur', 'Installation plancher chauffant hydraulique', 'm²', 50, 100, 0.70),
  ('pompe-a-chaleur', 'Raccordement PAC sur circuit existant', 'forfait', 500, 1500, 0.75);

-- RÉNOVATION ÉNERGÉTIQUE
INSERT INTO prestations_tarifs (metier, prestation, unite, prix_min, prix_max, fiabilite) VALUES
  ('renovation-energetique', 'Audit énergétique complet', 'forfait', 500, 1200, 0.75),
  ('renovation-energetique', 'Rénovation globale maison (bouquet travaux)', 'forfait', 20000, 60000, 0.45),
  ('renovation-energetique', 'Isolation combles + ventilation', 'forfait', 3000, 8000, 0.70),
  ('renovation-energetique', 'Remplacement fenêtres (maison 10 fenêtres)', 'forfait', 5000, 15000, 0.60),
  ('renovation-energetique', 'Changement système chauffage complet', 'forfait', 8000, 20000, 0.55),
  ('renovation-energetique', 'Accompagnement aides (MaPrimeRénov, CEE)', 'forfait', 200, 500, 0.80),
  ('renovation-energetique', 'ITE maison individuelle (~100m²)', 'forfait', 10000, 25000, 0.55),
  ('renovation-energetique', 'Installation ventilation double flux', 'forfait', 2000, 5000, 0.70);

-- BORNE DE RECHARGE VE
INSERT INTO prestations_tarifs (metier, prestation, unite, prix_min, prix_max, fiabilite) VALUES
  ('borne-recharge', 'Installation borne 7 kW (maison)', 'forfait', 1000, 2000, 0.80),
  ('borne-recharge', 'Installation borne 11 kW (maison)', 'forfait', 1200, 2500, 0.80),
  ('borne-recharge', 'Installation borne 22 kW (copropriété)', 'forfait', 1500, 3500, 0.70),
  ('borne-recharge', 'Infrastructure collective copropriété', 'forfait', 3000, 10000, 0.55),
  ('borne-recharge', 'Mise aux normes tableau électrique', 'forfait', 300, 800, 0.80),
  ('borne-recharge', 'Tirage de câble (distance >10m)', 'mètre linéaire', 15, 40, 0.80),
  ('borne-recharge', 'Installation prise renforcée Green''Up', 'forfait', 300, 600, 0.85),
  ('borne-recharge', 'Maintenance/dépannage borne', 'intervention', 80, 200, 0.80);

-- JARDINIER (slug différent de paysagiste dans trade-content.ts)
INSERT INTO prestations_tarifs (metier, prestation, unite, prix_min, prix_max, fiabilite) VALUES
  ('jardinier', 'Tonte pelouse régulière', 'forfait', 25, 50, 0.90),
  ('jardinier', 'Taille haie', 'mètre linéaire', 4, 12, 0.85),
  ('jardinier', 'Désherbage massifs', 'forfait', 30, 80, 0.85),
  ('jardinier', 'Taille arbustes/rosiers', 'forfait', 30, 80, 0.85),
  ('jardinier', 'Ramassage feuilles mortes', 'forfait', 30, 80, 0.85),
  ('jardinier', 'Scarification pelouse', 'forfait', 50, 120, 0.85),
  ('jardinier', 'Plantation arbres/arbustes', 'forfait', 30, 100, 0.80),
  ('jardinier', 'Entretien jardin (forfait mensuel)', 'forfait', 100, 300, 0.80),
  ('jardinier', 'Élagage petit arbre (<5m)', 'forfait', 100, 300, 0.75),
  ('jardinier', 'Évacuation déchets verts', 'forfait', 50, 150, 0.85);

-- ============================================================
-- FIN DE LA MIGRATION 352
-- ============================================================
