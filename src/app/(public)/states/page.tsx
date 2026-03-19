import { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, Building2, MapPin, Users, ChevronRight, Map } from 'lucide-react'
import Breadcrumb from '@/components/Breadcrumb'
import { SITE_URL } from '@/lib/seo/config'
import { states, usRegions, cities, services } from '@/lib/data/usa'
import { getPageContent } from '@/lib/cms'
import { CmsContent } from '@/components/CmsContent'
import { getAttorneyCount, formatAttorneyCount } from '@/lib/data/stats'
import { REVALIDATE } from '@/lib/cache'

export const revalidate = REVALIDATE.locations

export const metadata: Metadata = {
  title: 'Attorneys by State | US Attorneys',
  description:
    'Find attorneys in all 50 US states and DC. Browse lawyers by state, read reviews, and get free consultations.',
  alternates: { canonical: `${SITE_URL}/states` },
  openGraph: {
    title: 'Attorneys by State | US Attorneys',
    description:
      'Find attorneys in all 50 US states and DC. Browse lawyers by state, read reviews, and get free consultations.',
    url: `${SITE_URL}/states`,
    type: 'website',
    images: [
      {
        url: `${SITE_URL}/opengraph-image`,
        width: 1200,
        height: 630,
        alt: 'US Attorneys — Attorneys by State',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Attorneys by State | US Attorneys',
    description:
      'Find attorneys in all 50 US states and DC. Browse lawyers by state, read reviews, and get free consultations.',
  },
}

const deptsByRegion = states.reduce(
  (acc, dept) => {
    if (!acc[dept.region]) acc[dept.region] = []
    acc[dept.region].push(dept)
    return acc
  },
  {} as Record<string, typeof states>
)

// Sort regions alphabetically
const sortedRegions = Object.entries(deptsByRegion).sort((a, b) => a[0].localeCompare(b[0]))

export default async function DepartementsIndexPage() {
  const [cmsPage, attorneyCount] = await Promise.all([
    getPageContent('states', 'static'),
    getAttorneyCount(),
  ])

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
            name: 'Attorneys by State in the US',
            description: 'Find attorneys in all 50 US states and DC.',
            url: `${SITE_URL}/states`,
            numberOfItems: states.length,
            isPartOf: { '@type': 'WebSite', name: 'US Attorneys', url: SITE_URL },
            breadcrumb: {
              '@type': 'BreadcrumbList',
              itemListElement: [
                { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
                { '@type': 'ListItem', position: 2, name: 'States' },
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
                'radial-gradient(ellipse 80% 50% at 50% -10%, rgba(79,70,229,0.20) 0%, transparent 60%), radial-gradient(ellipse 60% 60% at 80% 110%, rgba(99,102,241,0.12) 0%, transparent 50%), radial-gradient(ellipse 50% 40% at 10% 90%, rgba(129,140,248,0.08) 0%, transparent 50%)',
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
              items={[{ label: 'States' }]}
              className="text-slate-400 [&_a:hover]:text-white [&_a]:text-slate-400 [&_svg]:text-slate-600"
            />
          </div>

          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-indigo-400/25 bg-indigo-500/15 px-4 py-2 backdrop-blur-sm">
              <Map className="h-4 w-4 text-indigo-400" />
              <span className="text-sm font-medium text-indigo-200">States</span>
              <span className="h-1 w-1 rounded-full bg-indigo-400/50" />
              <span className="text-sm font-medium text-white/90">Nationwide coverage</span>
            </div>

            <h1 className="mb-6 font-heading text-4xl font-extrabold leading-[1.08] tracking-[-0.025em] md:text-5xl lg:text-[3.5rem]">
              <span className="bg-gradient-to-r from-indigo-400 via-indigo-300 to-blue-300 bg-clip-text text-transparent">
                {states.length}
              </span>{' '}
              states covered
            </h1>
            <p className="mx-auto max-w-2xl text-lg leading-relaxed text-slate-400 md:text-xl">
              {attorneyCount > 0
                ? `${formatAttorneyCount(attorneyCount)} attorneys listed`
                : 'Thousands of attorneys listed'}{' '}
              across all US states. Free search, free consultations.
            </p>
          </div>

          {/* Stats badges */}
          <div className="mt-10 flex flex-wrap justify-center gap-4 md:gap-6">
            <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/10 px-5 py-3 backdrop-blur-sm">
              <Building2 className="h-5 w-5 text-indigo-400" />
              <div className="text-left">
                <div className="text-xl font-bold text-white">{states.length}</div>
                <div className="text-xs text-slate-400">States</div>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/10 px-5 py-3 backdrop-blur-sm">
              <MapPin className="h-5 w-5 text-indigo-400" />
              <div className="text-left">
                <div className="text-xl font-bold text-white">{usRegions.length}</div>
                <div className="text-xs text-slate-400">Regions</div>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/10 px-5 py-3 backdrop-blur-sm">
              <Users className="h-5 w-5 text-indigo-400" />
              <div className="text-left">
                <div className="text-xl font-bold text-white">
                  {attorneyCount > 0 ? formatAttorneyCount(attorneyCount) : '—'}
                </div>
                <div className="text-xs text-slate-400">Listed attorneys</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── DEPARTMENTS BY REGION ──────────────────────────── */}
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="mb-12 text-center">
          <h2 className="mb-3 font-heading text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">
            All states by region
          </h2>
          <p className="mx-auto max-w-lg text-slate-500">
            Select a state to browse attorneys in your area.
          </p>
        </div>

        {sortedRegions.map(([region, regionDepts]) => (
          <section key={region} className="mb-12">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-100">
                <Building2 className="h-4 w-4 text-indigo-600" />
              </div>
              <h3 className="font-heading text-lg font-bold tracking-tight text-slate-900">
                {region}
              </h3>
              <span className="text-sm font-medium text-slate-400">
                ({regionDepts.length} states)
              </span>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {regionDepts.map((dept) => (
                <Link
                  key={dept.slug}
                  href={`/states/${dept.slug}`}
                  className="group flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-4 transition-all hover:-translate-y-0.5 hover:border-indigo-300 hover:shadow-md"
                >
                  <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-50 to-indigo-100 text-sm font-bold text-indigo-600 transition-colors group-hover:from-indigo-100 group-hover:to-indigo-200">
                    {dept.code}
                  </div>
                  <div className="min-w-0">
                    <span className="block truncate text-sm font-semibold text-slate-800 transition-colors group-hover:text-indigo-600">
                      {dept.name}
                    </span>
                    <span className="text-xs text-slate-400">{dept.population} pop.</span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>

      {/* ─── CTA ────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-[#0a0f1e]">
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse 80% 50% at 50% 50%, rgba(79,70,229,0.12) 0%, transparent 60%)',
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
