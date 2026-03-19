import { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import {
  MapPin,
  Users,
  Building2,
  ArrowRight,
  Shield,
  Clock,
  ChevronRight,
  Wrench,
  HelpCircle,
  Thermometer,
  Home,
  TrendingUp,
  AlertTriangle,
} from 'lucide-react'
import Breadcrumb from '@/components/Breadcrumb'
import JsonLd from '@/components/JsonLd'
import { getPlaceSchema, getBreadcrumbSchema, getFAQSchema } from '@/lib/seo/jsonld'
import { SITE_URL } from '@/lib/seo/config'
import {
  cities,
  getCityBySlug,
  practiceAreas,
  getRegionSlugByName,
  getStateByCode,
  getNeighborhoodsByCity,
} from '@/lib/data/usa'
import { getCityImage, BLUR_PLACEHOLDER } from '@/lib/data/images'
import { generateCityContent, hashCode } from '@/lib/seo/location-content'
import problems from '@/lib/data/problems'
import { REVALIDATE } from '@/lib/cache'
import { resolveZipToCity } from '@/lib/location-resolver'
import CityDemographics from '@/components/seo/CityDemographics'
import { getLocationBySlug } from '@/lib/data/location-data'
import type { LocationData } from '@/lib/data/location-data'

// Pre-render top 20 cities, rest generated on-demand via ISR
const TOP_CITIES_COUNT = 20
export function generateStaticParams() {
  return cities.slice(0, TOP_CITIES_COUNT).map((c) => ({ city: c.slug }))
}

export const dynamicParams = true
export const revalidate = REVALIDATE.locations

interface PageProps {
  params: Promise<{ city: string }>
}

function truncateTitle(title: string, maxLen = 42): string {
  if (title.length <= maxLen) return title
  return title.slice(0, maxLen - 1).replace(/\s+\S*$/, '') + '…'
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { city: citySlug } = await params
  const cityInfo = getCityBySlug(citySlug) || (await resolveZipToCity(citySlug))
  if (!cityInfo) return { title: 'City Not Found' }
  const cityRegion = getStateByCode(cityInfo.stateCode)?.region ?? ''

  const cityImage = getCityImage(citySlug)
  const metaContent = generateCityContent(cityInfo)

  const titleHash = Math.abs(hashCode(`title-cityInfo-${cityInfo.slug}`))
  const titleTemplates = [
    `Attorneys ${cityInfo.name} (${cityInfo.stateCode}) — Consultation`,
    `Attorney ${cityInfo.name} — Free Consultation`,
    `${cityInfo.name}: Qualified Attorneys — Consult`,
    `Attorneys in ${cityInfo.name} — Compare`,
    `${cityInfo.name} (${cityInfo.stateCode}) — Directory`,
  ]
  const title = truncateTitle(titleTemplates[titleHash % titleTemplates.length])

  const descHash = Math.abs(hashCode(`desc-cityInfo-${cityInfo.slug}`))
  const descTemplates = [
    `Find qualified attorneys in ${cityInfo.name} (${cityInfo.stateCode}). ${metaContent.profile.climateLabel}, ${practiceAreas.length} practice areas. Free consultations.`,
    `${cityInfo.name}, ${cityInfo.stateName}: verified attorneys. ${metaContent.profile.citySizeLabel}, ${metaContent.profile.climateLabel.toLowerCase()}. Free consultation.`,
    `Directory of ${practiceAreas.length} practice areas in ${cityInfo.name} (${cityInfo.stateCode}), ${cityRegion}. ${metaContent.profile.climateLabel}. Compare attorneys.`,
    `Attorneys in ${cityInfo.name}: family law, personal injury, criminal defense and more. Pop. ${cityInfo.population}, ${cityInfo.stateName}. Free consultations online.`,
    `All attorneys in ${cityInfo.name} (${cityInfo.stateCode}). ${metaContent.profile.citySizeLabel} in ${cityRegion}. ${practiceAreas.length} practice areas, free consultation.`,
  ]
  const description = descTemplates[descHash % descTemplates.length]

  return {
    title,
    description,
    // Hub pages are always indexed — rich geographic content has value even with 0 providers
    robots: { index: true, follow: true },
    openGraph: {
      locale: 'en_US',
      title,
      description,
      type: 'website',
      images: [
        cityImage
          ? { url: cityImage.src, width: 1200, height: 630, alt: cityImage.alt }
          : {
              url: `${SITE_URL}/opengraph-image`,
              width: 1200,
              height: 630,
              alt: `Attorneys in ${cityInfo.name}`,
            },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [cityImage ? cityImage.src : `${SITE_URL}/opengraph-image`],
    },
    alternates: { canonical: `${SITE_URL}/cities/${citySlug}` },
  }
}

export default async function CityPage({ params }: PageProps) {
  const { city: citySlug } = await params
  const cityInfo = getCityBySlug(citySlug) || (await resolveZipToCity(citySlug))
  if (!cityInfo) notFound()
  const cityRegion = getStateByCode(cityInfo.stateCode)?.region ?? ''

  // Get other cities in the same state
  const nearbyCities = cities.filter(
    (v) => v.stateCode === cityInfo.stateCode && v.slug !== cityInfo.slug
  )

  // Get other cities in the same region
  const regionCities = cities
    .filter((v) => getStateByCode(v.stateCode)?.region === cityRegion && v.slug !== cityInfo.slug)
    .slice(0, 8)

  const regionSlug = getRegionSlugByName(cityRegion)
  const dept = getStateByCode(cityInfo.stateCode)
  const deptSlug = dept?.slug

  // Fetch DB location data (census_data, enrichment) — best-effort, never crash
  let locationData: LocationData | null = null
  try {
    locationData = await getLocationBySlug(cityInfo.slug)
  } catch {
    // DB unavailable — continue with static data only
  }

  // Generate unique SEO content
  const content = generateCityContent(cityInfo)
  const topServiceSlugsSet = new Set(content.profile.topServiceSlugs.slice(0, 5))
  const orderedServices = [...practiceAreas].sort((a, b) => {
    const aIdx = content.profile.topServiceSlugs.indexOf(a.slug)
    const bIdx = content.profile.topServiceSlugs.indexOf(b.slug)
    return (aIdx === -1 ? 999 : aIdx) - (bIdx === -1 ? 999 : bIdx)
  })

  // JSON-LD structured data
  const cityImage = getCityImage(cityInfo.slug)
  const placeSchema = getPlaceSchema({
    name: cityInfo.name,
    slug: cityInfo.slug,
    region: cityRegion,
    department: cityInfo.stateName,
    description: `Find qualified attorneys in ${cityInfo.name}. Family law, personal injury, criminal defense and more.`,
    image: cityImage?.src,
  })
  const breadcrumbSchema = getBreadcrumbSchema([
    { name: 'Home', url: '/', semanticType: 'Organization' },
    { name: 'Cities', url: '/cities', semanticType: 'CollectionPage' },
    { name: cityInfo.name, url: `/cities/${cityInfo.slug}`, semanticType: 'City' },
  ])

  const faqSchema = getFAQSchema(content.faqItems)

  return (
    <div className="min-h-screen bg-gray-50">
      <JsonLd data={[placeSchema, breadcrumbSchema, faqSchema]} />

      {/* ─── PREMIUM DARK HERO ──────────────────────────────── */}
      <section className="relative overflow-hidden bg-[#0a0f1e] text-white">
        {/* Background effects */}
        <div className="absolute inset-0">
          {cityImage && (
            <Image
              src={cityImage.src}
              alt={cityImage.alt}
              fill
              className="object-cover opacity-15"
              sizes="100vw"
              priority
              placeholder="blur"
              blurDataURL={BLUR_PLACEHOLDER}
            />
          )}
          <div className="absolute inset-0 bg-[#0a0f1e]/80" />
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
              items={[
                ...(regionSlug ? [{ label: cityRegion, href: `/regions/${regionSlug}` }] : []),
                ...(deptSlug
                  ? [
                      {
                        label: `${cityInfo.stateName} (${cityInfo.stateCode})`,
                        href: `/states/${deptSlug}`,
                      },
                    ]
                  : []),
                { label: cityInfo.name },
              ]}
              className="text-slate-400 [&_a:hover]:text-white [&_a]:text-slate-400 [&_svg]:text-slate-600"
            />
          </div>

          <div className="max-w-3xl">
            <div className="mb-5 flex flex-wrap gap-2">
              <div className="inline-flex items-center gap-2 rounded-full border border-blue-400/25 bg-blue-500/15 px-4 py-2 backdrop-blur-sm">
                <MapPin className="h-4 w-4 text-blue-400" />
                <span className="text-sm font-medium text-blue-200">
                  {content.profile.citySizeLabel}
                </span>
              </div>
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/25 bg-emerald-500/15 px-4 py-2 backdrop-blur-sm">
                <Thermometer className="h-4 w-4 text-emerald-400" />
                <span className="text-sm font-medium text-emerald-200">
                  {content.profile.climateLabel}
                </span>
              </div>
            </div>

            {(() => {
              const h1Hash = Math.abs(hashCode(`h1-cityInfo-${cityInfo.slug}`))
              const h1Templates = [
                `Attorneys in ${cityInfo.name}`,
                `Find an Attorney in ${cityInfo.name} (${cityInfo.stateCode})`,
                `${cityInfo.name}: Qualified Attorneys for Your Legal Needs`,
                `Attorneys in ${cityInfo.name}, ${cityInfo.stateName}`,
                `${practiceAreas.length} Practice Areas in ${cityInfo.name}`,
              ]
              return (
                <h1 className="mb-5 font-heading text-3xl font-extrabold leading-[1.1] tracking-[-0.025em] md:text-4xl lg:text-5xl">
                  {h1Templates[h1Hash % h1Templates.length]}
                </h1>
              )
            })()}
            <p className="mb-8 max-w-2xl text-lg leading-relaxed text-slate-400">{content.intro}</p>

            {/* Location info */}
            <div className="mb-8 flex flex-wrap gap-4 text-sm">
              <div className="flex items-center gap-2 text-slate-300">
                <MapPin className="h-4 w-4 text-blue-400" />
                <span>{cityRegion}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-300">
                <Building2 className="h-4 w-4 text-blue-400" />
                <span>
                  {cityInfo.stateName} ({cityInfo.stateCode})
                </span>
              </div>
              <div className="flex items-center gap-2 text-slate-300">
                <Users className="h-4 w-4 text-blue-400" />
                <span>{cityInfo.population} residents</span>
              </div>
            </div>

            {/* Trust badges */}
            <div className="flex flex-wrap gap-3">
              <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-2 backdrop-blur">
                <Shield className="h-4 w-4 text-amber-400" />
                <span className="text-sm font-medium">Bar-verified profiles</span>
              </div>
              <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-2 backdrop-blur">
                <Clock className="h-4 w-4 text-amber-400" />
                <span className="text-sm font-medium">Free consultations</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── SERVICES GRID ──────────────────────────────────── */}
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <section className="mb-16">
          <div className="mb-8 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100">
              <Wrench className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h2 className="font-heading text-2xl font-bold tracking-tight text-slate-900">
                Find an Attorney in {cityInfo.name}
              </h2>
              <p className="text-sm text-slate-500">
                {practiceAreas.length} practice areas available
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {orderedServices.map((service) => (
              <Link
                key={service.slug}
                href={`/practice-areas/${service.slug}/${citySlug}`}
                className={`group rounded-xl bg-white p-5 text-center shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${topServiceSlugsSet.has(service.slug) ? 'border-2 border-indigo-200' : 'border border-gray-100'}`}
              >
                {topServiceSlugsSet.has(service.slug) && (
                  <span className="mb-2 inline-block rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-bold text-indigo-600">
                    Top Priority
                  </span>
                )}
                <h3 className="text-sm font-semibold text-slate-800 transition-colors group-hover:text-blue-600">
                  {service.name}
                </h3>
                <p className="mt-1.5 text-xs text-slate-400">in {cityInfo.name}</p>
              </Link>
            ))}
          </div>
        </section>

        {/* ─── NEIGHBORHOODS ──────────────────────────────────── */}
        {cityInfo.neighborhoods && cityInfo.neighborhoods.length > 0 && (
          <section className="mb-16">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100">
                <MapPin className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <h2 className="font-heading text-2xl font-bold tracking-tight text-slate-900">
                  Neighborhoods Served in {cityInfo.name}
                </h2>
                <p className="text-sm text-slate-500">
                  {cityInfo.neighborhoods.length} neighborhoods covered
                </p>
              </div>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-white p-6">
              <div className="flex flex-wrap gap-2.5">
                {getNeighborhoodsByCity(citySlug).map(({ name, slug }) => (
                  <Link
                    key={slug}
                    href={`/cities/${citySlug}/${slug}`}
                    className="rounded-full border border-gray-100 bg-gray-50 px-4 py-2 text-sm text-slate-700 transition-colors hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700"
                  >
                    {name}
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ─── CITY PROFILE ───────────────────────────────────── */}
        <section className="mb-16">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100">
              <Home className="h-5 w-5 text-indigo-600" />
            </div>
            <div>
              <h2 className="font-heading text-2xl font-bold tracking-tight text-slate-900">
                Profile of {cityInfo.name}
              </h2>
              <p className="text-sm text-slate-500">
                {content.profile.citySizeLabel} · {content.profile.climateLabel}
              </p>
            </div>
          </div>
          <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-gray-200 bg-white p-5">
              <div className="mb-2 flex items-center gap-2">
                <Thermometer className="h-4 w-4 text-blue-500" />
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Climate
                </span>
              </div>
              <p className="font-bold text-slate-900">{content.profile.climateLabel}</p>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-5">
              <div className="mb-2 flex items-center gap-2">
                <Home className="h-4 w-4 text-emerald-500" />
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Housing
                </span>
              </div>
              <p className="font-bold text-slate-900">{content.profile.citySizeLabel}</p>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-5">
              <div className="mb-2 flex items-center gap-2">
                <Users className="h-4 w-4 text-violet-500" />
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Population
                </span>
              </div>
              <p className="font-bold text-slate-900">{cityInfo.population} pop.</p>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-5">
              <div className="mb-2 flex items-center gap-2">
                <Building2 className="h-4 w-4 text-amber-500" />
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  State
                </span>
              </div>
              <p className="font-bold text-slate-900">
                {cityInfo.stateName} ({cityInfo.stateCode})
              </p>
            </div>
          </div>

          <div className="mb-4 rounded-xl border border-gray-200 bg-white p-6">
            <h3 className="mb-3 font-semibold text-slate-900">Housing in {cityInfo.name}</h3>
            <p className="text-sm leading-relaxed text-slate-600">
              {content.profile.habitatDescription}
            </p>
          </div>

          <div className="mb-4 rounded-xl border border-gray-200 bg-white p-6">
            <h3 className="mb-3 font-semibold text-slate-900">Urban Context</h3>
            <p className="text-sm leading-relaxed text-slate-600">{content.urbanContext}</p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {content.profile.climaticIssues.slice(0, 4).map((issue, i) => (
              <div
                key={i}
                className="flex items-start gap-2 rounded-lg border border-amber-100 bg-amber-50 p-3"
              >
                <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-500" />
                <span className="text-sm text-amber-800">{issue}</span>
              </div>
            ))}
          </div>
        </section>

        {/* ─── DEMOGRAPHICS / LEGAL MARKET OVERVIEW ──────── */}
        <CityDemographics
          cityName={cityInfo.name}
          stateCode={cityInfo.stateCode}
          stateName={cityInfo.stateName}
          population={cityInfo.population}
          censusData={locationData?.census_data}
        />

        {/* ─── SEO CONTENT: SERVICES & TIPS ─────────────── */}
        <section className="mb-16">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-100">
              <TrendingUp className="h-5 w-5 text-teal-600" />
            </div>
            <h2 className="font-heading text-2xl font-bold tracking-tight text-slate-900">
              Legal Services in {cityInfo.name}
            </h2>
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="rounded-xl border border-gray-200 bg-white p-6">
              <h3 className="mb-3 font-semibold text-slate-900">Priority Practice Areas</h3>
              <p className="text-sm leading-relaxed text-slate-600">{content.priorityServices}</p>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-6">
              <h3 className="mb-3 font-semibold text-slate-900">Tips for {cityInfo.name}</h3>
              <p className="text-sm leading-relaxed text-slate-600">{content.cityAdvice}</p>
            </div>
          </div>
        </section>

        {/* ─── NEARBY CITIES ─────────────────────────────────── */}
        {nearbyCities.length > 0 && (
          <section className="mb-16">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-100">
                <Building2 className="h-5 w-5 text-violet-600" />
              </div>
              <h2 className="font-heading text-xl font-bold tracking-tight text-slate-900">
                Other Cities in {cityInfo.stateName}
              </h2>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
              {nearbyCities.map((v) => (
                <Link
                  key={v.slug}
                  href={`/cities/${v.slug}`}
                  className="group flex items-center gap-2.5 rounded-xl border border-gray-200 bg-white p-3.5 transition-all hover:border-blue-300 hover:shadow-md"
                >
                  <MapPin className="h-4 w-4 flex-shrink-0 text-slate-400 transition-colors group-hover:text-blue-600" />
                  <div className="min-w-0">
                    <span className="block truncate text-sm font-medium text-slate-800 transition-colors group-hover:text-blue-600">
                      {v.name}
                    </span>
                    <span className="text-xs text-slate-400">{v.population} pop.</span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* ─── FAQ SECTION ──────────────────────────────────── */}
        <section className="mb-16">
          <div className="mb-8 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100">
              <HelpCircle className="h-5 w-5 text-amber-600" />
            </div>
            <h2 className="font-heading text-2xl font-bold tracking-tight text-slate-900">
              Frequently Asked Questions
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

      {/* ─── SEO INTERNAL LINKS ─────────────────────────────── */}
      <section className="border-t border-gray-100 bg-white py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="mb-8 font-heading text-xl font-bold tracking-tight text-slate-900">
            See Also
          </h2>
          <div className="grid gap-10 md:grid-cols-3">
            {/* Services in this city */}
            <div>
              <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-900">
                Practice Areas in {cityInfo.name}
              </h3>
              <div className="space-y-2">
                {practiceAreas.map((s) => (
                  <Link
                    key={s.slug}
                    href={`/practice-areas/${s.slug}/${citySlug}`}
                    className="flex items-center gap-2 py-2 text-sm text-slate-600 transition-colors hover:text-blue-600"
                  >
                    <ChevronRight className="h-3 w-3" />
                    {s.name} in {cityInfo.name}
                  </Link>
                ))}
              </div>
              <Link
                href="/practice-areas"
                className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700"
              >
                {practiceAreas.length} practice areas <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            {/* Region cities */}
            <div>
              <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-900">
                Cities in {cityRegion}
              </h3>
              <div className="space-y-2">
                {regionCities.slice(0, 10).map((v) => (
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
                All Cities <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            {/* Geographic navigation */}
            <div>
              <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-900">
                Navigation
              </h3>
              <div className="space-y-2">
                {regionSlug && (
                  <Link
                    href={`/regions/${regionSlug}`}
                    className="flex items-center gap-2 py-2 text-sm text-slate-600 transition-colors hover:text-blue-600"
                  >
                    <ChevronRight className="h-3 w-3" />
                    Region {cityRegion}
                  </Link>
                )}
                <Link
                  href="/states"
                  className="flex items-center gap-2 py-2 text-sm text-slate-600 transition-colors hover:text-blue-600"
                >
                  <ChevronRight className="h-3 w-3" />
                  All States
                </Link>
                <Link
                  href="/regions"
                  className="flex items-center gap-2 py-2 text-sm text-slate-600 transition-colors hover:text-blue-600"
                >
                  <ChevronRight className="h-3 w-3" />
                  All Regions
                </Link>
                <Link
                  href="/cities"
                  className="flex items-center gap-2 py-2 text-sm text-slate-600 transition-colors hover:text-blue-600"
                >
                  <ChevronRight className="h-3 w-3" />
                  All Cities
                </Link>
                <Link
                  href="/quotes"
                  className="flex items-center gap-2 py-2 text-sm text-slate-600 transition-colors hover:text-blue-600"
                >
                  <ChevronRight className="h-3 w-3" />
                  Request a Consultation
                </Link>
                <Link
                  href={`/quotes/family-law/${citySlug}`}
                  className="flex items-center gap-2 py-2 text-sm text-slate-600 transition-colors hover:text-blue-600"
                >
                  <ChevronRight className="h-3 w-3" />
                  Family Law Consultation in {cityInfo.name}
                </Link>
                <Link
                  href={`/quotes/personal-injury/${citySlug}`}
                  className="flex items-center gap-2 py-2 text-sm text-slate-600 transition-colors hover:text-blue-600"
                >
                  <ChevronRight className="h-3 w-3" />
                  Personal Injury Consultation in {cityInfo.name}
                </Link>
                <Link
                  href={`/quotes/criminal-defense/${citySlug}`}
                  className="flex items-center gap-2 py-2 text-sm text-slate-600 transition-colors hover:text-blue-600"
                >
                  <ChevronRight className="h-3 w-3" />
                  Criminal Defense Consultation in {cityInfo.name}
                </Link>
                <Link
                  href={`/quotes/estate-planning/${citySlug}`}
                  className="flex items-center gap-2 py-2 text-sm text-slate-600 transition-colors hover:text-blue-600"
                >
                  <ChevronRight className="h-3 w-3" />
                  Estate Planning Consultation in {cityInfo.name}
                </Link>
              </div>
            </div>
          </div>

          {/* Intent variant links — quotes, reviews, pricing, emergency, issues */}
          <div className="mt-10 grid gap-8 md:grid-cols-2 lg:grid-cols-5">
            <div>
              <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-900">
                Consultations in {cityInfo.name}
              </h3>
              <div className="space-y-1.5">
                {orderedServices.slice(0, 15).map((s) => (
                  <Link
                    key={`quotes-${s.slug}`}
                    href={`/quotes/${s.slug}/${citySlug}`}
                    className="flex items-center gap-2 py-1 text-sm text-slate-600 transition-colors hover:text-blue-600"
                  >
                    <ChevronRight className="h-3 w-3" />
                    {s.name.toLowerCase()} consultation
                  </Link>
                ))}
              </div>
            </div>
            <div>
              <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-900">
                Reviews in {cityInfo.name}
              </h3>
              <div className="space-y-1.5">
                {orderedServices.slice(0, 15).map((s) => (
                  <Link
                    key={`reviews-${s.slug}`}
                    href={`/reviews/${s.slug}/${citySlug}`}
                    className="flex items-center gap-2 py-1 text-sm text-slate-600 transition-colors hover:text-blue-600"
                  >
                    <ChevronRight className="h-3 w-3" />
                    {s.name.toLowerCase()} reviews
                  </Link>
                ))}
              </div>
            </div>
            <div>
              <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-900">
                Fees in {cityInfo.name}
              </h3>
              <div className="space-y-1.5">
                {orderedServices.slice(0, 15).map((s) => (
                  <Link
                    key={`pricing-${s.slug}`}
                    href={`/pricing/${s.slug}/${citySlug}`}
                    className="flex items-center gap-2 py-1 text-sm text-slate-600 transition-colors hover:text-blue-600"
                  >
                    <ChevronRight className="h-3 w-3" />
                    {s.name.toLowerCase()} fees
                  </Link>
                ))}
              </div>
            </div>
            <div>
              <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-900">
                Emergency in {cityInfo.name}
              </h3>
              <div className="space-y-1.5">
                {orderedServices.slice(0, 15).map((s) => (
                  <Link
                    key={`emergency-${s.slug}`}
                    href={`/emergency/${s.slug}/${citySlug}`}
                    className="flex items-center gap-2 py-1 text-sm text-slate-600 transition-colors hover:text-blue-600"
                  >
                    <ChevronRight className="h-3 w-3" />
                    {s.name} emergency
                  </Link>
                ))}
              </div>
            </div>
            <div>
              <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-900">
                Legal Issues in {cityInfo.name}
              </h3>
              <div className="space-y-1.5">
                {problems.slice(0, 15).map((p) => (
                  <Link
                    key={`prob-${p.slug}`}
                    href={`/issues/${p.slug}/${citySlug}`}
                    className="flex items-center gap-2 py-1 text-sm text-slate-600 transition-colors hover:text-orange-600"
                  >
                    <ChevronRight className="h-3 w-3" />
                    {p.name}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
