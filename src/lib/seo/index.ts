/**
 * US Attorneys - SEO Library
 * Barrel exports for all SEO utilities, schemas, and content generators
 */

// --- Site Config & SEO Defaults ---
export {
  SITE_URL,
  SITE_NAME,
  PHONE_NUMBER,
  PHONE_TEL,
  SPANISH_SEO_CONFIG,
  defaultSEOConfig,
  getServiceSEO,
  getLocationSEO,
  getAttorneySEO,
} from './config'

// --- JSON-LD Structured Data ---
export {
  getOrganizationSchema,
  getWebsiteSchema,
  getServiceSchema,
  getBreadcrumbSchema,
  getFAQSchema,
  getHowToSchema,
  getItemListSchema,
  getPlaceSchema,
  getCollectionPageSchema,
  getServicePricingSchema,
  getSpeakableSchema,
  getLegalServiceSchema,
  getAttorneySchema,
  getReviewPageSchema,
  getCostGuideSchema,
  getEmergencyServiceSchema,
  // Semantic breadcrumb builders (Doctolib-style)
  getHomeBreadcrumb,
  getPracticeAreaBreadcrumb,
  getPracticeAreaCityBreadcrumb,
  getAttorneyProfileBreadcrumb,
  getStateBreadcrumb,
  getBlogListBreadcrumb,
  getBlogPostBreadcrumb,
  getGenericBreadcrumb,
} from './jsonld'
export type { SemanticBreadcrumbItem, SemanticBreadcrumbType } from './jsonld'

// --- Blog Schema ---
export { extractFAQFromContent, getBlogArticleSchema } from './blog-schema'

// --- Programmatic SEO ---
export {
  PageType,
  IntentType,
  SpanishIntentType,
  GEOGRAPHIC_LAYERS,
  DEMOGRAPHIC_MODIFIERS,
  SITEMAP_STRATEGY,
  PAGE_TYPES,
  TOTAL_PAGES,
  ESTIMATED_INDEXED,
  getPageConfig,
  generateTitle,
  generateDescription,
  generateH1,
  shouldIndex,
  getCanonicalUrl,
  getIntentCrossLinks,
  getSpanishMirrorUrl,
  getHreflangPairs,
} from './programmatic-seo'
export type { BreadcrumbItem, QualityFilter, SitemapConfig, PageTypeConfig } from './programmatic-seo'

// --- Internal Links ---
export { getRelatedServiceLinks, getRelatedArticleSlugs } from './internal-links'

// --- IndexNow ---
export { submitToIndexNow, getAttorneyAffectedUrls } from './indexnow'

// --- Hreflang ---
export {
  getHreflangLinks,
  getSpanishMirror,
  getEnglishOriginal,
  hasSpanishMirror,
  getAlternateLanguages,
  SPANISH_PA_SLUGS,
  ENGLISH_PA_SLUGS,
  INTENT_MAP,
  INTENT_MAP_REVERSE,
} from './hreflang'

// --- Quality Filter ---
export {
  shouldIndex as shouldIndexByQuality,
  getRobotsDirective,
  estimateIndexedPages,
  QUALITY_THRESHOLDS,
} from './quality-filter'
export type { QualitySignals } from './quality-filter'

// --- Natural Terms ---
export { getNaturalTerm, NATURAL_TERMS, SHARED_VERBS } from './natural-terms'
export type { NaturalTerms } from './natural-terms'

// --- Data-Driven Content ---
export { generateDataDrivenContent } from './data-driven-content'
export type { DataDrivenContent } from './data-driven-content'

// --- Location Content (Legacy / Generic) ---
export {
  getRegionalMultiplier,
  generateLocationContent,
  generateNeighborhoodContent,
  generateStateContent,
  generateRegionContent,
  generateCityContent,
} from './location-content'
export type {
  LocationContent,
  NeighborhoodProfile,
  NeighborhoodDataDrivenContent,
  NeighborhoodContent,
  StateProfile,
  StateContent,
  RegionProfile,
  RegionContent,
  CityProfile,
  CityContent,
} from './location-content'

// --- Location Content (US-specific) ---
export {
  classifyCitySize,
  getCitySizeLabel,
  getRegionalPricingMultiplier,
  STATE_BAR_URLS,
  getStateBarVerificationUrl,
  getRegionalTips,
  generateLocationFAQ,
  generateLocationIntro,
  generateLocationPricingNote,
  getStateLegalAid,
  getStateBarComplaint,
  generatePracticeAreaStateFAQ,
  generateSinglePAStateFAQ,
} from './location-content-us'
export type { FAQParams, FAQItem, CitySize, PAStateFAQParams, PAStateFAQItem } from './location-content-us'

// --- GSC Priority ---
export { GSC_PRIORITY_CITIES, GSC_BOOST_PAGES } from './gsc-priority-cities'
