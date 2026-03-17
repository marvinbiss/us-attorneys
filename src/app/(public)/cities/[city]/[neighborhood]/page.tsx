import { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { MapPin, Users, Building2, ArrowRight, Shield, Clock, ChevronRight, Wrench, HelpCircle } from 'lucide-react'
import Breadcrumb from '@/components/Breadcrumb'
import JsonLd from '@/components/JsonLd'
import { getBreadcrumbSchema, getCollectionPageSchema, getFAQSchema } from '@/lib/seo/jsonld'
import { SITE_URL } from '@/lib/seo/config'
import { cities, practiceAreas, getNeighborhoodBySlug, getNeighborhoodsByCity, getNearbyCities, getRegionSlugByName, getStateByCode } from '@/lib/data/usa'
import { getCityImage, BLUR_PLACEHOLDER } from '@/lib/data/images'
import { generateNeighborhoodContent, hashCode } from '@/lib/seo/location-content'
import { REVALIDATE } from '@/lib/cache'

// 1 seed page — ISR 24h handles the rest (dynamicParams = true)
const TOP_CITIES = 1
export function generateStaticParams() {
  return cities.slice(0, TOP_CITIES).flatMap(v =>
    getNeighborhoodsByCity(v.slug).map(q => ({ city: v.slug, neighborhood: q.slug }))
  )
}

export const dynamicParams = true
export const revalidate = REVALIDATE.locations

interface PageProps {
  params: Promise<{ city: string; neighborhood: string }>
}

function truncateTitle(title: string, maxLen = 42): string {
  if (title.length <= maxLen) return title
  return title.slice(0, maxLen - 1).replace(/\s+\S*$/, '') + '…'
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { city: villeSlug, neighborhood: quartierSlug } = await params
  const result = getNeighborhoodBySlug(villeSlug, quartierSlug)
  if (!result) return { title: 'Neighborhood Not Found' }

  const { city, neighborhoodName } = result
  const metaContent = generateNeighborhoodContent(city, neighborhoodName)
  const cityImage = getCityImage(villeSlug)

  const titleHash = Math.abs(hashCode(`title-quartier-${villeSlug}-${quartierSlug}`))
  const titleTemplates = [
    `Attorneys in ${neighborhoodName}, ${city.name}`,
    `${neighborhoodName} (${city.name}) — Attorneys`,
    `Find an Attorney in ${neighborhoodName}`,
    `${neighborhoodName}, ${city.name}: Free Consultation`,
    `Qualified Attorneys — ${neighborhoodName}`,
  ]
  const title = truncateTitle(titleTemplates[titleHash % titleTemplates.length])

  const descHash = Math.abs(hashCode(`desc-quartier-${villeSlug}-${quartierSlug}`))
  const descTemplates = [
    `Find a qualified attorney in ${neighborhoodName}, ${city.name}. ${metaContent.profile.eraLabel}, ${practiceAreas.length} practice areas. Free consultations.`,
    `${neighborhoodName} in ${city.name} (${city.stateCode}): verified attorneys. ${metaContent.profile.eraLabel}. Compare profiles.`,
    `Attorneys in ${neighborhoodName}, ${city.name}. ${metaContent.profile.densityLabel}, ${metaContent.profile.eraLabel.toLowerCase()}. Free consultation online.`,
    `${practiceAreas.length} practice areas in ${neighborhoodName} (${city.name}). ${city.stateName}, ${metaContent.profile.eraLabel.toLowerCase()}. Free consultation.`,
    `All attorneys in ${neighborhoodName}, ${city.name} (${city.stateCode}). ${metaContent.profile.eraLabel}. Compare for free.`,
  ]
  const description = descTemplates[descHash % descTemplates.length]

  return {
    title,
    description,
    // All neighborhood pages indexed — each has unique content (profile, FAQ, data)
    openGraph: {
      locale: 'en_US',
      title,
      description,
      type: 'website',
      images: [cityImage
        ? { url: cityImage.src, width: 1200, height: 630, alt: cityImage.alt }
        : { url: `${SITE_URL}/opengraph-image`, width: 1200, height: 630, alt: `Attorneys in ${neighborhoodName}, ${city.name}` }
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [cityImage ? cityImage.src : `${SITE_URL}/opengraph-image`],
    },
    alternates: { canonical: `${SITE_URL}/cities/${villeSlug}/${quartierSlug}` },
  }
}

export default async function QuartierPage({ params }: PageProps) {
  const { city: villeSlug, neighborhood: quartierSlug } = await params
  const result = getNeighborhoodBySlug(villeSlug, quartierSlug)
  if (!result) notFound()

  const { city, neighborhoodName } = result
  const quartiers = getNeighborhoodsByCity(villeSlug).filter(q => q.slug !== quartierSlug)
  const nearbyVilles = getNearbyCities(villeSlug, 8)
  const stateData = getStateByCode(city.stateCode)
  const regionSlug = stateData?.region ? getRegionSlugByName(stateData.region) : undefined
  const deptSlug = stateData?.slug
  const cityImage = getCityImage(villeSlug)
  const content = generateNeighborhoodContent(city, neighborhoodName)

  // Reorder services based on quartier building profile
  const orderedServices = [...practiceAreas].sort((a, b) => {
    const aIdx = content.profile.topServiceSlugs.indexOf(a.slug)
    const bIdx = content.profile.topServiceSlugs.indexOf(b.slug)
    return (aIdx === -1 ? 999 : aIdx) - (bIdx === -1 ? 999 : bIdx)
  })
  const topServiceSlugs = new Set(content.profile.topServiceSlugs.slice(0, 5))

  // JSON-LD
  const breadcrumbSchema = getBreadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: 'Cities', url: '/cities' },
    { name: city.name, url: `/cities/${villeSlug}` },
    { name: neighborhoodName, url: `/cities/${villeSlug}/${quartierSlug}` },
  ])
  const collectionSchema = getCollectionPageSchema({
    name: `Attorneys in ${neighborhoodName}, ${city.name}`,
    description: `Directory of qualified attorneys in the ${neighborhoodName} neighborhood of ${city.name}. ${practiceAreas.length} practice areas available.`,
    url: `/cities/${villeSlug}/${quartierSlug}`,
    itemCount: practiceAreas.length,
  })
  const faqSchema = getFAQSchema(content.faqItems)

  // Region cities for SEO links
  const regionVilles = cities.filter(v => v.stateCode === city.stateCode && v.slug !== villeSlug).slice(0, 10)

  return (
    <div className="min-h-screen bg-gray-50">
      <JsonLd data={[breadcrumbSchema, collectionSchema, faqSchema]} />

      {/* ─── PREMIUM DARK HERO ──────────────────────────────── */}
      <section className="relative bg-[#0a0f1e] text-white overflow-hidden">
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
            background: 'radial-gradient(ellipse 80% 50% at 50% -10%, rgba(16,185,129,0.18) 0%, transparent 60%), radial-gradient(ellipse 60% 60% at 80% 110%, rgba(16,185,129,0.1) 0%, transparent 50%), radial-gradient(ellipse 50% 40% at 10% 90%, rgba(52,211,153,0.06) 0%, transparent 50%)',
          }} />
          <div className="absolute inset-0 opacity-[0.025]" style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
            backgroundSize: '64px 64px',
          }} />
          <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-gray-50 to-transparent" />
        </div>

        <div className="relative max-w-6xl mx-auto px-4 pt-10 pb-28 md:pt-14 md:pb-36">
          <div className="mb-10">
            <Breadcrumb
              items={[
                { label: 'Cities', href: '/cities' },
                { label: city.name, href: `/cities/${villeSlug}` },
                { label: neighborhoodName },
              ]}
              className="text-slate-400 [&_a]:text-slate-400 [&_a:hover]:text-white [&_svg]:text-slate-600"
            />
          </div>

          <div className="max-w-3xl">
            <div className="flex flex-wrap gap-3 mb-5">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/15 backdrop-blur-sm rounded-full border border-emerald-400/25">
                <MapPin className="w-4 h-4 text-emerald-400" />
                <span className="text-sm font-medium text-emerald-200">Neighborhood</span>
                <span className="w-1 h-1 rounded-full bg-emerald-400/50" />
                <span className="text-sm font-medium text-white/90">{city.name}</span>
              </div>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full border border-white/15">
                <Building2 className="w-4 h-4 text-amber-400" />
                <span className="text-sm font-medium text-white/80">{content.profile.eraLabel}</span>
              </div>
            </div>

            {(() => {
              const h1Hash = Math.abs(hashCode(`h1-quartier-${city.slug}-${quartierSlug}`))
              const h1Templates = [
                `Attorneys in ${neighborhoodName}, ${city.name}`,
                `Find an Attorney in ${neighborhoodName} (${city.name})`,
                `${neighborhoodName}, ${city.name}: Qualified Attorneys`,
                `Attorneys in the ${neighborhoodName} Neighborhood of ${city.name}`,
                `${city.name} ${neighborhoodName} — Trusted Attorneys`,
              ]
              return (
                <h1 className="font-heading text-3xl md:text-4xl lg:text-5xl font-extrabold mb-5 tracking-[-0.025em] leading-[1.1]">
                  {h1Templates[h1Hash % h1Templates.length]}
                </h1>
              )
            })()}
            <p className="text-lg text-slate-400 max-w-2xl leading-relaxed mb-8">
              {practiceAreas.length} practice areas available in the {neighborhoodName} neighborhood. {content.profile.eraLabel} in {content.profile.densityLabel.toLowerCase()}. Free consultations.
            </p>

            <div className="flex flex-wrap gap-4 mb-8 text-sm">
              <div className="flex items-center gap-2 text-slate-300">
                <MapPin className="w-4 h-4 text-emerald-400" />
                <span>{city.name} ({city.zipCode})</span>
              </div>
              <div className="flex items-center gap-2 text-slate-300">
                <Building2 className="w-4 h-4 text-emerald-400" />
                <span>{city.stateName} ({city.stateCode})</span>
              </div>
              <div className="flex items-center gap-2 text-slate-300">
                <Users className="w-4 h-4 text-emerald-400" />
                <span>{city.population} residents</span>
              </div>
            </div>

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

      {/* ─── QUARTIER PROFILE ──────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <section className="mb-16">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
              <Building2 className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h2 className="font-heading text-2xl font-bold text-slate-900 tracking-tight">
                Characteristics of the {neighborhoodName} Neighborhood
              </h2>
              <p className="text-sm text-slate-500">{content.profile.eraLabel} · {content.profile.densityLabel}</p>
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <div className="grid md:grid-cols-3 gap-6 mb-6">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Building2 className="w-4 h-4 text-amber-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900">Building Type</p>
                  <p className="text-sm text-slate-500">{content.profile.eraLabel}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                  <MapPin className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900">Urban Density</p>
                  <p className="text-sm text-slate-500">{content.profile.densityLabel}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-violet-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Users className="w-4 h-4 text-violet-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900">Population</p>
                  <p className="text-sm text-slate-500">{city.population} residents</p>
                </div>
              </div>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed mb-4">{content.profile.architecturalNote}</p>
            <div>
              <p className="text-sm font-semibold text-slate-900 mb-2">Common Issues in {neighborhoodName}:</p>
              <ul className="grid sm:grid-cols-2 gap-2">
                {(() => {
                  const issueHash = Math.abs(hashCode(`issues-${villeSlug}-${quartierSlug}`))
                  const allIssues = content.profile.commonIssues
                  const selected = Array.from({ length: Math.min(3, allIssues.length) }, (_, i) =>
                    allIssues[(issueHash + i) % allIssues.length]
                  )
                  return selected.map((issue, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                      <Wrench className="w-3.5 h-3.5 text-emerald-500 mt-0.5 flex-shrink-0" />
                      {issue}
                    </li>
                  ))
                })()}
              </ul>
            </div>
            <p className="text-xs text-gray-400 mt-3 italic">
              * Profile estimated from the city&apos;s urban characteristics. Actual data may vary by neighborhood construction.
            </p>
          </div>
        </section>

        {/* ─── SERVICES GRID (ordered by profile) ─────────────── */}
        <section className="mb-16">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
              <Wrench className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h2 className="font-heading text-2xl font-bold text-slate-900 tracking-tight">
                Recommended Services in {neighborhoodName}
              </h2>
              <p className="text-sm text-slate-500">{practiceAreas.length} practice areas · ranked by relevance for this area</p>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {orderedServices.map((service) => (
              <Link
                key={service.slug}
                href={`/practice-areas/${service.slug}/${villeSlug}/${quartierSlug}`}
                className={`rounded-xl shadow-sm p-5 text-center hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group ${topServiceSlugs.has(service.slug) ? 'bg-emerald-50 border-2 border-emerald-200' : 'bg-white border border-gray-100'}`}
              >
                <h3 className="font-semibold text-slate-800 group-hover:text-emerald-600 transition-colors text-sm">{service.name}</h3>
                <p className="text-xs text-slate-400 mt-1.5">in {neighborhoodName}</p>
                {topServiceSlugs.has(service.slug) && (
                  <span className="inline-block mt-2 text-[10px] font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">Top Priority</span>
                )}
              </Link>
            ))}
          </div>
        </section>

        {/* ─── OTHER QUARTIERS ─────────────────────────────── */}
        {quartiers.length > 0 && (
          <section className="mb-16">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                <MapPin className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <h2 className="font-heading text-2xl font-bold text-slate-900 tracking-tight">
                  Other Neighborhoods in {city.name}
                </h2>
                <p className="text-sm text-slate-500">{quartiers.length} other neighborhoods</p>
              </div>
            </div>
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <div className="flex flex-wrap gap-2.5">
                {quartiers.map(({ name, slug }) => (
                  <Link
                    key={slug}
                    href={`/cities/${villeSlug}/${slug}`}
                    className="bg-gray-50 text-slate-700 px-4 py-2 rounded-full text-sm border border-gray-100 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 transition-colors"
                  >
                    {name}
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ─── NEARBY VILLES ──────────────────────────────── */}
        {nearbyVilles.length > 0 && (
          <section className="mb-16">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-violet-100 rounded-xl flex items-center justify-center">
                <Building2 className="w-5 h-5 text-violet-600" />
              </div>
              <h2 className="font-heading text-xl font-bold text-slate-900 tracking-tight">
                Cities Near {city.name}
              </h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {nearbyVilles.map((v) => (
                <Link key={v.slug} href={`/cities/${v.slug}`} className="flex items-center gap-2.5 bg-white rounded-xl border border-gray-200 p-3.5 hover:border-emerald-300 hover:shadow-md transition-all group">
                  <MapPin className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 flex-shrink-0 transition-colors" />
                  <div className="min-w-0">
                    <span className="block text-sm font-medium text-slate-800 group-hover:text-emerald-600 truncate transition-colors">{v.name}</span>
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
            {content.faqItems.map((item) => (
              <div key={item.question} className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="font-semibold text-slate-900 mb-2">{item.question}</h3>
                <p className="text-sm text-slate-600 leading-relaxed">{item.answer}</p>
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
            <div>
              <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-4">Practice Areas in {neighborhoodName}</h3>
              <div className="space-y-2">
                {practiceAreas.slice(0, 6).map((s) => (
                  <Link key={s.slug} href={`/practice-areas/${s.slug}/${villeSlug}/${quartierSlug}`} className="flex items-center gap-2 text-sm text-slate-600 hover:text-emerald-600 py-2 transition-colors">
                    <ChevronRight className="w-3 h-3" />
                    {s.name} in {neighborhoodName}
                  </Link>
                ))}
                {practiceAreas.slice(6, 10).map((s) => (
                  <Link key={s.slug} href={`/practice-areas/${s.slug}/${villeSlug}`} className="flex items-center gap-2 text-sm text-slate-600 hover:text-emerald-600 py-2 transition-colors">
                    <ChevronRight className="w-3 h-3" />
                    {s.name} in {city.name}
                  </Link>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-4">Cities in {stateData?.region}</h3>
              <div className="space-y-2">
                {regionVilles.map((v) => (
                  <Link key={v.slug} href={`/cities/${v.slug}`} className="flex items-center gap-2 text-sm text-slate-600 hover:text-emerald-600 py-2 transition-colors">
                    <ChevronRight className="w-3 h-3" />
                    Attorneys in {v.name}
                  </Link>
                ))}
              </div>
              <Link href="/cities" className="inline-flex items-center gap-1 text-emerald-600 hover:text-emerald-700 text-sm font-medium mt-3">
                All Cities <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-4">Navigation</h3>
              <div className="space-y-2">
                <Link href={`/cities/${villeSlug}`} className="flex items-center gap-2 text-sm text-slate-600 hover:text-emerald-600 py-2 transition-colors">
                  <ChevronRight className="w-3 h-3" />
                  Attorneys in {city.name}
                </Link>
                {regionSlug && (
                  <Link href={`/regions/${regionSlug}`} className="flex items-center gap-2 text-sm text-slate-600 hover:text-emerald-600 py-2 transition-colors">
                    <ChevronRight className="w-3 h-3" />
                    Region {stateData?.region}
                  </Link>
                )}
                {deptSlug && (
                  <Link href={`/states/${deptSlug}`} className="flex items-center gap-2 text-sm text-slate-600 hover:text-emerald-600 py-2 transition-colors">
                    <ChevronRight className="w-3 h-3" />
                    {city.stateName} ({city.stateCode})
                  </Link>
                )}
                <Link href={`/quotes/family-law/${villeSlug}`} className="flex items-center gap-2 text-sm text-slate-600 hover:text-emerald-600 py-2 transition-colors">
                  <ChevronRight className="w-3 h-3" />
                  Family Law Consultation in {city.name}
                </Link>
                <Link href={`/quotes/personal-injury/${villeSlug}`} className="flex items-center gap-2 text-sm text-slate-600 hover:text-emerald-600 py-2 transition-colors">
                  <ChevronRight className="w-3 h-3" />
                  Personal Injury Consultation in {city.name}
                </Link>
                <Link href="/services" className="flex items-center gap-2 text-sm text-slate-600 hover:text-emerald-600 py-2 transition-colors">
                  <ChevronRight className="w-3 h-3" />
                  All Practice Areas
                </Link>
                <Link href="/quotes" className="flex items-center gap-2 text-sm text-slate-600 hover:text-emerald-600 py-2 transition-colors">
                  <ChevronRight className="w-3 h-3" />
                  Request a Consultation
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

    </div>
  )
}
