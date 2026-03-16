import { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { MapPin, Users, ArrowRight, Shield, Clock, Building2, ChevronRight, Wrench, HelpCircle, Globe } from 'lucide-react'
import Breadcrumb from '@/components/Breadcrumb'
import JsonLd from '@/components/JsonLd'
import { getBreadcrumbSchema, getCollectionPageSchema, getFAQSchema } from '@/lib/seo/jsonld'
import { SITE_URL } from '@/lib/seo/config'
import { usRegions, getRegionBySlug, practiceAreas as allServices, getCitiesByState } from '@/lib/data/usa'
import { getAttorneyCountByRegion, formatAttorneyCount } from '@/lib/data/stats'
import { getRegionImage } from '@/lib/data/images'
import { generateRegionContent, hashCode } from '@/lib/seo/location-content'
import { Thermometer, TrendingUp, AlertTriangle, Mountain } from 'lucide-react'
import problems from '@/lib/data/problems'

export function generateStaticParams() {
  return usRegions.map((region) => ({ region: region.slug }))
}

export const dynamicParams = false
export const revalidate = 86400

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
      images: [{ url: regionImage.src, width: 1200, height: 630, alt: `Attorneys in ${region.name}` }],
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
    region.states.map(st => [st.code, getCitiesByState(st.code)])
  )
  const allCities = region.states.flatMap(st => stateCitiesMap[st.code])
  const cityCount = allCities.length
  const content = generateRegionContent(region, cityCount)
  const regionArtisanCount = await getAttorneyCountByRegion(region.name)

  // Reorder services by climate-based priority
  const topServiceSlugsSet = new Set(content.profile.topServiceSlugs.slice(0, 5))
  const orderedServices = [...allServices].sort((a, b) => {
    const ai = content.profile.topServiceSlugs.indexOf(a.slug)
    const bi = content.profile.topServiceSlugs.indexOf(b.slug)
    return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi)
  })

  // Other regions
  const otherRegions = usRegions.filter(r => r.slug !== regionSlug)

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
      <section className="relative bg-[#0a0f1e] text-white overflow-hidden">
        {/* Background effects */}
        <div className="absolute inset-0">
          <div className="absolute inset-0" style={{
            background: 'radial-gradient(ellipse 80% 50% at 50% -10%, rgba(51,65,85,0.30) 0%, transparent 60%), radial-gradient(ellipse 60% 60% at 80% 110%, rgba(71,85,105,0.15) 0%, transparent 50%), radial-gradient(ellipse 50% 40% at 10% 90%, rgba(100,116,139,0.08) 0%, transparent 50%)',
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
                { label: 'Regions', href: '/regions' },
                { label: region.name },
              ]}
              className="text-slate-400 [&_a]:text-slate-400 [&_a:hover]:text-white [&_svg]:text-slate-600"
            />
          </div>

          <div className="max-w-3xl">
            <div className="flex flex-wrap gap-3 mb-5">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-500/15 backdrop-blur-sm rounded-full border border-slate-400/25">
                <Globe className="w-4 h-4 text-slate-300" />
                <span className="text-sm font-medium text-slate-200">Region</span>
              </div>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-500/15 backdrop-blur-sm rounded-full border border-cyan-400/25">
                <Thermometer className="w-4 h-4 text-cyan-400" />
                <span className="text-sm font-medium text-cyan-200">{content.profile.climateLabel}</span>
              </div>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/15 backdrop-blur-sm rounded-full border border-emerald-400/25">
                <Mountain className="w-4 h-4 text-emerald-400" />
                <span className="text-sm font-medium text-emerald-200">{content.profile.geoLabel}</span>
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
                <h1 className="font-heading text-3xl md:text-4xl lg:text-5xl font-extrabold mb-5 tracking-[-0.025em] leading-[1.1]">
                  {h1Templates[h1Hash % h1Templates.length]}
                </h1>
              )
            })()}
            <p className="text-lg text-slate-400 max-w-2xl leading-relaxed mb-8">
              {content.profile.climateLabel}, {content.profile.geoLabel.toLowerCase()}, {content.profile.economyLabel.toLowerCase()}. {allServices.length} practice areas available.
            </p>

            {/* Stats badges */}
            <div className="flex flex-wrap gap-4 mb-8 text-sm">
              {regionArtisanCount > 0 && (
                <div className="flex items-center gap-2 text-slate-300">
                  <Users className="w-4 h-4 text-amber-400" />
                  <span>{formatAttorneyCount(regionArtisanCount)} attorney{regionArtisanCount > 1 ? 's' : ''}</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-slate-300">
                <Building2 className="w-4 h-4 text-slate-400" />
                <span>{stateCount} state{stateCount > 1 ? 's' : ''}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-300">
                <MapPin className="w-4 h-4 text-slate-400" />
                <span>{cityCount} cit{cityCount > 1 ? 'ies' : 'y'} covered</span>
              </div>
              <div className="flex items-center gap-2 text-slate-300">
                <Users className="w-4 h-4 text-slate-400" />
                <span>{allServices.length} practice areas</span>
              </div>
            </div>

            {/* Trust badges */}
            <div className="flex flex-wrap gap-3">
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur px-4 py-2 rounded-full border border-white/10">
                <Shield className="w-4 h-4 text-amber-400" /><span className="text-sm font-medium">Bar-verified attorneys</span>
              </div>
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur px-4 py-2 rounded-full border border-white/10">
                <Clock className="w-4 h-4 text-amber-400" /><span className="text-sm font-medium">Free consultations</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── QUICK SERVICES BAR ─────────────────────────────── */}
      <section className="py-6 bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-sm text-slate-500 font-medium">Top practice areas:</span>
            {orderedServices.map((service) => (
              <Link
                key={service.slug}
                href={`/regions/${regionSlug}/${service.slug}`}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors border ${topServiceSlugsSet.has(service.slug) ? 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100' : 'bg-gray-50 text-slate-700 border-gray-200 hover:bg-slate-100'}`}
              >
                {service.name} en {region.name}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* ─── PROFIL RÉGIONAL ──────────────────────────────── */}
        <section className="mb-16">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-cyan-100 rounded-xl flex items-center justify-center">
              <Thermometer className="w-5 h-5 text-cyan-600" />
            </div>
            <div>
              <h2 className="font-heading text-2xl font-bold text-slate-900 tracking-tight">
                {region.name} region profile
              </h2>
              <p className="text-sm text-slate-500">{content.profile.climateLabel} · {content.profile.geoLabel}</p>
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 p-8">
            <p className="text-slate-700 leading-relaxed mb-6">{content.intro}</p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="bg-cyan-50 rounded-xl p-4">
                <div className="text-xs font-semibold text-cyan-700 uppercase tracking-wider mb-1">Climate</div>
                <div className="text-sm text-slate-800 font-medium">{content.profile.climateLabel}</div>
              </div>
              <div className="bg-emerald-50 rounded-xl p-4">
                <div className="text-xs font-semibold text-emerald-700 uppercase tracking-wider mb-1">Geography</div>
                <div className="text-sm text-slate-800 font-medium">{content.profile.geoLabel}</div>
              </div>
              <div className="bg-violet-50 rounded-xl p-4">
                <div className="text-xs font-semibold text-violet-700 uppercase tracking-wider mb-1">Economy</div>
                <div className="text-sm text-slate-800 font-medium">{content.profile.economyLabel}</div>
              </div>
              <div className="bg-amber-50 rounded-xl p-4">
                <div className="text-xs font-semibold text-amber-700 uppercase tracking-wider mb-1">Coverage</div>
                <div className="text-sm text-slate-800 font-medium">
                  {regionArtisanCount > 0 ? `${formatAttorneyCount(regionArtisanCount)} attorneys · ` : ''}{stateCount} states · {cityCount} cities
                </div>
              </div>
            </div>
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-3 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                Key characteristics
              </h3>
              <div className="grid sm:grid-cols-2 gap-2">
                {content.profile.keyFacts.map((fact, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm text-slate-600">
                    <span className="text-amber-500 mt-0.5">•</span>
                    {fact}
                  </div>
                ))}
              </div>
            </div>
            <p className="text-slate-700 leading-relaxed">{content.regionalContext}</p>
          </div>
        </section>

        {/* ─── SEO CONTENT ────────────────────────────────────── */}
        <section className="mb-16">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-blue-600" />
            </div>
            <h2 className="font-heading text-2xl font-bold text-slate-900 tracking-tight">
              Legal services in {region.name}
            </h2>
          </div>
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-gray-200 p-8">
              <h3 className="font-heading text-lg font-bold text-slate-900 mb-4">Top practice areas</h3>
              <p className="text-slate-700 leading-relaxed">{content.priorityServices}</p>
            </div>
            <div className="bg-white rounded-2xl border border-gray-200 p-8">
              <h3 className="font-heading text-lg font-bold text-slate-900 mb-4">Tips for finding the right attorney</h3>
              <p className="text-slate-700 leading-relaxed">{content.regionAdvice}</p>
            </div>
          </div>
        </section>

        {/* ─── DEPARTMENTS ──────────────────────────────────── */}
        <section className="mb-16">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center">
              <Building2 className="w-5 h-5 text-slate-600" />
            </div>
            <div>
              <h2 className="font-heading text-2xl font-bold text-slate-900 tracking-tight">
                States in the {region.name} region
              </h2>
              <p className="text-sm text-slate-500">{stateCount} state{stateCount > 1 ? 's' : ''}</p>
            </div>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {region.states.map((st) => (
              <Link
                key={st.code}
                href={`/states/${st.slug}`}
                className="bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-lg hover:border-slate-400 hover:-translate-y-0.5 transition-all duration-300 group"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl flex items-center justify-center group-hover:from-slate-100 group-hover:to-slate-200 transition-colors">
                      <span className="text-slate-700 font-bold text-sm">{st.code}</span>
                    </div>
                    <div>
                      <h3 className="font-heading text-base font-bold text-slate-900 group-hover:text-slate-700 transition-colors">{st.name}</h3>
                      <span className="text-xs text-slate-400">{stateCitiesMap[st.code].length} cit{stateCitiesMap[st.code].length > 1 ? 'ies' : 'y'}</span>
                    </div>
                  </div>
                  <ArrowRight className="w-5 h-5 text-slate-300 group-hover:text-slate-600 group-hover:translate-x-0.5 transition-all" />
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {stateCitiesMap[st.code].slice(0, 4).map((city) => (
                    <span key={city.slug} className="text-xs bg-gray-50 text-slate-500 px-2.5 py-1 rounded-full group-hover:bg-slate-100 group-hover:text-slate-700 transition-colors">
                      {city.name}
                    </span>
                  ))}
                  {stateCitiesMap[st.code].length > 4 && (
                    <span className="text-xs text-slate-400 px-2 py-1">+{stateCitiesMap[st.code].length - 4}</span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* ─── SERVICES BY CITY ─────────────────────────────── */}
        <section className="mb-16">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
              <Wrench className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h2 className="font-heading text-2xl font-bold text-slate-900 tracking-tight">
                Practice areas by city in {region.name}
              </h2>
              <p className="text-sm text-slate-500">Quick access to attorneys by city</p>
            </div>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {allCities.slice(0, 12).map((city) => (
              <div key={city.slug} className="bg-white rounded-2xl border border-gray-200 p-6">
                <h3 className="font-heading font-semibold text-slate-900 mb-4">Attorneys in {city.name}</h3>
                <div className="flex flex-wrap gap-2">
                  {allServices.map((service) => (
                    <Link
                      key={`${service.slug}-${city.slug}`}
                      href={`/practice-areas/${service.slug}/${city.slug}`}
                      className="text-sm text-slate-600 hover:text-blue-600 hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-colors border border-transparent hover:border-blue-100"
                    >
                      {service.name}
                    </Link>
                  ))}
                </div>
                <Link href={`/cities/${city.slug}`} className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 text-sm font-medium mt-4">
                  All attorneys <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            ))}
          </div>
        </section>

        {/* ─── OTHER REGIONS ────────────────────────────────── */}
        <section className="mb-16">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-violet-100 rounded-xl flex items-center justify-center">
              <Globe className="w-5 h-5 text-violet-600" />
            </div>
            <h2 className="font-heading text-xl font-bold text-slate-900 tracking-tight">
              Other regions
            </h2>
          </div>
          <div className="flex flex-wrap gap-3">
            {otherRegions.slice(0, 12).map((r) => (
              <Link key={r.slug} href={`/regions/${r.slug}`} className="bg-white border border-gray-200 hover:bg-slate-50 hover:border-slate-300 text-slate-700 hover:text-slate-900 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors">
                {r.name}
              </Link>
            ))}
          </div>
        </section>

        {/* ─── FAQ ───────────────────────────────────────────── */}
        <section className="mb-16">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
              <HelpCircle className="w-5 h-5 text-amber-600" />
            </div>
            <h2 className="font-heading text-2xl font-bold text-slate-900 tracking-tight">
              Frequently asked questions
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

      {/* ─── CTA ────────────────────────────────────────────── */}
      <section className="relative bg-[#0a0f1e] overflow-hidden">
        <div className="absolute inset-0" style={{
          background: 'radial-gradient(ellipse 80% 50% at 50% 50%, rgba(51,65,85,0.15) 0%, transparent 60%)',
        }} />
        <div className="relative max-w-4xl mx-auto px-4 py-16 md:py-20 text-center">
          <h2 className="font-heading text-2xl md:text-3xl font-bold text-white mb-4 tracking-tight">
            Need an attorney in {region.name}?
          </h2>
          <p className="text-slate-400 mb-8 max-w-lg mx-auto">
            Get up to 3 free consultations from qualified attorneys.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/quotes" className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 text-white font-semibold px-8 py-3.5 rounded-xl shadow-lg shadow-amber-500/25 hover:shadow-xl hover:shadow-amber-500/35 hover:-translate-y-0.5 transition-all duration-300">
              Get a free consultation
            </Link>
            <Link href="/services" className="inline-flex items-center gap-2 text-slate-300 hover:text-white font-medium transition-colors">
              Browse practice areas <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ─── SEO INTERNAL LINKS ─────────────────────────────── */}
      <section className="py-16 bg-white border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="font-heading text-xl font-bold text-slate-900 mb-8 tracking-tight">
            See also
          </h2>
          <div className="grid md:grid-cols-3 gap-10">
            {/* Services */}
            <div>
              <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-4">Services en {region.name}</h3>
              <div className="space-y-2">
                {allServices.slice(0, 8).map((s) => (
                  <Link key={s.slug} href={`/regions/${regionSlug}/${s.slug}`} className="flex items-center gap-2 text-sm text-slate-600 hover:text-blue-600 py-2 transition-colors">
                    <ChevronRight className="w-3 h-3" />
                    {s.name} en {region.name}
                  </Link>
                ))}
              </div>
              <Link href="/services" className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 text-sm font-medium mt-3">
                All practice areas <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {/* Other regions */}
            <div>
              <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-4">Other regions</h3>
              <div className="space-y-2">
                {otherRegions.slice(0, 6).map((r) => (
                  <Link key={r.slug} href={`/regions/${r.slug}`} className="flex items-center gap-2 text-sm text-slate-600 hover:text-blue-600 py-2 transition-colors">
                    <ChevronRight className="w-3 h-3" />
                    Attorneys in {r.name}
                  </Link>
                ))}
              </div>
              <Link href="/regions" className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 text-sm font-medium mt-3">
                All regions <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {/* Cities in this region */}
            <div>
              <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-4">Villes en {region.name}</h3>
              <div className="space-y-2">
                {allCities.slice(0, 6).map((city) => (
                  <Link key={city.slug} href={`/cities/${city.slug}`} className="flex items-center gap-2 text-sm text-slate-600 hover:text-blue-600 py-2 transition-colors">
                    <ChevronRight className="w-3 h-3" />
                    Attorneys in {city.name}
                  </Link>
                ))}
              </div>
              <Link href="/cities" className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 text-sm font-medium mt-3">
                All cities <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* Intent variant links -- quotes, reviews, pricing */}
          <div className="mt-10 grid md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-4">Consultations in {region.name}</h3>
              <div className="space-y-1.5">
                {allCities.slice(0, 6).flatMap((city) =>
                  allServices.slice(0, 5).map((s) => (
                    <Link key={`devis-${s.slug}-${city.slug}`} href={`/quotes/${s.slug}/${city.slug}`} className="flex items-center gap-2 text-sm text-slate-600 hover:text-blue-600 py-1 transition-colors">
                      <ChevronRight className="w-3 h-3" />
                      {s.name} consultation in {city.name}
                    </Link>
                  ))
                )}
              </div>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-4">Reviews in {region.name}</h3>
              <div className="space-y-1.5">
                {allCities.slice(0, 6).flatMap((city) =>
                  allServices.slice(0, 5).map((s) => (
                    <Link key={`avis-${s.slug}-${city.slug}`} href={`/reviews/${s.slug}/${city.slug}`} className="flex items-center gap-2 text-sm text-slate-600 hover:text-blue-600 py-1 transition-colors">
                      <ChevronRight className="w-3 h-3" />
                      {s.name} reviews in {city.name}
                    </Link>
                  ))
                )}
              </div>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-4">Pricing in {region.name}</h3>
              <div className="space-y-1.5">
                {allCities.slice(0, 6).flatMap((city) =>
                  allServices.slice(0, 5).map((s) => (
                    <Link key={`tarifs-${s.slug}-${city.slug}`} href={`/pricing/${s.slug}/${city.slug}`} className="flex items-center gap-2 text-sm text-slate-600 hover:text-blue-600 py-1 transition-colors">
                      <ChevronRight className="w-3 h-3" />
                      {s.name} pricing in {city.name}
                    </Link>
                  ))
                )}
              </div>
            </div>
          </div>
          <div className="mt-8">
            <h3 className="text-sm font-semibold text-red-700 uppercase tracking-wider mb-4">Emergency services in {region.name}</h3>
            <div className="flex flex-wrap gap-2">
              {allCities.slice(0, 6).flatMap((city) =>
                allServices.slice(0, 5).map((s) => (
                  <Link key={`urgence-${s.slug}-${city.slug}`} href={`/emergency/${s.slug}/${city.slug}`} className="inline-flex items-center gap-1.5 bg-red-50 text-red-700 hover:bg-red-100 hover:text-red-800 px-3 py-1.5 rounded-lg text-sm transition-colors border border-red-100 hover:border-red-200">
                    Emergency {s.name.toLowerCase()} in {city.name}
                  </Link>
                ))
              )}
            </div>
          </div>
          <div className="mt-8">
            <h3 className="text-sm font-semibold text-orange-700 uppercase tracking-wider mb-4">Common issues in {region.name}</h3>
            <div className="flex flex-wrap gap-2">
              {allCities.slice(0, 4).flatMap((city) =>
                problems.slice(0, 6).map((p) => (
                  <Link key={`prob-${p.slug}-${city.slug}`} href={`/issues/${p.slug}/${city.slug}`} className="inline-flex items-center gap-1.5 bg-orange-50 text-orange-700 hover:bg-orange-100 hover:text-orange-800 px-3 py-1.5 rounded-lg text-sm transition-colors border border-orange-100 hover:border-orange-200">
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
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-slate-50 rounded-2xl border border-slate-200 p-6">
              <h3 className="text-sm font-semibold text-slate-700 mb-2">Editorial methodology</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Geographic and economic profiles are regional estimates. Data comes from public sources. US Attorneys is an independent directory — we do not provide legal services or guarantee outcomes.
              </p>
            </div>
          </div>
        </section>

      {/* Confiance & Sécurité */}
      <section className="py-8 border-t">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Trust & Safety</h2>
          <div className="flex flex-wrap gap-4">
            <Link href="/verification-process" className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1.5">
              Verification process
            </Link>
            <Link href="/review-policy" className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1.5">
              Review policy
            </Link>
            <Link href="/mediation" className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1.5">
              Mediation
            </Link>
            <Link href="/terms" className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1.5">
              Terms of service
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
