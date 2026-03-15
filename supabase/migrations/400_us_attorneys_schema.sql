-- ============================================================================
-- Migration 400: US Attorneys Schema
-- Transforms French artisan directory into US attorney directory
-- ============================================================================

-- ============================================================================
-- 1. PRACTICE AREAS (replaces services)
-- ============================================================================
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

CREATE INDEX idx_specialties_slug ON specialties(slug);
CREATE INDEX idx_specialties_category ON specialties(category) WHERE is_active = true;

-- Seed: 75 practice areas for US legal market
INSERT INTO specialties (name, slug, category) VALUES
  -- Criminal Law
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
  -- Personal Injury
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
  -- Family Law
  ('Divorce', 'divorce', 'family'),
  ('Child Custody', 'child-custody', 'family'),
  ('Child Support', 'child-support', 'family'),
  ('Adoption', 'adoption', 'family'),
  ('Alimony & Spousal Support', 'alimony-spousal-support', 'family'),
  ('Domestic Violence', 'domestic-violence', 'family'),
  ('Prenuptial Agreements', 'prenuptial-agreements', 'family'),
  ('Paternity', 'paternity', 'family'),
  -- Business & Corporate
  ('Business Law', 'business-law', 'business'),
  ('Corporate Law', 'corporate-law', 'business'),
  ('Mergers & Acquisitions', 'mergers-acquisitions', 'business'),
  ('Contract Law', 'contract-law', 'business'),
  ('Business Litigation', 'business-litigation', 'business'),
  ('Intellectual Property', 'intellectual-property', 'business'),
  ('Trademark', 'trademark', 'business'),
  ('Patent', 'patent', 'business'),
  ('Copyright', 'copyright', 'business'),
  -- Real Estate
  ('Real Estate Law', 'real-estate-law', 'real-estate'),
  ('Landlord & Tenant', 'landlord-tenant', 'real-estate'),
  ('Foreclosure', 'foreclosure', 'real-estate'),
  ('Zoning & Land Use', 'zoning-land-use', 'real-estate'),
  ('Construction Law', 'construction-law', 'real-estate'),
  -- Immigration
  ('Immigration Law', 'immigration-law', 'immigration'),
  ('Green Cards', 'green-cards', 'immigration'),
  ('Visa Applications', 'visa-applications', 'immigration'),
  ('Deportation Defense', 'deportation-defense', 'immigration'),
  ('Asylum', 'asylum', 'immigration'),
  ('Citizenship & Naturalization', 'citizenship-naturalization', 'immigration'),
  -- Estate Planning
  ('Estate Planning', 'estate-planning', 'estate'),
  ('Wills & Trusts', 'wills-trusts', 'estate'),
  ('Probate', 'probate', 'estate'),
  ('Elder Law', 'elder-law', 'estate'),
  ('Guardianship', 'guardianship', 'estate'),
  -- Employment
  ('Employment Law', 'employment-law', 'employment'),
  ('Wrongful Termination', 'wrongful-termination', 'employment'),
  ('Workplace Discrimination', 'workplace-discrimination', 'employment'),
  ('Sexual Harassment', 'sexual-harassment', 'employment'),
  ('Wage & Hour Claims', 'wage-hour-claims', 'employment'),
  -- Bankruptcy
  ('Bankruptcy', 'bankruptcy', 'bankruptcy'),
  ('Chapter 7', 'chapter-7-bankruptcy', 'bankruptcy'),
  ('Chapter 13', 'chapter-13-bankruptcy', 'bankruptcy'),
  ('Debt Relief', 'debt-relief', 'bankruptcy'),
  -- Tax
  ('Tax Law', 'tax-law', 'tax'),
  ('IRS Disputes', 'irs-disputes', 'tax'),
  ('Tax Planning', 'tax-planning', 'tax'),
  -- Other
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

-- ============================================================================
-- 2. US LOCATIONS (replaces communes)
-- ============================================================================

-- States
CREATE TABLE IF NOT EXISTS states (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  abbreviation CHAR(2) NOT NULL UNIQUE,
  fips_code CHAR(2) NOT NULL UNIQUE,
  population INTEGER,
  capital TEXT,
  region TEXT, -- Northeast, Midwest, South, West
  timezone TEXT,
  bar_association_url TEXT,
  bar_lookup_api_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_states_abbreviation ON states(abbreviation);
CREATE INDEX idx_states_slug ON states(slug);

-- Counties
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

CREATE INDEX idx_counties_state ON counties(state_id);
CREATE INDEX idx_counties_slug ON counties(slug, state_id);
CREATE INDEX idx_counties_fips ON counties(fips_code);

-- Cities / Locations
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

CREATE INDEX idx_locations_us_state ON locations_us(state_id);
CREATE INDEX idx_locations_us_slug ON locations_us(slug, state_id);
CREATE INDEX idx_locations_us_geo ON locations_us USING GIST(geo);
CREATE INDEX idx_locations_us_population ON locations_us(population DESC NULLS LAST) WHERE is_major_city = true;
CREATE INDEX idx_locations_us_metro ON locations_us(metro_area) WHERE metro_area IS NOT NULL;

-- ZIP Codes (separate table, not array — many-to-many with cities)
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
  area_type TEXT DEFAULT 'standard', -- standard, po_box, unique, military
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_zip_codes_code ON zip_codes(code);
CREATE INDEX idx_zip_codes_location ON zip_codes(location_id);
CREATE INDEX idx_zip_codes_state ON zip_codes(state_id);
CREATE INDEX idx_zip_codes_geo ON zip_codes USING GIST(geo);

-- ============================================================================
-- 3. ATTORNEYS (replaces providers)
-- ============================================================================
CREATE TABLE IF NOT EXISTS attorneys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Identity
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  first_name TEXT,
  last_name TEXT,
  email TEXT,
  phone TEXT,
  phone_e164 TEXT,
  website TEXT,
  profile_image_url TEXT,

  -- Bar & Credentials
  bar_number TEXT,
  bar_state CHAR(2),
  bar_status TEXT DEFAULT 'active', -- active, inactive, suspended, disbarred
  bar_admission_date DATE,
  ein TEXT, -- Employer Identification Number (firm)
  law_school TEXT,
  graduation_year INTEGER,
  years_experience INTEGER,

  -- CourtListener integration
  courtlistener_id TEXT UNIQUE,
  courtlistener_url TEXT,

  -- Performance metrics (populated by cron jobs)
  win_rate NUMERIC(5,2), -- 0.00 - 100.00
  settlement_avg NUMERIC(12,2), -- average settlement amount
  cases_handled INTEGER DEFAULT 0,

  -- Ratings
  rating_average NUMERIC(3,2) DEFAULT 0,
  review_count INTEGER DEFAULT 0,

  -- Location
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

  -- Practice areas (primary + related)
  primary_specialty_id UUID REFERENCES specialties(id),

  -- Profile content
  description TEXT,
  bio TEXT,
  tagline TEXT,
  languages TEXT[] DEFAULT ARRAY['English'],

  -- Firm info
  firm_name TEXT,
  firm_size TEXT, -- solo, small (2-10), medium (11-50), large (50+)
  is_solo_practitioner BOOLEAN DEFAULT false,

  -- Verification & status
  is_verified BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  noindex BOOLEAN NOT NULL DEFAULT false,
  verified_at TIMESTAMPTZ,

  -- Pricing
  consultation_fee NUMERIC(10,2), -- initial consultation fee (0 = free)
  hourly_rate_min NUMERIC(10,2),
  hourly_rate_max NUMERIC(10,2),
  contingency_fee BOOLEAN DEFAULT false, -- works on contingency?
  contingency_percentage NUMERIC(5,2), -- typical contingency %
  pro_bono BOOLEAN DEFAULT false,

  -- User link (claimed profiles)
  user_id UUID REFERENCES auth.users(id),
  claimed_at TIMESTAMPTZ,
  claimed_by UUID REFERENCES auth.users(id),
  stable_id TEXT UNIQUE, -- stable public identifier

  -- Search
  search_vector TSVECTOR,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Core indexes
CREATE INDEX idx_attorneys_slug ON attorneys(slug);
CREATE INDEX idx_attorneys_user ON attorneys(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX idx_attorneys_state ON attorneys(address_state);
CREATE INDEX idx_attorneys_city ON attorneys(address_city);
CREATE INDEX idx_attorneys_bar ON attorneys(bar_number, bar_state) WHERE bar_number IS NOT NULL;
CREATE INDEX idx_attorneys_specialty ON attorneys(primary_specialty_id) WHERE is_active = true;
CREATE INDEX idx_attorneys_geo ON attorneys USING GIST(geo);
CREATE INDEX idx_attorneys_search ON attorneys USING GIN(search_vector);
CREATE INDEX idx_attorneys_rating ON attorneys(rating_average DESC, review_count DESC) WHERE is_active = true;
CREATE INDEX idx_attorneys_active ON attorneys(is_active, is_verified, noindex);
CREATE INDEX idx_attorneys_courtlistener ON attorneys(courtlistener_id) WHERE courtlistener_id IS NOT NULL;
CREATE INDEX idx_attorneys_stable_id ON attorneys(stable_id) WHERE stable_id IS NOT NULL;

-- Covering index for sitemap generation (zero heap fetch)
CREATE INDEX idx_attorneys_sitemap ON attorneys(slug, address_city, address_state, primary_specialty_id, updated_at)
  WHERE is_active = true AND noindex = false;

-- Full-text search trigger
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

CREATE TRIGGER attorneys_search_update
  BEFORE INSERT OR UPDATE ON attorneys
  FOR EACH ROW EXECUTE FUNCTION attorneys_search_vector_update();

-- ============================================================================
-- 4. ATTORNEY PRACTICE AREAS (many-to-many)
-- ============================================================================
CREATE TABLE IF NOT EXISTS attorney_specialties (
  attorney_id UUID NOT NULL REFERENCES attorneys(id) ON DELETE CASCADE,
  specialty_id UUID NOT NULL REFERENCES specialties(id) ON DELETE CASCADE,
  is_primary BOOLEAN DEFAULT false,
  years_experience INTEGER,
  cases_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (attorney_id, specialty_id)
);

CREATE INDEX idx_attorney_specialties_specialty ON attorney_specialties(specialty_id);
CREATE INDEX idx_attorney_specialties_primary ON attorney_specialties(attorney_id) WHERE is_primary = true;

-- ============================================================================
-- 5. COURTHOUSES
-- ============================================================================
CREATE TABLE IF NOT EXISTS courthouses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  court_type TEXT NOT NULL, -- federal_district, federal_appellate, federal_supreme, state_supreme, state_appellate, state_trial, state_family, state_probate, bankruptcy, municipal

  -- Location
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

  -- Contact
  phone TEXT,
  website TEXT,
  clerk_name TEXT,
  clerk_email TEXT,

  -- CourtListener
  courtlistener_id TEXT UNIQUE,

  -- Metadata
  jurisdiction TEXT, -- district name or circuit
  pacer_court_id TEXT, -- PACER integration
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE(slug, state_id)
);

CREATE INDEX idx_courthouses_state ON courthouses(state_id);
CREATE INDEX idx_courthouses_county ON courthouses(county_id);
CREATE INDEX idx_courthouses_type ON courthouses(court_type);
CREATE INDEX idx_courthouses_geo ON courthouses USING GIST(geo);
CREATE INDEX idx_courthouses_slug ON courthouses(slug, state_id);

-- Attorney ↔ Courthouse relationship (which courts an attorney practices in)
CREATE TABLE IF NOT EXISTS attorney_courthouses (
  attorney_id UUID NOT NULL REFERENCES attorneys(id) ON DELETE CASCADE,
  courthouse_id UUID NOT NULL REFERENCES courthouses(id) ON DELETE CASCADE,
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (attorney_id, courthouse_id)
);

CREATE INDEX idx_attorney_courthouses_court ON attorney_courthouses(courthouse_id);

-- ============================================================================
-- 6. ATTORNEY CLAIMS (bar verification)
-- ============================================================================
CREATE TABLE IF NOT EXISTS attorney_claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attorney_id UUID NOT NULL REFERENCES attorneys(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  bar_number_provided TEXT NOT NULL,
  bar_state_provided CHAR(2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  rejection_reason TEXT,
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(attorney_id, user_id)
);

CREATE INDEX idx_attorney_claims_status ON attorney_claims(status) WHERE status = 'pending';
CREATE INDEX idx_attorney_claims_attorney ON attorney_claims(attorney_id);

-- ============================================================================
-- 7. CASE RESULTS (win_rate, settlement data source)
-- ============================================================================
CREATE TABLE IF NOT EXISTS case_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attorney_id UUID NOT NULL REFERENCES attorneys(id) ON DELETE CASCADE,
  case_type TEXT, -- verdict, settlement, dismissal
  specialty_id UUID REFERENCES specialties(id),
  outcome TEXT NOT NULL, -- won, lost, settled, dismissed
  amount NUMERIC(14,2), -- settlement/verdict amount
  date DATE,
  court_id UUID REFERENCES courthouses(id),
  is_public BOOLEAN DEFAULT true,
  description TEXT,
  courtlistener_case_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_case_results_attorney ON case_results(attorney_id);
CREATE INDEX idx_case_results_outcome ON case_results(outcome);
CREATE INDEX idx_case_results_specialty ON case_results(specialty_id);

-- ============================================================================
-- 8. BAR ADMISSIONS (attorneys can be barred in multiple states)
-- ============================================================================
CREATE TABLE IF NOT EXISTS bar_admissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attorney_id UUID NOT NULL REFERENCES attorneys(id) ON DELETE CASCADE,
  state CHAR(2) NOT NULL,
  bar_number TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active', -- active, inactive, suspended, disbarred
  admission_date DATE,
  verified BOOLEAN NOT NULL DEFAULT false,
  verified_at TIMESTAMPTZ,
  source TEXT, -- manual, api_lookup, scrape
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(attorney_id, state)
);

CREATE INDEX idx_bar_admissions_attorney ON bar_admissions(attorney_id);
CREATE INDEX idx_bar_admissions_state ON bar_admissions(state, bar_number);
CREATE INDEX idx_bar_admissions_status ON bar_admissions(status);

-- ============================================================================
-- 9. RLS POLICIES
-- ============================================================================

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

-- Public read access for directory listings
CREATE POLICY "Public read specialties" ON specialties FOR SELECT USING (true);
CREATE POLICY "Public read states" ON states FOR SELECT USING (true);
CREATE POLICY "Public read counties" ON counties FOR SELECT USING (true);
CREATE POLICY "Public read locations" ON locations_us FOR SELECT USING (true);
CREATE POLICY "Public read zips" ON zip_codes FOR SELECT USING (true);
CREATE POLICY "Public read courthouses" ON courthouses FOR SELECT USING (true);

-- Attorneys: public read for active, owners can update their own
CREATE POLICY "Public read active attorneys" ON attorneys FOR SELECT
  USING (is_active = true);
CREATE POLICY "Attorneys update own profile" ON attorneys FOR UPDATE
  USING (auth.uid() = user_id);

-- Attorney specialties: public read
CREATE POLICY "Public read attorney specialties" ON attorney_specialties FOR SELECT USING (true);
CREATE POLICY "Public read attorney courthouses" ON attorney_courthouses FOR SELECT USING (true);

-- Case results: public read for public cases
CREATE POLICY "Public read case results" ON case_results FOR SELECT
  USING (is_public = true);

-- Bar admissions: public read
CREATE POLICY "Public read bar admissions" ON bar_admissions FOR SELECT USING (true);

-- Claims: users can see their own
CREATE POLICY "Users see own claims" ON attorney_claims FOR SELECT
  USING (auth.uid() = user_id);
CREATE POLICY "Users create own claims" ON attorney_claims FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- 10. MATERIALIZED VIEW: Attorney Stats
-- ============================================================================
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

CREATE UNIQUE INDEX idx_mv_attorney_stats_id ON mv_attorney_stats(id);
CREATE INDEX idx_mv_attorney_stats_state ON mv_attorney_stats(state_abbr);
CREATE INDEX idx_mv_attorney_stats_specialty ON mv_attorney_stats(primary_specialty_slug);
