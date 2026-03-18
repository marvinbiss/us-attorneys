import { Metadata } from 'next'
import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'
import { MapPin, Star, Phone, Users, Building2 } from 'lucide-react'
import { EmptyState } from '@/components/ui/EmptyState'
import Breadcrumbs from '@/components/seo/Breadcrumbs'
import { SITE_URL } from '@/lib/seo/config'
import { getAttorneyUrl, getAvatarColor } from '@/lib/utils'

import { practiceAreas } from '@/lib/data/usa'

export const revalidate = 3600 // ISR - revalidate every hour

export const metadata: Metadata = {
  title: 'US Attorneys Directory — Verified Lawyers',
  description:
    'Find verified attorneys near you. Personal injury, criminal defense, family law and 75+ practice areas across all 50 states.',
  alternates: { canonical: `${SITE_URL}/attorneys` },
  openGraph: {
    locale: 'en_US',
    title: 'US Attorneys Directory — Verified Lawyers',
    description: 'Find verified attorneys across all 50 states. Bar-verified profiles, reviews and free consultations.',
    url: `${SITE_URL}/attorneys`,
    siteName: 'US Attorneys',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'US Attorneys Directory — Verified Lawyers',
    description: 'Find verified attorneys near you. Personal injury, criminal defense, family law and 75+ practice areas across all 50 states.',
  },
}

// Direct Supabase query — bypasses IS_BUILD since page is force-dynamic
async function getRecentProviders(limit = 50) {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!url || !key) {
      return { providers: [], count: 0, error: `Env vars missing: URL=${!!url}, KEY=${!!key}` }
    }

    const supabase = createClient(url, key)

    const { data, error } = await supabase
      .from('attorneys')
      .select('id, stable_id, name, slug, specialty, address_line1, address_zip, address_city, address_state, is_verified, is_active, phone, bar_number, rating_average, review_count')
      .eq('is_active', true)
      .order('phone', { ascending: false, nullsFirst: false })
      .order('is_verified', { ascending: false })
      .limit(limit)

    if (error) {
      return { providers: [], count: 0, error: `Query error: ${error.message} (code: ${error.code})` }
    }

    // Get total count — use estimated count to avoid timeout on 743K+ rows
    let totalCount = data?.length ?? 0
    try {
      const { count } = await supabase
        .from('attorneys')
        .select('id', { count: 'estimated', head: true })
        .eq('is_active', true)
      if (count && count > 0) totalCount = count
    } catch {
      // Count failed — use 0 to avoid displaying false numbers
      totalCount = 0
    }

    return {
      providers: data || [],
      count: totalCount,
      error: null,
    }
  } catch (error: unknown) {
    return { providers: [], count: 0, error: `Exception: ${error instanceof Error ? error.message : String(error)}` }
  }
}


export default async function ArtisansPage() {
  const { providers, count, error } = await getRecentProviders(60)
  const topServices = practiceAreas.slice(0, 15)

  return (
    <>
      {/* Breadcrumbs (visual + JSON-LD) */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <Breadcrumbs
            items={[
              { label: 'Attorneys' },
            ]}
          />
        </div>
      </div>

      {/* Hero */}
      <section className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white py-16 md:py-24 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: 'radial-gradient(circle at 25% 25%, rgba(251,191,36,0.3) 0%, transparent 50%), radial-gradient(circle at 75% 75%, rgba(59,130,246,0.2) 0%, transparent 50%)',
          }} />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 text-center">
          <div className="inline-flex items-center gap-2 bg-amber-500/20 border border-amber-500/30 rounded-full px-4 py-1.5 mb-6">
            <Users className="w-4 h-4 text-amber-400" />
            <span className="text-sm font-medium text-amber-300">
              {count > 0 ? `${count.toLocaleString('en-US')} listed attorneys` : 'Attorney Directory'}
            </span>
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold mb-6 leading-tight">
            Find a <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500">qualified attorney</span> near you
          </h1>

          {/* Quick search links */}
          <div className="flex flex-wrap justify-center gap-2 mt-8">
            {topServices.slice(0, 8).map(s => (
              <Link
                key={s.slug}
                href={`/practice-areas/${s.slug}`}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/10 hover:border-white/30 rounded-full text-sm font-medium text-white transition-all duration-200"
              >
                {s.name}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Stats bar */}
      {count > 0 && (
        <section className="bg-white border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 sm:gap-6 text-center">
              <div>
                <div className="text-2xl md:text-3xl font-bold text-slate-900">{count.toLocaleString('en-US')}</div>
                <div className="text-sm text-slate-500 mt-1">Listed Attorneys</div>
              </div>
              <div>
                <div className="text-2xl md:text-3xl font-bold text-slate-900">75+</div>
                <div className="text-sm text-slate-500 mt-1">Practice Areas</div>
              </div>
              <div>
                <div className="text-2xl md:text-3xl font-bold text-slate-900">50</div>
                <div className="text-sm text-slate-500 mt-1">States</div>
              </div>
              <div>
                <div className="text-2xl md:text-3xl font-bold text-slate-900">41,000+</div>
                <div className="text-sm text-slate-500 mt-1">ZIP Codes Served</div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Error state */}
      {error && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
            <p className="text-red-800 font-medium">Error loading attorneys</p>
            <p className="text-red-600 text-sm mt-1">{error}</p>
          </div>
        </section>
      )}

      {/* Providers listing */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-2">
          Recently Listed Attorneys
        </h2>
        <p className="text-slate-500 mb-8">
          {providers.length > 0
            ? `${providers.length} attorneys shown out of ${count.toLocaleString('en-US')} total`
            : 'Loading...'}
        </p>

        {providers.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {providers.map((provider) => {
              const providerUrl = getAttorneyUrl({
                stable_id: provider.stable_id,
                slug: provider.slug,
                specialty: provider.specialty,
                city: provider.address_city,
              })
              const ratingValue = provider.rating_average?.toFixed(1)

              return (
                <div
                  key={provider.id}
                  className="group relative overflow-hidden rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:border-amber-200 before:absolute before:inset-x-0 before:top-0 before:h-[3px] before:bg-gradient-to-r before:from-amber-400 before:via-amber-500 before:to-orange-500 before:opacity-0 hover:before:opacity-100 before:transition-opacity"
                >
                  {/* Name + verification */}
                  <div className="flex items-start gap-3 mb-3">
                    <div className={`w-11 h-11 rounded-full bg-gradient-to-br ${getAvatarColor(provider.name)} flex items-center justify-center text-white text-lg font-bold shadow-sm flex-shrink-0`}>
                      {provider.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <Link
                          href={providerUrl}
                          className="text-lg font-bold text-gray-900 hover:text-blue-700 transition-colors truncate"
                        >
                          {provider.name}
                        </Link>
                        {provider.is_verified && (
                          <span
                            className="inline-flex items-center justify-center w-5 h-5 rounded-full flex-shrink-0"
                            style={{ backgroundColor: '#1877f2' }}
                            title="Verified Attorney"
                          >
                            <svg className="w-3 h-3 text-white" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                            </svg>
                          </span>
                        )}
                      </div>
                      {provider.specialty && (
                        <p className="text-sm text-slate-500 font-medium mt-0.5 capitalize">{provider.specialty}</p>
                      )}
                    </div>
                    {ratingValue && provider.review_count > 0 && (
                      <div className="text-right flex-shrink-0">
                        <div className="flex items-center gap-1">
                          <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
                          <span className="text-lg font-bold">{ratingValue}</span>
                        </div>
                        <span className="text-xs text-gray-500">{provider.review_count} reviews</span>
                      </div>
                    )}
                  </div>

                  {/* Location */}
                  {provider.address_city && (
                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                      <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      <span>
                        {provider.address_line1
                          ? provider.address_zip && provider.address_line1.includes(provider.address_zip)
                            ? provider.address_line1
                            : `${provider.address_line1}, ${provider.address_zip ?? ''} ${provider.address_city ?? ''}`.trim()
                          : `${provider.address_zip ?? ''} ${provider.address_city ?? ''}`.trim()}
                      </span>
                    </div>
                  )}

                  {/* Bar Number */}
                  {provider.bar_number && (
                    <p className="text-xs text-gray-400 mb-3 ml-6">Bar # {provider.bar_number}</p>
                  )}

                  {/* Badges */}
                  {provider.address_state && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      <span className="text-xs px-2.5 py-1 rounded-full bg-blue-50 border border-blue-100 text-blue-700 font-medium">
                        {provider.address_state}
                      </span>
                    </div>
                  )}

                  {/* CTA */}
                  <div className="flex gap-3">
                    <Link
                      href={`${providerUrl}#quote`}
                      className="flex-1 py-2.5 text-center bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-xl font-bold shadow-md shadow-amber-500/25 hover:from-amber-600 hover:to-amber-700 hover:shadow-lg transition-all duration-200 text-sm"
                    >
                      Request a Quote
                    </Link>
                    {provider.phone && (
                      <a
                        href={`tel:${provider.phone}`}
                        className="flex items-center justify-center gap-1.5 px-4 py-2.5 border-2 border-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 text-sm"
                      >
                        <Phone className="w-4 h-4" />
                        Call
                      </a>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        ) : !error ? (
          <EmptyState
            variant="search"
            title="No attorneys found"
            description="The database may be temporarily unavailable. Please try again later."
            action={{ label: 'Browse Practice Areas', href: '/practice-areas' }}
          />
        ) : null}
      </section>

      {/* Browse by service */}
      <section className="bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <h2 className="text-2xl font-bold text-slate-900 mb-6">Browse by Practice Area</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {practiceAreas.map(s => (
              <Link
                key={s.slug}
                href={`/practice-areas/${s.slug}`}
                className="flex items-center gap-2 px-4 py-3 bg-white rounded-xl border border-gray-100 hover:border-amber-200 hover:shadow-md transition-all duration-200 group"
              >
                <Building2 className="w-4 h-4 text-amber-500 flex-shrink-0" />
                <span className="text-sm font-medium text-gray-700 group-hover:text-amber-700 truncate">{s.name}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Browse by city */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <h2 className="text-2xl font-bold text-slate-900 mb-6">Popular Cities</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {['new-york', 'los-angeles', 'chicago', 'houston', 'phoenix', 'philadelphia', 'san-antonio', 'san-diego', 'dallas', 'san-jose', 'austin', 'miami'].map(city => (
              <Link
                key={city}
                href={`/cities/${city}`}
                className="px-4 py-3 bg-white rounded-xl border border-gray-100 hover:border-amber-200 hover:shadow-md transition-all duration-200 text-center"
              >
                <span className="text-sm font-medium text-gray-700 capitalize">{city}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
