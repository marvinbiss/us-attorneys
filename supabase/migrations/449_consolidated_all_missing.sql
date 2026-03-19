-- ============================================================================
-- Migration 449: CONSOLIDATED ALL MISSING (from migrations 400-445)
-- Generated: 2026-03-19
-- Purpose: Single idempotent migration that creates ALL tables, columns,
--          indexes, functions, triggers, and RLS policies from 400-445.
-- Excludes: migration 416 (legacy providers table), anything referencing
--           providers, artisans, communes, devis_requests, quotes, services, departements
-- Already applied: 446, 447, 448 (not included)
--
-- SAFE TO RUN MULTIPLE TIMES: all statements are idempotent.
-- ============================================================================

-- Helper function used by RLS policies (referenced in 6+ policies below)
CREATE OR REPLACE FUNCTION is_admin() RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND is_admin = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Required extension for booking overlap constraint (migration 415)
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- ============================================================================
-- FROM MIGRATION 400: US ATTORNEYS SCHEMA — Core Tables
-- ============================================================================

-- --------------------------------------------------------------------------
-- 400: specialties table
-- --------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS specialties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  icon TEXT,
  category TEXT NOT NULL DEFAULT 'general',
  is_active BOOLEAN NOT NULL DEFAULT true,
  parent_id UUID REFERENCES specialties(id),
  sort_order INTEGER DEFAULT 0,
  meta_title TEXT,
  meta_description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_specialties_slug ON specialties(slug);
CREATE INDEX IF NOT EXISTS idx_specialties_category ON specialties(category) WHERE is_active = true;

-- Seed: 75 practice areas
INSERT INTO specialties (name, slug, category) VALUES
  ('Criminal Defense', 'criminal-defense', 'criminal'),
  ('DUI & DWI', 'dui-dwi', 'criminal'),
  ('Drug Crimes', 'drug-crimes', 'criminal'),
  ('White Collar Crime', 'white-collar-crime', 'criminal'),
  ('Federal Crimes', 'federal-crimes', 'criminal'),
  ('Juvenile Crimes', 'juvenile-crimes', 'criminal'),
  ('Sex Crimes', 'sex-crimes', 'criminal'),
  ('Theft & Robbery', 'theft-robbery', 'criminal'),
  ('Violent Crimes', 'violent-crimes', 'criminal'),
  ('Traffic Violations', 'traffic-violations', 'criminal'),
  ('Personal Injury', 'personal-injury', 'injury'),
  ('Car Accidents', 'car-accidents', 'injury'),
  ('Truck Accidents', 'truck-accidents', 'injury'),
  ('Motorcycle Accidents', 'motorcycle-accidents', 'injury'),
  ('Slip & Fall', 'slip-and-fall', 'injury'),
  ('Medical Malpractice', 'medical-malpractice', 'injury'),
  ('Wrongful Death', 'wrongful-death', 'injury'),
  ('Product Liability', 'product-liability', 'injury'),
  ('Workers Compensation', 'workers-compensation', 'injury'),
  ('Nursing Home Abuse', 'nursing-home-abuse', 'injury'),
  ('Divorce', 'divorce', 'family'),
  ('Child Custody', 'child-custody', 'family'),
  ('Child Support', 'child-support', 'family'),
  ('Adoption', 'adoption', 'family'),
  ('Alimony & Spousal Support', 'alimony-spousal-support', 'family'),
  ('Domestic Violence', 'domestic-violence', 'family'),
  ('Prenuptial Agreements', 'prenuptial-agreements', 'family'),
  ('Paternity', 'paternity', 'family'),
  ('Business Law', 'business-law', 'business'),
  ('Corporate Law', 'corporate-law', 'business'),
  ('Mergers & Acquisitions', 'mergers-acquisitions', 'business'),
  ('Contract Law', 'contract-law', 'business'),
  ('Business Litigation', 'business-litigation', 'business'),
  ('Intellectual Property', 'intellectual-property', 'business'),
  ('Trademark', 'trademark', 'business'),
  ('Patent', 'patent', 'business'),
  ('Copyright', 'copyright', 'business'),
  ('Real Estate Law', 'real-estate-law', 'real-estate'),
  ('Landlord & Tenant', 'landlord-tenant', 'real-estate'),
  ('Foreclosure', 'foreclosure', 'real-estate'),
  ('Zoning & Land Use', 'zoning-land-use', 'real-estate'),
  ('Construction Law', 'construction-law', 'real-estate'),
  ('Immigration Law', 'immigration-law', 'immigration'),
  ('Green Cards', 'green-cards', 'immigration'),
  ('Visa Applications', 'visa-applications', 'immigration'),
  ('Deportation Defense', 'deportation-defense', 'immigration'),
  ('Asylum', 'asylum', 'immigration'),
  ('Citizenship & Naturalization', 'citizenship-naturalization', 'immigration'),
  ('Estate Planning', 'estate-planning', 'estate'),
  ('Wills & Trusts', 'wills-trusts', 'estate'),
  ('Probate', 'probate', 'estate'),
  ('Elder Law', 'elder-law', 'estate'),
  ('Guardianship', 'guardianship', 'estate'),
  ('Employment Law', 'employment-law', 'employment'),
  ('Wrongful Termination', 'wrongful-termination', 'employment'),
  ('Workplace Discrimination', 'workplace-discrimination', 'employment'),
  ('Sexual Harassment', 'sexual-harassment', 'employment'),
  ('Wage & Hour Claims', 'wage-hour-claims', 'employment'),
  ('Bankruptcy', 'bankruptcy', 'bankruptcy'),
  ('Chapter 7', 'chapter-7-bankruptcy', 'bankruptcy'),
  ('Chapter 13', 'chapter-13-bankruptcy', 'bankruptcy'),
  ('Debt Relief', 'debt-relief', 'bankruptcy'),
  ('Tax Law', 'tax-law', 'tax'),
  ('IRS Disputes', 'irs-disputes', 'tax'),
  ('Tax Planning', 'tax-planning', 'tax'),
  ('Entertainment Law', 'entertainment-law', 'other'),
  ('Environmental Law', 'environmental-law', 'other'),
  ('Health Care Law', 'health-care-law', 'other'),
  ('Insurance Law', 'insurance-law', 'other'),
  ('Civil Rights', 'civil-rights', 'other'),
  ('Consumer Protection', 'consumer-protection', 'other'),
  ('Social Security Disability', 'social-security-disability', 'other'),
  ('Veterans Benefits', 'veterans-benefits', 'other'),
  ('Class Action', 'class-action', 'other'),
  ('Appeals', 'appeals', 'other'),
  ('Mediation & Arbitration', 'mediation-arbitration', 'other')
ON CONFLICT (slug) DO NOTHING;

-- --------------------------------------------------------------------------
-- 400: states table
-- --------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS states (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  abbreviation CHAR(2) NOT NULL UNIQUE,
  fips_code CHAR(2) NOT NULL UNIQUE,
  population INTEGER,
  capital TEXT,
  region TEXT,
  timezone TEXT,
  bar_association_url TEXT,
  bar_lookup_api_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_states_abbreviation ON states(abbreviation);
CREATE INDEX IF NOT EXISTS idx_states_slug ON states(slug);

-- --------------------------------------------------------------------------
-- 400: counties table
-- --------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS counties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  state_id UUID NOT NULL REFERENCES states(id) ON DELETE CASCADE,
  fips_code CHAR(5) NOT NULL UNIQUE,
  population INTEGER,
  county_seat TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(slug, state_id)
);

CREATE INDEX IF NOT EXISTS idx_counties_state ON counties(state_id);
CREATE INDEX IF NOT EXISTS idx_counties_slug ON counties(slug, state_id);
CREATE INDEX IF NOT EXISTS idx_counties_fips ON counties(fips_code);

-- --------------------------------------------------------------------------
-- 400: locations_us table
-- --------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS locations_us (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  state_id UUID NOT NULL REFERENCES states(id) ON DELETE CASCADE,
  county_id UUID REFERENCES counties(id),
  population INTEGER,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  timezone TEXT,
  geo GEOGRAPHY(POINT, 4326),
  metro_area TEXT,
  is_major_city BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(slug, state_id)
);

CREATE INDEX IF NOT EXISTS idx_locations_us_state ON locations_us(state_id);
CREATE INDEX IF NOT EXISTS idx_locations_us_slug ON locations_us(slug, state_id);
CREATE INDEX IF NOT EXISTS idx_locations_us_geo ON locations_us USING GIST(geo);
CREATE INDEX IF NOT EXISTS idx_locations_us_population ON locations_us(population DESC NULLS LAST) WHERE is_major_city = true;
CREATE INDEX IF NOT EXISTS idx_locations_us_metro ON locations_us(metro_area) WHERE metro_area IS NOT NULL;

-- --------------------------------------------------------------------------
-- 400: zip_codes table
-- --------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS zip_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code CHAR(5) NOT NULL UNIQUE,
  location_id UUID REFERENCES locations_us(id) ON DELETE SET NULL,
  state_id UUID NOT NULL REFERENCES states(id) ON DELETE CASCADE,
  county_id UUID REFERENCES counties(id),
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  geo GEOGRAPHY(POINT, 4326),
  population INTEGER,
  area_type TEXT DEFAULT 'standard',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_zip_codes_code ON zip_codes(code);
CREATE INDEX IF NOT EXISTS idx_zip_codes_location ON zip_codes(location_id);
CREATE INDEX IF NOT EXISTS idx_zip_codes_state ON zip_codes(state_id);
CREATE INDEX IF NOT EXISTS idx_zip_codes_geo ON zip_codes USING GIST(geo);

-- --------------------------------------------------------------------------
-- 400: attorneys table
-- --------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS attorneys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  first_name TEXT,
  last_name TEXT,
  email TEXT,
  phone TEXT,
  phone_e164 TEXT,
  website TEXT,
  profile_image_url TEXT,
  bar_number TEXT,
  bar_state CHAR(2),
  bar_status TEXT DEFAULT 'active',
  bar_admission_date DATE,
  ein TEXT,
  law_school TEXT,
  graduation_year INTEGER,
  years_experience INTEGER,
  courtlistener_id TEXT UNIQUE,
  courtlistener_url TEXT,
  win_rate NUMERIC(5,2),
  settlement_avg NUMERIC(12,2),
  cases_handled INTEGER DEFAULT 0,
  rating_average NUMERIC(3,2) DEFAULT 0,
  review_count INTEGER DEFAULT 0,
  address_line1 TEXT,
  address_line2 TEXT,
  address_city TEXT,
  address_state CHAR(2),
  address_zip CHAR(5),
  address_county TEXT,
  state_id UUID REFERENCES states(id),
  location_id UUID REFERENCES locations_us(id),
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  geo GEOGRAPHY(POINT, 4326),
  primary_specialty_id UUID REFERENCES specialties(id),
  description TEXT,
  bio TEXT,
  tagline TEXT,
  languages TEXT[] DEFAULT ARRAY['English'],
  firm_name TEXT,
  firm_size TEXT,
  is_solo_practitioner BOOLEAN DEFAULT false,
  is_verified BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  noindex BOOLEAN NOT NULL DEFAULT false,
  verified_at TIMESTAMPTZ,
  consultation_fee NUMERIC(10,2),
  hourly_rate_min NUMERIC(10,2),
  hourly_rate_max NUMERIC(10,2),
  contingency_fee BOOLEAN DEFAULT false,
  contingency_percentage NUMERIC(5,2),
  pro_bono BOOLEAN DEFAULT false,
  user_id UUID REFERENCES auth.users(id),
  claimed_at TIMESTAMPTZ,
  claimed_by UUID REFERENCES auth.users(id),
  stable_id TEXT UNIQUE,
  search_vector TSVECTOR,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 400: Core attorney indexes
CREATE INDEX IF NOT EXISTS idx_attorneys_slug ON attorneys(slug);
CREATE INDEX IF NOT EXISTS idx_attorneys_user ON attorneys(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_attorneys_state ON attorneys(address_state);
CREATE INDEX IF NOT EXISTS idx_attorneys_city ON attorneys(address_city);
CREATE INDEX IF NOT EXISTS idx_attorneys_specialty ON attorneys(primary_specialty_id) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_attorneys_geo ON attorneys USING GIST(geo);
CREATE INDEX IF NOT EXISTS idx_attorneys_search ON attorneys USING GIN(search_vector);
CREATE INDEX IF NOT EXISTS idx_attorneys_rating ON attorneys(rating_average DESC, review_count DESC) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_attorneys_active ON attorneys(is_active, is_verified, noindex);
CREATE INDEX IF NOT EXISTS idx_attorneys_courtlistener ON attorneys(courtlistener_id) WHERE courtlistener_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_attorneys_stable_id ON attorneys(stable_id) WHERE stable_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_attorneys_sitemap ON attorneys(slug, address_city, address_state, primary_specialty_id, updated_at)
  WHERE is_active = true AND noindex = false;

-- 400: Full-text search trigger
CREATE OR REPLACE FUNCTION attorneys_search_vector_update() RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('english', COALESCE(NEW.name, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.firm_name, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(NEW.description, '')), 'C') ||
    setweight(to_tsvector('english', COALESCE(NEW.address_city, '')), 'C') ||
    setweight(to_tsvector('english', COALESCE(NEW.bio, '')), 'D');
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS attorneys_search_update ON attorneys;
CREATE TRIGGER attorneys_search_update
  BEFORE INSERT OR UPDATE ON attorneys
  FOR EACH ROW EXECUTE FUNCTION attorneys_search_vector_update();

-- --------------------------------------------------------------------------
-- 400: attorney_specialties table (many-to-many)
-- --------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS attorney_specialties (
  attorney_id UUID NOT NULL REFERENCES attorneys(id) ON DELETE CASCADE,
  specialty_id UUID NOT NULL REFERENCES specialties(id) ON DELETE CASCADE,
  is_primary BOOLEAN DEFAULT false,
  years_experience INTEGER,
  cases_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (attorney_id, specialty_id)
);

CREATE INDEX IF NOT EXISTS idx_attorney_specialties_specialty ON attorney_specialties(specialty_id);
CREATE INDEX IF NOT EXISTS idx_attorney_specialties_primary ON attorney_specialties(attorney_id) WHERE is_primary = true;

-- --------------------------------------------------------------------------
-- 400: courthouses table
-- --------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS courthouses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  court_type TEXT NOT NULL,
  address_line1 TEXT,
  address_city TEXT,
  address_state CHAR(2),
  address_zip CHAR(5),
  state_id UUID REFERENCES states(id),
  county_id UUID REFERENCES counties(id),
  location_id UUID REFERENCES locations_us(id),
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  geo GEOGRAPHY(POINT, 4326),
  phone TEXT,
  website TEXT,
  clerk_name TEXT,
  clerk_email TEXT,
  courtlistener_id TEXT UNIQUE,
  jurisdiction TEXT,
  pacer_court_id TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(slug, state_id)
);

CREATE INDEX IF NOT EXISTS idx_courthouses_state ON courthouses(state_id);
CREATE INDEX IF NOT EXISTS idx_courthouses_county ON courthouses(county_id);
CREATE INDEX IF NOT EXISTS idx_courthouses_type ON courthouses(court_type);
CREATE INDEX IF NOT EXISTS idx_courthouses_geo ON courthouses USING GIST(geo);
CREATE INDEX IF NOT EXISTS idx_courthouses_slug ON courthouses(slug, state_id);

-- --------------------------------------------------------------------------
-- 400: attorney_courthouses table
-- --------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS attorney_courthouses (
  attorney_id UUID NOT NULL REFERENCES attorneys(id) ON DELETE CASCADE,
  courthouse_id UUID NOT NULL REFERENCES courthouses(id) ON DELETE CASCADE,
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (attorney_id, courthouse_id)
);

CREATE INDEX IF NOT EXISTS idx_attorney_courthouses_court ON attorney_courthouses(courthouse_id);

-- --------------------------------------------------------------------------
-- 400: attorney_claims table
-- --------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS attorney_claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attorney_id UUID NOT NULL REFERENCES attorneys(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  bar_number_provided TEXT NOT NULL,
  bar_state_provided CHAR(2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  rejection_reason TEXT,
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(attorney_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_attorney_claims_status ON attorney_claims(status) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_attorney_claims_attorney ON attorney_claims(attorney_id);

-- --------------------------------------------------------------------------
-- 400: case_results table
-- --------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS case_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attorney_id UUID NOT NULL REFERENCES attorneys(id) ON DELETE CASCADE,
  case_type TEXT,
  specialty_id UUID REFERENCES specialties(id),
  outcome TEXT NOT NULL,
  amount NUMERIC(14,2),
  date DATE,
  court_id UUID REFERENCES courthouses(id),
  is_public BOOLEAN DEFAULT true,
  description TEXT,
  courtlistener_case_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_case_results_attorney ON case_results(attorney_id);
CREATE INDEX IF NOT EXISTS idx_case_results_outcome ON case_results(outcome);
CREATE INDEX IF NOT EXISTS idx_case_results_specialty ON case_results(specialty_id);

-- --------------------------------------------------------------------------
-- 400: bar_admissions table
-- --------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS bar_admissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attorney_id UUID NOT NULL REFERENCES attorneys(id) ON DELETE CASCADE,
  state CHAR(2) NOT NULL,
  bar_number TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  admission_date DATE,
  verified BOOLEAN NOT NULL DEFAULT false,
  verified_at TIMESTAMPTZ,
  source TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(attorney_id, state)
);

CREATE INDEX IF NOT EXISTS idx_bar_admissions_attorney ON bar_admissions(attorney_id);
CREATE INDEX IF NOT EXISTS idx_bar_admissions_state ON bar_admissions(state, bar_number);
CREATE INDEX IF NOT EXISTS idx_bar_admissions_status ON bar_admissions(status);

-- --------------------------------------------------------------------------
-- 400: Enable RLS on all core tables
-- --------------------------------------------------------------------------
ALTER TABLE attorneys ENABLE ROW LEVEL SECURITY;
ALTER TABLE specialties ENABLE ROW LEVEL SECURITY;
ALTER TABLE locations_us ENABLE ROW LEVEL SECURITY;
ALTER TABLE states ENABLE ROW LEVEL SECURITY;
ALTER TABLE counties ENABLE ROW LEVEL SECURITY;
ALTER TABLE zip_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE courthouses ENABLE ROW LEVEL SECURITY;
ALTER TABLE attorney_specialties ENABLE ROW LEVEL SECURITY;
ALTER TABLE attorney_courthouses ENABLE ROW LEVEL SECURITY;
ALTER TABLE attorney_claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE case_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE bar_admissions ENABLE ROW LEVEL SECURITY;

-- 400: RLS Policies (idempotent via DO blocks)
DO $$ BEGIN
  CREATE POLICY "Public read specialties" ON specialties FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Public read states" ON states FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Public read counties" ON counties FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Public read locations" ON locations_us FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Public read zips" ON zip_codes FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Public read courthouses" ON courthouses FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Public read active attorneys" ON attorneys FOR SELECT USING (is_active = true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Attorneys update own profile" ON attorneys FOR UPDATE USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Public read attorney specialties" ON attorney_specialties FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Public read attorney courthouses" ON attorney_courthouses FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Public read case results" ON case_results FOR SELECT USING (is_public = true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Public read bar admissions" ON bar_admissions FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Users see own claims" ON attorney_claims FOR SELECT USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Users create own claims" ON attorney_claims FOR INSERT WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- --------------------------------------------------------------------------
-- 400: Materialized View — mv_attorney_stats
-- --------------------------------------------------------------------------
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_attorney_stats AS
SELECT
  a.id,
  a.name,
  a.slug,
  a.rating_average,
  a.review_count,
  a.cases_handled,
  a.win_rate,
  a.settlement_avg,
  a.address_city,
  a.address_state,
  a.is_verified,
  a.is_featured,
  s.name AS primary_specialty_name,
  s.slug AS primary_specialty_slug,
  st.name AS state_name,
  st.abbreviation AS state_abbr,
  COALESCE(array_agg(DISTINCT sp.slug) FILTER (WHERE sp.slug IS NOT NULL), '{}') AS all_specialty_slugs
FROM attorneys a
LEFT JOIN specialties s ON a.primary_specialty_id = s.id
LEFT JOIN states st ON a.state_id = st.id
LEFT JOIN attorney_specialties ats ON ats.attorney_id = a.id
LEFT JOIN specialties sp ON ats.specialty_id = sp.id
WHERE a.is_active = true
GROUP BY a.id, a.name, a.slug, a.rating_average, a.review_count,
         a.cases_handled, a.win_rate, a.settlement_avg,
         a.address_city, a.address_state, a.is_verified, a.is_featured,
         s.name, s.slug, st.name, st.abbreviation;

CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_attorney_stats_id ON mv_attorney_stats(id);
CREATE INDEX IF NOT EXISTS idx_mv_attorney_stats_state ON mv_attorney_stats(state_abbr);
CREATE INDEX IF NOT EXISTS idx_mv_attorney_stats_specialty ON mv_attorney_stats(primary_specialty_slug);


-- ============================================================================
-- FROM MIGRATION 401: Seed all 57 US jurisdictions
-- ============================================================================

INSERT INTO states (name, slug, abbreviation, fips_code, population, capital, region, timezone, bar_association_url, bar_lookup_api_url) VALUES
('Connecticut',     'connecticut',      'CT', '09', 3617176,  'Hartford',     'Northeast', 'America/New_York',    'https://www.ctbar.org/',                'https://www.jud.ct.gov/attorneyfirminquiry/AttorneyFirmInquiry.aspx'),
('Maine',           'maine',            'ME', '23', 1395722,  'Augusta',      'Northeast', 'America/New_York',    'https://www.mainebar.org/',             'https://www.mebaroverseers.org/attorney_search.html'),
('Massachusetts',   'massachusetts',    'MA', '25', 7001399,  'Boston',       'Northeast', 'America/New_York',    'https://www.massbar.org/',              'https://www.massbbo.org/AttorneySearch'),
('New Hampshire',   'new-hampshire',    'NH', '33', 1402054,  'Concord',      'Northeast', 'America/New_York',    'https://www.nhbar.org/',                'https://www.nhbar.org/member-directory'),
('Rhode Island',    'rhode-island',     'RI', '44', 1095962,  'Providence',   'Northeast', 'America/New_York',    'https://www.ribar.com/',                'https://www.courts.ri.gov/AttorneyResources/Pages/Attorney%20Directory.aspx'),
('Vermont',         'vermont',          'VT', '50', 647464,   'Montpelier',   'Northeast', 'America/New_York',    'https://www.vtbar.org/',                'https://www.vermontjudiciary.org/attorneys'),
('New Jersey',      'new-jersey',       'NJ', '34', 9290841,  'Trenton',      'Northeast', 'America/New_York',    'https://www.njsba.com/',                'https://portal.njcourts.gov/webe7/AttorneyIndex/search'),
('New York',        'new-york',         'NY', '36', 19571216, 'Albany',        'Northeast', 'America/New_York',    'https://www.nysba.org/',                'https://iapps.courts.state.ny.us/attorneyservices/search'),
('Pennsylvania',    'pennsylvania',     'PA', '42', 12961683, 'Harrisburg',   'Northeast', 'America/New_York',    'https://www.pabar.org/',                'https://www.padisciplinaryboard.org/for-the-public/find-attorney'),
('Illinois',        'illinois',         'IL', '17', 12549689, 'Springfield',  'Midwest',   'America/Chicago',     'https://www.isba.org/',                 'https://www.iardc.org/lawyersearch.asp'),
('Indiana',         'indiana',          'IN', '18', 6862199,  'Indianapolis', 'Midwest',   'America/Indiana/Indianapolis', 'https://www.inbar.org/',          'https://courtapps.indianacourts.us/ISC/rollofattorneys'),
('Michigan',        'michigan',         'MI', '26', 10037261, 'Lansing',      'Midwest',   'America/Detroit',     'https://www.michbar.org/',              'https://www.zeekbeek.com/SBM'),
('Ohio',            'ohio',             'OH', '39', 11785935, 'Columbus',     'Midwest',   'America/New_York',    'https://www.ohiobar.org/',              'https://www.supremecourt.ohio.gov/AttorneySearch/'),
('Wisconsin',       'wisconsin',        'WI', '55', 5910955,  'Madison',      'Midwest',   'America/Chicago',     'https://www.wisbar.org/',               'https://www.wisbar.org/forPublic/FindaLawyer/'),
('Iowa',            'iowa',             'IA', '19', 3207004,  'Des Moines',   'Midwest',   'America/Chicago',     'https://www.iowabar.org/',              'https://www.iacourtcommissions.org/agency/attorney-search'),
('Kansas',          'kansas',           'KS', '20', 2940546,  'Topeka',       'Midwest',   'America/Chicago',     'https://www.ksbar.org/',                'https://www.kscourts.org/Attorney'),
('Minnesota',       'minnesota',        'MN', '27', 5737915,  'Saint Paul',   'Midwest',   'America/Chicago',     'https://www.mnbar.org/',                'https://www.mnbar.org/member-directory'),
('Missouri',        'missouri',         'MO', '29', 6196156,  'Jefferson City','Midwest',  'America/Chicago',     'https://www.mobar.org/',                'https://www.momosec.org/mobar/'),
('Nebraska',        'nebraska',         'NE', '31', 1978379,  'Lincoln',      'Midwest',   'America/Chicago',     'https://www.nebar.com/',                'https://www.nebar.com/search/custom.asp?id=2016'),
('North Dakota',    'north-dakota',     'ND', '38', 783926,   'Bismarck',     'Midwest',   'America/Chicago',     'https://www.sband.org/',                'https://www.sband.org/page/MemberDirectory'),
('South Dakota',    'south-dakota',     'SD', '46', 919318,   'Pierre',       'Midwest',   'America/Chicago',     'https://www.sdbar.org/',                'https://www.sdbar.org/Members/Directory/'),
('Delaware',        'delaware',         'DE', '10', 1031890,  'Dover',        'South',     'America/New_York',    'https://www.dsba.org/',                 'https://courts.delaware.gov/odc/attorney_search.aspx'),
('Florida',         'florida',          'FL', '12', 22610726, 'Tallahassee',  'South',     'America/New_York',    'https://www.floridabar.org/',           'https://www.floridabar.org/directories/find-mbr/'),
('Georgia',         'georgia',          'GA', '13', 11029227, 'Atlanta',      'South',     'America/New_York',    'https://www.gabar.org/',                'https://www.gabar.org/membership/membersearch.cfm'),
('Maryland',        'maryland',         'MD', '24', 6180253,  'Annapolis',    'South',     'America/New_York',    'https://www.msba.org/',                 'https://www.courts.state.md.us/cpd/attorneysearch'),
('North Carolina',  'north-carolina',   'NC', '37', 10835491, 'Raleigh',      'South',     'America/New_York',    'https://www.ncbar.org/',                'https://www.ncbar.gov/member-directory/'),
('South Carolina',  'south-carolina',   'SC', '45', 5373555,  'Columbia',     'South',     'America/New_York',    'https://www.scbar.org/',                'https://www.scbar.org/public/lawyer-finder/'),
('Virginia',        'virginia',         'VA', '51', 8715698,  'Richmond',     'South',     'America/New_York',    'https://www.vsb.org/',                  'https://www.vsb.org/vlrs/'),
('District of Columbia', 'district-of-columbia', 'DC', '11', 678972, 'Washington', 'South', 'America/New_York',   'https://www.dcbar.org/',                'https://www.dcbar.org/attorney-search'),
('West Virginia',   'west-virginia',    'WV', '54', 1770071,  'Charleston',   'South',     'America/New_York',    'https://www.wvbar.org/',                'https://www.wvodc.org/Search/Search'),
('Alabama',         'alabama',          'AL', '01', 5108468,  'Montgomery',   'South',     'America/Chicago',     'https://www.alabar.org/',               'https://www.alabar.org/membership/member-directory/'),
('Kentucky',        'kentucky',         'KY', '21', 4526154,  'Frankfort',    'South',     'America/New_York',    'https://www.kybar.org/',                'https://www.kybar.org/search/custom.asp?id=2962'),
('Mississippi',     'mississippi',      'MS', '28', 2939690,  'Jackson',      'South',     'America/Chicago',     'https://www.msbar.org/',                'https://www.msbar.org/for-the-public/attorney-directory/'),
('Tennessee',       'tennessee',        'TN', '47', 7126489,  'Nashville',    'South',     'America/Chicago',     'https://www.tba.org/',                  'https://www.tbpr.org/attorneys'),
('Arkansas',        'arkansas',         'AR', '05', 3067732,  'Little Rock',  'South',     'America/Chicago',     'https://www.arkbar.com/',               'https://www.arcourts.gov/courts/professional-conduct'),
('Louisiana',       'louisiana',        'LA', '22', 4573749,  'Baton Rouge',  'South',     'America/Chicago',     'https://www.lsba.org/',                 'https://www.ladb.org/Attorney/Search'),
('Oklahoma',        'oklahoma',         'OK', '40', 4053824,  'Oklahoma City','South',     'America/Chicago',     'https://www.okbar.org/',                'https://www.okbar.org/membersearch/'),
('Texas',           'texas',            'TX', '48', 30503301, 'Austin',       'South',     'America/Chicago',     'https://www.texasbar.com/',             'https://www.texasbar.com/AM/Template.cfm?Section=Find_A_Lawyer'),
('Arizona',         'arizona',          'AZ', '04', 7431344,  'Phoenix',      'West',      'America/Phoenix',     'https://www.azbar.org/',                'https://www.azbar.org/find-a-lawyer/'),
('Colorado',        'colorado',         'CO', '08', 5877610,  'Denver',       'West',      'America/Denver',      'https://www.cobar.org/',                'https://www.cobar.org/Find-a-Lawyer'),
('Idaho',           'idaho',            'ID', '16', 1964726,  'Boise',        'West',      'America/Boise',       'https://isb.idaho.gov/',                'https://isb.idaho.gov/licensing/attorney-roster/'),
('Montana',         'montana',          'MT', '30', 1132812,  'Helena',       'West',      'America/Denver',      'https://www.montanabar.org/',           'https://www.montanabar.org/page/MemberDirectory'),
('Nevada',          'nevada',           'NV', '32', 3194176,  'Carson City',  'West',      'America/Los_Angeles', 'https://www.nvbar.org/',                'https://www.nvbar.org/find-a-lawyer/'),
('New Mexico',      'new-mexico',       'NM', '35', 2114371,  'Santa Fe',     'West',      'America/Denver',      'https://www.sbnm.org/',                 'https://nmsupremecourt.nmcourts.gov/attorney-search.aspx'),
('Utah',            'utah',             'UT', '49', 3417734,  'Salt Lake City','West',     'America/Denver',      'https://www.utahbar.org/',              'https://www.utahbar.org/member-directory/'),
('Wyoming',         'wyoming',          'WY', '56', 584057,   'Cheyenne',     'West',      'America/Denver',      'https://www.wyomingbar.org/',           'https://www.wyomingbar.org/for-the-public/lawyer-directory/'),
('Alaska',          'alaska',           'AK', '02', 733406,   'Juneau',       'West',      'America/Anchorage',   'https://www.alaskabar.org/',            'https://www.alaskabar.org/for-lawyers/lawyer-directory/'),
('California',      'california',       'CA', '06', 38965193, 'Sacramento',   'West',      'America/Los_Angeles', 'https://www.calbar.ca.gov/',            'https://apps.calbar.ca.gov/attorney/LicenseeSearch/QuickSearch'),
('Hawaii',          'hawaii',           'HI', '15', 1435138,  'Honolulu',     'West',      'Pacific/Honolulu',    'https://hsba.org/',                     'https://hsba.org/HSBA_2020/Lawyer_Referral_Service/HSBA_2020/Lawyer_Referral/LRS.aspx'),
('Oregon',          'oregon',           'OR', '41', 4233358,  'Salem',        'West',      'America/Los_Angeles', 'https://www.osbar.org/',                'https://www.osbar.org/members/membersearch.asp'),
('Washington',      'washington',       'WA', '53', 7812880,  'Olympia',      'West',      'America/Los_Angeles', 'https://www.wsba.org/',                 'https://www.mywsba.org/LawyerDirectory/LawyerDirectory.aspx'),
('Puerto Rico',                 'puerto-rico',              'PR', '72', 3205691, 'San Juan',  'Territory', 'America/Puerto_Rico',  'https://www.capr.org/',    NULL),
('Guam',                        'guam',                     'GU', '66', 153836,  'Hagatna',   'Territory', 'Pacific/Guam',         'https://www.guambar.org/', NULL),
('U.S. Virgin Islands',         'us-virgin-islands',        'VI', '78', 87146,   'Charlotte Amalie', 'Territory', 'America/Virgin', 'https://www.usvibar.org/', NULL),
('American Samoa',              'american-samoa',           'AS', '60', 43895,   'Pago Pago', 'Territory', 'Pacific/Pago_Pago',    NULL, NULL),
('Northern Mariana Islands',    'northern-mariana-islands', 'MP', '69', 47329,   'Saipan',    'Territory', 'Pacific/Guam',         NULL, NULL),
('U.S. Minor Outlying Islands', 'us-minor-outlying-islands','UM', '74', 300,     NULL,        'Territory', 'Pacific/Wake',         NULL, NULL)
ON CONFLICT (abbreviation) DO UPDATE SET
  population = EXCLUDED.population,
  capital = EXCLUDED.capital,
  region = EXCLUDED.region,
  timezone = EXCLUDED.timezone,
  bar_association_url = EXCLUDED.bar_association_url,
  bar_lookup_api_url = EXCLUDED.bar_lookup_api_url;

-- 401: Verify seed
DO $$
DECLARE
  cnt INTEGER;
BEGIN
  SELECT count(*) INTO cnt FROM states;
  IF cnt < 57 THEN
    RAISE EXCEPTION 'Expected 57 jurisdictions, got %', cnt;
  END IF;
  RAISE NOTICE '449: % jurisdictions seeded successfully', cnt;
END $$;


-- ============================================================================
-- FROM MIGRATION 402: Add missing RLS (SKIPPED — references app.* schema and
-- legacy tables: artisans, artisan_monthly_usage, artisan_merges, outreach_messages, events)
-- ============================================================================


-- ============================================================================
-- FROM MIGRATION 403: Statute of Limitations + Census Data
-- ============================================================================

CREATE TABLE IF NOT EXISTS statute_of_limitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  state_code CHAR(2) NOT NULL,
  specialty_slug TEXT NOT NULL,
  years NUMERIC(4,1) NOT NULL,
  exceptions TEXT[] DEFAULT '{}',
  discovery_rule BOOLEAN NOT NULL DEFAULT false,
  description TEXT,
  source_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(state_code, specialty_slug)
);

CREATE INDEX IF NOT EXISTS idx_sol_state ON statute_of_limitations(state_code);
CREATE INDEX IF NOT EXISTS idx_sol_specialty ON statute_of_limitations(specialty_slug);
CREATE INDEX IF NOT EXISTS idx_sol_years ON statute_of_limitations(years);

ALTER TABLE statute_of_limitations ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Public read statute_of_limitations" ON statute_of_limitations FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 403: Add census_data JSONB to locations_us
ALTER TABLE locations_us ADD COLUMN IF NOT EXISTS census_data JSONB;

CREATE INDEX IF NOT EXISTS idx_locations_us_census ON locations_us USING GIN(census_data) WHERE census_data IS NOT NULL;


-- ============================================================================
-- FROM MIGRATION 404: Video Booking System
-- ============================================================================

-- 404: bookings table
CREATE TABLE IF NOT EXISTS bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attorney_id UUID NOT NULL REFERENCES attorneys(id) ON DELETE CASCADE,
  client_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  specialty_id UUID REFERENCES specialties(id),
  scheduled_at TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 30,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled', 'no_show')),
  daily_room_url TEXT,
  daily_room_name TEXT,
  stripe_payment_intent_id TEXT,
  booking_fee NUMERIC(10,2) NOT NULL DEFAULT 19.00,
  client_email TEXT NOT NULL,
  client_name TEXT NOT NULL,
  client_phone TEXT,
  notes TEXT,
  reminder_sent BOOLEAN NOT NULL DEFAULT false,
  cancellation_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Ensure bookings columns exist (table may have been created by earlier migration 446 without all columns)
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS reminder_sent BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS reminder_24h_sent BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS booking_fee NUMERIC(10,2) DEFAULT 19.00;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS daily_room_url TEXT;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS daily_room_name TEXT;

CREATE INDEX IF NOT EXISTS idx_bookings_attorney ON bookings(attorney_id);
CREATE INDEX IF NOT EXISTS idx_bookings_client ON bookings(client_id) WHERE client_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status) WHERE status IN ('pending', 'confirmed');
CREATE INDEX IF NOT EXISTS idx_bookings_scheduled ON bookings(scheduled_at) WHERE status = 'confirmed';
CREATE INDEX IF NOT EXISTS idx_bookings_reminder ON bookings(scheduled_at) WHERE status = 'confirmed' AND reminder_sent = false;
CREATE INDEX IF NOT EXISTS idx_bookings_stripe ON bookings(stripe_payment_intent_id) WHERE stripe_payment_intent_id IS NOT NULL;

ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Attorneys see own bookings" ON bookings FOR SELECT
    USING (attorney_id IN (SELECT id FROM attorneys WHERE user_id = auth.uid()));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Clients see own bookings" ON bookings FOR SELECT
    USING (client_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 404: updated_at trigger for bookings
CREATE OR REPLACE FUNCTION update_bookings_updated_at() RETURNS TRIGGER AS $$
BEGIN NEW.updated_at := now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS bookings_updated_at ON bookings;
CREATE TRIGGER bookings_updated_at BEFORE UPDATE ON bookings
  FOR EACH ROW EXECUTE FUNCTION update_bookings_updated_at();

-- 404: attorney_availability table
CREATE TABLE IF NOT EXISTS attorney_availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attorney_id UUID NOT NULL REFERENCES attorneys(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  timezone TEXT NOT NULL DEFAULT 'America/New_York',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(attorney_id, day_of_week, start_time)
);

CREATE INDEX IF NOT EXISTS idx_attorney_availability_attorney ON attorney_availability(attorney_id) WHERE is_active = true;

ALTER TABLE attorney_availability ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Public read availability" ON attorney_availability FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Attorneys manage own availability" ON attorney_availability FOR ALL
    USING (attorney_id IN (SELECT id FROM attorneys WHERE user_id = auth.uid()));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 404: attorney_bookings_blocked table
CREATE TABLE IF NOT EXISTS attorney_bookings_blocked (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attorney_id UUID NOT NULL REFERENCES attorneys(id) ON DELETE CASCADE,
  blocked_date DATE NOT NULL,
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(attorney_id, blocked_date)
);

CREATE INDEX IF NOT EXISTS idx_blocked_attorney ON attorney_bookings_blocked(attorney_id);

ALTER TABLE attorney_bookings_blocked ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Public read blocked dates" ON attorney_bookings_blocked FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Attorneys manage own blocked" ON attorney_bookings_blocked FOR ALL
    USING (attorney_id IN (SELECT id FROM attorneys WHERE user_id = auth.uid()));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;


-- ============================================================================
-- FROM MIGRATION 405: Fix overly permissive RLS policies
-- ============================================================================

-- 405: Fix bookings INSERT — require authentication
DROP POLICY IF EXISTS "Public can create bookings" ON bookings;

DO $$ BEGIN
  CREATE POLICY "Authenticated users create bookings" ON bookings
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 405: Fix review_votes (only if table exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'review_votes' AND schemaname = 'public') THEN
    EXECUTE 'DROP POLICY IF EXISTS "Anyone can vote on reviews" ON review_votes';
    EXECUTE 'DROP POLICY IF EXISTS "Anyone can insert review votes" ON review_votes';
    BEGIN
      EXECUTE 'CREATE POLICY "Authenticated users can vote on reviews" ON review_votes FOR INSERT WITH CHECK (auth.role() = ''authenticated'')';
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
  END IF;
END $$;

-- 405: Fix waitlist (only if table exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'waitlist' AND schemaname = 'public') THEN
    EXECUTE 'DROP POLICY IF EXISTS "Clients can add themselves to waitlist" ON waitlist';
    BEGIN
      EXECUTE 'CREATE POLICY "Authenticated users join waitlist" ON waitlist FOR INSERT WITH CHECK (auth.role() = ''authenticated'')';
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
  END IF;
END $$;


-- ============================================================================
-- FROM MIGRATION 406: P1 Indexes & Constraints
-- ============================================================================

-- 406: Composite index for availability lookup
CREATE INDEX IF NOT EXISTS idx_attorney_availability_lookup
  ON attorney_availability(attorney_id, day_of_week, start_time);

-- 406: CHECK constraints
DO $$ BEGIN
  ALTER TABLE bar_admissions ADD CONSTRAINT chk_bar_state_format
    CHECK (state ~ '^[A-Z]{2}$');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE zip_codes ADD CONSTRAINT chk_zip_format
    CHECK (code ~ '^\d{5}$');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE bookings ADD CONSTRAINT chk_booking_fee_positive
    CHECK (booking_fee IS NULL OR booking_fee >= 0);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE case_results ADD CONSTRAINT chk_case_amount_positive
    CHECK (amount IS NULL OR amount >= 0);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;


-- ============================================================================
-- FROM MIGRATION 407: Lead Billing (lead_charges)
-- ============================================================================

CREATE TABLE IF NOT EXISTS lead_charges (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  attorney_id UUID NOT NULL REFERENCES attorneys(id) ON DELETE CASCADE,
  lead_id UUID NOT NULL,
  lead_type TEXT NOT NULL DEFAULT 'standard'
    CHECK (lead_type IN ('standard', 'premium', 'voice', 'exclusive')),
  amount_cents INTEGER NOT NULL
    CHECK (amount_cents > 0),
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'billed', 'paid', 'waived', 'refunded')),
  stripe_invoice_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  billed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_lead_charges_attorney ON lead_charges(attorney_id, created_at);
CREATE INDEX IF NOT EXISTS idx_lead_charges_invoice ON lead_charges(stripe_invoice_id) WHERE stripe_invoice_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_lead_charges_pending ON lead_charges(status, created_at) WHERE status = 'pending';

ALTER TABLE lead_charges ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY lead_charges_attorney_select ON lead_charges FOR SELECT
    USING (attorney_id IN (SELECT id FROM attorneys WHERE user_id = auth.uid()));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY lead_charges_admin_all ON lead_charges FOR ALL USING (is_admin());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;


-- ============================================================================
-- FROM MIGRATION 408: Featured/Boost Listings
-- ============================================================================

-- 408: is_featured already exists from 400. Add featured_until and boost_level.
ALTER TABLE attorneys ADD COLUMN IF NOT EXISTS featured_until TIMESTAMPTZ;
ALTER TABLE attorneys ADD COLUMN IF NOT EXISTS boost_level INTEGER DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_attorneys_featured
  ON attorneys(is_featured, boost_level DESC)
  WHERE is_featured = true;


-- ============================================================================
-- FROM MIGRATION 409: Trust Score
-- ============================================================================

ALTER TABLE attorneys ADD COLUMN IF NOT EXISTS trust_score NUMERIC(3,1) DEFAULT 0;
ALTER TABLE attorneys ADD COLUMN IF NOT EXISTS trust_score_breakdown JSONB DEFAULT '{}';
ALTER TABLE attorneys ADD COLUMN IF NOT EXISTS trust_score_updated_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_attorneys_trust_score ON attorneys(trust_score DESC) WHERE trust_score > 0;


-- ============================================================================
-- FROM MIGRATION 410: Q&A Platform (legal_questions, legal_answers)
-- ============================================================================

CREATE TABLE IF NOT EXISTS legal_questions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  specialty_id UUID REFERENCES specialties(id),
  state_code CHAR(2),
  city TEXT,
  asked_by UUID REFERENCES profiles(id),
  asked_by_name TEXT DEFAULT 'Anonymous',
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'answered', 'closed', 'flagged')),
  view_count INTEGER DEFAULT 0,
  answer_count INTEGER DEFAULT 0,
  is_featured BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS legal_answers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  question_id UUID NOT NULL REFERENCES legal_questions(id) ON DELETE CASCADE,
  attorney_id UUID REFERENCES attorneys(id),
  body TEXT NOT NULL,
  is_accepted BOOLEAN DEFAULT false,
  upvotes INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_questions_specialty ON legal_questions(specialty_id, status);
CREATE INDEX IF NOT EXISTS idx_questions_state ON legal_questions(state_code, status);
CREATE INDEX IF NOT EXISTS idx_questions_slug ON legal_questions(slug);
CREATE INDEX IF NOT EXISTS idx_answers_question ON legal_answers(question_id, created_at);
CREATE INDEX IF NOT EXISTS idx_answers_attorney ON legal_answers(attorney_id);

ALTER TABLE legal_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE legal_answers ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Public can read questions" ON legal_questions FOR SELECT USING (status != 'flagged');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Authenticated can ask" ON legal_questions FOR INSERT WITH CHECK (auth.role() = 'authenticated');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Authors update own" ON legal_questions FOR UPDATE USING (asked_by = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Public can read answers" ON legal_answers FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Attorneys can answer" ON legal_answers FOR INSERT WITH CHECK (
    attorney_id IN (SELECT id FROM attorneys WHERE user_id = auth.uid())
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Attorneys update own answers" ON legal_answers FOR UPDATE USING (
    attorney_id IN (SELECT id FROM attorneys WHERE user_id = auth.uid())
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;


-- ============================================================================
-- FROM MIGRATION 411: Peer Endorsements
-- ============================================================================

CREATE TABLE IF NOT EXISTS peer_endorsements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  endorser_id UUID NOT NULL REFERENCES attorneys(id) ON DELETE CASCADE,
  endorsed_id UUID NOT NULL REFERENCES attorneys(id) ON DELETE CASCADE,
  specialty_id UUID REFERENCES specialties(id) ON DELETE SET NULL,
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT no_self_endorsement CHECK (endorser_id <> endorsed_id)
);

CREATE INDEX IF NOT EXISTS idx_peer_endorsements_endorsed ON peer_endorsements(endorsed_id);
CREATE INDEX IF NOT EXISTS idx_peer_endorsements_endorser ON peer_endorsements(endorser_id);

ALTER TABLE peer_endorsements ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Public read endorsements" ON peer_endorsements FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Verified attorneys endorse" ON peer_endorsements FOR INSERT
    WITH CHECK (endorser_id IN (SELECT id FROM attorneys WHERE user_id = auth.uid() AND is_verified = true));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Endorser can delete own" ON peer_endorsements FOR DELETE
    USING (endorser_id IN (SELECT id FROM attorneys WHERE user_id = auth.uid()));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 411: endorsement_count on attorneys
ALTER TABLE attorneys ADD COLUMN IF NOT EXISTS endorsement_count INTEGER DEFAULT 0;

-- 411: Function to keep endorsement_count in sync
CREATE OR REPLACE FUNCTION update_endorsement_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE attorneys SET endorsement_count = endorsement_count + 1
    WHERE id = NEW.endorsed_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE attorneys SET endorsement_count = GREATEST(0, endorsement_count - 1)
    WHERE id = OLD.endorsed_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_endorsement_count_insert ON peer_endorsements;
CREATE TRIGGER trg_endorsement_count_insert
  AFTER INSERT ON peer_endorsements
  FOR EACH ROW EXECUTE FUNCTION update_endorsement_count();

DROP TRIGGER IF EXISTS trg_endorsement_count_delete ON peer_endorsements;
CREATE TRIGGER trg_endorsement_count_delete
  AFTER DELETE ON peer_endorsements
  FOR EACH ROW EXECUTE FUNCTION update_endorsement_count();


-- ============================================================================
-- FROM MIGRATION 414: Review Rating Trigger
-- ============================================================================

CREATE OR REPLACE FUNCTION update_attorney_rating_stats()
RETURNS TRIGGER AS $$
DECLARE
  target_attorney_id UUID;
BEGIN
  IF TG_OP = 'DELETE' THEN
    target_attorney_id := OLD.attorney_id;
  ELSE
    target_attorney_id := NEW.attorney_id;
  END IF;

  UPDATE attorneys
  SET
    rating_average = COALESCE(
      (SELECT ROUND(AVG(rating)::numeric, 2)
       FROM reviews
       WHERE attorney_id = target_attorney_id
         AND status = 'published'),
      0
    ),
    review_count = COALESCE(
      (SELECT COUNT(*)
       FROM reviews
       WHERE attorney_id = target_attorney_id
         AND status = 'published'),
      0
    )
  WHERE id = target_attorney_id;

  IF TG_OP = 'UPDATE' AND OLD.attorney_id != NEW.attorney_id THEN
    UPDATE attorneys
    SET
      rating_average = COALESCE(
        (SELECT ROUND(AVG(rating)::numeric, 2)
         FROM reviews
         WHERE attorney_id = OLD.attorney_id
           AND status = 'published'),
        0
      ),
      review_count = COALESCE(
        (SELECT COUNT(*)
         FROM reviews
         WHERE attorney_id = OLD.attorney_id
           AND status = 'published'),
        0
      )
    WHERE id = OLD.attorney_id;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Only create trigger if reviews table has attorney_id column
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'reviews' AND column_name = 'attorney_id'
  ) THEN
    DROP TRIGGER IF EXISTS trg_update_attorney_rating ON reviews;
    CREATE TRIGGER trg_update_attorney_rating
      AFTER INSERT OR UPDATE OR DELETE ON reviews
      FOR EACH ROW EXECUTE FUNCTION update_attorney_rating_stats();
  END IF;
END $$;


-- ============================================================================
-- FROM MIGRATION 415: Booking Overlap Constraint
-- ============================================================================

CREATE OR REPLACE FUNCTION check_booking_overlap(
  p_attorney_id UUID,
  p_scheduled_at TIMESTAMPTZ,
  p_duration_minutes INTEGER,
  p_exclude_id UUID DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM bookings
    WHERE attorney_id = p_attorney_id
      AND status NOT IN ('cancelled', 'no_show')
      AND (p_exclude_id IS NULL OR id != p_exclude_id)
      AND scheduled_at < (p_scheduled_at + (p_duration_minutes || ' minutes')::interval)
      AND (scheduled_at + (COALESCE(duration_minutes, 30) || ' minutes')::interval) > p_scheduled_at
  );
END;
$$ LANGUAGE plpgsql;


-- ============================================================================
-- MIGRATION 416: SKIPPED (references legacy providers table)
-- ============================================================================


-- ============================================================================
-- FROM MIGRATION 417: Refresh MV function
-- ============================================================================

CREATE OR REPLACE FUNCTION refresh_mv_attorney_stats()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_attorney_stats;
END;
$$;


-- ============================================================================
-- FROM MIGRATION 418: Lead charges voice type
-- (Already handled — lead_charges created above with 'voice' in CHECK)
-- ============================================================================


-- ============================================================================
-- FROM MIGRATION 419: Deduplication Support
-- ============================================================================

DO $$ BEGIN
  ALTER TABLE attorneys
    ADD COLUMN canonical_attorney_id UUID REFERENCES attorneys(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_attorneys_canonical
  ON attorneys(canonical_attorney_id)
  WHERE canonical_attorney_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_attorneys_active_canonical
  ON attorneys(is_active, noindex)
  WHERE is_active = true AND canonical_attorney_id IS NULL;


-- ============================================================================
-- FROM MIGRATION 421: Peer Endorsements per Specialty
-- ============================================================================

-- 421: Drop old unique constraint, add new one with specialty
ALTER TABLE peer_endorsements DROP CONSTRAINT IF EXISTS peer_endorsements_endorser_id_endorsed_id_key;

DO $$ BEGIN
  ALTER TABLE peer_endorsements ADD CONSTRAINT endorsement_comment_length CHECK (char_length(comment) <= 200);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE peer_endorsements ADD CONSTRAINT peer_endorsements_endorser_endorsed_specialty_key
    UNIQUE (endorser_id, endorsed_id, specialty_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_peer_endorsements_specialty ON peer_endorsements(specialty_id)
  WHERE specialty_id IS NOT NULL;


-- ============================================================================
-- FROM MIGRATION 422: Ask a Lawyer — Q&A enhancements
-- ============================================================================

-- 422: qa_votes table
CREATE TABLE IF NOT EXISTS qa_votes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  question_id UUID REFERENCES legal_questions(id) ON DELETE CASCADE,
  answer_id UUID REFERENCES legal_answers(id) ON DELETE CASCADE,
  vote_type TEXT NOT NULL CHECK (vote_type IN ('up', 'down')),
  created_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT chk_vote_target CHECK (
    (question_id IS NOT NULL AND answer_id IS NULL) OR
    (question_id IS NULL AND answer_id IS NOT NULL)
  ),
  CONSTRAINT uq_vote_question UNIQUE (user_id, question_id),
  CONSTRAINT uq_vote_answer UNIQUE (user_id, answer_id)
);

-- 422: Add vote_count to legal_questions
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'legal_questions' AND column_name = 'vote_count'
  ) THEN
    ALTER TABLE legal_questions ADD COLUMN vote_count INTEGER DEFAULT 0;
  END IF;
END $$;

-- 422: Full-text search on questions
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'legal_questions' AND column_name = 'search_vector'
  ) THEN
    ALTER TABLE legal_questions ADD COLUMN search_vector tsvector
      GENERATED ALWAYS AS (
        setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
        setweight(to_tsvector('english', coalesce(body, '')), 'B')
      ) STORED;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_questions_search ON legal_questions USING GIN (search_vector);
CREATE INDEX IF NOT EXISTS idx_questions_created ON legal_questions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_questions_status_created ON legal_questions(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_votes_question ON qa_votes(question_id) WHERE question_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_votes_answer ON qa_votes(answer_id) WHERE answer_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_votes_user ON qa_votes(user_id);

ALTER TABLE qa_votes ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public can read votes' AND tablename = 'qa_votes') THEN
    CREATE POLICY "Public can read votes" ON qa_votes FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Authenticated can vote' AND tablename = 'qa_votes') THEN
    CREATE POLICY "Authenticated can vote" ON qa_votes FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can change own votes' AND tablename = 'qa_votes') THEN
    CREATE POLICY "Users can change own votes" ON qa_votes FOR DELETE USING (auth.uid() = user_id);
  END IF;
END $$;

-- 422: Function to update vote counts
CREATE OR REPLACE FUNCTION update_vote_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.question_id IS NOT NULL THEN
      UPDATE legal_questions SET vote_count = vote_count + (CASE WHEN NEW.vote_type = 'up' THEN 1 ELSE -1 END)
      WHERE id = NEW.question_id;
    END IF;
    IF NEW.answer_id IS NOT NULL THEN
      UPDATE legal_answers SET upvotes = upvotes + (CASE WHEN NEW.vote_type = 'up' THEN 1 ELSE -1 END)
      WHERE id = NEW.answer_id;
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.question_id IS NOT NULL THEN
      UPDATE legal_questions SET vote_count = vote_count - (CASE WHEN OLD.vote_type = 'up' THEN 1 ELSE -1 END)
      WHERE id = OLD.question_id;
    END IF;
    IF OLD.answer_id IS NOT NULL THEN
      UPDATE legal_answers SET upvotes = upvotes - (CASE WHEN OLD.vote_type = 'up' THEN 1 ELSE -1 END)
      WHERE id = OLD.answer_id;
    END IF;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_vote_counts ON qa_votes;
CREATE TRIGGER trg_vote_counts
  AFTER INSERT OR DELETE ON qa_votes
  FOR EACH ROW EXECUTE FUNCTION update_vote_counts();


-- ============================================================================
-- FROM MIGRATION 423: Fix Bookings RLS Auth
-- ============================================================================

-- 423: Drop all overlapping INSERT policies on bookings
DROP POLICY IF EXISTS "Public can create bookings" ON bookings;
DROP POLICY IF EXISTS "Clients can create bookings" ON bookings;
DROP POLICY IF EXISTS "Authenticated users create bookings" ON bookings;

-- 423: Single correct INSERT policy
DO $$ BEGIN
  CREATE POLICY "Authenticated users create own bookings" ON bookings
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND client_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 423: Tighten UPDATE policies
DROP POLICY IF EXISTS "Clients update own bookings" ON bookings;
DROP POLICY IF EXISTS "Attorneys update own bookings" ON bookings;
DROP POLICY IF EXISTS "Participants can update bookings" ON bookings;

DO $$ BEGIN
  CREATE POLICY "Clients update own bookings" ON bookings
    FOR UPDATE USING (client_id = auth.uid()) WITH CHECK (client_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Attorneys update own bookings" ON bookings
    FOR UPDATE
    USING (attorney_id IN (SELECT id FROM attorneys WHERE user_id = auth.uid()))
    WITH CHECK (attorney_id IN (SELECT id FROM attorneys WHERE user_id = auth.uid()));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;


-- ============================================================================
-- FROM MIGRATION 424: Constraints and Unique indexes
-- ============================================================================

-- 424: Unique partial index on bar_number + bar_state
DROP INDEX IF EXISTS idx_attorneys_bar;

CREATE UNIQUE INDEX IF NOT EXISTS idx_attorneys_bar_unique
  ON attorneys (bar_number, bar_state)
  WHERE bar_number IS NOT NULL;

-- 424: CHECK constraints on attorneys
DO $$ BEGIN
  ALTER TABLE attorneys ADD CONSTRAINT chk_attorneys_email
    CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE attorneys ADD CONSTRAINT chk_attorneys_rating_average
    CHECK (rating_average >= 0 AND rating_average <= 5);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE attorneys ADD CONSTRAINT chk_attorneys_review_count
    CHECK (review_count >= 0);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE attorneys ADD CONSTRAINT chk_attorneys_hourly_rate
    CHECK (hourly_rate_min IS NULL OR hourly_rate_max IS NULL OR hourly_rate_min <= hourly_rate_max);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE attorneys ADD CONSTRAINT chk_attorneys_contingency_percentage
    CHECK (contingency_percentage IS NULL OR (contingency_percentage >= 0 AND contingency_percentage <= 100));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE attorneys ADD CONSTRAINT chk_attorneys_slug
    CHECK (slug ~ '^[a-z0-9]([a-z0-9-]*[a-z0-9])?$');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE attorneys ADD CONSTRAINT chk_attorneys_bar_state
    CHECK (bar_state ~ '^[A-Z]{2}$');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE attorneys ADD CONSTRAINT chk_attorneys_address_state
    CHECK (address_state ~ '^[A-Z]{2}$');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE attorneys ADD CONSTRAINT chk_attorneys_years_experience
    CHECK (years_experience IS NULL OR years_experience >= 0);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE attorneys ADD CONSTRAINT chk_attorneys_cases_handled
    CHECK (cases_handled >= 0);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE attorneys ADD CONSTRAINT chk_attorneys_win_rate
    CHECK (win_rate IS NULL OR (win_rate >= 0 AND win_rate <= 100));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;


-- ============================================================================
-- FROM MIGRATION 425: Non-concurrent refresh RPC
-- ============================================================================

CREATE OR REPLACE FUNCTION refresh_mv_attorney_stats_standard()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW mv_attorney_stats;
END;
$$;


-- ============================================================================
-- FROM MIGRATION 426: Composite indexes for common query patterns
-- ============================================================================

-- NOTE: Cannot use CONCURRENTLY inside a transaction, so using regular CREATE INDEX IF NOT EXISTS

CREATE INDEX IF NOT EXISTS idx_attorneys_specialty_state_active
  ON attorneys (primary_specialty_id, address_state, is_active, is_verified)
  WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_attorneys_rating_sort
  ON attorneys (rating_average DESC NULLS LAST, review_count DESC NULLS LAST)
  WHERE is_active = true AND is_verified = true;

CREATE INDEX IF NOT EXISTS idx_attorneys_zip_specialty
  ON attorneys (address_zip, primary_specialty_id)
  WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_attorneys_city_specialty
  ON attorneys (address_city, primary_specialty_id, is_active, is_verified);

CREATE INDEX IF NOT EXISTS idx_attorney_specialties_lookup
  ON attorney_specialties (specialty_id, attorney_id)
  INCLUDE (is_primary, years_experience);

-- 426: Conditional index on reviews (if attorney_id column exists)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'reviews' AND column_name = 'attorney_id'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_reviews_attorney_created
      ON reviews (attorney_id, created_at DESC)
      WHERE status = 'approved';
  END IF;
END $$;

-- 426: Conditional index on leads (if specialty_id and location columns exist)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'leads' AND column_name = 'specialty_id'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'leads' AND column_name = 'location'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_leads_specialty_location
      ON leads (specialty_id, location)
      WHERE status = 'pending';
  END IF;
END $$;


-- ============================================================================
-- FROM MIGRATION 427: Fix attorney_claims columns
-- ============================================================================

-- 427: Make user_id nullable (anonymous claims)
ALTER TABLE attorney_claims ALTER COLUMN user_id DROP NOT NULL;

-- 427: Add claimant contact fields
ALTER TABLE attorney_claims ADD COLUMN IF NOT EXISTS claimant_name TEXT;
ALTER TABLE attorney_claims ADD COLUMN IF NOT EXISTS claimant_email TEXT;
ALTER TABLE attorney_claims ADD COLUMN IF NOT EXISTS claimant_phone TEXT;
ALTER TABLE attorney_claims ADD COLUMN IF NOT EXISTS claimant_position TEXT;

CREATE INDEX IF NOT EXISTS idx_attorney_claims_claimant_email
  ON attorney_claims(claimant_email)
  WHERE claimant_email IS NOT NULL AND status = 'pending';


-- ============================================================================
-- FROM MIGRATION 428: Phone E.164 constraint
-- ============================================================================

DO $$ BEGIN
  ALTER TABLE attorneys ADD CONSTRAINT chk_attorneys_phone_e164
    CHECK (phone_e164 IS NULL OR phone_e164 ~ '^\+[1-9]\d{7,14}$');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;


-- ============================================================================
-- FROM MIGRATION 429: Attorney Enrichment Tables
-- ============================================================================

-- 429: attorney_education
CREATE TABLE IF NOT EXISTS attorney_education (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attorney_id UUID NOT NULL REFERENCES attorneys(id) ON DELETE CASCADE,
  institution TEXT NOT NULL,
  degree TEXT NOT NULL DEFAULT 'J.D.',
  graduation_year SMALLINT,
  honors TEXT,
  is_verified BOOLEAN NOT NULL DEFAULT false,
  source_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

DO $$ BEGIN
  ALTER TABLE attorney_education ADD CONSTRAINT uq_attorney_education_record
    UNIQUE (attorney_id, institution, degree);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE attorney_education ADD CONSTRAINT chk_education_graduation_year
    CHECK (graduation_year IS NULL OR (graduation_year >= 1900 AND graduation_year <= 2100));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_attorney_education_attorney ON attorney_education(attorney_id);
CREATE INDEX IF NOT EXISTS idx_attorney_education_institution ON attorney_education(institution);

-- 429: attorney_awards
CREATE TABLE IF NOT EXISTS attorney_awards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attorney_id UUID NOT NULL REFERENCES attorneys(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  issuer TEXT NOT NULL,
  year SMALLINT,
  specialty_id UUID REFERENCES specialties(id) ON DELETE SET NULL,
  url TEXT,
  is_verified BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

DO $$ BEGIN
  ALTER TABLE attorney_awards ADD CONSTRAINT uq_attorney_award_record
    UNIQUE (attorney_id, title, issuer, year);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE attorney_awards ADD CONSTRAINT chk_award_year
    CHECK (year IS NULL OR (year >= 1950 AND year <= 2100));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_attorney_awards_attorney ON attorney_awards(attorney_id);
CREATE INDEX IF NOT EXISTS idx_attorney_awards_issuer_year ON attorney_awards(issuer, year);

-- 429: disciplinary_actions
CREATE TABLE IF NOT EXISTS disciplinary_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attorney_id UUID NOT NULL REFERENCES attorneys(id) ON DELETE CASCADE,
  state CHAR(2) NOT NULL,
  action_type TEXT NOT NULL,
  effective_date DATE,
  end_date DATE,
  description TEXT,
  docket_number TEXT,
  source_url TEXT NOT NULL,
  is_public BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

DO $$ BEGIN
  ALTER TABLE disciplinary_actions ADD CONSTRAINT chk_disciplinary_state_format
    CHECK (state ~ '^[A-Z]{2}$');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE disciplinary_actions ADD CONSTRAINT chk_disciplinary_action_type
    CHECK (action_type IN (
      'private_reprimand', 'public_reprimand', 'suspension', 'disbarment',
      'probation', 'censure', 'reinstatement', 'resignation', 'other'
    ));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE disciplinary_actions ADD CONSTRAINT chk_disciplinary_date_range
    CHECK (end_date IS NULL OR effective_date IS NULL OR end_date >= effective_date);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_disciplinary_actions_attorney ON disciplinary_actions(attorney_id);
CREATE INDEX IF NOT EXISTS idx_disciplinary_actions_state_type ON disciplinary_actions(state, action_type);
CREATE INDEX IF NOT EXISTS idx_disciplinary_actions_effective_date ON disciplinary_actions(effective_date);

-- 429: attorney_publications
CREATE TABLE IF NOT EXISTS attorney_publications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attorney_id UUID NOT NULL REFERENCES attorneys(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  publication_type TEXT NOT NULL,
  publisher TEXT,
  published_date DATE,
  url TEXT,
  doi TEXT,
  specialty_id UUID REFERENCES specialties(id) ON DELETE SET NULL,
  is_verified BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

DO $$ BEGIN
  ALTER TABLE attorney_publications ADD CONSTRAINT uq_attorney_publication_record
    UNIQUE (attorney_id, title, publisher);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE attorney_publications ADD CONSTRAINT chk_publication_type
    CHECK (publication_type IN (
      'article', 'book', 'book_chapter', 'law_review', 'blog_post',
      'speaking', 'testimony', 'amicus_brief', 'other'
    ));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_attorney_publications_attorney ON attorney_publications(attorney_id);
CREATE INDEX IF NOT EXISTS idx_attorney_publications_type_date ON attorney_publications(publication_type, published_date);

-- 429: RLS for enrichment tables
ALTER TABLE attorney_education ENABLE ROW LEVEL SECURITY;
ALTER TABLE attorney_awards ENABLE ROW LEVEL SECURITY;
ALTER TABLE disciplinary_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE attorney_publications ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Public read attorney education" ON attorney_education FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Public read attorney awards" ON attorney_awards FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Public read disciplinary actions" ON disciplinary_actions FOR SELECT
    USING (is_public = true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Public read attorney publications" ON attorney_publications FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;


-- ============================================================================
-- FROM MIGRATION 430: Enrichment Write Policies (service_role only)
-- ============================================================================

-- attorney_education write policies
DO $$ BEGIN
  CREATE POLICY "Service role insert attorney education" ON attorney_education FOR INSERT TO service_role WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Service role update attorney education" ON attorney_education FOR UPDATE TO service_role USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Service role delete attorney education" ON attorney_education FOR DELETE TO service_role USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- attorney_awards write policies
DO $$ BEGIN
  CREATE POLICY "Service role insert attorney awards" ON attorney_awards FOR INSERT TO service_role WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Service role update attorney awards" ON attorney_awards FOR UPDATE TO service_role USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Service role delete attorney awards" ON attorney_awards FOR DELETE TO service_role USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- disciplinary_actions write policies
DO $$ BEGIN
  CREATE POLICY "Service role insert disciplinary actions" ON disciplinary_actions FOR INSERT TO service_role WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Service role update disciplinary actions" ON disciplinary_actions FOR UPDATE TO service_role USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Service role delete disciplinary actions" ON disciplinary_actions FOR DELETE TO service_role USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- attorney_publications write policies
DO $$ BEGIN
  CREATE POLICY "Service role insert attorney publications" ON attorney_publications FOR INSERT TO service_role WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Service role update attorney publications" ON attorney_publications FOR UPDATE TO service_role USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Service role delete attorney publications" ON attorney_publications FOR DELETE TO service_role USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;


-- ============================================================================
-- FROM MIGRATION 431: Restrict profiles policy
-- ============================================================================

-- 431: Create public_profiles VIEW
DROP VIEW IF EXISTS public_profiles;
CREATE VIEW public_profiles AS
  SELECT
    id,
    full_name,
    role,
    user_type,
    avatar_url
  FROM profiles
  WHERE role = 'artisan'
    AND (is_admin = FALSE OR is_admin IS NULL);

COMMENT ON VIEW public_profiles IS
  'Public-safe subset of profiles. Exposes only non-PII columns.';

GRANT SELECT ON public_profiles TO anon;
GRANT SELECT ON public_profiles TO authenticated;

-- 431: Tighten profiles RLS
DROP POLICY IF EXISTS "Anyone can view artisan profiles" ON profiles;

DO $$ BEGIN
  CREATE POLICY "Anon can view attorney profiles (limited)" ON profiles
    FOR SELECT USING (
      auth.uid() IS NULL
      AND role = 'artisan'
      AND (is_admin = FALSE OR is_admin IS NULL)
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (id = auth.uid());

DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
CREATE POLICY "Admins can view all profiles" ON profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
        AND (
          p.is_admin = TRUE
          OR p.role IN ('super_admin', 'admin', 'moderator', 'viewer')
        )
    )
  );


-- ============================================================================
-- FROM MIGRATION 432: Data Retention
-- ============================================================================

CREATE OR REPLACE FUNCTION retention_cleanup()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_audit_deleted BIGINT := 0;
  v_analytics_deleted BIGINT := 0;
  v_security_deleted BIGINT := 0;
  v_profiles_anonymized BIGINT := 0;
  v_deletion_requests_deleted BIGINT := 0;
  v_start TIMESTAMPTZ := clock_timestamp();
BEGIN
  DELETE FROM audit_logs WHERE created_at < NOW() - INTERVAL '90 days';
  GET DIAGNOSTICS v_audit_deleted = ROW_COUNT;

  DELETE FROM analytics_events WHERE created_at < NOW() - INTERVAL '6 months';
  GET DIAGNOSTICS v_analytics_deleted = ROW_COUNT;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'security_logs') THEN
    DELETE FROM security_logs WHERE created_at < NOW() - INTERVAL '90 days';
    GET DIAGNOSTICS v_security_deleted = ROW_COUNT;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'deletion_requests') THEN
    UPDATE profiles p
    SET
      full_name = 'Deleted User',
      email = 'deleted-' || p.id || '@redacted.local',
      phone = NULL,
      avatar_url = NULL,
      address = NULL,
      updated_at = NOW()
    FROM deletion_requests dr
    WHERE dr.user_id = p.id
      AND dr.status = 'completed'
      AND dr.scheduled_deletion_at < NOW() - INTERVAL '30 days'
      AND p.full_name != 'Deleted User';
    GET DIAGNOSTICS v_profiles_anonymized = ROW_COUNT;

    DELETE FROM deletion_requests
    WHERE status IN ('completed', 'cancelled')
      AND created_at < NOW() - INTERVAL '90 days';
    GET DIAGNOSTICS v_deletion_requests_deleted = ROW_COUNT;
  END IF;

  RETURN jsonb_build_object(
    'audit_logs_deleted', v_audit_deleted,
    'analytics_events_deleted', v_analytics_deleted,
    'security_logs_deleted', v_security_deleted,
    'profiles_anonymized', v_profiles_anonymized,
    'deletion_requests_deleted', v_deletion_requests_deleted,
    'duration_ms', EXTRACT(MILLISECOND FROM clock_timestamp() - v_start)::int
  );
END;
$$;

COMMENT ON FUNCTION retention_cleanup() IS
  'Monthly data retention cleanup. Deletes audit_logs (>90d), analytics_events (>6mo), security_logs (>90d), anonymizes GDPR-deleted users (>30d grace), cleans old deletion_requests (>90d).';


-- ============================================================================
-- FROM MIGRATION 433: Structured Reviews
-- ============================================================================

-- 433: Add structured rating columns to reviews
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'reviews' AND schemaname = 'public') THEN
    ALTER TABLE reviews
      ADD COLUMN IF NOT EXISTS rating_communication SMALLINT,
      ADD COLUMN IF NOT EXISTS rating_result SMALLINT,
      ADD COLUMN IF NOT EXISTS rating_responsiveness SMALLINT;
  END IF;
END $$;

-- 433: CHECK constraints for sub-ratings
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_rating_communication_range') THEN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reviews' AND column_name = 'rating_communication') THEN
      ALTER TABLE reviews ADD CONSTRAINT chk_rating_communication_range
        CHECK (rating_communication IS NULL OR (rating_communication >= 1 AND rating_communication <= 5));
    END IF;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_rating_result_range') THEN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reviews' AND column_name = 'rating_result') THEN
      ALTER TABLE reviews ADD CONSTRAINT chk_rating_result_range
        CHECK (rating_result IS NULL OR (rating_result >= 1 AND rating_result <= 5));
    END IF;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_rating_responsiveness_range') THEN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reviews' AND column_name = 'rating_responsiveness') THEN
      ALTER TABLE reviews ADD CONSTRAINT chk_rating_responsiveness_range
        CHECK (rating_responsiveness IS NULL OR (rating_responsiveness >= 1 AND rating_responsiveness <= 5));
    END IF;
  END IF;
END $$;

-- 433: Composite index on reviews (conditional)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'reviews' AND column_name = 'attorney_id'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_reviews_attorney_status
      ON reviews (attorney_id, status);
  ELSIF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'reviews' AND column_name = 'artisan_id'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_reviews_artisan_status
      ON reviews (artisan_id, status);
  END IF;
END $$;

-- 433: Trigger to auto-compute overall rating from sub-ratings
CREATE OR REPLACE FUNCTION compute_review_composite_rating()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.rating_communication IS NOT NULL
     AND NEW.rating_result IS NOT NULL
     AND NEW.rating_responsiveness IS NOT NULL
  THEN
    NEW.rating := ROUND(
      (NEW.rating_communication + NEW.rating_result + NEW.rating_responsiveness)::numeric / 3
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'reviews' AND schemaname = 'public') THEN
    DROP TRIGGER IF EXISTS trg_compute_composite_rating ON reviews;
    CREATE TRIGGER trg_compute_composite_rating
      BEFORE INSERT OR UPDATE ON reviews
      FOR EACH ROW EXECUTE FUNCTION compute_review_composite_rating();
  END IF;
END $$;

-- 433: Backfill existing reviews
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'reviews' AND schemaname = 'public') THEN
    UPDATE reviews
    SET
      rating_communication = rating,
      rating_result = rating,
      rating_responsiveness = rating
    WHERE rating IS NOT NULL
      AND rating_communication IS NULL
      AND rating_result IS NULL
      AND rating_responsiveness IS NULL;
  END IF;
END $$;


-- ============================================================================
-- FROM MIGRATION 434: Push Subscriptions
-- ============================================================================

CREATE TABLE IF NOT EXISTS push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_used_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_push_subscriptions_user_endpoint UNIQUE (user_id, endpoint)
);

CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user_id ON push_subscriptions (user_id);
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_last_used ON push_subscriptions (last_used_at);

ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Users can view own push subscriptions" ON push_subscriptions FOR SELECT USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Users can create own push subscriptions" ON push_subscriptions FOR INSERT WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Users can update own push subscriptions" ON push_subscriptions FOR UPDATE USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Users can delete own push subscriptions" ON push_subscriptions FOR DELETE USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

COMMENT ON TABLE push_subscriptions IS 'Browser push notification subscriptions (Web Push / VAPID)';


-- ============================================================================
-- FROM MIGRATION 435: Booking Reminders
-- ============================================================================

-- 435: Granular reminder columns on bookings
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS reminder_24h_sent BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS reminder_1h_sent BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS notification_sent_at TIMESTAMPTZ;

-- 435: Backfill
UPDATE bookings SET reminder_24h_sent = true
WHERE reminder_sent = true AND reminder_24h_sent = false;

CREATE INDEX IF NOT EXISTS idx_bookings_reminder_24h
  ON bookings (scheduled_at) WHERE status = 'confirmed' AND reminder_24h_sent = false;

CREATE INDEX IF NOT EXISTS idx_bookings_reminder_1h
  ON bookings (scheduled_at) WHERE status = 'confirmed' AND reminder_1h_sent = false;

-- 435: Additional columns for push_subscriptions (auth_key, user_agent)
ALTER TABLE push_subscriptions ADD COLUMN IF NOT EXISTS auth_key TEXT;
ALTER TABLE push_subscriptions ADD COLUMN IF NOT EXISTS user_agent TEXT;

-- 435: Service role policy for push_subscriptions
DO $$ BEGIN
  CREATE POLICY "Service role full access push subscriptions" ON push_subscriptions
    FOR ALL TO service_role USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Users manage own push subscriptions" ON push_subscriptions
    FOR ALL USING (user_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;


-- ============================================================================
-- FROM MIGRATION 436: Attorney Subscriptions
-- ============================================================================

-- 436: subscription_plans table
CREATE TABLE IF NOT EXISTS subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  stripe_price_id TEXT,
  price_monthly INTEGER NOT NULL DEFAULT 0,
  price_yearly INTEGER NOT NULL DEFAULT 0,
  features JSONB NOT NULL DEFAULT '[]'::jsonb,
  max_leads_per_month INTEGER NOT NULL DEFAULT 5,
  priority_boost NUMERIC(3,1) NOT NULL DEFAULT 1.0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_subscription_plans_slug ON subscription_plans(slug);
CREATE INDEX IF NOT EXISTS idx_subscription_plans_active ON subscription_plans(is_active) WHERE is_active = true;

ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Anyone can view active subscription plans" ON subscription_plans FOR SELECT USING (is_active = true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Admins can manage subscription plans" ON subscription_plans FOR ALL USING (is_admin());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 436: Seed plans
INSERT INTO subscription_plans (name, slug, stripe_price_id, price_monthly, price_yearly, features, max_leads_per_month, priority_boost, is_active)
VALUES
  ('Free', 'free', NULL, 0, 0,
    '["Basic profile listing", "Up to 5 leads per month", "Standard search placement", "Email notifications", "Client messaging"]'::jsonb,
    5, 1.0, true),
  ('Pro', 'pro', NULL, 9900, 95000,
    '["Enhanced profile with photo & bio", "Up to 50 leads per month", "2x search priority boost", "Priority badge on profile", "Detailed analytics dashboard", "Priority email & chat support", "Client review solicitation tools", "Monthly performance reports"]'::jsonb,
    50, 2.0, true),
  ('Premium', 'premium', NULL, 19900, 190000,
    '["Premium profile with video intro", "Unlimited leads per month", "5x search priority boost", "Premium verified badge", "Featured placement in search results", "Advanced analytics & competitor insights", "Dedicated account manager", "Priority placement in directory", "Custom intake forms", "Monthly ROI reports", "24/7 priority support"]'::jsonb,
    -1, 5.0, true)
ON CONFLICT (slug) DO NOTHING;

-- 436: Add subscription columns to attorneys
DO $$ BEGIN
  ALTER TABLE attorneys ADD COLUMN subscription_tier TEXT NOT NULL DEFAULT 'free'
    CHECK (subscription_tier IN ('free', 'pro', 'premium'));
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

ALTER TABLE attorneys ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;
ALTER TABLE attorneys ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;
ALTER TABLE attorneys ADD COLUMN IF NOT EXISTS subscription_started_at TIMESTAMPTZ;
ALTER TABLE attorneys ADD COLUMN IF NOT EXISTS subscription_ends_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_attorneys_subscription_tier ON attorneys(subscription_tier);
CREATE INDEX IF NOT EXISTS idx_attorneys_stripe_sub ON attorneys(stripe_subscription_id) WHERE stripe_subscription_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_attorneys_stripe_customer ON attorneys(stripe_customer_id) WHERE stripe_customer_id IS NOT NULL;

-- 436: lead_usage table
CREATE TABLE IF NOT EXISTS lead_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attorney_id UUID NOT NULL REFERENCES attorneys(id) ON DELETE CASCADE,
  month DATE NOT NULL,
  lead_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_lead_usage_attorney_month UNIQUE (attorney_id, month)
);

CREATE INDEX IF NOT EXISTS idx_lead_usage_attorney ON lead_usage(attorney_id, month DESC);

ALTER TABLE lead_usage ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Attorneys can view own lead usage" ON lead_usage FOR SELECT
    USING (attorney_id IN (SELECT id FROM attorneys WHERE user_id = auth.uid()));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Admins can manage lead usage" ON lead_usage FOR ALL USING (is_admin());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 436: Update profiles subscription_plan CHECK
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'subscription_plan') THEN
    ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_subscription_plan_check;
    ALTER TABLE profiles ADD CONSTRAINT profiles_subscription_plan_check
      CHECK (subscription_plan IN ('gratuit', 'free', 'pro', 'premium'));
    UPDATE profiles SET subscription_plan = 'free' WHERE subscription_plan = 'gratuit';
  END IF;
END $$;

COMMENT ON TABLE subscription_plans IS 'Attorney subscription tiers (Free/Pro/Premium) with Stripe integration';
COMMENT ON TABLE lead_usage IS 'Monthly lead consumption tracking per attorney for plan enforcement';


-- ============================================================================
-- FROM MIGRATION 437: Attorney Onboarding
-- ============================================================================

ALTER TABLE attorneys ADD COLUMN IF NOT EXISTS onboarding_step SMALLINT NOT NULL DEFAULT 0;
ALTER TABLE attorneys ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMPTZ;
ALTER TABLE attorneys ADD COLUMN IF NOT EXISTS profile_completion_pct SMALLINT NOT NULL DEFAULT 0;
ALTER TABLE attorneys ADD COLUMN IF NOT EXISTS onboarding_data JSONB DEFAULT '{}';

CREATE INDEX IF NOT EXISTS idx_attorneys_onboarding_incomplete
  ON attorneys (onboarding_step) WHERE onboarding_completed_at IS NULL;

-- 437: Profile completion trigger
CREATE OR REPLACE FUNCTION compute_profile_completion()
RETURNS TRIGGER AS $$
DECLARE
  pct SMALLINT := 0;
  total INT := 10;
  filled INT := 0;
BEGIN
  IF NEW.name IS NOT NULL AND length(trim(NEW.name)) > 0 THEN filled := filled + 1; END IF;
  IF NEW.bar_number IS NOT NULL AND length(trim(NEW.bar_number)) > 0 THEN filled := filled + 1; END IF;
  IF NEW.phone IS NOT NULL AND length(trim(NEW.phone)) > 0 THEN filled := filled + 1; END IF;
  IF NEW.address_city IS NOT NULL AND length(trim(NEW.address_city)) > 0 THEN filled := filled + 1; END IF;
  IF NEW.address_state IS NOT NULL AND length(trim(NEW.address_state)) > 0 THEN filled := filled + 1; END IF;
  IF NEW.description IS NOT NULL AND length(trim(NEW.description)) > 10 THEN filled := filled + 1; END IF;
  IF NEW.is_verified = true THEN filled := filled + 1; END IF;
  IF NEW.primary_specialty_id IS NOT NULL THEN filled := filled + 1; END IF;
  IF NEW.firm_name IS NOT NULL AND length(trim(NEW.firm_name)) > 0 THEN filled := filled + 1; END IF;
  IF NEW.onboarding_completed_at IS NOT NULL THEN filled := filled + 1; END IF;

  pct := ((filled::NUMERIC / total) * 100)::SMALLINT;
  NEW.profile_completion_pct := pct;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_compute_profile_completion ON attorneys;
CREATE TRIGGER trg_compute_profile_completion
  BEFORE INSERT OR UPDATE ON attorneys
  FOR EACH ROW EXECUTE FUNCTION compute_profile_completion();


-- ============================================================================
-- FROM MIGRATION 438: Lead Matching & Assignments
-- ============================================================================

CREATE TABLE IF NOT EXISTS attorney_lead_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL,
  attorney_id UUID NOT NULL REFERENCES attorneys(id) ON DELETE CASCADE,
  score NUMERIC(8,2) NOT NULL DEFAULT 0,
  match_reasons JSONB NOT NULL DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'accepted', 'declined', 'expired', 'completed')),
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  responded_at TIMESTAMPTZ,
  response_time_seconds INTEGER,
  position INTEGER NOT NULL DEFAULT 1,
  CONSTRAINT uq_attorney_lead_assignments UNIQUE (lead_id, attorney_id)
);

CREATE INDEX IF NOT EXISTS idx_atty_lead_assign_attorney_status
  ON attorney_lead_assignments(attorney_id, status);
CREATE INDEX IF NOT EXISTS idx_atty_lead_assign_lead
  ON attorney_lead_assignments(lead_id);
CREATE INDEX IF NOT EXISTS idx_atty_lead_assign_assigned
  ON attorney_lead_assignments(assigned_at DESC);
CREATE INDEX IF NOT EXISTS idx_atty_lead_assign_pending
  ON attorney_lead_assignments(status, assigned_at DESC)
  WHERE status = 'pending';

-- 438: Add last_lead_assigned_at to attorneys
ALTER TABLE attorneys ADD COLUMN IF NOT EXISTS last_lead_assigned_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_attorneys_last_lead
  ON attorneys(last_lead_assigned_at ASC NULLS FIRST) WHERE is_active = true;

-- 438: Add matching columns to bookings
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS matching_status TEXT DEFAULT 'unmatched';
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS matched_attorney_id UUID REFERENCES attorneys(id);
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS practice_area_slug TEXT;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS client_state CHAR(2);
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS client_city TEXT;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS client_zip CHAR(5);

-- 438: Add CHECK constraint for matching_status (idempotent)
DO $$ BEGIN
  ALTER TABLE bookings ADD CONSTRAINT bookings_matching_status_check
    CHECK (matching_status IN ('unmatched', 'matched', 'assigned', 'manual_review'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_bookings_matching_status
  ON bookings(matching_status) WHERE matching_status IN ('unmatched', 'manual_review');

-- 438: RLS for attorney_lead_assignments
ALTER TABLE attorney_lead_assignments ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY atty_lead_assign_attorney_select ON attorney_lead_assignments FOR SELECT
    USING (attorney_id IN (SELECT id FROM attorneys WHERE user_id = auth.uid()));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY atty_lead_assign_attorney_update ON attorney_lead_assignments FOR UPDATE
    USING (attorney_id IN (SELECT id FROM attorneys WHERE user_id = auth.uid()))
    WITH CHECK (status IN ('accepted', 'declined'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY atty_lead_assign_admin_all ON attorney_lead_assignments FOR ALL USING (is_admin());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

COMMENT ON TABLE attorney_lead_assignments IS 'Lead-to-attorney matching assignments with scoring and response tracking';


-- ============================================================================
-- FROM MIGRATION 439: Email Campaigns
-- ============================================================================

-- 439: email_sends table
CREATE TABLE IF NOT EXISTS email_sends (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attorney_id UUID NOT NULL REFERENCES attorneys(id) ON DELETE CASCADE,
  campaign TEXT NOT NULL,
  step TEXT NOT NULL,
  template TEXT NOT NULL,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  opened_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ,
  unsubscribed_at TIMESTAMPTZ,
  resend_id TEXT,
  error TEXT,
  CONSTRAINT uq_email_sends_attorney_campaign_step UNIQUE (attorney_id, campaign, step)
);

CREATE INDEX IF NOT EXISTS idx_email_sends_attorney ON email_sends(attorney_id, campaign);
CREATE INDEX IF NOT EXISTS idx_email_sends_sent_at ON email_sends(sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_email_sends_campaign ON email_sends(campaign, step);

ALTER TABLE email_sends ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Attorneys can view own email sends" ON email_sends FOR SELECT
    USING (attorney_id IN (SELECT id FROM attorneys WHERE user_id = auth.uid()));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Admins can manage email sends" ON email_sends FOR ALL USING (is_admin());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 439: email_preferences table
CREATE TABLE IF NOT EXISTS email_preferences (
  attorney_id UUID PRIMARY KEY REFERENCES attorneys(id) ON DELETE CASCADE,
  marketing_emails BOOLEAN NOT NULL DEFAULT true,
  product_updates BOOLEAN NOT NULL DEFAULT true,
  weekly_stats BOOLEAN NOT NULL DEFAULT true,
  unsubscribed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE email_preferences ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Attorneys can view own email preferences" ON email_preferences FOR SELECT
    USING (attorney_id IN (SELECT id FROM attorneys WHERE user_id = auth.uid()));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Attorneys can update own email preferences" ON email_preferences FOR UPDATE
    USING (attorney_id IN (SELECT id FROM attorneys WHERE user_id = auth.uid()));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Attorneys can insert own email preferences" ON email_preferences FOR INSERT
    WITH CHECK (attorney_id IN (SELECT id FROM attorneys WHERE user_id = auth.uid()));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Admins can manage email preferences" ON email_preferences FOR ALL USING (is_admin());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 439: Trial tracking columns on attorneys
ALTER TABLE attorneys ADD COLUMN IF NOT EXISTS trial_started_at TIMESTAMPTZ;
ALTER TABLE attorneys ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMPTZ;
ALTER TABLE attorneys ADD COLUMN IF NOT EXISTS churned_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_attorneys_trial_started ON attorneys(trial_started_at) WHERE trial_started_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_attorneys_churned ON attorneys(churned_at) WHERE churned_at IS NOT NULL;

COMMENT ON TABLE email_sends IS 'Tracks every drip campaign email sent to attorneys.';
COMMENT ON TABLE email_preferences IS 'Attorney-level email opt-in/opt-out preferences for drip campaigns.';


-- ============================================================================
-- FROM MIGRATION 440: Deadline Reminders
-- ============================================================================

CREATE TABLE IF NOT EXISTS deadline_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  specialty_slug TEXT NOT NULL,
  state_code CHAR(2) NOT NULL,
  incident_date DATE NOT NULL,
  deadline_date DATE NOT NULL,
  reminded_30d BOOLEAN NOT NULL DEFAULT false,
  reminded_7d BOOLEAN NOT NULL DEFAULT false,
  reminded_1d BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, specialty_slug, state_code, incident_date)
);

CREATE INDEX IF NOT EXISTS idx_deadline_reminders_user ON deadline_reminders(user_id);
CREATE INDEX IF NOT EXISTS idx_deadline_reminders_deadline ON deadline_reminders(deadline_date);
CREATE INDEX IF NOT EXISTS idx_deadline_reminders_pending ON deadline_reminders(deadline_date)
  WHERE reminded_30d = false OR reminded_7d = false OR reminded_1d = false;

ALTER TABLE deadline_reminders ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Users read own deadline_reminders" ON deadline_reminders FOR SELECT USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Users insert own deadline_reminders" ON deadline_reminders FOR INSERT WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Users delete own deadline_reminders" ON deadline_reminders FOR DELETE USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;


-- ============================================================================
-- FROM MIGRATION 441: Secure Messaging System
-- ============================================================================

-- 441: conversations table
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attorney_id UUID NOT NULL REFERENCES attorneys(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
  subject TEXT DEFAULT 'New Conversation',
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived', 'blocked')),
  encryption_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_message_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_conversations_attorney_client_active
  ON conversations (attorney_id, client_id) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_conversations_client ON conversations (client_id);
CREATE INDEX IF NOT EXISTS idx_conversations_attorney ON conversations (attorney_id);
CREATE INDEX IF NOT EXISTS idx_conversations_last_message ON conversations (last_message_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversations_status ON conversations (status);

-- 441: messages table
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sender_type TEXT NOT NULL CHECK (sender_type IN ('client', 'attorney', 'artisan', 'system')),
  content TEXT,
  encrypted_content TEXT,
  iv TEXT,
  content_preview TEXT,
  message_type TEXT NOT NULL DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'file', 'voice', 'system')),
  file_url TEXT,
  file_name TEXT,
  file_size INTEGER,
  file_encrypted BOOLEAN NOT NULL DEFAULT FALSE,
  reply_to_id UUID REFERENCES messages(id) ON DELETE SET NULL,
  rich_content JSONB,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  read_at TIMESTAMPTZ,
  edited_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_messages_conversation_created ON messages (conversation_id, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_messages_unread ON messages (conversation_id, is_read) WHERE is_read = FALSE AND deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages (sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_not_deleted ON messages (conversation_id, created_at DESC) WHERE deleted_at IS NULL;

-- 441: message_attachments table
CREATE TABLE IF NOT EXISTS message_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size INTEGER NOT NULL DEFAULT 0,
  mime_type TEXT NOT NULL DEFAULT 'application/octet-stream',
  thumbnail_url TEXT,
  duration INTEGER,
  transcription TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_message_attachments_message ON message_attachments (message_id);

-- 441: message_reactions table
CREATE TABLE IF NOT EXISTS message_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  emoji TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (message_id, user_id, emoji)
);

CREATE INDEX IF NOT EXISTS idx_message_reactions_message ON message_reactions (message_id);

-- 441: message_read_receipts table
CREATE TABLE IF NOT EXISTS message_read_receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  read_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (message_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_message_read_receipts_message ON message_read_receipts (message_id);

-- 441: conversation_settings table
CREATE TABLE IF NOT EXISTS conversation_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  is_muted BOOLEAN NOT NULL DEFAULT FALSE,
  is_archived BOOLEAN NOT NULL DEFAULT FALSE,
  is_pinned BOOLEAN NOT NULL DEFAULT FALSE,
  notification_preference TEXT NOT NULL DEFAULT 'all' CHECK (notification_preference IN ('all', 'mentions', 'none')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (conversation_id, user_id)
);

-- 441: quick_reply_templates table
CREATE TABLE IF NOT EXISTS quick_reply_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  shortcut TEXT,
  category TEXT,
  usage_count INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_quick_reply_templates_user ON quick_reply_templates (user_id) WHERE is_active = TRUE;

-- 441: Enable RLS on messaging tables
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_read_receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE quick_reply_templates ENABLE ROW LEVEL SECURITY;

-- 441: RLS Policies — conversations
DO $$ BEGIN
  CREATE POLICY "conversations_select_participant" ON conversations FOR SELECT USING (
    auth.uid() = client_id
    OR auth.uid() IN (SELECT user_id FROM attorneys WHERE id = attorney_id AND user_id IS NOT NULL)
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "conversations_insert_participant" ON conversations FOR INSERT WITH CHECK (
    auth.uid() = client_id
    OR auth.uid() IN (SELECT user_id FROM attorneys WHERE id = attorney_id AND user_id IS NOT NULL)
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "conversations_update_participant" ON conversations FOR UPDATE USING (
    auth.uid() = client_id
    OR auth.uid() IN (SELECT user_id FROM attorneys WHERE id = attorney_id AND user_id IS NOT NULL)
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 441: RLS Policies — messages
DO $$ BEGIN
  CREATE POLICY "messages_select_participant" ON messages FOR SELECT USING (
    conversation_id IN (
      SELECT id FROM conversations
      WHERE client_id = auth.uid()
        OR attorney_id IN (SELECT id FROM attorneys WHERE user_id = auth.uid())
    )
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "messages_insert_participant" ON messages FOR INSERT WITH CHECK (
    sender_id = auth.uid()
    AND conversation_id IN (
      SELECT id FROM conversations
      WHERE client_id = auth.uid()
        OR attorney_id IN (SELECT id FROM attorneys WHERE user_id = auth.uid())
    )
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "messages_update_own" ON messages FOR UPDATE USING (
    sender_id = auth.uid()
    OR conversation_id IN (
      SELECT id FROM conversations
      WHERE client_id = auth.uid()
        OR attorney_id IN (SELECT id FROM attorneys WHERE user_id = auth.uid())
    )
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 441: RLS Policies — message_attachments
DO $$ BEGIN
  CREATE POLICY "attachments_select" ON message_attachments FOR SELECT USING (
    message_id IN (
      SELECT id FROM messages WHERE conversation_id IN (
        SELECT id FROM conversations
        WHERE client_id = auth.uid()
          OR attorney_id IN (SELECT id FROM attorneys WHERE user_id = auth.uid())
      )
    )
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "attachments_insert" ON message_attachments FOR INSERT WITH CHECK (
    message_id IN (SELECT id FROM messages WHERE sender_id = auth.uid())
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 441: RLS Policies — message_reactions
DO $$ BEGIN
  CREATE POLICY "reactions_select" ON message_reactions FOR SELECT USING (
    message_id IN (
      SELECT id FROM messages WHERE conversation_id IN (
        SELECT id FROM conversations
        WHERE client_id = auth.uid()
          OR attorney_id IN (SELECT id FROM attorneys WHERE user_id = auth.uid())
      )
    )
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "reactions_insert" ON message_reactions FOR INSERT WITH CHECK (user_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "reactions_delete" ON message_reactions FOR DELETE USING (user_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 441: RLS Policies — message_read_receipts
DO $$ BEGIN
  CREATE POLICY "read_receipts_select" ON message_read_receipts FOR SELECT USING (
    message_id IN (
      SELECT id FROM messages WHERE conversation_id IN (
        SELECT id FROM conversations
        WHERE client_id = auth.uid()
          OR attorney_id IN (SELECT id FROM attorneys WHERE user_id = auth.uid())
      )
    )
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "read_receipts_insert" ON message_read_receipts FOR INSERT WITH CHECK (user_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 441: RLS Policies — conversation_settings
DO $$ BEGIN
  CREATE POLICY "conv_settings_select" ON conversation_settings FOR SELECT USING (user_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "conv_settings_upsert" ON conversation_settings FOR INSERT WITH CHECK (user_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "conv_settings_update" ON conversation_settings FOR UPDATE USING (user_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 441: RLS Policies — quick_reply_templates
DO $$ BEGIN
  CREATE POLICY "quick_replies_select" ON quick_reply_templates FOR SELECT USING (user_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "quick_replies_insert" ON quick_reply_templates FOR INSERT WITH CHECK (user_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "quick_replies_update" ON quick_reply_templates FOR UPDATE USING (user_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "quick_replies_delete" ON quick_reply_templates FOR DELETE USING (user_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 441: Triggers
CREATE OR REPLACE FUNCTION update_conversation_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_conversation_timestamp ON conversations;
CREATE TRIGGER trigger_update_conversation_timestamp
  BEFORE UPDATE ON conversations
  FOR EACH ROW EXECUTE FUNCTION update_conversation_timestamp();

CREATE OR REPLACE FUNCTION sync_message_read_status()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_read = TRUE AND (OLD.is_read = FALSE OR OLD.is_read IS NULL) THEN
    NEW.read_at = COALESCE(NEW.read_at, NOW());
  END IF;
  IF NEW.read_at IS NOT NULL AND (OLD.read_at IS NULL) THEN
    NEW.is_read = TRUE;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_sync_message_read ON messages;
CREATE TRIGGER trigger_sync_message_read
  BEFORE UPDATE ON messages
  FOR EACH ROW EXECUTE FUNCTION sync_message_read_status();

-- 441: Helper function
CREATE OR REPLACE FUNCTION get_unread_count(
  p_conversation_id UUID,
  p_user_id UUID
) RETURNS INTEGER AS $$
  SELECT COUNT(*)::INTEGER
  FROM messages
  WHERE conversation_id = p_conversation_id
    AND sender_id != p_user_id
    AND is_read = FALSE
    AND deleted_at IS NULL;
$$ LANGUAGE sql STABLE;

COMMENT ON TABLE conversations IS 'Attorney-client conversations. ABA Rule 1.6 requires confidential communications.';
COMMENT ON TABLE messages IS 'Messages within conversations. Content encrypted at rest with AES-256-GCM.';


-- ============================================================================
-- FROM MIGRATION 442: Secure Messages (alterations to existing tables)
-- ============================================================================

-- 442: Add columns to conversations (already created above with these columns, but handle alter for existing tables)
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS attorney_id UUID REFERENCES attorneys(id) ON DELETE CASCADE;
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS subject TEXT;
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS encryption_enabled BOOLEAN NOT NULL DEFAULT TRUE;

-- 442: Add encryption columns to messages (already created above with these columns)
ALTER TABLE messages ADD COLUMN IF NOT EXISTS encrypted_content TEXT;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS iv TEXT;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS content_preview TEXT;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS is_read BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS file_encrypted BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS reply_to_id UUID REFERENCES messages(id) ON DELETE SET NULL;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS edited_at TIMESTAMPTZ;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- 442: Update sender_type CHECK
ALTER TABLE messages DROP CONSTRAINT IF EXISTS messages_sender_type_check;
DO $$ BEGIN
  ALTER TABLE messages ADD CONSTRAINT messages_sender_type_check
    CHECK (sender_type IN ('client', 'attorney', 'artisan', 'system'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 442: Update message_type CHECK
ALTER TABLE messages DROP CONSTRAINT IF EXISTS messages_message_type_check;
DO $$ BEGIN
  ALTER TABLE messages ADD CONSTRAINT messages_message_type_check
    CHECK (message_type IN ('text', 'image', 'file', 'voice', 'system'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 442: Drop old RLS policies and recreate
DROP POLICY IF EXISTS "Users can view their own conversations" ON conversations;
DROP POLICY IF EXISTS "Users can create conversations" ON conversations;
DROP POLICY IF EXISTS "Users can update their own conversations" ON conversations;
DROP POLICY IF EXISTS "Users can view messages in their conversations" ON messages;
DROP POLICY IF EXISTS "Users can send messages in their conversations" ON messages;
DROP POLICY IF EXISTS "Users can update messages they sent" ON messages;

DO $$ BEGIN
  CREATE POLICY "secure_conversations_select" ON conversations FOR SELECT USING (
    auth.uid() = client_id
    OR auth.uid() IN (SELECT user_id FROM attorneys WHERE id = attorney_id AND user_id IS NOT NULL)
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "secure_conversations_insert" ON conversations FOR INSERT WITH CHECK (
    auth.uid() = client_id
    OR auth.uid() IN (SELECT user_id FROM attorneys WHERE id = attorney_id AND user_id IS NOT NULL)
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "secure_conversations_update" ON conversations FOR UPDATE USING (
    auth.uid() = client_id
    OR auth.uid() IN (SELECT user_id FROM attorneys WHERE id = attorney_id AND user_id IS NOT NULL)
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "secure_messages_select" ON messages FOR SELECT USING (
    conversation_id IN (
      SELECT id FROM conversations
      WHERE client_id = auth.uid()
        OR attorney_id IN (SELECT id FROM attorneys WHERE user_id = auth.uid())
    )
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "secure_messages_insert" ON messages FOR INSERT WITH CHECK (
    sender_id = auth.uid()
    AND conversation_id IN (
      SELECT id FROM conversations
      WHERE client_id = auth.uid()
        OR attorney_id IN (SELECT id FROM attorneys WHERE user_id = auth.uid())
    )
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "secure_messages_update" ON messages FOR UPDATE USING (sender_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;


-- ============================================================================
-- FROM MIGRATION 443: Notifications V2
-- ============================================================================

-- 443: Add new columns to notifications table (only if table exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'notifications' AND schemaname = 'public') THEN
    ALTER TABLE notifications ADD COLUMN IF NOT EXISTS body TEXT;
    ALTER TABLE notifications ADD COLUMN IF NOT EXISTS read_at TIMESTAMPTZ;
    ALTER TABLE notifications ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;
    ALTER TABLE notifications ADD COLUMN IF NOT EXISTS data JSONB NOT NULL DEFAULT '{}';

    -- Backfill body from message
    UPDATE notifications SET body = message WHERE body IS NULL AND message IS NOT NULL;

    -- Backfill read_at from read boolean
    UPDATE notifications SET read_at = created_at WHERE read = TRUE AND read_at IS NULL;

    -- Backfill data from metadata
    UPDATE notifications SET data = metadata WHERE metadata IS NOT NULL AND metadata != '{}' AND data = '{}';

    -- Expand notification types
    ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;
    ALTER TABLE notifications ADD CONSTRAINT notifications_type_check CHECK (type IN (
      'lead_created', 'lead_dispatched', 'lead_viewed',
      'quote_received', 'lead_closed', 'system',
      'booking_confirmed', 'booking_reminder', 'booking_cancelled',
      'booking_rescheduled',
      'new_message',
      'new_lead',
      'review_received', 'review_request',
      'payment_success', 'payment_failed',
      'deadline_reminder',
      'profile_view',
      'claim_approved', 'claim_rejected'
    ));

    -- Improved indexes
    CREATE INDEX IF NOT EXISTS idx_notifications_user_read_created
      ON notifications(user_id, read_at NULLS FIRST, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_notifications_expires
      ON notifications(expires_at) WHERE expires_at IS NOT NULL;

    -- DELETE policy
    DROP POLICY IF EXISTS "Users delete own notifications" ON notifications;
    CREATE POLICY "Users delete own notifications" ON notifications
      FOR DELETE USING (user_id = auth.uid());
  END IF;
END $$;

-- 443: Auto-cleanup function
CREATE OR REPLACE FUNCTION cleanup_old_notifications()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM notifications WHERE expires_at IS NOT NULL AND expires_at < now();
  GET DIAGNOSTICS deleted_count = ROW_COUNT;

  DELETE FROM notifications WHERE created_at < now() - INTERVAL '90 days';
  GET DIAGNOSTICS deleted_count = deleted_count + ROW_COUNT;

  RETURN deleted_count;
END;
$$;

COMMENT ON FUNCTION cleanup_old_notifications IS 'Removes expired and 90-day-old notifications. Call via cron.';


-- ============================================================================
-- FROM MIGRATION 444: search_attorneys_v1 RPC
-- ============================================================================

CREATE OR REPLACE FUNCTION search_attorneys_v1(
  search_query TEXT DEFAULT NULL,
  filter_specialty_ids UUID[] DEFAULT NULL,
  filter_state TEXT DEFAULT NULL,
  filter_city TEXT DEFAULT NULL,
  filter_rating_min NUMERIC DEFAULT NULL,
  geo_lat DOUBLE PRECISION DEFAULT NULL,
  geo_lng DOUBLE PRECISION DEFAULT NULL,
  geo_radius_miles DOUBLE PRECISION DEFAULT NULL,
  sort_by TEXT DEFAULT 'relevance',
  result_limit INTEGER DEFAULT 20,
  result_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  stable_id TEXT,
  name TEXT,
  slug TEXT,
  primary_specialty_id UUID,
  specialty_slug TEXT,
  specialty_name TEXT,
  address_line1 TEXT,
  address_zip TEXT,
  address_city TEXT,
  address_state CHAR(2),
  address_county TEXT,
  is_verified BOOLEAN,
  is_active BOOLEAN,
  noindex BOOLEAN,
  rating_average NUMERIC,
  review_count INTEGER,
  phone TEXT,
  bar_number TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  is_featured BOOLEAN,
  boost_level INTEGER,
  rank REAL,
  distance_miles DOUBLE PRECISION,
  total_count BIGINT
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
DECLARE
  tsq TSQUERY := NULL;
  geo_point GEOGRAPHY := NULL;
  geo_radius_meters DOUBLE PRECISION := NULL;
BEGIN
  IF search_query IS NOT NULL AND LENGTH(TRIM(search_query)) >= 2 THEN
    tsq := plainto_tsquery('english', TRIM(search_query));
  END IF;

  IF geo_lat IS NOT NULL AND geo_lng IS NOT NULL THEN
    geo_point := ST_SetSRID(ST_MakePoint(geo_lng, geo_lat), 4326)::GEOGRAPHY;
    geo_radius_meters := COALESCE(geo_radius_miles, 25.0) * 1609.344;
  END IF;

  RETURN QUERY
  WITH filtered AS (
    SELECT
      a.id,
      a.stable_id,
      a.name,
      a.slug,
      a.primary_specialty_id,
      s.slug AS specialty_slug,
      s.name AS specialty_name,
      a.address_line1,
      a.address_zip,
      a.address_city,
      a.address_state,
      a.address_county,
      a.is_verified,
      a.is_active,
      a.noindex,
      a.rating_average,
      a.review_count,
      a.phone,
      a.bar_number,
      a.latitude,
      a.longitude,
      a.created_at,
      a.updated_at,
      a.is_featured,
      a.boost_level,
      CASE
        WHEN tsq IS NOT NULL THEN ts_rank(a.search_vector, tsq, 32)
        ELSE 0.0
      END::REAL AS rank,
      CASE
        WHEN geo_point IS NOT NULL AND a.geo IS NOT NULL
        THEN ST_Distance(a.geo, geo_point) / 1609.344
        ELSE NULL
      END AS distance_miles
    FROM attorneys a
    LEFT JOIN specialties s ON s.id = a.primary_specialty_id
    WHERE
      a.is_active = TRUE
      AND a.canonical_attorney_id IS NULL
      AND (tsq IS NULL OR a.search_vector @@ tsq)
      AND (geo_point IS NULL OR (a.geo IS NOT NULL AND ST_DWithin(a.geo, geo_point, geo_radius_meters)))
      AND (filter_specialty_ids IS NULL OR a.primary_specialty_id = ANY(filter_specialty_ids))
      AND (filter_state IS NULL OR a.address_state = filter_state)
      AND (filter_city IS NULL OR LOWER(a.address_city) = LOWER(filter_city))
      AND (filter_rating_min IS NULL OR a.rating_average >= filter_rating_min)
  ),
  counted AS (
    SELECT COUNT(*) AS cnt FROM filtered
  )
  SELECT
    f.id, f.stable_id, f.name, f.slug, f.primary_specialty_id,
    f.specialty_slug, f.specialty_name,
    f.address_line1, f.address_zip, f.address_city, f.address_state, f.address_county,
    f.is_verified, f.is_active, f.noindex,
    f.rating_average, f.review_count, f.phone, f.bar_number,
    f.latitude, f.longitude, f.created_at, f.updated_at,
    f.is_featured, f.boost_level, f.rank, f.distance_miles,
    c.cnt AS total_count
  FROM filtered f
  CROSS JOIN counted c
  ORDER BY
    CASE WHEN sort_by = 'relevance' THEN f.rank END DESC NULLS LAST,
    CASE WHEN sort_by = 'distance' THEN f.distance_miles END ASC NULLS LAST,
    CASE WHEN sort_by = 'rating' THEN f.rating_average END DESC NULLS LAST,
    f.is_featured DESC NULLS LAST,
    f.boost_level DESC NULLS LAST,
    f.name ASC
  LIMIT result_limit
  OFFSET result_offset;
END;
$$;

GRANT EXECUTE ON FUNCTION search_attorneys_v1 TO anon, authenticated;


-- ============================================================================
-- FROM MIGRATION 445: Verification Logs
-- ============================================================================

CREATE TABLE IF NOT EXISTS verification_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attorney_id UUID REFERENCES attorneys(id) ON DELETE CASCADE,
  bar_number TEXT NOT NULL,
  state_code CHAR(2) NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('verified', 'not_found', 'suspended', 'disbarred', 'manual_review', 'error')),
  response_data JSONB DEFAULT '{}',
  verified_at TIMESTAMPTZ,
  source TEXT NOT NULL DEFAULT 'api_lookup',
  error_message TEXT,
  ip_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_verification_logs_attorney_state
  ON verification_logs(attorney_id, state_code) WHERE attorney_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_verification_logs_recent
  ON verification_logs(bar_number, state_code, created_at DESC)
  WHERE status IN ('verified', 'not_found', 'suspended', 'disbarred');

CREATE INDEX IF NOT EXISTS idx_verification_logs_errors
  ON verification_logs(created_at DESC) WHERE status = 'error';

ALTER TABLE verification_logs ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Public read verified logs" ON verification_logs
    FOR SELECT USING (status IN ('verified', 'suspended', 'disbarred'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 445: Add verification columns to attorney_claims
ALTER TABLE attorney_claims ADD COLUMN IF NOT EXISTS verification_status TEXT DEFAULT 'pending';
ALTER TABLE attorney_claims ADD COLUMN IF NOT EXISTS verification_log_id UUID REFERENCES verification_logs(id);
ALTER TABLE attorney_claims ADD COLUMN IF NOT EXISTS auto_verified_at TIMESTAMPTZ;

-- 445: CHECK constraint for verification_status (idempotent)
DO $$ BEGIN
  ALTER TABLE attorney_claims ADD CONSTRAINT attorney_claims_verification_status_check
    CHECK (verification_status IN ('pending', 'verified', 'not_found', 'suspended', 'manual_review', 'error'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;


-- ============================================================================
-- END OF CONSOLIDATED MIGRATION 449
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '449_consolidated_all_missing.sql applied successfully.';
END $$;
