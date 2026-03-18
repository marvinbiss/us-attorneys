import type { Metadata } from 'next'
import { Suspense } from 'react'
import { searchAttorneys, type SearchFilters, type AttorneyListRow } from '@/lib/supabase'
import { SITE_URL, SITE_NAME } from '@/lib/seo/config'
import JsonLd from '@/components/JsonLd'
import { getBreadcrumbSchema } from '@/lib/seo/jsonld'
import Breadcrumb from '@/components/Breadcrumb'
import { SearchResults } from '@/components/search/SearchResults'
import { HeroSearch } from '@/components/search/HeroSearch'
import type { SearchAttorney } from '@/components/search/SearchResultCard'
import { getNextAvailableBatch } from '@/lib/availability'
import { applySubscriptionBoost, getSubscriptionTier } from '@/lib/search/ranking'

// ISR: revalidate every hour (search results change frequently)
export const revalidate = 3600

// ── Metadata ─────────────────────────────────────────────────────────────
interface SearchPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

function getParam(
  params: { [key: string]: string | string[] | undefined },
  key: string
): string {
  const v = params[key]
  return typeof v === 'string' ? v : ''
}

export async function generateMetadata({
  searchParams,
}: SearchPageProps): Promise<Metadata> {
  const params = await searchParams
  const q = getParam(params, 'q')
  const pa = getParam(params, 'pa')
  const state = getParam(params, 'state')
  const city = getParam(params, 'city')
  const page = parseInt(getParam(params, 'page') || '1', 10)

  // Build a descriptive title
  const titleParts: string[] = []
  if (q) titleParts.push(q)
  if (pa) titleParts.push(pa.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()))
  if (city) titleParts.push(city)
  if (state) titleParts.push(state.toUpperCase())

  const baseTitle = titleParts.length > 0
    ? `${titleParts.join(' - ')} Attorneys`
    : 'Find an Attorney'

  const title = page > 1 ? `${baseTitle} - Page ${page}` : baseTitle
  const fullTitle = `${title} | ${SITE_NAME}`

  const description = titleParts.length > 0
    ? `Search results for ${titleParts.join(', ')} attorneys. Compare ratings, read reviews, and find the right lawyer for your legal needs.`
    : 'Search our directory of verified attorneys across all 50 states. Compare ratings, read reviews, and connect with qualified lawyers.'

  // Build canonical URL (include page param only if > 1)
  const canonicalParams = new URLSearchParams()
  if (q) canonicalParams.set('q', q)
  if (pa) canonicalParams.set('pa', pa)
  if (state) canonicalParams.set('state', state)
  if (city) canonicalParams.set('city', city)
  if (page > 1) canonicalParams.set('page', String(page))
  const canonicalQs = canonicalParams.toString()
  const canonical = `${SITE_URL}/search${canonicalQs ? `?${canonicalQs}` : ''}`

  // Index search pages with meaningful queries; noindex empty searches
  const hasQuery = !!(q || pa || state || city)

  return {
    title: fullTitle,
    description,
    alternates: { canonical },
    robots: {
      index: hasQuery,
      follow: true,
      'max-snippet': -1,
      'max-image-preview': 'large' as const,
    },
    openGraph: {
      title: fullTitle,
      description,
      url: canonical,
      type: 'website',
      siteName: SITE_NAME,
    },
    twitter: {
      card: 'summary',
      title: fullTitle,
      description,
    },
  }
}

// ── Data mapping ─────────────────────────────────────────────────────────

function mapToSearchAttorney(row: AttorneyListRow & { distance_miles?: number | null; specialty_slug?: string | null; specialty_name?: string | null }): SearchAttorney {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    specialty_slug: row.specialty_slug ?? row.specialty?.slug ?? null,
    specialty_name: row.specialty_name ?? row.specialty?.name ?? null,
    specialty: row.specialty ?? null,
    address_city: row.address_city,
    address_state: row.address_state,
    address_county: row.address_county,
    is_verified: row.is_verified,
    rating_average: row.rating_average,
    review_count: row.review_count,
    phone: row.phone,
    bar_number: row.bar_number,
    is_featured: row.is_featured,
    distance_miles: (row as { distance_miles?: number | null }).distance_miles ?? null,
    // Trust signal fields
    years_experience: row.years_experience ?? null,
    consultation_fee: row.consultation_fee ?? null,
    languages: row.languages ?? null,
    // Subscription tier (derived from boost_level in DB)
    boost_level: row.boost_level ?? null,
    subscription_tier: getSubscriptionTier(row.boost_level),
  }
}

// ── Page ─────────────────────────────────────────────────────────────────

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams
  const q = getParam(params, 'q')
  const pa = getParam(params, 'pa')
  const state = getParam(params, 'state')
  const city = getParam(params, 'city')
  const rating = getParam(params, 'rating')
  const sort = getParam(params, 'sort') as SearchFilters['sort'] || 'relevance'
  const free_consultation = getParam(params, 'free_consultation')
  const verified = getParam(params, 'verified')
  const radius = getParam(params, 'radius')
  const available = getParam(params, 'available')
  const lang = getParam(params, 'lang')
  const page = Math.max(1, parseInt(getParam(params, 'page') || '1', 10))
  const limit = 20

  // Build search filters
  const filters: SearchFilters = {
    q: q || undefined,
    specialty: pa || undefined,
    state: state || undefined,
    city: city || undefined,
    rating_min: rating ? parseFloat(rating) : undefined,
    sort: sort || 'relevance',
    page,
    limit,
  }

  // Execute search
  const result = await searchAttorneys(filters)
  const mappedAttorneys = result.attorneys.map(mapToSearchAttorney)

  // Apply subscription-based ranking boost (premium pinned to top, pro boosted)
  const boostedAttorneys = applySubscriptionBoost(mappedAttorneys)

  // Fetch availability for all attorneys in a single batch query (no N+1)
  const attorneyIds = boostedAttorneys.map((a) => a.id)
  const availabilityMap = await getNextAvailableBatch(attorneyIds)

  // Merge availability into attorney data
  const attorneys = boostedAttorneys.map((a) => ({
    ...a,
    availability: availabilityMap.get(a.id) ?? null,
  }))

  // Breadcrumb items
  const breadcrumbItems: { label: string; href?: string }[] = [{ label: 'Search', href: '/search' }]
  if (q) breadcrumbItems.push({ label: q })

  // JSON-LD
  const breadcrumbSchema = getBreadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: 'Search', url: '/search' },
    ...(q ? [{ name: q, url: `/search?q=${encodeURIComponent(q)}` }] : []),
  ])

  const hasAnyFilter = !!(q || pa || state || city)

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <JsonLd data={[breadcrumbSchema]} />

      {/* Search bar header */}
      <section className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900 overflow-hidden">
        {/* Background decorations */}
        <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
          <h1 className="text-center font-heading text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-6 tracking-tight">
            {hasAnyFilter ? (
              <>
                Search results
                {q && (
                  <span className="block sm:inline text-blue-300">
                    {' '}for &ldquo;{q}&rdquo;
                  </span>
                )}
              </>
            ) : (
              'Find an attorney'
            )}
          </h1>
          <Suspense>
            <HeroSearch />
          </Suspense>
        </div>
      </section>

      {/* Breadcrumb */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <Breadcrumb items={breadcrumbItems} />
        </div>
      </div>

      {/* Results */}
      <Suspense
        fallback={
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <SearchResultsSkeleton />
          </div>
        }
      >
        <SearchResults
          attorneys={attorneys}
          total={result.total}
          page={page}
          limit={limit}
          hasMore={result.has_more}
          query={q}
          filters={{ pa, state, city, rating, sort, free_consultation, verified, radius, available, lang }}
        />
      </Suspense>
    </div>
  )
}

// ── Skeleton loader ──────────────────────────────────────────────────────

function SearchResultsSkeleton() {
  return (
    <div className="flex gap-8">
      {/* Sidebar skeleton */}
      <div className="hidden lg:block w-80 flex-shrink-0">
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5 space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="space-y-2">
              <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded shimmer-loading" />
              <div className="h-10 w-full bg-gray-100 dark:bg-gray-700 rounded-xl shimmer-loading" />
            </div>
          ))}
        </div>
      </div>
      {/* Results skeleton */}
      <div className="flex-1 space-y-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6"
          >
            <div className="flex gap-4">
              <div className="w-20 h-20 rounded-2xl bg-gray-200 dark:bg-gray-700 shimmer-loading" />
              <div className="flex-1 space-y-3">
                <div className="h-5 w-48 bg-gray-200 dark:bg-gray-700 rounded shimmer-loading" />
                <div className="h-4 w-32 bg-gray-100 dark:bg-gray-700 rounded shimmer-loading" />
                <div className="h-4 w-64 bg-gray-100 dark:bg-gray-700 rounded shimmer-loading" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
