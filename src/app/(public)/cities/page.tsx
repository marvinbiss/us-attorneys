import { Metadata } from 'next'
import Link from 'next/link'
import { MapPin, ArrowRight, Building2, Users, ChevronRight } from 'lucide-react'
import Breadcrumb from '@/components/Breadcrumb'
import { SITE_URL } from '@/lib/seo/config'
import { cities, usRegions, states, services, getStateByCode } from '@/lib/data/usa'
import { getPageContent } from '@/lib/cms'
import { CmsContent } from '@/components/CmsContent'
import { REVALIDATE } from '@/lib/cache'

export const revalidate = REVALIDATE.locations

export const metadata: Metadata = {
  title: 'Attorneys by City | US Attorneys',
  description:
    'Find attorneys in major US cities. Browse lawyers near you, read reviews, and get free consultations.',
  alternates: { canonical: `${SITE_URL}/cities` },
  openGraph: {
    title: 'Attorneys by City | US Attorneys',
    description:
      'Find attorneys in major US cities. Browse lawyers near you, read reviews, and get free consultations.',
    url: `${SITE_URL}/cities`,
    type: 'website',
    images: [
      {
        url: `${SITE_URL}/opengraph-image`,
        width: 1200,
        height: 630,
        alt: 'US Attorneys — Attorneys by City',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Attorneys by City | US Attorneys',
    description:
      'Find attorneys in major US cities. Browse lawyers near you, read reviews, and get free consultations.',
  },
}

// Group cities by region (derived from state)
const citiesByRegion = cities.reduce(
  (acc, city) => {
    const region = getStateByCode(city.stateCode)?.region ?? 'Other'
    if (!acc[region]) acc[region] = []
    acc[region].push(city)
    return acc
  },
  {} as Record<string, typeof cities>
)

// Sort regions by number of cities (biggest first)
const sortedRegions = Object.entries(citiesByRegion).sort((a, b) => b[1].length - a[1].length)

export default async function CitiesIndexPage() {
  const cmsPage = await getPageContent('cities', 'static')

  if (cmsPage?.content_html) {
    return (
      <div className="min-h-screen bg-gray-50">
        <section className="border-b bg-white">
          <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
            <h1 className="font-heading text-3xl font-bold text-gray-900">{cmsPage.title}</h1>
          </div>
        </section>
        <section className="py-12">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
            <div className="rounded-xl bg-white p-8 shadow-sm">
              <CmsContent html={cmsPage.content_html} />
            </div>
          </div>
        </section>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'CollectionPage',
            name: 'Attorneys by City in the US',
            description: `Find attorneys in ${cities.length} cities across the United States.`,
            url: `${SITE_URL}/cities`,
            numberOfItems: cities.length,
            isPartOf: { '@type': 'WebSite', name: 'US Attorneys', url: SITE_URL },
            breadcrumb: {
              '@type': 'BreadcrumbList',
              itemListElement: [
                { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
                { '@type': 'ListItem', position: 2, name: 'Cities' },
              ],
            },
          }),
        }}
      />

      {/* ─── PREMIUM DARK HERO ──────────────────────────────── */}
      <section className="relative overflow-hidden bg-[#0a0f1e] text-white">
        {/* Background effects */}
        <div className="absolute inset-0">
          <div
            className="absolute inset-0"
            style={{
              background:
                'radial-gradient(ellipse 80% 50% at 50% -10%, rgba(37,99,235,0.18) 0%, transparent 60%), radial-gradient(ellipse 60% 60% at 80% 110%, rgba(37,99,235,0.1) 0%, transparent 50%), radial-gradient(ellipse 50% 40% at 10% 90%, rgba(59,130,246,0.06) 0%, transparent 50%)',
            }}
          />
          <div
            className="absolute inset-0 opacity-[0.025]"
            style={{
              backgroundImage:
                'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
              backgroundSize: '64px 64px',
            }}
          />
          <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-gray-50 to-transparent" />
        </div>

        <div className="relative mx-auto max-w-6xl px-4 pb-28 pt-10 md:pb-36 md:pt-14">
          {/* Breadcrumb */}
          <div className="mb-10">
            <Breadcrumb
              items={[{ label: 'Cities' }]}
              className="text-slate-400 [&_a:hover]:text-white [&_a]:text-slate-400 [&_svg]:text-slate-600"
            />
          </div>

          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-blue-400/25 bg-blue-500/15 px-4 py-2 backdrop-blur-sm">
              <MapPin className="h-4 w-4 text-blue-400" />
              <span className="text-sm font-medium text-blue-200">Cities</span>
              <span className="h-1 w-1 rounded-full bg-blue-400/50" />
              <span className="text-sm font-medium text-white/90">
                {cities.length}+ cities covered
              </span>
            </div>

            <h1 className="mb-6 font-heading text-4xl font-extrabold leading-[1.08] tracking-[-0.025em] md:text-5xl lg:text-[3.5rem]">
              Attorneys by{' '}
              <span className="bg-gradient-to-r from-blue-400 via-blue-300 to-cyan-300 bg-clip-text text-transparent">
                city
              </span>
            </h1>
            <p className="mx-auto max-w-2xl text-lg leading-relaxed text-slate-400 md:text-xl">
              Find attorneys in more than {cities.length} cities across the United States. Browse
              qualified lawyers near you.
            </p>
          </div>

          {/* Stats badges */}
          <div className="mt-10 flex flex-wrap justify-center gap-4 md:gap-6">
            <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/10 px-5 py-3 backdrop-blur-sm">
              <MapPin className="h-5 w-5 text-blue-400" />
              <div className="text-left">
                <div className="text-xl font-bold text-white">{cities.length}+</div>
                <div className="text-xs text-slate-400">Cities</div>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/10 px-5 py-3 backdrop-blur-sm">
              <Building2 className="h-5 w-5 text-blue-400" />
              <div className="text-left">
                <div className="text-xl font-bold text-white">{states.length}</div>
                <div className="text-xs text-slate-400">States</div>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/10 px-5 py-3 backdrop-blur-sm">
              <Users className="h-5 w-5 text-blue-400" />
              <div className="text-left">
                <div className="text-xl font-bold text-white">Bar-Verified</div>
                <div className="text-xs text-slate-400">Official data</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── CITIES BY REGION ───────────────────────────────── */}
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        {/* Quick-search intro */}
        <div className="mb-12 text-center">
          <h2 className="mb-3 font-heading text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">
            All cities by region
          </h2>
          <p className="mx-auto max-w-lg text-slate-500">
            Select your city to find attorneys in your area.
          </p>
        </div>

        {/* Region quick-nav */}
        <nav className="mb-10 flex flex-wrap gap-2">
          {sortedRegions.map(([region]) => (
            <a
              key={region}
              href={`#region-${region
                .toLowerCase()
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, '')
                .replace(/[^a-z0-9]+/g, '-')}`}
              className="rounded-full bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-600 transition-colors hover:bg-blue-100 hover:text-blue-800"
            >
              {region}
            </a>
          ))}
        </nav>

        {sortedRegions.map(([region, regionCities]) => {
          const regionId = region
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9]+/g, '-')
          return (
            <details
              key={region}
              id={`region-${regionId}`}
              className="group mb-4 rounded-xl border border-gray-200 bg-white"
            >
              <summary className="flex cursor-pointer select-none list-none items-center gap-3 rounded-xl p-4 transition-colors hover:bg-gray-50">
                <Building2 className="h-5 w-5 flex-shrink-0 text-blue-600" />
                <h3 className="font-heading text-base font-bold tracking-tight text-slate-900">
                  {region}
                </h3>
                <span className="text-sm font-medium text-slate-400">
                  ({regionCities.length} cities)
                </span>
                <ChevronRight className="ml-auto h-4 w-4 text-slate-400 transition-transform group-open:rotate-90" />
              </summary>
              <div className="px-4 pb-4">
                <div className="flex flex-wrap gap-x-1 gap-y-0.5">
                  {regionCities.map((city, i) => (
                    <span key={city.slug}>
                      <Link
                        href={`/cities/${city.slug}`}
                        className="text-sm text-slate-600 transition-colors hover:text-blue-600 hover:underline"
                      >
                        {city.name}
                      </Link>
                      {i < regionCities.length - 1 && (
                        <span className="mx-1 text-slate-300">&middot;</span>
                      )}
                    </span>
                  ))}
                </div>
              </div>
            </details>
          )
        })}
      </div>

      {/* ─── CTA ────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-[#0a0f1e]">
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse 80% 50% at 50% 50%, rgba(37,99,235,0.12) 0%, transparent 60%)',
          }}
        />
        <div className="relative mx-auto max-w-4xl px-4 py-16 text-center md:py-20">
          <h2 className="mb-4 font-heading text-2xl font-bold tracking-tight text-white md:text-3xl">
            Need an attorney?
          </h2>
          <p className="mx-auto mb-8 max-w-lg text-slate-400">
            Describe your legal matter and get free consultations from qualified attorneys.
          </p>
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/quotes"
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 px-8 py-3.5 font-semibold text-white shadow-lg shadow-amber-500/25 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-amber-500/35"
            >
              Get a free consultation
            </Link>
            <Link
              href="/practice-areas"
              className="inline-flex items-center gap-2 font-medium text-slate-300 transition-colors hover:text-white"
            >
              Browse practice areas <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ─── SEO INTERNAL LINKS ─────────────────────────────── */}
      <section className="border-t border-gray-100 bg-white py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="mb-8 font-heading text-xl font-bold tracking-tight text-slate-900">
            Also explore
          </h2>
          <div className="grid gap-10 md:grid-cols-3">
            {/* Regions */}
            <div>
              <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-900">
                By region
              </h3>
              <div className="space-y-2">
                {usRegions.slice(0, 8).map((r) => (
                  <Link
                    key={r.slug}
                    href={`/regions/${r.slug}`}
                    className="flex items-center gap-2 py-2 text-sm text-slate-600 transition-colors hover:text-blue-600"
                  >
                    <ChevronRight className="h-3 w-3" />
                    Attorneys in {r.name}
                  </Link>
                ))}
              </div>
              <Link
                href="/regions"
                className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700"
              >
                All regions <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            {/* Departements */}
            <div>
              <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-900">
                By state
              </h3>
              <div className="space-y-2">
                {states.slice(0, 8).map((d) => (
                  <Link
                    key={d.slug}
                    href={`/states/${d.slug}`}
                    className="flex items-center gap-2 py-2 text-sm text-slate-600 transition-colors hover:text-blue-600"
                  >
                    <ChevronRight className="h-3 w-3" />
                    {d.name} ({d.code})
                  </Link>
                ))}
              </div>
              <Link
                href="/states"
                className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700"
              >
                All states <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            {/* Services */}
            <div>
              <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-900">
                Popular practice areas
              </h3>
              <div className="space-y-2">
                {services.slice(0, 8).map((s) => (
                  <Link
                    key={s.slug}
                    href={`/practice-areas/${s.slug}`}
                    className="flex items-center gap-2 py-2 text-sm text-slate-600 transition-colors hover:text-blue-600"
                  >
                    <ChevronRight className="h-3 w-3" />
                    {s.name}
                  </Link>
                ))}
              </div>
              <Link
                href="/practice-areas"
                className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700"
              >
                All practice areas <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
