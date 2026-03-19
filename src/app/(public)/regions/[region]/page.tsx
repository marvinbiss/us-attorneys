import { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import {
  MapPin,
  Users,
  ArrowRight,
  Shield,
  Clock,
  Building2,
  ChevronRight,
  Wrench,
  HelpCircle,
  Globe,
} from 'lucide-react'
import Breadcrumb from '@/components/Breadcrumb'
import JsonLd from '@/components/JsonLd'
import { getBreadcrumbSchema, getCollectionPageSchema, getFAQSchema } from '@/lib/seo/jsonld'
import { SITE_URL } from '@/lib/seo/config'
import {
  usRegions,
  getRegionBySlug,
  practiceAreas as allServices,
  getCitiesByState,
} from '@/lib/data/usa'
import { getAttorneyCountByRegion, formatAttorneyCount } from '@/lib/data/stats'
import { getRegionImage } from '@/lib/data/images'
import { generateRegionContent, hashCode } from '@/lib/seo/location-content'
import { Thermometer, TrendingUp, AlertTriangle, Mountain } from 'lucide-react'
import problems from '@/lib/data/problems'
import { REVALIDATE } from '@/lib/cache'

export function generateStaticParams() {
  return usRegions.map((region) => ({ region: region.slug }))
}

export const dynamicParams = false
export const revalidate = REVALIDATE.locations

interface PageProps {
  params: Promise<{ region: string }>
}

function truncateTitle(title: string, maxLen = 42): string {
  if (title.length <= maxLen) return title
  return title.slice(0, maxLen - 1).replace(/\s+\S*$/, '') + '…'
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { region: regionSlug } = await params
  const region = getRegionBySlug(regionSlug)
  if (!region) return { title: 'Region not found' }

  const metaContent = generateRegionContent(region)
  const stateCount = region.states.length
  const cityCount = region.states.reduce((acc, d) => acc + getCitiesByState(d.code).length, 0)
  const attorneyCount = await getAttorneyCountByRegion(region.name)

  const titleHash = Math.abs(hashCode(`title-region-${region.slug}`))
  const titleTemplates = [
    `${region.name} Attorneys | US Attorneys`,
    `Find Attorneys in ${region.name}`,
    `${region.name}: Top Lawyers — Free Consult`,
    `Attorneys in ${region.name} — Compare`,
    `${region.name} — Attorney Directory`,
  ]
  const title = truncateTitle(titleTemplates[titleHash % titleTemplates.length])

  const descHash = Math.abs(hashCode(`desc-region-${region.slug}`))
  const attorneyStr = attorneyCount > 0 ? `${formatAttorneyCount(attorneyCount)} attorneys, ` : ''
  const descTemplates = [
    `Find an attorney in ${region.name}. ${attorneyStr}${stateCount} states, ${cityCount} cities. Free consultations.`,
    `${region.name}: ${attorneyStr}verified attorney directory. ${metaContent.profile.geoLabel}, ${metaContent.profile.climateLabel.toLowerCase()}. Compare lawyers.`,
    `Attorneys in ${region.name}: ${cityCount} cities covered, ${allServices.length} practice areas. ${attorneyStr}${metaContent.profile.economyLabel}. Free consultation.`,
    `Browse all attorneys in ${region.name}. ${attorneyStr}${stateCount} states, ${metaContent.profile.geoLabel.toLowerCase()}. Compare for free.`,
    `${region.name} — ${stateCount} states, ${cityCount} cities${attorneyCount > 0 ? `, ${formatAttorneyCount(attorneyCount)} attorneys` : ''}. ${metaContent.profile.climateLabel}. Free consultations.`,
  ]
  const description = descTemplates[descHash % descTemplates.length]

  const regionImage = getRegionImage(regionSlug)

  return {
    title,
    description,
    // Hub pages are always indexed — rich geographic content has value even with 0 providers
    robots: { index: true, follow: true },
    alternates: { canonical: `${SITE_URL}/regions/${regionSlug}` },
    openGraph: {
      locale: 'en_US',
      title,
      description,
      type: 'website',
      url: `${SITE_URL}/regions/${regionSlug}`,
      images: [
        { url: regionImage.src, width: 1200, height: 630, alt: `Attorneys in ${region.name}` },
      ],
    },
    twitter: {
      card: 'summary_large_image' as const,
      title,
      description,
      images: [regionImage.src],
    },
  }
}

export default async function RegionPage({ params }: PageProps) {
  const { region: regionSlug } = await params
  const region = getRegionBySlug(regionSlug)
  if (!region) notFound()

  const stateCount = region.states.length
  const stateCitiesMap = Object.fromEntries(
    region.states.map((st) => [st.code, getCitiesByState(st.code)])
  )
  const allCities = region.states.flatMap((st) => stateCitiesMap[st.code])
  const cityCount = allCities.length
  const content = generateRegionContent(region, cityCount)
  const regionAttorneyCount = await getAttorneyCountByRegion(region.name)

  // Reorder services by climate-based priority
  const topServiceSlugsSet = new Set(content.profile.topServiceSlugs.slice(0, 5))
  const orderedServices = [...allServices].sort((a, b) => {
    const ai = content.profile.topServiceSlugs.indexOf(a.slug)
    const bi = content.profile.topServiceSlugs.indexOf(b.slug)
    return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi)
  })

  // Other regions
  const otherRegions = usRegions.filter((r) => r.slug !== regionSlug)

  // JSON-LD structured data
  const breadcrumbSchema = getBreadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: 'Regions', url: '/regions' },
    { name: region.name, url: `/regions/${regionSlug}` },
  ])
  const collectionSchema = getCollectionPageSchema({
    name: `Attorneys in ${region.name}`,
    description: `Find a qualified attorney in ${region.name}. ${stateCount} states, ${cityCount} cities covered.`,
    url: `/regions/${regionSlug}`,
    itemCount: cityCount,
  })

  const faqSchema = getFAQSchema(content.faqItems)

  return (
    <div className="min-h-screen bg-gray-50">
      <JsonLd data={[breadcrumbSchema, collectionSchema, faqSchema]} />

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
              items={[{ label: 'Regions', href: '/regions' }, { label: region.name }]}
              className="text-slate-400 [&_a:hover]:text-white [&_a]:text-slate-400 [&_svg]:text-slate-600"
            />
          </div>

          <div className="max-w-3xl">
            <div className="mb-5 flex flex-wrap gap-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-slate-400/25 bg-slate-500/15 px-4 py-2 backdrop-blur-sm">
                <Globe className="h-4 w-4 text-slate-300" />
                <span className="text-sm font-medium text-slate-200">Region</span>
              </div>
              <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/25 bg-cyan-500/15 px-4 py-2 backdrop-blur-sm">
                <Thermometer className="h-4 w-4 text-cyan-400" />
                <span className="text-sm font-medium text-cyan-200">
                  {content.profile.climateLabel}
                </span>
              </div>
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/25 bg-emerald-500/15 px-4 py-2 backdrop-blur-sm">
                <Mountain className="h-4 w-4 text-emerald-400" />
                <span className="text-sm font-medium text-emerald-200">
                  {content.profile.geoLabel}
                </span>
              </div>
            </div>

            {(() => {
              const h1Hash = Math.abs(hashCode(`h1-region-${region.slug}`))
              const h1Templates = [
                `Attorneys in ${region.name}`,
                `Find an attorney in ${region.name}`,
                `${region.name}: lawyers by state`,
                `Top-rated attorneys in ${region.name}`,
                `All attorneys in ${region.name}`,
              ]
              return (
                <h1 className="mb-5 font-heading text-3xl font-extrabold leading-[1.1] tracking-[-0.025em] md:text-4xl lg:text-5xl">
                  {h1Templates[h1Hash % h1Templates.length]}
                </h1>
              )
            })()}
            <p className="mb-8 max-w-2xl text-lg leading-relaxed text-slate-400">
              {content.profile.climateLabel}, {content.profile.geoLabel.toLowerCase()},{' '}
              {content.profile.economyLabel.toLowerCase()}. {allServices.length} practice areas
              available.
            </p>

            {/* Stats badges */}
            <div className="mb-8 flex flex-wrap gap-4 text-sm">
              {regionAttorneyCount > 0 && (
                <div className="flex items-center gap-2 text-slate-300">
                  <Users className="h-4 w-4 text-amber-400" />
                  <span>
                    {formatAttorneyCount(regionAttorneyCount)} attorney
                    {regionAttorneyCount > 1 ? 's' : ''}
                  </span>
                </div>
              )}
              <div className="flex items-center gap-2 text-slate-300">
                <Building2 className="h-4 w-4 text-slate-400" />
                <span>
                  {stateCount} state{stateCount > 1 ? 's' : ''}
                </span>
              </div>
              <div className="flex items-center gap-2 text-slate-300">
                <MapPin className="h-4 w-4 text-slate-400" />
                <span>
                  {cityCount} cit{cityCount > 1 ? 'ies' : 'y'} covered
                </span>
              </div>
              <div className="flex items-center gap-2 text-slate-300">
                <Users className="h-4 w-4 text-slate-400" />
                <span>{allServices.length} practice areas</span>
              </div>
            </div>

            {/* Trust badges */}
            <div className="flex flex-wrap gap-3">
              <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-2 backdrop-blur">
                <Shield className="h-4 w-4 text-amber-400" />
                <span className="text-sm font-medium">Bar-verified attorneys</span>
              </div>
              <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-2 backdrop-blur">
                <Clock className="h-4 w-4 text-amber-400" />
                <span className="text-sm font-medium">Free consultations</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── QUICK SERVICES BAR ─────────────────────────────── */}
      <section className="border-b border-gray-100 bg-white py-6 shadow-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-sm font-medium text-slate-500">Top practice areas:</span>
            {orderedServices.map((service) => (
              <Link
                key={service.slug}
                href={`/regions/${regionSlug}/${service.slug}`}
                className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors ${topServiceSlugsSet.has(service.slug) ? 'border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100' : 'border-gray-200 bg-gray-50 text-slate-700 hover:bg-slate-100'}`}
              >
                {service.name} en {region.name}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        {/* ─── REGIONAL PROFILE ──────────────────────────────── */}
        <section className="mb-16">
          <div className="mb-8 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-100">
              <Thermometer className="h-5 w-5 text-cyan-600" />
            </div>
            <div>
              <h2 className="font-heading text-2xl font-bold tracking-tight text-slate-900">
                {region.name} region profile
              </h2>
              <p className="text-sm text-slate-500">
                {content.profile.climateLabel} · {content.profile.geoLabel}
              </p>
            </div>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-white p-8">
            <p className="mb-6 leading-relaxed text-slate-700">{content.intro}</p>
            <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-xl bg-cyan-50 p-4">
                <div className="mb-1 text-xs font-semibold uppercase tracking-wider text-cyan-700">
                  Climate
                </div>
                <div className="text-sm font-medium text-slate-800">
                  {content.profile.climateLabel}
                </div>
              </div>
              <div className="rounded-xl bg-emerald-50 p-4">
                <div className="mb-1 text-xs font-semibold uppercase tracking-wider text-emerald-700">
                  Geography
                </div>
                <div className="text-sm font-medium text-slate-800">{content.profile.geoLabel}</div>
              </div>
              <div className="rounded-xl bg-violet-50 p-4">
                <div className="mb-1 text-xs font-semibold uppercase tracking-wider text-violet-700">
                  Economy
                </div>
                <div className="text-sm font-medium text-slate-800">
                  {content.profile.economyLabel}
                </div>
              </div>
              <div className="rounded-xl bg-amber-50 p-4">
                <div className="mb-1 text-xs font-semibold uppercase tracking-wider text-amber-700">
                  Coverage
                </div>
                <div className="text-sm font-medium text-slate-800">
                  {regionAttorneyCount > 0
                    ? `${formatAttorneyCount(regionAttorneyCount)} attorneys · `
                    : ''}
                  {stateCount} states · {cityCount} cities
                </div>
              </div>
            </div>
            <div className="mb-6">
              <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-slate-900">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                Key characteristics
              </h3>
              <div className="grid gap-2 sm:grid-cols-2">
                {content.profile.keyFacts.map((fact, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm text-slate-600">
                    <span className="mt-0.5 text-amber-500">•</span>
                    {fact}
                  </div>
                ))}
              </div>
            </div>
            <p className="leading-relaxed text-slate-700">{content.regionalContext}</p>
          </div>
        </section>

        {/* ─── SEO CONTENT ────────────────────────────────────── */}
        <section className="mb-16">
          <div className="mb-8 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100">
              <TrendingUp className="h-5 w-5 text-blue-600" />
            </div>
            <h2 className="font-heading text-2xl font-bold tracking-tight text-slate-900">
              Legal services in {region.name}
            </h2>
          </div>
          <div className="space-y-6">
            <div className="rounded-2xl border border-gray-200 bg-white p-8">
              <h3 className="mb-4 font-heading text-lg font-bold text-slate-900">
                Top practice areas
              </h3>
              <p className="leading-relaxed text-slate-700">{content.priorityServices}</p>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-white p-8">
              <h3 className="mb-4 font-heading text-lg font-bold text-slate-900">
                Tips for finding the right attorney
              </h3>
              <p className="leading-relaxed text-slate-700">{content.regionAdvice}</p>
            </div>
          </div>
        </section>

        {/* ─── DEPARTMENTS ──────────────────────────────────── */}
        <section className="mb-16">
          <div className="mb-8 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100">
              <Building2 className="h-5 w-5 text-slate-600" />
            </div>
            <div>
              <h2 className="font-heading text-2xl font-bold tracking-tight text-slate-900">
                States in the {region.name} region
              </h2>
              <p className="text-sm text-slate-500">
                {stateCount} state{stateCount > 1 ? 's' : ''}
              </p>
            </div>
          </div>
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {region.states.map((st) => (
              <Link
                key={st.code}
                href={`/states/${st.slug}`}
                className="group rounded-2xl border border-gray-200 bg-white p-6 transition-all duration-300 hover:-translate-y-0.5 hover:border-slate-400 hover:shadow-lg"
              >
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-slate-50 to-slate-100 transition-colors group-hover:from-slate-100 group-hover:to-slate-200">
                      <span className="text-sm font-bold text-slate-700">{st.code}</span>
                    </div>
                    <div>
                      <h3 className="font-heading text-base font-bold text-slate-900 transition-colors group-hover:text-slate-700">
                        {st.name}
                      </h3>
                      <span className="text-xs text-slate-400">
                        {stateCitiesMap[st.code].length} cit
                        {stateCitiesMap[st.code].length > 1 ? 'ies' : 'y'}
                      </span>
                    </div>
                  </div>
                  <ArrowRight className="h-5 w-5 text-slate-300 transition-all group-hover:translate-x-0.5 group-hover:text-slate-600" />
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {stateCitiesMap[st.code].slice(0, 4).map((city) => (
                    <span
                      key={city.slug}
                      className="rounded-full bg-gray-50 px-2.5 py-1 text-xs text-slate-500 transition-colors group-hover:bg-slate-100 group-hover:text-slate-700"
                    >
                      {city.name}
                    </span>
                  ))}
                  {stateCitiesMap[st.code].length > 4 && (
                    <span className="px-2 py-1 text-xs text-slate-400">
                      +{stateCitiesMap[st.code].length - 4}
                    </span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* ─── SERVICES BY CITY ─────────────────────────────── */}
        <section className="mb-16">
          <div className="mb-8 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100">
              <Wrench className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <h2 className="font-heading text-2xl font-bold tracking-tight text-slate-900">
                Practice areas by city in {region.name}
              </h2>
              <p className="text-sm text-slate-500">Quick access to attorneys by city</p>
            </div>
          </div>
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {allCities.slice(0, 12).map((city) => (
              <div key={city.slug} className="rounded-2xl border border-gray-200 bg-white p-6">
                <h3 className="mb-4 font-heading font-semibold text-slate-900">
                  Attorneys in {city.name}
                </h3>
                <div className="flex flex-wrap gap-2">
                  {allServices.map((service) => (
                    <Link
                      key={`${service.slug}-${city.slug}`}
                      href={`/practice-areas/${service.slug}/${city.slug}`}
                      className="rounded-lg border border-transparent px-3 py-1.5 text-sm text-slate-600 transition-colors hover:border-blue-100 hover:bg-blue-50 hover:text-blue-600"
                    >
                      {service.name}
                    </Link>
                  ))}
                </div>
                <Link
                  href={`/cities/${city.slug}`}
                  className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700"
                >
                  All attorneys <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            ))}
          </div>
        </section>

        {/* ─── OTHER REGIONS ────────────────────────────────── */}
        <section className="mb-16">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-100">
              <Globe className="h-5 w-5 text-violet-600" />
            </div>
            <h2 className="font-heading text-xl font-bold tracking-tight text-slate-900">
              Other regions
            </h2>
          </div>
          <div className="flex flex-wrap gap-3">
            {otherRegions.slice(0, 12).map((r) => (
              <Link
                key={r.slug}
                href={`/regions/${r.slug}`}
                className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900"
              >
                {r.name}
              </Link>
            ))}
          </div>
        </section>

        {/* ─── FAQ ───────────────────────────────────────────── */}
        <section className="mb-16">
          <div className="mb-8 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100">
              <HelpCircle className="h-5 w-5 text-amber-600" />
            </div>
            <h2 className="font-heading text-2xl font-bold tracking-tight text-slate-900">
              Frequently asked questions
            </h2>
          </div>
          <div className="space-y-4">
            {content.faqItems.map((faq, i) => (
              <div key={i} className="rounded-xl border border-gray-200 bg-white p-6">
                <h3 className="mb-2 font-semibold text-slate-900">{faq.question}</h3>
                <p className="text-sm leading-relaxed text-slate-600">{faq.answer}</p>
              </div>
            ))}
          </div>
        </section>
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
            Need an attorney in {region.name}?
          </h2>
          <p className="mx-auto mb-8 max-w-lg text-slate-400">
            Get up to 3 free consultations from qualified attorneys.
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
            See also
          </h2>
          <div className="grid gap-10 md:grid-cols-3">
            {/* Services */}
            <div>
              <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-900">
                Services en {region.name}
              </h3>
              <div className="space-y-2">
                {allServices.slice(0, 8).map((s) => (
                  <Link
                    key={s.slug}
                    href={`/regions/${regionSlug}/${s.slug}`}
                    className="flex items-center gap-2 py-2 text-sm text-slate-600 transition-colors hover:text-blue-600"
                  >
                    <ChevronRight className="h-3 w-3" />
                    {s.name} en {region.name}
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

            {/* Other regions */}
            <div>
              <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-900">
                Other regions
              </h3>
              <div className="space-y-2">
                {otherRegions.slice(0, 6).map((r) => (
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

            {/* Cities in this region */}
            <div>
              <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-900">
                Villes en {region.name}
              </h3>
              <div className="space-y-2">
                {allCities.slice(0, 6).map((city) => (
                  <Link
                    key={city.slug}
                    href={`/cities/${city.slug}`}
                    className="flex items-center gap-2 py-2 text-sm text-slate-600 transition-colors hover:text-blue-600"
                  >
                    <ChevronRight className="h-3 w-3" />
                    Attorneys in {city.name}
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
          </div>

          {/* Intent variant links -- quotes, reviews, pricing */}
          <div className="mt-10 grid gap-8 md:grid-cols-3">
            <div>
              <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-900">
                Consultations in {region.name}
              </h3>
              <div className="space-y-1.5">
                {allCities.slice(0, 6).flatMap((city) =>
                  allServices.slice(0, 5).map((s) => (
                    <Link
                      key={`quotes-${s.slug}-${city.slug}`}
                      href={`/quotes/${s.slug}/${city.slug}`}
                      className="flex items-center gap-2 py-1 text-sm text-slate-600 transition-colors hover:text-blue-600"
                    >
                      <ChevronRight className="h-3 w-3" />
                      {s.name} consultation in {city.name}
                    </Link>
                  ))
                )}
              </div>
            </div>
            <div>
              <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-900">
                Reviews in {region.name}
              </h3>
              <div className="space-y-1.5">
                {allCities.slice(0, 6).flatMap((city) =>
                  allServices.slice(0, 5).map((s) => (
                    <Link
                      key={`reviews-${s.slug}-${city.slug}`}
                      href={`/reviews/${s.slug}/${city.slug}`}
                      className="flex items-center gap-2 py-1 text-sm text-slate-600 transition-colors hover:text-blue-600"
                    >
                      <ChevronRight className="h-3 w-3" />
                      {s.name} reviews in {city.name}
                    </Link>
                  ))
                )}
              </div>
            </div>
            <div>
              <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-900">
                Pricing in {region.name}
              </h3>
              <div className="space-y-1.5">
                {allCities.slice(0, 6).flatMap((city) =>
                  allServices.slice(0, 5).map((s) => (
                    <Link
                      key={`pricing-${s.slug}-${city.slug}`}
                      href={`/pricing/${s.slug}/${city.slug}`}
                      className="flex items-center gap-2 py-1 text-sm text-slate-600 transition-colors hover:text-blue-600"
                    >
                      <ChevronRight className="h-3 w-3" />
                      {s.name} pricing in {city.name}
                    </Link>
                  ))
                )}
              </div>
            </div>
          </div>
          <div className="mt-8">
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-red-700">
              Emergency services in {region.name}
            </h3>
            <div className="flex flex-wrap gap-2">
              {allCities.slice(0, 6).flatMap((city) =>
                allServices.slice(0, 5).map((s) => (
                  <Link
                    key={`emergency-${s.slug}-${city.slug}`}
                    href={`/emergency/${s.slug}/${city.slug}`}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-red-100 bg-red-50 px-3 py-1.5 text-sm text-red-700 transition-colors hover:border-red-200 hover:bg-red-100 hover:text-red-800"
                  >
                    Emergency {s.name.toLowerCase()} in {city.name}
                  </Link>
                ))
              )}
            </div>
          </div>
          <div className="mt-8">
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-orange-700">
              Common issues in {region.name}
            </h3>
            <div className="flex flex-wrap gap-2">
              {allCities.slice(0, 4).flatMap((city) =>
                problems.slice(0, 6).map((p) => (
                  <Link
                    key={`issue-${p.slug}-${city.slug}`}
                    href={`/issues/${p.slug}/${city.slug}`}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-orange-100 bg-orange-50 px-3 py-1.5 text-sm text-orange-700 transition-colors hover:border-orange-200 hover:bg-orange-100 hover:text-orange-800"
                  >
                    {p.name} in {city.name}
                  </Link>
                ))
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ─── EDITORIAL CREDIBILITY ──────────────────────────── */}
      <section className="mb-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
            <h3 className="mb-2 text-sm font-semibold text-slate-700">Editorial methodology</h3>
            <p className="text-xs leading-relaxed text-slate-500">
              Geographic and economic profiles are regional estimates. Data comes from public
              sources. US Attorneys is an independent directory — we do not provide legal services
              or guarantee outcomes.
            </p>
          </div>
        </div>
      </section>

      {/* Trust & Safety */}
      <section className="border-t py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="mb-4 text-lg font-bold text-gray-900">Trust & Safety</h2>
          <div className="flex flex-wrap gap-4">
            <Link
              href="/verification-process"
              className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-800"
            >
              Verification process
            </Link>
            <Link
              href="/review-policy"
              className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-800"
            >
              Review policy
            </Link>
            <Link
              href="/mediation"
              className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-800"
            >
              Mediation
            </Link>
            <Link
              href="/terms"
              className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-800"
            >
              Terms of service
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
