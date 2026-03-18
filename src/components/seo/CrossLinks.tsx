import Link from 'next/link'
import { Search, ArrowRight, MapPin } from 'lucide-react'
import { getNearbyCities, getCityBySlug } from '@/lib/data/usa'
import { PRACTICE_AREAS_200 } from '@/lib/data/practice-areas-200'
import { isZipPageSlug, parseZipPageSlug } from '@/lib/zip-pages'

// ============================================================================
// CrossLinks — "People also search for" section
// Server component: renders cross-dimensional links combining:
//   - Same PA + nearby cities (geographic expansion)
//   - Same city + related PAs (topical expansion)
// All links are SSR in the initial HTML — invisible to Ember.js competitors
// whose client-rendered links are not seen by crawlers on first pass.
// ============================================================================

// Category affinity for suggesting related PAs when browsing a given category
const CATEGORY_NEIGHBORS: Record<string, string[]> = {
  'personal-injury': ['criminal-defense', 'employment'],
  'criminal-defense': ['personal-injury', 'family-law'],
  'family-law': ['estate-planning', 'personal-injury'],
  'business-corporate': ['intellectual-property', 'tax', 'real-estate'],
  'intellectual-property': ['business-corporate', 'technology-cyber'],
  'real-estate': ['business-corporate', 'bankruptcy'],
  'immigration': ['employment', 'criminal-defense'],
  'estate-planning': ['family-law', 'tax'],
  'employment': ['business-corporate', 'personal-injury'],
  'bankruptcy': ['tax', 'real-estate'],
  'tax': ['business-corporate', 'bankruptcy'],
  'specialized': ['personal-injury', 'business-corporate'],
  'government-administrative': ['specialized', 'employment'],
  'technology-cyber': ['intellectual-property', 'business-corporate'],
  'personal-family-additional': ['family-law', 'estate-planning'],
}

interface CrossLinksProps {
  /** Current practice area slug */
  practiceAreaSlug: string
  /** Current city slug */
  citySlug: string
  /** Max nearby-city links (default 6) */
  nearbyCityLimit?: number
  /** Max related-PA links (default 6) */
  relatedPALimit?: number
  /** Additional CSS classes */
  className?: string
}

function getRelatedPASlugs(currentSlug: string, limit: number): typeof PRACTICE_AREAS_200 {
  const current = PRACTICE_AREAS_200.find(pa => pa.slug === currentSlug)
  if (!current) return []

  const results: typeof PRACTICE_AREAS_200 = []
  const seen = new Set<string>([currentSlug])
  const parentPAs = PRACTICE_AREAS_200.filter(pa => pa.parentSlug === null)

  // 1. Siblings in same category
  const siblings = parentPAs.filter(
    pa => pa.category === current.category && !seen.has(pa.slug)
  )
  for (const s of siblings) {
    if (results.length >= limit) break
    results.push(s)
    seen.add(s.slug)
  }

  // 2. Subspecialties of the current PA or parent's other children
  const parentSlug = current.parentSlug || current.slug
  const children = PRACTICE_AREAS_200.filter(
    pa => pa.parentSlug === parentSlug && !seen.has(pa.slug)
  )
  for (const child of children) {
    if (results.length >= limit) break
    results.push(child)
    seen.add(child.slug)
  }

  // 3. Top PAs from neighboring categories
  const neighborCats = CATEGORY_NEIGHBORS[current.category] || []
  for (const cat of neighborCats) {
    if (results.length >= limit) break
    const catPAs = parentPAs.filter(pa => pa.category === cat && !seen.has(pa.slug))
    for (const pa of catPAs) {
      if (results.length >= limit) break
      results.push(pa)
      seen.add(pa.slug)
    }
  }

  return results.slice(0, limit)
}

export default function CrossLinks({
  practiceAreaSlug,
  citySlug,
  nearbyCityLimit = 6,
  relatedPALimit = 6,
  className = '',
}: CrossLinksProps) {
  const city = getCityBySlug(citySlug)
  const currentPA = PRACTICE_AREAS_200.find(pa => pa.slug === practiceAreaSlug)
  if (!city || !currentPA) return null

  const nearbyCities = getNearbyCities(citySlug, nearbyCityLimit)
  const relatedPAs = getRelatedPASlugs(practiceAreaSlug, relatedPALimit)

  const hasNearby = nearbyCities.length > 0
  const hasRelated = relatedPAs.length > 0
  if (!hasNearby && !hasRelated) return null

  return (
    <section
      className={`py-8 border-t border-gray-200 dark:border-white/[0.06] ${className}`}
      aria-label="People also search for"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
          <Search className="w-5 h-5 text-clay-400" aria-hidden="true" />
          People Also Search For
        </h2>

        <div className="space-y-6">
          {/* Same PA in nearby cities */}
          {hasNearby && (
            <div>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">
                {currentPA.name} in nearby cities
              </h3>
              <div className="flex flex-wrap gap-2">
                {nearbyCities.map(nearbyCity => (
                  <Link
                    key={nearbyCity.slug}
                    href={`/practice-areas/${practiceAreaSlug}/${nearbyCity.slug}`}
                    className="inline-flex items-center px-3 py-1.5 bg-sand-100 hover:bg-clay-50 dark:bg-white/[0.04] dark:hover:bg-white/[0.08] text-stone-700 hover:text-clay-600 dark:text-gray-400 dark:hover:text-white border border-stone-200/40 hover:border-clay-200 dark:border-white/[0.06] dark:hover:border-white/[0.12] rounded-full text-sm transition-all duration-200"
                  >
                    {currentPA.name} in {nearbyCity.name}
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Different PAs in the same city */}
          {hasRelated && (
            <div>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">
                Other attorneys in {city.name}
              </h3>
              <div className="flex flex-wrap gap-2">
                {relatedPAs.map(pa => (
                  <Link
                    key={pa.slug}
                    href={`/practice-areas/${pa.slug}/${citySlug}`}
                    className="inline-flex items-center px-3 py-1.5 bg-sand-100 hover:bg-clay-50 dark:bg-white/[0.04] dark:hover:bg-white/[0.08] text-stone-700 hover:text-clay-600 dark:text-gray-400 dark:hover:text-white border border-stone-200/40 hover:border-clay-200 dark:border-white/[0.06] dark:hover:border-white/[0.12] rounded-full text-sm transition-all duration-200"
                  >
                    {pa.name} in {city.name}
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* ZIP code level links (Doctolib pattern) */}
          {city.zipCode && !isZipPageSlug(citySlug) && (
            <div>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3 flex items-center gap-1.5">
                <MapPin className="w-4 h-4" aria-hidden="true" />
                {currentPA.name} by ZIP code
              </h3>
              <div className="flex flex-wrap gap-2">
                <Link
                  href={`/practice-areas/${practiceAreaSlug}/${citySlug}-${city.zipCode}`}
                  className="inline-flex items-center px-3 py-1.5 bg-sand-100 hover:bg-clay-50 dark:bg-white/[0.04] dark:hover:bg-white/[0.08] text-stone-700 hover:text-clay-600 dark:text-gray-400 dark:hover:text-white border border-stone-200/40 hover:border-clay-200 dark:border-white/[0.06] dark:hover:border-white/[0.12] rounded-full text-sm transition-all duration-200"
                >
                  {currentPA.name} near {city.zipCode}
                </Link>
              </div>
            </div>
          )}

          {/* If we're on a ZIP page, link to the parent city page */}
          {isZipPageSlug(citySlug) && (() => {
            const parsed = parseZipPageSlug(citySlug)
            if (!parsed) return null
            return (
              <div>
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">
                  See more in this area
                </h3>
                <div className="flex flex-wrap gap-2">
                  <Link
                    href={`/practice-areas/${practiceAreaSlug}/${parsed.citySlug}`}
                    className="inline-flex items-center px-3 py-1.5 bg-sand-100 hover:bg-clay-50 dark:bg-white/[0.04] dark:hover:bg-white/[0.08] text-stone-700 hover:text-clay-600 dark:text-gray-400 dark:hover:text-white border border-stone-200/40 hover:border-clay-200 dark:border-white/[0.06] dark:hover:border-white/[0.12] rounded-full text-sm transition-all duration-200"
                  >
                    All {currentPA.name.toLowerCase()} in {city.name}
                  </Link>
                </div>
              </div>
            )
          })()}
        </div>

        {/* Broader exploration links */}
        <div className="mt-6 flex flex-wrap gap-4">
          <Link
            href={`/practice-areas/${practiceAreaSlug}`}
            className="text-clay-400 hover:text-clay-600 dark:text-clay-400 dark:hover:text-clay-300 text-sm flex items-center gap-1 group"
          >
            {currentPA.name} nationwide
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" aria-hidden="true" />
          </Link>
          <Link
            href={`/cities/${citySlug}`}
            className="text-clay-400 hover:text-clay-600 dark:text-clay-400 dark:hover:text-clay-300 text-sm flex items-center gap-1 group"
          >
            All attorneys in {city.name}
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </section>
  )
}
