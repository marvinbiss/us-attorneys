import { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { MapPin, ArrowRight, Star, Shield, ChevronDown, BadgeCheck, Clock, Wrench, FileText, BookOpen } from 'lucide-react'
import { getServiceBySlug, getLocationsByService, getProvidersByService, getProviderCountByService } from '@/lib/supabase'
import JsonLd from '@/components/JsonLd'
import { getServiceSchema, getBreadcrumbSchema, getFAQSchema, getSpeakableSchema, getServicePricingSchema } from '@/lib/seo/jsonld'
import { hashCode } from '@/lib/seo/location-content'
import { SITE_URL } from '@/lib/seo/config'
import { logger } from '@/lib/logger'
import PriceTable from '@/components/seo/PriceTable'
import Breadcrumb from '@/components/Breadcrumb'
import { PopularCitiesLinks } from '@/components/InternalLinks'
import { popularServices, relatedServices } from '@/lib/constants/navigation'
import { services as staticServicesList, villes, departements, getVillesByDepartement } from '@/lib/data/france'
import { getTradeContent } from '@/lib/data/trade-content'
import { allArticlesMeta } from '@/lib/data/blog/articles-index'
import { getServiceImage, BLUR_PLACEHOLDER } from '@/lib/data/images'
import { getPageContent, getTradeContentOverride } from '@/lib/cms'
import { CmsContent } from '@/components/CmsContent'
import { SpeakableAnswerBox } from '@/components/SpeakableAnswerBox'
import { SocialProofBanner } from '@/components/SocialProofBanner'
import LastUpdated from '@/components/seo/LastUpdated'
import CrossIntentLinks from '@/components/seo/CrossIntentLinks'
import StickyMobileCTA from '@/components/StickyMobileCTA'
import dynamic from 'next/dynamic'

const EstimationWidget = dynamic(
  () => import('@/components/estimation/EstimationWidget'),
  { ssr: false }
)

const ExitIntentPopup = dynamic(
  () => import('@/components/ExitIntentPopup'),
  { ssr: false }
)

/** Shape returned by getLocationsByService / getStaticCities */
interface CityInfo {
  id: string
  name: string
  slug: string
  department_code?: string
  region_name?: string
}

/** Shape returned by getProvidersByService (provider with joined location) */
interface ServiceProvider {
  id: string
  name: string
  slug: string
  stable_id?: string
  address_city?: string
  address_postal_code?: string
  provider_locations?: Array<{
    location?: { name: string; slug: string } | null
  }>
}

// ISR: Revalidate every 24h
export const revalidate = 86400
export const dynamicParams = false

// Pre-render all 15 service pages at build time
export function generateStaticParams() {
  return staticServicesList.map(s => ({ service: s.slug }))
}

interface PageProps {
  params: Promise<{ service: string }>
}

function truncateTitle(title: string, maxLen = 42): string {
  if (title.length <= maxLen) return title
  return title.slice(0, maxLen - 1).replace(/\s+\S*$/, '') + '…'
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { service: serviceSlug } = await params

  let serviceName = ''

  try {
    const service = await getServiceBySlug(serviceSlug)
    if (service) serviceName = service.name
  } catch {
    // DB down — fallback to static data
  }

  if (!serviceName) {
    const staticSvc = staticServicesList.find(s => s.slug === serviceSlug)
    if (!staticSvc) notFound()
    serviceName = staticSvc.name
  }

  const svcLower = serviceName.toLowerCase()

  const titleHash = Math.abs(hashCode(`hub-title-${serviceSlug}`))
  const titleTemplates = [
    `${serviceName} en France — Devis Gratuit 2026`,
    `${serviceName} : tarifs et devis gratuit 2026`,
    `${serviceName} France — Artisans vérifiés`,
    `${serviceName} — Comparez les artisans 2026`,
    `${serviceName} en France — Artisans qualifiés`,
  ]
  const title = truncateTitle(titleTemplates[titleHash % titleTemplates.length])

  const descHash = Math.abs(hashCode(`hub-desc-${serviceSlug}`))
  const descTemplates = [
    `Trouvez un ${svcLower} qualifié parmi nos artisans vérifiés SIREN. Tarifs, avis et devis gratuit dans ${departements.length} départements.`,
    `Comparez les ${svcLower}s en France : tarifs, avis et certifications. Devis gratuit, sans engagement.`,
    `Annuaire de ${svcLower}s vérifiés par SIREN en France. Prix, conseils d'experts et devis gratuit.`,
    `Besoin d'un ${svcLower} ? Annuaire national : tarifs indicatifs, artisans référencés, devis gratuit en ligne.`,
    `${serviceName} en France 2026 : prix, conseils, certifications. Comparez les artisans et demandez un devis gratuit.`,
  ]
  const description = descTemplates[descHash % descTemplates.length]

  const serviceImage = getServiceImage(serviceSlug)

  return {
    title,
    description,
    openGraph: {
      locale: 'fr_FR',
      title,
      description,
      url: `${SITE_URL}/services/${serviceSlug}`,
      type: 'website',
      siteName: 'ServicesArtisans',
      images: [{ url: serviceImage.src, width: 1200, height: 630, alt: serviceImage.alt }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [serviceImage.src],
    },
    alternates: {
      canonical: `${SITE_URL}/services/${serviceSlug}`,
    },
  }
}

/** Convert static villes to Location-like shape for fallback display */
function getStaticCities() {
  return villes.slice(0, 20).map(v => ({
    id: v.slug,
    name: v.name,
    slug: v.slug,
    department_code: v.departementCode,
    region_name: v.region,
  }))
}

export default async function ServicePage({ params }: PageProps) {
  const { service: serviceSlug } = await params

  // Full CMS page override
  const cmsPage = await getPageContent(serviceSlug, 'service', { serviceSlug })
  if (cmsPage?.content_html) {
    return (
      <div className="min-h-screen bg-gray-50">
        <section className="bg-white border-b">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <h1 className="font-heading text-3xl font-bold text-gray-900">
              {cmsPage.title}
            </h1>
          </div>
        </section>
        <section className="py-12">
          <div className="max-w-6xl mx-auto px-4">
            <CmsContent html={cmsPage.content_html} />
          </div>
        </section>
      </div>
    )
  }

  let service: { name: string; slug: string; description?: string; category?: string } | null = null
  let topCities: CityInfo[] = []
  let recentProviders: ServiceProvider[] = []
  let totalProviderCount = 0
  try {
    service = await getServiceBySlug(serviceSlug)
  } catch (error) {
    logger.error('Service page DB error (service):', error)
  }

  // Fetch cities, providers and total count independently — failure in one should not block the other
  const [citiesResult, providersResult, countResult] = await Promise.allSettled([
    getLocationsByService(serviceSlug),
    getProvidersByService(serviceSlug, 12),
    getProviderCountByService(serviceSlug),
  ])
  if (citiesResult.status === 'fulfilled') {
    topCities = citiesResult.value || []
  } else {
    logger.error('Service page DB error (locations):', citiesResult.reason)
  }
  if (providersResult.status === 'fulfilled') {
    recentProviders = (providersResult.value || []) as ServiceProvider[]
  } else {
    logger.error('Service page DB error (providers):', providersResult.reason)
  }
  if (countResult.status === 'fulfilled') {
    totalProviderCount = countResult.value
  }

  // Fallback to static data if DB failed
  if (!service) {
    const staticSvc = staticServicesList.find(s => s.slug === serviceSlug)
    if (!staticSvc) notFound()
    service = { name: staticSvc.name, slug: staticSvc.slug }
  }

  // Fallback cities if DB returned nothing
  if (!topCities || topCities.length === 0) {
    topCities = getStaticCities()
  }

  // Grouper les villes par région
  const citiesByRegion = topCities?.reduce((acc: Record<string, CityInfo[]>, city: CityInfo) => {
    const region = city.region_name || 'Autres'
    if (!acc[region]) acc[region] = []
    acc[region].push(city)
    return acc
  }, {} as Record<string, CityInfo[]>) || {}

  // Trade-specific rich content (prices, FAQ, tips, certifications)
  const tradeBase = getTradeContent(serviceSlug)
  const cmsTradeOverride = await getTradeContentOverride(serviceSlug)
  const trade = tradeBase && cmsTradeOverride
    ? { ...tradeBase, ...cmsTradeOverride } as typeof tradeBase
    : tradeBase

  // H1 variation for SEO
  const h1Hash = Math.abs(hashCode(`hub-h1-${serviceSlug}`))
  const h1Templates = [
    `${service.name} en France`,
    `Trouver un ${service.name.toLowerCase()} en France`,
    `${service.name} — Annuaire national`,
    `Artisans ${service.name.toLowerCase()} en France`,
    `${service.name} : comparez les professionnels`,
  ]
  const h1Text = h1Templates[h1Hash % h1Templates.length]

  // JSON-LD structured data
  const serviceSchema = getServiceSchema({
    name: service.name,
    description: service.description || `Services de ${service.name.toLowerCase()} en France`,
    category: service.category || service.name,
    image: getServiceImage(serviceSlug).src,
  })

  const breadcrumbSchema = getBreadcrumbSchema([
    { name: 'Accueil', url: '/' },
    { name: 'Services', url: '/services' },
    { name: service.name, url: `/services/${serviceSlug}` },
  ])

  const faqSchema = trade
    ? getFAQSchema(trade.faq.map(f => ({ question: f.q, answer: f.a })))
    : null

  const speakableSchema = getSpeakableSchema({
    url: `${SITE_URL}/services/${serviceSlug}`,
    title: h1Text,
  })

  const pricingSchema = trade ? getServicePricingSchema({
    serviceName: service.name,
    serviceSlug: serviceSlug,
    description: service.description || `Services de ${service.name.toLowerCase()} en France`,
    lowPrice: trade.priceRange.min,
    highPrice: trade.priceRange.max,
    priceCurrency: 'EUR',
    priceUnit: trade.priceRange.unit,
    offerCount: totalProviderCount || trade.commonTasks.length,
    url: `${SITE_URL}/services/${serviceSlug}`,
  }) : null

  return (
    <div className="min-h-screen bg-gray-50">
      {/* JSON-LD */}
      <JsonLd data={[serviceSchema, breadcrumbSchema, speakableSchema, ...(faqSchema ? [faqSchema] : []), ...(pricingSchema ? [pricingSchema] : [])]} />

      {/* Breadcrumb */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <Breadcrumb
            items={[
              { label: 'Services', href: '/services' },
              { label: service.name },
            ]}
          />
        </div>
      </div>

      {/* Hero — Premium gradient */}
      <section className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 overflow-hidden">
        {/* Service photo background */}
        <Image
          src={getServiceImage(serviceSlug).src}
          alt={getServiceImage(serviceSlug).alt}
          fill
          className="object-cover opacity-15"
          sizes="100vw"
          priority
          placeholder="blur"
          blurDataURL={BLUR_PLACEHOLDER}
        />
        <div className="absolute inset-0 bg-gray-900/75" />
        {/* Ambient glow */}
        <div className="absolute inset-0" style={{
          background: 'radial-gradient(ellipse 60% 50% at 50% 100%, rgba(245,158,11,0.10) 0%, transparent 60%), radial-gradient(ellipse 40% 40% at 80% 20%, rgba(59,130,246,0.06) 0%, transparent 50%)',
        }} />
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }} />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 md:py-20">
          <h1 className="font-heading text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4 tracking-tight">
            {h1Text}
          </h1>
          <p className="text-lg md:text-xl text-slate-400 max-w-3xl leading-relaxed">
            {service.description ||
              `Trouvez les meilleurs ${service.name.toLowerCase()}s près de chez vous. Comparez les avis, les tarifs et obtenez des devis gratuits.`}
          </p>
          <LastUpdated label="Données artisans mises à jour le" className="text-slate-500 mt-3" />

          {/* Stats — Large gradient numbers */}
          <div className="flex flex-wrap gap-6 md:gap-10 mt-10">
            <div className="flex flex-col">
              <span className="font-heading text-3xl md:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-amber-500">
                {totalProviderCount > 0 ? totalProviderCount.toLocaleString('fr-FR') : '—'}
              </span>
              <span className="text-sm text-slate-400 mt-1">artisans référencés</span>
            </div>
            <div className="flex flex-col">
              <span className="font-heading text-3xl md:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-300 to-blue-500">
                {topCities?.length || 0}+
              </span>
              <span className="text-sm text-slate-400 mt-1">villes couvertes</span>
            </div>
            <div className="flex flex-col">
              <span className="font-heading text-3xl md:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 to-emerald-500">
                100%
              </span>
              <span className="text-sm text-slate-400 mt-1">données SIREN</span>
            </div>
            {trade && (
              <div className="flex flex-col">
                <span className="font-heading text-3xl md:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-300 to-purple-500">
                  {trade.priceRange.min}–{trade.priceRange.max}
                </span>
                <span className="text-sm text-slate-400 mt-1">{trade.priceRange.unit}</span>
              </div>
            )}
          </div>

          {/* Badges row */}
          <div className="flex flex-wrap gap-3 mt-8">
            <div className="flex items-center gap-2 bg-white/[0.08] backdrop-blur-sm border border-white/10 px-4 py-2 rounded-full">
              <Shield className="w-4 h-4 text-emerald-400" />
              <span className="text-sm text-slate-300 font-medium">Artisans vérifiés</span>
            </div>
            <div className="flex items-center gap-2 bg-white/[0.08] backdrop-blur-sm border border-white/10 px-4 py-2 rounded-full">
              <Star className="w-4 h-4 text-amber-400" />
              <span className="text-sm text-slate-300 font-medium">Qualité contrôlée</span>
            </div>
            {trade && (
              <div className="flex items-center gap-2 bg-white/[0.08] backdrop-blur-sm border border-white/10 px-4 py-2 rounded-full">
                <Clock className="w-4 h-4 text-purple-400" />
                <span className="text-sm text-slate-300 font-medium">{trade.averageResponseTime.split(',')[0]}</span>
              </div>
            )}
          </div>

          {/* CTA */}
          <div className="mt-10">
            <Link
              href={`/devis/${serviceSlug}`}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold px-8 py-4 rounded-xl shadow-lg shadow-amber-500/25 hover:shadow-[0_8px_30px_-4px_rgba(245,158,11,0.5)] hover:scale-[1.02] hover:-translate-y-1 active:scale-[0.98] transition-all duration-200"
            >
              Demander un devis gratuit
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      <CrossIntentLinks service={serviceSlug} serviceName={service.name} currentIntent="services" />

      {/* Speakable Answer Box */}
      {trade && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
          <SpeakableAnswerBox
            answer={`${trade.name} en France : ${trade.priceRange.min}–${trade.priceRange.max} ${trade.priceRange.unit}. ${totalProviderCount.toLocaleString('fr-FR')} artisans référencés et vérifiés SIREN dans ${topCities?.length || 0}+ villes. Devis gratuit, données officielles INSEE.`}
          />
        </div>
      )}

      {/* CTA Principal + Social Proof */}
      <section className="my-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SocialProofBanner metier={service.name} variant="card" />

          <div className="mt-6 bg-gradient-to-r from-clay-500 to-clay-600 rounded-2xl p-8 text-center">
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">
              Besoin d&apos;un {service.name.toLowerCase()} ?
            </h2>
            <p className="text-clay-100 mb-6">
              Recevez jusqu&apos;à 3 devis gratuits en 2 minutes
            </p>
            <Link
              href={`/devis/${serviceSlug}`}
              className="inline-flex items-center gap-2 bg-white text-clay-600 hover:bg-clay-50 px-8 py-3.5 rounded-xl font-semibold transition-colors shadow-lg"
            >
              <FileText className="w-5 h-5" />
              Demander un devis gratuit
            </Link>
          </div>
        </div>
      </section>

      {/* Search by city */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="font-heading text-2xl font-bold text-gray-900 mb-6 tracking-tight">
            Trouver un {service.name.toLowerCase()} par ville
          </h2>

          {/* Popular cities grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 mb-8">
            {topCities?.slice(0, 12).map((city) => (
              <Link
                key={city.id}
                href={`/services/${serviceSlug}/${city.slug}`}
                className="bg-white rounded-lg border border-gray-200 p-4 hover:border-blue-300 hover:shadow-md transition-all group"
              >
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-gray-400 group-hover:text-blue-600" />
                  <span className="font-medium text-gray-900 group-hover:text-blue-600 truncate">
                    {city.name}
                  </span>
                </div>
                {city.department_code && (
                  <span className="text-xs text-gray-500 mt-1 block">
                    ({city.department_code})
                  </span>
                )}
              </Link>
            ))}
          </div>

          {/* Cities by region */}
          {Object.keys(citiesByRegion).length > 0 && (
            <div className="space-y-8">
              {Object.entries(citiesByRegion)
                .map(([region, cities]) => (
                  <div key={region}>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      {service.name} en {region}
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {cities.slice(0, 10).map((city) => (
                        <Link
                          key={city.id}
                          href={`/services/${serviceSlug}/${city.slug}`}
                          className="text-sm bg-gray-100 hover:bg-blue-100 text-gray-700 hover:text-blue-700 px-4 py-2.5 rounded-full transition-colors"
                        >
                          {city.name}
                        </Link>
                      ))}
                      {cities.length > 10 && (
                        <span className="text-sm text-gray-500 px-3 py-1.5">
                          +{cities.length - 10} villes
                        </span>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      </section>

      {/* Par département — SEO internal links to service+ville pages */}
      <section className="py-12 border-t">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="font-heading text-2xl font-bold text-gray-900 mb-8 tracking-tight">
            {service.name} par département
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {departements.map((dept) => {
              const deptVilles = getVillesByDepartement(dept.code)
              if (deptVilles.length === 0) return null
              return (
                <div key={dept.code} className="bg-gray-50 rounded-xl p-5">
                  <h3 className="font-semibold text-gray-900 mb-3 text-sm">
                    <Link href={`/departements/${dept.slug}`} className="hover:text-blue-600 transition-colors">
                      {dept.name} ({dept.code})
                    </Link>
                  </h3>
                  <div className="flex flex-wrap gap-1.5">
                    {deptVilles.slice(0, 5).map((ville) => (
                      <Link
                        key={ville.slug}
                        href={`/services/${serviceSlug}/${ville.slug}`}
                        className="text-xs text-gray-600 hover:text-blue-600 px-2.5 py-1 bg-white rounded-full border border-gray-200 hover:border-blue-200 transition-colors"
                      >
                        {ville.name}
                      </Link>
                    ))}
                    {deptVilles.length > 5 && (
                      <Link
                        href={`/departements/${dept.slug}`}
                        className="text-xs text-blue-600 px-2.5 py-1"
                      >
                        +{deptVilles.length - 5} villes
                      </Link>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
          <div className="mt-6 flex flex-wrap gap-4 text-sm">
            <Link href="/departements" className="text-blue-600 hover:underline">Tous les départements →</Link>
            <Link href="/regions" className="text-blue-600 hover:underline">Toutes les régions →</Link>
            <Link href="/villes" className="text-blue-600 hover:underline">Toutes les villes →</Link>
          </div>
        </div>
      </section>

      {/* Recent providers */}
      {recentProviders && recentProviders.length > 0 && (
        <section className="py-12 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="font-heading text-2xl font-bold text-gray-900 mb-6 tracking-tight">
              {service.name}s récemment ajoutés
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {recentProviders.slice(0, 6).map((provider) => {
                const location = provider.provider_locations?.[0]?.location
                return (
                  <Link
                    key={provider.id}
                    href={`/services/${serviceSlug}/${location?.slug || 'france'}/${provider.stable_id || provider.slug}`}
                    className="bg-gray-50 rounded-lg p-4 hover:bg-blue-50 transition-colors group"
                  >
                    <h3 className="font-semibold text-gray-900 group-hover:text-blue-600">
                      {provider.name}
                    </h3>
                    {provider.address_city && (
                      <p className="text-sm text-gray-500 mt-1 flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {provider.address_postal_code} {provider.address_city}
                      </p>
                    )}
                  </Link>
                )
              })}
            </div>
          </div>
        </section>
      )}

      {/* Price Guide — unique per trade */}
      {trade && (
        <section className="py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-white rounded-xl p-8 shadow-sm">
              <PriceTable tasks={trade.commonTasks} tradeName={service.name} priceRange={trade.priceRange} />
            </div>
          </div>
        </section>
      )}

      {/* Tips + Certifications */}
      {trade && (
        <section className="py-12 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-3 gap-8">
              {/* Conseils pratiques */}
              <div className="lg:col-span-2">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Shield className="w-6 h-6 text-blue-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    Conseils pour choisir votre {service.name.toLowerCase()}
                  </h2>
                </div>
                <div className="space-y-4">
                  {trade.tips.map((tip, i) => (
                    <div key={i} className="flex gap-3 p-4 bg-blue-50 rounded-lg">
                      <BadgeCheck className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                      <p className="text-gray-700 text-sm leading-relaxed">{tip}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Certifications + Urgence */}
              <div className="space-y-6">
                <div className="bg-gray-50 rounded-xl p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <BadgeCheck className="w-5 h-5 text-green-600" />
                    <h3 className="font-semibold text-gray-900">Certifications à vérifier</h3>
                  </div>
                  <ul className="space-y-2">
                    {trade.certifications.map((cert, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                        <span className="text-green-500 mt-1">✓</span>
                        {cert}
                      </li>
                    ))}
                  </ul>
                </div>

                {trade.emergencyInfo && (
                  <div className="bg-red-50 border border-red-100 rounded-xl p-6">
                    <div className="flex items-center gap-2 mb-3">
                      <Clock className="w-5 h-5 text-red-600" />
                      <h3 className="font-semibold text-red-900">Urgence {service.name.toLowerCase()}</h3>
                    </div>
                    <p className="text-sm text-red-800 leading-relaxed">{trade.emergencyInfo}</p>
                  </div>
                )}

                <div className="bg-blue-50 rounded-xl p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <Wrench className="w-5 h-5 text-blue-600" />
                    <h3 className="font-semibold text-gray-900">Délai d&apos;intervention</h3>
                  </div>
                  <p className="text-sm text-gray-700">{trade.averageResponseTime}</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Questions fréquentes — PAA optimisé */}
      {trade && (
        <section className="py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
            <h2 className="text-xl font-heading font-semibold text-gray-900">
              Pourquoi faire appel à un {service.name.toLowerCase()} professionnel ?
            </h2>
            <p className="text-gray-700 leading-relaxed">
              Faire appel à un {service.name.toLowerCase()} professionnel garantit un travail conforme aux normes en vigueur
              et couvert par une assurance décennale. Un artisan qualifié dispose de l&apos;expérience,
              de l&apos;outillage adapté et des certifications nécessaires pour réaliser vos travaux en toute sécurité.
              De plus, recourir à un professionnel référencé vous protège en cas de malfaçon.
            </p>

            <h2 className="text-xl font-heading font-semibold text-gray-900">
              Quelles certifications doit avoir un {service.name.toLowerCase()} ?
            </h2>
            <p className="text-gray-700 leading-relaxed">
              {trade.certifications.length > 0
                ? `Un ${service.name.toLowerCase()} qualifié doit idéalement posséder les certifications suivantes : ${trade.certifications.slice(0, 3).join(', ')}. Ces labels garantissent un niveau de compétence reconnu et vous permettent, dans certains cas, de bénéficier d'aides financières de l'État.`
                : `Un ${service.name.toLowerCase()} doit au minimum disposer d'une assurance responsabilité civile professionnelle et d'une garantie décennale. Vérifiez également son inscription au registre des métiers et son numéro SIRET.`
              }
            </p>
          </div>
        </section>
      )}

      {/* FAQ — rich content for SEO */}
      {trade && trade.faq.length > 0 && (
        <section className="py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-3 mb-8">
              <h2 className="text-2xl font-bold text-gray-900">
                Questions fréquentes — {service.name}
              </h2>
            </div>
            <div className="space-y-4">
              {trade.faq.map((item, i) => (
                <details key={i} className="group bg-white rounded-xl shadow-sm border border-gray-100">
                  <summary className="flex items-center justify-between p-6 cursor-pointer list-none">
                    <h3 className="font-semibold text-gray-900 pr-4">{item.q}</h3>
                    <ChevronDown className="w-5 h-5 text-gray-400 group-open:rotate-180 transition-transform flex-shrink-0" />
                  </summary>
                  <div className="px-6 pb-6 pt-0">
                    <p className="text-gray-600 leading-relaxed">{item.a}</p>
                  </div>
                </details>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Generic SEO Content — fallback when no trade content */}
      {!trade && (
        <section className="py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-white rounded-xl p-8 shadow-sm">
              <h2 className="font-heading text-2xl font-bold text-gray-900 mb-4 tracking-tight">
                Comment trouver un bon {service.name.toLowerCase()} ?
              </h2>
              <div className="prose prose-gray max-w-none">
                <p>
                  Trouver un {service.name.toLowerCase()} de confiance peut sembler compliqué.
                  ServicesArtisans vous simplifie la tâche en répertoriant les meilleurs
                  professionnels de votre région.
                </p>
                <h3>Les critères pour choisir votre {service.name.toLowerCase()}</h3>
                <ul>
                  <li>
                    <strong>Les avis clients</strong> : Consultez les retours d&apos;expérience
                    des autres clients pour vous faire une idée de la qualité du travail.
                  </li>
                  <li>
                    <strong>Les certifications</strong> : Vérifiez que l&apos;artisan dispose
                    des qualifications nécessaires pour réaliser vos travaux.
                  </li>
                  <li>
                    <strong>La proximité</strong> : Un artisan proche de chez vous pourra
                    intervenir plus rapidement et les frais de déplacement seront réduits.
                  </li>
                  <li>
                    <strong>Le devis détaillé</strong> : Demandez toujours un devis écrit
                    avant de vous engager.
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Guides utiles — maillage interne vers guides */}
      {(() => {
        const serviceGuidesMap: Record<string, { slug: string; title: string }[]> = {
          'electricien': [
            { slug: 'normes-electriques', title: 'Normes électriques NF C 15 100' },
            { slug: 'diagnostics-immobiliers', title: 'Diagnostics immobiliers obligatoires' },
          ],
          'plombier': [
            { slug: 'aides-renovation-2026', title: 'Aides rénovation 2026' },
            { slug: 'renovation-salle-de-bain', title: 'Guide rénovation salle de bain' },
          ],
          'chauffagiste': [
            { slug: 'pompe-a-chaleur', title: 'Guide pompe à chaleur' },
            { slug: 'maprimerenov-2026', title: 'MaPrimeRénov\' 2026' },
            { slug: 'isolation-thermique', title: 'Guide isolation thermique' },
          ],
          'couvreur': [
            { slug: 'renovation-toiture', title: 'Guide rénovation toiture' },
            { slug: 'isolation-combles', title: 'Guide isolation des combles' },
          ],
          'menuisier': [
            { slug: 'renovation-fenetres', title: 'Guide rénovation fenêtres' },
            { slug: 'renovation-cuisine', title: 'Guide rénovation cuisine' },
          ],
          'peintre-en-batiment': [
            { slug: 'renovation-energetique-complete', title: 'Guide rénovation énergétique complète' },
            { slug: 'budget-renovation', title: 'Budget rénovation : bien estimer ses coûts' },
          ],
          'macon': [
            { slug: 'extension-maison', title: 'Guide extension maison' },
            { slug: 'permis-construire', title: 'Guide permis de construire' },
          ],
          'carreleur': [
            { slug: 'renovation-salle-de-bain', title: 'Guide rénovation salle de bain' },
            { slug: 'renovation-cuisine', title: 'Guide rénovation cuisine' },
          ],
          'cuisiniste': [
            { slug: 'renovation-cuisine', title: 'Guide rénovation cuisine' },
            { slug: 'budget-renovation', title: 'Budget rénovation : bien estimer ses coûts' },
          ],
          'climaticien': [
            { slug: 'pompe-a-chaleur', title: 'Guide pompe à chaleur' },
            { slug: 'maprimerenov-2026', title: 'MaPrimeRénov\' 2026' },
          ],
          'vitrier': [
            { slug: 'renovation-fenetres', title: 'Guide rénovation fenêtres' },
          ],
          'charpentier': [
            { slug: 'renovation-toiture', title: 'Guide rénovation toiture' },
            { slug: 'isolation-combles', title: 'Guide isolation des combles' },
          ],
          'serrurier': [
            { slug: 'eviter-arnaques-artisan', title: 'Éviter les arnaques artisan' },
            { slug: 'devis-travaux', title: 'Guide devis travaux' },
          ],
        }
        const guides = serviceGuidesMap[serviceSlug]
        if (!guides || guides.length === 0) return null
        return (
          <section className="py-12 bg-white border-t">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-amber-100 rounded-lg">
                  <BookOpen className="w-5 h-5 text-amber-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">Guides utiles</h2>
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {guides.map((guide) => (
                  <Link
                    key={guide.slug}
                    href={`/guides/${guide.slug}`}
                    className="flex items-start gap-3 p-5 bg-gray-50 hover:bg-amber-50 rounded-xl border border-gray-200 hover:border-amber-300 transition-all group"
                  >
                    <BookOpen className="w-5 h-5 text-gray-400 group-hover:text-amber-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <span className="font-medium text-gray-900 group-hover:text-amber-600 text-sm">
                        {guide.title}
                      </span>
                      <span className="block text-xs text-gray-500 mt-1">Lire le guide complet</span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )
      })()}

      {/* CTA */}
      <section className="relative py-16 overflow-hidden bg-gradient-to-br from-[#0a0f1e] via-[#111827] to-[#0a0f1e]">
        <div className="absolute inset-0" style={{
          background: 'radial-gradient(ellipse 50% 60% at 50% 50%, rgba(245,158,11,0.06) 0%, transparent 60%)',
        }} />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="font-heading text-2xl md:text-3xl font-bold text-white mb-4">
            Vous êtes {service.name.toLowerCase()} ?
          </h2>
          <p className="text-slate-400 mb-8 max-w-xl mx-auto">
            Inscrivez-vous gratuitement et recevez des demandes de devis qualifiées
          </p>
          <Link
            href="/inscription-artisan"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-400 via-amber-300 to-amber-400 text-slate-900 font-bold px-8 py-4 rounded-xl shadow-lg shadow-amber-500/25 hover:shadow-[0_8px_30px_-4px_rgba(245,158,11,0.5)] hover:scale-[1.02] hover:-translate-y-1 active:scale-[0.98] transition-all duration-200"
          >
            Créer mon profil
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* ─── EDITORIAL CREDIBILITY ──────────────────────────── */}
      <section className="mb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-slate-50 rounded-2xl border border-slate-200 p-6">
            <h3 className="text-sm font-semibold text-slate-700 mb-2">Méthodologie éditoriale</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Les tarifs et informations présentés sont indicatifs, basés sur des moyennes nationales et régionales. Les artisans sont référencés via leur numéro SIREN. ServicesArtisans est un annuaire indépendant — nous ne réalisons pas de travaux et ne garantissons pas les prestations.
            </p>
          </div>
        </div>
      </section>

      {/* Trust & Safety Links (E-E-A-T) */}
      <section className="py-8 bg-white border-t">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Confiance &amp; Sécurité
          </h2>
          <nav className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
            <Link href="/notre-processus-de-verification" className="text-blue-600 hover:text-blue-800">
              Comment nous référençons les artisans
            </Link>
            <Link href="/politique-avis" className="text-blue-600 hover:text-blue-800">
              Notre politique des avis
            </Link>
            <Link href="/mediation" className="text-blue-600 hover:text-blue-800">
              Service de médiation
            </Link>
          </nav>
        </div>
      </section>

      {/* Voir aussi - Autres services */}
      <section className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="font-heading text-2xl font-bold text-gray-900 mb-6 tracking-tight">Voir aussi</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="font-semibold text-gray-900 mb-4">Services connexes</h3>
              <div className="flex flex-wrap gap-2">
                {(relatedServices[serviceSlug] || popularServices.filter(s => s.slug !== serviceSlug).map(s => s.slug))
                  .slice(0, 6)
                  .map((slug) => {
                    const svc = staticServicesList.find(s => s.slug === slug)
                    if (!svc) return null
                    return (
                      <Link
                        key={slug}
                        href={`/services/${slug}`}
                        className="inline-flex items-center gap-2 px-4 py-2.5 bg-gray-100 hover:bg-blue-100 text-gray-700 hover:text-blue-700 rounded-full text-sm transition-colors"
                      >
                        {svc.name}
                      </Link>
                    )
                  })}
              </div>
              <h3 className="font-semibold text-gray-900 mb-4 mt-6">Outils pratiques</h3>
              <div className="flex flex-wrap gap-2">
                <Link
                  href="/outils/calculateur-prix"
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-gray-100 hover:bg-blue-100 text-gray-700 hover:text-blue-700 rounded-full text-sm transition-colors"
                >
                  Calculateur de prix
                </Link>
                <Link
                  href="/outils/diagnostic"
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-gray-100 hover:bg-blue-100 text-gray-700 hover:text-blue-700 rounded-full text-sm transition-colors"
                >
                  Diagnostic artisan
                </Link>
              </div>
            </div>
            <div>
              <PopularCitiesLinks showTitle={true} limit={8} />
            </div>
            {/* Articles de blog liés à ce métier */}
            {(() => {
              const svcLower = service.name.toLowerCase()
              const relatedArticles = allArticlesMeta.filter((a) =>
                a.tags.some((tag) => tag.toLowerCase().includes(svcLower) || svcLower.includes(tag.toLowerCase()))
                || a.category === 'Fiches métier' && (a.title.toLowerCase().includes(svcLower) || a.slug.includes(serviceSlug))
              ).slice(0, 4)
              if (relatedArticles.length === 0) return null
              return (
                <div className="mt-8">
                  <h3 className="font-semibold text-gray-900 mb-4">Articles sur ce métier</h3>
                  <div className="grid md:grid-cols-2 gap-3">
                    {relatedArticles.map((article) => (
                      <Link
                        key={article.slug}
                        href={`/blog/${article.slug}`}
                        className="flex items-start gap-3 p-4 bg-gray-50 hover:bg-blue-50 rounded-xl border border-gray-100 hover:border-blue-200 transition-colors group"
                      >
                        <span className="text-2xl flex-shrink-0">{article.image}</span>
                        <div>
                          <div className="font-medium text-gray-900 group-hover:text-blue-600 text-sm leading-snug">
                            {article.title}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">{article.readTime} · {article.category}</div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )
            })()}
          </div>
          {/* Intent variants — devis, avis, tarifs by city */}
          <div className="mt-8 grid md:grid-cols-3 gap-8">
            <div>
              <h3 className="font-semibold text-gray-900 mb-4">Devis {service.name.toLowerCase()} par ville</h3>
              <div className="flex flex-wrap gap-2">
                {topCities?.slice(0, 12).map((city) => (
                  <Link
                    key={`devis-${city.slug}`}
                    href={`/devis/${serviceSlug}/${city.slug}`}
                    className="text-sm text-gray-600 hover:text-blue-600 px-3 py-1.5 bg-gray-50 rounded-full border border-gray-100 hover:border-blue-200 transition-colors"
                  >
                    {city.name}
                  </Link>
                ))}
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-4">Avis {service.name.toLowerCase()} par ville</h3>
              <div className="flex flex-wrap gap-2">
                {topCities?.slice(0, 12).map((city) => (
                  <Link
                    key={`avis-${city.slug}`}
                    href={`/avis/${serviceSlug}/${city.slug}`}
                    className="text-sm text-gray-600 hover:text-blue-600 px-3 py-1.5 bg-gray-50 rounded-full border border-gray-100 hover:border-blue-200 transition-colors"
                  >
                    {city.name}
                  </Link>
                ))}
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-4">Tarifs {service.name.toLowerCase()} par ville</h3>
              <div className="flex flex-wrap gap-2">
                {topCities?.slice(0, 12).map((city) => (
                  <Link
                    key={`tarifs-${city.slug}`}
                    href={`/tarifs/${serviceSlug}/${city.slug}`}
                    className="text-sm text-gray-600 hover:text-blue-600 px-3 py-1.5 bg-gray-50 rounded-full border border-gray-100 hover:border-blue-200 transition-colors"
                  >
                    {city.name}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Internal Links Footer */}

      <StickyMobileCTA serviceSlug={serviceSlug} />

      <EstimationWidget context={{
        metier: service.name,
        metierSlug: serviceSlug,
        ville: 'France',
        departement: '',
        pageUrl: `/services/${serviceSlug}`,
      }} />

      <ExitIntentPopup
        sessionKey="sa:exit-services"
        description="Comparez les devis de plusieurs artisans qualifiés, gratuitement et sans engagement."
        ctaHref={`/devis/${serviceSlug}`}
      />
    </div>
  )
}
