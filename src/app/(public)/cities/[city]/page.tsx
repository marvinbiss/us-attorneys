import { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { MapPin, Users, Building2, ArrowRight, Shield, Clock, ChevronRight, Wrench, HelpCircle, Thermometer, Home, TrendingUp, AlertTriangle } from 'lucide-react'
import Breadcrumb from '@/components/Breadcrumb'
import JsonLd from '@/components/JsonLd'
import { getPlaceSchema, getBreadcrumbSchema, getFAQSchema } from '@/lib/seo/jsonld'
import { SITE_URL } from '@/lib/seo/config'
import { cities, getCityBySlug, practiceAreas, getRegionSlugByName, getStateByCode, getNeighborhoodsByCity } from '@/lib/data/usa'
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
  const cityInfo = getCityBySlug(citySlug) || await resolveZipToCity(citySlug)
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
      images: [cityImage
        ? { url: cityImage.src, width: 1200, height: 630, alt: cityImage.alt }
        : { url: `${SITE_URL}/opengraph-image`, width: 1200, height: 630, alt: `Attorneys in ${cityInfo.name}` }
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

export default async function VillePage({ params }: PageProps) {
  const { city: citySlug } = await params
  const cityInfo = getCityBySlug(citySlug) || await resolveZipToCity(citySlug)
  if (!cityInfo) notFound()
  const cityRegion = getStateByCode(cityInfo.stateCode)?.region ?? ''

  // Get other cities in the same state
  const nearbyVilles = cities.filter(
    (v) => v.stateCode === cityInfo.stateCode && v.slug !== cityInfo.slug
  )

  // Get other cities in the same region
  const regionVilles = cities.filter(
    (v) => getStateByCode(v.stateCode)?.region === cityRegion && v.slug !== cityInfo.slug
  ).slice(0, 8)

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
    { name: 'Home', url: '/' },
    { name: 'Cities', url: '/cities' },
    { name: cityInfo.name, url: `/cities/${cityInfo.slug}` },
  ])

  const faqSchema = getFAQSchema(content.faqItems)

  return (
    <div className="min-h-screen bg-gray-50">
      <JsonLd data={[placeSchema, breadcrumbSchema, faqSchema]} />

      {/* ─── PREMIUM DARK HERO ──────────────────────────────── */}
      <section className="relative bg-[#0a0f1e] text-white overflow-hidden">
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
          <div className="absolute inset-0" style={{
            background: 'radial-gradient(ellipse 80% 50% at 50% -10%, rgba(37,99,235,0.18) 0%, transparent 60%), radial-gradient(ellipse 60% 60% at 80% 110%, rgba(37,99,235,0.1) 0%, transparent 50%), radial-gradient(ellipse 50% 40% at 10% 90%, rgba(59,130,246,0.06) 0%, transparent 50%)',
          }} />
          <div className="absolute inset-0 opacity-[0.025]" style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
            backgroundSize: '64px 64px',
          }} />
          <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-gray-50 to-transparent" />
        </div>

        <div className="relative max-w-6xl mx-auto px-4 pt-10 pb-28 md:pt-14 md:pb-36">
          {/* Breadcrumb */}
          <div className="mb-10">
            <Breadcrumb
              items={[
                ...(regionSlug ? [{ label: cityRegion, href: `/regions/${regionSlug}` }] : []),
                ...(deptSlug ? [{ label: `${cityInfo.stateName} (${cityInfo.stateCode})`, href: `/states/${deptSlug}` }] : []),
                { label: cityInfo.name },
              ]}
              className="text-slate-400 [&_a]:text-slate-400 [&_a:hover]:text-white [&_svg]:text-slate-600"
            />
          </div>

          <div className="max-w-3xl">
            <div className="flex flex-wrap gap-2 mb-5">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/15 backdrop-blur-sm rounded-full border border-blue-400/25">
                <MapPin className="w-4 h-4 text-blue-400" />
                <span className="text-sm font-medium text-blue-200">{content.profile.citySizeLabel}</span>
              </div>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/15 backdrop-blur-sm rounded-full border border-emerald-400/25">
                <Thermometer className="w-4 h-4 text-emerald-400" />
                <span className="text-sm font-medium text-emerald-200">{content.profile.climateLabel}</span>
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
                <h1 className="font-heading text-3xl md:text-4xl lg:text-5xl font-extrabold mb-5 tracking-[-0.025em] leading-[1.1]">
                  {h1Templates[h1Hash % h1Templates.length]}
                </h1>
              )
            })()}
            <p className="text-lg text-slate-400 max-w-2xl leading-relaxed mb-8">
              {content.intro}
            </p>

            {/* Location info */}
            <div className="flex flex-wrap gap-4 mb-8 text-sm">
              <div className="flex items-center gap-2 text-slate-300">
                <MapPin className="w-4 h-4 text-blue-400" />
                <span>{cityRegion}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-300">
                <Building2 className="w-4 h-4 text-blue-400" />
                <span>{cityInfo.stateName} ({cityInfo.stateCode})</span>
              </div>
              <div className="flex items-center gap-2 text-slate-300">
                <Users className="w-4 h-4 text-blue-400" />
                <span>{cityInfo.population} residents</span>
              </div>
            </div>

            {/* Trust badges */}
            <div className="flex flex-wrap gap-3">
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur px-4 py-2 rounded-full border border-white/10">
                <Shield className="w-4 h-4 text-amber-400" /><span className="text-sm font-medium">Bar-verified profiles</span>
              </div>
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur px-4 py-2 rounded-full border border-white/10">
                <Clock className="w-4 h-4 text-amber-400" /><span className="text-sm font-medium">Free consultations</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── SERVICES GRID ──────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <section className="mb-16">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
              <Wrench className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="font-heading text-2xl font-bold text-slate-900 tracking-tight">
                Find an Attorney in {cityInfo.name}
              </h2>
              <p className="text-sm text-slate-500">{practiceAreas.length} practice areas available</p>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {orderedServices.map((service) => (
              <Link
                key={service.slug}
                href={`/practice-areas/${service.slug}/${citySlug}`}
                className={`bg-white rounded-xl shadow-sm p-5 text-center hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group ${topServiceSlugsSet.has(service.slug) ? 'border-2 border-indigo-200' : 'border border-gray-100'}`}
              >
                {topServiceSlugsSet.has(service.slug) && (
                  <span className="inline-block text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full mb-2">Top Priority</span>
                )}
                <h3 className="font-semibold text-slate-800 group-hover:text-blue-600 transition-colors text-sm">{service.name}</h3>
                <p className="text-xs text-slate-400 mt-1.5">in {cityInfo.name}</p>
              </Link>
            ))}
          </div>
        </section>

        {/* ─── QUARTIERS ────────────────────────────────────── */}
        {cityInfo.neighborhoods && cityInfo.neighborhoods.length > 0 && (
          <section className="mb-16">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                <MapPin className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <h2 className="font-heading text-2xl font-bold text-slate-900 tracking-tight">
                  Neighborhoods Served in {cityInfo.name}
                </h2>
                <p className="text-sm text-slate-500">{cityInfo.neighborhoods.length} neighborhoods covered</p>
              </div>
            </div>
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <div className="flex flex-wrap gap-2.5">
                {getNeighborhoodsByCity(citySlug).map(({ name, slug }) => (
                  <Link key={slug} href={`/cities/${citySlug}/${slug}`} className="bg-gray-50 text-slate-700 px-4 py-2 rounded-full text-sm border border-gray-100 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 transition-colors">
                    {name}
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ─── PROFIL DE LA VILLE ─────────────────────────────── */}
        <section className="mb-16">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
              <Home className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h2 className="font-heading text-2xl font-bold text-slate-900 tracking-tight">
                Profile of {cityInfo.name}
              </h2>
              <p className="text-sm text-slate-500">{content.profile.citySizeLabel} · {content.profile.climateLabel}</p>
            </div>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center gap-2 mb-2">
                <Thermometer className="w-4 h-4 text-blue-500" />
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Climate</span>
              </div>
              <p className="font-bold text-slate-900">{content.profile.climateLabel}</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center gap-2 mb-2">
                <Home className="w-4 h-4 text-emerald-500" />
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Housing</span>
              </div>
              <p className="font-bold text-slate-900">{content.profile.citySizeLabel}</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-4 h-4 text-violet-500" />
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Population</span>
              </div>
              <p className="font-bold text-slate-900">{cityInfo.population} pop.</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center gap-2 mb-2">
                <Building2 className="w-4 h-4 text-amber-500" />
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">State</span>
              </div>
              <p className="font-bold text-slate-900">{cityInfo.stateName} ({cityInfo.stateCode})</p>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6 mb-4">
            <h3 className="font-semibold text-slate-900 mb-3">Housing in {cityInfo.name}</h3>
            <p className="text-sm text-slate-600 leading-relaxed">{content.profile.habitatDescription}</p>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6 mb-4">
            <h3 className="font-semibold text-slate-900 mb-3">Urban Context</h3>
            <p className="text-sm text-slate-600 leading-relaxed">{content.urbanContext}</p>
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            {content.profile.climaticIssues.slice(0, 4).map((issue, i) => (
              <div key={i} className="flex items-start gap-2 bg-amber-50 rounded-lg border border-amber-100 p-3">
                <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
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
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-teal-100 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-teal-600" />
            </div>
            <h2 className="font-heading text-2xl font-bold text-slate-900 tracking-tight">
              Legal Services in {cityInfo.name}
            </h2>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="font-semibold text-slate-900 mb-3">Priority Practice Areas</h3>
              <p className="text-sm text-slate-600 leading-relaxed">{content.priorityServices}</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="font-semibold text-slate-900 mb-3">Tips for {cityInfo.name}</h3>
              <p className="text-sm text-slate-600 leading-relaxed">{content.cityAdvice}</p>
            </div>
          </div>
        </section>

        {/* ─── NEARBY VILLES ────────────────────────────────── */}
        {nearbyVilles.length > 0 && (
          <section className="mb-16">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-violet-100 rounded-xl flex items-center justify-center">
                <Building2 className="w-5 h-5 text-violet-600" />
              </div>
              <h2 className="font-heading text-xl font-bold text-slate-900 tracking-tight">
                Other Cities in {cityInfo.stateName}
              </h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {nearbyVilles.map((v) => (
                <Link key={v.slug} href={`/cities/${v.slug}`} className="flex items-center gap-2.5 bg-white rounded-xl border border-gray-200 p-3.5 hover:border-blue-300 hover:shadow-md transition-all group">
                  <MapPin className="w-4 h-4 text-slate-400 group-hover:text-blue-600 flex-shrink-0 transition-colors" />
                  <div className="min-w-0">
                    <span className="block text-sm font-medium text-slate-800 group-hover:text-blue-600 truncate transition-colors">{v.name}</span>
                    <span className="text-xs text-slate-400">{v.population} pop.</span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* ─── FAQ SECTION ──────────────────────────────────── */}
        <section className="mb-16">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
              <HelpCircle className="w-5 h-5 text-amber-600" />
            </div>
            <h2 className="font-heading text-2xl font-bold text-slate-900 tracking-tight">
              Frequently Asked Questions
            </h2>
          </div>
          <div className="space-y-4">
            {content.faqItems.map((faq, i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="font-semibold text-slate-900 mb-2">{faq.question}</h3>
                <p className="text-sm text-slate-600 leading-relaxed">{faq.answer}</p>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* ─── SEO INTERNAL LINKS ─────────────────────────────── */}
      <section className="py-16 bg-white border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="font-heading text-xl font-bold text-slate-900 mb-8 tracking-tight">
            See Also
          </h2>
          <div className="grid md:grid-cols-3 gap-10">
            {/* Services in this city */}
            <div>
              <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-4">Practice Areas in {cityInfo.name}</h3>
              <div className="space-y-2">
                {practiceAreas.map((s) => (
                  <Link key={s.slug} href={`/practice-areas/${s.slug}/${citySlug}`} className="flex items-center gap-2 text-sm text-slate-600 hover:text-blue-600 py-2 transition-colors">
                    <ChevronRight className="w-3 h-3" />
                    {s.name} in {cityInfo.name}
                  </Link>
                ))}
              </div>
              <Link href="/services" className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 text-sm font-medium mt-3">
                {practiceAreas.length} practice areas <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {/* Region cities */}
            <div>
              <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-4">Cities in {cityRegion}</h3>
              <div className="space-y-2">
                {regionVilles.slice(0, 10).map((v) => (
                  <Link key={v.slug} href={`/cities/${v.slug}`} className="flex items-center gap-2 text-sm text-slate-600 hover:text-blue-600 py-2 transition-colors">
                    <ChevronRight className="w-3 h-3" />
                    Attorneys in {v.name}
                  </Link>
                ))}
              </div>
              <Link href="/cities" className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 text-sm font-medium mt-3">
                All Cities <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {/* Geographic navigation */}
            <div>
              <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-4">Navigation</h3>
              <div className="space-y-2">
                {regionSlug && (
                  <Link href={`/regions/${regionSlug}`} className="flex items-center gap-2 text-sm text-slate-600 hover:text-blue-600 py-2 transition-colors">
                    <ChevronRight className="w-3 h-3" />
                    Region {cityRegion}
                  </Link>
                )}
                <Link href="/states" className="flex items-center gap-2 text-sm text-slate-600 hover:text-blue-600 py-2 transition-colors">
                  <ChevronRight className="w-3 h-3" />
                  All States
                </Link>
                <Link href="/regions" className="flex items-center gap-2 text-sm text-slate-600 hover:text-blue-600 py-2 transition-colors">
                  <ChevronRight className="w-3 h-3" />
                  All Regions
                </Link>
                <Link href="/cities" className="flex items-center gap-2 text-sm text-slate-600 hover:text-blue-600 py-2 transition-colors">
                  <ChevronRight className="w-3 h-3" />
                  All Cities
                </Link>
                <Link href="/quotes" className="flex items-center gap-2 text-sm text-slate-600 hover:text-blue-600 py-2 transition-colors">
                  <ChevronRight className="w-3 h-3" />
                  Request a Consultation
                </Link>
                <Link href={`/quotes/family-law/${citySlug}`} className="flex items-center gap-2 text-sm text-slate-600 hover:text-blue-600 py-2 transition-colors">
                  <ChevronRight className="w-3 h-3" />
                  Family Law Consultation in {cityInfo.name}
                </Link>
                <Link href={`/quotes/personal-injury/${citySlug}`} className="flex items-center gap-2 text-sm text-slate-600 hover:text-blue-600 py-2 transition-colors">
                  <ChevronRight className="w-3 h-3" />
                  Personal Injury Consultation in {cityInfo.name}
                </Link>
                <Link href={`/quotes/criminal-defense/${citySlug}`} className="flex items-center gap-2 text-sm text-slate-600 hover:text-blue-600 py-2 transition-colors">
                  <ChevronRight className="w-3 h-3" />
                  Criminal Defense Consultation in {cityInfo.name}
                </Link>
                <Link href={`/quotes/estate-planning/${citySlug}`} className="flex items-center gap-2 text-sm text-slate-600 hover:text-blue-600 py-2 transition-colors">
                  <ChevronRight className="w-3 h-3" />
                  Estate Planning Consultation in {cityInfo.name}
                </Link>
              </div>
            </div>
          </div>

          {/* Intent variant links — quotes, reviews, pricing, emergency, issues */}
          <div className="mt-10 grid md:grid-cols-2 lg:grid-cols-5 gap-8">
            <div>
              <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-4">Consultations in {cityInfo.name}</h3>
              <div className="space-y-1.5">
                {orderedServices.slice(0, 15).map((s) => (
                  <Link key={`quotes-${s.slug}`} href={`/quotes/${s.slug}/${citySlug}`} className="flex items-center gap-2 text-sm text-slate-600 hover:text-blue-600 py-1 transition-colors">
                    <ChevronRight className="w-3 h-3" />
                    {s.name.toLowerCase()} consultation
                  </Link>
                ))}
              </div>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-4">Reviews in {cityInfo.name}</h3>
              <div className="space-y-1.5">
                {orderedServices.slice(0, 15).map((s) => (
                  <Link key={`reviews-${s.slug}`} href={`/reviews/${s.slug}/${citySlug}`} className="flex items-center gap-2 text-sm text-slate-600 hover:text-blue-600 py-1 transition-colors">
                    <ChevronRight className="w-3 h-3" />
                    {s.name.toLowerCase()} reviews
                  </Link>
                ))}
              </div>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-4">Fees in {cityInfo.name}</h3>
              <div className="space-y-1.5">
                {orderedServices.slice(0, 15).map((s) => (
                  <Link key={`pricing-${s.slug}`} href={`/pricing/${s.slug}/${citySlug}`} className="flex items-center gap-2 text-sm text-slate-600 hover:text-blue-600 py-1 transition-colors">
                    <ChevronRight className="w-3 h-3" />
                    {s.name.toLowerCase()} fees
                  </Link>
                ))}
              </div>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-4">Emergency in {cityInfo.name}</h3>
              <div className="space-y-1.5">
                {orderedServices.slice(0, 15).map((s) => (
                  <Link key={`emergency-${s.slug}`} href={`/emergency/${s.slug}/${citySlug}`} className="flex items-center gap-2 text-sm text-slate-600 hover:text-blue-600 py-1 transition-colors">
                    <ChevronRight className="w-3 h-3" />
                    {s.name} emergency
                  </Link>
                ))}
              </div>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-4">Legal Issues in {cityInfo.name}</h3>
              <div className="space-y-1.5">
                {problems.slice(0, 15).map((p) => (
                  <Link key={`prob-${p.slug}`} href={`/issues/${p.slug}/${citySlug}`} className="flex items-center gap-2 text-sm text-slate-600 hover:text-orange-600 py-1 transition-colors">
                    <ChevronRight className="w-3 h-3" />
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
