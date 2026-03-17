import { SITE_URL } from '@/lib/seo/config'

// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------

export enum PageType {
  A = 'directory',
  B = 'attorney-variant',
  C = 'best-rated',
  D = 'free-consultation',
  E = 'affordable',
  F = 'cost',
  G = 'situation',
  H = 'demographic',
  I = 'emergency',
  J = 'county',
  K = 'neighborhood',
  L = 'faq',
  M = 'state-guide',
  N = 'comparative',
  O = 'spanish',
  P = 'reviews',
  Q = 'industry',
}

export enum IntentType {
  LISTING = 'attorneys',
  HIRE = 'hire',
  COST = 'cost',
  REVIEWS = 'reviews',
  EMERGENCY = 'emergency',
}

export enum SpanishIntentType {
  ABOGADOS = 'abogados',
  CONTRATAR = 'contratar',
  COSTO = 'costo',
  OPINIONES = 'opiniones',
  EMERGENCIA = 'emergencia',
}

// ---------------------------------------------------------------------------
// Interfaces
// ---------------------------------------------------------------------------

export interface BreadcrumbItem {
  name: string
  url: string
}

export interface QualityFilter {
  minAttorneys: number
  noindexIfEmpty: boolean
}

export interface SitemapConfig {
  batchSize: number
  priority: number
  changefreq: string
}

export interface PageTypeConfig {
  type: PageType
  urlPattern: string
  titleTemplates: string[]
  descriptionTemplates: string[]
  h1Templates: string[]
  schemaType: 'LegalService' | 'FAQPage' | 'CollectionPage' | 'ItemList' | 'HowTo' | 'WebPage'
  breadcrumbPattern: BreadcrumbItem[]
  estimatedPages: number
  qualityFilter: QualityFilter
  sitemapConfig: SitemapConfig
  prerenderCount: number
}

// ---------------------------------------------------------------------------
// Helper: deterministic hash
// ---------------------------------------------------------------------------

export function hashCode(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash + char) | 0
  }
  return Math.abs(hash)
}

// ---------------------------------------------------------------------------
// Template interpolation
// ---------------------------------------------------------------------------

function interpolate(template: string, vars: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (_, key) => vars[key] ?? '')
}

function selectTemplate(templates: string[], vars: Record<string, string>): string {
  const key = Object.values(vars).join('|')
  const idx = hashCode(key) % templates.length
  return interpolate(templates[idx], vars)
}

// ---------------------------------------------------------------------------
// Geographic layers
// ---------------------------------------------------------------------------

// Layer × PA matrix (200 practice areas across all geo layers)
// state: 200 PA × 51 = 10,200 | county: 200 PA × 3,144 = 628,800
// city: 150 PA × 15,000 = 2,250,000 | neighborhood: 50 PA × 17,000 = 850,000
export const GEOGRAPHIC_LAYERS = {
  state: { count: 51, urlPrefix: '/states' },
  county: { count: 3144, urlPrefix: '/counties' },
  city: { count: 15000, urlPrefix: '/cities' },
  neighborhood: { count: 17000, urlPrefix: null },
  zip: { count: 41000, urlPrefix: null },
  courthouse: { count: 800, urlPrefix: '/courthouses' },
} as const

// ---------------------------------------------------------------------------
// Demographic modifiers
// ---------------------------------------------------------------------------

export const DEMOGRAPHIC_MODIFIERS = [
  'female',
  'male',
  'bilingual',
  'spanish-speaking',
  'black',
  'asian',
  'lgbtq-friendly',
  'veteran',
] as const

// ---------------------------------------------------------------------------
// Sitemap strategy
// ---------------------------------------------------------------------------

export const SITEMAP_STRATEGY = {
  maxUrlsPerSitemap: 45000,
  phase1Cities: 300,
  phase2Cities: 3000,
  phase3AllCities: true,
  buildPrerender: 5000,
  isrRevalidate: 86400,
  cdnStaleWhileRevalidate: 604800,
} as const

// ---------------------------------------------------------------------------
// Intent mapping (English <-> Spanish)
// ---------------------------------------------------------------------------

const INTENT_TO_SPANISH: Record<IntentType, SpanishIntentType> = {
  [IntentType.LISTING]: SpanishIntentType.ABOGADOS,
  [IntentType.HIRE]: SpanishIntentType.CONTRATAR,
  [IntentType.COST]: SpanishIntentType.COSTO,
  [IntentType.REVIEWS]: SpanishIntentType.OPINIONES,
  [IntentType.EMERGENCY]: SpanishIntentType.EMERGENCIA,
}

const SPANISH_TO_INTENT: Record<SpanishIntentType, IntentType> = {
  [SpanishIntentType.ABOGADOS]: IntentType.LISTING,
  [SpanishIntentType.CONTRATAR]: IntentType.HIRE,
  [SpanishIntentType.COSTO]: IntentType.COST,
  [SpanishIntentType.OPINIONES]: IntentType.REVIEWS,
  [SpanishIntentType.EMERGENCIA]: IntentType.EMERGENCY,
}

// ---------------------------------------------------------------------------
// PAGE_TYPES — full config for all 17 page types (A–Q)
// ---------------------------------------------------------------------------

export const PAGE_TYPES: Record<PageType, PageTypeConfig> = {
  // =========================================================================
  // A — Directory: "lawyer in [city]"
  // =========================================================================
  [PageType.A]: {
    type: PageType.A,
    urlPattern: '/attorneys/{specialty}/{location}',
    titleTemplates: [
      '{specialty} Lawyer in {location} | Top Rated',
      'Find a {specialty} Lawyer in {location}',
      '{specialty} Lawyers in {location}, {state}',
      'Top {specialty} Lawyers in {location}',
      '{count}+ {specialty} Lawyers in {location}',
    ],
    descriptionTemplates: [
      'Find the best {specialty} lawyers in {location}, {state}. Compare {count}+ attorneys, read reviews, and book a free consultation today.',
      'Browse top-rated {specialty} lawyers in {location}. Verified bar numbers, client reviews, and free consultations available.',
      'Need a {specialty} lawyer in {location}? Search {count}+ licensed attorneys. Compare ratings and experience. 100% free directory.',
      '{specialty} attorneys in {location}, {state}. View profiles, ratings, and case results. Connect with a qualified lawyer now.',
      'Directory of {specialty} lawyers in {location}. Filter by experience, ratings, and fees. Free consultation available from top attorneys.',
    ],
    h1Templates: [
      '{specialty} Lawyers in {location}',
      'Top {specialty} Lawyers in {location}, {state}',
      'Find a {specialty} Lawyer in {location}',
      '{specialty} Attorneys in {location}',
      '{count} {specialty} Lawyers Near {location}',
    ],
    schemaType: 'CollectionPage',
    breadcrumbPattern: [
      { name: 'Home', url: '/' },
      { name: '{state}', url: '/states/{state_slug}' },
      { name: '{location}', url: '/cities/{location_slug}' },
      { name: '{specialty}', url: '/attorneys/{specialty_slug}/{location_slug}' },
    ],
    estimatedPages: 2_250_000,
    qualityFilter: { minAttorneys: 1, noindexIfEmpty: true },
    sitemapConfig: { batchSize: 45000, priority: 0.8, changefreq: 'weekly' },
    prerenderCount: 500,
  },

  // =========================================================================
  // B — Attorney variant: "attorney in [city]"
  // =========================================================================
  [PageType.B]: {
    type: PageType.B,
    urlPattern: '/attorneys/{specialty}/{location}/all',
    titleTemplates: [
      '{specialty} Attorney in {location} | Directory',
      'Licensed {specialty} Attorneys in {location}',
      '{specialty} Attorneys Near {location}, {state}',
      'Hire a {specialty} Attorney in {location}',
      '{location} {specialty} Attorney Listings',
    ],
    descriptionTemplates: [
      'Search licensed {specialty} attorneys in {location}, {state}. {count}+ verified professionals with ratings, reviews, and contact info.',
      'Find a trusted {specialty} attorney in {location}. Compare qualifications, case results, and client reviews. Free to search.',
      '{specialty} attorneys serving {location} and surrounding areas. Bar-verified, rated by clients. Book a consultation today.',
      'Looking for a {specialty} attorney in {location}? Browse {count}+ profiles with experience details, fees, and client feedback.',
      'Complete list of {specialty} attorneys in {location}, {state}. Verified credentials, peer reviews, and free consultation options.',
    ],
    h1Templates: [
      '{specialty} Attorneys in {location}',
      'Licensed {specialty} Attorneys in {location}',
      'All {specialty} Attorneys in {location}, {state}',
      '{specialty} Attorney Directory — {location}',
      'Find {specialty} Attorneys Near {location}',
    ],
    schemaType: 'CollectionPage',
    breadcrumbPattern: [
      { name: 'Home', url: '/' },
      { name: '{state}', url: '/states/{state_slug}' },
      { name: '{location}', url: '/cities/{location_slug}' },
      { name: '{specialty} Attorneys', url: '/attorneys/{specialty_slug}/{location_slug}/all' },
    ],
    estimatedPages: 1_500_000,
    qualityFilter: { minAttorneys: 1, noindexIfEmpty: true },
    sitemapConfig: { batchSize: 45000, priority: 0.7, changefreq: 'weekly' },
    prerenderCount: 300,
  },

  // =========================================================================
  // C — Best rated: "best [specialty] in [city]"
  // =========================================================================
  [PageType.C]: {
    type: PageType.C,
    urlPattern: '/attorneys/{specialty}/{location}/best',
    titleTemplates: [
      'Best {specialty} Lawyers in {location} (2026)',
      'Top Rated {specialty} Lawyers in {location}',
      '{location}\'s Best {specialty} Attorneys',
      'Best {specialty} Attorneys in {location}, {state}',
      'Highest Rated {specialty} Lawyers — {location}',
    ],
    descriptionTemplates: [
      'The best {specialty} lawyers in {location} ranked by client reviews and case results. {count}+ top-rated attorneys compared.',
      'Top-rated {specialty} attorneys in {location}, {state}. Ranked by win rate, client satisfaction, and peer endorsements.',
      'Looking for the best {specialty} lawyer in {location}? See rankings based on reviews, experience, and outcomes.',
      'Best {specialty} lawyers in {location} for 2026. Compare the top {count} attorneys by rating, fees, and client testimonials.',
      'Ranked list of {location}\'s best {specialty} attorneys. Verified reviews, bar credentials, and consultation availability.',
    ],
    h1Templates: [
      'Best {specialty} Lawyers in {location}',
      'Top Rated {specialty} Attorneys in {location}',
      'Best {specialty} Lawyers in {location} (2026)',
      '{location}\'s Highest Rated {specialty} Lawyers',
      'Top {count} {specialty} Lawyers in {location}',
    ],
    schemaType: 'ItemList',
    breadcrumbPattern: [
      { name: 'Home', url: '/' },
      { name: '{state}', url: '/states/{state_slug}' },
      { name: '{location}', url: '/cities/{location_slug}' },
      { name: 'Best {specialty}', url: '/attorneys/{specialty_slug}/{location_slug}/best' },
    ],
    estimatedPages: 975_000,
    qualityFilter: { minAttorneys: 3, noindexIfEmpty: true },
    sitemapConfig: { batchSize: 45000, priority: 0.8, changefreq: 'weekly' },
    prerenderCount: 300,
  },

  // =========================================================================
  // D — Free consultation: "free consultation [specialty] [city]"
  // =========================================================================
  [PageType.D]: {
    type: PageType.D,
    urlPattern: '/hire/{specialty}/{location}',
    titleTemplates: [
      'Free {specialty} Consultation in {location}',
      '{specialty} Free Consultation — {location}',
      'Free Legal Consult: {specialty} in {location}',
      'Get Free {specialty} Advice in {location}',
      '{specialty} Lawyers — Free Consult {location}',
    ],
    descriptionTemplates: [
      'Get a free {specialty} consultation in {location}. {count}+ attorneys offering no-obligation case reviews. Call or book online.',
      'Free {specialty} consultation in {location}, {state}. Speak with a licensed attorney about your case at no cost.',
      'Looking for free legal advice on {specialty} in {location}? Connect with attorneys offering complimentary consultations.',
      'No-cost {specialty} consultations in {location}. {count}+ lawyers ready to review your case. No strings attached.',
      'Free {specialty} case evaluation in {location}. Licensed attorneys, confidential consultations, zero upfront cost.',
    ],
    h1Templates: [
      'Free {specialty} Consultation in {location}',
      '{specialty} — Free Consultation in {location}',
      'Free Case Review: {specialty} in {location}',
      'Get Free {specialty} Legal Advice — {location}',
      '{specialty} Lawyers With Free Consults — {location}',
    ],
    schemaType: 'LegalService',
    breadcrumbPattern: [
      { name: 'Home', url: '/' },
      { name: 'Hire', url: '/hire' },
      { name: '{specialty}', url: '/hire/{specialty_slug}' },
      { name: '{location}', url: '/hire/{specialty_slug}/{location_slug}' },
    ],
    estimatedPages: 650_000,
    qualityFilter: { minAttorneys: 1, noindexIfEmpty: true },
    sitemapConfig: { batchSize: 45000, priority: 0.7, changefreq: 'weekly' },
    prerenderCount: 200,
  },

  // =========================================================================
  // E — Affordable / Pro bono
  // =========================================================================
  [PageType.E]: {
    type: PageType.E,
    urlPattern: '/attorneys/{specialty}/{location}/affordable',
    titleTemplates: [
      'Affordable {specialty} Lawyers in {location}',
      'Low Cost {specialty} Attorneys — {location}',
      'Pro Bono {specialty} Lawyers in {location}',
      'Budget {specialty} Legal Help in {location}',
      'Cheap {specialty} Attorneys in {location}, {state}',
    ],
    descriptionTemplates: [
      'Find affordable {specialty} lawyers in {location}. Compare low-cost attorneys, sliding-scale fees, and pro bono options.',
      'Affordable {specialty} legal help in {location}, {state}. Attorneys offering payment plans, flat fees, and free consultations.',
      'Need a {specialty} lawyer but worried about cost? See affordable options in {location} including pro bono and legal aid.',
      'Low-cost {specialty} attorneys in {location}. {count}+ lawyers with flexible payment, contingency fees, or pro bono services.',
      'Budget-friendly {specialty} legal services in {location}. Compare fees, payment plans, and sliding-scale rates.',
    ],
    h1Templates: [
      'Affordable {specialty} Lawyers in {location}',
      'Low Cost {specialty} Attorneys — {location}',
      'Pro Bono & Affordable {specialty} Lawyers',
      '{specialty} Lawyers on a Budget — {location}',
      'Affordable {specialty} Legal Help in {location}',
    ],
    schemaType: 'CollectionPage',
    breadcrumbPattern: [
      { name: 'Home', url: '/' },
      { name: '{state}', url: '/states/{state_slug}' },
      { name: '{location}', url: '/cities/{location_slug}' },
      { name: 'Affordable {specialty}', url: '/attorneys/{specialty_slug}/{location_slug}/affordable' },
    ],
    estimatedPages: 800_000,
    qualityFilter: { minAttorneys: 1, noindexIfEmpty: true },
    sitemapConfig: { batchSize: 45000, priority: 0.6, changefreq: 'monthly' },
    prerenderCount: 150,
  },

  // =========================================================================
  // F — Cost: "how much does [specialty] cost"
  // =========================================================================
  [PageType.F]: {
    type: PageType.F,
    urlPattern: '/cost/{specialty}/{location}',
    titleTemplates: [
      '{specialty} Lawyer Cost in {location} (2026)',
      'How Much Does a {specialty} Lawyer Cost?',
      '{specialty} Attorney Fees in {location}',
      '{specialty} Lawyer Pricing — {location}, {state}',
      'Cost of a {specialty} Lawyer in {location}',
    ],
    descriptionTemplates: [
      'How much does a {specialty} lawyer cost in {location}? Average fees, hourly rates, and flat-fee options explained for 2026.',
      '{specialty} attorney fees in {location}, {state}. Compare hourly rates ($150-$500+), flat fees, and contingency arrangements.',
      'Understand {specialty} lawyer costs in {location}. Detailed breakdown of retainers, hourly billing, and payment options.',
      'What does a {specialty} attorney charge in {location}? Fee ranges, billing methods, and cost-saving tips from local lawyers.',
      '{specialty} legal fees guide for {location}. Average costs, what affects pricing, and how to find affordable representation.',
    ],
    h1Templates: [
      'How Much Does a {specialty} Lawyer Cost in {location}?',
      '{specialty} Attorney Fees in {location}',
      '{specialty} Lawyer Cost Guide — {location}',
      'What Do {specialty} Lawyers Charge in {location}?',
      '{specialty} Legal Costs in {location} (2026)',
    ],
    schemaType: 'WebPage',
    breadcrumbPattern: [
      { name: 'Home', url: '/' },
      { name: 'Cost', url: '/cost' },
      { name: '{specialty}', url: '/cost/{specialty_slug}' },
      { name: '{location}', url: '/cost/{specialty_slug}/{location_slug}' },
    ],
    estimatedPages: 500_000,
    qualityFilter: { minAttorneys: 2, noindexIfEmpty: true },
    sitemapConfig: { batchSize: 45000, priority: 0.7, changefreq: 'monthly' },
    prerenderCount: 200,
  },

  // =========================================================================
  // G — Situation: "slip and fall lawyer", "drunk driving attorney"
  // =========================================================================
  [PageType.G]: {
    type: PageType.G,
    urlPattern: '/attorneys/{situation}/{location}',
    titleTemplates: [
      '{situation} Lawyer in {location} | Get Help Now',
      'Find a {situation} Attorney in {location}',
      '{situation} Legal Help in {location}, {state}',
      '{situation} Lawyers Near {location}',
      '{location} {situation} Attorneys — Free Consult',
    ],
    descriptionTemplates: [
      'Find a {situation} lawyer in {location}. Experienced attorneys handling your exact situation. Free consultation available.',
      'Need a {situation} attorney in {location}? {count}+ lawyers with proven track records. Compare and connect today.',
      '{situation} legal help in {location}, {state}. Licensed attorneys ready to fight for you. No upfront cost options.',
      'Dealing with a {situation} case in {location}? Find experienced attorneys who specialize in your situation.',
      '{situation} lawyers in {location}. Get matched with attorneys who have handled cases like yours. Free case evaluation.',
    ],
    h1Templates: [
      '{situation} Lawyer in {location}',
      'Find a {situation} Attorney in {location}',
      '{situation} Legal Help — {location}',
      '{situation} Attorneys in {location}, {state}',
      '{situation} Lawyers Near {location}',
    ],
    schemaType: 'LegalService',
    breadcrumbPattern: [
      { name: 'Home', url: '/' },
      { name: 'Issues', url: '/issues' },
      { name: '{situation}', url: '/issues/{situation_slug}' },
      { name: '{location}', url: '/attorneys/{situation_slug}/{location_slug}' },
    ],
    estimatedPages: 900_000,
    qualityFilter: { minAttorneys: 1, noindexIfEmpty: true },
    sitemapConfig: { batchSize: 45000, priority: 0.7, changefreq: 'weekly' },
    prerenderCount: 200,
  },

  // =========================================================================
  // H — Demographic: "female lawyer", "bilingual attorney"
  // =========================================================================
  [PageType.H]: {
    type: PageType.H,
    urlPattern: '/attorneys/{specialty}/{location}/{demographic}',
    titleTemplates: [
      '{demographic} {specialty} Lawyers in {location}',
      'Find {demographic} {specialty} Attorneys — {location}',
      '{demographic} {specialty} Lawyer in {location}',
      'Top {demographic} {specialty} Attorneys — {location}',
      '{location} {demographic} {specialty} Lawyers',
    ],
    descriptionTemplates: [
      'Find {demographic} {specialty} lawyers in {location}. Browse verified attorneys matching your preference. Free consultation.',
      '{demographic} {specialty} attorneys in {location}, {state}. {count}+ verified professionals. Compare and connect today.',
      'Looking for a {demographic} {specialty} lawyer in {location}? See profiles, ratings, and availability of matching attorneys.',
      'Directory of {demographic} {specialty} lawyers in {location}. Bar-verified credentials, client reviews, and free case reviews.',
      '{demographic} {specialty} attorneys serving {location}. Find representation that fits your needs. Free to search and compare.',
    ],
    h1Templates: [
      '{demographic} {specialty} Lawyers in {location}',
      'Find a {demographic} {specialty} Attorney — {location}',
      '{demographic} {specialty} Attorneys in {location}',
      'Top {demographic} {specialty} Lawyers — {location}',
      '{demographic} {specialty} Lawyers Near {location}',
    ],
    schemaType: 'CollectionPage',
    breadcrumbPattern: [
      { name: 'Home', url: '/' },
      { name: '{state}', url: '/states/{state_slug}' },
      { name: '{location}', url: '/cities/{location_slug}' },
      { name: '{demographic} {specialty}', url: '/attorneys/{specialty_slug}/{location_slug}/{demographic_slug}' },
    ],
    estimatedPages: 1_000_000,
    qualityFilter: { minAttorneys: 2, noindexIfEmpty: true },
    sitemapConfig: { batchSize: 45000, priority: 0.5, changefreq: 'monthly' },
    prerenderCount: 100,
  },

  // =========================================================================
  // I — Emergency: "24 hour lawyer"
  // =========================================================================
  [PageType.I]: {
    type: PageType.I,
    urlPattern: '/emergency/{specialty}/{location}',
    titleTemplates: [
      '24/7 {specialty} Lawyer in {location} | Call Now',
      'Emergency {specialty} Attorney — {location}',
      '24 Hour {specialty} Lawyer in {location}',
      'Urgent {specialty} Help in {location} — 24/7',
      'After Hours {specialty} Lawyer — {location}',
    ],
    descriptionTemplates: [
      'Need a {specialty} lawyer right now in {location}? 24/7 emergency attorneys available. Call for immediate legal assistance.',
      'Emergency {specialty} legal help in {location}. After-hours attorneys answering calls now. Get urgent representation today.',
      '24 hour {specialty} lawyers in {location}, {state}. Immediate response for arrests, emergencies, and urgent legal matters.',
      'Urgent {specialty} situation in {location}? Connect with attorneys available around the clock. No wait, immediate help.',
      'After-hours {specialty} attorneys in {location}. Available nights, weekends, and holidays. Emergency legal help when you need it.',
    ],
    h1Templates: [
      '24/7 {specialty} Lawyers in {location}',
      'Emergency {specialty} Attorney — {location}',
      '24 Hour {specialty} Legal Help in {location}',
      'Urgent {specialty} Lawyers — {location}',
      'After Hours {specialty} Attorneys — {location}',
    ],
    schemaType: 'LegalService',
    breadcrumbPattern: [
      { name: 'Home', url: '/' },
      { name: 'Emergency', url: '/emergency' },
      { name: '{specialty}', url: '/emergency/{specialty_slug}' },
      { name: '{location}', url: '/emergency/{specialty_slug}/{location_slug}' },
    ],
    estimatedPages: 180_000,
    qualityFilter: { minAttorneys: 1, noindexIfEmpty: true },
    sitemapConfig: { batchSize: 45000, priority: 0.9, changefreq: 'daily' },
    prerenderCount: 100,
  },

  // =========================================================================
  // J — County: "[specialty] lawyer in [county]"
  // =========================================================================
  [PageType.J]: {
    type: PageType.J,
    urlPattern: '/attorneys/{specialty}/county/{county}',
    titleTemplates: [
      '{specialty} Lawyer in {county} County, {state}',
      '{county} County {specialty} Attorneys',
      'Find {specialty} Lawyers — {county} County',
      '{specialty} Attorneys in {county} County, {state}',
      'Top {specialty} Lawyers — {county} County',
    ],
    descriptionTemplates: [
      'Find {specialty} lawyers in {county} County, {state}. {count}+ attorneys covering all courts in the county. Free consultation.',
      '{specialty} attorneys serving {county} County. Compare experience, ratings, and fees. Licensed and bar-verified professionals.',
      'Need a {specialty} lawyer in {county} County, {state}? Browse {count}+ attorneys with county court experience.',
      '{specialty} legal representation in {county} County. Attorneys familiar with local courts, judges, and procedures.',
      'Directory of {specialty} lawyers in {county} County, {state}. Verified credentials, reviews, and free case evaluations.',
    ],
    h1Templates: [
      '{specialty} Lawyers in {county} County, {state}',
      '{county} County {specialty} Attorneys',
      'Find a {specialty} Lawyer in {county} County',
      '{specialty} Attorneys — {county} County, {state}',
      'Top {specialty} Lawyers in {county} County',
    ],
    schemaType: 'CollectionPage',
    breadcrumbPattern: [
      { name: 'Home', url: '/' },
      { name: '{state}', url: '/states/{state_slug}' },
      { name: '{county} County', url: '/counties/{county_slug}' },
      { name: '{specialty}', url: '/attorneys/{specialty_slug}/county/{county_slug}' },
    ],
    // 200 PA × 3,144 counties = 628,800
    estimatedPages: 628_800,
    qualityFilter: { minAttorneys: 1, noindexIfEmpty: true },
    sitemapConfig: { batchSize: 45000, priority: 0.7, changefreq: 'weekly' },
    prerenderCount: 200,
  },

  // =========================================================================
  // K — Neighborhood: "lawyer near [neighborhood]"
  // =========================================================================
  [PageType.K]: {
    type: PageType.K,
    urlPattern: '/attorneys/{specialty}/{city}/{neighborhood}',
    titleTemplates: [
      '{specialty} Lawyer Near {neighborhood}, {city}',
      'Lawyers in {neighborhood} — {specialty}',
      '{specialty} Attorneys Near {neighborhood}',
      '{neighborhood} {specialty} Lawyers, {city}',
      'Find {specialty} Lawyers in {neighborhood}',
    ],
    descriptionTemplates: [
      'Find {specialty} lawyers near {neighborhood} in {city}. Local attorneys you can meet in person. Free consultation available.',
      '{specialty} attorneys in {neighborhood}, {city}. {count}+ nearby lawyers with verified credentials and client reviews.',
      'Need a {specialty} lawyer close to {neighborhood}? Browse local attorneys in {city} with proven track records.',
      'Local {specialty} lawyers near {neighborhood}, {city}. Convenient offices, in-person meetings, and free case reviews.',
      '{specialty} legal help near {neighborhood} in {city}, {state}. Find the closest attorneys to you.',
    ],
    h1Templates: [
      '{specialty} Lawyers Near {neighborhood}',
      '{specialty} Attorneys in {neighborhood}, {city}',
      'Find {specialty} Lawyers — {neighborhood}',
      'Lawyers Near {neighborhood}, {city}',
      '{neighborhood} {specialty} Attorneys',
    ],
    schemaType: 'CollectionPage',
    breadcrumbPattern: [
      { name: 'Home', url: '/' },
      { name: '{state}', url: '/states/{state_slug}' },
      { name: '{city}', url: '/cities/{city_slug}' },
      { name: '{neighborhood}', url: '/attorneys/{specialty_slug}/{city_slug}/{neighborhood_slug}' },
    ],
    estimatedPages: 850_000,
    qualityFilter: { minAttorneys: 1, noindexIfEmpty: true },
    sitemapConfig: { batchSize: 45000, priority: 0.5, changefreq: 'monthly' },
    prerenderCount: 50,
  },

  // =========================================================================
  // L — FAQ: "do I need a [specialty] lawyer"
  // =========================================================================
  [PageType.L]: {
    type: PageType.L,
    urlPattern: '/questions/{specialty}/{question_slug}',
    titleTemplates: [
      'Do I Need a {specialty} Lawyer? | FAQ',
      '{specialty} FAQ: When to Hire a Lawyer',
      'When Should I Get a {specialty} Attorney?',
      '{specialty} Lawyer FAQ — Common Questions',
      'Do You Need a {specialty} Attorney? Find Out',
    ],
    descriptionTemplates: [
      'Do you need a {specialty} lawyer? Learn when to hire an attorney, what to expect, and how to find the right one for your case.',
      'Common {specialty} legal questions answered. When to hire a lawyer, estimated costs, and what to look for in an attorney.',
      '{specialty} lawyer FAQ. Expert answers on when you need legal help, what it costs, and how to choose the right attorney.',
      'Should you hire a {specialty} attorney? Get clear answers to the most common legal questions. State-specific guidance included.',
      'Frequently asked questions about {specialty} lawyers. Learn when legal help is needed and how to find affordable representation.',
    ],
    h1Templates: [
      'Do I Need a {specialty} Lawyer?',
      '{specialty} Lawyer — Frequently Asked Questions',
      'When Should You Hire a {specialty} Attorney?',
      '{specialty} Legal FAQ',
      'Common {specialty} Lawyer Questions',
    ],
    schemaType: 'FAQPage',
    breadcrumbPattern: [
      { name: 'Home', url: '/' },
      { name: 'Questions', url: '/questions' },
      { name: '{specialty}', url: '/questions/{specialty_slug}' },
      { name: 'FAQ', url: '/questions/{specialty_slug}/{question_slug}' },
    ],
    estimatedPages: 22_950,
    qualityFilter: { minAttorneys: 0, noindexIfEmpty: false },
    sitemapConfig: { batchSize: 45000, priority: 0.6, changefreq: 'monthly' },
    prerenderCount: 200,
  },

  // =========================================================================
  // M — State guide: "how to file [type] in [state]"
  // =========================================================================
  [PageType.M]: {
    type: PageType.M,
    urlPattern: '/guides/{guide_slug}/{state}',
    titleTemplates: [
      'How to File {guide_type} in {state} (2026)',
      '{guide_type} Filing Guide — {state}',
      '{state} {guide_type} Guide: Step by Step',
      'Filing {guide_type} in {state} — Full Guide',
      '{guide_type} in {state}: What You Need to Know',
    ],
    descriptionTemplates: [
      'How to file {guide_type} in {state}. Step-by-step guide with forms, deadlines, costs, and local requirements for 2026.',
      'Complete guide to {guide_type} in {state}. Filing requirements, court procedures, fees, and timelines explained.',
      '{state} {guide_type} guide. Everything you need to know: forms, filing fees, deadlines, and when to hire an attorney.',
      'Step-by-step {guide_type} filing instructions for {state}. Required documents, court fees, and process timeline.',
      'Filing {guide_type} in {state}? Detailed guide with current forms, costs, and procedural requirements.',
    ],
    h1Templates: [
      'How to File {guide_type} in {state}',
      '{guide_type} Filing Guide — {state}',
      '{state} {guide_type}: Step-by-Step Guide',
      'Filing {guide_type} in {state}',
      '{guide_type} Guide for {state} (2026)',
    ],
    schemaType: 'HowTo',
    breadcrumbPattern: [
      { name: 'Home', url: '/' },
      { name: 'Guides', url: '/guides' },
      { name: '{guide_type}', url: '/guides/{guide_slug}' },
      { name: '{state}', url: '/guides/{guide_slug}/{state_slug}' },
    ],
    estimatedPages: 10_200,
    qualityFilter: { minAttorneys: 0, noindexIfEmpty: false },
    sitemapConfig: { batchSize: 45000, priority: 0.6, changefreq: 'monthly' },
    prerenderCount: 300,
  },

  // =========================================================================
  // N — Comparative: "[specialty] vs [specialty]"
  // =========================================================================
  [PageType.N]: {
    type: PageType.N,
    urlPattern: '/comparisons/{specialty_a}-vs-{specialty_b}',
    titleTemplates: [
      '{specialty_a} vs {specialty_b} Lawyer: Differences',
      '{specialty_a} or {specialty_b} Attorney? Compare',
      '{specialty_a} vs {specialty_b}: Which Do You Need?',
      'Compare {specialty_a} and {specialty_b} Lawyers',
      '{specialty_a} vs {specialty_b} — Lawyer Guide',
    ],
    descriptionTemplates: [
      '{specialty_a} vs {specialty_b} lawyer: key differences, when to hire each, costs compared, and how to choose the right one.',
      'Should you hire a {specialty_a} or {specialty_b} attorney? Compare specialties, typical fees, and case types handled.',
      '{specialty_a} and {specialty_b} lawyers compared. Understand the differences, overlapping areas, and which fits your case.',
      'Confused between {specialty_a} and {specialty_b}? Learn the key differences and which type of attorney your case requires.',
      'Compare {specialty_a} vs {specialty_b} attorneys. Costs, expertise, case types, and when you need each. Expert guide.',
    ],
    h1Templates: [
      '{specialty_a} vs {specialty_b} Lawyer',
      '{specialty_a} or {specialty_b}: Which Do You Need?',
      'Comparing {specialty_a} and {specialty_b} Lawyers',
      '{specialty_a} vs {specialty_b} Attorney Guide',
      '{specialty_a} and {specialty_b}: Key Differences',
    ],
    schemaType: 'WebPage',
    breadcrumbPattern: [
      { name: 'Home', url: '/' },
      { name: 'Comparisons', url: '/comparisons' },
      { name: '{specialty_a} vs {specialty_b}', url: '/comparisons/{specialty_a_slug}-vs-{specialty_b_slug}' },
    ],
    estimatedPages: 3_160,
    qualityFilter: { minAttorneys: 0, noindexIfEmpty: false },
    sitemapConfig: { batchSize: 45000, priority: 0.5, changefreq: 'monthly' },
    prerenderCount: 200,
  },

  // =========================================================================
  // O — Spanish: base pages in Spanish
  // =========================================================================
  [PageType.O]: {
    type: PageType.O,
    urlPattern: '/abogados/{specialty}/{location}',
    titleTemplates: [
      'Abogado de {specialty} en {location} | Gratis',
      'Abogados de {specialty} en {location}',
      'Buscar Abogado de {specialty} en {location}',
      'Abogados de {specialty} — {location}, {state}',
      'Mejor Abogado de {specialty} en {location}',
    ],
    descriptionTemplates: [
      'Encuentre abogados de {specialty} en {location}. {count}+ profesionales con licencia. Consulta gratis. Compare perfiles y opiniones.',
      'Abogados de {specialty} en {location}, {state}. Directorio gratuito con verificacion de colegiatura y consultas sin costo.',
      'Busque un abogado de {specialty} en {location}. Compare experiencia, tarifas y opiniones de clientes. Servicio 100% gratuito.',
      'Necesita un abogado de {specialty} en {location}? {count}+ abogados verificados listos para ayudarle. Consulta gratuita.',
      'Directorio de abogados de {specialty} en {location}. Perfiles verificados, opiniones reales y consulta gratis disponible.',
    ],
    h1Templates: [
      'Abogados de {specialty} en {location}',
      'Encuentre un Abogado de {specialty} en {location}',
      'Abogados de {specialty} — {location}',
      'Mejores Abogados de {specialty} en {location}',
      'Abogados de {specialty} en {location}, {state}',
    ],
    schemaType: 'CollectionPage',
    breadcrumbPattern: [
      { name: 'Inicio', url: '/abogados' },
      { name: '{state}', url: '/abogados/estado/{state_slug}' },
      { name: '{location}', url: '/abogados/{specialty_slug}/{location_slug}' },
    ],
    // Spanish standalone: 50 PA × 51 states (2,550) + 50 PA × 2,000 Hispanic cities (100,000)
    // + 50 PA × 5,000 Hispanic ZIPs (250,000) + 200,000 bilingual profiles + 50 PA × 51 guides (2,550)
    estimatedPages: 555_000,
    qualityFilter: { minAttorneys: 1, noindexIfEmpty: true },
    sitemapConfig: { batchSize: 45000, priority: 0.6, changefreq: 'weekly' },
    prerenderCount: 100,
  },

  // =========================================================================
  // P — Reviews: reviews pages
  // =========================================================================
  [PageType.P]: {
    type: PageType.P,
    urlPattern: '/reviews/{specialty}/{location}',
    titleTemplates: [
      '{specialty} Lawyer Reviews in {location}',
      '{location} {specialty} Attorney Reviews (2026)',
      'Client Reviews: {specialty} Lawyers — {location}',
      'Read {specialty} Lawyer Reviews — {location}',
      '{specialty} Attorney Ratings in {location}',
    ],
    descriptionTemplates: [
      'Read client reviews of {specialty} lawyers in {location}. {count}+ verified ratings and testimonials. Find the right attorney.',
      '{specialty} attorney reviews in {location}, {state}. Real client feedback on communication, results, and fees.',
      'Client reviews for {specialty} lawyers in {location}. Compare ratings, read detailed testimonials, and make an informed choice.',
      'What clients say about {specialty} attorneys in {location}. {count}+ honest reviews with ratings and outcomes.',
      '{specialty} lawyer ratings and reviews in {location}. Verified client experiences. Find top-reviewed attorneys near you.',
    ],
    h1Templates: [
      '{specialty} Lawyer Reviews in {location}',
      'Client Reviews: {specialty} Attorneys — {location}',
      '{specialty} Attorney Ratings — {location}',
      '{location} {specialty} Lawyer Reviews',
      'Top-Reviewed {specialty} Lawyers in {location}',
    ],
    schemaType: 'CollectionPage',
    breadcrumbPattern: [
      { name: 'Home', url: '/' },
      { name: 'Reviews', url: '/reviews' },
      { name: '{specialty}', url: '/reviews/{specialty_slug}' },
      { name: '{location}', url: '/reviews/{specialty_slug}/{location_slug}' },
    ],
    estimatedPages: 300_000,
    qualityFilter: { minAttorneys: 1, noindexIfEmpty: true },
    sitemapConfig: { batchSize: 45000, priority: 0.6, changefreq: 'weekly' },
    prerenderCount: 150,
  },

  // =========================================================================
  // Q — Industry: "oil field injury lawyer" etc.
  // =========================================================================
  [PageType.Q]: {
    type: PageType.Q,
    urlPattern: '/attorneys/{industry}/{location}',
    titleTemplates: [
      '{industry} Lawyer in {location} | Experts',
      '{industry} Attorneys in {location}, {state}',
      'Find {industry} Lawyers Near {location}',
      '{industry} Legal Help in {location}',
      '{location} {industry} Lawyer Directory',
    ],
    descriptionTemplates: [
      'Find {industry} lawyers in {location}. Attorneys with specialized industry experience handling your exact type of case.',
      '{industry} attorneys in {location}, {state}. {count}+ specialists with deep industry knowledge. Free consultation.',
      'Need a {industry} lawyer in {location}? Connect with attorneys who understand your industry. Compare and hire with confidence.',
      '{industry} legal specialists in {location}. Industry-specific expertise, proven results, and free case evaluations available.',
      'Directory of {industry} lawyers in {location}. Attorneys experienced in industry regulations, compliance, and litigation.',
    ],
    h1Templates: [
      '{industry} Lawyers in {location}',
      '{industry} Attorneys in {location}, {state}',
      'Find a {industry} Lawyer in {location}',
      '{industry} Legal Specialists — {location}',
      '{industry} Lawyers Near {location}',
    ],
    schemaType: 'LegalService',
    breadcrumbPattern: [
      { name: 'Home', url: '/' },
      { name: 'Industries', url: '/industries' },
      { name: '{industry}', url: '/industries/{industry_slug}' },
      { name: '{location}', url: '/attorneys/{industry_slug}/{location_slug}' },
    ],
    estimatedPages: 8_040,
    qualityFilter: { minAttorneys: 1, noindexIfEmpty: true },
    sitemapConfig: { batchSize: 45000, priority: 0.5, changefreq: 'monthly' },
    prerenderCount: 50,
  },
}

// ---------------------------------------------------------------------------
// Totals
// ---------------------------------------------------------------------------

export const TOTAL_PAGES = Object.values(PAGE_TYPES).reduce(
  (sum, config) => sum + config.estimatedPages,
  0
)

/** Estimated indexed pages after quality filters remove thin/empty pages */
export const ESTIMATED_INDEXED = 10_000_000

// ---------------------------------------------------------------------------
// Public helper functions
// ---------------------------------------------------------------------------

/**
 * Get the full config for a page type.
 */
export function getPageConfig(type: PageType): PageTypeConfig {
  return PAGE_TYPES[type]
}

/**
 * Generate a deterministic title for a page type + variables.
 */
export function generateTitle(type: PageType, vars: Record<string, string>): string {
  return selectTemplate(PAGE_TYPES[type].titleTemplates, vars)
}

/**
 * Generate a deterministic description for a page type + variables.
 */
export function generateDescription(type: PageType, vars: Record<string, string>): string {
  return selectTemplate(PAGE_TYPES[type].descriptionTemplates, vars)
}

/**
 * Generate a deterministic H1 heading for a page type + variables.
 */
export function generateH1(type: PageType, vars: Record<string, string>): string {
  return selectTemplate(PAGE_TYPES[type].h1Templates, vars)
}

/**
 * Determine whether a page should be indexed based on quality filter.
 */
export function shouldIndex(type: PageType, attorneyCount: number): boolean {
  const config = PAGE_TYPES[type]
  if (config.qualityFilter.noindexIfEmpty && attorneyCount < config.qualityFilter.minAttorneys) {
    return false
  }
  return true
}

/**
 * Build the canonical URL for a page type + variables.
 */
export function getCanonicalUrl(type: PageType, vars: Record<string, string>): string {
  const pattern = PAGE_TYPES[type].urlPattern
  const path = interpolate(pattern, vars)
  return `${SITE_URL}${path}`
}

/**
 * Generate cross-links for all intents (listing, hire, cost, reviews, emergency)
 * for a given specialty + location combo.
 */
export function getIntentCrossLinks(
  specialty: string,
  location: string
): { label: string; url: string; intent: IntentType }[] {
  return [
    {
      label: `Find ${specialty} Lawyers in ${location}`,
      url: `${SITE_URL}/attorneys/${slugify(specialty)}/${slugify(location)}`,
      intent: IntentType.LISTING,
    },
    {
      label: `Hire a ${specialty} Lawyer in ${location}`,
      url: `${SITE_URL}/hire/${slugify(specialty)}/${slugify(location)}`,
      intent: IntentType.HIRE,
    },
    {
      label: `${specialty} Lawyer Cost in ${location}`,
      url: `${SITE_URL}/cost/${slugify(specialty)}/${slugify(location)}`,
      intent: IntentType.COST,
    },
    {
      label: `${specialty} Lawyer Reviews in ${location}`,
      url: `${SITE_URL}/reviews/${slugify(specialty)}/${slugify(location)}`,
      intent: IntentType.REVIEWS,
    },
    {
      label: `Emergency ${specialty} Lawyer in ${location}`,
      url: `${SITE_URL}/emergency/${slugify(specialty)}/${slugify(location)}`,
      intent: IntentType.EMERGENCY,
    },
  ]
}

/**
 * Convert an English URL to its Spanish mirror, or null if not applicable.
 * Only applies to intent-based URLs (attorneys, hire, cost, reviews, emergency).
 */
export function getSpanishMirrorUrl(englishUrl: string): string | null {
  const url = englishUrl.replace(SITE_URL, '')

  for (const [intent, spanish] of Object.entries(INTENT_TO_SPANISH)) {
    if (url.startsWith(`/${intent}`)) {
      return `${SITE_URL}/${spanish}${url.slice(intent.length + 1)}`
    }
  }

  return null
}

/**
 * Generate hreflang pairs for a URL — returns both en and es variants if applicable.
 */
export function getHreflangPairs(url: string): { lang: string; url: string }[] {
  const normalizedUrl = url.startsWith(SITE_URL) ? url : `${SITE_URL}${url}`
  const path = normalizedUrl.replace(SITE_URL, '')

  // Check if this is a Spanish page
  for (const [spanish, intent] of Object.entries(SPANISH_TO_INTENT)) {
    if (path.startsWith(`/${spanish}`)) {
      const englishPath = `/${intent}${path.slice(spanish.length + 1)}`
      return [
        { lang: 'en', url: `${SITE_URL}${englishPath}` },
        { lang: 'es', url: normalizedUrl },
        { lang: 'x-default', url: `${SITE_URL}${englishPath}` },
      ]
    }
  }

  // Check if this is an English page with a Spanish mirror
  const spanishMirror = getSpanishMirrorUrl(normalizedUrl)
  if (spanishMirror) {
    return [
      { lang: 'en', url: normalizedUrl },
      { lang: 'es', url: spanishMirror },
      { lang: 'x-default', url: normalizedUrl },
    ]
  }

  // No hreflang pair for this URL
  return [{ lang: 'en', url: normalizedUrl }]
}

// ---------------------------------------------------------------------------
// Internal utilities
// ---------------------------------------------------------------------------

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}
