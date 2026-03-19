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
    description:
      'Find verified attorneys across all 50 states. Bar-verified profiles, reviews and free consultations.',
    url: `${SITE_URL}/attorneys`,
    siteName: 'US Attorneys',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'US Attorneys Directory — Verified Lawyers',
    description:
      'Find verified attorneys near you. Personal injury, criminal defense, family law and 75+ practice areas across all 50 states.',
  },
}

// Direct Supabase query — ISR with revalidate=3600
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
      .select(
        'id, stable_id, name, slug, address_line1, address_zip, address_city, address_state, is_verified, is_active, phone, bar_number, rating_average, review_count, specialty:specialties!primary_specialty_id(name, slug)'
      )
      .eq('is_active', true)
      .order('phone', { ascending: false, nullsFirst: false })
      .order('is_verified', { ascending: false })
      .limit(limit)

    if (error) {
      return {
        providers: [],
        count: 0,
        error: `Query error: ${error.message} (code: ${error.code})`,
      }
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
    return {
      providers: [],
      count: 0,
      error: `Exception: ${error instanceof Error ? error.message : String(error)}`,
    }
  }
}

export default async function AttorneysPage() {
  const { providers, count, error } = await getRecentProviders(60)
  const topServices = practiceAreas.slice(0, 15)

  return (
    <>
      {/* Breadcrumbs (visual + JSON-LD) */}
      <div className="border-b bg-white">
        <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6 lg:px-8">
          <Breadcrumbs items={[{ label: 'Attorneys', semanticType: 'CollectionPage' }]} />
        </div>
      </div>

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-16 text-white md:py-24">
        <div className="absolute inset-0 opacity-10">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                'radial-gradient(circle at 25% 25%, rgba(251,191,36,0.3) 0%, transparent 50%), radial-gradient(circle at 75% 75%, rgba(59,130,246,0.2) 0%, transparent 50%)',
            }}
          />
        </div>
        <div className="relative mx-auto max-w-7xl px-4 text-center sm:px-6">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/20 px-4 py-1.5">
            <Users className="h-4 w-4 text-amber-400" />
            <span className="text-sm font-medium text-amber-300">
              {count > 0
                ? `${count.toLocaleString('en-US')} listed attorneys`
                : 'Attorney Directory'}
            </span>
          </div>
          <h1 className="mb-6 text-4xl font-extrabold leading-tight md:text-5xl lg:text-6xl">
            Find a{' '}
            <span className="bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">
              qualified attorney
            </span>{' '}
            near you
          </h1>

          {/* Quick search links */}
          <div className="mt-8 flex flex-wrap justify-center gap-2">
            {topServices.slice(0, 8).map((s) => (
              <Link
                key={s.slug}
                href={`/practice-areas/${s.slug}`}
                className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm font-medium text-white transition-all duration-200 hover:border-white/30 hover:bg-white/20"
              >
                {s.name}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Stats bar */}
      {count > 0 && (
        <section className="border-b bg-white">
          <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
            <div className="grid grid-cols-2 gap-4 text-center sm:grid-cols-3 sm:gap-6 md:grid-cols-4">
              <div>
                <div className="text-2xl font-bold text-slate-900 md:text-3xl">
                  {count.toLocaleString('en-US')}
                </div>
                <div className="mt-1 text-sm text-slate-500">Listed Attorneys</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-slate-900 md:text-3xl">75+</div>
                <div className="mt-1 text-sm text-slate-500">Practice Areas</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-slate-900 md:text-3xl">50</div>
                <div className="mt-1 text-sm text-slate-500">States</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-slate-900 md:text-3xl">41,000+</div>
                <div className="mt-1 text-sm text-slate-500">ZIP Codes Served</div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Error state */}
      {error && (
        <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
          <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
            <p className="font-medium text-red-800">Error loading attorneys</p>
            <p className="mt-1 text-sm text-red-600">{error}</p>
          </div>
        </section>
      )}

      {/* Providers listing */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <h2 className="mb-2 text-2xl font-bold text-slate-900 md:text-3xl">
          Recently Listed Attorneys
        </h2>
        <p className="mb-8 text-slate-500">
          {providers.length > 0
            ? `${providers.length} attorneys shown out of ${count.toLocaleString('en-US')} total`
            : 'Loading...'}
        </p>

        {providers.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {providers.map((provider) => {
              const specialtyObj = provider.specialty as { name?: string; slug?: string } | null
              const providerUrl = getAttorneyUrl({
                stable_id: provider.stable_id,
                slug: provider.slug,
                specialty: specialtyObj?.name || null,
                city: provider.address_city,
              })
              const ratingValue = provider.rating_average?.toFixed(1)

              return (
                <div
                  key={provider.id}
                  className="group relative overflow-hidden rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition-all duration-300 before:absolute before:inset-x-0 before:top-0 before:h-[3px] before:bg-gradient-to-r before:from-amber-400 before:via-amber-500 before:to-orange-500 before:opacity-0 before:transition-opacity hover:-translate-y-1 hover:border-amber-200 hover:shadow-lg hover:before:opacity-100"
                >
                  {/* Name + verification */}
                  <div className="mb-3 flex items-start gap-3">
                    <div
                      className={`h-11 w-11 rounded-full bg-gradient-to-br ${getAvatarColor(provider.name)} flex flex-shrink-0 items-center justify-center text-lg font-bold text-white shadow-sm`}
                    >
                      {provider.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <Link
                          href={providerUrl}
                          className="truncate text-lg font-bold text-gray-900 transition-colors hover:text-blue-700"
                        >
                          {provider.name}
                        </Link>
                        {provider.is_verified && (
                          <span
                            className="inline-flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full"
                            style={{ backgroundColor: '#1877f2' }}
                            title="Verified Attorney"
                          >
                            <svg
                              className="h-3 w-3 text-white"
                              viewBox="0 0 24 24"
                              fill="currentColor"
                            >
                              <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                            </svg>
                          </span>
                        )}
                      </div>
                      {specialtyObj?.name && (
                        <p className="mt-0.5 text-sm font-medium capitalize text-slate-500">
                          {specialtyObj.name}
                        </p>
                      )}
                    </div>
                    {ratingValue && provider.review_count > 0 && (
                      <div className="flex-shrink-0 text-right">
                        <div className="flex items-center gap-1">
                          <Star className="h-5 w-5 fill-amber-500 text-amber-500" />
                          <span className="text-lg font-bold">{ratingValue}</span>
                        </div>
                        <span className="text-xs text-gray-500">
                          {provider.review_count} reviews
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Location */}
                  {provider.address_city && (
                    <div className="mb-1 flex items-center gap-2 text-sm text-gray-600">
                      <MapPin className="h-4 w-4 flex-shrink-0 text-gray-400" />
                      <span>
                        {provider.address_line1
                          ? provider.address_zip &&
                            provider.address_line1.includes(provider.address_zip)
                            ? provider.address_line1
                            : `${provider.address_line1}, ${provider.address_zip ?? ''} ${provider.address_city ?? ''}`.trim()
                          : `${provider.address_zip ?? ''} ${provider.address_city ?? ''}`.trim()}
                      </span>
                    </div>
                  )}

                  {/* Bar Number */}
                  {provider.bar_number && (
                    <p className="mb-3 ml-6 text-xs text-gray-400">Bar # {provider.bar_number}</p>
                  )}

                  {/* Badges */}
                  {provider.address_state && (
                    <div className="mb-4 flex flex-wrap gap-2">
                      <span className="rounded-full border border-blue-100 bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
                        {provider.address_state}
                      </span>
                    </div>
                  )}

                  {/* CTA */}
                  <div className="flex gap-3">
                    <Link
                      href={`${providerUrl}#quote`}
                      className="flex-1 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 py-2.5 text-center text-sm font-bold text-white shadow-md shadow-amber-500/25 transition-all duration-200 hover:from-amber-600 hover:to-amber-700 hover:shadow-lg"
                    >
                      Request a Quote
                    </Link>
                    {provider.phone && (
                      <a
                        href={`tel:${provider.phone}`}
                        className="flex items-center justify-center gap-1.5 rounded-xl border-2 border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 transition-all duration-200 hover:border-gray-300 hover:bg-gray-50"
                      >
                        <Phone className="h-4 w-4" />
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
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <h2 className="mb-6 text-2xl font-bold text-slate-900">Browse by Practice Area</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {practiceAreas.map((s) => (
              <Link
                key={s.slug}
                href={`/practice-areas/${s.slug}`}
                className="group flex items-center gap-2 rounded-xl border border-gray-100 bg-white px-4 py-3 transition-all duration-200 hover:border-amber-200 hover:shadow-md"
              >
                <Building2 className="h-4 w-4 flex-shrink-0 text-amber-500" />
                <span className="truncate text-sm font-medium text-gray-700 group-hover:text-amber-700">
                  {s.name}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Browse by city */}
      <section className="py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <h2 className="mb-6 text-2xl font-bold text-slate-900">Popular Cities</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {[
              'new-york',
              'los-angeles',
              'chicago',
              'houston',
              'phoenix',
              'philadelphia',
              'san-antonio',
              'san-diego',
              'dallas',
              'san-jose',
              'austin',
              'miami',
            ].map((city) => (
              <Link
                key={city}
                href={`/cities/${city}`}
                className="rounded-xl border border-gray-100 bg-white px-4 py-3 text-center transition-all duration-200 hover:border-amber-200 hover:shadow-md"
              >
                <span className="text-sm font-medium capitalize text-gray-700">{city}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
