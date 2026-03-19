import { Metadata } from 'next'
import Link from 'next/link'
import { MapPin, ArrowRight, Users, Building2, ChevronRight, Globe } from 'lucide-react'
import Breadcrumb from '@/components/Breadcrumb'
import { SITE_URL } from '@/lib/seo/config'
import { usRegions, states, cities, services, getCitiesByState } from '@/lib/data/usa'
import { getPageContent } from '@/lib/cms'
import { CmsContent } from '@/components/CmsContent'
import { REVALIDATE } from '@/lib/cache'

export const revalidate = REVALIDATE.locations

export const metadata: Metadata = {
  title: 'Attorneys by Region | US Attorneys',
  description:
    'Browse attorneys across US regions: Northeast, South, Midwest, and West. Find lawyers by practice area, read reviews, and get free consultations.',
  alternates: { canonical: `${SITE_URL}/regions` },
  openGraph: {
    title: 'Attorneys by Region | US Attorneys',
    description:
      'Browse attorneys across US regions: Northeast, South, Midwest, and West. Find lawyers by practice area.',
    url: `${SITE_URL}/regions`,
    type: 'website',
    images: [
      {
        url: `${SITE_URL}/opengraph-image`,
        width: 1200,
        height: 630,
        alt: 'US Attorneys — Attorneys by Region',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Attorneys by Region | US Attorneys',
    description:
      'Browse attorneys across US regions: Northeast, South, Midwest, and West. Find lawyers by practice area.',
  },
}

export default async function RegionsIndexPage() {
  const cmsPage = await getPageContent('regions', 'static')

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

  const totalDepartments = usRegions.reduce((acc, r) => acc + r.states.length, 0)

  return (
    <div className="min-h-screen bg-gray-50">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'CollectionPage',
            name: 'Attorneys by Region in the US',
            description: 'Find attorneys across all US regions.',
            url: `${SITE_URL}/regions`,
            numberOfItems: usRegions.length,
            isPartOf: { '@type': 'WebSite', name: 'US Attorneys', url: SITE_URL },
            breadcrumb: {
              '@type': 'BreadcrumbList',
              itemListElement: [
                { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
                { '@type': 'ListItem', position: 2, name: 'Regions' },
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
                'radial-gradient(ellipse 80% 50% at 50% -10%, rgba(51,65,85,0.30) 0%, transparent 60%), radial-gradient(ellipse 60% 60% at 80% 110%, rgba(71,85,105,0.15) 0%, transparent 50%), radial-gradient(ellipse 50% 40% at 10% 90%, rgba(100,116,139,0.08) 0%, transparent 50%)',
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
              items={[{ label: 'Regions' }]}
              className="text-slate-400 [&_a:hover]:text-white [&_a]:text-slate-400 [&_svg]:text-slate-600"
            />
          </div>

          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-slate-400/25 bg-slate-500/15 px-4 py-2 backdrop-blur-sm">
              <Globe className="h-4 w-4 text-slate-300" />
              <span className="text-sm font-medium text-slate-200">Regions</span>
              <span className="h-1 w-1 rounded-full bg-slate-400/50" />
              <span className="text-sm font-medium text-white/90">Nationwide coverage</span>
            </div>

            <h1 className="mb-6 font-heading text-4xl font-extrabold leading-[1.08] tracking-[-0.025em] md:text-5xl lg:text-[3.5rem]">
              <span className="bg-gradient-to-r from-slate-300 via-slate-200 to-white bg-clip-text text-transparent">
                {usRegions.length} regions
              </span>
              , a national network
            </h1>
            <p className="mx-auto max-w-2xl text-lg leading-relaxed text-slate-400 md:text-xl">
              Find verified attorneys across every region of the United States. Browse our
              comprehensive attorney directory.
            </p>
          </div>

          {/* Stats badges */}
          <div className="mt-10 flex flex-wrap justify-center gap-4 md:gap-6">
            <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/10 px-5 py-3 backdrop-blur-sm">
              <Globe className="h-5 w-5 text-slate-300" />
              <div className="text-left">
                <div className="text-xl font-bold text-white">{usRegions.length}</div>
                <div className="text-xs text-slate-400">Regions</div>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/10 px-5 py-3 backdrop-blur-sm">
              <Building2 className="h-5 w-5 text-slate-300" />
              <div className="text-left">
                <div className="text-xl font-bold text-white">{totalDepartments}</div>
                <div className="text-xs text-slate-400">States</div>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/10 px-5 py-3 backdrop-blur-sm">
              <Users className="h-5 w-5 text-slate-300" />
              <div className="text-left">
                <div className="text-xl font-bold text-white">Bar-Verified</div>
                <div className="text-xs text-slate-400">Official data</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── REGIONS GRID ───────────────────────────────────── */}
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="mb-12 text-center">
          <h2 className="mb-3 font-heading text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">
            Choose your region
          </h2>
          <p className="mx-auto max-w-lg text-slate-500">
            Each region has qualified attorneys for all your legal needs.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {usRegions.map((region) => {
            const deptCount = region.states.length
            const cityCount = region.states.reduce(
              (acc, d) => acc + getCitiesByState(d.code).length,
              0
            )

            return (
              <Link
                key={region.slug}
                href={`/regions/${region.slug}`}
                className="group rounded-2xl border border-gray-200 bg-white p-6 transition-all duration-300 hover:-translate-y-0.5 hover:border-slate-400 hover:shadow-lg"
              >
                <div className="mb-4 flex items-start justify-between">
                  <div>
                    <h3 className="font-heading text-lg font-bold tracking-tight text-slate-900 transition-colors group-hover:text-slate-700">
                      {region.name}
                    </h3>
                  </div>
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-slate-50 transition-colors group-hover:bg-slate-100">
                    <ArrowRight className="h-5 w-5 text-slate-600 transition-transform group-hover:translate-x-0.5" />
                  </div>
                </div>

                <p className="mb-4 line-clamp-2 text-sm leading-relaxed text-slate-500">
                  {region.description}
                </p>

                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1.5 text-slate-500">
                    <Building2 className="h-3.5 w-3.5" />
                    <span>
                      {deptCount} state{deptCount > 1 ? 's' : ''}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-500">
                    <MapPin className="h-3.5 w-3.5" />
                    <span>
                      {cityCount} cit{cityCount > 1 ? 'ies' : 'y'}
                    </span>
                  </div>
                </div>

                {/* Preview cities */}
                <div className="mt-4 flex flex-wrap gap-1.5 border-t border-gray-100 pt-4">
                  {region.states
                    .flatMap((d) => getCitiesByState(d.code))
                    .slice(0, 4)
                    .map((city) => (
                      <span
                        key={city.slug}
                        className="rounded-full bg-gray-100 px-2.5 py-1 text-xs text-slate-600 transition-colors group-hover:bg-slate-100 group-hover:text-slate-800"
                      >
                        {city.name}
                      </span>
                    ))}
                  {cityCount > 4 && (
                    <span className="px-2 py-1 text-xs text-slate-400">+{cityCount - 4}</span>
                  )}
                </div>
              </Link>
            )
          })}
        </div>
      </div>

      {/* ─── CTA ────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-[#0a0f1e]">
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse 80% 50% at 50% 50%, rgba(51,65,85,0.15) 0%, transparent 60%)',
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
            {/* Departements */}
            <div>
              <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-900">
                Popular states
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

            {/* Villes */}
            <div>
              <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-900">
                Major cities
              </h3>
              <div className="space-y-2">
                {cities.slice(0, 12).map((v) => (
                  <Link
                    key={v.slug}
                    href={`/cities/${v.slug}`}
                    className="flex items-center gap-2 py-2 text-sm text-slate-600 transition-colors hover:text-blue-600"
                  >
                    <ChevronRight className="h-3 w-3" />
                    Attorneys in {v.name}
                  </Link>
                ))}
              </div>
              <Link
                href="/cities"
                className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700"
              >
                All cities <ArrowRight className="h-4 w-4" />
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
