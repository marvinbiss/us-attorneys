-- =============================================================================
-- Migration 354 : Correction prix prestations_tarifs — Alignement marché 2025-2026
-- 2026-03-11
-- =============================================================================
-- Sources : prix-pose.com, travaux.com, habitatpresto.com, quelleenergie.fr,
--           hellowatt.fr, mesdepanneurs.fr, ootravaux.fr, renovationettravaux.fr,
--           solution-nuisible.fr, allodemenageur.fr, guide-piscine.fr, etc.
-- =============================================================================

-- ============================================================================
-- 1. PLOMBIER — 6 corrections
-- ============================================================================
UPDATE prestations_tarifs SET prix_min=450, prix_max=1200
  WHERE metier='plombier' AND prestation='Installation chauffe-eau électrique';

UPDATE prestations_tarifs SET prix_max=6000
  WHERE metier='plombier' AND prestation='Installation douche italienne';

UPDATE prestations_tarifs SET prix_min=700, prix_max=2000
  WHERE metier='plombier' AND prestation='Rénovation salle de bain';

UPDATE prestations_tarifs SET prix_min=300, prix_max=550
  WHERE metier='plombier' AND prestation='Pose WC classique';

UPDATE prestations_tarifs SET prix_min=500
  WHERE metier='plombier' AND prestation='Pose WC suspendu';

UPDATE prestations_tarifs SET prix_min=450, prix_max=1300
  WHERE metier='plombier' AND prestation='Remplacement ballon eau chaude';

-- ============================================================================
-- 2. ÉLECTRICIEN — 5 corrections
-- ============================================================================
UPDATE prestations_tarifs SET prix_max=2000
  WHERE metier='electricien' AND prestation='Remplacement tableau électrique';

UPDATE prestations_tarifs SET prix_max=8000
  WHERE metier='electricien' AND prestation='Mise aux normes appartement';

UPDATE prestations_tarifs SET prix_min=80, prix_max=200
  WHERE metier='electricien' AND prestation='Installation spot/luminaire';

UPDATE prestations_tarifs SET prix_min=700, prix_max=1500
  WHERE metier='electricien' AND prestation='Installation VMC simple flux';

UPDATE prestations_tarifs SET prix_min=3000, prix_max=6000
  WHERE metier='electricien' AND prestation='Installation VMC double flux';

-- ============================================================================
-- 3. SERRURIER — 8 corrections
-- ============================================================================
UPDATE prestations_tarifs SET prix_min=90, prix_max=180
  WHERE metier='serrurier' AND prestation='Ouverture porte claquée';

UPDATE prestations_tarifs SET prix_max=350
  WHERE metier='serrurier' AND prestation='Remplacement serrure standard';

UPDATE prestations_tarifs SET prix_min=350, prix_max=800
  WHERE metier='serrurier' AND prestation='Remplacement serrure 3 points';

UPDATE prestations_tarifs SET prix_max=5000
  WHERE metier='serrurier' AND prestation='Installation porte blindée';

UPDATE prestations_tarifs SET prix_max=300
  WHERE metier='serrurier' AND prestation='Remplacement cylindre/barillet';

UPDATE prestations_tarifs SET prix_max=50
  WHERE metier='serrurier' AND prestation='Reproduction de clé';

UPDATE prestations_tarifs SET prix_min=400, prix_max=900
  WHERE metier='serrurier' AND prestation='Installation digicode';

UPDATE prestations_tarifs SET prix_min=800, prix_max=1500
  WHERE metier='serrurier' AND prestation='Blindage porte existante';

-- ============================================================================
-- 4. CHAUFFAGISTE — 4 corrections
-- ============================================================================
UPDATE prestations_tarifs SET prix_min=3000, prix_max=8000
  WHERE metier='chauffagiste' AND prestation='Remplacement chaudière gaz condensation';

UPDATE prestations_tarifs SET prix_max=18000
  WHERE metier='chauffagiste' AND prestation='Installation pompe à chaleur air/eau';

UPDATE prestations_tarifs SET prix_min=2000, prix_max=8000
  WHERE metier='chauffagiste' AND prestation='Installation pompe à chaleur air/air';

UPDATE prestations_tarifs SET prix_min=60, prix_max=120
  WHERE metier='chauffagiste' AND prestation='Installation plancher chauffant';

-- ============================================================================
-- 5. COUVREUR — 3 corrections
-- ============================================================================
UPDATE prestations_tarifs SET prix_min=300, prix_max=1500
  WHERE metier='couvreur' AND prestation='Réparation fuite toiture';

UPDATE prestations_tarifs SET prix_min=50, prix_max=120
  WHERE metier='couvreur' AND prestation='Pose gouttières';

UPDATE prestations_tarifs SET prix_max=120
  WHERE metier='couvreur' AND prestation='Remplacement faîtage';

-- ============================================================================
-- 6. CARRELEUR — 1 correction
-- ============================================================================
UPDATE prestations_tarifs SET prix_max=100
  WHERE metier='carreleur' AND prestation='Pose carrelage terrasse extérieure';

-- ============================================================================
-- 7. MENUISIER — 2 corrections
-- ============================================================================
UPDATE prestations_tarifs SET prix_min=100, prix_max=350
  WHERE metier='menuisier' AND prestation='Pose porte intérieure';

UPDATE prestations_tarifs SET prix_min=90, prix_max=200
  WHERE metier='menuisier' AND prestation='Pose terrasse bois';

-- ============================================================================
-- 8. MAÇON — 1 correction
-- ============================================================================
UPDATE prestations_tarifs SET prix_max=120
  WHERE metier='macon' AND prestation='Rejointoiement pierre';
-- Note: ravalement is under facadier, not macon

-- ============================================================================
-- 9. PLAQUISTE — 6 corrections
-- ============================================================================
UPDATE prestations_tarifs SET prix_min=25, prix_max=45
  WHERE metier='platrier' AND prestation='Pose placo BA13 standard';

UPDATE prestations_tarifs SET prix_min=30, prix_max=55
  WHERE metier='platrier' AND prestation='Pose placo hydrofuge (salle de bain)';

UPDATE prestations_tarifs SET prix_min=35, prix_max=60
  WHERE metier='platrier' AND prestation='Pose placo phonique';

UPDATE prestations_tarifs SET prix_min=50, prix_max=90
  WHERE metier='platrier' AND prestation='Faux plafond avec spots intégrés';

UPDATE prestations_tarifs SET prix_min=40, prix_max=75
  WHERE metier='platrier' AND prestation='Cloison placo avec isolation';

UPDATE prestations_tarifs SET prix_min=40, prix_max=70
  WHERE metier='platrier' AND prestation='Doublage mur avec isolation';

-- ============================================================================
-- 10. CHARPENTIER — 7 corrections
-- ============================================================================
UPDATE prestations_tarifs SET prix_min=90, prix_max=200
  WHERE metier='charpentier' AND prestation='Charpente traditionnelle neuve';

UPDATE prestations_tarifs SET prix_min=70, prix_max=120
  WHERE metier='charpentier' AND prestation='Charpente fermettes industrielles';

UPDATE prestations_tarifs SET prix_min=25
  WHERE metier='charpentier' AND prestation='Traitement charpente (injection)';

UPDATE prestations_tarifs SET prix_min=1100, prix_max=2500
  WHERE metier='charpentier' AND prestation='Surélévation toiture';

UPDATE prestations_tarifs SET prix_min=350, prix_max=600
  WHERE metier='charpentier' AND prestation='Aménagement combles (structure)';

UPDATE prestations_tarifs SET prix_min=80, prix_max=200
  WHERE metier='charpentier' AND prestation='Pose poutre apparente décorative';

UPDATE prestations_tarifs SET prix_max=400
  WHERE metier='charpentier' AND prestation='Construction ossature bois';

-- ============================================================================
-- 11. VITRIER — 5 corrections
-- ============================================================================
UPDATE prestations_tarifs SET prix_min=100, prix_max=300
  WHERE metier='vitrier' AND prestation='Remplacement simple vitrage';

UPDATE prestations_tarifs SET prix_min=180, prix_max=420
  WHERE metier='vitrier' AND prestation='Remplacement double vitrage';

UPDATE prestations_tarifs SET prix_min=150, prix_max=400
  WHERE metier='vitrier' AND prestation='Pose vitrine commerce';

UPDATE prestations_tarifs SET prix_min=150, prix_max=350
  WHERE metier='vitrier' AND prestation='Dépannage urgence vitrage cassé';

UPDATE prestations_tarifs SET prix_min=400, prix_max=1000
  WHERE metier='vitrier' AND prestation='Pose paroi de douche en verre';

-- ============================================================================
-- 12. CLIMATICIEN — 7 corrections
-- ============================================================================
UPDATE prestations_tarifs SET prix_min=1500, prix_max=3000
  WHERE metier='climaticien' AND prestation='Installation climatisation monosplit';

UPDATE prestations_tarifs SET prix_min=3000, prix_max=6000
  WHERE metier='climaticien' AND prestation='Installation climatisation multisplit (2 unités)';

UPDATE prestations_tarifs SET prix_min=5000, prix_max=9000
  WHERE metier='climaticien' AND prestation='Installation climatisation multisplit (3 unités)';

UPDATE prestations_tarifs SET prix_max=300
  WHERE metier='climaticien' AND prestation='Entretien climatisation annuel';

UPDATE prestations_tarifs SET prix_min=250, prix_max=500
  WHERE metier='climaticien' AND prestation='Recharge gaz réfrigérant';

UPDATE prestations_tarifs SET prix_min=6000, prix_max=15000
  WHERE metier='climaticien' AND prestation='Installation climatisation gainable';

UPDATE prestations_tarifs SET prix_min=2500, prix_max=6000
  WHERE metier='climaticien' AND prestation='Installation climatisation cassette';

-- ============================================================================
-- 13. TERRASSIER — 5 corrections
-- ============================================================================
UPDATE prestations_tarifs SET prix_min=10, prix_max=25
  WHERE metier='terrassier' AND prestation='Terrassement terrain plat';

UPDATE prestations_tarifs SET prix_min=12, prix_max=30
  WHERE metier='terrassier' AND prestation='Décaissement terrain';

UPDATE prestations_tarifs SET prix_min=100, prix_max=250
  WHERE metier='terrassier' AND prestation='Enrochement/talus';

UPDATE prestations_tarifs SET prix_min=5000, prix_max=15000
  WHERE metier='terrassier' AND prestation='Viabilisation terrain';

UPDATE prestations_tarifs SET prix_min=25, prix_max=70
  WHERE metier='terrassier' AND prestation='Création allée/chemin d''accès';

-- ============================================================================
-- 14. FAÇADIER — 6 corrections
-- ============================================================================
UPDATE prestations_tarifs SET prix_min=35, prix_max=80
  WHERE metier='facadier' AND prestation='Ravalement façade (nettoyage + peinture)';

UPDATE prestations_tarifs SET prix_min=45, prix_max=80
  WHERE metier='facadier' AND prestation='Enduit façade monocouche';

UPDATE prestations_tarifs SET prix_min=50, prix_max=100
  WHERE metier='facadier' AND prestation='Enduit façade traditionnel (3 couches)';

UPDATE prestations_tarifs SET prix_min=130, prix_max=220
  WHERE metier='facadier' AND prestation='ITE (isolation thermique extérieure)';

UPDATE prestations_tarifs SET prix_min=40, prix_max=85
  WHERE metier='facadier' AND prestation='Crépis décoratif';

UPDATE prestations_tarifs SET prix_min=75, prix_max=180
  WHERE metier='facadier' AND prestation='Pose bardage extérieur';

-- ============================================================================
-- 15. ÉTANCHÉISTE — 1 correction
-- ============================================================================
UPDATE prestations_tarifs SET prix_min=80, prix_max=130
  WHERE metier='etancheiste' AND prestation='Membrane EPDM toiture plate';

-- ============================================================================
-- 16. DOMOTICIEN — 4 corrections
-- ============================================================================
UPDATE prestations_tarifs SET prix_max=15000
  WHERE metier='domoticien' AND prestation='Installation système domotique complet';

UPDATE prestations_tarifs SET prix_min=150, prix_max=450
  WHERE metier='domoticien' AND prestation='Installation éclairage connecté (pièce)';

UPDATE prestations_tarifs SET prix_min=150, prix_max=400
  WHERE metier='domoticien' AND prestation='Installation thermostat intelligent';

UPDATE prestations_tarifs SET prix_min=8000, prix_max=20000
  WHERE metier='domoticien' AND prestation='Installation réseau KNX filaire';

-- ============================================================================
-- 17. MÉTALLIER/SOUDEUR — 4 corrections
-- ============================================================================
UPDATE prestations_tarifs SET prix_max=450
  WHERE metier='metallier' AND prestation='Fabrication garde-corps métallique';

UPDATE prestations_tarifs SET prix_max=5000
  WHERE metier='metallier' AND prestation='Fabrication portail sur mesure';

UPDATE prestations_tarifs SET prix_max=10000
  WHERE metier='metallier' AND prestation='Fabrication escalier métallique';

UPDATE prestations_tarifs SET prix_max=8000
  WHERE metier='metallier' AND prestation='Fabrication pergola métallique';

-- ============================================================================
-- 18. RAMONEUR/FUMISTE — 5 corrections
-- ============================================================================
UPDATE prestations_tarifs SET prix_min=80, prix_max=150
  WHERE metier='ramoneur' AND prestation='Ramonage chaudière fioul';

UPDATE prestations_tarifs SET prix_max=700
  WHERE metier='ramoneur' AND prestation='Débistrage conduit (mécanique)';

UPDATE prestations_tarifs SET prix_max=150
  WHERE metier='ramoneur' AND prestation='Tubage conduit cheminée';

UPDATE prestations_tarifs SET prix_min=1500, prix_max=5000
  WHERE metier='ramoneur' AND prestation='Installation insert cheminée';

UPDATE prestations_tarifs SET prix_min=1500, prix_max=5000
  WHERE metier='ramoneur' AND prestation='Installation poêle à bois';

-- Installateur-poêle also has duplicate entries — correct those too
UPDATE prestations_tarifs SET prix_min=1500, prix_max=5000
  WHERE metier='installateur-poele' AND prestation='Installation poêle à bois';

UPDATE prestations_tarifs SET prix_min=3000, prix_max=7000
  WHERE metier='ramoneur' AND prestation='Installation poêle à granulés';

UPDATE prestations_tarifs SET prix_min=3000, prix_max=7000
  WHERE metier='installateur-poele' AND prestation='Installation poêle à granulés';

-- ============================================================================
-- 19. PISCINISTE — 4 corrections
-- ============================================================================
UPDATE prestations_tarifs SET prix_min=15000, prix_max=27000
  WHERE metier='pisciniste' AND prestation='Construction piscine coque 8x4m';

UPDATE prestations_tarifs SET prix_min=18000
  WHERE metier='pisciniste' AND prestation='Construction piscine béton 8x4m';

UPDATE prestations_tarifs SET prix_min=3500, prix_max=10000
  WHERE metier='pisciniste' AND prestation='Installation volet roulant piscine';

UPDATE prestations_tarifs SET prix_min=25000, prix_max=60000
  WHERE metier='pisciniste' AND prestation='Construction piscine naturelle';

-- ============================================================================
-- 20. JARDINIER-PAYSAGISTE — 6 corrections
-- ============================================================================
UPDATE prestations_tarifs SET prix_min=40, prix_max=80
  WHERE metier='paysagiste' AND prestation='Tonte pelouse (jardin ~200m²)';

UPDATE prestations_tarifs SET prix_min=350
  WHERE metier='paysagiste' AND prestation='Abattage arbre';

UPDATE prestations_tarifs SET prix_max=10
  WHERE metier='paysagiste' AND prestation='Engazonnement (semis)';

UPDATE prestations_tarifs SET prix_min=90, prix_max=200
  WHERE metier='paysagiste' AND prestation='Création terrasse bois';

UPDATE prestations_tarifs SET prix_min=150, prix_max=600
  WHERE metier='paysagiste' AND prestation='Dessouchage';

UPDATE prestations_tarifs SET prix_min=800
  WHERE metier='paysagiste' AND prestation='Entretien annuel jardin (forfait)';

-- ============================================================================
-- 21. ÉBÉNISTE — 2 corrections
-- ============================================================================
UPDATE prestations_tarifs SET prix_max=5500
  WHERE metier='ebeniste' AND prestation='Fabrication bibliothèque sur mesure';

UPDATE prestations_tarifs SET prix_max=450
  WHERE metier='ebeniste' AND prestation='Fabrication plan de travail bois massif';

-- ============================================================================
-- 22. TAPISSIER — 2 corrections
-- ============================================================================
UPDATE prestations_tarifs SET prix_max=2200
  WHERE metier='decorateur' AND prestation='Réfection canapé 3 places';

UPDATE prestations_tarifs SET prix_min=50
  WHERE metier='decorateur' AND prestation='Réfection assise chaise';

-- ============================================================================
-- 23. CUISINISTE — 5 corrections
-- ============================================================================
UPDATE prestations_tarifs SET prix_min=2500
  WHERE metier='cuisiniste' AND prestation='Cuisine équipée entrée de gamme (pose incluse)';

UPDATE prestations_tarifs SET prix_min=5000
  WHERE metier='cuisiniste' AND prestation='Cuisine équipée milieu de gamme (pose incluse)';

UPDATE prestations_tarifs SET prix_max=25000
  WHERE metier='cuisiniste' AND prestation='Cuisine équipée haut de gamme (pose incluse)';

UPDATE prestations_tarifs SET prix_min=800, prix_max=3500
  WHERE metier='cuisiniste' AND prestation='Pose seule cuisine (sans meubles)';

UPDATE prestations_tarifs SET prix_max=5000
  WHERE metier='cuisiniste' AND prestation='Remplacement façades (relooking)';

-- ============================================================================
-- 24. SALLE DE BAIN — 5 corrections
-- ============================================================================
UPDATE prestations_tarifs SET prix_min=3500
  WHERE metier='salle-de-bain' AND prestation='Rénovation complète salle de bain (3-5m²)';

UPDATE prestations_tarifs SET prix_min=5500
  WHERE metier='salle-de-bain' AND prestation='Rénovation complète salle de bain (5-8m²)';

UPDATE prestations_tarifs SET prix_min=2000
  WHERE metier='salle-de-bain' AND prestation='Installation douche italienne';

UPDATE prestations_tarifs SET prix_min=1500, prix_max=5000
  WHERE metier='salle-de-bain' AND prestation='Pose baignoire balnéo';

UPDATE prestations_tarifs SET prix_max=600
  WHERE metier='salle-de-bain' AND prestation='Installation sèche-serviettes';

-- ============================================================================
-- 25. POSEUR DE PARQUET — 4 corrections
-- ============================================================================
UPDATE prestations_tarifs SET prix_min=18
  WHERE metier='poseur-de-parquet' AND prestation='Pose parquet flottant stratifié';

UPDATE prestations_tarifs SET prix_max=120
  WHERE metier='poseur-de-parquet' AND prestation='Pose parquet massif cloué';

UPDATE prestations_tarifs SET prix_min=25, prix_max=55
  WHERE metier='poseur-de-parquet' AND prestation='Ponçage/vitrification parquet';

UPDATE prestations_tarifs SET prix_min=25
  WHERE metier='poseur-de-parquet' AND prestation='Ponçage/huilage parquet';

-- ============================================================================
-- 26. DÉSINSECTISEUR — 2 corrections
-- ============================================================================
UPDATE prestations_tarifs SET prix_min=250
  WHERE metier='desinsectisation' AND prestation='Traitement punaises de lit (appartement)';

UPDATE prestations_tarifs SET prix_min=1500, prix_max=5000
  WHERE metier='desinsectisation' AND prestation='Traitement termites (diagnostic + traitement)';

-- ============================================================================
-- 27. DÉRATISEUR — 3 corrections
-- ============================================================================
UPDATE prestations_tarifs SET prix_min=150, prix_max=400
  WHERE metier='deratisation' AND prestation='Dératisation maison individuelle';

UPDATE prestations_tarifs SET prix_min=300, prix_max=800
  WHERE metier='deratisation' AND prestation='Dératisation local commercial';

UPDATE prestations_tarifs SET prix_min=200, prix_max=500
  WHERE metier='deratisation' AND prestation='Dératisation urgente (restaurant/commerce)';

-- ============================================================================
-- 28. DÉMÉNAGEUR — 4 corrections
-- ============================================================================
UPDATE prestations_tarifs SET prix_max=800
  WHERE metier='demenageur' AND prestation='Déménagement studio (<30m³)';

UPDATE prestations_tarifs SET prix_max=1300
  WHERE metier='demenageur' AND prestation='Déménagement T2 (30-40m³)';

UPDATE prestations_tarifs SET prix_max=2000
  WHERE metier='demenageur' AND prestation='Déménagement T3 (40-60m³)';

UPDATE prestations_tarifs SET prix_min=150, prix_max=300
  WHERE metier='demenageur' AND prestation='Monte-meuble (location)';

-- ============================================================================
-- 29. PHOTOVOLTAÏQUE — 4 corrections
-- ============================================================================
UPDATE prestations_tarifs SET prix_min=10000, prix_max=20000
  WHERE metier='panneaux-solaires' AND prestation='Installation panneaux solaires 6 kWc';

UPDATE prestations_tarifs SET prix_min=15000, prix_max=28000
  WHERE metier='panneaux-solaires' AND prestation='Installation panneaux solaires 9 kWc';

UPDATE prestations_tarifs SET prix_min=3000, prix_max=12000
  WHERE metier='panneaux-solaires' AND prestation='Installation batterie stockage';

UPDATE prestations_tarifs SET prix_min=10000, prix_max=25000
  WHERE metier='panneaux-solaires' AND prestation='Carport solaire';

-- ============================================================================
-- 30. ALARME/SÉCURITÉ — 2 corrections
-- ============================================================================
UPDATE prestations_tarifs SET prix_min=600, prix_max=2500
  WHERE metier='alarme-securite' AND prestation='Installation alarme sans fil (maison)';

UPDATE prestations_tarifs SET prix_min=300, prix_max=600
  WHERE metier='alarme-securite' AND prestation='Télésurveillance (abonnement annuel)';

-- ============================================================================
-- NOUVELLES PRESTATIONS MANQUANTES (ajouts stratégiques)
-- ============================================================================

-- Plombier
INSERT INTO prestations_tarifs (metier, prestation, unite, prix_min, prix_max, fiabilite) VALUES
  ('plombier', 'Installation baignoire', 'forfait', 500, 2000, 0.70),
  ('plombier', 'Hydrocurage haute pression', 'forfait', 275, 400, 0.80),
  ('plombier', 'Robinet thermostatique douche', 'forfait', 150, 350, 0.80);

-- Électricien
INSERT INTO prestations_tarifs (metier, prestation, unite, prix_min, prix_max, fiabilite) VALUES
  ('electricien', 'Installation interphone/visiophone', 'forfait', 300, 1500, 0.70),
  ('electricien', 'Diagnostic électrique obligatoire (vente)', 'forfait', 100, 200, 0.85);

-- Serrurier
INSERT INTO prestations_tarifs (metier, prestation, unite, prix_min, prix_max, fiabilite) VALUES
  ('serrurier', 'Ouverture porte fermée à clé (sans casse)', 'intervention', 150, 300, 0.80),
  ('serrurier', 'Changement serrure 5 points', 'forfait', 500, 1200, 0.70);

-- Chauffagiste
INSERT INTO prestations_tarifs (metier, prestation, unite, prix_min, prix_max, fiabilite) VALUES
  ('chauffagiste', 'Entretien pompe à chaleur (annuel)', 'forfait', 150, 350, 0.85),
  ('chauffagiste', 'Robinet thermostatique radiateur', 'forfait', 50, 150, 0.85);

-- Couvreur
INSERT INTO prestations_tarifs (metier, prestation, unite, prix_min, prix_max, fiabilite) VALUES
  ('couvreur', 'Pose zinguerie (solins/noues)', 'mètre linéaire', 40, 100, 0.75);

-- Charpentier
INSERT INTO prestations_tarifs (metier, prestation, unite, prix_min, prix_max, fiabilite) VALUES
  ('charpentier', 'Charpente métallique', 'm²', 100, 250, 0.65);

-- Climaticien
INSERT INTO prestations_tarifs (metier, prestation, unite, prix_min, prix_max, fiabilite) VALUES
  ('climaticien', 'Désinfection/nettoyage unités intérieures', 'forfait', 80, 150, 0.85);

-- Menuisier
INSERT INTO prestations_tarifs (metier, prestation, unite, prix_min, prix_max, fiabilite) VALUES
  ('menuisier', 'Pose volets roulants électriques', 'forfait', 400, 800, 0.80);

-- Pisciniste
INSERT INTO prestations_tarifs (metier, prestation, unite, prix_min, prix_max, fiabilite) VALUES
  ('pisciniste', 'Abri de piscine', 'forfait', 5000, 30000, 0.50),
  ('pisciniste', 'Installation électrolyseur au sel', 'forfait', 1000, 3000, 0.70);

-- Paysagiste
INSERT INTO prestations_tarifs (metier, prestation, unite, prix_min, prix_max, fiabilite) VALUES
  ('paysagiste', 'Pose gazon synthétique', 'm²', 50, 130, 0.75);

-- Poseur de parquet
INSERT INTO prestations_tarifs (metier, prestation, unite, prix_min, prix_max, fiabilite) VALUES
  ('poseur-de-parquet', 'Pose parquet point de Hongrie', 'm²', 60, 150, 0.65),
  ('poseur-de-parquet', 'Pose parquet bâton rompu', 'm²', 50, 120, 0.70);

-- Diagnostiqueur
INSERT INTO prestations_tarifs (metier, prestation, unite, prix_min, prix_max, fiabilite) VALUES
  ('diagnostiqueur', 'Diagnostic assainissement', 'forfait', 100, 200, 0.85),
  ('diagnostiqueur', 'Diagnostic ERP (état des risques)', 'forfait', 20, 50, 0.90);

-- Désinsectiseur
INSERT INTO prestations_tarifs (metier, prestation, unite, prix_min, prix_max, fiabilite) VALUES
  ('desinsectisation', 'Traitement punaises de lit (traitement thermique)', 'forfait', 500, 1500, 0.65);

-- ============================================================================
-- FIN MIGRATION 354
-- ============================================================================
