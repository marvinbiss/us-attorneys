-- ============================================================================
-- Migration 401: Seed all 57 US jurisdictions (50 states + DC + 6 territories)
-- Source: US Census Bureau 2023 estimates, FIPS codes, bar association URLs
-- ============================================================================

INSERT INTO states (name, slug, abbreviation, fips_code, population, capital, region, timezone, bar_association_url, bar_lookup_api_url) VALUES
-- ============================================================================
-- NORTHEAST (9 states)
-- ============================================================================
('Connecticut',     'connecticut',      'CT', '09', 3617176,  'Hartford',     'Northeast', 'America/New_York',    'https://www.ctbar.org/',                'https://www.jud.ct.gov/attorneyfirminquiry/AttorneyFirmInquiry.aspx'),
('Maine',           'maine',            'ME', '23', 1395722,  'Augusta',      'Northeast', 'America/New_York',    'https://www.mainebar.org/',             'https://www.mebaroverseers.org/attorney_search.html'),
('Massachusetts',   'massachusetts',    'MA', '25', 7001399,  'Boston',       'Northeast', 'America/New_York',    'https://www.massbar.org/',              'https://www.massbbo.org/AttorneySearch'),
('New Hampshire',   'new-hampshire',    'NH', '33', 1402054,  'Concord',      'Northeast', 'America/New_York',    'https://www.nhbar.org/',                'https://www.nhbar.org/member-directory'),
('Rhode Island',    'rhode-island',     'RI', '44', 1095962,  'Providence',   'Northeast', 'America/New_York',    'https://www.ribar.com/',                'https://www.courts.ri.gov/AttorneyResources/Pages/Attorney%20Directory.aspx'),
('Vermont',         'vermont',          'VT', '50', 647464,   'Montpelier',   'Northeast', 'America/New_York',    'https://www.vtbar.org/',                'https://www.vermontjudiciary.org/attorneys'),
('New Jersey',      'new-jersey',       'NJ', '34', 9290841,  'Trenton',      'Northeast', 'America/New_York',    'https://www.njsba.com/',                'https://portal.njcourts.gov/webe7/AttorneyIndex/search'),
('New York',        'new-york',         'NY', '36', 19571216, 'Albany',        'Northeast', 'America/New_York',    'https://www.nysba.org/',                'https://iapps.courts.state.ny.us/attorneyservices/search'),
('Pennsylvania',    'pennsylvania',     'PA', '42', 12961683, 'Harrisburg',   'Northeast', 'America/New_York',    'https://www.pabar.org/',                'https://www.padisciplinaryboard.org/for-the-public/find-attorney'),

-- ============================================================================
-- MIDWEST (12 states)
-- ============================================================================
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

-- ============================================================================
-- SOUTH (17 states + DC)
-- ============================================================================
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

-- ============================================================================
-- WEST (13 states)
-- ============================================================================
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

-- ============================================================================
-- US TERRITORIES (6)
-- ============================================================================
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

-- Verify
DO $$
DECLARE
  cnt INTEGER;
BEGIN
  SELECT count(*) INTO cnt FROM states;
  IF cnt < 57 THEN
    RAISE EXCEPTION 'Expected 57 jurisdictions, got %', cnt;
  END IF;
  RAISE NOTICE '✓ % jurisdictions seeded successfully', cnt;
END $$;
