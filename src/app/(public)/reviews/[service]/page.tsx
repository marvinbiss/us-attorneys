import { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import {
  ArrowRight,
  CheckCircle,
  Euro,
  Shield,
  Clock,
  ChevronDown,
  Phone,
  Star,
} from 'lucide-react'
import Breadcrumb from '@/components/Breadcrumb'
import JsonLd from '@/components/JsonLd'
import { getBreadcrumbSchema, getFAQSchema } from '@/lib/seo/jsonld'
import { SITE_URL } from '@/lib/seo/config'
import { hashCode } from '@/lib/seo/location-content'
import { tradeContent, getTradesSlugs } from '@/lib/data/trade-content'
import { SPECIALTY_TO_PRACTICE_AREAS } from '@/lib/supabase'
import { cities } from '@/lib/data/usa'
import { getServiceImage } from '@/lib/data/images'
import { relatedServices } from '@/lib/constants/navigation'

export const revalidate = 86400 // 24h

const IS_BUILD = process.env.NEXT_BUILD_SKIP_DB === '1'
const tradeSlugs = getTradesSlugs()

export function generateStaticParams() {
  return tradeSlugs.map((service) => ({ service }))
}

function truncateTitle(title: string, maxLen = 42): string {
  if (title.length <= maxLen) return title
  return title.slice(0, maxLen - 1).replace(/\s+\S*$/, '') + '…'
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ service: string }>
}): Promise<Metadata> {
  const { service } = await params
  const trade = tradeContent[service]
  if (!trade) return {}

  const tradeLower = trade.name.toLowerCase()

  const titleHash = Math.abs(hashCode(`avis-title-${service}`))
  const titleTemplates = [
    `Avis ${tradeLower} — Comment bien choisir`,
    `Avis ${tradeLower} : conseils et tarifs`,
    `Avis ${tradeLower} vérifiés — Guide`,
    `${trade.name} : avis et recommandations`,
    `Avis ${tradeLower} de confiance — Comparez`,
  ]
  const title = truncateTitle(titleTemplates[titleHash % titleTemplates.length])

  const descHash = Math.abs(hashCode(`avis-desc-${service}`))
  const descTemplates = [
    `Consultez les avis sur les ${tradeLower}s. Comparez les profils, vérifiez les certifications et choisissez un professionnel de confiance. ${trade.priceRange.min}–${trade.priceRange.max} ${trade.priceRange.unit}.`,
    `Avis ${tradeLower} : comment bien choisir ? Tarifs ${trade.priceRange.min}–${trade.priceRange.max} ${trade.priceRange.unit}, certifications, conseils et retours clients vérifiés.`,
    `Trouvez un ${tradeLower} de confiance grâce aux avis vérifiés. Prix : ${trade.priceRange.min} à ${trade.priceRange.max} ${trade.priceRange.unit}. Comparaison gratuite.`,
  ]
  const description = descTemplates[descHash % descTemplates.length]

  const serviceImage = getServiceImage(service)

  return {
    title,
    description,
    alternates: { canonical: `${SITE_URL}/reviews/${service}` },
    openGraph: {
      locale: 'fr_FR',
      title,
      description,
      url: `${SITE_URL}/reviews/${service}`,
      type: 'website',
      images: [
        {
          url: serviceImage.src,
          width: 800,
          height: 600,
          alt: `Avis ${trade.name}`,
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

interface ServiceAvisProvider {
  id: string
  name: string
  slug: string
  stable_id: string
  address_city: string | null
  rating_average: number | null
  review_count: number | null
  is_verified: boolean
  specialty: string | null
}

interface ServiceAvisReview {
  id: string
  rating: number
  comment: string | null
  client_name: string | null
  created_at: string
  attorney_id: string
}

async function getServiceStats(specialtySlug: string) {
  if (IS_BUILD) return { providers: [] as ServiceAvisProvider[], reviews: [] as ServiceAvisReview[], totalReviews: 0, avgRating: 0 }

  const specialties = SPECIALTY_TO_PRACTICE_AREAS[specialtySlug]
  if (!specialties || specialties.length === 0) {
    return { providers: [] as ServiceAvisProvider[], reviews: [] as ServiceAvisReview[], totalReviews: 0, avgRating: 0 }
  }

  try {
    const { createAdminClient } = await import('@/lib/supabase/admin')
    const supabase = createAdminClient()

    // Get top providers for this specific service by specialty
    const { data: providers } = await supabase
      .from('attorneys')
      .select('id, user_id, name, slug, stable_id, address_city, rating_average, review_count, is_verified, specialty')
      .eq('is_active', true)
      .in('specialty', specialties)
      .gt('review_count', 0)
      .order('rating_average', { ascending: false, nullsFirst: false })
      .order('review_count', { ascending: false })
      .limit(6)

    if (!providers || providers.length === 0) {
      return { providers: [] as ServiceAvisProvider[], reviews: [] as ServiceAvisReview[], totalReviews: 0, avgRating: 0 }
    }

    const topProviders = providers

    const totalReviews = topProviders.reduce((sum, p) => sum + (p.review_count || 0), 0)
    const ratedProviders = topProviders.filter(p => p.rating_average && p.rating_average > 0)
    const avgRating = ratedProviders.length > 0
      ? ratedProviders.reduce((sum, p) => sum + (p.rating_average || 0), 0) / ratedProviders.length
      : 0

    // Fetch recent reviews for these providers
    // reviews.attorney_id references profiles.id = providers.user_id
    const attorneyIds = topProviders.map(p => p.user_id).filter((uid): uid is string => !!uid)
    let reviews: ServiceAvisReview[] = []
    if (attorneyIds.length > 0) {
      const { data: reviewData } = await supabase
        .from('reviews')
        .select('id, rating, comment, client_name, created_at, attorney_id')
        .in('attorney_id', attorneyIds)
        .eq('status', 'published')
        .not('comment', 'is', null)
        .order('rating', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(6)

      if (reviewData) reviews = reviewData as ServiceAvisReview[]
    }

    return {
      providers: topProviders as ServiceAvisProvider[],
      reviews,
      totalReviews,
      avgRating: Math.round(avgRating * 10) / 10,
    }
  } catch {
    return { providers: [] as ServiceAvisProvider[], reviews: [] as ServiceAvisReview[], totalReviews: 0, avgRating: 0 }
  }
}

const topCities = cities.slice(0, 20)

export default async function AvisServicePage({
  params,
}: {
  params: Promise<{ service: string }>
}) {
  const { service } = await params

  const trade = tradeContent[service]
  if (!trade) notFound()

  const tradeLower = trade.name.toLowerCase()

  const serviceStats = await getServiceStats(service)

  // JSON-LD schemas
  const breadcrumbSchema = getBreadcrumbSchema([
    { name: 'Accueil', url: '/' },
    { name: 'Avis', url: '/reviews' },
    { name: `Avis ${tradeLower}`, url: `/reviews/${service}` },
  ])

  // Merge trade FAQ + review-specific FAQ
  const reviewFaqItems = [
    {
      question: `Comment choisir un bon ${tradeLower} ?`,
      answer: `Pour choisir un bon ${tradeLower}, vérifiez ses certifications (${trade.certifications.length > 0 ? trade.certifications.slice(0, 3).join(', ') : 'assurance décennale, RC pro'}), comparez les avis clients et demandez plusieurs devis. Les tarifs habituels vont de ${trade.priceRange.min} à ${trade.priceRange.max} ${trade.priceRange.unit}.`,
    },
    {
      question: `Combien coûte un ${tradeLower} ?`,
      answer: `Les tarifs d’un ${tradeLower} varient généralement de ${trade.priceRange.min} à ${trade.priceRange.max} ${trade.priceRange.unit}, selon la complexité de l’intervention et votre région. Demandez plusieurs devis pour comparer.`,
    },
    {
      question: `Quelles certifications vérifier pour un ${tradeLower} ?`,
      answer: trade.certifications.length > 0
        ? `Pour un ${tradeLower}, les certifications à vérifier sont : ${trade.certifications.join(', ')}. Vérifiez également l’assurance décennale et la responsabilité civile professionnelle.`
        : `Vérifiez au minimum l’assurance décennale et la responsabilité civile professionnelle. Un ${tradeLower} sérieux fournit ces documents sans difficulté.`,
    },
  ]

  const tradeFaqItems = trade.faq
    .slice(0, trade.faq.length)
    .sort((a, b) => {
      const ha = Math.abs(hashCode(`faq-sort-${service}-${a.q}`))
      const hb = Math.abs(hashCode(`faq-sort-${service}-${b.q}`))
      return ha - hb
    })
    .slice(0, 3)

  const allFaqItems = [
    ...tradeFaqItems.map((f) => ({ question: f.q, answer: f.a })),
    ...reviewFaqItems,
  ]

  const faqSchema = getFAQSchema(allFaqItems)

  const serviceSchema = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: `${trade.name} en France`,
    description: `Consultez les avis et recommandations pour choisir un ${tradeLower} de confiance. ${trade.priceRange.min} à ${trade.priceRange.max} ${trade.priceRange.unit}. Artisans référencés.`,
    url: `${SITE_URL}/reviews/${service}`,
    areaServed: {
      '@type': 'Country',
      name: 'France',
    },
    priceRange: `${trade.priceRange.min}–${trade.priceRange.max} ${trade.priceRange.unit}`,
    ...(serviceStats.totalReviews > 0 ? {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: serviceStats.avgRating,
        reviewCount: serviceStats.totalReviews,
        bestRating: 5,
        worstRating: 1,
      },
      review: serviceStats.reviews.slice(0, 3).map(r => ({
        '@type': 'Review',
        author: { '@type': 'Person', name: r.client_name || 'Client vérifié' },
        reviewRating: { '@type': 'Rating', ratingValue: r.rating, bestRating: 5, worstRating: 1 },
        reviewBody: r.comment,
        datePublished: r.created_at?.split('T')[0],
      })),
    } : {}),
  }

  // Related services
  const relatedSlugs = relatedServices[service] || []
  const otherTrades =
    relatedSlugs.length > 0
      ? relatedSlugs.slice(0, 8).filter((s) => tradeContent[s])
      : tradeSlugs.filter((s) => s !== service).slice(0, 8)

  // Hash-selected tips (3)
  const sortedTips = [...trade.tips].sort((a, b) => {
    const ha = Math.abs(hashCode(`tip-sort-${service}-${a}`))
    const hb = Math.abs(hashCode(`tip-sort-${service}-${b}`))
    return ha - hb
  })
  const selectedTips = sortedTips.slice(0, 3)

  // Review criteria
  const reviewCriteria = [
    {
      icon: Shield,
      title: 'Qualifications et certifications',
      description:
        trade.certifications.length > 0
          ? `Vérifiez que votre ${tradeLower} possède les certifications suivantes : ${trade.certifications.join(', ')}. L’assurance décennale et la RC pro sont obligatoires.`
          : `Vérifiez que votre ${tradeLower} dispose d’une assurance décennale et d’une responsabilité civile professionnelle. Ces garanties sont obligatoires pour tout artisan du bâtiment.`,
    },
    {
      icon: Euro,
      title: 'Transparence des tarifs',
      description: `Un bon ${tradeLower} fournit un devis détaillé avant intervention. Prix habituels : ${trade.priceRange.min}–${trade.priceRange.max} ${trade.priceRange.unit}.`,
    },
    {
      icon: Clock,
      title: 'Réactivité et ponctualité',
      description: `Vérifiez le délai de réponse habituel. ${trade.averageResponseTime}.`,
    },
    {
      icon: CheckCircle,
      title: 'Qualité des finitions',
      description: `Examinez les photos avant/après dans les avis clients. Un ${tradeLower} soigneux est un gage de sérieux et de durabilité des travaux.`,
    },
    {
      icon: Phone,
      title: 'Service après-intervention',
      description: `Un artisan sérieux assure un suivi et reste joignable après les travaux. Vérifiez ce point dans les avis clients.`,
    },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <JsonLd data={[breadcrumbSchema, faqSchema, serviceSchema]} />

      {/* Hero */}
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
              { label: 'Avis', href: '/reviews' },
              { label: `Avis ${tradeLower}` },
            ]}
            className="mb-6 text-slate-400 [&_a]:text-slate-400 [&_a:hover]:text-white [&_svg]:text-slate-600"
          />
          <div className="text-center">
            <h1 className="font-heading text-4xl md:text-5xl font-extrabold mb-6 tracking-[-0.025em]">
              {(() => {
                const h1Hash = Math.abs(hashCode(`avis-h1-${service}`))
                const h1Templates = [
                  `Avis ${tradeLower} — Comment bien choisir`,
                  `Choisir un bon ${tradeLower} : avis et conseils`,
                  `Avis ${tradeLower} : comparez les professionnels`,
                  `${trade.name} : avis vérifiés et recommandations`,
                  `Trouver un ${tradeLower} de confiance`,
                ]
                return h1Templates[h1Hash % h1Templates.length]
              })()}
            </h1>
            <p className="text-xl text-slate-400 max-w-3xl mx-auto mb-4">
              Consultez les avis et recommandations pour bien choisir votre {tradeLower}.
              Prix indicatif : {trade.priceRange.min} &agrave; {trade.priceRange.max}{' '}
              {trade.priceRange.unit}.
            </p>
            <div className="flex flex-wrap justify-center gap-3 mt-8">
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur px-4 py-2 rounded-full border border-white/10 text-sm">
                <Euro className="w-4 h-4 text-amber-400" />
                <span>
                  {trade.priceRange.min} &ndash; {trade.priceRange.max}{' '}
                  {trade.priceRange.unit}
                </span>
              </div>
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur px-4 py-2 rounded-full border border-white/10 text-sm">
                <Star className="w-4 h-4 text-amber-400" />
                <span>Avis v&eacute;rifi&eacute;s</span>
              </div>
              {serviceStats.totalReviews > 0 && (
                <div className="flex items-center gap-2 bg-white/[0.08] backdrop-blur-sm border border-white/10 rounded-full px-4 py-2">
                  <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                  <span className="text-sm font-medium">{serviceStats.avgRating.toFixed(1)}/5 &mdash; {serviceStats.totalReviews} avis</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Review criteria */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="font-heading text-2xl font-bold text-gray-900 mb-2 text-center">
            Ce qu&apos;il faut v&eacute;rifier
          </h2>
          <p className="text-gray-500 text-sm text-center mb-8">
            Les crit&egrave;res essentiels pour choisir un {tradeLower} de confiance.
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

      {/* ─── TOP ARTISANS ─────────────────────────────── */}
      {serviceStats.providers.length > 0 && (
        <section className="py-12 bg-gray-50">
          <div className="max-w-5xl mx-auto px-4">
            <h2 className="font-heading text-2xl font-bold text-slate-900 mb-2 text-center">
              {trade.name}s les mieux not&eacute;s en France
            </h2>
            <p className="text-slate-500 text-center mb-8 max-w-lg mx-auto">
              Classement bas&eacute; sur les avis clients v&eacute;rifi&eacute;s.
            </p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {serviceStats.providers.map((provider, i) => (
                <div
                  key={provider.id}
                  className="bg-white border border-gray-200 rounded-xl p-5"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-sm">
                        {provider.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900 text-sm">{provider.name}</div>
                        <div className="text-xs text-gray-500">{provider.address_city || 'France'}</div>
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
                  {provider.is_verified && (
                    <div className="flex items-center gap-1 text-green-600 text-xs mt-2">
                      <CheckCircle className="w-3 h-3" />
                      SIREN v&eacute;rifi&eacute;
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ─── DERNIERS AVIS CLIENTS ────────────────────── */}
      {serviceStats.reviews.length > 0 && (
        <section className="py-12 bg-white border-t">
          <div className="max-w-4xl mx-auto px-4">
            <h2 className="font-heading text-2xl font-bold text-slate-900 mb-2 text-center">
              Derniers avis clients &mdash; {trade.name}
            </h2>
            <p className="text-slate-500 text-center mb-8">
              Retours d&apos;exp&eacute;rience v&eacute;rifi&eacute;s de clients.
            </p>
            <div className="space-y-4">
              {serviceStats.reviews.map(review => (
                <div key={review.id} className="bg-gray-50 rounded-xl border border-gray-100 p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-900 text-sm">
                        {review.client_name || 'Client vérifié'}
                      </span>
                      <span className="inline-flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                        <CheckCircle className="w-3 h-3" />
                        V&eacute;rifi&eacute;
                      </span>
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
                    {new Date(review.created_at).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Pricing expectations */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="font-heading text-2xl font-bold text-gray-900 mb-6 text-center">
            Tarifs indicatifs {tradeLower}
          </h2>
          <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-2xl p-8 text-center mb-8">
            <div className="flex items-baseline justify-center gap-2">
              <span className="text-5xl font-bold text-blue-600">
                {trade.priceRange.min} &mdash; {trade.priceRange.max}
              </span>
              <span className="text-gray-600 text-lg">{trade.priceRange.unit}</span>
            </div>
            <p className="text-gray-500 text-sm mt-3">
              Prix moyen constat&eacute; en France m&eacute;tropolitaine, main-d&apos;&oelig;uvre incluse
            </p>
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

      {/* Certifications */}
      {trade.certifications.length > 0 && (
        <section className="py-16 bg-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="font-heading text-2xl font-bold text-gray-900 mb-6 text-center">
              Certifications &agrave; v&eacute;rifier
            </h2>
            <p className="text-gray-600 text-center mb-8">
              V&eacute;rifiez que votre {tradeLower} poss&egrave;de les certifications adapt&eacute;es &agrave; votre projet.
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

      {/* Tips */}
      <section className={`py-16 ${trade.certifications.length > 0 ? 'bg-gray-50' : 'bg-white'}`}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="font-heading text-2xl font-bold text-gray-900 mb-6 text-center">
            Conseils pour choisir un {tradeLower}
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

      {/* Top cities */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="font-heading text-2xl font-bold text-gray-900 mb-6 text-center">
            Avis {tradeLower} par ville
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
            {topCities.map((ville) => (
              <Link
                key={ville.slug}
                href={`/reviews/${service}/${ville.slug}`}
                className="bg-white hover:bg-blue-50 border border-gray-200 hover:border-blue-300 rounded-xl p-4 transition-all group text-center"
              >
                <div className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors text-sm">
                  Avis {tradeLower} &agrave; {ville.name}
                </div>
              </Link>
            ))}
          </div>
          <div className="text-center mt-6">
            <Link
              href={`/practice-areas/${service}`}
              className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-semibold text-sm"
            >
              Voir tous les {tradeLower}s en France
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="font-heading text-2xl font-bold text-gray-900 mb-8 text-center">
            Questions fr&eacute;quentes &mdash; Avis {trade.name}
          </h2>
          <div className="space-y-4">
            {allFaqItems.map((item, i) => (
              <details
                key={i}
                className="bg-gray-50 rounded-xl border border-gray-200 group"
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

      {/* CTA */}
      <section className="py-20 bg-blue-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="font-heading text-3xl font-bold text-white mb-4">
            Pr&ecirc;t &agrave; trouver votre {tradeLower}&nbsp;?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Demandez un devis gratuit et comparez les artisans pr&egrave;s de chez vous.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href={`/quotes/${service}`}
              className="inline-flex items-center gap-2 bg-white text-blue-600 px-8 py-4 rounded-xl font-semibold hover:bg-blue-50 transition-colors text-lg"
            >
              Demander un devis gratuit
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href={`/practice-areas/${service}`}
              className="inline-flex items-center gap-2 bg-blue-500 text-white px-8 py-4 rounded-xl font-semibold hover:bg-blue-400 transition-colors text-lg border border-blue-400"
            >
              Trouver un {tradeLower}
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Related services */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="font-heading text-2xl font-bold text-gray-900 mb-6">
            Avis pour d&apos;autres m&eacute;tiers
          </h2>
          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4">
            {otherTrades.map((slug) => {
              const t = tradeContent[slug]
              if (!t) return null
              return (
                <Link
                  key={slug}
                  href={`/reviews/${slug}`}
                  className="bg-white hover:bg-blue-50 border border-gray-200 hover:border-blue-300 rounded-xl p-4 transition-all group"
                >
                  <div className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors text-sm">
                    Avis {t.name.toLowerCase()}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {t.priceRange.min} &mdash; {t.priceRange.max}{' '}
                    {t.priceRange.unit}
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      </section>

      {/* Voir aussi */}
      <section className="py-12 bg-white border-t">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="font-heading text-xl font-bold text-gray-900 mb-6">
            Voir aussi
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Ce service</h3>
              <div className="space-y-2">
                <Link
                  href={`/practice-areas/${service}`}
                  className="block text-sm text-gray-600 hover:text-blue-600 py-1"
                >
                  {trade.name} &mdash; tous les artisans
                </Link>
                <Link
                  href={`/quotes/${service}`}
                  className="block text-sm text-gray-600 hover:text-blue-600 py-1"
                >
                  Devis {tradeLower}
                </Link>
                <Link
                  href={`/pricing/${service}`}
                  className="block text-sm text-gray-600 hover:text-blue-600 py-1"
                >
                  Tarifs {tradeLower}
                </Link>
                {trade.emergencyInfo && (
                  <Link
                    href={`/emergency/${service}`}
                    className="block text-sm text-gray-600 hover:text-blue-600 py-1"
                  >
                    {trade.name} urgence
                  </Link>
                )}
                {topCities.slice(0, 4).map((v) => (
                  <Link
                    key={v.slug}
                    href={`/reviews/${service}/${v.slug}`}
                    className="block text-sm text-gray-600 hover:text-blue-600 py-1"
                  >
                    Avis {tradeLower} &agrave; {v.name}
                  </Link>
                ))}
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">
                Avis associ&eacute;s
              </h3>
              <div className="space-y-2">
                {otherTrades.slice(0, 6).map((slug) => {
                  const t = tradeContent[slug]
                  if (!t) return null
                  return (
                    <Link
                      key={slug}
                      href={`/reviews/${slug}`}
                      className="block text-sm text-gray-600 hover:text-blue-600 py-1"
                    >
                      Avis {t.name.toLowerCase()}
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
                  href="/reviews"
                  className="block text-sm text-gray-600 hover:text-blue-600 py-1"
                >
                  Tous les avis artisans
                </Link>
                <Link
                  href="/quotes"
                  className="block text-sm text-gray-600 hover:text-blue-600 py-1"
                >
                  Demander un devis
                </Link>
                <Link
                  href="/pricing"
                  className="block text-sm text-gray-600 hover:text-blue-600 py-1"
                >
                  Guide complet des tarifs
                </Link>
                <Link
                  href="/how-it-works"
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
        </div>
      </section>

      {/* Trust & Safety Links (E-E-A-T) */}
      <section className="py-8 bg-white border-t">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Confiance &amp; S&eacute;curit&eacute;
          </h2>
          <nav className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
            <Link
              href="/verification-process"
              className="text-blue-600 hover:text-blue-800"
            >
              Comment nous r&eacute;f&eacute;ren&ccedil;ons les artisans
            </Link>
            <Link
              href="/review-policy"
              className="text-blue-600 hover:text-blue-800"
            >
              Notre politique des avis
            </Link>
            <Link
              href="/mediation"
              className="text-blue-600 hover:text-blue-800"
            >
              Service de m&eacute;diation
            </Link>
          </nav>
        </div>
      </section>

      {/* Editorial credibility */}
      <section className="mb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-slate-50 rounded-2xl border border-slate-200 p-6">
            <h3 className="text-sm font-semibold text-slate-700 mb-2">
              Transparence &eacute;ditoriale
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Les informations pr&eacute;sent&eacute;es sur cette page sont
              indicatives et destin&eacute;es &agrave; vous aider dans le choix
              d&apos;un artisan. Les prix affich&eacute;s sont des fourchettes
              bas&eacute;es sur des moyennes constat&eacute;es en France. Seul un
              devis personnalis&eacute; fait foi. ServicesArtisans est un annuaire
              ind&eacute;pendant.
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
