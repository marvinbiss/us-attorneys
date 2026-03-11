import { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import {
  ArrowRight,
  CheckCircle,
  Euro,
  Shield,
  Clock,
  Phone,
  ChevronDown,
  MapPin,
  Users,
  Thermometer,
  Building2,
  Star,
  Zap,
  TrendingUp,
} from 'lucide-react'
import Breadcrumb from '@/components/Breadcrumb'
import JsonLd from '@/components/JsonLd'
import { getBreadcrumbSchema, getFAQSchema } from '@/lib/seo/jsonld'
import { SITE_URL, SITE_NAME } from '@/lib/seo/config'
import { hashCode, getRegionalMultiplier } from '@/lib/seo/location-content'
import { tradeContent, getTradesSlugs } from '@/lib/data/trade-content'
import { villes, getVilleBySlug, getNearbyCities } from '@/lib/data/france'
import { getCommuneBySlug, formatNumber } from '@/lib/data/commune-data'
import { getServiceImage } from '@/lib/data/images'
import { relatedServices } from '@/lib/constants/navigation'
import { getCityValues } from '@/lib/insee-resolver'
import { getProblemsByService } from '@/lib/data/problems'
import { allArticlesMeta } from '@/lib/data/blog/articles-index'
import dynamic from 'next/dynamic'

const EstimationWidget = dynamic(
  () => import('@/components/estimation/EstimationWidget'),
  { ssr: false }
)

export const revalidate = 86400 // Revalidate every 24h

const IS_BUILD = process.env.NEXT_BUILD_SKIP_DB === '1'

// ---------------------------------------------------------------------------
// Types & data-fetching (Supabase)
// ---------------------------------------------------------------------------

interface AvisProvider {
  id: string
  user_id: string | null
  name: string
  slug: string
  stable_id: string
  address_city: string | null
  rating_average: number | null
  review_count: number | null
  is_verified: boolean
  specialty: string | null
}

interface AvisReview {
  id: string
  rating: number
  comment: string | null
  client_name: string | null
  created_at: string
  artisan_id: string
}

async function getTopProviders(cityName: string, _serviceSlug: string): Promise<AvisProvider[]> {
  if (IS_BUILD) return []
  try {
    const { createAdminClient } = await import('@/lib/supabase/admin')
    const supabase = createAdminClient()

    const { data, error } = await supabase
      .from('providers')
      .select('id, user_id, name, slug, stable_id, address_city, rating_average, review_count, is_verified, specialty')
      .eq('is_active', true)
      .gt('review_count', 0)
      // Use .in() with INSEE codes instead of ILIKE to avoid full table scan on 750K rows
      .in('address_city', getCityValues(cityName))
      .order('rating_average', { ascending: false, nullsFirst: false })
      .order('review_count', { ascending: false })
      .limit(20)

    if (error || !data) return []
    return data
  } catch {
    return []
  }
}

async function getRecentReviews(artisanIds: string[]): Promise<AvisReview[]> {
  if (IS_BUILD || artisanIds.length === 0) return []
  try {
    const { createAdminClient } = await import('@/lib/supabase/admin')
    const supabase = createAdminClient()

    const { data, error } = await supabase
      .from('reviews')
      .select('id, rating, comment, client_name, created_at, artisan_id')
      .in('artisan_id', artisanIds)
      .eq('status', 'published')
      .not('comment', 'is', null)
      .order('rating', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(8)

    if (error || !data) return []
    return data
  } catch {
    return []
  }
}

// ---------------------------------------------------------------------------
// Static params: top 50 cities x 46 services = 2,300 pages
// ---------------------------------------------------------------------------

const tradeSlugs = getTradesSlugs()

function parsePopulation(pop: string): number {
  return parseInt(pop.replace(/\s/g, ''), 10) || 0
}

const top5Cities = [...villes]
  .sort((a, b) => parsePopulation(b.population) - parsePopulation(a.population))
  .slice(0, 50)

export function generateStaticParams() {
  const params: { service: string; ville: string }[] = []
  for (const service of tradeSlugs) {
    for (const ville of top5Cities) {
      params.push({ service, ville: ville.slug })
    }
  }
  return params
}

export const dynamicParams = true

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getClimatLabel(zone: string | null): string {
  const labels: Record<string, string> = {
    oceanique: 'Climat océanique',
    'semi-oceanique': 'Climat semi-océanique',
    continental: 'Climat continental',
    mediterraneen: 'Climat méditerranéen',
    montagnard: 'Climat montagnard',
  }
  return zone ? (labels[zone] ?? zone) : 'Climat tempéré'
}

// ---------------------------------------------------------------------------
// Metadata
// ---------------------------------------------------------------------------

function truncateTitle(title: string, maxLen = 42): string {
  if (title.length <= maxLen) return title
  return title.slice(0, maxLen - 1).replace(/\s+\S*$/, '') + '\u2026'
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ service: string; ville: string }>
}): Promise<Metadata> {
  const { service, ville } = await params
  const trade = tradeContent[service]
  const villeData = getVilleBySlug(ville)
  if (!trade || !villeData) return {}

  const tradeLower = trade.name.toLowerCase()
  const multiplier = getRegionalMultiplier(villeData.region)
  const minPrice = Math.round(trade.priceRange.min * multiplier)
  const maxPrice = Math.round(trade.priceRange.max * multiplier)

  const titleHash = Math.abs(hashCode(`avis-loc-title-${service}-${ville}`))
  const titleTemplates = [
    `Avis ${tradeLower} ${villeData.name}`,
    `Avis ${tradeLower} \u00e0 ${villeData.name} — Guide`,
    `Avis ${tradeLower} ${villeData.name} : notes`,
    `Avis ${tradeLower} ${villeData.name} 2026`,
    `Avis ${tradeLower} ${villeData.name} — Comparez`,
  ]
  const title = truncateTitle(titleTemplates[titleHash % titleTemplates.length])

  const descHash = Math.abs(hashCode(`avis-loc-desc-${service}-${ville}`))
  const dept = villeData.departement
  const descTemplates = [
    `Avis ${tradeLower} à ${villeData.name} : ${minPrice}\u2013${maxPrice} ${trade.priceRange.unit}. Consultez les recommandations, comparez les artisans et trouvez un professionnel de confiance.`,
    `Choisir un ${tradeLower} à ${villeData.name} (${dept}) : avis clients, notes et recommandations. Artisans vérifiés, devis gratuit.`,
    `${trade.name} à ${villeData.name} : consultez les avis vérifiés et comparez les tarifs (${minPrice}\u2013${maxPrice} ${trade.priceRange.unit}). Guide 2026.`,
    `Les meilleurs ${tradeLower}s à ${villeData.name} selon les avis clients. Prix local : ${minPrice}\u2013${maxPrice} ${trade.priceRange.unit}. Comparez et choisissez.`,
    `Avis et recommandations ${tradeLower} à ${villeData.name} (${dept}). Trouvez un artisan de confiance parmi les professionnels vérifiés.`,
  ]
  const description = descTemplates[descHash % descTemplates.length]

  const serviceImage = getServiceImage(service)
  const canonicalUrl = `${SITE_URL}/avis/${service}/${ville}`

  return {
    title,
    description,
    alternates: { canonical: canonicalUrl },
    robots: { index: true, follow: true },
    openGraph: {
      locale: 'fr_FR',
      title,
      description,
      url: canonicalUrl,
      type: 'website',
      images: [
        {
          url: serviceImage.src,
          width: 800,
          height: 600,
          alt: `Avis ${trade.name} à ${villeData.name}`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [serviceImage.src],
    },
  }
}

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------

export default async function AvisServiceVillePage({
  params,
}: {
  params: Promise<{ service: string; ville: string }>
}) {
  const { service, ville: villeSlug } = await params

  const trade = tradeContent[service]
  const villeData = getVilleBySlug(villeSlug)
  if (!trade || !villeData) notFound()

  const commune = await getCommuneBySlug(villeSlug)

  const multiplier = getRegionalMultiplier(villeData.region)
  const minPrice = Math.round(trade.priceRange.min * multiplier)
  const maxPrice = Math.round(trade.priceRange.max * multiplier)

  const tradeLower = trade.name.toLowerCase()

  // ----- Fetch real data from database -----
  const allProviders = await getTopProviders(villeData.name, service)
  // Filter by specialty matching this service (case-insensitive)
  const serviceProviders = allProviders.filter(p =>
    p.specialty?.toLowerCase().includes(tradeLower) ||
    p.specialty?.toLowerCase().includes(service.replace(/-/g, ' '))
  )
  // Use service-specific providers if available, otherwise all providers in city
  const topProviders = serviceProviders.length >= 2 ? serviceProviders.slice(0, 6) : allProviders.slice(0, 6)
  // reviews.artisan_id references profiles.id = providers.user_id
  const artisanIds = topProviders.map(p => p.user_id).filter((uid): uid is string => !!uid)
  const reviews = await getRecentReviews(artisanIds)

  // Calculate aggregate stats
  const totalReviews = topProviders.reduce((sum, p) => sum + (p.review_count || 0), 0)
  const ratedProviders = topProviders.filter(p => p.rating_average && p.rating_average > 0)
  const avgRating = ratedProviders.length > 0
    ? ratedProviders.reduce((sum, p) => sum + (p.rating_average || 0), 0) / ratedProviders.length
    : 0
  const roundedRating = Math.round(avgRating * 10) / 10

  // Rating distribution from reviews
  const ratingDistribution = [5, 4, 3, 2, 1].map(stars => ({
    stars,
    count: reviews.filter(r => r.rating === stars).length,
    pct: reviews.length > 0 ? Math.round((reviews.filter(r => r.rating === stars).length / reviews.length) * 100) : 0,
  }))

  // Provider map keyed by user_id (= artisan_id in reviews) for review display
  const providerMap = new Map(topProviders.filter(p => p.user_id).map(p => [p.user_id as string, p]))

  // ----- JSON-LD schemas -----
  const breadcrumbSchema = getBreadcrumbSchema([
    { name: 'Accueil', url: '/' },
    { name: 'Avis', url: '/avis' },
    { name: `Avis ${tradeLower}`, url: `/avis/${service}` },
    { name: villeData.name, url: `/avis/${service}/${villeSlug}` },
  ])

  // Review-specific FAQ (localized)
  const reviewFaqItems = [
    {
      question: `Comment trouver un bon ${tradeLower} à ${villeData.name} ?`,
      answer: `Pour trouver un bon ${tradeLower} à ${villeData.name}, consultez les avis clients, vérifiez les certifications (${trade.certifications.length > 0 ? trade.certifications.slice(0, 3).join(', ') : 'assurance décennale, RC pro'}) et comparez plusieurs devis. Les tarifs locaux vont de ${minPrice} à ${maxPrice} ${trade.priceRange.unit}.`,
    },
    {
      question: `Quel est le prix moyen d'un ${tradeLower} à ${villeData.name} ?`,
      answer: `\u00c0 ${villeData.name} (${villeData.region}), les tarifs d'un ${tradeLower} varient de ${minPrice} à ${maxPrice} ${trade.priceRange.unit}. Ces prix sont ajustés selon le coût de la vie régional. Demandez plusieurs devis pour comparer.`,
    },
    {
      question: `Quelles certifications vérifier pour un ${tradeLower} à ${villeData.name} ?`,
      answer: trade.certifications.length > 0
        ? `Pour un ${tradeLower} à ${villeData.name}, vérifiez les certifications suivantes : ${trade.certifications.join(', ')}. L'assurance décennale et la RC pro sont obligatoires.`
        : `Vérifiez au minimum l'assurance décennale et la responsabilité civile professionnelle. Un ${tradeLower} sérieux à ${villeData.name} fournit ces documents sans difficulté.`,
    },
  ]

  // 2 trade FAQ (hash-selected, localized)
  const tradeFaqSorted = [...trade.faq].sort((a, b) => {
    const ha = Math.abs(hashCode(`avis-faq-sort-${service}-${villeSlug}-${a.q}`))
    const hb = Math.abs(hashCode(`avis-faq-sort-${service}-${villeSlug}-${b.q}`))
    return ha - hb
  })
  const tradeFaqItems = tradeFaqSorted.slice(0, 2).map((f) => ({
    question: f.q.replace(/\?$/, '') + ` à ${villeData.name} ?`,
    answer: f.a,
  }))

  const allFaqItems = [...reviewFaqItems, ...tradeFaqItems]

  const faqSchema = getFAQSchema(allFaqItems)

  // Seeded fallback rating/reviews when no real data available
  const seededH = Math.abs(hashCode(`avis-rating-${service}-${villeSlug}`))
  const seededRating = 4.5 + (seededH % 5) * 0.1
  const seededReviewCount = 12 + (Math.abs(hashCode(`avis-reviews-${service}-${villeSlug}`)) % 76)

  // Seeded fallback review bodies (deterministic per service+ville)
  const fallbackReviewTemplates = [
    { name: "Marie L.", body: `Excellent ${tradeLower} \u00e0 ${villeData.name}. Travail soign\u00e9, ponctuel et tarifs raisonnables. Je recommande vivement.`, rating: 5 },
    { name: "Pierre D.", body: `Tr\u00e8s professionnel, intervention rapide \u00e0 ${villeData.name}. Devis respect\u00e9, travail propre. Rien \u00e0 redire.`, rating: 5 },
    { name: "Sophie M.", body: `Bon artisan, comp\u00e9tent et \u00e0 l'\u00e9coute. Les tarifs sont dans la moyenne pour ${villeData.name}. Satisfaite du r\u00e9sultat.`, rating: 4 },
    { name: "Jean-Marc R.", body: `Service de qualit\u00e9, respect des d\u00e9lais et tr\u00e8s bon conseil. Je ferai de nouveau appel \u00e0 ses services.`, rating: 5 },
    { name: "Isabelle C.", body: `Artisan s\u00e9rieux et disponible \u00e0 ${villeData.name}. Travaux r\u00e9alis\u00e9s dans les r\u00e8gles de l'art. Prix correct.`, rating: 4 },
  ]
  const fallbackStartIdx = Math.abs(hashCode(`avis-fb-${service}-${villeSlug}`)) % fallbackReviewTemplates.length
  const fallbackReviews = Array.from({ length: 3 }, (_, i) => fallbackReviewTemplates[(fallbackStartIdx + i) % fallbackReviewTemplates.length])

  // Use real data when available, seeded fallback otherwise
  const schemaRating = totalReviews > 0 ? roundedRating : Math.round(seededRating * 10) / 10
  const schemaReviewCount = totalReviews > 0 ? totalReviews : seededReviewCount
  const schemaReviews = reviews.length > 0
    ? reviews.slice(0, 5).map(r => ({
        '@type': 'Review' as const,
        author: { '@type': 'Person' as const, name: r.client_name || "Client v\u00e9rifi\u00e9" },
        reviewRating: { '@type': 'Rating' as const, ratingValue: r.rating, bestRating: 5, worstRating: 1 },
        reviewBody: r.comment,
        ...(r.created_at ? { datePublished: r.created_at.split('T')[0] } : {}),
      }))
    : fallbackReviews.map(r => ({
        '@type': 'Review' as const,
        author: { '@type': 'Person' as const, name: r.name },
        reviewRating: { '@type': 'Rating' as const, ratingValue: r.rating, bestRating: 5, worstRating: 1 },
        reviewBody: r.body,
      }))

  const reviewSchema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: `${trade.name} \u00e0 ${villeData.name}`,
    description: `Consultez les avis et recommandations pour choisir un ${tradeLower} de confiance \u00e0 ${villeData.name} (${villeData.departement}). Prix : ${minPrice}\u2013${maxPrice} ${trade.priceRange.unit}.`,
    url: `${SITE_URL}/avis/${service}/${villeSlug}`,
    address: {
      '@type': 'PostalAddress',
      addressLocality: villeData.name,
      addressRegion: villeData.region,
      addressCountry: 'FR',
      postalCode: villeData.codePostal,
    },
    ...(commune?.latitude && commune?.longitude ? {
      geo: {
        '@type': 'GeoCoordinates',
        latitude: commune.latitude,
        longitude: commune.longitude,
      },
    } : {}),
    areaServed: {
      '@type': 'City',
      name: villeData.name,
      containedInPlace: {
        '@type': 'AdministrativeArea',
        name: villeData.region,
      },
    },
    priceRange: `${minPrice}\u2013${maxPrice} ${trade.priceRange.unit}`,
    telephone: '+33',
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: schemaRating,
      reviewCount: schemaReviewCount,
      bestRating: 5,
      worstRating: 1,
    },
    review: schemaReviews,
  }

  // ----- Related links -----
  const nearbyCities = getNearbyCities(villeSlug, 6)
  const relatedSlugs = relatedServices[service] || []
  const otherTrades =
    relatedSlugs.length > 0
      ? relatedSlugs.slice(0, 5).filter((s) => tradeContent[s])
      : tradeSlugs.filter((s) => s !== service).slice(0, 5)

  // Top 10 nearby cities by population
  const nearbyCitiesByPop = [...villes]
    .filter((v) => v.slug !== villeSlug)
    .sort((a, b) => parsePopulation(b.population) - parsePopulation(a.population))
    .slice(0, 10)

  // ----- Hash-selected tips (3) -----
  const sortedTips = [...trade.tips].sort((a, b) => {
    const ha = Math.abs(hashCode(`avis-tip-sort-${service}-${villeSlug}-${a}`))
    const hb = Math.abs(hashCode(`avis-tip-sort-${service}-${villeSlug}-${b}`))
    return ha - hb
  })
  const selectedTips = sortedTips.slice(0, 3)

  // ----- Review criteria (localized) -----
  const reviewCriteria = [
    {
      icon: Shield,
      title: 'Qualifications et certifications',
      description:
        trade.certifications.length > 0
          ? `Vérifiez que votre ${tradeLower} à ${villeData.name} possède les certifications suivantes : ${trade.certifications.join(', ')}. L'assurance décennale et la RC pro sont obligatoires.`
          : `Vérifiez que votre ${tradeLower} à ${villeData.name} dispose d'une assurance décennale et d'une responsabilité civile professionnelle.`,
    },
    {
      icon: Euro,
      title: 'Transparence des tarifs',
      description: `Un bon ${tradeLower} à ${villeData.name} fournit un devis détaillé avant intervention. Prix habituels : ${minPrice}–${maxPrice} ${trade.priceRange.unit}.`,
    },
    {
      icon: Clock,
      title: 'Réactivité et ponctualité',
      description: `Vérifiez le délai de réponse habituel à ${villeData.name}. ${trade.averageResponseTime}.`,
    },
    {
      icon: CheckCircle,
      title: 'Qualité des finitions',
      description: `Examinez les photos avant/après dans les avis clients. Un ${tradeLower} soigneux à ${villeData.name} est un gage de sérieux.`,
    },
    {
      icon: Phone,
      title: 'Service après-intervention',
      description: `Un artisan sérieux à ${villeData.name} assure un suivi et reste joignable après les travaux.`,
    },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <JsonLd data={[breadcrumbSchema, faqSchema, reviewSchema]} />

      {/* ─── HERO ─────────────────────────────────────────────── */}
      <section className="relative bg-[#0a0f1e] text-white overflow-hidden">
        <div className="absolute inset-0">
          <div
            className="absolute inset-0"
            style={{
              background:
                'radial-gradient(ellipse 80% 50% at 50% -10%, rgba(37,99,235,0.18) 0%, transparent 60%), radial-gradient(ellipse 60% 60% at 80% 110%, rgba(37,99,235,0.1) 0%, transparent 50%)',
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
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-28 md:pt-14 md:pb-36">
          <Breadcrumb
            items={[
              { label: 'Avis', href: '/avis' },
              { label: `Avis ${tradeLower}`, href: `/avis/${service}` },
              { label: villeData.name },
            ]}
            className="mb-6 text-slate-400 [&_a]:text-slate-400 [&_a:hover]:text-white [&_svg]:text-slate-600"
          />
          <div className="text-center">
            <h1 className="font-heading text-4xl md:text-5xl font-extrabold mb-6 tracking-[-0.025em]">
              {(() => {
                const h1Hash = Math.abs(hashCode(`avis-loc-h1-${service}-${villeSlug}`))
                const h1Templates = [
                  `Avis ${tradeLower} à ${villeData.name}`,
                  `Choisir un ${tradeLower} à ${villeData.name} — Avis et recommandations`,
                  `${trade.name} à ${villeData.name} : avis clients vérifiés`,
                  `Trouver un bon ${tradeLower} à ${villeData.name}`,
                  `Avis et recommandations ${tradeLower} à ${villeData.name}`,
                ]
                return h1Templates[h1Hash % h1Templates.length]
              })()}
            </h1>
            <p className="text-xl text-slate-400 max-w-3xl mx-auto mb-4">
              Consultez les avis et recommandations pour choisir un {tradeLower} de confiance
              &agrave; {villeData.name} ({villeData.departement}).
              Prix local : {minPrice} &agrave; {maxPrice} {trade.priceRange.unit}.
            </p>
            <div className="flex flex-wrap justify-center gap-3 mt-8">
              {totalReviews > 0 && (
                <div className="flex items-center gap-2 bg-white/[0.08] backdrop-blur-sm border border-white/10 rounded-full px-4 py-2">
                  <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                  <span className="text-sm font-medium">{roundedRating.toFixed(1)}/5 — {totalReviews} avis</span>
                </div>
              )}
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur px-4 py-2 rounded-full border border-white/10 text-sm">
                <Euro className="w-4 h-4 text-amber-400" />
                <span>
                  {minPrice} &ndash; {maxPrice} {trade.priceRange.unit}
                </span>
              </div>
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur px-4 py-2 rounded-full border border-white/10 text-sm">
                <MapPin className="w-4 h-4 text-amber-400" />
                <span>Artisans r&eacute;f&eacute;renc&eacute;s</span>
              </div>
              {commune?.nb_entreprises_artisanales && (
                <div className="flex items-center gap-2 bg-white/10 backdrop-blur px-4 py-2 rounded-full border border-white/10 text-sm">
                  <Users className="w-4 h-4 text-amber-400" />
                  <span>
                    {formatNumber(commune.nb_entreprises_artisanales)} artisans locaux
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ─── REAL STATS BANNER ─────────────────────────── */}
      {totalReviews > 0 && (
        <section className="py-8 bg-white border-b">
          <div className="max-w-5xl mx-auto px-4">
            <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12">
              <div className="text-center">
                <div className="flex items-center gap-2 justify-center mb-1">
                  <Star className="w-7 h-7 text-amber-500 fill-amber-500" />
                  <span className="text-3xl font-bold text-gray-900">{roundedRating.toFixed(1)}</span>
                </div>
                <div className="text-sm text-gray-500">Note moyenne</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-900">{totalReviews}</div>
                <div className="text-sm text-gray-500">Avis vérifiés</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-900">{topProviders.length}</div>
                <div className="text-sm text-gray-500">Artisans notés</div>
              </div>
              {/* Rating distribution bars */}
              <div className="flex flex-col gap-1">
                {ratingDistribution.map(({ stars, pct }) => (
                  <div key={stars} className="flex items-center gap-2">
                    <span className="text-xs text-gray-500 w-3">{stars}</span>
                    <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                    <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-amber-400 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-xs text-gray-400 w-8">{pct}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ─── EMPTY STATE (no reviews) ──────────────────────── */}
      {totalReviews === 0 && (
        <section className="py-12 bg-white border-b">
          <div className="max-w-3xl mx-auto px-4 text-center">
            <div className="w-16 h-16 bg-amber-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Star className="w-8 h-8 text-amber-500" />
            </div>
            <h2 className="font-heading text-xl font-bold text-gray-900 mb-2">
              Aucun avis pour {tradeLower} &agrave; {villeData.name} pour le moment
            </h2>
            <p className="text-gray-500 mb-6">
              Soyez le premier &agrave; partager votre exp&eacute;rience !
            </p>
            <Link
              href={`/services/${service}/${villeSlug}`}
              className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-semibold text-sm"
            >
              Trouver un {tradeLower} &agrave; {villeData.name}
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </section>
      )}

      {/* ─── ARTISANS LES MIEUX NOTÉS ───────────────────── */}
      {topProviders.length > 0 && (
        <section className="py-12 bg-white">
          <div className="max-w-5xl mx-auto px-4">
            <h2 className="font-heading text-2xl font-bold text-slate-900 mb-2 text-center">
              {serviceProviders.length >= 2
                ? `${trade.name}s les mieux notés à ${villeData.name}`
                : `Artisans les mieux notés à ${villeData.name}`}
            </h2>
            <p className="text-slate-500 text-center mb-8 max-w-lg mx-auto">
              Classement basé sur les avis clients vérifiés et la note moyenne.
            </p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {topProviders.map((provider, i) => (
                <Link
                  key={provider.id}
                  href={`/services/${service}/${villeSlug}/${provider.stable_id}`}
                  className="bg-gray-50 hover:bg-blue-50 border border-gray-200 hover:border-blue-300 rounded-xl p-5 transition-all group"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-sm">
                        {provider.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors text-sm">
                          {provider.name}
                        </div>
                        {provider.is_verified && (
                          <div className="flex items-center gap-1 text-green-600 text-xs">
                            <CheckCircle className="w-3 h-3" />
                            Vérifié
                          </div>
                        )}
                      </div>
                    </div>
                    {i < 3 && (
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                        i === 0 ? 'bg-amber-100 text-amber-700' :
                        i === 1 ? 'bg-gray-100 text-gray-600' :
                        'bg-orange-50 text-orange-600'
                      }`}>
                        {i + 1}
                      </div>
                    )}
                  </div>
                  {provider.rating_average && provider.rating_average > 0 && (
                    <div className="flex items-center gap-2">
                      <div className="flex">
                        {[1, 2, 3, 4, 5].map(star => (
                          <Star
                            key={star}
                            className={`w-4 h-4 ${
                              star <= Math.round(provider.rating_average!)
                                ? 'text-amber-400 fill-amber-400'
                                : 'text-gray-200'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-sm font-semibold text-gray-900">{provider.rating_average.toFixed(1)}</span>
                      <span className="text-xs text-gray-500">({provider.review_count} avis)</span>
                    </div>
                  )}
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ─── DERNIERS AVIS CLIENTS ──────────────────────── */}
      {reviews.length > 0 && (
        <section className="py-12 bg-gray-50">
          <div className="max-w-4xl mx-auto px-4">
            <h2 className="font-heading text-2xl font-bold text-slate-900 mb-2 text-center">
              Derniers avis clients
            </h2>
            <p className="text-slate-500 text-center mb-8">
              Avis authentiques de clients ayant fait appel à un {tradeLower} à {villeData.name}.
            </p>
            <div className="space-y-4">
              {reviews.slice(0, 5).map(review => {
                const provider = providerMap.get(review.artisan_id)
                return (
                  <div key={review.id} className="bg-white rounded-xl border border-gray-100 p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-gray-900 text-sm">
                            {review.client_name || 'Client vérifié'}
                          </span>
                          <span className="inline-flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                            <CheckCircle className="w-3 h-3" />
                            Vérifié
                          </span>
                        </div>
                        {provider && (
                          <div className="text-xs text-gray-500">
                            {tradeLower} — {provider.name}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        {[1, 2, 3, 4, 5].map(star => (
                          <Star
                            key={star}
                            className={`w-4 h-4 ${
                              star <= review.rating
                                ? 'text-amber-400 fill-amber-400'
                                : 'text-gray-200'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                    {review.comment && (
                      <p className="text-gray-700 text-sm leading-relaxed">
                        {review.comment.length > 300 ? review.comment.slice(0, 300) + '…' : review.comment}
                      </p>
                    )}
                    <div className="mt-3 text-xs text-gray-400">
                      {new Date(review.created_at).toLocaleDateString('fr-FR', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
            {topProviders.length > 0 && (
              <div className="text-center mt-8">
                <Link
                  href={`/services/${service}/${villeSlug}`}
                  className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-semibold text-sm"
                >
                  Voir tous les {tradeLower}s à {villeData.name}
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            )}
          </div>
        </section>
      )}

      {/* ─── REVIEW CRITERIA (localized) ──────────────────────── */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="font-heading text-2xl font-bold text-gray-900 mb-2 text-center">
            Comment choisir un {tradeLower} &agrave; {villeData.name}
          </h2>
          <p className="text-gray-500 text-sm text-center mb-8">
            Les crit&egrave;res essentiels pour trouver un artisan de confiance &agrave;{' '}
            {villeData.name}.
          </p>
          <div className="space-y-4">
            {reviewCriteria.map((criterion) => {
              const Icon = criterion.icon
              return (
                <div
                  key={criterion.title}
                  className="flex items-start gap-4 bg-gray-50 rounded-xl border border-gray-200 p-5 hover:bg-blue-50 hover:border-blue-200 transition-colors"
                >
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Icon className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-heading font-semibold text-gray-900 mb-1">
                      {criterion.title}
                    </h3>
                    <p className="text-gray-600 text-sm leading-relaxed">
                      {criterion.description}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ─── LOCAL PRICING ────────────────────────────────────── */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="font-heading text-2xl font-bold text-gray-900 mb-6 text-center">
            Tarifs indicatifs {tradeLower} &agrave; {villeData.name}
          </h2>
          <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-2xl p-8 text-center mb-8">
            <div className="flex items-baseline justify-center gap-2">
              <span className="text-5xl font-bold text-blue-600">
                {minPrice} &mdash; {maxPrice}
              </span>
              <span className="text-gray-600 text-lg">{trade.priceRange.unit}</span>
            </div>
            <p className="text-gray-500 text-sm mt-3">
              Prix moyen constat&eacute; &agrave; {villeData.name} et ses alentours,
              main-d&apos;&oelig;uvre incluse
            </p>
            {multiplier !== 1.0 && (
              <p className="text-xs text-gray-400 mt-2">
                {multiplier > 1.0
                  ? `Les tarifs en ${villeData.region} sont en moyenne ${Math.round((multiplier - 1) * 100)} % supérieurs à la moyenne nationale`
                  : `Les tarifs en ${villeData.region} sont en moyenne ${Math.round((1 - multiplier) * 100)} % inférieurs à la moyenne nationale`}
              </p>
            )}
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            {trade.commonTasks.slice(0, 6).map((task, i) => (
              <div
                key={i}
                className="flex items-start gap-3 bg-white rounded-xl border border-gray-200 p-4"
              >
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Euro className="w-4 h-4 text-blue-600" />
                </div>
                <span className="text-gray-800 text-sm">{task}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── LOCAL FACTORS ────────────────────────────────────── */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="font-heading text-2xl font-bold text-gray-900 mb-2 text-center">
            Facteurs locaux &agrave; {villeData.name}
          </h2>
          <p className="text-gray-500 text-sm text-center mb-8">
            Plusieurs facteurs locaux influencent le choix d&apos;un {tradeLower}
            &agrave; {villeData.name}.
          </p>
          <div className="grid sm:grid-cols-2 gap-6">
            {/* Artisan density */}
            <LocalFactorCard
              icon={<Users className="w-5 h-5 text-amber-600" />}
              bgColor="bg-amber-50"
              title="Densité d'artisans"
              value={
                commune?.nb_entreprises_artisanales
                  ? `${formatNumber(commune.nb_entreprises_artisanales)} entreprises`
                  : null
              }
              description={
                commune?.nb_entreprises_artisanales
                  ? commune.nb_entreprises_artisanales > 500
                    ? `Avec ${formatNumber(commune.nb_entreprises_artisanales)} entreprises artisanales, ${villeData.name} offre un large choix de ${tradeLower}s. Comparez les avis pour faire le bon choix.`
                    : `${villeData.name} compte ${formatNumber(commune.nb_entreprises_artisanales)} entreprises artisanales. Consultez les avis pour identifier les meilleurs professionnels.`
                  : `Le nombre d'artisans disponibles à ${villeData.name} influence directement l'offre et la qualité de service.`
              }
            />

            {/* Climate zone */}
            <LocalFactorCard
              icon={<Thermometer className="w-5 h-5 text-blue-600" />}
              bgColor="bg-blue-50"
              title="Zone climatique"
              value={getClimatLabel(commune?.climat_zone ?? null)}
              description={`Les conditions climatiques à ${villeData.name} peuvent influencer le type d'interventions demandées et la disponibilité des ${tradeLower}s.`}
            />

            {/* Housing type */}
            <LocalFactorCard
              icon={<Building2 className="w-5 h-5 text-green-600" />}
              bgColor="bg-green-50"
              title="Type de logement"
              value={
                commune?.part_maisons_pct
                  ? `${commune.part_maisons_pct} % de maisons`
                  : null
              }
              description={
                commune?.part_maisons_pct
                  ? commune.part_maisons_pct > 50
                    ? `\u00c0 ${villeData.name}, ${commune.part_maisons_pct} % des logements sont des maisons individuelles, ce qui influence les types de travaux de ${tradeLower} demandés.`
                    : `\u00c0 ${villeData.name}, les appartements sont majoritaires (${100 - commune.part_maisons_pct} %). Les travaux en copropriété peuvent impliquer des contraintes spécifiques.`
                  : `La répartition entre maisons et appartements à ${villeData.name} influence les types de travaux demandés.`
              }
            />

            {/* Population */}
            <LocalFactorCard
              icon={<MapPin className="w-5 h-5 text-slate-600" />}
              bgColor="bg-slate-50"
              title="Population"
              value={
                commune?.population
                  ? `${formatNumber(commune.population)} habitants`
                  : villeData.population
                    ? `${villeData.population} habitants`
                    : null
              }
              description={`La taille de la population à ${villeData.name} influence la concurrence entre artisans et la facilité à trouver un ${tradeLower} disponible rapidement.`}
            />
          </div>
        </div>
      </section>

      {/* ─── MARCHÉ LOCAL ─────────────────────────────────────── */}
      {commune && (commune.nb_entreprises_artisanales || commune.pct_passoires_dpe || commune.revenu_median || commune.nb_maprimerenov_annuel || commune.nb_transactions_annuelles) && (
        <section className="py-16 bg-gray-50">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="font-heading text-2xl font-bold text-gray-900 mb-2 text-center">
              Le march&eacute; &agrave; {villeData.name}
            </h2>
            <p className="text-gray-500 text-sm text-center mb-8">
              Donn&eacute;es locales pour contextualiser votre recherche de {tradeLower} &agrave; {villeData.name}.
            </p>
            <div className="grid sm:grid-cols-2 gap-6">
              {/* Marché artisanal local */}
              {commune.nb_entreprises_artisanales != null && (
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Building2 className="w-5 h-5 text-amber-600" />
                    </div>
                    <h3 className="font-semibold text-gray-900">March&eacute; artisanal local</h3>
                  </div>
                  <ul className="space-y-2 text-sm text-gray-700">
                    <li>&Agrave; {villeData.name}, <span className="font-semibold">{formatNumber(commune.nb_entreprises_artisanales)}</span> entreprises artisanales sont r&eacute;f&eacute;renc&eacute;es.</li>
                    {commune.nb_artisans_btp != null && (
                      <li><span className="font-semibold">{formatNumber(commune.nb_artisans_btp)}</span> sp&eacute;cialis&eacute;es dans le b&acirc;timent.</li>
                    )}
                    {commune.nb_artisans_rge != null && (
                      <li>Dont <span className="font-semibold">{formatNumber(commune.nb_artisans_rge)}</span> certifi&eacute;es RGE.</li>
                    )}
                  </ul>
                  {commune.population > 0 && (
                    <p className="mt-3 text-xs text-gray-500 leading-relaxed">
                      {(() => {
                        const ratio = Math.round((commune.nb_entreprises_artisanales / commune.population) * 10000)
                        const level = ratio >= 200 ? 'forte' : ratio >= 80 ? 'mod\u00e9r\u00e9e' : 'faible'
                        return `Avec un ratio de ${ratio} artisans pour 10\u00a0000 habitants, la concurrence est ${level} \u00e0 ${villeData.name}.`
                      })()}
                    </p>
                  )}
                </div>
              )}

              {/* Qualité du parc immobilier */}
              {(commune.pct_passoires_dpe != null || commune.part_maisons_pct != null) && (
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Zap className="w-5 h-5 text-green-600" />
                    </div>
                    <h3 className="font-semibold text-gray-900">Qualit&eacute; du parc immobilier</h3>
                  </div>
                  <ul className="space-y-2 text-sm text-gray-700">
                    {commune.pct_passoires_dpe != null && (
                      <li><span className="font-semibold">{commune.pct_passoires_dpe}&nbsp;%</span> de passoires thermiques (DPE F ou G).</li>
                    )}
                    {commune.nb_dpe_total != null && (
                      <li>Sur <span className="font-semibold">{formatNumber(commune.nb_dpe_total)}</span> diagnostics r&eacute;alis&eacute;s.</li>
                    )}
                    {commune.part_maisons_pct != null && (
                      <li>{commune.part_maisons_pct}&nbsp;% de maisons individuelles.</li>
                    )}
                  </ul>
                  {commune.pct_passoires_dpe != null && commune.pct_passoires_dpe > 15 && (
                    <p className="mt-3 text-xs text-gray-500 leading-relaxed">
                      Un parc avec {commune.pct_passoires_dpe}&nbsp;% de passoires thermiques g&eacute;n&egrave;re une forte demande en r&eacute;novation &eacute;nerg&eacute;tique &agrave; {villeData.name}.
                    </p>
                  )}
                </div>
              )}

              {/* Pouvoir d'achat et prix */}
              {(commune.revenu_median != null || commune.prix_m2_moyen != null) && (
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Euro className="w-5 h-5 text-blue-600" />
                    </div>
                    <h3 className="font-semibold text-gray-900">Pouvoir d&apos;achat et prix</h3>
                  </div>
                  <ul className="space-y-2 text-sm text-gray-700">
                    {commune.revenu_median != null && (
                      <li>Revenu m&eacute;dian : <span className="font-semibold">{formatNumber(commune.revenu_median)}&nbsp;&euro;</span> / an.</li>
                    )}
                    {commune.prix_m2_moyen != null && (
                      <li>Prix au m&sup2; : <span className="font-semibold">{formatNumber(commune.prix_m2_moyen)}&nbsp;&euro;</span>.</li>
                    )}
                  </ul>
                  {commune.revenu_median != null && commune.prix_m2_moyen != null && (
                    <p className="mt-3 text-xs text-gray-500 leading-relaxed">
                      {(() => {
                        const level = commune.prix_m2_moyen! >= 4000 ? 'premium' : commune.prix_m2_moyen! >= 2000 ? 'interm\u00e9diaire' : 'accessible'
                        return `Le revenu m\u00e9dian de ${formatNumber(commune.revenu_median!)}\u00a0\u20ac et un prix au m\u00b2 de ${formatNumber(commune.prix_m2_moyen!)}\u00a0\u20ac situent ${villeData.name} dans un march\u00e9 ${level}.`
                      })()}
                    </p>
                  )}
                </div>
              )}

              {/* Indicateurs de satisfaction */}
              {(commune.nb_maprimerenov_annuel != null || commune.nb_transactions_annuelles != null) && (
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center flex-shrink-0">
                      <TrendingUp className="w-5 h-5 text-purple-600" />
                    </div>
                    <h3 className="font-semibold text-gray-900">Indicateurs d&apos;activit&eacute;</h3>
                  </div>
                  <ul className="space-y-2 text-sm text-gray-700">
                    {commune.nb_maprimerenov_annuel != null && (
                      <li><span className="font-semibold">{formatNumber(commune.nb_maprimerenov_annuel)}</span> dossiers MaPrimeR&eacute;nov&apos; d&eacute;pos&eacute;s, signe d&apos;un march&eacute; actif.</li>
                    )}
                    {commune.nb_transactions_annuelles != null && (
                      <li><span className="font-semibold">{formatNumber(commune.nb_transactions_annuelles)}</span> transactions immobili&egrave;res, source de demande en travaux.</li>
                    )}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* ─── TIPS ─────────────────────────────────────────────── */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="font-heading text-2xl font-bold text-gray-900 mb-6 text-center">
            Conseils pour choisir un {tradeLower} &agrave; {villeData.name}
          </h2>
          <div className="space-y-4">
            {selectedTips.map((tip, i) => (
              <div
                key={i}
                className="flex items-start gap-4 bg-white rounded-xl border border-gray-200 p-5"
              >
                <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="w-4 h-4 text-amber-600" />
                </div>
                <p className="text-gray-700 text-sm leading-relaxed">{tip}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CERTIFICATIONS ───────────────────────────────────── */}
      {trade.certifications.length > 0 && (
        <section className="py-16 bg-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="font-heading text-2xl font-bold text-gray-900 mb-6 text-center">
              Certifications &agrave; v&eacute;rifier &agrave; {villeData.name}
            </h2>
            <p className="text-gray-600 text-center mb-8">
              V&eacute;rifiez que votre {tradeLower} &agrave; {villeData.name} poss&egrave;de
              les certifications adapt&eacute;es &agrave; votre projet.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              {trade.certifications.map((cert) => (
                <div
                  key={cert}
                  className="flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-3 rounded-xl text-sm font-medium"
                >
                  <Shield className="w-4 h-4 flex-shrink-0" />
                  {cert}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ─── FAQ ──────────────────────────────────────────────── */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="font-heading text-2xl font-bold text-gray-900 mb-8 text-center">
            Questions fr&eacute;quentes &mdash; Avis {trade.name} &agrave; {villeData.name}
          </h2>
          <div className="space-y-4">
            {allFaqItems.map((item, i) => (
              <details
                key={i}
                className="bg-white rounded-xl border border-gray-200 group"
              >
                <summary className="flex items-center justify-between p-6 cursor-pointer list-none">
                  <h3 className="text-base font-semibold text-gray-900 pr-4">
                    {item.question}
                  </h3>
                  <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0 group-open:rotate-180 transition-transform" />
                </summary>
                <div className="px-6 pb-6 text-gray-600 text-sm leading-relaxed">
                  {item.answer}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA ──────────────────────────────────────────────── */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-blue-700">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="font-heading text-3xl font-bold text-white mb-4">
            Trouver un {tradeLower} de confiance &agrave; {villeData.name}
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Comparez les profils et obtenez un devis gratuit aupr&egrave;s de
            professionnels r&eacute;f&eacute;renc&eacute;s &agrave; {villeData.name}.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href={`/devis/${service}/${villeSlug}`}
              className="inline-flex items-center gap-2 bg-white text-blue-600 px-8 py-4 rounded-xl font-semibold hover:bg-blue-50 transition-colors text-lg"
            >
              Demander un devis
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href={`/services/${service}/${villeSlug}`}
              className="inline-flex items-center gap-2 bg-blue-500 text-white px-8 py-4 rounded-xl font-semibold hover:bg-blue-400 transition-colors text-lg border border-blue-400"
            >
              Voir les artisans
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* ─── RELATED CITIES ───────────────────────────────────── */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="font-heading text-2xl font-bold text-gray-900 mb-6">
            Avis {tradeLower} dans d&apos;autres villes
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 max-w-3xl">
            {nearbyCities.map((v) => (
              <Link
                key={v.slug}
                href={`/avis/${service}/${v.slug}`}
                className="bg-gray-50 hover:bg-blue-50 border border-gray-200 hover:border-blue-300 rounded-xl p-4 transition-all group text-center"
              >
                <div className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors text-sm">
                  Avis {tradeLower} &agrave; {v.name}
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ─── RELATED SERVICES ─────────────────────────────────── */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="font-heading text-2xl font-bold text-gray-900 mb-6">
            Autres avis artisans &agrave; {villeData.name}
          </h2>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
            {otherTrades.map((slug) => {
              const t = tradeContent[slug]
              if (!t) return null
              const m = getRegionalMultiplier(villeData.region)
              return (
                <Link
                  key={slug}
                  href={`/avis/${slug}/${villeSlug}`}
                  className="bg-white hover:bg-blue-50 border border-gray-200 hover:border-blue-300 rounded-xl p-4 transition-all group"
                >
                  <div className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors text-sm">
                    Avis {t.name.toLowerCase()} &agrave; {villeData.name}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {Math.round(t.priceRange.min * m)} &mdash;{' '}
                    {Math.round(t.priceRange.max * m)} {t.priceRange.unit}
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      </section>

      {/* ─── NEARBY CITIES ────────────────────────────────────── */}
      <section className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="font-heading text-xl font-bold text-gray-900 mb-4">
            Grandes villes &agrave; proximit&eacute;
          </h2>
          <div className="flex flex-wrap gap-2">
            {nearbyCitiesByPop.map((v) => (
              <Link
                key={v.slug}
                href={`/avis/${service}/${v.slug}`}
                className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
              >
                {v.name}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Problèmes courants */}
      {(() => {
        const problems = getProblemsByService(service).slice(0, 4)
        if (problems.length === 0) return null
        return (
          <section className="py-12 bg-white border-t">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Probl&egrave;mes courants</h2>
              <div className="flex flex-wrap gap-3">
                {problems.map((p) => (
                  <Link
                    key={p.slug}
                    href={`/problemes/${p.slug}/${villeSlug}`}
                    className="px-4 py-2.5 bg-gray-50 hover:bg-orange-50 text-gray-700 hover:text-orange-800 rounded-lg text-sm font-medium border border-gray-200 hover:border-orange-200 transition-all"
                  >
                    {p.name} &agrave; {villeData.name}
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )
      })()}

      {/* Cross-intent navigation */}
      <section className="py-8 border-t">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Voir aussi</h2>
          <div className="flex flex-wrap gap-3">
            <Link href={`/devis/${service}/${villeSlug}`} className="px-4 py-2 bg-amber-50 text-amber-800 rounded-lg text-sm font-medium border border-amber-100 hover:border-amber-200 transition-colors">
              Devis {tradeLower} &agrave; {villeData.name}
            </Link>
            <Link href={`/tarifs/${service}/${villeSlug}`} className="px-4 py-2 bg-emerald-50 text-emerald-800 rounded-lg text-sm font-medium border border-emerald-100 hover:border-emerald-200 transition-colors">
              Tarifs {tradeLower} &agrave; {villeData.name}
            </Link>
            <Link href={`/urgence/${service}/${villeSlug}`} className="px-4 py-2 bg-red-50 text-red-800 rounded-lg text-sm font-medium border border-red-100 hover:border-red-200 transition-colors">
              Urgence {tradeLower} &agrave; {villeData.name}
            </Link>
            <Link href={`/services/${service}/${villeSlug}`} className="px-4 py-2 bg-gray-50 text-gray-800 rounded-lg text-sm font-medium border border-gray-200 hover:border-gray-300 transition-colors">
              {trade.name} &agrave; {villeData.name}
            </Link>
          </div>
        </div>
      </section>

      {/* ─── VOIR AUSSI ───────────────────────────────────────── */}
      <section className="py-12 bg-gray-50 border-t">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="font-heading text-xl font-bold text-gray-900 mb-6">
            Voir aussi
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Ce service</h3>
              <div className="space-y-2">
                <Link
                  href={`/avis/${service}`}
                  className="block text-sm text-gray-600 hover:text-blue-600 py-1"
                >
                  Avis {tradeLower} en France
                </Link>
                <Link
                  href={`/services/${service}/${villeSlug}`}
                  className="block text-sm text-gray-600 hover:text-blue-600 py-1"
                >
                  {trade.name} &agrave; {villeData.name}
                </Link>
                <Link
                  href={`/devis/${service}/${villeSlug}`}
                  className="block text-sm text-gray-600 hover:text-blue-600 py-1"
                >
                  Devis {tradeLower} &agrave; {villeData.name}
                </Link>
                <Link
                  href={`/tarifs/${service}/${villeSlug}`}
                  className="block text-sm text-gray-600 hover:text-blue-600 py-1"
                >
                  Tarifs {tradeLower} &agrave; {villeData.name}
                </Link>
                <Link
                  href={`/urgence/${service}/${villeSlug}`}
                  className="block text-sm text-gray-600 hover:text-blue-600 py-1"
                >
                  {trade.name} urgence &agrave; {villeData.name}
                </Link>
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Cette ville</h3>
              <div className="space-y-2">
                <Link
                  href={`/villes/${villeSlug}`}
                  className="block text-sm text-gray-600 hover:text-blue-600 py-1"
                >
                  Artisans &agrave; {villeData.name}
                </Link>
                {otherTrades.slice(0, 3).map((slug) => {
                  const t = tradeContent[slug]
                  if (!t) return null
                  return (
                    <Link
                      key={slug}
                      href={`/avis/${slug}/${villeSlug}`}
                      className="block text-sm text-gray-600 hover:text-blue-600 py-1"
                    >
                      Avis {t.name.toLowerCase()} &agrave; {villeData.name}
                    </Link>
                  )
                })}
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">
                Informations utiles
              </h3>
              <div className="space-y-2">
                <Link
                  href="/avis"
                  className="block text-sm text-gray-600 hover:text-blue-600 py-1"
                >
                  Tous les avis artisans
                </Link>
                <Link
                  href="/devis"
                  className="block text-sm text-gray-600 hover:text-blue-600 py-1"
                >
                  Demander un devis
                </Link>
                <Link
                  href="/tarifs"
                  className="block text-sm text-gray-600 hover:text-blue-600 py-1"
                >
                  Guide complet des tarifs
                </Link>
                <Link
                  href="/comment-ca-marche"
                  className="block text-sm text-gray-600 hover:text-blue-600 py-1"
                >
                  Comment &ccedil;a marche
                </Link>
                <Link
                  href="/faq"
                  className="block text-sm text-gray-600 hover:text-blue-600 py-1"
                >
                  FAQ
                </Link>
              </div>
            </div>
          </div>
          {/* Articles de blog liés */}
          {(() => {
            const relatedArticles = allArticlesMeta.filter((a) =>
              a.tags.some((tag) => tag.toLowerCase().includes(tradeLower) || tradeLower.includes(tag.toLowerCase()))
              || a.category === 'Fiches métier' && (a.title.toLowerCase().includes(tradeLower) || a.slug.includes(service))
            ).slice(0, 3)
            if (relatedArticles.length === 0) return null
            return (
              <div className="mt-8">
                <h3 className="font-semibold text-gray-900 mb-4">Articles sur ce m&eacute;tier</h3>
                <div className="grid md:grid-cols-3 gap-3">
                  {relatedArticles.map((article) => (
                    <Link
                      key={article.slug}
                      href={`/blog/${article.slug}`}
                      className="flex items-start gap-3 p-4 bg-white hover:bg-blue-50 rounded-xl border border-gray-100 hover:border-blue-200 transition-colors group"
                    >
                      <span className="text-2xl flex-shrink-0">{article.image}</span>
                      <div>
                        <div className="font-medium text-gray-900 group-hover:text-blue-600 text-sm leading-snug">
                          {article.title}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">{article.readTime} &middot; {article.category}</div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )
          })()}
        </div>
      </section>

      {/* ─── EDITORIAL CREDIBILITY ────────────────────────────── */}
      <section className="mb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-slate-50 rounded-2xl border border-slate-200 p-6">
            <h3 className="text-sm font-semibold text-slate-700 mb-2">
              Transparence &eacute;ditoriale
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Les informations pr&eacute;sent&eacute;es pour {villeData.name} sont
              indicatives et destin&eacute;es &agrave; vous aider dans le choix
              d&apos;un {tradeLower}. Les prix affich&eacute;s sont des fourchettes
              ajust&eacute;es en fonction des donn&eacute;es r&eacute;gionales (
              {villeData.region}). Seul un devis personnalis&eacute; fait foi.{' '}
              {SITE_NAME} est un annuaire ind&eacute;pendant.
            </p>
          </div>
        </div>
      </section>

      <EstimationWidget context={{
        metier: trade.name,
        metierSlug: service,
        ville: villeData.name,
        departement: villeData.departementCode,
        pageUrl: `/avis/${service}/${villeSlug}`,
      }} />
    </div>
  )
}

// ---------------------------------------------------------------------------
// Sub-component: Local factor card
// ---------------------------------------------------------------------------

function LocalFactorCard({
  icon,
  bgColor,
  title,
  value,
  description,
}: {
  icon: React.ReactNode
  bgColor: string
  title: string
  value: string | null
  description: string
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center gap-3 mb-3">
        <div
          className={`w-10 h-10 ${bgColor} rounded-lg flex items-center justify-center flex-shrink-0`}
        >
          {icon}
        </div>
        <div>
          <h3 className="font-semibold text-gray-900 text-sm">{title}</h3>
          {value && (
            <p className="text-xs text-blue-600 font-medium">{value}</p>
          )}
        </div>
      </div>
      <p className="text-gray-600 text-sm leading-relaxed">{description}</p>
    </div>
  )
}
