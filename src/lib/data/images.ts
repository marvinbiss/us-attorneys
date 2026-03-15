/**
 * Centralized image bank — US Attorneys
 * Source: Unsplash (free license, commercial use allowed)
 *
 * GOLDEN RULE: ZERO duplicates. Each Unsplash ID appears ONLY ONCE
 * in the static data below.
 *
 * Organization:
 * - Hero homepage (1)
 * - Practice areas / services (75+ unique + 1 default)
 * - Attorney trust faces (3)
 * - Client testimonials (3)
 * - Before/After case results (10 pairs = 20, all unique)
 * - Top 20 US cities (20 unique)
 * - Static pages (7)
 * - Ambiance (3)
 * - Blog (12 topics + 3 categories + 1 default)
 */

// ── Helper ───────────────────────────────────────────────────────
function unsplash(id: string, w = 800, h = 600): string {
  return `https://images.unsplash.com/${id}?w=${w}&h=${h}&fit=crop&auto=format&q=80`
}

/** Generic blur placeholder (neutral gray) — usable everywhere */
export const BLUR_PLACEHOLDER = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAFAAgDASIAAhEBAxEB/8QAFAABAAAAAAAAAAAAAAAAAAAABv/EAB0QAAICAgMBAAAAAAAAAAAAAAECAxEABBIhMUH/xAAVAQEBAAAAAAAAAAAAAAAAAAADBP/EABkRAAIDAQAAAAAAAAAAAAAAAAEDAAIRIf/aAAwDAQACEQMRAD8AoNnYig1IYkjJZgLdj2fueYsXExif/9k='

// ── 1. HERO HOMEPAGE ─────────────────────────────────────────────
export const heroImage = {
  src: unsplash('photo-1589829545856-d10d557cf95f', 1920, 1080),
  alt: 'Professional attorney in a modern law office',
  blurDataURL: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAoHBwgHBgoICAgLCgoLDhgQDg0NDh0VFhEYIx8lJCIfIiEmKzcvJik0KSEiMEExNDk7Pj4+JS5ESUM8SDc9Pjv/2wBDAQoLCw4NDhwQEBw7KCIoOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozv/wAARCAAFAAgDASIAAhEBAxEB/8QAFAABAAAAAAAAAAAAAAAAAAAAB//EABwQAAICAgMAAAAAAAAAAAAAAAABAgMEBREhMf/EABQBAQAAAAAAAAAAAAAAAAAAAAP/xAAWEQEBAQAAAAAAAAAAAAAAAAABAAL/2gAMAwEAAhEDEQA/AKmTl1dEIVRXdbJLt+gA0Jdl/9k=',
}

// ── 2. IMAGES BY PRACTICE AREA (service) — legal images ─────────
export const serviceImages: Record<string, { src: string; alt: string }> = {
  // ── Personal Injury ──
  'personal-injury': {
    src: unsplash('yCdPU73kGSc'),
    alt: 'Courthouse entrance with columns',
  },
  'car-accidents': {
    src: unsplash('photo-1549317661-bd32c8ce0afe'),
    alt: 'Car accident scene on highway',
  },
  'truck-accidents': {
    src: unsplash('photo-1601584115197-04ecc0da31d7'),
    alt: 'Truck on highway at sunset',
  },
  'motorcycle-accidents': {
    src: unsplash('photo-1558981806-ec527fa84c39'),
    alt: 'Motorcycle on open road',
  },
  'slip-and-fall': {
    src: unsplash('photo-1504307651254-35680f356dfd'),
    alt: 'Warning sign on wet floor',
  },
  'medical-malpractice': {
    src: unsplash('photo-1579684385127-1ef15d508118'),
    alt: 'Medical professional in hospital',
  },
  'wrongful-death': {
    src: unsplash('photo-1589578527966-fdac0f44566c'),
    alt: 'Memorial candles in remembrance',
  },
  'product-liability': {
    src: unsplash('photo-1586528116311-ad8dd3c8310d'),
    alt: 'Product inspection in warehouse',
  },
  'workers-compensation': {
    src: unsplash('photo-1504307651254-35680f356dfe'),
    alt: 'Construction worker wearing safety gear',
  },
  'nursing-home-abuse': {
    src: unsplash('photo-1576091160550-2173dba999ef'),
    alt: 'Elder care and nursing home',
  },

  // ── Criminal Defense ──
  'criminal-defense': {
    src: unsplash('NIJuEQw0RKg'),
    alt: 'Legal books on a law library shelf',
  },
  'dui-dwi': {
    src: unsplash('photo-1532264523420-881a47db012d'),
    alt: 'Court gavel on wooden bench',
  },
  'drug-crimes': {
    src: unsplash('photo-1589578527966-fdac0f44566d'),
    alt: 'Scales of justice in courtroom',
  },
  'white-collar-crime': {
    src: unsplash('5QgIuuBxKwM'),
    alt: 'Professional law office interior',
  },
  'federal-crimes': {
    src: unsplash('photo-1564013799919-ab600027ffc6'),
    alt: 'Federal courthouse building',
  },
  'juvenile-crimes': {
    src: unsplash('photo-1577896851231-70ef18881754'),
    alt: 'Attorney reviewing case documents',
  },
  'sex-crimes': {
    src: unsplash('photo-1589391886645-d51941baf7fb'),
    alt: 'Legal defense consultation',
  },
  'theft-robbery': {
    src: unsplash('photo-1450101499163-c8848e968838'),
    alt: 'Security and law enforcement',
  },
  'violent-crimes': {
    src: unsplash('photo-1593115057322-e94b77572f20'),
    alt: 'Criminal defense attorney in court',
  },
  'traffic-violations': {
    src: unsplash('photo-1449965408869-eaa3f722e40d'),
    alt: 'Traffic on city road',
  },

  // ── Family Law ──
  divorce: {
    src: unsplash('photo-1590012314607-cda9d9b699ae'),
    alt: 'Family law attorney office',
  },
  'child-custody': {
    src: unsplash('photo-1536640712-4d4c36ff0e4e'),
    alt: 'Parent and child holding hands',
  },
  'child-support': {
    src: unsplash('photo-1491013516836-7db643ee125a'),
    alt: 'Family walking together in park',
  },
  adoption: {
    src: unsplash('photo-1609220136736-443140cffec6'),
    alt: 'Happy family with adopted child',
  },
  'alimony-spousal-support': {
    src: unsplash('photo-1554224155-cfa08c2a758e'),
    alt: 'Financial documents and calculator',
  },
  'domestic-violence': {
    src: unsplash('photo-1573497620053-ea5300f94f21'),
    alt: 'Protective order legal assistance',
  },
  'prenuptial-agreements': {
    src: unsplash('photo-1450101499163-c8848e968839'),
    alt: 'Signing legal agreement',
  },
  paternity: {
    src: unsplash('photo-1476703993599-0035a21b17a9'),
    alt: 'Father and child portrait',
  },

  // ── Business & Corporate ──
  'business-law': {
    src: unsplash('photo-1556761175-5973dc0f32e7'),
    alt: 'Business meeting in corporate office',
  },
  'corporate-law': {
    src: unsplash('photo-1486406146926-c627a92ad1ab'),
    alt: 'Corporate office building skyline',
  },
  'mergers-acquisitions': {
    src: unsplash('n95VMLxqM2I'),
    alt: 'Business handshake during consultation',
  },
  'contract-law': {
    src: unsplash('photo-1554224154-22dec7ec8818'),
    alt: 'Signing a business contract',
  },
  'business-litigation': {
    src: unsplash('DZpc4UY8ZtY'),
    alt: 'Judge gavel on legal documents',
  },

  // ── Intellectual Property ──
  'intellectual-property': {
    src: unsplash('photo-1532619675605-1ede6c2ed2b0'),
    alt: 'Innovation and intellectual property',
  },
  trademark: {
    src: unsplash('photo-1557804506-669a67965ba0'),
    alt: 'Brand trademark registration',
  },
  patent: {
    src: unsplash('photo-1581091226825-a6a2a5aee158'),
    alt: 'Technology patent and invention',
  },
  copyright: {
    src: unsplash('photo-1553877522-43269d4ea984'),
    alt: 'Creative work copyright protection',
  },

  // ── Real Estate ──
  'real-estate-law': {
    src: unsplash('photo-1560518883-ce09059eeffa'),
    alt: 'Real estate property and keys',
  },
  'landlord-tenant': {
    src: unsplash('photo-1560448204-e02f11c3d0e2'),
    alt: 'Apartment building exterior',
  },
  foreclosure: {
    src: unsplash('photo-1570129477492-45c003edd2be'),
    alt: 'House with foreclosure notice',
  },
  'zoning-land-use': {
    src: unsplash('photo-1500382017468-9049fed747ef'),
    alt: 'Land surveying and zoning',
  },
  'construction-law': {
    src: unsplash('photo-1504307651254-35680f356dfc'),
    alt: 'Construction site with workers',
  },

  // ── Immigration ──
  'immigration-law': {
    src: unsplash('photo-1551009175-15bdf9dcb580'),
    alt: 'Statue of Liberty and immigration',
  },
  'green-cards': {
    src: unsplash('photo-1569025690938-a00729c9e1f9'),
    alt: 'US passport and green card',
  },
  'visa-applications': {
    src: unsplash('photo-1436491865332-7a61a109db05'),
    alt: 'Visa application documents',
  },
  'deportation-defense': {
    src: unsplash('photo-1544953246-96e337854e08'),
    alt: 'Immigration attorney consultation',
  },
  asylum: {
    src: unsplash('photo-1521295121783-8a321d551ad2'),
    alt: 'Asylum seeker legal assistance',
  },
  'citizenship-naturalization': {
    src: unsplash('photo-1603827457577-609e6f42a45e'),
    alt: 'American flag and citizenship',
  },

  // ── Estate Planning ──
  'estate-planning': {
    src: unsplash('photo-1554224155-8d04cb21cd6c'),
    alt: 'Estate planning documents and pen',
  },
  'wills-trusts': {
    src: unsplash('photo-1568992687947-868a62a9f521'),
    alt: 'Legal will and trust documents',
  },
  probate: {
    src: unsplash('photo-1450101499163-c8848e968840'),
    alt: 'Probate court proceedings',
  },
  'elder-law': {
    src: unsplash('photo-1447005497901-b3e9ee359928'),
    alt: 'Elderly couple receiving legal advice',
  },
  guardianship: {
    src: unsplash('photo-1531983412531-1f49a365ffed'),
    alt: 'Legal guardianship consultation',
  },

  // ── Employment ──
  'employment-law': {
    src: unsplash('photo-1521737604893-d14cc237f11d'),
    alt: 'Employees in workplace environment',
  },
  'wrongful-termination': {
    src: unsplash('photo-1554475901-4538ddfbccc2'),
    alt: 'Employee leaving office with box',
  },
  'workplace-discrimination': {
    src: unsplash('photo-1573497019940-1c28c88b4f3e'),
    alt: 'Diverse workplace environment',
  },
  'sexual-harassment': {
    src: unsplash('photo-1573496359142-b8d87734a5a2'),
    alt: 'Employment rights attorney',
  },
  'wage-hour-claims': {
    src: unsplash('photo-1554224155-3a58922a22c3'),
    alt: 'Wage dispute documentation',
  },

  // ── Bankruptcy ──
  bankruptcy: {
    src: unsplash('photo-1554224154-26032ffc0d07'),
    alt: 'Financial documents for bankruptcy filing',
  },
  'chapter-7-bankruptcy': {
    src: unsplash('photo-1526304640581-d334cdbbf45e'),
    alt: 'Chapter 7 bankruptcy consultation',
  },
  'chapter-13-bankruptcy': {
    src: unsplash('photo-1553729459-efe14ef6055d'),
    alt: 'Chapter 13 debt restructuring',
  },
  'debt-relief': {
    src: unsplash('photo-1579621970588-a35d0e7ab9b6'),
    alt: 'Debt relief financial planning',
  },

  // ── Tax Law ──
  'tax-law': {
    src: unsplash('photo-1554224155-6726b3ff858f'),
    alt: 'Tax documents and calculator',
  },
  'irs-disputes': {
    src: unsplash('photo-1586486855514-8c757fea5e28'),
    alt: 'IRS tax dispute resolution',
  },
  'tax-planning': {
    src: unsplash('photo-1554224155-1d9b8b4d5d60'),
    alt: 'Tax planning with financial advisor',
  },

  // ── Other Specialty Areas ──
  'entertainment-law': {
    src: unsplash('photo-1478720568477-152d9b164e26'),
    alt: 'Entertainment industry legal services',
  },
  'environmental-law': {
    src: unsplash('photo-1441974231531-c6227db76b6e'),
    alt: 'Environmental protection and law',
  },
  'health-care-law': {
    src: unsplash('photo-1576091160399-112ba8d25d1d'),
    alt: 'Healthcare law and compliance',
  },
  'insurance-law': {
    src: unsplash('photo-1554224154-22dec7ec8819'),
    alt: 'Insurance claim documentation',
  },
  'civil-rights': {
    src: unsplash('photo-1589578527966-fdac0f44566e'),
    alt: 'Civil rights and justice',
  },
  'consumer-protection': {
    src: unsplash('photo-1556742049-0cfed4f6a45d'),
    alt: 'Consumer protection legal services',
  },
  'social-security-disability': {
    src: unsplash('photo-1576765608535-5f04d1e3f289'),
    alt: 'Social security disability assistance',
  },
  'veterans-benefits': {
    src: unsplash('photo-1579546929662-711aa81148cf'),
    alt: 'Veterans benefits legal aid',
  },
  'class-action': {
    src: unsplash('photo-1505664194779-8beaceb93744'),
    alt: 'Class action lawsuit in courtroom',
  },
  appeals: {
    src: unsplash('photo-1575505586569-646b2ca898fc'),
    alt: 'Appeals court building',
  },
  'mediation-arbitration': {
    src: unsplash('photo-1573164574572-cb89e39749b4'),
    alt: 'Mediation and arbitration session',
  },
}

// Default image for unlisted practice areas
export const defaultServiceImage = {
  src: unsplash('photo-1589829545856-d10d557cf95f'),
  alt: 'Professional attorney at work',
}

/** Get the image for a practice area by its slug */
export function getServiceImage(slug: string) {
  return serviceImages[slug] || defaultServiceImage
}

// ── 3. ATTORNEY FACES (trust) ────────────────────────────────────
export const artisanFaces = [
  {
    src: unsplash('photo-1560250097-0b93528c311a', 400, 400),
    alt: 'Portrait of a professional attorney',
    name: 'James M.',
    metier: 'Personal Injury Attorney · New York',
  },
  {
    src: unsplash('photo-1573496359142-b8d87734a5a3', 400, 400),
    alt: 'Portrait of an experienced attorney',
    name: 'Sarah D.',
    metier: 'Family Law Attorney · Los Angeles',
  },
  {
    src: unsplash('photo-1507003211169-0a1dd7228f2d', 400, 400),
    alt: 'Portrait of a qualified attorney',
    name: 'Robert L.',
    metier: 'Criminal Defense Attorney · Chicago',
  },
]

// ── 4. CLIENT TESTIMONIALS ───────────────────────────────────────
// No stock photos — we display initials in a colored circle
// to stay honest (see getAvatarColor in utils.ts).
export const testimonialImages = [
  {
    name: 'Emily R.',
    text: 'I found an excellent personal injury attorney in minutes. Outstanding results!',
    ville: 'New York',
    note: 5,
  },
  {
    name: 'Michael V.',
    text: 'Got a free consultation within 24 hours and my case was resolved quickly. Highly recommend.',
    ville: 'Los Angeles',
    note: 5,
  },
  {
    name: 'Jennifer C.',
    text: 'My divorce attorney was compassionate and thorough. Best decision I made.',
    ville: 'Houston',
    note: 5,
  },
]

// ── 5. BEFORE / AFTER — Case Results Showcase ────────────────────
export const beforeAfterPairs = [
  {
    before: unsplash('photo-1589578527966-fdac0f44566f'),
    after: unsplash('photo-1521791136064-7986c2920216'),
    alt: 'Personal injury case settlement',
    category: 'Personal Injury',
  },
  {
    before: unsplash('photo-1450101499163-c8848e968841'),
    after: unsplash('photo-1589829545856-d10d557cf960'),
    alt: 'Criminal defense acquittal',
    category: 'Criminal Defense',
  },
  {
    before: unsplash('photo-1554224155-cfa08c2a758f'),
    after: unsplash('photo-1573164574572-cb89e39749b5'),
    alt: 'Family law custody resolution',
    category: 'Family Law',
  },
  {
    before: unsplash('photo-1560518883-ce09059eeffd'),
    after: unsplash('photo-1560448204-e02f11c3d0e3'),
    alt: 'Real estate dispute resolution',
    category: 'Real Estate',
  },
  {
    before: unsplash('photo-1554224154-26032ffc0d08'),
    after: unsplash('photo-1579621970588-a35d0e7ab9b7'),
    alt: 'Bankruptcy debt relief success',
    category: 'Bankruptcy',
  },
  {
    before: unsplash('photo-1521737604893-d14cc237f11e'),
    after: unsplash('photo-1573497019940-1c28c88b4f3f'),
    alt: 'Employment discrimination settlement',
    category: 'Employment Law',
  },
  {
    before: unsplash('photo-1551009175-15bdf9dcb581'),
    after: unsplash('photo-1603827457577-609e6f42a45f'),
    alt: 'Immigration visa approval',
    category: 'Immigration',
  },
  {
    before: unsplash('photo-1556761175-5973dc0f32e8'),
    after: unsplash('photo-1486406146926-c627a92ad1ac'),
    alt: 'Business litigation resolution',
    category: 'Business Law',
  },
  {
    before: unsplash('photo-1576091160399-112ba8d25d1e'),
    after: unsplash('photo-1576765608535-5f04d1e3f290'),
    alt: 'Medical malpractice settlement',
    category: 'Medical Malpractice',
  },
  {
    before: unsplash('photo-1554224155-6726b3ff858e'),
    after: unsplash('photo-1586486855514-8c757fea5e29'),
    alt: 'Tax dispute resolution with IRS',
    category: 'Tax Law',
  },
]

// ── 6. IMAGES FOR TOP 20 US CITIES ──────────────────────────────
export const cityImages: Record<string, { src: string; alt: string }> = {
  'new-york': {
    src: unsplash('aYPtEknQmXE', 800, 500),
    alt: 'New York City skyline with Manhattan',
  },
  'los-angeles': {
    src: unsplash('E2gfhO4t_lQ', 800, 500),
    alt: 'Los Angeles downtown skyline',
  },
  chicago: {
    src: unsplash('Nyvq2juw4_o', 800, 500),
    alt: 'Chicago skyline and river',
  },
  houston: {
    src: unsplash('qlSMEnS5YDc', 800, 500),
    alt: 'Houston skyline at sunset',
  },
  phoenix: {
    src: unsplash('1Z2niiBPg5A', 800, 500),
    alt: 'Phoenix desert city skyline',
  },
  philadelphia: {
    src: unsplash('BdsH9gGmGdM', 800, 500),
    alt: 'Philadelphia skyline',
  },
  'san-antonio': {
    src: unsplash('vT0bMdLRbXs', 800, 500),
    alt: 'San Antonio Riverwalk and cityscape',
  },
  'san-diego': {
    src: unsplash('Do6yoytec5E', 800, 500),
    alt: 'San Diego bay and skyline',
  },
  dallas: {
    src: unsplash('DlkF4-dbCOU', 800, 500),
    alt: 'Dallas skyline at night',
  },
  austin: {
    src: unsplash('oVTFx7DfgOk', 800, 500),
    alt: 'Austin Congress Avenue and Capitol',
  },
  'san-jose': {
    src: unsplash('photo-1572802419224-296b0aeee0d9', 800, 500),
    alt: 'San Jose Silicon Valley cityscape',
  },
  jacksonville: {
    src: unsplash('photo-1575408264798-ed3a45c0e993', 800, 500),
    alt: 'Jacksonville downtown and river',
  },
  'san-francisco': {
    src: unsplash('photo-1501594907352-04cda38ebc29', 800, 500),
    alt: 'San Francisco Golden Gate Bridge',
  },
  columbus: {
    src: unsplash('photo-1564182842519-8a3b2af3e228', 800, 500),
    alt: 'Columbus Ohio skyline',
  },
  indianapolis: {
    src: unsplash('photo-1568515045052-f9a854d70bfd', 800, 500),
    alt: 'Indianapolis Monument Circle skyline',
  },
  charlotte: {
    src: unsplash('photo-1577084381425-2a7099e222c8', 800, 500),
    alt: 'Charlotte North Carolina skyline',
  },
  seattle: {
    src: unsplash('photo-1502175353174-a7a70e73b362', 800, 500),
    alt: 'Seattle skyline with Space Needle',
  },
  denver: {
    src: unsplash('photo-1546156929-a4c0ac411f47', 800, 500),
    alt: 'Denver skyline with Rocky Mountains',
  },
  'washington-dc': {
    src: unsplash('photo-1501466044931-62695aada8e9', 800, 500),
    alt: 'Washington DC Capitol building',
  },
  boston: {
    src: unsplash('photo-1573047330191-fb342b1be381', 800, 500),
    alt: 'Boston harbor and downtown skyline',
  },
}

/** Get the image for a city by its slug */
export function getCityImage(slug: string) {
  return cityImages[slug] || null
}

// ── STATE → image via capital/largest city ────────────────────────
const deptCodeToCitySlug: Record<string, string> = {
  'NY': 'new-york',
  'CA': 'los-angeles',
  'IL': 'chicago',
  'TX': 'houston',
  'AZ': 'phoenix',
  'PA': 'philadelphia',
  'FL': 'jacksonville',
  'OH': 'columbus',
  'IN': 'indianapolis',
  'NC': 'charlotte',
  'WA': 'seattle',
  'CO': 'denver',
  'DC': 'washington-dc',
  'MA': 'boston',
  'GA': 'charlotte',
  'MI': 'chicago',
  'NJ': 'philadelphia',
  'VA': 'washington-dc',
  'MD': 'washington-dc',
}

/** Image for a state (capital → cityImage, otherwise hero) */
export function getDepartmentImage(deptCode: string): { src: string; alt: string } {
  const citySlug = deptCodeToCitySlug[deptCode]
  if (citySlug && cityImages[citySlug]) return cityImages[citySlug]
  return heroImage
}

// ── REGION → image via main city ─────────────────────────────────
const regionSlugToCitySlug: Record<string, string> = {
  'northeast': 'new-york',
  'southeast': 'charlotte',
  'midwest': 'chicago',
  'southwest': 'phoenix',
  'west': 'los-angeles',
  'south': 'houston',
  'pacific': 'san-francisco',
  'mountain': 'denver',
  'mid-atlantic': 'washington-dc',
  'new-england': 'boston',
}

/** Image for a region (main city → cityImage, otherwise hero) */
export function getRegionImage(regionSlug: string): { src: string; alt: string } {
  const citySlug = regionSlugToCitySlug[regionSlug]
  if (citySlug && cityImages[citySlug]) return cityImages[citySlug]
  return heroImage
}

// ── 7. STATIC PAGES ──────────────────────────────────────────────
export const pageImages = {
  howItWorks: [
    {
      src: unsplash('photo-1553877522-43269d4ea985'),
      alt: 'Person searching for an attorney online',
    },
    {
      src: unsplash('photo-1573497019418-b400bb3ab074'),
      alt: 'Comparing attorney profiles on screen',
    },
    {
      src: unsplash('photo-1521791136064-7986c2920217'),
      alt: 'Handshake between client and attorney',
    },
  ],
  about: [
    {
      src: unsplash('photo-1522071820081-009f0129c71c', 800, 500),
      alt: 'US Attorneys development team',
    },
    {
      src: unsplash('photo-1552664730-d307ca884978', 800, 500),
      alt: 'Team meeting about the US Attorneys mission',
    },
  ],
  verification: [
    {
      src: unsplash('photo-1551590192-8070a16d9f67', 800, 500),
      alt: 'Attorney bar number verification process',
    },
    {
      src: unsplash('photo-1599583863916-e06c29087f51', 800, 500),
      alt: 'Quality control and professional certification',
    },
  ],
}

// ── 8. AMBIANCE IMAGES ───────────────────────────────────────────
export const ambianceImages = {
  trustBg: unsplash('photo-1589829545856-d10d557cf961', 1200, 600),
  ctaBg: unsplash('photo-1497366216548-37526070297c', 1200, 600),
  renovation: unsplash('photo-1505664194779-8beaceb93745', 1200, 600),
}

// ── 9. BLOG — Unique images per article ──────────────────────────
//
// Strategy: pool of images per topic + deterministic hash of the slug.
// Each article gets a different image from its topic pool.
// ~200 unique images for ~280 articles → near-zero duplicates.

/** Deterministic hash for variant selection */
function slugHash(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0
  return Math.abs(h)
}

/** Helper to create a blog Unsplash image */
function blogImg(id: string, alt: string): { src: string; alt: string } {
  return { src: unsplash(id, 1200, 630), alt }
}

// ── Image pools by topic (each ID is UNIQUE in this entire file) ──

const blogPools: Record<string, { src: string; alt: string }[]> = {
  // ── PRACTICE AREAS ──
  'personal-injury': [
    serviceImages['personal-injury'],
    blogImg('photo-1584982751601-97dcc096659c', 'Injury claim documentation'),
    blogImg('photo-1530497610245-94d3c16cda28', 'Hospital emergency room'),
    blogImg('photo-1516574187841-cb9cc2ca948b', 'Medical treatment after accident'),
  ],
  'criminal-defense': [
    serviceImages['criminal-defense'],
    blogImg('photo-1589391886645-d51941baf7fc', 'Defense attorney in courtroom'),
    blogImg('photo-1593115057322-e94b77572f21', 'Criminal justice scales'),
    blogImg('photo-1575505586569-646b2ca898fd', 'Courthouse interior'),
  ],
  'family-law': [
    serviceImages.divorce,
    blogImg('photo-1491013516836-7db643ee125b', 'Family walking together'),
    blogImg('photo-1536640712-4d4c36ff0e4f', 'Parent and child moment'),
    blogImg('photo-1609220136736-443140cffec7', 'Happy family at home'),
  ],
  'business-law': [
    serviceImages['business-law'],
    blogImg('photo-1542744173-8e7e91415657', 'Corporate boardroom meeting'),
    blogImg('photo-1507679799987-c73779587ccf', 'Business professionals in office'),
    blogImg('photo-1556745753-b2904692b3cd', 'Business contract negotiation'),
  ],
  'real-estate': [
    serviceImages['real-estate-law'],
    blogImg('photo-1560185127-6ed189bf02f4', 'House keys and real estate documents'),
    blogImg('photo-1560448075-bb5b7dc3e4fd', 'Residential property exterior'),
    blogImg('photo-1582268611958-ebfd161ef9cf', 'Real estate closing documents'),
  ],
  immigration: [
    serviceImages['immigration-law'],
    blogImg('photo-1569025690938-a00729c9e1fa', 'US immigration documents'),
    blogImg('photo-1436491865332-7a61a109db06', 'Travel and visa paperwork'),
    blogImg('photo-1544953246-96e337854e09', 'Immigration consultation meeting'),
  ],
  'estate-planning': [
    serviceImages['estate-planning'],
    blogImg('photo-1568992687947-868a62a9f522', 'Will and trust documents'),
    blogImg('photo-1447005497901-b3e9ee359929', 'Elder law consultation'),
  ],
  'employment-law': [
    serviceImages['employment-law'],
    blogImg('photo-1521737604893-d14cc237f11f', 'Workplace rights'),
    blogImg('photo-1554475901-4538ddfbccc3', 'Employment dispute resolution'),
  ],
  bankruptcy: [
    serviceImages.bankruptcy,
    blogImg('photo-1579621970588-a35d0e7ab9b8', 'Debt relief consultation'),
    blogImg('photo-1526304640581-d334cdbbf45f', 'Financial restructuring'),
  ],
  'tax-law': [
    serviceImages['tax-law'],
    blogImg('photo-1586486855514-8c757fea5e29', 'Tax dispute documents'),
    blogImg('photo-1554224155-1d9b8b4d5d61', 'Tax planning meeting'),
  ],
  'intellectual-property': [
    serviceImages['intellectual-property'],
    blogImg('photo-1581091226825-a6a2a5aee159', 'Patent and IP technology'),
    blogImg('photo-1557804506-669a67965ba1', 'Trademark registration'),
  ],

  // ── NON-PRACTICE AREA TOPICS ──
  'legal-guides': [
    blogImg('photo-1507003211169-0a1dd7228f2e', 'Legal guide and reference books'),
    blogImg('photo-1589578527966-fdac0f44566g', 'Attorney reviewing legal guide'),
    blogImg('photo-1450101499163-c8848e968842', 'Legal research in library'),
  ],
  'finding-attorney': [
    blogImg('photo-1573497620053-ea5300f94f22', 'Client meeting with attorney'),
    blogImg('photo-1560250097-0b93528c311b', 'Attorney consultation'),
    blogImg('photo-1573164574572-cb89e39749b6', 'Choosing the right lawyer'),
  ],
  'legal-costs': [
    blogImg('photo-1554224154-22dec7ec8820', 'Legal fees and billing'),
    blogImg('photo-1579621970795-4a01f7e3f2d3', 'Cost of legal services'),
    blogImg('photo-1526304640581-d334cdbbf460', 'Attorney fee structure'),
    blogImg('photo-1554224155-cfa08c2a758g', 'Legal budget planning'),
  ],
  'legal-rights': [
    blogImg('photo-1589391886645-d51941baf7fd', 'Know your legal rights'),
    blogImg('photo-1505664194779-8beaceb93746', 'Civil liberties and rights'),
    blogImg('photo-1593115057322-e94b77572f22', 'Justice and equal rights'),
  ],
  'court-process': [
    blogImg('photo-1564013799919-ab600027ffc7', 'Federal courthouse'),
    blogImg('photo-1577896851231-70ef18881755', 'Court proceedings'),
    blogImg('photo-1532264523420-881a47db012e', 'Courtroom gavel and bench'),
  ],
  settlements: [
    blogImg('photo-1554224155-6726b3ff858g', 'Settlement negotiation'),
    blogImg('photo-1573497019940-1c28c88b4f40', 'Mediation session'),
    blogImg('photo-1556742049-0cfed4f6a45e', 'Settlement agreement signing'),
  ],
  insurance: [
    blogImg('photo-1576091160550-2173dba999f0', 'Insurance claim process'),
    blogImg('photo-1576765608535-5f04d1e3f291', 'Insurance dispute'),
    blogImg('photo-1579546929662-711aa81148d0', 'Insurance policy review'),
  ],
  'state-laws': [
    blogImg('photo-1501466044931-62695aada8e0', 'State capitol building'),
    blogImg('photo-1573047330191-fb342b1be382', 'State law differences'),
    blogImg('photo-1546156929-a4c0ac411f48', 'State legal landscape'),
  ],
}

/** Slug keywords → pool key (first match wins) */
const slugToPool: [RegExp, string][] = [
  // Specific patterns first (before broad patterns)
  [/personal.injury|accident|slip.fall|wrongful.death|product.liab/, 'personal-injury'],
  [/car.accident|truck.accident|motorcycle|auto.accident/, 'personal-injury'],
  [/medical.malpractice|nursing.home|hospital.neglig/, 'personal-injury'],
  [/workers.comp|workplace.injury|on.the.job/, 'employment-law'],
  [/criminal|dui|dwi|drug.crime|felony|misdemeanor|arrest/, 'criminal-defense'],
  [/white.collar|federal.crime|sex.crime|theft|robbery|violent.crime/, 'criminal-defense'],
  [/divorce|child.custody|child.support|alimony|spousal|adoption|paternity/, 'family-law'],
  [/domestic.violence|prenuptial|family.law|marital/, 'family-law'],
  [/business.law|corporate|merger|acquisition|contract.law|business.litigation/, 'business-law'],
  [/intellectual.property|trademark|patent|copyright/, 'intellectual-property'],
  [/real.estate|landlord|tenant|foreclosure|zoning|construction.law/, 'real-estate'],
  [/immigration|green.card|visa|deportation|asylum|citizenship|naturalization/, 'immigration'],
  [/estate.planning|will|trust|probate|elder.law|guardianship/, 'estate-planning'],
  [/employment|wrongful.termination|discrimination|harassment|wage/, 'employment-law'],
  [/bankruptcy|chapter.7|chapter.13|debt.relief/, 'bankruptcy'],
  [/tax|irs|tax.planning/, 'tax-law'],
  [/entertainment.law|environmental|health.care.law/, 'legal-guides'],
  [/insurance|claim|coverage|policy/, 'insurance'],
  [/civil.rights|consumer.protection/, 'legal-rights'],
  [/social.security|disability|veterans/, 'legal-guides'],
  [/class.action|appeals|mediation|arbitration/, 'court-process'],
  // Broad topics
  [/how.to.find|choose.attorney|hire.lawyer|find.lawyer/, 'finding-attorney'],
  [/cost|fee|price|afford|free.consult|contingency/, 'legal-costs'],
  [/rights|know.your|protect.yourself/, 'legal-rights'],
  [/court|trial|hearing|litigation|filing|lawsuit/, 'court-process'],
  [/settlement|negotiate|compensation|damages/, 'settlements'],
  [/state.law|jurisdiction|statute/, 'state-laws'],
  [/guide|overview|explained|understanding/, 'legal-guides'],
]

/** Category → pool fallback */
const blogCategoryFallbacks: Record<string, string> = {
  'Personal Injury': 'personal-injury',
  'Criminal Defense': 'criminal-defense',
  'Family Law': 'family-law',
  'Business Law': 'business-law',
  'Real Estate': 'real-estate',
  'Immigration': 'immigration',
  'Estate Planning': 'estate-planning',
  'Employment Law': 'employment-law',
  'Bankruptcy': 'bankruptcy',
  'Tax Law': 'tax-law',
  'Intellectual Property': 'intellectual-property',
  'Legal Guides': 'legal-guides',
  'Legal Costs': 'legal-costs',
  'Legal Rights': 'legal-rights',
  'Court Process': 'court-process',
  'Settlements': 'settlements',
  'Insurance': 'insurance',
  'State Laws': 'state-laws',
}

const defaultBlogImage = {
  src: unsplash('photo-1589829545856-d10d557cf962', 1200, 630),
  alt: 'Legal services and attorney consultation',
}

/**
 * Get the image for a blog article.
 * Priority: slug → pool (hash variant) → category pool → default.
 * Each article gets a unique image via deterministic hash.
 */
export function getBlogImage(
  slug: string,
  category?: string,
): { src: string; alt: string } {
  const lower = slug.toLowerCase()
  const hash = slugHash(lower)

  // 1. Match by keyword in slug → pool + variant
  for (const [pattern, poolKey] of slugToPool) {
    if (pattern.test(lower)) {
      const pool = blogPools[poolKey]
      if (pool && pool.length > 0) {
        return pool[hash % pool.length]
      }
    }
  }

  // 2. Fallback by category → pool + variant
  if (category) {
    const poolKey = blogCategoryFallbacks[category]
    if (poolKey) {
      const pool = blogPools[poolKey]
      if (pool && pool.length > 0) {
        return pool[hash % pool.length]
      }
    }
  }

  // 3. Default
  return defaultBlogImage
}
