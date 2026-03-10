import { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowRight, CheckCircle, Euro, Shield, ChevronDown, TrendingUp, Clock, MapPin } from 'lucide-react'
import Breadcrumb from '@/components/Breadcrumb'
import JsonLd from '@/components/JsonLd'
import { getBreadcrumbSchema, getFAQSchema } from '@/lib/seo/jsonld'
import { SITE_URL } from '@/lib/seo/config'
import { hashCode } from '@/lib/seo/location-content'
import { tradeContent, getTradesSlugs } from '@/lib/data/trade-content'
import { villes } from '@/lib/data/france'
import { getServiceImage } from '@/lib/data/images'
import { getPageContent } from '@/lib/cms'
import { CmsContent } from '@/components/CmsContent'

const tradeSlugs = getTradesSlugs()

const REGIONAL_PRICING = [
  { region: 'Île-de-France', multiplier: 1.25, label: 'Paris et banlieue' },
  { region: 'PACA', multiplier: 1.10, label: 'Côte d\'Azur et Provence' },
  { region: 'Auvergne-Rhône-Alpes', multiplier: 1.10, label: 'Lyon, Grenoble, Annecy' },
  { region: 'Occitanie', multiplier: 1.05, label: 'Toulouse, Montpellier' },
  { region: 'Nouvelle-Aquitaine', multiplier: 1.00, label: 'Bordeaux, Limoges' },
  { region: 'Hauts-de-France', multiplier: 0.95, label: 'Lille, Amiens' },
  { region: 'Grand Est', multiplier: 0.95, label: 'Strasbourg, Metz' },
  { region: 'Bretagne', multiplier: 1.00, label: 'Rennes, Brest' },
]

export function generateStaticParams() {
  return tradeSlugs.map((service) => ({ service }))
}

function truncateTitle(title: string, maxLen = 42): string {
  if (title.length <= maxLen) return title
  return title.slice(0, maxLen - 1).replace(/\s+\S*$/, '') + '…'
}

export async function generateMetadata({ params }: { params: Promise<{ service: string }> }): Promise<Metadata> {
  const { service } = await params
  const trade = tradeContent[service]
  if (!trade) return {}

  const tradeLower = trade.name.toLowerCase()

  const titleHash = Math.abs(hashCode(`tarif-title-${service}`))
  const titleTemplates = [
    `Prix ${tradeLower} 2026 — Tarifs détaillés`,
    `Prix ${tradeLower} 2026 : guide complet`,
    `Tarif ${tradeLower} 2026 : grille des prix`,
    `Prix ${tradeLower} : combien ça coûte ?`,
    `Tarifs ${tradeLower} 2026 — Barème et devis`,
  ]
  const title = truncateTitle(titleTemplates[titleHash % titleTemplates.length])

  const descHash = Math.abs(hashCode(`tarif-desc-${service}`))
  const descTemplates = [
    `Tarifs ${tradeLower} 2026 : ${trade.priceRange.min} à ${trade.priceRange.max} ${trade.priceRange.unit}. Prix détaillés par prestation, comparatif régional. Devis gratuit.`,
    `Prix ${tradeLower} en 2026 : de ${trade.priceRange.min} à ${trade.priceRange.max} ${trade.priceRange.unit}. Grille tarifaire complète et devis en ligne.`,
    `Combien coûte un ${tradeLower} ? ${trade.priceRange.min}–${trade.priceRange.max} ${trade.priceRange.unit} en 2026. Tarifs par région et devis gratuit.`,
    `Guide des tarifs ${tradeLower} 2026 : ${trade.priceRange.min} à ${trade.priceRange.max} ${trade.priceRange.unit}. Comparez les prix et demandez un devis.`,
    `Tarifs ${tradeLower} : de ${trade.priceRange.min} à ${trade.priceRange.max} ${trade.priceRange.unit}. Prix par prestation, variations régionales. Devis gratuit.`,
  ]
  const description = descTemplates[descHash % descTemplates.length]

  const serviceImage = getServiceImage(service)

  return {
    title,
    description,
    alternates: { canonical: `${SITE_URL}/tarifs/${service}` },
    openGraph: {
      locale: 'fr_FR',
      title,
      description,
      url: `${SITE_URL}/tarifs/${service}`,
      type: 'website',
      images: [{ url: serviceImage.src, width: 800, height: 600, alt: `Tarifs ${trade.name}` }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [serviceImage.src],
    },
  }
}

const topCities = villes.slice(0, 6)

export default async function TarifsServicePage({ params }: { params: Promise<{ service: string }> }) {
  const { service } = await params

  const cmsPage = await getPageContent(service + '-tarifs', 'static')

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
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-white rounded-xl shadow-sm p-8">
              <CmsContent html={cmsPage.content_html} />
            </div>
          </div>
        </section>
      </div>
    )
  }

  const trade = tradeContent[service]
  if (!trade) notFound()

  const breadcrumbSchema = getBreadcrumbSchema([
    { name: 'Accueil', url: '/' },
    { name: 'Tarifs artisans', url: '/tarifs' },
    { name: `Tarifs ${trade.name.toLowerCase()}`, url: `/tarifs/${service}` },
  ])

  const faqSchema = getFAQSchema(
    trade.faq.map((f) => ({ question: f.q, answer: f.a }))
  )

  const serviceSchema = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: `${trade.name} en France`,
    description: `Guide des tarifs ${trade.name.toLowerCase()} 2026. Prix horaire, tarifs par prestation et variations régionales.`,
    provider: {
      '@type': 'Organization',
      name: 'ServicesArtisans',
      url: SITE_URL,
    },
    areaServed: {
      '@type': 'Country',
      name: 'France',
    },
    offers: {
      '@type': 'AggregateOffer',
      priceCurrency: 'EUR',
      lowPrice: trade.priceRange.min,
      highPrice: trade.priceRange.max,
    },
  }

  const pricingItemListSchema = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `Tarifs ${trade.name} en France`,
    description: `Liste des prestations et prix indicatifs pour ${trade.name}`,
    numberOfItems: trade.commonTasks.length,
    itemListElement: trade.commonTasks.map((task, i) => {
      const parts = task.split(':')
      const name = parts[0].trim()
      const priceStr = parts.slice(1).join(':').trim()
      const priceMatch = priceStr.match(/(\d+)/)
      return {
        '@type': 'ListItem',
        position: i + 1,
        item: {
          '@type': 'Offer',
          name,
          ...(priceMatch ? {
            priceSpecification: {
              '@type': 'PriceSpecification',
              price: priceMatch[1],
              priceCurrency: 'EUR',
            }
          } : {}),
          description: task,
          availability: 'https://schema.org/InStock',
        }
      }
    })
  }

  const collectionPageSchema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: `Tarifs ${trade.name} par ville`,
    description: `Guide des tarifs ${trade.name.toLowerCase()} 2026 par ville. Prix horaire : ${trade.priceRange.min} à ${trade.priceRange.max} ${trade.priceRange.unit}.`,
    url: `${SITE_URL}/tarifs/${service}`,
    mainEntity: {
      '@type': 'ItemList',
      itemListElement: topCities.map((ville, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        name: `Tarifs ${trade.name.toLowerCase()} à ${ville.name}`,
        url: `${SITE_URL}/services/${service}/${ville.slug}`,
      })),
    },
  }

  const otherTrades = tradeSlugs.filter((s) => s !== service).slice(0, 8)

  return (
    <div className="min-h-screen bg-gray-50">
      <JsonLd data={[breadcrumbSchema, faqSchema, serviceSchema, pricingItemListSchema, collectionPageSchema]} />

      {/* Hero */}
      <section className="relative bg-[#0a0f1e] text-white overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute inset-0" style={{
            background: 'radial-gradient(ellipse 80% 50% at 50% -10%, rgba(37,99,235,0.18) 0%, transparent 60%), radial-gradient(ellipse 60% 60% at 80% 110%, rgba(37,99,235,0.1) 0%, transparent 50%)',
          }} />
          <div className="absolute inset-0 opacity-[0.025]" style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
            backgroundSize: '64px 64px',
          }} />
          <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-gray-50 to-transparent" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-28 md:pt-14 md:pb-36">
          <Breadcrumb
            items={[
              { label: 'Tarifs artisans', href: '/tarifs' },
              { label: `Tarifs ${trade.name.toLowerCase()}` },
            ]}
            className="mb-6 text-slate-400 [&_a]:text-slate-400 [&_a:hover]:text-white [&_svg]:text-slate-600"
          />
          <div className="text-center">
            <h1 className="font-heading text-4xl md:text-5xl font-extrabold mb-6 tracking-[-0.025em]">
              {(() => {
                const h1Hash = Math.abs(hashCode(`tarif-h1-${service}`))
                const tradeLower = trade.name.toLowerCase()
                const h1Templates = [
                  `Tarifs ${tradeLower} 2026`,
                  `Prix ${tradeLower} : guide complet 2026`,
                  `Combien coûte un ${tradeLower} ?`,
                  `Guide des tarifs ${tradeLower} en 2026`,
                  `Tarifs et prix d'un ${tradeLower}`,
                ]
                return h1Templates[h1Hash % h1Templates.length]
              })()}
            </h1>
            <p className="text-xl text-slate-400 max-w-3xl mx-auto mb-4">
              Guide complet des prix {trade.name.toLowerCase()} en France.
              Tarif horaire : {trade.priceRange.min} à {trade.priceRange.max} {trade.priceRange.unit}.
            </p>
            <div className="flex flex-wrap justify-center gap-3 mt-8">
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur px-4 py-2 rounded-full border border-white/10 text-sm">
                <Euro className="w-4 h-4 text-amber-400" />
                <span>Prix actualisés 2026</span>
              </div>
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur px-4 py-2 rounded-full border border-white/10 text-sm">
                <TrendingUp className="w-4 h-4 text-amber-400" />
                <span>{trade.commonTasks.length} prestations détaillées</span>
              </div>
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur px-4 py-2 rounded-full border border-white/10 text-sm">
                <Clock className="w-4 h-4 text-amber-400" />
                <span>{trade.averageResponseTime}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Price range */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-2xl p-8 text-center mb-12">
            <h2 className="text-lg font-semibold text-gray-700 mb-2">Tarif horaire moyen</h2>
            <div className="flex items-baseline justify-center gap-2">
              <span className="text-5xl font-bold text-blue-600">
                {trade.priceRange.min} — {trade.priceRange.max}
              </span>
              <span className="text-gray-600 text-lg">{trade.priceRange.unit}</span>
            </div>
            <p className="text-gray-500 text-sm mt-3">
              Prix moyen constaté en France métropolitaine, main-d&apos;oeuvre incluse
            </p>
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Détail des prestations courantes
          </h2>
          <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-sm">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-5 py-3.5 text-sm font-semibold text-gray-700">Prestation</th>
                  <th className="px-5 py-3.5 text-sm font-semibold text-gray-700 text-right">Prix indicatif</th>
                </tr>
              </thead>
              <tbody>
                {trade.commonTasks.map((task, i) => {
                  const colonIndex = task.indexOf(':')
                  const name = colonIndex !== -1 ? task.slice(0, colonIndex).trim() : task.trim()
                  const price = colonIndex !== -1 ? task.slice(colonIndex + 1).trim() : 'Sur devis'
                  return (
                    <tr key={i} className={`hover:bg-blue-50/60 transition-colors ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                      <td className="px-5 py-4 text-gray-800 text-sm border-t border-gray-100">{name}</td>
                      <td className="px-5 py-4 text-gray-900 text-sm font-medium border-t border-gray-100 text-right whitespace-nowrap">{price}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Regional pricing */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-2 text-center">
            Variation des tarifs par région
          </h3>
          <p className="text-gray-500 text-sm text-center mb-8">
            Les prix {trade.name.toLowerCase()} varient selon la région. Voici une estimation ajustée.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {REGIONAL_PRICING.map((r) => {
              const adjustedMin = Math.round(trade.priceRange.min * r.multiplier)
              const adjustedMax = Math.round(trade.priceRange.max * r.multiplier)
              const accentColor =
                r.multiplier > 1.0
                  ? 'border-amber-200 bg-amber-50'
                  : r.multiplier < 1.0
                    ? 'border-green-200 bg-green-50'
                    : 'border-gray-200 bg-gray-50'
              const badgeColor =
                r.multiplier > 1.0
                  ? 'bg-amber-100 text-amber-700'
                  : r.multiplier < 1.0
                    ? 'bg-green-100 text-green-700'
                    : 'bg-gray-100 text-gray-600'
              const sign = r.multiplier > 1.0 ? '+' : r.multiplier < 1.0 ? '' : ''
              const pct = Math.round((r.multiplier - 1) * 100)
              return (
                <div key={r.region} className={`rounded-xl border shadow-sm p-4 ${accentColor}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <MapPin className="w-4 h-4 text-gray-500 flex-shrink-0" />
                    <span className="font-semibold text-gray-900 text-sm">{r.region}</span>
                  </div>
                  <p className="text-xs text-gray-500 mb-3">{r.label}</p>
                  <div className="text-lg font-bold text-gray-900">
                    {adjustedMin} — {adjustedMax} <span className="text-sm font-normal text-gray-500">{trade.priceRange.unit}</span>
                  </div>
                  <span className={`inline-block mt-2 text-xs font-medium px-2 py-0.5 rounded-full ${badgeColor}`}>
                    {pct === 0 ? 'Moyenne nationale' : `${sign}${pct} % vs moyenne`}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Conseils */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            Conseils pour choisir un {trade.name.toLowerCase()}
          </h2>
          <div className="space-y-4">
            {trade.tips.map((tip, i) => (
              <div key={i} className="flex items-start gap-4 bg-white rounded-xl border border-gray-200 p-5">
                <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="w-4 h-4 text-amber-600" />
                </div>
                <p className="text-gray-700 text-sm leading-relaxed">{tip}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Certifications */}
      {trade.certifications.length > 0 && (
        <section className="py-16 bg-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
              Certifications et qualifications
            </h2>
            <p className="text-gray-600 text-center mb-8">
              Vérifiez que votre {trade.name.toLowerCase()} possède les certifications adaptées à votre projet.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              {trade.certifications.map((cert) => (
                <div key={cert} className="flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-3 rounded-xl text-sm font-medium">
                  <Shield className="w-4 h-4 flex-shrink-0" />
                  {cert}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* FAQ */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">
            Questions fréquentes — {trade.name}
          </h2>
          <div className="space-y-4">
            {trade.faq.map((item, i) => (
              <details key={i} className="bg-white rounded-xl border border-gray-200 group">
                <summary className="flex items-center justify-between p-6 cursor-pointer list-none">
                  <h3 className="text-base font-semibold text-gray-900 pr-4">{item.q}</h3>
                  <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0 group-open:rotate-180 transition-transform" />
                </summary>
                <div className="px-6 pb-6 text-gray-600 text-sm leading-relaxed">
                  {item.a}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Cities */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            Trouver un {trade.name.toLowerCase()} près de chez vous
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 max-w-3xl mx-auto">
            {topCities.map((ville) => (
              <Link
                key={ville.slug}
                href={`/services/${service}/${ville.slug}`}
                className="bg-gray-50 hover:bg-blue-50 border border-gray-200 hover:border-blue-300 rounded-xl p-4 transition-all group text-center"
              >
                <div className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors text-sm">
                  {trade.name} à {ville.name}
                </div>
              </Link>
            ))}
          </div>
          <div className="text-center mt-6">
            <Link href={`/services/${service}`} className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-semibold text-sm">
              Voir tous les {trade.name.toLowerCase()}s
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Urgence */}
      {trade.emergencyInfo && (
        <section className="py-16 bg-red-50 border-y border-red-100">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              {trade.name} en urgence ?
            </h2>
            <p className="text-gray-700 mb-6 max-w-2xl mx-auto text-sm leading-relaxed">
              {trade.emergencyInfo}
            </p>
            <Link
              href={`/urgence/${service}`}
              className="inline-flex items-center gap-2 bg-red-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-red-700 transition-colors"
            >
              {trade.name} urgence 24h/24
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </section>
      )}

      {/* Other trades */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Tarifs d&apos;autres corps de métier</h2>
          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4">
            {otherTrades.map((slug) => {
              const t = tradeContent[slug]
              return (
                <Link
                  key={slug}
                  href={`/tarifs/${slug}`}
                  className="bg-white hover:bg-blue-50 border border-gray-200 hover:border-blue-300 rounded-xl p-4 transition-all group"
                >
                  <div className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors text-sm">
                    {t.name}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {t.priceRange.min} — {t.priceRange.max} {t.priceRange.unit}
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-blue-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Obtenez un devis précis pour votre projet
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Les prix varient selon votre situation. Demandez un devis gratuit à un {trade.name.toLowerCase()} référencé.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href={`/devis/${service}`}
              className="inline-flex items-center gap-2 bg-white text-blue-600 px-8 py-4 rounded-xl font-semibold hover:bg-blue-50 transition-colors text-lg"
            >
              Demander un devis gratuit
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href={`/services/${service}`}
              className="inline-flex items-center gap-2 bg-blue-500 text-white px-8 py-4 rounded-xl font-semibold hover:bg-blue-400 transition-colors text-lg border border-blue-400"
            >
              Trouver un {trade.name.toLowerCase()}
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Editorial */}
      <section className="mb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-slate-50 rounded-2xl border border-slate-200 p-6">
            <h3 className="text-sm font-semibold text-slate-700 mb-2">Méthodologie tarifaire</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Les prix affichés sont des fourchettes indicatives basées sur des moyennes constatées en France. Ils varient selon la région, la complexité du chantier, les matériaux et l&apos;urgence. Seul un devis personnalisé fait foi. ServicesArtisans est un annuaire indépendant.
            </p>
          </div>
        </div>
      </section>

      {/* Voir aussi */}
      <section className="py-12 bg-white border-t">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Voir aussi</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Ce service</h3>
              <div className="space-y-2">
                <Link href={`/services/${service}`} className="block text-sm text-gray-600 hover:text-blue-600 py-1">{trade.name} — tous les artisans</Link>
                {trade.emergencyInfo && (
                  <Link href={`/urgence/${service}`} className="block text-sm text-gray-600 hover:text-blue-600 py-1">{trade.name} urgence</Link>
                )}
                {topCities.slice(0, 4).map((v) => (
                  <Link key={v.slug} href={`/services/${service}/${v.slug}`} className="block text-sm text-gray-600 hover:text-blue-600 py-1">
                    {trade.name} à {v.name}
                  </Link>
                ))}
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Tarifs associés</h3>
              <div className="space-y-2">
                {otherTrades.slice(0, 6).map((slug) => (
                  <Link key={slug} href={`/tarifs/${slug}`} className="block text-sm text-gray-600 hover:text-blue-600 py-1">
                    Tarifs {tradeContent[slug].name.toLowerCase()}
                  </Link>
                ))}
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Informations utiles</h3>
              <div className="space-y-2">
                <Link href="/tarifs" className="block text-sm text-gray-600 hover:text-blue-600 py-1">Guide complet des tarifs</Link>
                <Link href="/comment-ca-marche" className="block text-sm text-gray-600 hover:text-blue-600 py-1">Comment ça marche</Link>
                <Link href="/devis" className="block text-sm text-gray-600 hover:text-blue-600 py-1">Demander un devis</Link>
                <Link href="/faq" className="block text-sm text-gray-600 hover:text-blue-600 py-1">FAQ</Link>
                <Link href="/notre-processus-de-verification" className="block text-sm text-gray-600 hover:text-blue-600 py-1">Processus de vérification</Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust */}
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
    </div>
  )
}
