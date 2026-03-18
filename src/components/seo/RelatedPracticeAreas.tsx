import Link from 'next/link'
import { Scale, ArrowRight } from 'lucide-react'
import { PRACTICE_AREAS_200 } from '@/lib/data/practice-areas-200'

// ============================================================================
// RelatedPracticeAreas — Contextual internal linking for practice area pages
// Server component: renders 6-8 related practice areas as link chips,
// grouped by affinity (same category first, then adjacent categories).
// Fully SSR — every link is in the initial HTML (unlike Ember.js competitors).
// ============================================================================

// Adjacent/related category mapping — if a user is browsing one category,
// they're likely interested in these related categories too
const RELATED_CATEGORIES: Record<string, string[]> = {
  'personal-injury': ['criminal-defense', 'employment', 'specialized'],
  'criminal-defense': ['personal-injury', 'family-law', 'specialized'],
  'family-law': ['estate-planning', 'personal-family-additional', 'personal-injury'],
  'business-corporate': ['intellectual-property', 'tax', 'employment', 'real-estate'],
  'intellectual-property': ['business-corporate', 'technology-cyber', 'employment'],
  'real-estate': ['business-corporate', 'tax', 'bankruptcy'],
  'immigration': ['employment', 'criminal-defense', 'family-law'],
  'estate-planning': ['family-law', 'tax', 'real-estate'],
  'employment': ['business-corporate', 'personal-injury', 'criminal-defense'],
  'bankruptcy': ['tax', 'real-estate', 'business-corporate'],
  'tax': ['business-corporate', 'bankruptcy', 'estate-planning'],
  'specialized': ['personal-injury', 'business-corporate', 'government-administrative'],
  'government-administrative': ['specialized', 'employment', 'criminal-defense'],
  'technology-cyber': ['intellectual-property', 'business-corporate', 'criminal-defense'],
  'personal-family-additional': ['family-law', 'estate-planning', 'personal-injury'],
}

interface RelatedPracticeAreasProps {
  /** Current practice area slug (e.g., 'personal-injury') */
  currentSlug: string
  /** Optional city slug — if provided, links go to /practice-areas/{pa}/{city} */
  citySlug?: string
  /** Optional city display name */
  cityName?: string
  /** Max items to display (default 8) */
  limit?: number
  /** Additional CSS classes */
  className?: string
}

function getParentPAs() {
  return PRACTICE_AREAS_200.filter(pa => pa.parentSlug === null)
}

function getRelatedPracticeAreas(currentSlug: string, limit: number): typeof PRACTICE_AREAS_200 {
  const allParents = getParentPAs()
  const current = PRACTICE_AREAS_200.find(pa => pa.slug === currentSlug)
  if (!current) return allParents.slice(0, limit)

  const currentCategory = current.category
  const results: typeof PRACTICE_AREAS_200 = []
  const seen = new Set<string>([currentSlug])

  // 1. Siblings — same category, parent PAs only, excluding current
  const siblings = allParents.filter(
    pa => pa.category === currentCategory && pa.slug !== currentSlug
  )
  for (const s of siblings) {
    if (results.length >= limit) break
    if (!seen.has(s.slug)) {
      results.push(s)
      seen.add(s.slug)
    }
  }

  // 2. If current is a subspecialty, include the parent
  if (current.parentSlug && !seen.has(current.parentSlug)) {
    const parent = allParents.find(pa => pa.slug === current.parentSlug)
    if (parent && results.length < limit) {
      results.push(parent)
      seen.add(parent.slug)
    }
  }

  // 3. Subspecialties of the current PA (if it's a parent)
  if (current.parentSlug === null) {
    const children = PRACTICE_AREAS_200.filter(pa => pa.parentSlug === currentSlug)
    for (const child of children) {
      if (results.length >= limit) break
      if (!seen.has(child.slug)) {
        results.push(child)
        seen.add(child.slug)
      }
    }
  }

  // 4. Related categories — top PAs from adjacent categories
  const relatedCats = RELATED_CATEGORIES[currentCategory] || []
  for (const cat of relatedCats) {
    if (results.length >= limit) break
    const catPAs = allParents.filter(pa => pa.category === cat)
    for (const pa of catPAs) {
      if (results.length >= limit) break
      if (!seen.has(pa.slug)) {
        results.push(pa)
        seen.add(pa.slug)
      }
    }
  }

  // 5. Fallback — fill with high-volume PAs from any category
  if (results.length < limit) {
    const highVolume = allParents.filter(pa => pa.searchVolume === 'high' && !seen.has(pa.slug))
    for (const pa of highVolume) {
      if (results.length >= limit) break
      results.push(pa)
      seen.add(pa.slug)
    }
  }

  return results.slice(0, limit)
}

export default function RelatedPracticeAreas({
  currentSlug,
  citySlug,
  cityName,
  limit = 8,
  className = '',
}: RelatedPracticeAreasProps) {
  const related = getRelatedPracticeAreas(currentSlug, limit)
  if (related.length === 0) return null

  const current = PRACTICE_AREAS_200.find(pa => pa.slug === currentSlug)
  const currentName = current?.name || 'this practice area'

  return (
    <section
      className={`py-8 ${className}`}
      aria-label={`Practice areas related to ${currentName}`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Scale className="w-5 h-5 text-clay-400" aria-hidden="true" />
          Related Practice Areas
        </h2>

        <div className="flex flex-wrap gap-2">
          {related.map(pa => {
            const href = citySlug
              ? `/practice-areas/${pa.slug}/${citySlug}`
              : `/practice-areas/${pa.slug}`

            return (
              <Link
                key={pa.slug}
                href={href}
                className="inline-flex items-center px-3 py-2 bg-sand-100 hover:bg-clay-50 dark:bg-white/[0.06] dark:hover:bg-white/[0.10] text-stone-700 hover:text-clay-600 dark:text-gray-300 dark:hover:text-white rounded-lg text-sm border border-stone-200/40 hover:border-clay-200 dark:border-white/[0.08] dark:hover:border-white/[0.16] transition-all duration-200"
              >
                {pa.name}
                {cityName ? ` in ${cityName}` : ''}
              </Link>
            )
          })}
        </div>

        {/* View all practice areas link */}
        <div className="mt-4">
          <Link
            href="/services"
            className="text-clay-400 hover:text-clay-600 dark:text-clay-400 dark:hover:text-clay-300 text-sm flex items-center gap-1 group"
          >
            View all practice areas
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </section>
  )
}
