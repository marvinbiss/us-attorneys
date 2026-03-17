/**
 * Quality filter for programmatic SEO pages
 * Determines noindex status based on page type and content availability
 *
 * Philosophy: Fail-open (default = index). Only noindex when we're CERTAIN
 * the page has no value. ISR corrects within 24h.
 */

export interface QualitySignals {
  attorneyCount: number
  hasContent: boolean       // Does the page have meaningful text content?
  hasPriceData: boolean     // For cost pages: do we have pricing info?
  hasReviews: boolean       // For review pages: are there reviews?
  pageType: string          // PageType from programmatic-seo.ts
}

/**
 * Quality thresholds per page type
 */
export const QUALITY_THRESHOLDS: Record<string, {
  minAttorneys: number      // Min attorneys to index
  requireContent: boolean   // Must have content to index
  requirePriceData: boolean
  requireReviews: boolean
}> = {
  // Directory pages: always index (rich content even with 0 attorneys)
  directory: { minAttorneys: 0, requireContent: false, requirePriceData: false, requireReviews: false },

  // Need at least 1 attorney for variant to be useful
  'attorney-variant': { minAttorneys: 1, requireContent: false, requirePriceData: false, requireReviews: false },

  // "Best" implies comparison — need at least 3
  'best-rated': { minAttorneys: 3, requireContent: false, requirePriceData: false, requireReviews: false },

  'free-consultation': { minAttorneys: 1, requireContent: false, requirePriceData: false, requireReviews: false },

  affordable: { minAttorneys: 1, requireContent: false, requirePriceData: false, requireReviews: false },

  // Cost pages have inherent value (pricing info) even without attorneys
  cost: { minAttorneys: 0, requireContent: false, requirePriceData: false, requireReviews: false },

  // Situation pages need content to be useful
  situation: { minAttorneys: 0, requireContent: true, requirePriceData: false, requireReviews: false },

  demographic: { minAttorneys: 1, requireContent: false, requirePriceData: false, requireReviews: false },

  emergency: { minAttorneys: 1, requireContent: false, requirePriceData: false, requireReviews: false },

  // County pages always indexed (geographic value)
  county: { minAttorneys: 0, requireContent: false, requirePriceData: false, requireReviews: false },

  neighborhood: { minAttorneys: 1, requireContent: false, requirePriceData: false, requireReviews: false },

  // FAQ pages need questions to be useful
  faq: { minAttorneys: 0, requireContent: true, requirePriceData: false, requireReviews: false },

  'state-guide': { minAttorneys: 0, requireContent: true, requirePriceData: false, requireReviews: false },

  comparative: { minAttorneys: 0, requireContent: true, requirePriceData: false, requireReviews: false },

  spanish: { minAttorneys: 1, requireContent: false, requirePriceData: false, requireReviews: false },

  // Review pages indexed even with 0 reviews (encourage submissions)
  reviews: { minAttorneys: 0, requireContent: false, requirePriceData: false, requireReviews: false },

  industry: { minAttorneys: 1, requireContent: true, requirePriceData: false, requireReviews: false },
}

/**
 * Determine if a page should be indexed.
 * Returns { index: boolean, reason?: string }
 *
 * Fail-open: unknown page types default to index=true.
 */
export function shouldIndex(signals: QualitySignals): { index: boolean; reason?: string } {
  const threshold = QUALITY_THRESHOLDS[signals.pageType]

  // Unknown page type — fail-open, index by default
  if (!threshold) {
    return { index: true }
  }

  // Check attorney count threshold
  if (signals.attorneyCount < threshold.minAttorneys) {
    return {
      index: false,
      reason: `${signals.pageType}: ${signals.attorneyCount} attorneys < minimum ${threshold.minAttorneys}`,
    }
  }

  // Check content requirement
  if (threshold.requireContent && !signals.hasContent) {
    return {
      index: false,
      reason: `${signals.pageType}: no content available`,
    }
  }

  // Check price data requirement
  if (threshold.requirePriceData && !signals.hasPriceData) {
    return {
      index: false,
      reason: `${signals.pageType}: no price data available`,
    }
  }

  // Check reviews requirement
  if (threshold.requireReviews && !signals.hasReviews) {
    return {
      index: false,
      reason: `${signals.pageType}: no reviews available`,
    }
  }

  return { index: true }
}

/**
 * Generate robots meta directives for a page.
 *
 * Indexed pages get full snippet + large image preview for rich results.
 * Noindexed pages still get follow (let link equity flow) but no snippet.
 */
export function getRobotsDirective(signals: QualitySignals): {
  index: boolean
  follow: boolean
  'max-snippet'?: number
  'max-image-preview'?: 'none' | 'standard' | 'large'
} {
  const { index } = shouldIndex(signals)

  if (index) {
    return {
      index: true,
      follow: true,
      'max-snippet': -1,          // Unlimited snippet length
      'max-image-preview': 'large', // Large image preview for rich results
    }
  }

  return {
    index: false,
    follow: true, // Always follow links — let equity flow even on thin pages
  }
}

/**
 * Estimate how many pages will be indexed vs structural (noindexed).
 *
 * Uses approximate page counts per type and quality thresholds to project
 * the index/noindex split. Numbers are estimates based on the 200 practice
 * areas x 41K ZIP codes x intents model (12.5M page target).
 */
export function estimateIndexedPages(): {
  structural: number
  estimated_indexed: number
  noindex_rate: number
} {
  // Approximate page counts per type (based on 200 practice areas, 12.5M page target)
  const estimatedPageCounts: Record<string, number> = {
    directory: 200 * 15_000,              // 200 PA x 15K cities = 3,000,000
    'attorney-variant': 150 * 10_000,     // 150 PA x 10K cities = 1,500,000
    'best-rated': 150 * 6_500,            // 150 PA x 6.5K cities = 975,000
    'free-consultation': 100 * 6_500,     // 100 PA x 6.5K cities = 650,000
    affordable: 80 * 2 * 5_000,           // 80 PA x 2 terms x 5K = 800,000
    cost: 100 * 5_000,                    // 100 PA x 5K cities = 500,000
    situation: 300 * 3_000,               // 300 situations x 3K cities = 900,000
    demographic: 8 * 50 * 2_500,          // 8 modifiers x 50 PA x 2.5K = 1,000,000
    emergency: 30 * 2 * 3_000,            // 30 PA x 2 terms x 3K = 180,000
    county: 200 * 3_144,                  // 200 PA x 3,144 counties = 628,800
    neighborhood: 50 * 17_000,            // 50 PA x 17K neighborhoods = 850,000
    faq: 150 * 3 * 51,                    // 150 PA x 3 Qs x 51 states = 22,950
    'state-guide': 200 * 51,              // 200 types x 51 states = 10,200
    comparative: 3_160,                   // C(80,2) x 51 = 3,160
    spanish: 555_000,                     // Full Spanish standalone
    reviews: 100 * 3_000,                 // 100 PA x 3K cities = 300,000
    industry: 8_040,                      // Remainder
  }

  // Estimated index rates per type (based on data coverage)
  // These are conservative estimates — actual rates depend on attorney data density
  const estimatedIndexRates: Record<string, number> = {
    directory: 1.0,          // Always indexed
    'attorney-variant': 0.7, // 70% of city pages have >= 1 attorney
    'best-rated': 0.4,       // 40% have >= 3 attorneys
    'free-consultation': 0.7,
    affordable: 0.7,
    cost: 1.0,               // Always indexed (pricing content)
    situation: 0.9,          // 90% have content
    demographic: 0.6,
    emergency: 0.6,
    county: 0.85,            // Some rural counties have 0 attorneys for niche PAs
    neighborhood: 0.5,       // 50% have >= 1 attorney
    faq: 0.95,               // 95% have content
    'state-guide': 1.0,      // All have content
    comparative: 0.95,       // 95% have content
    spanish: 0.65,           // 65% coverage (Hispanic population density)
    reviews: 1.0,            // Always indexed
    industry: 0.6,           // 60% have content + attorneys
  }

  let totalPages = 0
  let indexedPages = 0

  for (const [pageType, count] of Object.entries(estimatedPageCounts)) {
    const indexRate = estimatedIndexRates[pageType] ?? 0.5
    totalPages += count
    indexedPages += Math.round(count * indexRate)
  }

  const structuralPages = totalPages - indexedPages

  return {
    structural: structuralPages,
    estimated_indexed: indexedPages,
    noindex_rate: totalPages > 0 ? Math.round((structuralPages / totalPages) * 10000) / 100 : 0,
  }
}
