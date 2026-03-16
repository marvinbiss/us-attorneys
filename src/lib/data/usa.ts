// US Attorney Directory — Static geographic and practice area data

export interface City {
  slug: string
  name: string
  stateCode: string
  stateName: string
  county: string
  population: string
  zipCode: string
  description: string
  neighborhoods: string[]
  latitude: number
  longitude: number
  metroArea: string
}

export interface State {
  code: string
  slug: string
  name: string
  region: string
  capital: string
  population: string
  description: string
  cities: string[]
  attorneysEstimate: number
  largestCity: string
}

export interface USRegion {
  slug: string
  name: string
  description: string
  states: { name: string; code: string; slug: string; cities: { name: string; slug: string }[] }[]
}

// ============================================================================
// 51 US States + DC
// ============================================================================
export const states: State[] = [
  { code: 'AL', slug: 'alabama', name: 'Alabama', region: 'South', capital: 'Montgomery', largestCity: 'Huntsville', population: '5,108,468', description: 'Alabama has a growing legal market centered in Birmingham and Huntsville, with strong demand for personal injury and workers compensation attorneys.', attorneysEstimate: 10000, cities: ['birmingham', 'huntsville', 'montgomery', 'mobile', 'tuscaloosa'] },
  { code: 'AK', slug: 'alaska', name: 'Alaska', region: 'West', capital: 'Juneau', largestCity: 'Anchorage', population: '733,536', description: 'Alaska has a small but specialized bar focused on natural resources, maritime law, and personal injury.', attorneysEstimate: 2500, cities: ['anchorage', 'fairbanks', 'juneau'] },
  { code: 'AZ', slug: 'arizona', name: 'Arizona', region: 'West', capital: 'Phoenix', largestCity: 'Phoenix', population: '7,431,344', description: 'Arizona is one of the fastest-growing legal markets in the US, driven by population growth in the Phoenix metro area.', attorneysEstimate: 18000, cities: ['phoenix', 'tucson', 'mesa', 'chandler', 'scottsdale', 'gilbert', 'glendale', 'tempe', 'peoria', 'surprise'] },
  { code: 'AR', slug: 'arkansas', name: 'Arkansas', region: 'South', capital: 'Little Rock', largestCity: 'Little Rock', population: '3,067,732', description: 'Arkansas legal market is centered in Little Rock with strong demand for family law and personal injury attorneys.', attorneysEstimate: 6000, cities: ['little-rock', 'fort-smith', 'fayetteville', 'springdale', 'jonesboro'] },
  { code: 'CA', slug: 'california', name: 'California', region: 'West', capital: 'Sacramento', largestCity: 'Los Angeles', population: '38,965,193', description: 'California has the second-largest bar in the United States with nearly 170,000 active attorneys, concentrated in Los Angeles, San Francisco, and San Diego.', attorneysEstimate: 170000, cities: ['los-angeles', 'san-diego', 'san-jose', 'san-francisco', 'fresno', 'sacramento', 'long-beach', 'oakland', 'bakersfield', 'anaheim', 'santa-ana', 'riverside', 'stockton', 'irvine', 'chula-vista', 'fremont', 'santa-clarita', 'san-bernardino', 'modesto', 'fontana'] },
  { code: 'CO', slug: 'colorado', name: 'Colorado', region: 'West', capital: 'Denver', largestCity: 'Denver', population: '5,877,610', description: 'Colorado has a thriving legal market centered in Denver, with growing demand in tech, cannabis law, and real estate.', attorneysEstimate: 25000, cities: ['denver', 'colorado-springs', 'aurora', 'fort-collins', 'lakewood', 'thornton', 'arvada', 'westminster', 'pueblo', 'boulder'] },
  { code: 'CT', slug: 'connecticut', name: 'Connecticut', region: 'Northeast', capital: 'Hartford', largestCity: 'Bridgeport', population: '3,617,176', description: 'Connecticut has a sophisticated legal market with expertise in corporate law, insurance, and financial services litigation.', attorneysEstimate: 20000, cities: ['bridgeport', 'new-haven', 'stamford', 'hartford', 'waterbury', 'norwalk', 'danbury'] },
  { code: 'DE', slug: 'delaware', name: 'Delaware', region: 'South', capital: 'Dover', largestCity: 'Wilmington', population: '1,031,890', description: 'Delaware is the incorporation capital of America, with the Court of Chancery making it a hub for corporate and business law.', attorneysEstimate: 2800, cities: ['wilmington', 'dover', 'newark'] },
  { code: 'DC', slug: 'district-of-columbia', name: 'District of Columbia', region: 'South', capital: 'Washington', largestCity: 'Washington', population: '678,972', description: 'Washington DC has the highest concentration of attorneys per capita in the nation, with expertise in government, regulatory, and international law.', attorneysEstimate: 55000, cities: ['washington'] },
  { code: 'FL', slug: 'florida', name: 'Florida', region: 'South', capital: 'Tallahassee', largestCity: 'Jacksonville', population: '22,610,726', description: 'Florida has one of the largest bars in the country with over 110,000 attorneys, driven by personal injury, real estate, and immigration law.', attorneysEstimate: 110000, cities: ['jacksonville', 'miami', 'tampa', 'orlando', 'st-petersburg', 'hialeah', 'port-st-lucie', 'cape-coral', 'tallahassee', 'fort-lauderdale'] },
  { code: 'GA', slug: 'georgia', name: 'Georgia', region: 'South', capital: 'Atlanta', largestCity: 'Atlanta', population: '11,029,227', description: 'Georgia legal market is dominated by Atlanta, a major hub for corporate law, entertainment law, and civil rights litigation.', attorneysEstimate: 28000, cities: ['atlanta', 'augusta', 'columbus', 'savannah', 'athens', 'sandy-springs', 'roswell', 'johns-creek', 'albany', 'warner-robins'] },
  { code: 'HI', slug: 'hawaii', name: 'Hawaii', region: 'West', capital: 'Honolulu', largestCity: 'Honolulu', population: '1,435,138', description: 'Hawaii has a compact legal market with specialization in real estate, tourism law, and native Hawaiian rights.', attorneysEstimate: 4000, cities: ['honolulu'] },
  { code: 'ID', slug: 'idaho', name: 'Idaho', region: 'West', capital: 'Boise', largestCity: 'Boise', population: '1,964,726', description: 'Idaho is a fast-growing state with increasing demand for real estate, water rights, and business attorneys.', attorneysEstimate: 3800, cities: ['boise', 'meridian', 'nampa', 'idaho-falls', 'pocatello'] },
  { code: 'IL', slug: 'illinois', name: 'Illinois', region: 'Midwest', capital: 'Springfield', largestCity: 'Chicago', population: '12,549,689', description: 'Illinois is home to Chicago, one of the largest legal markets in the world, with top firms in corporate, litigation, and IP law.', attorneysEstimate: 65000, cities: ['chicago', 'aurora', 'joliet', 'naperville', 'rockford', 'elgin', 'springfield', 'peoria', 'champaign', 'waukegan'] },
  { code: 'IN', slug: 'indiana', name: 'Indiana', region: 'Midwest', capital: 'Indianapolis', largestCity: 'Indianapolis', population: '6,862,199', description: 'Indiana legal market centers on Indianapolis with strong demand in insurance defense, personal injury, and family law.', attorneysEstimate: 15000, cities: ['indianapolis', 'fort-wayne', 'evansville', 'south-bend', 'carmel', 'fishers', 'bloomington', 'hammond', 'gary', 'lafayette'] },
  { code: 'IA', slug: 'iowa', name: 'Iowa', region: 'Midwest', capital: 'Des Moines', largestCity: 'Des Moines', population: '3,207,004', description: 'Iowa has a stable legal market with strong agricultural law, insurance, and business litigation practices.', attorneysEstimate: 7500, cities: ['des-moines', 'cedar-rapids', 'davenport', 'sioux-city', 'iowa-city'] },
  { code: 'KS', slug: 'kansas', name: 'Kansas', region: 'Midwest', capital: 'Topeka', largestCity: 'Wichita', population: '2,940,546', description: 'Kansas legal market is split between Wichita and the Kansas City metro area with aviation and agricultural law specialties.', attorneysEstimate: 8000, cities: ['wichita', 'overland-park', 'kansas-city', 'olathe', 'topeka'] },
  { code: 'KY', slug: 'kentucky', name: 'Kentucky', region: 'South', capital: 'Frankfort', largestCity: 'Louisville', population: '4,526,154', description: 'Kentucky legal market centers on Louisville and Lexington with strong demand for personal injury and equine law.', attorneysEstimate: 11000, cities: ['louisville', 'lexington', 'bowling-green', 'owensboro', 'covington'] },
  { code: 'LA', slug: 'louisiana', name: 'Louisiana', region: 'South', capital: 'Baton Rouge', largestCity: 'New Orleans', population: '4,573,749', description: 'Louisiana operates under a unique civil law system based on French and Spanish law, making its legal market distinctive.', attorneysEstimate: 12000, cities: ['new-orleans', 'baton-rouge', 'shreveport', 'metairie', 'lafayette'] },
  { code: 'ME', slug: 'maine', name: 'Maine', region: 'Northeast', capital: 'Augusta', largestCity: 'Portland', population: '1,395,722', description: 'Maine has a small legal market with specialization in maritime law, real estate, and environmental law.', attorneysEstimate: 3500, cities: ['portland', 'lewiston', 'bangor'] },
  { code: 'MD', slug: 'maryland', name: 'Maryland', region: 'South', capital: 'Annapolis', largestCity: 'Baltimore', population: '6,180,253', description: 'Maryland benefits from proximity to DC with strong government contracts, health care, and cybersecurity law practices.', attorneysEstimate: 22000, cities: ['baltimore', 'columbia', 'germantown', 'silver-spring', 'waldorf', 'frederick', 'ellicott-city', 'rockville', 'bethesda', 'dundalk'] },
  { code: 'MA', slug: 'massachusetts', name: 'Massachusetts', region: 'Northeast', capital: 'Boston', largestCity: 'Boston', population: '7,001,399', description: 'Massachusetts is a premier legal market anchored by Boston, with world-class firms in biotech, IP, and higher education law.', attorneysEstimate: 38000, cities: ['boston', 'worcester', 'springfield', 'cambridge', 'lowell', 'brockton', 'new-bedford', 'quincy', 'lynn', 'fall-river'] },
  { code: 'MI', slug: 'michigan', name: 'Michigan', region: 'Midwest', capital: 'Lansing', largestCity: 'Detroit', population: '10,037,261', description: 'Michigan legal market is anchored by Detroit with specialization in automotive, manufacturing, and labor law.', attorneysEstimate: 23000, cities: ['detroit', 'grand-rapids', 'warren', 'sterling-heights', 'ann-arbor', 'lansing', 'flint', 'dearborn', 'livonia', 'troy'] },
  { code: 'MN', slug: 'minnesota', name: 'Minnesota', region: 'Midwest', capital: 'Saint Paul', largestCity: 'Minneapolis', population: '5,737,915', description: 'Minnesota has a strong legal market centered in Minneapolis-Saint Paul with expertise in corporate, health care, and IP law.', attorneysEstimate: 24000, cities: ['minneapolis', 'saint-paul', 'rochester', 'bloomington', 'duluth', 'brooklyn-park', 'plymouth', 'maple-grove', 'woodbury', 'st-cloud'] },
  { code: 'MS', slug: 'mississippi', name: 'Mississippi', region: 'South', capital: 'Jackson', largestCity: 'Jackson', population: '2,939,690', description: 'Mississippi has a notable plaintiff-friendly legal environment with strong personal injury and mass tort practices.', attorneysEstimate: 5500, cities: ['jackson', 'gulfport', 'southaven', 'hattiesburg', 'biloxi'] },
  { code: 'MO', slug: 'missouri', name: 'Missouri', region: 'Midwest', capital: 'Jefferson City', largestCity: 'Kansas City', population: '6,196,156', description: 'Missouri has two major legal markets in Kansas City and St. Louis with strong litigation and corporate practices.', attorneysEstimate: 19000, cities: ['kansas-city-mo', 'st-louis', 'springfield-mo', 'columbia-mo', 'independence'] },
  { code: 'MT', slug: 'montana', name: 'Montana', region: 'West', capital: 'Helena', largestCity: 'Billings', population: '1,132,812', description: 'Montana has a small legal market with specialization in natural resources, water rights, and Native American law.', attorneysEstimate: 3000, cities: ['billings', 'missoula', 'great-falls', 'bozeman', 'helena'] },
  { code: 'NE', slug: 'nebraska', name: 'Nebraska', region: 'Midwest', capital: 'Lincoln', largestCity: 'Omaha', population: '1,978,379', description: 'Nebraska legal market centers on Omaha with strong insurance, agricultural, and railroad law practices.', attorneysEstimate: 6500, cities: ['omaha', 'lincoln', 'bellevue', 'grand-island'] },
  { code: 'NV', slug: 'nevada', name: 'Nevada', region: 'West', capital: 'Carson City', largestCity: 'Las Vegas', population: '3,194,176', description: 'Nevada legal market is dominated by Las Vegas with specialization in gaming, entertainment, bankruptcy, and personal injury law.', attorneysEstimate: 8500, cities: ['las-vegas', 'henderson', 'reno', 'north-las-vegas', 'sparks', 'carson-city'] },
  { code: 'NH', slug: 'new-hampshire', name: 'New Hampshire', region: 'Northeast', capital: 'Concord', largestCity: 'Manchester', population: '1,402,054', description: 'New Hampshire has a small but active legal market with no sales or income tax attracting business law practices.', attorneysEstimate: 4500, cities: ['manchester', 'nashua', 'concord'] },
  { code: 'NJ', slug: 'new-jersey', name: 'New Jersey', region: 'Northeast', capital: 'Trenton', largestCity: 'Newark', population: '9,290,841', description: 'New Jersey has one of the densest legal markets in the country with strong pharmaceutical, corporate, and litigation practices.', attorneysEstimate: 42000, cities: ['newark', 'jersey-city', 'paterson', 'elizabeth', 'lakewood', 'edison', 'woodbridge', 'toms-river', 'hamilton', 'trenton'] },
  { code: 'NM', slug: 'new-mexico', name: 'New Mexico', region: 'West', capital: 'Santa Fe', largestCity: 'Albuquerque', population: '2,114,371', description: 'New Mexico legal market features Native American law, energy law, and a growing tech sector in Albuquerque.', attorneysEstimate: 5000, cities: ['albuquerque', 'las-cruces', 'rio-rancho', 'santa-fe', 'roswell'] },
  { code: 'NY', slug: 'new-york', name: 'New York', region: 'Northeast', capital: 'Albany', largestCity: 'New York City', population: '19,571,216', description: 'New York has the largest bar in the United States with nearly 188,000 active attorneys. New York City is the global center of corporate, finance, and international law.', attorneysEstimate: 188000, cities: ['new-york', 'buffalo', 'rochester', 'yonkers', 'syracuse', 'albany', 'new-rochelle', 'mount-vernon', 'schenectady', 'utica'] },
  { code: 'NC', slug: 'north-carolina', name: 'North Carolina', region: 'South', capital: 'Raleigh', largestCity: 'Charlotte', population: '10,835,491', description: 'North Carolina has a growing legal market with Charlotte as a banking hub and the Research Triangle driving IP and tech law.', attorneysEstimate: 21000, cities: ['charlotte', 'raleigh', 'greensboro', 'durham', 'winston-salem', 'fayetteville', 'cary', 'wilmington', 'high-point', 'asheville'] },
  { code: 'ND', slug: 'north-dakota', name: 'North Dakota', region: 'Midwest', capital: 'Bismarck', largestCity: 'Fargo', population: '783,926', description: 'North Dakota has a small legal market with energy law driving demand due to the Bakken oil formation.', attorneysEstimate: 2000, cities: ['fargo', 'bismarck', 'grand-forks', 'minot'] },
  { code: 'OH', slug: 'ohio', name: 'Ohio', region: 'Midwest', capital: 'Columbus', largestCity: 'Columbus', population: '11,785,935', description: 'Ohio has a large legal market spread across Columbus, Cleveland, and Cincinnati with strong corporate and litigation practices.', attorneysEstimate: 35000, cities: ['columbus', 'cleveland', 'cincinnati', 'toledo', 'akron', 'dayton', 'parma', 'canton', 'youngstown', 'lorain'] },
  { code: 'OK', slug: 'oklahoma', name: 'Oklahoma', region: 'South', capital: 'Oklahoma City', largestCity: 'Oklahoma City', population: '4,053,824', description: 'Oklahoma legal market features energy law, Native American law, and personal injury practices.', attorneysEstimate: 9500, cities: ['oklahoma-city', 'tulsa', 'norman', 'broken-arrow', 'edmond', 'lawton'] },
  { code: 'OR', slug: 'oregon', name: 'Oregon', region: 'West', capital: 'Salem', largestCity: 'Portland', population: '4,233,358', description: 'Oregon legal market centers on Portland with growing tech, environmental, and cannabis law practices.', attorneysEstimate: 14000, cities: ['portland', 'salem', 'eugene', 'gresham', 'hillsboro', 'bend', 'beaverton', 'medford', 'springfield-or', 'corvallis'] },
  { code: 'PA', slug: 'pennsylvania', name: 'Pennsylvania', region: 'Northeast', capital: 'Harrisburg', largestCity: 'Philadelphia', population: '12,961,683', description: 'Pennsylvania has two major legal markets: Philadelphia (plaintiff-friendly, pharmaceutical) and Pittsburgh (corporate, energy).', attorneysEstimate: 50000, cities: ['philadelphia', 'pittsburgh', 'allentown', 'reading', 'erie', 'harrisburg', 'lancaster', 'scranton', 'bethlehem', 'york'] },
  { code: 'RI', slug: 'rhode-island', name: 'Rhode Island', region: 'Northeast', capital: 'Providence', largestCity: 'Providence', population: '1,095,962', description: 'Rhode Island has a small but active legal market centered in Providence with strong maritime and personal injury practices.', attorneysEstimate: 3500, cities: ['providence', 'warwick', 'cranston', 'pawtucket'] },
  { code: 'SC', slug: 'south-carolina', name: 'South Carolina', region: 'South', capital: 'Columbia', largestCity: 'Charleston', population: '5,373,555', description: 'South Carolina has a growing legal market with Charleston and Columbia driving demand in real estate, tourism, and personal injury law.', attorneysEstimate: 13000, cities: ['charleston', 'columbia', 'north-charleston', 'mount-pleasant', 'rock-hill', 'greenville', 'summerville', 'goose-creek', 'hilton-head-island'] },
  { code: 'SD', slug: 'south-dakota', name: 'South Dakota', region: 'Midwest', capital: 'Pierre', largestCity: 'Sioux Falls', population: '919,318', description: 'South Dakota has a small legal market with specialization in banking, credit card, and Native American law.', attorneysEstimate: 2500, cities: ['sioux-falls', 'rapid-city', 'aberdeen'] },
  { code: 'TN', slug: 'tennessee', name: 'Tennessee', region: 'South', capital: 'Nashville', largestCity: 'Nashville', population: '7,126,489', description: 'Tennessee has a dynamic legal market with Nashville growing rapidly in health care, entertainment, and corporate law.', attorneysEstimate: 17000, cities: ['nashville', 'memphis', 'knoxville', 'chattanooga', 'clarksville', 'murfreesboro', 'franklin'] },
  { code: 'TX', slug: 'texas', name: 'Texas', region: 'South', capital: 'Austin', largestCity: 'Houston', population: '30,503,340', description: 'Texas has one of the largest and fastest-growing legal markets with major hubs in Houston (energy), Dallas (corporate), Austin (tech), and San Antonio.', attorneysEstimate: 105000, cities: ['houston', 'san-antonio', 'dallas', 'austin', 'fort-worth', 'el-paso', 'arlington', 'corpus-christi', 'plano', 'laredo', 'lubbock', 'garland', 'irving', 'amarillo', 'grand-prairie', 'brownsville', 'mckinney', 'frisco', 'pasadena', 'killeen'] },
  { code: 'UT', slug: 'utah', name: 'Utah', region: 'West', capital: 'Salt Lake City', largestCity: 'Salt Lake City', population: '3,417,734', description: 'Utah has a growing legal market centered in Salt Lake City with strong tech, IP, and business law practices.', attorneysEstimate: 9000, cities: ['salt-lake-city', 'west-valley-city', 'provo', 'west-jordan', 'orem', 'sandy', 'ogden', 'st-george', 'layton', 'south-jordan'] },
  { code: 'VT', slug: 'vermont', name: 'Vermont', region: 'Northeast', capital: 'Montpelier', largestCity: 'Burlington', population: '647,464', description: 'Vermont has the smallest legal market in New England with focus on environmental, land use, and family law.', attorneysEstimate: 2000, cities: ['burlington', 'south-burlington', 'rutland'] },
  { code: 'VA', slug: 'virginia', name: 'Virginia', region: 'South', capital: 'Richmond', largestCity: 'Virginia Beach', population: '8,683,619', description: 'Virginia benefits from proximity to DC with strong government, defense, technology, and patent law practices in Northern Virginia.', attorneysEstimate: 30000, cities: ['virginia-beach', 'norfolk', 'chesapeake', 'richmond', 'newport-news', 'alexandria', 'hampton', 'roanoke', 'portsmouth', 'suffolk', 'lynchburg', 'arlington-va'] },
  { code: 'WA', slug: 'washington', name: 'Washington', region: 'West', capital: 'Olympia', largestCity: 'Seattle', population: '7,812,880', description: 'Washington legal market centers on Seattle, a major tech hub driving demand for IP, employment, and corporate law.', attorneysEstimate: 27000, cities: ['seattle', 'spokane', 'tacoma', 'vancouver', 'bellevue', 'kent', 'everett', 'renton', 'spokane-valley', 'federal-way'] },
  { code: 'WV', slug: 'west-virginia', name: 'West Virginia', region: 'South', capital: 'Charleston', largestCity: 'Charleston', population: '1,770,071', description: 'West Virginia has a plaintiff-friendly legal environment with strong mass tort and personal injury practices.', attorneysEstimate: 4000, cities: ['charleston-wv', 'huntington', 'morgantown', 'parkersburg', 'wheeling'] },
  { code: 'WI', slug: 'wisconsin', name: 'Wisconsin', region: 'Midwest', capital: 'Madison', largestCity: 'Milwaukee', population: '5,910,955', description: 'Wisconsin legal market is split between Milwaukee and Madison with strong insurance, manufacturing, and IP practices.', attorneysEstimate: 16000, cities: ['milwaukee', 'madison', 'green-bay', 'kenosha', 'racine', 'appleton', 'waukesha', 'oshkosh', 'eau-claire', 'janesville'] },
  { code: 'WY', slug: 'wyoming', name: 'Wyoming', region: 'West', capital: 'Cheyenne', largestCity: 'Cheyenne', population: '584,057', description: 'Wyoming has the smallest bar in the nation with specialization in energy, ranching, and water rights law.', attorneysEstimate: 1500, cities: ['cheyenne', 'casper', 'laramie', 'gillette'] },
]

// ============================================================================
// Top 500 US Cities by Population (2024 Census estimates)
// ============================================================================
export const cities: City[] = [
  { slug: 'new-york', name: 'New York', stateCode: 'NY', stateName: 'New York', county: 'New York County', population: '8,258,035', zipCode: '10001', description: 'The largest city in the United States and the global center of finance, law, and commerce. Home to more attorneys than any other city in the world.', neighborhoods: ['Manhattan', 'Brooklyn', 'Queens', 'Bronx', 'Staten Island', 'Midtown', 'SoHo', 'Tribeca', 'Upper East Side', 'Upper West Side', 'Harlem', 'Chelsea', 'Greenwich Village', 'Financial District', 'Williamsburg'], latitude: 40.7128, longitude: -74.0060, metroArea: 'New York-Newark-Jersey City' },
  { slug: 'los-angeles', name: 'Los Angeles', stateCode: 'CA', stateName: 'California', county: 'Los Angeles County', population: '3,820,914', zipCode: '90001', description: 'The second-largest city in the US and a major legal market for entertainment, immigration, and personal injury law.', neighborhoods: ['Downtown', 'Hollywood', 'Beverly Hills', 'Santa Monica', 'Venice', 'Brentwood', 'Westwood', 'Silver Lake', 'Echo Park', 'Koreatown', 'Century City', 'West Hollywood', 'Culver City'], latitude: 34.0522, longitude: -118.2437, metroArea: 'Los Angeles-Long Beach-Anaheim' },
  { slug: 'chicago', name: 'Chicago', stateCode: 'IL', stateName: 'Illinois', county: 'Cook County', population: '2,665,039', zipCode: '60601', description: 'The third-largest city in the US, Chicago is a major legal hub with world-class firms in corporate, litigation, and IP law.', neighborhoods: ['The Loop', 'River North', 'Lincoln Park', 'Wicker Park', 'Hyde Park', 'Gold Coast', 'Lakeview', 'Logan Square', 'West Loop', 'Streeterville', 'Old Town', 'Pilsen'], latitude: 41.8781, longitude: -87.6298, metroArea: 'Chicago-Naperville-Elgin' },
  { slug: 'houston', name: 'Houston', stateCode: 'TX', stateName: 'Texas', county: 'Harris County', population: '2,314,157', zipCode: '77001', description: 'The fourth-largest US city and the energy capital of the world, driving demand for energy, maritime, and corporate attorneys.', neighborhoods: ['Downtown', 'Midtown', 'Montrose', 'The Heights', 'River Oaks', 'Galleria', 'Memorial', 'Medical Center', 'Uptown', 'EaDo', 'Rice Village', 'Katy'], latitude: 29.7604, longitude: -95.3698, metroArea: 'Houston-The Woodlands-Sugar Land' },
  { slug: 'phoenix', name: 'Phoenix', stateCode: 'AZ', stateName: 'Arizona', county: 'Maricopa County', population: '1,650,070', zipCode: '85001', description: 'The fifth-largest US city and one of the fastest-growing legal markets in the country.', neighborhoods: ['Downtown', 'Scottsdale', 'Tempe', 'Arcadia', 'Biltmore', 'Camelback East', 'Paradise Valley', 'Ahwatukee', 'North Phoenix', 'Central Phoenix'], latitude: 33.4484, longitude: -112.0740, metroArea: 'Phoenix-Mesa-Chandler' },
  { slug: 'philadelphia', name: 'Philadelphia', stateCode: 'PA', stateName: 'Pennsylvania', county: 'Philadelphia County', population: '1,550,542', zipCode: '19101', description: 'The sixth-largest US city with one of the most plaintiff-friendly court systems in the nation, driving pharmaceutical and personal injury litigation.', neighborhoods: ['Center City', 'Old City', 'Rittenhouse Square', 'University City', 'Northern Liberties', 'Fishtown', 'South Philly', 'Manayunk', 'Chestnut Hill', 'Fairmount'], latitude: 39.9526, longitude: -75.1652, metroArea: 'Philadelphia-Camden-Wilmington' },
  { slug: 'san-antonio', name: 'San Antonio', stateCode: 'TX', stateName: 'Texas', county: 'Bexar County', population: '1,495,295', zipCode: '78201', description: 'A major Texas city with growing demand for personal injury, military law, and real estate attorneys.', neighborhoods: ['Downtown', 'Alamo Heights', 'Stone Oak', 'The Pearl', 'Southtown', 'Monte Vista', 'Olmos Park', 'Helotes', 'King William'], latitude: 29.4241, longitude: -98.4936, metroArea: 'San Antonio-New Braunfels' },
  { slug: 'san-diego', name: 'San Diego', stateCode: 'CA', stateName: 'California', county: 'San Diego County', population: '1,381,162', zipCode: '92101', description: 'A major Southern California city with strong military, biotech, and cross-border immigration law practices.', neighborhoods: ['Downtown', 'Gaslamp Quarter', 'La Jolla', 'Pacific Beach', 'Hillcrest', 'North Park', 'Mission Valley', 'Coronado', 'Del Mar', 'Point Loma'], latitude: 32.7157, longitude: -117.1611, metroArea: 'San Diego-Chula Vista-Carlsbad' },
  { slug: 'dallas', name: 'Dallas', stateCode: 'TX', stateName: 'Texas', county: 'Dallas County', population: '1,302,868', zipCode: '75201', description: 'A major business and legal hub in Texas with strong corporate, real estate, and energy law practices.', neighborhoods: ['Downtown', 'Uptown', 'Deep Ellum', 'Bishop Arts', 'Oak Lawn', 'Highland Park', 'Lakewood', 'Preston Hollow', 'Victory Park', 'Design District'], latitude: 32.7767, longitude: -96.7970, metroArea: 'Dallas-Fort Worth-Arlington' },
  { slug: 'san-jose', name: 'San Jose', stateCode: 'CA', stateName: 'California', county: 'Santa Clara County', population: '971,233', zipCode: '95101', description: 'The capital of Silicon Valley, driving massive demand for IP, tech, and venture capital attorneys.', neighborhoods: ['Downtown', 'Willow Glen', 'Santana Row', 'Japantown', 'Rose Garden', 'Almaden Valley', 'Evergreen', 'Cambrian'], latitude: 37.3382, longitude: -121.8863, metroArea: 'San Jose-Sunnyvale-Santa Clara' },
  { slug: 'austin', name: 'Austin', stateCode: 'TX', stateName: 'Texas', county: 'Travis County', population: '979,882', zipCode: '73301', description: 'The Texas capital and a booming tech hub, driving demand for startup, IP, and employment law attorneys.', neighborhoods: ['Downtown', 'South Congress', 'East Austin', 'Hyde Park', 'Zilker', 'Mueller', 'Domain', 'Barton Hills', 'Clarksville', 'Rainey Street'], latitude: 30.2672, longitude: -97.7431, metroArea: 'Austin-Round Rock-Georgetown' },
  { slug: 'jacksonville', name: 'Jacksonville', stateCode: 'FL', stateName: 'Florida', county: 'Duval County', population: '985,843', zipCode: '32099', description: 'The largest city by area in the contiguous US with strong military, insurance, and personal injury law practices.', neighborhoods: ['Downtown', 'Riverside', 'San Marco', 'Avondale', 'Springfield', 'Beaches', 'Mandarin', 'Southside'], latitude: 30.3322, longitude: -81.6557, metroArea: 'Jacksonville' },
  { slug: 'fort-worth', name: 'Fort Worth', stateCode: 'TX', stateName: 'Texas', county: 'Tarrant County', population: '978,468', zipCode: '76101', description: 'Part of the Dallas-Fort Worth metroplex with a growing legal market in energy, real estate, and family law.', neighborhoods: ['Downtown', 'Sundance Square', 'Near Southside', 'Stockyards', 'TCU', 'Cultural District', 'Westover Hills'], latitude: 32.7555, longitude: -97.3308, metroArea: 'Dallas-Fort Worth-Arlington' },
  { slug: 'columbus', name: 'Columbus', stateCode: 'OH', stateName: 'Ohio', county: 'Franklin County', population: '913,175', zipCode: '43201', description: 'Ohio state capital with a growing legal market driven by insurance, government, and tech sectors.', neighborhoods: ['Downtown', 'Short North', 'German Village', 'Clintonville', 'Grandview Heights', 'Victorian Village', 'Italian Village', 'Bexley'], latitude: 39.9612, longitude: -82.9988, metroArea: 'Columbus' },
  { slug: 'charlotte', name: 'Charlotte', stateCode: 'NC', stateName: 'North Carolina', county: 'Mecklenburg County', population: '911,311', zipCode: '28201', description: 'The second-largest banking center in the US after New York, driving demand for financial, corporate, and real estate attorneys.', neighborhoods: ['Uptown', 'South End', 'NoDa', 'Plaza Midwood', 'Dilworth', 'Myers Park', 'Ballantyne', 'University City'], latitude: 35.2271, longitude: -80.8431, metroArea: 'Charlotte-Concord-Gastonia' },
  { slug: 'indianapolis', name: 'Indianapolis', stateCode: 'IN', stateName: 'Indiana', county: 'Marion County', population: '882,039', zipCode: '46201', description: 'Indiana state capital and a major insurance industry center, driving demand for insurance defense and corporate attorneys.', neighborhoods: ['Downtown', 'Mass Ave', 'Broad Ripple', 'Fountain Square', 'Irvington', 'Meridian-Kessler', 'Speedway', 'Carmel'], latitude: 39.7684, longitude: -86.1581, metroArea: 'Indianapolis-Carmel-Anderson' },
  { slug: 'san-francisco', name: 'San Francisco', stateCode: 'CA', stateName: 'California', county: 'San Francisco County', population: '808,437', zipCode: '94102', description: 'A global center for tech law, venture capital, and IP litigation. Home to numerous prestigious law firms.', neighborhoods: ['Financial District', 'SoMa', 'Marina', 'Pacific Heights', 'Mission', 'Castro', 'Noe Valley', 'Hayes Valley', 'Richmond', 'Sunset', 'North Beach', 'Chinatown'], latitude: 37.7749, longitude: -122.4194, metroArea: 'San Francisco-Oakland-Berkeley' },
  { slug: 'seattle', name: 'Seattle', stateCode: 'WA', stateName: 'Washington', county: 'King County', population: '755,078', zipCode: '98101', description: 'A major tech hub driving demand for IP, employment, and corporate attorneys. Home to Amazon and Microsoft legal operations.', neighborhoods: ['Downtown', 'Capitol Hill', 'Ballard', 'Fremont', 'Queen Anne', 'University District', 'Wallingford', 'West Seattle', 'Georgetown', 'Beacon Hill'], latitude: 47.6062, longitude: -122.3321, metroArea: 'Seattle-Tacoma-Bellevue' },
  { slug: 'denver', name: 'Denver', stateCode: 'CO', stateName: 'Colorado', county: 'Denver County', population: '713,252', zipCode: '80201', description: 'Colorado capital with a thriving legal market in energy, cannabis, real estate, and tech law.', neighborhoods: ['Downtown', 'LoDo', 'RiNo', 'Cherry Creek', 'Capitol Hill', 'Highlands', 'Washington Park', 'Baker', 'Five Points', 'Sloan Lake'], latitude: 39.7392, longitude: -104.9903, metroArea: 'Denver-Aurora-Lakewood' },
  { slug: 'washington', name: 'Washington', stateCode: 'DC', stateName: 'District of Columbia', county: 'District of Columbia', population: '678,972', zipCode: '20001', description: 'The nation\'s capital with the highest concentration of attorneys per capita. Center for government, regulatory, and international law.', neighborhoods: ['Downtown', 'Georgetown', 'Dupont Circle', 'Capitol Hill', 'Adams Morgan', 'Foggy Bottom', 'Shaw', 'Logan Circle', 'Navy Yard', 'NoMa', 'Tenleytown', 'Cleveland Park'], latitude: 38.9072, longitude: -77.0369, metroArea: 'Washington-Arlington-Alexandria' },
  { slug: 'nashville', name: 'Nashville', stateCode: 'TN', stateName: 'Tennessee', county: 'Davidson County', population: '683,622', zipCode: '37201', description: 'One of the fastest-growing cities in the US with booming health care, entertainment, and real estate law markets.', neighborhoods: ['Downtown', 'The Gulch', 'East Nashville', 'Germantown', '12 South', 'Midtown', 'Music Row', 'Sylvan Park', 'Berry Hill', 'Green Hills'], latitude: 36.1627, longitude: -86.7816, metroArea: 'Nashville-Davidson-Murfreesboro-Franklin' },
  { slug: 'oklahoma-city', name: 'Oklahoma City', stateCode: 'OK', stateName: 'Oklahoma', county: 'Oklahoma County', population: '702,767', zipCode: '73101', description: 'Oklahoma state capital with strong energy law, tribal law, and personal injury practices.', neighborhoods: ['Downtown', 'Bricktown', 'Midtown', 'Paseo', 'Plaza District', 'Automobile Alley', 'Deep Deuce', 'Heritage Hills'], latitude: 35.4676, longitude: -97.5164, metroArea: 'Oklahoma City' },
  { slug: 'el-paso', name: 'El Paso', stateCode: 'TX', stateName: 'Texas', county: 'El Paso County', population: '678,815', zipCode: '79901', description: 'A major border city driving demand for immigration, cross-border trade, and criminal defense attorneys.', neighborhoods: ['Downtown', 'Westside', 'Eastside', 'Central', 'Mission Valley', 'Upper Valley'], latitude: 31.7619, longitude: -106.4850, metroArea: 'El Paso' },
  { slug: 'boston', name: 'Boston', stateCode: 'MA', stateName: 'Massachusetts', county: 'Suffolk County', population: '654,776', zipCode: '02101', description: 'A premier legal market with world-class firms in biotech, higher education, financial services, and IP law.', neighborhoods: ['Downtown', 'Back Bay', 'Beacon Hill', 'South End', 'North End', 'Seaport', 'Fenway', 'Jamaica Plain', 'Charlestown', 'Cambridge', 'Somerville', 'Brookline'], latitude: 42.3601, longitude: -71.0589, metroArea: 'Boston-Cambridge-Newton' },
  { slug: 'portland', name: 'Portland', stateCode: 'OR', stateName: 'Oregon', county: 'Multnomah County', population: '635,067', zipCode: '97201', description: 'Oregon\'s largest city with growing tech, environmental, and cannabis law practices.', neighborhoods: ['Downtown', 'Pearl District', 'Alberta', 'Hawthorne', 'Division', 'Mississippi', 'Sellwood', 'Nob Hill', 'Lloyd District', 'St. Johns'], latitude: 45.5152, longitude: -122.6784, metroArea: 'Portland-Vancouver-Hillsboro' },
  { slug: 'las-vegas', name: 'Las Vegas', stateCode: 'NV', stateName: 'Nevada', county: 'Clark County', population: '660,929', zipCode: '89101', description: 'Entertainment capital of the world with strong gaming, hospitality, bankruptcy, and personal injury law practices.', neighborhoods: ['Downtown', 'The Strip', 'Summerlin', 'Henderson', 'Spring Valley', 'Green Valley', 'Centennial Hills', 'Arts District'], latitude: 36.1699, longitude: -115.1398, metroArea: 'Las Vegas-Henderson-Paradise' },
  { slug: 'memphis', name: 'Memphis', stateCode: 'TN', stateName: 'Tennessee', county: 'Shelby County', population: '621,056', zipCode: '38101', description: 'A major logistics hub with strong personal injury, criminal defense, and employment law practices.', neighborhoods: ['Downtown', 'Midtown', 'Cooper-Young', 'East Memphis', 'Germantown', 'Collierville', 'Overton Park'], latitude: 35.1495, longitude: -90.0490, metroArea: 'Memphis' },
  { slug: 'louisville', name: 'Louisville', stateCode: 'KY', stateName: 'Kentucky', county: 'Jefferson County', population: '633,045', zipCode: '40201', description: 'Kentucky\'s largest city with a strong legal market in personal injury, health care, and equine law.', neighborhoods: ['Downtown', 'NuLu', 'Highlands', 'Old Louisville', 'St. Matthews', 'Germantown', 'Butchertown', 'Crescent Hill'], latitude: 38.2527, longitude: -85.7585, metroArea: 'Louisville/Jefferson County' },
  { slug: 'baltimore', name: 'Baltimore', stateCode: 'MD', stateName: 'Maryland', county: 'Baltimore City', population: '569,931', zipCode: '21201', description: 'Maryland\'s largest city with strong health care, personal injury, and criminal defense law practices.', neighborhoods: ['Inner Harbor', 'Fells Point', 'Canton', 'Federal Hill', 'Mount Vernon', 'Harbor East', 'Hampden', 'Charles Village'], latitude: 39.2904, longitude: -76.6122, metroArea: 'Baltimore-Columbia-Towson' },
  { slug: 'milwaukee', name: 'Milwaukee', stateCode: 'WI', stateName: 'Wisconsin', county: 'Milwaukee County', population: '563,305', zipCode: '53201', description: 'Wisconsin\'s largest city with strong insurance, manufacturing, and IP law practices.', neighborhoods: ['Downtown', 'Third Ward', 'East Side', 'Bay View', 'Walker\'s Point', 'Shorewood', 'Wauwatosa', 'Riverwest'], latitude: 43.0389, longitude: -87.9065, metroArea: 'Milwaukee-Waukesha' },
  { slug: 'albuquerque', name: 'Albuquerque', stateCode: 'NM', stateName: 'New Mexico', county: 'Bernalillo County', population: '564,559', zipCode: '87101', description: 'New Mexico\'s largest city with specialization in Native American law, personal injury, and DUI defense.', neighborhoods: ['Downtown', 'Old Town', 'Nob Hill', 'North Valley', 'Uptown', 'West Side', 'Northeast Heights'], latitude: 35.0844, longitude: -106.6504, metroArea: 'Albuquerque' },
  { slug: 'tucson', name: 'Tucson', stateCode: 'AZ', stateName: 'Arizona', county: 'Pima County', population: '546,574', zipCode: '85701', description: 'Arizona\'s second-largest city near the Mexican border with strong immigration and personal injury practices.', neighborhoods: ['Downtown', 'University', 'Fourth Avenue', 'Sam Hughes', 'El Presidio', 'Armory Park', 'Catalina Foothills'], latitude: 32.2226, longitude: -110.9747, metroArea: 'Tucson' },
  { slug: 'fresno', name: 'Fresno', stateCode: 'CA', stateName: 'California', county: 'Fresno County', population: '545,567', zipCode: '93701', description: 'California\'s agricultural hub with strong agricultural, immigration, and personal injury law practices.', neighborhoods: ['Downtown', 'Tower District', 'Fig Garden', 'Woodward Park', 'Clovis'], latitude: 36.7378, longitude: -119.7871, metroArea: 'Fresno' },
  { slug: 'sacramento', name: 'Sacramento', stateCode: 'CA', stateName: 'California', county: 'Sacramento County', population: '528,001', zipCode: '95801', description: 'California\'s state capital with strong government, lobbying, and regulatory law practices.', neighborhoods: ['Downtown', 'Midtown', 'East Sacramento', 'Land Park', 'Curtis Park', 'Oak Park', 'Natomas', 'Arden-Arcade'], latitude: 38.5816, longitude: -121.4944, metroArea: 'Sacramento-Roseville-Folsom' },
  { slug: 'mesa', name: 'Mesa', stateCode: 'AZ', stateName: 'Arizona', county: 'Maricopa County', population: '511,648', zipCode: '85201', description: 'A major Phoenix suburb with growing demand for family law, real estate, and personal injury attorneys.', neighborhoods: ['Downtown', 'Eastmark', 'Superstition Springs', 'Red Mountain'], latitude: 33.4152, longitude: -111.8315, metroArea: 'Phoenix-Mesa-Chandler' },
  { slug: 'kansas-city-mo', name: 'Kansas City', stateCode: 'MO', stateName: 'Missouri', county: 'Jackson County', population: '508,090', zipCode: '64101', description: 'A bi-state metro area with strong corporate, litigation, and agricultural law practices.', neighborhoods: ['Downtown', 'Country Club Plaza', 'Westport', 'Crossroads', 'River Market', 'Brookside', 'Waldo', 'Power & Light'], latitude: 39.0997, longitude: -94.5786, metroArea: 'Kansas City' },
  { slug: 'atlanta', name: 'Atlanta', stateCode: 'GA', stateName: 'Georgia', county: 'Fulton County', population: '499,127', zipCode: '30301', description: 'A major legal hub for the Southeast with expertise in corporate law, entertainment, civil rights, and class action litigation.', neighborhoods: ['Downtown', 'Midtown', 'Buckhead', 'Virginia-Highland', 'Inman Park', 'Decatur', 'Old Fourth Ward', 'West Midtown', 'Poncey-Highland', 'Grant Park'], latitude: 33.7490, longitude: -84.3880, metroArea: 'Atlanta-Sandy Springs-Alpharetta' },
  { slug: 'omaha', name: 'Omaha', stateCode: 'NE', stateName: 'Nebraska', county: 'Douglas County', population: '492,374', zipCode: '68101', description: 'Nebraska\'s largest city with strong insurance, railroad, and corporate law practices. Home to Berkshire Hathaway.', neighborhoods: ['Downtown', 'Old Market', 'Dundee', 'Benson', 'Aksarben', 'Midtown'], latitude: 41.2565, longitude: -95.9345, metroArea: 'Omaha-Council Bluffs' },
  { slug: 'colorado-springs', name: 'Colorado Springs', stateCode: 'CO', stateName: 'Colorado', county: 'El Paso County', population: '491,275', zipCode: '80901', description: 'Home to multiple military installations driving demand for military law, family law, and personal injury attorneys.', neighborhoods: ['Downtown', 'Old Colorado City', 'Manitou Springs', 'Briargate', 'Broadmoor'], latitude: 38.8339, longitude: -104.8214, metroArea: 'Colorado Springs' },
  { slug: 'raleigh', name: 'Raleigh', stateCode: 'NC', stateName: 'North Carolina', county: 'Wake County', population: '482,295', zipCode: '27601', description: 'Part of the Research Triangle, driving demand for IP, tech, and biotech attorneys.', neighborhoods: ['Downtown', 'Glenwood South', 'North Hills', 'Cameron Village', 'Five Points', 'Oakwood', 'Mordecai'], latitude: 35.7796, longitude: -78.6382, metroArea: 'Raleigh-Cary' },
  { slug: 'long-beach', name: 'Long Beach', stateCode: 'CA', stateName: 'California', county: 'Los Angeles County', population: '466,742', zipCode: '90801', description: 'A major port city with strong maritime, trade, and personal injury law practices.', neighborhoods: ['Downtown', 'Belmont Shore', 'Naples', 'Bixby Knolls', 'Signal Hill'], latitude: 33.7701, longitude: -118.1937, metroArea: 'Los Angeles-Long Beach-Anaheim' },
  { slug: 'virginia-beach', name: 'Virginia Beach', stateCode: 'VA', stateName: 'Virginia', county: 'Virginia Beach City', population: '459,470', zipCode: '23450', description: 'Virginia\'s most populous city with strong military, real estate, and personal injury law practices.', neighborhoods: ['Oceanfront', 'Town Center', 'Hilltop', 'Great Neck', 'Sandbridge'], latitude: 36.8529, longitude: -75.9780, metroArea: 'Virginia Beach-Norfolk-Newport News' },
  { slug: 'miami', name: 'Miami', stateCode: 'FL', stateName: 'Florida', county: 'Miami-Dade County', population: '449,514', zipCode: '33101', description: 'A global city and gateway to Latin America with strong international, immigration, real estate, and white-collar crime law practices.', neighborhoods: ['Downtown', 'Brickell', 'Wynwood', 'Coral Gables', 'Coconut Grove', 'Little Havana', 'Design District', 'Edgewater', 'Midtown', 'South Beach', 'Key Biscayne'], latitude: 25.7617, longitude: -80.1918, metroArea: 'Miami-Fort Lauderdale-Pompano Beach' },
  { slug: 'oakland', name: 'Oakland', stateCode: 'CA', stateName: 'California', county: 'Alameda County', population: '430,553', zipCode: '94601', description: 'Part of the San Francisco Bay Area with growing tech, civil rights, and criminal defense law practices.', neighborhoods: ['Downtown', 'Jack London Square', 'Temescal', 'Rockridge', 'Lake Merritt', 'Piedmont', 'Montclair'], latitude: 37.8044, longitude: -122.2712, metroArea: 'San Francisco-Oakland-Berkeley' },
  { slug: 'minneapolis', name: 'Minneapolis', stateCode: 'MN', stateName: 'Minnesota', county: 'Hennepin County', population: '425,336', zipCode: '55401', description: 'Minnesota\'s largest city with strong corporate, IP, and health care law practices. Major Fortune 500 headquarters.', neighborhoods: ['Downtown', 'North Loop', 'Uptown', 'Northeast', 'Loring Park', 'Whittier', 'Dinkytown', 'Longfellow'], latitude: 44.9778, longitude: -93.2650, metroArea: 'Minneapolis-St. Paul-Bloomington' },
  { slug: 'tampa', name: 'Tampa', stateCode: 'FL', stateName: 'Florida', county: 'Hillsborough County', population: '403,364', zipCode: '33601', description: 'A growing Florida legal market with strong personal injury, real estate, and insurance defense practices.', neighborhoods: ['Downtown', 'Ybor City', 'Hyde Park', 'SoHo', 'Channelside', 'Seminole Heights', 'Westchase', 'Davis Islands'], latitude: 27.9506, longitude: -82.4572, metroArea: 'Tampa-St. Petersburg-Clearwater' },
  { slug: 'tulsa', name: 'Tulsa', stateCode: 'OK', stateName: 'Oklahoma', county: 'Tulsa County', population: '413,066', zipCode: '74101', description: 'Oklahoma\'s second-largest city with strong energy, tribal, and personal injury law practices.', neighborhoods: ['Downtown', 'Blue Dome', 'Cherry Street', 'Brookside', 'Midtown', 'Brady Arts'], latitude: 36.1540, longitude: -95.9928, metroArea: 'Tulsa' },
  { slug: 'arlington', name: 'Arlington', stateCode: 'TX', stateName: 'Texas', county: 'Tarrant County', population: '394,266', zipCode: '76010', description: 'Located between Dallas and Fort Worth with growing demand for family law and personal injury attorneys.', neighborhoods: ['Downtown', 'Entertainment District', 'North Arlington', 'South Arlington'], latitude: 32.7357, longitude: -97.1081, metroArea: 'Dallas-Fort Worth-Arlington' },
  { slug: 'new-orleans', name: 'New Orleans', stateCode: 'LA', stateName: 'Louisiana', county: 'Orleans Parish', population: '369,749', zipCode: '70112', description: 'Unique civil law jurisdiction with strong maritime, oil & gas, and personal injury law practices.', neighborhoods: ['French Quarter', 'Garden District', 'CBD', 'Uptown', 'Marigny', 'Bywater', 'Treme', 'Mid-City', 'Warehouse District'], latitude: 29.9511, longitude: -90.0715, metroArea: 'New Orleans-Metairie' },
  { slug: 'wichita', name: 'Wichita', stateCode: 'KS', stateName: 'Kansas', county: 'Sedgwick County', population: '397,532', zipCode: '67201', description: 'Kansas\'s largest city and aviation capital with strong aviation, manufacturing, and personal injury law practices.', neighborhoods: ['Downtown', 'Old Town', 'Delano', 'College Hill', 'Riverside'], latitude: 37.6872, longitude: -97.3301, metroArea: 'Wichita' },
  { slug: 'cleveland', name: 'Cleveland', stateCode: 'OH', stateName: 'Ohio', county: 'Cuyahoga County', population: '361,607', zipCode: '44101', description: 'A major Midwest legal market with strong health care, manufacturing, and class action litigation practices.', neighborhoods: ['Downtown', 'Ohio City', 'Tremont', 'University Circle', 'Detroit-Shoreway', 'Lakewood', 'Shaker Heights'], latitude: 41.4993, longitude: -81.6944, metroArea: 'Cleveland-Elyria' },
  { slug: 'bakersfield', name: 'Bakersfield', stateCode: 'CA', stateName: 'California', county: 'Kern County', population: '410,647', zipCode: '93301', description: 'California\'s oil and agricultural hub with strong energy, workers compensation, and personal injury practices.', neighborhoods: ['Downtown', 'Southwest', 'Northwest', 'Rosedale', 'Oleander'], latitude: 35.3733, longitude: -119.0187, metroArea: 'Bakersfield' },
  { slug: 'aurora', name: 'Aurora', stateCode: 'CO', stateName: 'Colorado', county: 'Arapahoe County', population: '395,282', zipCode: '80010', description: 'Part of the Denver metro area with growing demand for immigration, family law, and criminal defense attorneys.', neighborhoods: ['Original Aurora', 'Southlands', 'Fitzsimons'], latitude: 39.7294, longitude: -104.8319, metroArea: 'Denver-Aurora-Lakewood' },
  { slug: 'anaheim', name: 'Anaheim', stateCode: 'CA', stateName: 'California', county: 'Orange County', population: '346,824', zipCode: '92801', description: 'Home to Disneyland with strong tourism, entertainment, and business law practices.', neighborhoods: ['Downtown', 'Anaheim Hills', 'Platinum Triangle'], latitude: 33.8366, longitude: -117.9143, metroArea: 'Los Angeles-Long Beach-Anaheim' },
  { slug: 'honolulu', name: 'Honolulu', stateCode: 'HI', stateName: 'Hawaii', county: 'Honolulu County', population: '345,510', zipCode: '96801', description: 'Hawaii\'s capital with specialization in real estate, tourism, and military law.', neighborhoods: ['Downtown', 'Waikiki', 'Ala Moana', 'Kakaako', 'Manoa', 'Kailua', 'Hawaii Kai'], latitude: 21.3069, longitude: -157.8583, metroArea: 'Urban Honolulu' },
  { slug: 'santa-ana', name: 'Santa Ana', stateCode: 'CA', stateName: 'California', county: 'Orange County', population: '309,441', zipCode: '92701', description: 'Orange County seat with strong immigration, personal injury, and criminal defense practices.', neighborhoods: ['Downtown', 'South Coast Metro', 'Floral Park', 'Bristol Street'], latitude: 33.7455, longitude: -117.8677, metroArea: 'Los Angeles-Long Beach-Anaheim' },
  { slug: 'riverside', name: 'Riverside', stateCode: 'CA', stateName: 'California', county: 'Riverside County', population: '314,998', zipCode: '92501', description: 'Inland Empire hub with growing real estate, criminal defense, and family law practices.', neighborhoods: ['Downtown', 'Mission Inn', 'Canyon Crest', 'University', 'Arlington'], latitude: 33.9806, longitude: -117.3755, metroArea: 'Riverside-San Bernardino-Ontario' },
  { slug: 'corpus-christi', name: 'Corpus Christi', stateCode: 'TX', stateName: 'Texas', county: 'Nueces County', population: '317,863', zipCode: '78401', description: 'A Texas coastal city with strong maritime, energy, and personal injury law practices.', neighborhoods: ['Downtown', 'Southside', 'Flour Bluff', 'Calallen', 'Portland'], latitude: 27.8006, longitude: -97.3964, metroArea: 'Corpus Christi' },
  { slug: 'lexington', name: 'Lexington', stateCode: 'KY', stateName: 'Kentucky', county: 'Fayette County', population: '322,570', zipCode: '40502', description: 'Kentucky\'s second-largest city known for horse racing and bourbon with strong equine and agricultural law.', neighborhoods: ['Downtown', 'Chevy Chase', 'Hamburg', 'Beaumont', 'Tates Creek'], latitude: 38.0406, longitude: -84.5037, metroArea: 'Lexington-Fayette' },
  { slug: 'henderson', name: 'Henderson', stateCode: 'NV', stateName: 'Nevada', county: 'Clark County', population: '320,189', zipCode: '89002', description: 'Part of the Las Vegas metro with growing real estate and family law practices.', neighborhoods: ['Green Valley', 'Anthem', 'MacDonald Ranch', 'Seven Hills'], latitude: 36.0395, longitude: -114.9817, metroArea: 'Las Vegas-Henderson-Paradise' },
  { slug: 'stockton', name: 'Stockton', stateCode: 'CA', stateName: 'California', county: 'San Joaquin County', population: '320,804', zipCode: '95201', description: 'Central Valley city with growing personal injury, criminal defense, and immigration practices.', neighborhoods: ['Downtown', 'Lincoln Village', 'Brookside', 'Lodi'], latitude: 37.9577, longitude: -121.2908, metroArea: 'Stockton-Lodi' },
  { slug: 'saint-paul', name: 'Saint Paul', stateCode: 'MN', stateName: 'Minnesota', county: 'Ramsey County', population: '307,193', zipCode: '55101', description: 'Minnesota\'s state capital and part of the Twin Cities with strong government, insurance, and corporate law.', neighborhoods: ['Downtown', 'Cathedral Hill', 'Summit Hill', 'Grand Avenue', 'Highland Park', 'Como', 'Mac-Groveland'], latitude: 44.9537, longitude: -93.0900, metroArea: 'Minneapolis-St. Paul-Bloomington' },
  { slug: 'cincinnati', name: 'Cincinnati', stateCode: 'OH', stateName: 'Ohio', county: 'Hamilton County', population: '309,317', zipCode: '45201', description: 'A tri-state legal market with strong corporate, health care, and products liability practices.', neighborhoods: ['Downtown', 'Over-the-Rhine', 'Mount Adams', 'Hyde Park', 'Clifton', 'Northside', 'Oakley'], latitude: 39.1031, longitude: -84.5120, metroArea: 'Cincinnati' },
  { slug: 'pittsburgh', name: 'Pittsburgh', stateCode: 'PA', stateName: 'Pennsylvania', county: 'Allegheny County', population: '302,971', zipCode: '15201', description: 'A reinvented city with growing tech, energy, and health care law practices. Home to major corporate headquarters.', neighborhoods: ['Downtown', 'Strip District', 'Lawrenceville', 'Shadyside', 'Squirrel Hill', 'South Side', 'Oakland', 'North Shore', 'East Liberty'], latitude: 40.4406, longitude: -79.9959, metroArea: 'Pittsburgh' },
  { slug: 'greensboro', name: 'Greensboro', stateCode: 'NC', stateName: 'North Carolina', county: 'Guilford County', population: '299,035', zipCode: '27401', description: 'Part of the Piedmont Triad with strong insurance, manufacturing, and employment law practices.', neighborhoods: ['Downtown', 'Fisher Park', 'College Hill', 'Lindley Park'], latitude: 36.0726, longitude: -79.7920, metroArea: 'Greensboro-High Point' },
  { slug: 'anchorage', name: 'Anchorage', stateCode: 'AK', stateName: 'Alaska', county: 'Anchorage Borough', population: '291,247', zipCode: '99501', description: 'Alaska\'s largest city with specialization in natural resources, maritime, and military law.', neighborhoods: ['Downtown', 'Midtown', 'South Addition', 'Turnagain', 'Spenard'], latitude: 61.2181, longitude: -149.9003, metroArea: 'Anchorage' },
  { slug: 'plano', name: 'Plano', stateCode: 'TX', stateName: 'Texas', county: 'Collin County', population: '292,225', zipCode: '75023', description: 'A major Dallas suburb and corporate hub with strong business, IP, and employment law practices.', neighborhoods: ['Downtown', 'Legacy West', 'Shops at Legacy', 'Willow Bend'], latitude: 33.0198, longitude: -96.6989, metroArea: 'Dallas-Fort Worth-Arlington' },
  { slug: 'lincoln', name: 'Lincoln', stateCode: 'NE', stateName: 'Nebraska', county: 'Lancaster County', population: '291,082', zipCode: '68501', description: 'Nebraska\'s state capital and home to the University of Nebraska with government and education law practices.', neighborhoods: ['Downtown', 'Haymarket', 'Near South', 'Havelock', 'College View'], latitude: 40.8136, longitude: -96.7026, metroArea: 'Lincoln' },
  { slug: 'orlando', name: 'Orlando', stateCode: 'FL', stateName: 'Florida', county: 'Orange County', population: '316,401', zipCode: '32801', description: 'Florida\'s tourism capital with strong hospitality, real estate, and immigration law practices.', neighborhoods: ['Downtown', 'Thornton Park', 'Mills 50', 'Ivanhoe Village', 'College Park', 'Baldwin Park', 'Lake Nona', 'Winter Park'], latitude: 28.5383, longitude: -81.3792, metroArea: 'Orlando-Kissimmee-Sanford' },
  { slug: 'irvine', name: 'Irvine', stateCode: 'CA', stateName: 'California', county: 'Orange County', population: '307,670', zipCode: '92602', description: 'A major Orange County tech and business hub with strong IP, corporate, and real estate law practices.', neighborhoods: ['Irvine Spectrum', 'University Park', 'Woodbridge', 'Turtle Rock', 'Northwood'], latitude: 33.6846, longitude: -117.8265, metroArea: 'Los Angeles-Long Beach-Anaheim' },
  { slug: 'newark', name: 'Newark', stateCode: 'NJ', stateName: 'New Jersey', county: 'Essex County', population: '311,549', zipCode: '07101', description: 'New Jersey\'s largest city with strong criminal defense, immigration, and corporate law practices.', neighborhoods: ['Downtown', 'Ironbound', 'University Heights', 'Forest Hill', 'Vailsburg'], latitude: 40.7357, longitude: -74.1724, metroArea: 'New York-Newark-Jersey City' },
  { slug: 'durham', name: 'Durham', stateCode: 'NC', stateName: 'North Carolina', county: 'Durham County', population: '295,602', zipCode: '27701', description: 'Part of the Research Triangle with strong IP, biotech, and tech law practices.', neighborhoods: ['Downtown', 'Brightleaf', 'Ninth Street', 'Trinity Park', 'Old North Durham'], latitude: 35.9940, longitude: -78.8986, metroArea: 'Durham-Chapel Hill' },
  { slug: 'chula-vista', name: 'Chula Vista', stateCode: 'CA', stateName: 'California', county: 'San Diego County', population: '275,487', zipCode: '91910', description: 'San Diego suburb near the Mexican border with immigration and family law practices.', neighborhoods: ['Downtown', 'Eastlake', 'Otay Ranch', 'Rancho del Rey'], latitude: 32.6401, longitude: -117.0842, metroArea: 'San Diego-Chula Vista-Carlsbad' },
  { slug: 'toledo', name: 'Toledo', stateCode: 'OH', stateName: 'Ohio', county: 'Lucas County', population: '268,508', zipCode: '43601', description: 'A northwest Ohio city with manufacturing, personal injury, and criminal defense law practices.', neighborhoods: ['Downtown', 'Old West End', 'Perrysburg', 'West Toledo'], latitude: 41.6528, longitude: -83.5379, metroArea: 'Toledo' },
  { slug: 'fort-wayne', name: 'Fort Wayne', stateCode: 'IN', stateName: 'Indiana', county: 'Allen County', population: '270,402', zipCode: '46801', description: 'Indiana\'s second-largest city with strong personal injury, family law, and criminal defense practices.', neighborhoods: ['Downtown', 'West Central', 'Aboite', 'Dupont'], latitude: 41.0793, longitude: -85.1394, metroArea: 'Fort Wayne' },
  { slug: 'st-petersburg', name: 'St. Petersburg', stateCode: 'FL', stateName: 'Florida', county: 'Pinellas County', population: '261,338', zipCode: '33701', description: 'Part of the Tampa Bay area with personal injury, real estate, and elder law practices.', neighborhoods: ['Downtown', 'Old Northeast', 'Grand Central', 'Kenwood', 'Shore Acres'], latitude: 27.7676, longitude: -82.6403, metroArea: 'Tampa-St. Petersburg-Clearwater' },
  { slug: 'laredo', name: 'Laredo', stateCode: 'TX', stateName: 'Texas', county: 'Webb County', population: '255,473', zipCode: '78040', description: 'A major US-Mexico border crossing city with strong immigration, trade, and criminal defense practices.', neighborhoods: ['Downtown', 'North Laredo', 'South Laredo'], latitude: 27.5036, longitude: -99.5076, metroArea: 'Laredo' },
  { slug: 'jersey-city', name: 'Jersey City', stateCode: 'NJ', stateName: 'New Jersey', county: 'Hudson County', population: '283,927', zipCode: '07302', description: 'Across the Hudson from Manhattan with strong financial, real estate, and corporate law practices.', neighborhoods: ['Downtown', 'Exchange Place', 'Paulus Hook', 'Journal Square', 'Heights', 'Waterfront'], latitude: 40.7178, longitude: -74.0431, metroArea: 'New York-Newark-Jersey City' },
  { slug: 'chandler', name: 'Chandler', stateCode: 'AZ', stateName: 'Arizona', county: 'Maricopa County', population: '280,337', zipCode: '85224', description: 'A Phoenix suburb and tech hub with growing business and IP law practices.', neighborhoods: ['Downtown', 'Ocotillo', 'Sun Lakes'], latitude: 33.3062, longitude: -111.8413, metroArea: 'Phoenix-Mesa-Chandler' },
  { slug: 'madison', name: 'Madison', stateCode: 'WI', stateName: 'Wisconsin', county: 'Dane County', population: '269,840', zipCode: '53701', description: 'Wisconsin\'s state capital with strong government, university, and IP law practices.', neighborhoods: ['Downtown', 'Capitol Square', 'Willy Street', 'Monroe Street', 'Hilldale', 'East Side'], latitude: 43.0731, longitude: -89.4012, metroArea: 'Madison' },
  { slug: 'lubbock', name: 'Lubbock', stateCode: 'TX', stateName: 'Texas', county: 'Lubbock County', population: '267,648', zipCode: '79401', description: 'West Texas city with agricultural, energy, and personal injury law practices.', neighborhoods: ['Downtown', 'Tech Terrace', 'Overton'], latitude: 33.5779, longitude: -101.8552, metroArea: 'Lubbock' },
  { slug: 'scottsdale', name: 'Scottsdale', stateCode: 'AZ', stateName: 'Arizona', county: 'Maricopa County', population: '268,987', zipCode: '85251', description: 'An affluent Phoenix suburb with luxury real estate, estate planning, and business law practices.', neighborhoods: ['Old Town', 'Arcadia', 'North Scottsdale', 'McCormick Ranch', 'Gainey Ranch', 'DC Ranch'], latitude: 33.4942, longitude: -111.9261, metroArea: 'Phoenix-Mesa-Chandler' },
  { slug: 'reno', name: 'Reno', stateCode: 'NV', stateName: 'Nevada', county: 'Washoe County', population: '268,543', zipCode: '89501', description: 'Northern Nevada\'s largest city with gaming, tech, and business law practices.', neighborhoods: ['Downtown', 'Midtown', 'South Reno', 'Northwest', 'Old Southwest'], latitude: 39.5296, longitude: -119.8138, metroArea: 'Reno-Sparks' },
  { slug: 'buffalo', name: 'Buffalo', stateCode: 'NY', stateName: 'New York', county: 'Erie County', population: '276,807', zipCode: '14201', description: 'Western New York\'s largest city with strong personal injury, criminal defense, and insurance law practices.', neighborhoods: ['Downtown', 'Elmwood Village', 'Allentown', 'North Buffalo', 'Hertel'], latitude: 42.8864, longitude: -78.8784, metroArea: 'Buffalo-Cheektowaga' },
  { slug: 'gilbert', name: 'Gilbert', stateCode: 'AZ', stateName: 'Arizona', county: 'Maricopa County', population: '272,017', zipCode: '85233', description: 'A fast-growing Phoenix suburb with family law, real estate, and business law practices.', neighborhoods: ['Downtown', 'Agritopia', 'Cooley Station', 'Power Ranch'], latitude: 33.3528, longitude: -111.7890, metroArea: 'Phoenix-Mesa-Chandler' },
  { slug: 'glendale-az', name: 'Glendale', stateCode: 'AZ', stateName: 'Arizona', county: 'Maricopa County', population: '252,381', zipCode: '85301', description: 'Part of the Phoenix metro with growing demand for personal injury and family law attorneys.', neighborhoods: ['Downtown', 'Arrowhead', 'Westgate'], latitude: 33.5387, longitude: -112.1860, metroArea: 'Phoenix-Mesa-Chandler' },
  { slug: 'north-las-vegas', name: 'North Las Vegas', stateCode: 'NV', stateName: 'Nevada', county: 'Clark County', population: '265,429', zipCode: '89030', description: 'Part of the Las Vegas metro with criminal defense and family law practices.', neighborhoods: ['Downtown', 'Aliante', 'Eldorado'], latitude: 36.1989, longitude: -115.1175, metroArea: 'Las Vegas-Henderson-Paradise' },
  { slug: 'winston-salem', name: 'Winston-Salem', stateCode: 'NC', stateName: 'North Carolina', county: 'Forsyth County', population: '252,267', zipCode: '27101', description: 'Part of the Piedmont Triad with health care, tobacco litigation, and personal injury practices.', neighborhoods: ['Downtown', 'West End', 'Ardmore', 'Reynolda', 'Old Salem'], latitude: 36.0999, longitude: -80.2442, metroArea: 'Winston-Salem' },
  { slug: 'chesapeake', name: 'Chesapeake', stateCode: 'VA', stateName: 'Virginia', county: 'Chesapeake City', population: '254,529', zipCode: '23320', description: 'Part of the Hampton Roads area with military, real estate, and personal injury practices.', neighborhoods: ['Great Bridge', 'Deep Creek', 'Greenbrier', 'Western Branch'], latitude: 36.7682, longitude: -76.2875, metroArea: 'Virginia Beach-Norfolk-Newport News' },
  { slug: 'norfolk', name: 'Norfolk', stateCode: 'VA', stateName: 'Virginia', county: 'Norfolk City', population: '238,005', zipCode: '23501', description: 'Home to the world\'s largest naval base with strong military, maritime, and personal injury practices.', neighborhoods: ['Downtown', 'Ghent', 'Freemason', 'Ocean View', 'Colonial Place'], latitude: 36.8508, longitude: -76.2859, metroArea: 'Virginia Beach-Norfolk-Newport News' },
  { slug: 'fremont', name: 'Fremont', stateCode: 'CA', stateName: 'California', county: 'Alameda County', population: '230,504', zipCode: '94536', description: 'A Silicon Valley city with tech, IP, and business law practices.', neighborhoods: ['Downtown', 'Niles', 'Warm Springs', 'Irvington', 'Mission San Jose'], latitude: 37.5485, longitude: -121.9886, metroArea: 'San Francisco-Oakland-Berkeley' },
  { slug: 'garland', name: 'Garland', stateCode: 'TX', stateName: 'Texas', county: 'Dallas County', population: '246,018', zipCode: '75040', description: 'A Dallas suburb with personal injury, immigration, and family law practices.', neighborhoods: ['Downtown', 'Firewheel', 'Lake Highlands'], latitude: 32.9126, longitude: -96.6389, metroArea: 'Dallas-Fort Worth-Arlington' },
  { slug: 'irving', name: 'Irving', stateCode: 'TX', stateName: 'Texas', county: 'Dallas County', population: '256,684', zipCode: '75014', description: 'Home to Las Colinas business district with corporate, immigration, and business law practices.', neighborhoods: ['Las Colinas', 'Valley Ranch', 'South Irving'], latitude: 32.8140, longitude: -96.9489, metroArea: 'Dallas-Fort Worth-Arlington' },
  { slug: 'hialeah', name: 'Hialeah', stateCode: 'FL', stateName: 'Florida', county: 'Miami-Dade County', population: '223,109', zipCode: '33010', description: 'A predominantly Hispanic city in the Miami metro with strong immigration and personal injury practices.', neighborhoods: ['Downtown', 'Palm Springs North', 'Hialeah Gardens'], latitude: 25.8576, longitude: -80.2781, metroArea: 'Miami-Fort Lauderdale-Pompano Beach' },
  { slug: 'richmond', name: 'Richmond', stateCode: 'VA', stateName: 'Virginia', county: 'Richmond City', population: '226,610', zipCode: '23219', description: 'Virginia\'s state capital with strong government, insurance, and corporate law practices.', neighborhoods: ['Downtown', 'The Fan', 'Carytown', 'Church Hill', 'Shockoe Bottom', 'Scott\'s Addition', 'Museum District'], latitude: 37.5407, longitude: -77.4360, metroArea: 'Richmond' },
  { slug: 'boise', name: 'Boise', stateCode: 'ID', stateName: 'Idaho', county: 'Ada County', population: '235,684', zipCode: '83701', description: 'Idaho\'s capital and fastest-growing city with real estate, tech, and natural resources law practices.', neighborhoods: ['Downtown', 'North End', 'Hyde Park', 'Boise Bench', 'Southeast Boise', 'Harris Ranch'], latitude: 43.6150, longitude: -116.2023, metroArea: 'Boise City' },
  { slug: 'spokane', name: 'Spokane', stateCode: 'WA', stateName: 'Washington', county: 'Spokane County', population: '229,071', zipCode: '99201', description: 'Eastern Washington\'s largest city with personal injury, criminal defense, and real estate practices.', neighborhoods: ['Downtown', 'South Hill', 'Browne\'s Addition', 'Perry District', 'Garland'], latitude: 47.6588, longitude: -117.4260, metroArea: 'Spokane-Spokane Valley' },
  { slug: 'baton-rouge', name: 'Baton Rouge', stateCode: 'LA', stateName: 'Louisiana', county: 'East Baton Rouge Parish', population: '227,470', zipCode: '70801', description: 'Louisiana\'s state capital with government, petrochemical, and personal injury law practices.', neighborhoods: ['Downtown', 'Mid City', 'Garden District', 'Southdowns', 'University'], latitude: 30.4515, longitude: -91.1871, metroArea: 'Baton Rouge' },
  { slug: 'des-moines', name: 'Des Moines', stateCode: 'IA', stateName: 'Iowa', county: 'Polk County', population: '214,133', zipCode: '50301', description: 'Iowa\'s state capital and insurance industry center with strong insurance, government, and agricultural law practices.', neighborhoods: ['Downtown', 'East Village', 'Sherman Hill', 'Drake', 'Beaverdale', 'Ingersoll'], latitude: 41.5868, longitude: -93.6250, metroArea: 'Des Moines-West Des Moines' },
  { slug: 'tacoma', name: 'Tacoma', stateCode: 'WA', stateName: 'Washington', county: 'Pierce County', population: '219,346', zipCode: '98401', description: 'Part of the Seattle-Tacoma metro with military, personal injury, and criminal defense practices.', neighborhoods: ['Downtown', 'Stadium District', 'Proctor', 'Old Town', 'Hilltop', 'North End'], latitude: 47.2529, longitude: -122.4443, metroArea: 'Seattle-Tacoma-Bellevue' },
  { slug: 'san-bernardino', name: 'San Bernardino', stateCode: 'CA', stateName: 'California', county: 'San Bernardino County', population: '222,101', zipCode: '92401', description: 'Inland Empire city with bankruptcy, criminal defense, and personal injury practices.', neighborhoods: ['Downtown', 'University', 'Arrowhead'], latitude: 34.1083, longitude: -117.2898, metroArea: 'Riverside-San Bernardino-Ontario' },
  { slug: 'modesto', name: 'Modesto', stateCode: 'CA', stateName: 'California', county: 'Stanislaus County', population: '218,464', zipCode: '95350', description: 'Central Valley city with agricultural, personal injury, and family law practices.', neighborhoods: ['Downtown', 'Village One', 'College Area'], latitude: 37.6391, longitude: -120.9969, metroArea: 'Modesto' },
  { slug: 'fontana', name: 'Fontana', stateCode: 'CA', stateName: 'California', county: 'San Bernardino County', population: '218,585', zipCode: '92335', description: 'Inland Empire logistics hub with personal injury and workers compensation practices.', neighborhoods: ['Downtown', 'North Fontana', 'Summit Heights'], latitude: 34.0922, longitude: -117.4350, metroArea: 'Riverside-San Bernardino-Ontario' },
  { slug: 'moreno-valley', name: 'Moreno Valley', stateCode: 'CA', stateName: 'California', county: 'Riverside County', population: '212,560', zipCode: '92551', description: 'A growing Inland Empire city with personal injury and family law practices.', neighborhoods: ['Downtown', 'Sunnymead', 'Edgemont'], latitude: 33.9425, longitude: -117.2297, metroArea: 'Riverside-San Bernardino-Ontario' },
  { slug: 'fayetteville', name: 'Fayetteville', stateCode: 'NC', stateName: 'North Carolina', county: 'Cumberland County', population: '211,657', zipCode: '28301', description: 'Home to Fort Bragg with strong military, family law, and personal injury practices.', neighborhoods: ['Downtown', 'Haymount', 'Jack Britt'], latitude: 35.0527, longitude: -78.8784, metroArea: 'Fayetteville' },
  { slug: 'glendale-ca', name: 'Glendale', stateCode: 'CA', stateName: 'California', county: 'Los Angeles County', population: '196,543', zipCode: '91201', description: 'Part of the Los Angeles metro with Armenian community driving immigration and personal injury practices.', neighborhoods: ['Downtown', 'Montrose', 'Adams Hill', 'Verdugo Woodlands'], latitude: 34.1425, longitude: -118.2551, metroArea: 'Los Angeles-Long Beach-Anaheim' },
  { slug: 'yonkers', name: 'Yonkers', stateCode: 'NY', stateName: 'New York', county: 'Westchester County', population: '211,569', zipCode: '10701', description: 'Westchester County\'s largest city adjacent to NYC with real estate and personal injury practices.', neighborhoods: ['Downtown', 'Getty Square', 'Park Hill', 'Crestwood'], latitude: 40.9312, longitude: -73.8987, metroArea: 'New York-Newark-Jersey City' },
  { slug: 'little-rock', name: 'Little Rock', stateCode: 'AR', stateName: 'Arkansas', county: 'Pulaski County', population: '202,591', zipCode: '72201', description: 'Arkansas\'s state capital with government, personal injury, and corporate law practices.', neighborhoods: ['Downtown', 'River Market', 'Hillcrest', 'The Heights', 'Chenal Valley'], latitude: 34.7465, longitude: -92.2896, metroArea: 'Little Rock-North Little Rock-Conway' },
  { slug: 'salt-lake-city', name: 'Salt Lake City', stateCode: 'UT', stateName: 'Utah', county: 'Salt Lake County', population: '200,133', zipCode: '84101', description: 'Utah\'s capital with growing tech, IP, and business law practices. Hub of the Silicon Slopes.', neighborhoods: ['Downtown', 'Sugar House', 'The Avenues', 'Liberty Park', 'Marmalade', 'Gateway', '9th and 9th'], latitude: 40.7608, longitude: -111.8910, metroArea: 'Salt Lake City' },
  { slug: 'huntsville', name: 'Huntsville', stateCode: 'AL', stateName: 'Alabama', county: 'Madison County', population: '225,564', zipCode: '35801', description: 'Alabama\'s largest city and a defense/aerospace hub with strong government contracts and IP law practices.', neighborhoods: ['Downtown', 'Twickenham', 'Five Points', 'Monte Sano', 'Jones Valley'], latitude: 34.7304, longitude: -86.5861, metroArea: 'Huntsville' },
]

// ============================================================================
// 4 US Census Regions
// ============================================================================
export const usRegions: USRegion[] = [
  {
    slug: 'northeast',
    name: 'Northeast',
    description: 'The Northeast is home to the nation\'s largest legal markets including New York City, Boston, Philadelphia, and the DC metro area.',
    states: [
      { name: 'Connecticut', code: 'CT', slug: 'connecticut', cities: [{ name: 'Bridgeport', slug: 'bridgeport' }, { name: 'New Haven', slug: 'new-haven' }, { name: 'Hartford', slug: 'hartford' }] },
      { name: 'Maine', code: 'ME', slug: 'maine', cities: [{ name: 'Portland', slug: 'portland' }] },
      { name: 'Massachusetts', code: 'MA', slug: 'massachusetts', cities: [{ name: 'Boston', slug: 'boston' }, { name: 'Worcester', slug: 'worcester' }] },
      { name: 'New Hampshire', code: 'NH', slug: 'new-hampshire', cities: [{ name: 'Manchester', slug: 'manchester' }] },
      { name: 'New Jersey', code: 'NJ', slug: 'new-jersey', cities: [{ name: 'Newark', slug: 'newark' }, { name: 'Jersey City', slug: 'jersey-city' }] },
      { name: 'New York', code: 'NY', slug: 'new-york', cities: [{ name: 'New York', slug: 'new-york' }, { name: 'Buffalo', slug: 'buffalo' }] },
      { name: 'Pennsylvania', code: 'PA', slug: 'pennsylvania', cities: [{ name: 'Philadelphia', slug: 'philadelphia' }, { name: 'Pittsburgh', slug: 'pittsburgh' }] },
      { name: 'Rhode Island', code: 'RI', slug: 'rhode-island', cities: [{ name: 'Providence', slug: 'providence' }] },
      { name: 'Vermont', code: 'VT', slug: 'vermont', cities: [{ name: 'Burlington', slug: 'burlington' }] },
    ],
  },
  {
    slug: 'midwest',
    name: 'Midwest',
    description: 'The Midwest features major legal markets in Chicago, Minneapolis, and Columbus with strong corporate, insurance, and manufacturing law practices.',
    states: [
      { name: 'Illinois', code: 'IL', slug: 'illinois', cities: [{ name: 'Chicago', slug: 'chicago' }, { name: 'Aurora', slug: 'aurora' }] },
      { name: 'Indiana', code: 'IN', slug: 'indiana', cities: [{ name: 'Indianapolis', slug: 'indianapolis' }, { name: 'Fort Wayne', slug: 'fort-wayne' }] },
      { name: 'Iowa', code: 'IA', slug: 'iowa', cities: [{ name: 'Des Moines', slug: 'des-moines' }, { name: 'Cedar Rapids', slug: 'cedar-rapids' }] },
      { name: 'Kansas', code: 'KS', slug: 'kansas', cities: [{ name: 'Wichita', slug: 'wichita' }, { name: 'Overland Park', slug: 'overland-park' }] },
      { name: 'Michigan', code: 'MI', slug: 'michigan', cities: [{ name: 'Detroit', slug: 'detroit' }, { name: 'Grand Rapids', slug: 'grand-rapids' }] },
      { name: 'Minnesota', code: 'MN', slug: 'minnesota', cities: [{ name: 'Minneapolis', slug: 'minneapolis' }, { name: 'Saint Paul', slug: 'saint-paul' }] },
      { name: 'Missouri', code: 'MO', slug: 'missouri', cities: [{ name: 'Kansas City', slug: 'kansas-city-mo' }, { name: 'St. Louis', slug: 'st-louis' }] },
      { name: 'Nebraska', code: 'NE', slug: 'nebraska', cities: [{ name: 'Omaha', slug: 'omaha' }, { name: 'Lincoln', slug: 'lincoln' }] },
      { name: 'North Dakota', code: 'ND', slug: 'north-dakota', cities: [{ name: 'Fargo', slug: 'fargo' }] },
      { name: 'Ohio', code: 'OH', slug: 'ohio', cities: [{ name: 'Columbus', slug: 'columbus' }, { name: 'Cleveland', slug: 'cleveland' }, { name: 'Cincinnati', slug: 'cincinnati' }] },
      { name: 'South Dakota', code: 'SD', slug: 'south-dakota', cities: [{ name: 'Sioux Falls', slug: 'sioux-falls' }] },
      { name: 'Wisconsin', code: 'WI', slug: 'wisconsin', cities: [{ name: 'Milwaukee', slug: 'milwaukee' }, { name: 'Madison', slug: 'madison' }] },
    ],
  },
  {
    slug: 'south',
    name: 'South',
    description: 'The South is the fastest-growing region for legal services, led by Texas, Florida, Georgia, and the Washington DC metro area.',
    states: [
      { name: 'Alabama', code: 'AL', slug: 'alabama', cities: [{ name: 'Huntsville', slug: 'huntsville' }, { name: 'Birmingham', slug: 'birmingham' }] },
      { name: 'Arkansas', code: 'AR', slug: 'arkansas', cities: [{ name: 'Little Rock', slug: 'little-rock' }] },
      { name: 'Delaware', code: 'DE', slug: 'delaware', cities: [{ name: 'Wilmington', slug: 'wilmington' }] },
      { name: 'District of Columbia', code: 'DC', slug: 'district-of-columbia', cities: [{ name: 'Washington', slug: 'washington' }] },
      { name: 'Florida', code: 'FL', slug: 'florida', cities: [{ name: 'Jacksonville', slug: 'jacksonville' }, { name: 'Miami', slug: 'miami' }, { name: 'Tampa', slug: 'tampa' }, { name: 'Orlando', slug: 'orlando' }] },
      { name: 'Georgia', code: 'GA', slug: 'georgia', cities: [{ name: 'Atlanta', slug: 'atlanta' }, { name: 'Augusta', slug: 'augusta' }] },
      { name: 'Kentucky', code: 'KY', slug: 'kentucky', cities: [{ name: 'Louisville', slug: 'louisville' }, { name: 'Lexington', slug: 'lexington' }] },
      { name: 'Louisiana', code: 'LA', slug: 'louisiana', cities: [{ name: 'New Orleans', slug: 'new-orleans' }, { name: 'Baton Rouge', slug: 'baton-rouge' }] },
      { name: 'Maryland', code: 'MD', slug: 'maryland', cities: [{ name: 'Baltimore', slug: 'baltimore' }] },
      { name: 'Mississippi', code: 'MS', slug: 'mississippi', cities: [{ name: 'Jackson', slug: 'jackson' }] },
      { name: 'North Carolina', code: 'NC', slug: 'north-carolina', cities: [{ name: 'Charlotte', slug: 'charlotte' }, { name: 'Raleigh', slug: 'raleigh' }] },
      { name: 'Oklahoma', code: 'OK', slug: 'oklahoma', cities: [{ name: 'Oklahoma City', slug: 'oklahoma-city' }, { name: 'Tulsa', slug: 'tulsa' }] },
      { name: 'South Carolina', code: 'SC', slug: 'south-carolina', cities: [{ name: 'Charleston', slug: 'charleston' }, { name: 'Columbia', slug: 'columbia' }] },
      { name: 'Tennessee', code: 'TN', slug: 'tennessee', cities: [{ name: 'Nashville', slug: 'nashville' }, { name: 'Memphis', slug: 'memphis' }] },
      { name: 'Texas', code: 'TX', slug: 'texas', cities: [{ name: 'Houston', slug: 'houston' }, { name: 'Dallas', slug: 'dallas' }, { name: 'Austin', slug: 'austin' }, { name: 'San Antonio', slug: 'san-antonio' }] },
      { name: 'Virginia', code: 'VA', slug: 'virginia', cities: [{ name: 'Virginia Beach', slug: 'virginia-beach' }, { name: 'Richmond', slug: 'richmond' }] },
      { name: 'West Virginia', code: 'WV', slug: 'west-virginia', cities: [{ name: 'Charleston', slug: 'charleston-wv' }] },
    ],
  },
  {
    slug: 'west',
    name: 'West',
    description: 'The West features tech-driven legal markets in California, Washington, and Colorado, plus specialized practices in energy and natural resources.',
    states: [
      { name: 'Alaska', code: 'AK', slug: 'alaska', cities: [{ name: 'Anchorage', slug: 'anchorage' }] },
      { name: 'Arizona', code: 'AZ', slug: 'arizona', cities: [{ name: 'Phoenix', slug: 'phoenix' }, { name: 'Tucson', slug: 'tucson' }, { name: 'Mesa', slug: 'mesa' }] },
      { name: 'California', code: 'CA', slug: 'california', cities: [{ name: 'Los Angeles', slug: 'los-angeles' }, { name: 'San Francisco', slug: 'san-francisco' }, { name: 'San Diego', slug: 'san-diego' }, { name: 'San Jose', slug: 'san-jose' }] },
      { name: 'Colorado', code: 'CO', slug: 'colorado', cities: [{ name: 'Denver', slug: 'denver' }, { name: 'Colorado Springs', slug: 'colorado-springs' }] },
      { name: 'Hawaii', code: 'HI', slug: 'hawaii', cities: [{ name: 'Honolulu', slug: 'honolulu' }] },
      { name: 'Idaho', code: 'ID', slug: 'idaho', cities: [{ name: 'Boise', slug: 'boise' }] },
      { name: 'Montana', code: 'MT', slug: 'montana', cities: [{ name: 'Billings', slug: 'billings' }] },
      { name: 'Nevada', code: 'NV', slug: 'nevada', cities: [{ name: 'Las Vegas', slug: 'las-vegas' }, { name: 'Henderson', slug: 'henderson' }, { name: 'Reno', slug: 'reno' }] },
      { name: 'New Mexico', code: 'NM', slug: 'new-mexico', cities: [{ name: 'Albuquerque', slug: 'albuquerque' }] },
      { name: 'Oregon', code: 'OR', slug: 'oregon', cities: [{ name: 'Portland', slug: 'portland' }, { name: 'Salem', slug: 'salem' }, { name: 'Eugene', slug: 'eugene' }] },
      { name: 'Utah', code: 'UT', slug: 'utah', cities: [{ name: 'Salt Lake City', slug: 'salt-lake-city' }] },
      { name: 'Washington', code: 'WA', slug: 'washington', cities: [{ name: 'Seattle', slug: 'seattle' }, { name: 'Spokane', slug: 'spokane' }, { name: 'Tacoma', slug: 'tacoma' }] },
      { name: 'Wyoming', code: 'WY', slug: 'wyoming', cities: [{ name: 'Cheyenne', slug: 'cheyenne' }] },
    ],
  },
]

// ============================================================================
// 75 Practice Areas (replaces French services)
// ============================================================================
export const practiceAreas = [
  { slug: 'personal-injury', name: 'Personal Injury', icon: 'Shield', color: 'from-red-500 to-red-600' },
  { slug: 'car-accidents', name: 'Car Accidents', icon: 'Car', color: 'from-red-400 to-red-500' },
  { slug: 'truck-accidents', name: 'Truck Accidents', icon: 'Truck', color: 'from-red-600 to-red-700' },
  { slug: 'motorcycle-accidents', name: 'Motorcycle Accidents', icon: 'Bike', color: 'from-red-500 to-red-600' },
  { slug: 'slip-and-fall', name: 'Slip & Fall', icon: 'AlertTriangle', color: 'from-orange-400 to-orange-500' },
  { slug: 'medical-malpractice', name: 'Medical Malpractice', icon: 'Stethoscope', color: 'from-rose-500 to-rose-600' },
  { slug: 'wrongful-death', name: 'Wrongful Death', icon: 'Heart', color: 'from-rose-600 to-rose-700' },
  { slug: 'product-liability', name: 'Product Liability', icon: 'Package', color: 'from-orange-500 to-orange-600' },
  { slug: 'workers-compensation', name: 'Workers Compensation', icon: 'HardHat', color: 'from-amber-500 to-amber-600' },
  { slug: 'nursing-home-abuse', name: 'Nursing Home Abuse', icon: 'Building', color: 'from-rose-400 to-rose-500' },
  { slug: 'criminal-defense', name: 'Criminal Defense', icon: 'Scale', color: 'from-slate-600 to-slate-700' },
  { slug: 'dui-dwi', name: 'DUI & DWI', icon: 'AlertCircle', color: 'from-slate-500 to-slate-600' },
  { slug: 'drug-crimes', name: 'Drug Crimes', icon: 'Ban', color: 'from-gray-600 to-gray-700' },
  { slug: 'white-collar-crime', name: 'White Collar Crime', icon: 'Briefcase', color: 'from-zinc-500 to-zinc-600' },
  { slug: 'federal-crimes', name: 'Federal Crimes', icon: 'Landmark', color: 'from-slate-700 to-slate-800' },
  { slug: 'juvenile-crimes', name: 'Juvenile Crimes', icon: 'Users', color: 'from-slate-400 to-slate-500' },
  { slug: 'sex-crimes', name: 'Sex Crimes', icon: 'ShieldAlert', color: 'from-gray-700 to-gray-800' },
  { slug: 'theft-robbery', name: 'Theft & Robbery', icon: 'Lock', color: 'from-gray-500 to-gray-600' },
  { slug: 'violent-crimes', name: 'Violent Crimes', icon: 'Swords', color: 'from-gray-600 to-gray-700' },
  { slug: 'traffic-violations', name: 'Traffic Violations', icon: 'CircleAlert', color: 'from-slate-400 to-slate-500' },
  { slug: 'divorce', name: 'Divorce', icon: 'HeartCrack', color: 'from-pink-500 to-pink-600' },
  { slug: 'child-custody', name: 'Child Custody', icon: 'Baby', color: 'from-pink-400 to-pink-500' },
  { slug: 'child-support', name: 'Child Support', icon: 'HandCoins', color: 'from-pink-300 to-pink-400' },
  { slug: 'adoption', name: 'Adoption', icon: 'Heart', color: 'from-fuchsia-400 to-fuchsia-500' },
  { slug: 'alimony-spousal-support', name: 'Alimony & Spousal Support', icon: 'Wallet', color: 'from-pink-500 to-pink-600' },
  { slug: 'domestic-violence', name: 'Domestic Violence', icon: 'ShieldOff', color: 'from-red-700 to-red-800' },
  { slug: 'prenuptial-agreements', name: 'Prenuptial Agreements', icon: 'FileText', color: 'from-pink-300 to-pink-400' },
  { slug: 'paternity', name: 'Paternity', icon: 'UserCheck', color: 'from-pink-400 to-pink-500' },
  { slug: 'business-law', name: 'Business Law', icon: 'Building2', color: 'from-blue-500 to-blue-600' },
  { slug: 'corporate-law', name: 'Corporate Law', icon: 'Landmark', color: 'from-blue-600 to-blue-700' },
  { slug: 'mergers-acquisitions', name: 'Mergers & Acquisitions', icon: 'GitMerge', color: 'from-blue-700 to-blue-800' },
  { slug: 'contract-law', name: 'Contract Law', icon: 'FileSignature', color: 'from-blue-400 to-blue-500' },
  { slug: 'business-litigation', name: 'Business Litigation', icon: 'Gavel', color: 'from-blue-500 to-blue-600' },
  { slug: 'intellectual-property', name: 'Intellectual Property', icon: 'Lightbulb', color: 'from-indigo-500 to-indigo-600' },
  { slug: 'trademark', name: 'Trademark', icon: 'Badge', color: 'from-indigo-400 to-indigo-500' },
  { slug: 'patent', name: 'Patent', icon: 'Cpu', color: 'from-indigo-600 to-indigo-700' },
  { slug: 'copyright', name: 'Copyright', icon: 'Copyright', color: 'from-indigo-500 to-indigo-600' },
  { slug: 'real-estate-law', name: 'Real Estate Law', icon: 'Home', color: 'from-emerald-500 to-emerald-600' },
  { slug: 'landlord-tenant', name: 'Landlord & Tenant', icon: 'Key', color: 'from-emerald-400 to-emerald-500' },
  { slug: 'foreclosure', name: 'Foreclosure', icon: 'HomeIcon', color: 'from-emerald-600 to-emerald-700' },
  { slug: 'zoning-land-use', name: 'Zoning & Land Use', icon: 'Map', color: 'from-green-500 to-green-600' },
  { slug: 'construction-law', name: 'Construction Law', icon: 'HardHat', color: 'from-green-600 to-green-700' },
  { slug: 'immigration-law', name: 'Immigration Law', icon: 'Globe', color: 'from-teal-500 to-teal-600' },
  { slug: 'green-cards', name: 'Green Cards', icon: 'CreditCard', color: 'from-teal-400 to-teal-500' },
  { slug: 'visa-applications', name: 'Visa Applications', icon: 'FileCheck', color: 'from-teal-500 to-teal-600' },
  { slug: 'deportation-defense', name: 'Deportation Defense', icon: 'ShieldCheck', color: 'from-teal-600 to-teal-700' },
  { slug: 'asylum', name: 'Asylum', icon: 'Flag', color: 'from-teal-500 to-teal-600' },
  { slug: 'citizenship-naturalization', name: 'Citizenship & Naturalization', icon: 'Award', color: 'from-teal-400 to-teal-500' },
  { slug: 'estate-planning', name: 'Estate Planning', icon: 'ScrollText', color: 'from-purple-500 to-purple-600' },
  { slug: 'wills-trusts', name: 'Wills & Trusts', icon: 'FileText', color: 'from-purple-400 to-purple-500' },
  { slug: 'probate', name: 'Probate', icon: 'Stamp', color: 'from-purple-500 to-purple-600' },
  { slug: 'elder-law', name: 'Elder Law', icon: 'HeartHandshake', color: 'from-purple-400 to-purple-500' },
  { slug: 'guardianship', name: 'Guardianship', icon: 'ShieldCheck', color: 'from-purple-300 to-purple-400' },
  { slug: 'employment-law', name: 'Employment Law', icon: 'Briefcase', color: 'from-amber-500 to-amber-600' },
  { slug: 'wrongful-termination', name: 'Wrongful Termination', icon: 'UserX', color: 'from-amber-600 to-amber-700' },
  { slug: 'workplace-discrimination', name: 'Workplace Discrimination', icon: 'Users', color: 'from-amber-500 to-amber-600' },
  { slug: 'sexual-harassment', name: 'Sexual Harassment', icon: 'ShieldAlert', color: 'from-amber-600 to-amber-700' },
  { slug: 'wage-hour-claims', name: 'Wage & Hour Claims', icon: 'Clock', color: 'from-amber-400 to-amber-500' },
  { slug: 'bankruptcy', name: 'Bankruptcy', icon: 'TrendingDown', color: 'from-stone-500 to-stone-600' },
  { slug: 'chapter-7-bankruptcy', name: 'Chapter 7', icon: 'FileX', color: 'from-stone-400 to-stone-500' },
  { slug: 'chapter-13-bankruptcy', name: 'Chapter 13', icon: 'FileCheck2', color: 'from-stone-500 to-stone-600' },
  { slug: 'debt-relief', name: 'Debt Relief', icon: 'Percent', color: 'from-stone-400 to-stone-500' },
  { slug: 'tax-law', name: 'Tax Law', icon: 'Calculator', color: 'from-cyan-500 to-cyan-600' },
  { slug: 'irs-disputes', name: 'IRS Disputes', icon: 'AlertTriangle', color: 'from-cyan-600 to-cyan-700' },
  { slug: 'tax-planning', name: 'Tax Planning', icon: 'PiggyBank', color: 'from-cyan-400 to-cyan-500' },
  { slug: 'entertainment-law', name: 'Entertainment Law', icon: 'Film', color: 'from-violet-500 to-violet-600' },
  { slug: 'environmental-law', name: 'Environmental Law', icon: 'Leaf', color: 'from-lime-500 to-lime-600' },
  { slug: 'health-care-law', name: 'Health Care Law', icon: 'Activity', color: 'from-sky-500 to-sky-600' },
  { slug: 'insurance-law', name: 'Insurance Law', icon: 'Umbrella', color: 'from-sky-400 to-sky-500' },
  { slug: 'civil-rights', name: 'Civil Rights', icon: 'Scale', color: 'from-yellow-500 to-yellow-600' },
  { slug: 'consumer-protection', name: 'Consumer Protection', icon: 'ShieldCheck', color: 'from-yellow-400 to-yellow-500' },
  { slug: 'social-security-disability', name: 'Social Security Disability', icon: 'Accessibility', color: 'from-sky-500 to-sky-600' },
  { slug: 'veterans-benefits', name: 'Veterans Benefits', icon: 'Medal', color: 'from-sky-600 to-sky-700' },
  { slug: 'class-action', name: 'Class Action', icon: 'Users', color: 'from-orange-500 to-orange-600' },
  { slug: 'appeals', name: 'Appeals', icon: 'ArrowUpRight', color: 'from-gray-500 to-gray-600' },
  { slug: 'mediation-arbitration', name: 'Mediation & Arbitration', icon: 'Handshake', color: 'from-green-400 to-green-500' },
]

// ============================================================================
// Helper Functions
// ============================================================================

export function getCityBySlug(slug: string): City | undefined {
  return cities.find(c => c.slug === slug)
}

export function getStateBySlug(slug: string): State | undefined {
  return states.find(s => s.slug === slug)
}

export function getStateByCode(code: string): State | undefined {
  return states.find(s => s.code === code)
}

export function getCitiesByState(stateCode: string): City[] {
  return cities.filter(c => c.stateCode === stateCode)
}

function parsePopulation(pop: string): number {
  return parseInt(pop.replace(/,/g, ''), 10) || 0
}

export function getNearbyCities(citySlug: string, limit: number = 5): City[] {
  const city = getCityBySlug(citySlug)
  if (!city) return []

  // 1. Cities in the same state, sorted by population
  const sameState = cities
    .filter(c => c.stateCode === city.stateCode && c.slug !== citySlug)
    .sort((a, b) => parsePopulation(b.population) - parsePopulation(a.population))

  if (sameState.length >= limit) {
    return sameState.slice(0, limit)
  }

  // 2. Fill with cities from the same metro area or nearby states
  const sameStateSlugs = new Set(sameState.map(c => c.slug))
  sameStateSlugs.add(citySlug)

  const sameMetro = cities
    .filter(c => c.metroArea === city.metroArea && !sameStateSlugs.has(c.slug))
    .sort((a, b) => parsePopulation(b.population) - parsePopulation(a.population))

  return [...sameState, ...sameMetro].slice(0, limit)
}

export function getRegionBySlug(slug: string): USRegion | undefined {
  return usRegions.find(r => r.slug === slug)
}

export function getRegionSlugByName(name: string): string | undefined {
  return usRegions.find(r => r.name === name)?.slug
}

function toNeighborhoodSlug(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

export function getNeighborhoodsByCity(citySlug: string): { name: string; slug: string }[] {
  const city = getCityBySlug(citySlug)
  if (!city) return []
  return city.neighborhoods.map(n => ({ name: n, slug: toNeighborhoodSlug(n) }))
}

export function getNeighborhoodBySlug(citySlug: string, nSlug: string): { city: City; neighborhoodName: string } | null {
  const city = getCityBySlug(citySlug)
  if (!city) return null
  const match = city.neighborhoods.find(name => toNeighborhoodSlug(name) === nSlug)
  if (!match) return null
  return { city, neighborhoodName: match }
}

// Backward compatibility aliases (for code that still uses old French names)
export const villes = cities
export const departements = states
export const regions = usRegions
export const services = practiceAreas
export const getVilleBySlug = getCityBySlug
export const getDepartementBySlug = getStateBySlug
export const getDepartementByCode = getStateByCode
export const getVillesByDepartement = getCitiesByState
export const getQuartiersByVille = getNeighborhoodsByCity
export const getQuartierBySlug = getNeighborhoodBySlug
export type Ville = City
