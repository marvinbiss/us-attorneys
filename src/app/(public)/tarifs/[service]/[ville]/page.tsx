import { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowRight, CheckCircle, Euro, ChevronDown, MapPin, Users, Thermometer, Building2 } from 'lucide-react'
import Breadcrumb from '@/components/Breadcrumb'
import JsonLd from '@/components/JsonLd'
import { getBreadcrumbSchema, getFAQSchema, getServicePricingSchema, getSpeakableSchema } from '@/lib/seo/jsonld'
import { SITE_URL, SITE_NAME } from '@/lib/seo/config'
import { tradeContent, getTradesSlugs } from '@/lib/data/trade-content'
import { villes, getVilleBySlug, getNearbyCities } from '@/lib/data/france'
import { getCommuneBySlug } from '@/lib/data/commune-data'
import { hashCode } from '@/lib/seo/location-content'
import LocalDataInsights from '@/components/seo/LocalDataInsights'
import { getServiceImage } from '@/lib/data/images'
import { getProblemsByService } from '@/lib/data/problems'
import { relatedServices } from '@/lib/constants/navigation'
import { SpeakableAnswerBox } from '@/components/SpeakableAnswerBox'
import dynamic from 'next/dynamic'

const EstimationWidget = dynamic(
  () => import('@/components/estimation/EstimationWidget'),
  { ssr: false }
)

// ---------------------------------------------------------------------------
// Static params: top 5 cities x 46 services = 230 pages
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
export const revalidate = 86400

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getRegionalMultiplier(region: string): number {
  const multipliers: Record<string, number> = {
    'Ile-de-France': 1.25,
    'Île-de-France': 1.25,
    "Provence-Alpes-Côte d'Azur": 1.10,
    'Auvergne-Rhône-Alpes': 1.10,
    'Occitanie': 1.05,
    'Nouvelle-Aquitaine': 1.00,
    'Hauts-de-France': 0.95,
    'Grand Est': 0.95,
    'Bretagne': 1.00,
    'Pays de la Loire': 1.00,
    'Normandie': 0.95,
    'Centre-Val de Loire': 0.95,
    'Bourgogne-Franche-Comté': 0.95,
    'Corse': 1.10,
  }
  return multipliers[region] ?? 1.0
}

function formatNumber(n: number): string {
  return n.toLocaleString('fr-FR')
}

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

function getSeasonalTip(zone: string | null, serviceName: string): string {
  if (zone === 'mediterraneen') {
    return `À noter : le climat méditerranéen favorise les travaux extérieurs quasiment toute l'année. La demande de ${serviceName.toLowerCase()} peut être plus forte en été avec l'afflux de résidents saisonniers.`
  }
  if (zone === 'montagnard') {
    return `En zone de montagne, les conditions hivernales peuvent limiter certains travaux extérieurs et augmenter les délais d'intervention. Prévoyez vos travaux de ${serviceName.toLowerCase()} en amont.`
  }
  if (zone === 'continental') {
    return `Avec un climat continental, les écarts de température sont importants. Les travaux de ${serviceName.toLowerCase()} liés au chauffage et à l'isolation sont particulièrement pertinents.`
  }
  if (zone === 'oceanique' || zone === 'semi-oceanique') {
    return `Le climat océanique implique une humidité fréquente. Les interventions de ${serviceName.toLowerCase()} liées à l'étanchéité et à la ventilation sont courantes.`
  }
  return `Les conditions climatiques locales peuvent influencer le type et la fréquence des interventions de ${serviceName.toLowerCase()}.`
}

// ---------------------------------------------------------------------------
// Metadata
// ---------------------------------------------------------------------------

function truncateTitle(title: string, maxLen = 42): string {
  if (title.length <= maxLen) return title
  return title.slice(0, maxLen - 1).replace(/\s+\S*$/, '') + '…'
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ service: string; ville: string }>
}): Promise<Metadata> {
  const { service, ville: villeSlug } = await params
  const trade = tradeContent[service]
  const villeData = getVilleBySlug(villeSlug)
  if (!trade || !villeData) return {}

  const tradeLower = trade.name.toLowerCase()
  const multiplier = getRegionalMultiplier(villeData.region)
  const minPrice = Math.round(trade.priceRange.min * multiplier)
  const maxPrice = Math.round(trade.priceRange.max * multiplier)
  const unit = trade.priceRange.unit
  const dept = villeData.departement

  const titleHash = Math.abs(hashCode(`tarif-title-${service}-${villeSlug}`))
  const titleTemplates = [
    `Prix ${tradeLower} ${villeData.name} 2026`,
    `Prix ${tradeLower} à ${villeData.name} — Tarifs`,
    `Tarif ${tradeLower} ${villeData.name} 2026`,
    `Prix ${tradeLower} ${villeData.name} : barème`,
    `Tarifs ${tradeLower} ${villeData.name} — Guide`,
  ]
  const title = truncateTitle(titleTemplates[titleHash % titleTemplates.length])

  const descHash = Math.abs(hashCode(`tarif-desc-${service}-${villeSlug}`))
  const descTemplates = [
    `Prix ${tradeLower} à ${villeData.name} en 2026 : ${minPrice}–${maxPrice} ${unit}. Tarifs locaux, facteurs de prix et devis gratuit.`,
    `Tarif ${tradeLower} à ${villeData.name} (${dept}) : de ${minPrice} à ${maxPrice} ${unit}. Comparez les artisans et demandez un devis.`,
    `Quel est le prix d’un ${tradeLower} à ${villeData.name} ? De ${minPrice} à ${maxPrice} ${unit} en 2026. Guide complet et devis gratuit.`,
    `Guide des tarifs ${tradeLower} à ${villeData.name} en 2026. Prix moyen : ${minPrice}–${maxPrice} ${unit}. Conseils et devis sans engagement.`,
    `Tarifs ${tradeLower} ${villeData.name} en 2026 : ${minPrice} à ${maxPrice} ${unit}. Découvrez les prix locaux et obtenez un devis gratuit.`,
  ]
  const description = descTemplates[descHash % descTemplates.length]

  const canonicalUrl = `${SITE_URL}/tarifs/${service}/${villeSlug}`

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
      images: [{ url: getServiceImage(service).src, width: 1200, height: 630 }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [getServiceImage(service).src],
    },
  }
}

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------

export default async function TarifsServiceVillePage({
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

  const breadcrumbSchema = getBreadcrumbSchema([
    { name: 'Accueil', url: '/' },
    { name: 'Tarifs artisans', url: '/tarifs' },
    { name: `Tarifs ${tradeLower}`, url: `/tarifs/${service}` },
    { name: villeData.name, url: `/tarifs/${service}/${villeSlug}` },
  ])

  const faqSchema = getFAQSchema(
    trade.faq.slice(0, 5).map((f) => ({
      question: f.q.replace(/\?$/, '') + ` à ${villeData.name} ?`,
      answer: f.a,
    }))
  )

  const offerCount = commune?.nb_entreprises_artisanales
  const serviceSchema = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: `${trade.name} à ${villeData.name}`,
    description: `Service de ${tradeLower} à ${villeData.name} (${villeData.departement}). Tarifs 2026 : ${minPrice} à ${maxPrice} ${trade.priceRange.unit}.`,
    url: `${SITE_URL}/tarifs/${service}/${villeSlug}`,
    provider: {
      '@type': 'LocalBusiness',
      name: SITE_NAME,
      url: SITE_URL,
    },
    areaServed: {
      '@type': 'City',
      name: villeData.name,
      containedInPlace: {
        '@type': 'AdministrativeArea',
        name: villeData.region,
      },
    },
    offers: {
      '@type': 'AggregateOffer',
      priceCurrency: 'EUR',
      lowPrice: minPrice,
      highPrice: maxPrice,
      ...(offerCount ? { offerCount } : {}),
    },
  }

  const pricingSchema = getServicePricingSchema({
    serviceName: trade.name,
    serviceSlug: service,
    description: `Tarifs ${trade.name} à ${villeData.name} : ${minPrice}-${maxPrice} ${trade.priceRange.unit}. Prix ajustés pour la région ${villeData.region}.`,
    lowPrice: minPrice,
    highPrice: maxPrice,
    priceUnit: trade.priceRange.unit,
    offerCount: commune?.nb_entreprises_artisanales ?? undefined,
    location: villeData.name,
    url: `${SITE_URL}/tarifs/${service}/${villeSlug}`,
  })

  const pricingItemListSchema = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `Tarifs ${trade.name} à ${villeData.name}`,
    description: `Liste des prestations et prix indicatifs pour ${trade.name} à ${villeData.name}`,
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

  const speakableSchema = getSpeakableSchema({
    url: `${SITE_URL}/tarifs/${service}/${villeSlug}`,
    title: `Tarifs ${tradeLower} à ${villeData.name}`,
  })

  const relatedCities = getNearbyCities(villeSlug, 6)

  const relatedSlugs = relatedServices[service] || []
  const otherTrades = relatedSlugs.length > 0
    ? relatedSlugs.slice(0, 6).filter((s) => tradeContent[s])
    : tradeSlugs.filter((s) => s !== service).slice(0, 6)

  return (
    <div className="min-h-screen bg-gray-50">
      <JsonLd data={[breadcrumbSchema, faqSchema, serviceSchema, pricingSchema, pricingItemListSchema, speakableSchema]} />

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
              { label: `Tarifs ${tradeLower}`, href: `/tarifs/${service}` },
              { label: villeData.name },
            ]}
            className="mb-6 text-slate-400 [&_a]:text-slate-400 [&_a:hover]:text-white [&_svg]:text-slate-600"
          />
          <div className="text-center">
            <h1 className="font-heading text-4xl md:text-5xl font-extrabold mb-6 tracking-[-0.025em]">
              {(() => {
                const h1Hash = Math.abs(hashCode(`tarif-h1-${service}-${villeSlug}`))
                const h1Templates = [
                  `Tarifs ${tradeLower} à ${villeData.name} en 2026`,
                  `Prix ${tradeLower} à ${villeData.name} : guide des tarifs 2026`,
                  `Combien coûte un ${tradeLower} à ${villeData.name} ?`,
                  `${trade.name} à ${villeData.name} : tarifs et prix 2026`,
                  `Guide des tarifs ${tradeLower} à ${villeData.name}`,
                ]
                return h1Templates[h1Hash % h1Templates.length]
              })()}
            </h1>
            <p className="text-xl text-slate-400 max-w-3xl mx-auto mb-4">
              Prix {tradeLower} {'à'} {villeData.name} ({villeData.departement}) :
              {' '}{minPrice} {'à'} {maxPrice} {trade.priceRange.unit}.
              Tarifs adapt{'é'}s au march{'é'} local.
            </p>
            <div className="flex flex-wrap justify-center gap-3 mt-8">
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur px-4 py-2 rounded-full border border-white/10 text-sm">
                <Euro className="w-4 h-4 text-amber-400" />
                <span>{minPrice} {'–'} {maxPrice} {trade.priceRange.unit}</span>
              </div>
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur px-4 py-2 rounded-full border border-white/10 text-sm">
                <MapPin className="w-4 h-4 text-amber-400" />
                <span>{villeData.name} ({villeData.departementCode})</span>
              </div>
              {commune?.nb_entreprises_artisanales && (
                <div className="flex items-center gap-2 bg-white/10 backdrop-blur px-4 py-2 rounded-full border border-white/10 text-sm">
                  <Users className="w-4 h-4 text-amber-400" />
                  <span>{formatNumber(commune.nb_entreprises_artisanales)} artisans locaux</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Price range overview */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-2xl p-8 text-center mb-12">
            <h2 className="text-lg font-semibold text-gray-700 mb-2">
              Tarif horaire moyen {'à'} {villeData.name}
            </h2>
            <div className="flex items-baseline justify-center gap-2">
              <span className="text-5xl font-bold text-blue-600">
                {minPrice} {'—'} {maxPrice}
              </span>
              <span className="text-gray-600 text-lg">{trade.priceRange.unit}</span>
            </div>
            <p className="text-gray-500 text-sm mt-3">
              Prix moyen constat{'é'} {'à'} {villeData.name} et ses alentours,
              main-d&apos;oeuvre incluse
            </p>
            {multiplier !== 1.0 && (
              <p className="text-xs text-gray-400 mt-2">
                {multiplier > 1.0
                  ? `Les tarifs en ${villeData.region} sont en moyenne ${Math.round((multiplier - 1) * 100)} % supérieurs à la moyenne nationale`
                  : `Les tarifs en ${villeData.region} sont en moyenne ${Math.round((1 - multiplier) * 100)} % inférieurs à la moyenne nationale`}
              </p>
            )}
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Prestations courantes et prix {'à'} {villeData.name}
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

      {/* Local factors */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2 text-center">
            Facteurs qui influencent les prix {'à'} {villeData.name}
          </h2>
          <p className="text-gray-500 text-sm text-center mb-8">
            Plusieurs facteurs locaux expliquent les variations tarifaires {'à'} {villeData.name}.
          </p>
          <div className="grid sm:grid-cols-2 gap-6">
            <LocalFactorCard
              icon={<Euro className="w-5 h-5 text-blue-600" />}
              title="Pouvoir d'achat local"
              value={commune?.revenu_median ? `${formatNumber(commune.revenu_median)} €/an` : null}
              description={
                commune?.revenu_median
                  ? `Le revenu médian à ${villeData.name} est de ${formatNumber(commune.revenu_median)} € par an, ce qui influence le positionnement tarifaire des artisans locaux.`
                  : `Le pouvoir d'achat local à ${villeData.name} influence le niveau des tarifs pratiqués par les artisans.`
              }
            />
            <LocalFactorCard
              icon={<Users className="w-5 h-5 text-amber-600" />}
              title="Concurrence locale"
              value={commune?.nb_entreprises_artisanales ? `${formatNumber(commune.nb_entreprises_artisanales)} entreprises` : null}
              description={
                commune?.nb_entreprises_artisanales
                  ? commune.nb_entreprises_artisanales > 500
                    ? `Avec ${formatNumber(commune.nb_entreprises_artisanales)} entreprises artisanales, ${villeData.name} bénéficie d'une forte concurrence, ce qui peut maintenir les prix compétitifs.`
                    : `${villeData.name} compte ${formatNumber(commune.nb_entreprises_artisanales)} entreprises artisanales. Une concurrence modérée peut impliquer des tarifs légèrement plus élevés.`
                  : `Le nombre d'artisans disponibles à ${villeData.name} influence directement les tarifs pratiqués.`
              }
            />
            <LocalFactorCard
              icon={<Thermometer className="w-5 h-5 text-green-600" />}
              title="Conditions climatiques"
              value={getClimatLabel(commune?.climat_zone ?? null)}
              description={getSeasonalTip(commune?.climat_zone ?? null, trade.name)}
            />
            <LocalFactorCard
              icon={<Building2 className="w-5 h-5 text-purple-600" />}
              title="Type de logement"
              value={commune?.part_maisons_pct ? `${commune.part_maisons_pct} % de maisons` : null}
              description={
                commune?.part_maisons_pct
                  ? commune.part_maisons_pct > 50
                    ? `À ${villeData.name}, ${commune.part_maisons_pct} % des logements sont des maisons individuelles. Les interventions sur maisons (toiture, façade, jardin) sont fréquentes.`
                    : `À ${villeData.name}, les appartements sont majoritaires (${100 - commune.part_maisons_pct} %). Les travaux en copropriété peuvent impliquer des contraintes spécifiques.`
                  : `La répartition entre maisons et appartements à ${villeData.name} influence les types de travaux demandés.`
              }
            />
          </div>

          {commune && (commune.nb_artisans_rge || commune.prix_m2_moyen) && (
            <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {commune.prix_m2_moyen && (
                <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
                  <div className="text-2xl font-bold text-gray-900">{formatNumber(commune.prix_m2_moyen)} {'€'}/m{'²'}</div>
                  <div className="text-sm text-gray-500 mt-1">Prix immobilier moyen</div>
                </div>
              )}
              {commune.nb_artisans_rge && (
                <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
                  <div className="text-2xl font-bold text-gray-900">{formatNumber(commune.nb_artisans_rge)}</div>
                  <div className="text-sm text-gray-500 mt-1">Artisans RGE certifi{'é'}s</div>
                </div>
              )}
              {commune.population && (
                <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
                  <div className="text-2xl font-bold text-gray-900">{formatNumber(commune.population)}</div>
                  <div className="text-sm text-gray-500 mt-1">Habitants</div>
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Local Data Insights — unique content per commune */}
      <LocalDataInsights
        communeData={commune}
        serviceSlug={service}
        serviceName={trade.name}
        villeName={villeData.name}
      />

      {/* Speakable Answer Box */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        <SpeakableAnswerBox
          answer={`${trade.name} à ${villeData.name} : ${minPrice}–${maxPrice} ${trade.priceRange.unit} (prix ajusté région ${villeData.region}). Prestations courantes : ${trade.commonTasks.slice(0, 3).map(t => t.split(':')[0].trim()).join(', ')}. ${commune?.nb_entreprises_artisanales ? `${commune.nb_entreprises_artisanales} entreprises artisanales dans la commune.` : ''}`}
        />
      </div>

      {/* Conseils */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            Conseils pour choisir un {tradeLower} {'à'} {villeData.name}
          </h2>
          <div className="space-y-4">
            {trade.tips.map((tip, i) => (
              <div key={i} className="flex items-start gap-4 bg-gray-50 rounded-xl border border-gray-200 p-5">
                <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="w-4 h-4 text-amber-600" />
                </div>
                <p className="text-gray-700 text-sm leading-relaxed">{tip}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">
            Questions fr{'é'}quentes {'—'} {trade.name} {'à'} {villeData.name}
          </h2>
          <div className="space-y-4">
            {trade.faq.slice(0, 5).map((item, i) => (
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

      {/* CTA */}
      <section className="py-20 bg-blue-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Trouver un {tradeLower} {'à'} {villeData.name}
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Comparez les profils et obtenez un devis gratuit aupr{'è'}s de professionnels r{'é'}f{'é'}renc{'é'}s {'à'} {villeData.name}.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href={`/services/${service}/${villeSlug}`}
              className="inline-flex items-center gap-2 bg-white text-blue-600 px-8 py-4 rounded-xl font-semibold hover:bg-blue-50 transition-colors text-lg"
            >
              Voir les {tradeLower}s {'à'} {villeData.name}
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href={`/devis/${service}/${villeSlug}`}
              className="inline-flex items-center gap-2 bg-blue-500 text-white px-8 py-4 rounded-xl font-semibold hover:bg-blue-400 transition-colors text-lg border border-blue-400"
            >
              Demander un devis gratuit
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Related cities */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Tarifs {tradeLower} dans d&apos;autres villes
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 max-w-3xl">
            {relatedCities.map((v) => (
              <Link
                key={v.slug}
                href={`/tarifs/${service}/${v.slug}`}
                className="bg-gray-50 hover:bg-blue-50 border border-gray-200 hover:border-blue-300 rounded-xl p-4 transition-all group text-center"
              >
                <div className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors text-sm">
                  {trade.name} {'à'} {v.name}
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Other trades */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Autres tarifs artisans {'à'} {villeData.name}
          </h2>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
            {otherTrades.map((slug) => {
              const t = tradeContent[slug]
              const m = getRegionalMultiplier(villeData.region)
              return (
                <Link
                  key={slug}
                  href={`/tarifs/${slug}/${villeSlug}`}
                  className="bg-white hover:bg-blue-50 border border-gray-200 hover:border-blue-300 rounded-xl p-4 transition-all group"
                >
                  <div className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors text-sm">
                    {t.name} {'à'} {villeData.name}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {Math.round(t.priceRange.min * m)} {'—'} {Math.round(t.priceRange.max * m)} {t.priceRange.unit}
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      </section>

      {/* Services complémentaires */}
      {(() => {
        const complementarySlugs = relatedServices[service] || []
        const complementary = complementarySlugs
          .filter((s) => s !== service && tradeContent[s])
          .slice(0, 4)
        if (complementary.length === 0) return null
        return (
          <section className="py-12 bg-white border-t">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                Services compl{'é'}mentaires {'à'} {villeData.name}
              </h2>
              <p className="text-sm text-gray-500 mb-4">
                Ces services sont souvent demand{'é'}s avec {tradeLower}.
              </p>
              <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4">
                {complementary.map((slug) => {
                  const t = tradeContent[slug]
                  if (!t) return null
                  const m = getRegionalMultiplier(villeData.region)
                  return (
                    <div key={slug} className="bg-gray-50 rounded-xl border border-gray-200 p-4 space-y-2.5">
                      <div className="font-semibold text-gray-900 text-sm">{t.name}</div>
                      <div className="text-xs text-gray-500">
                        {Math.round(t.priceRange.min * m)} {'–'} {Math.round(t.priceRange.max * m)} {t.priceRange.unit}
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        <Link
                          href={`/services/${slug}/${villeSlug}`}
                          className="inline-flex items-center px-2.5 py-1 bg-white hover:bg-blue-50 text-gray-600 hover:text-blue-700 rounded-lg text-xs font-medium border border-gray-200 hover:border-blue-200 transition-all"
                        >
                          Artisans
                        </Link>
                        <Link
                          href={`/devis/${slug}/${villeSlug}`}
                          className="inline-flex items-center px-2.5 py-1 bg-white hover:bg-amber-50 text-gray-600 hover:text-amber-800 rounded-lg text-xs font-medium border border-gray-200 hover:border-amber-200 transition-all"
                        >
                          Devis
                        </Link>
                        <Link
                          href={`/tarifs/${slug}/${villeSlug}`}
                          className="inline-flex items-center px-2.5 py-1 bg-white hover:bg-emerald-50 text-gray-600 hover:text-emerald-800 rounded-lg text-xs font-medium border border-gray-200 hover:border-emerald-200 transition-all"
                        >
                          Tarifs
                        </Link>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </section>
        )
      })()}

      {/* Problèmes courants */}
      {(() => {
        const problems = getProblemsByService(service).slice(0, 4)
        if (problems.length === 0) return null
        return (
          <section className="py-12 bg-white border-t">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Probl{'è'}mes courants</h2>
              <div className="flex flex-wrap gap-3">
                {problems.map((p) => (
                  <Link
                    key={p.slug}
                    href={`/problemes/${p.slug}/${villeSlug}`}
                    className="px-4 py-2.5 bg-gray-50 hover:bg-orange-50 text-gray-700 hover:text-orange-800 rounded-lg text-sm font-medium border border-gray-200 hover:border-orange-200 transition-all"
                  >
                    {p.name} {'à'} {villeData.name}
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
              Devis {tradeLower} {'à'} {villeData.name}
            </Link>
            <Link href={`/avis/${service}/${villeSlug}`} className="px-4 py-2 bg-blue-50 text-blue-800 rounded-lg text-sm font-medium border border-blue-100 hover:border-blue-200 transition-colors">
              Avis {tradeLower} {'à'} {villeData.name}
            </Link>
            <Link href={`/urgence/${service}/${villeSlug}`} className="px-4 py-2 bg-red-50 text-red-800 rounded-lg text-sm font-medium border border-red-100 hover:border-red-200 transition-colors">
              Urgence {tradeLower} {'à'} {villeData.name}
            </Link>
            <Link href={`/services/${service}/${villeSlug}`} className="px-4 py-2 bg-gray-50 text-gray-800 rounded-lg text-sm font-medium border border-gray-200 hover:border-gray-300 transition-colors">
              {trade.name} {'à'} {villeData.name}
            </Link>
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
                <Link href={`/tarifs/${service}`} className="block text-sm text-gray-600 hover:text-blue-600 py-1">
                  Tarifs {tradeLower} en France
                </Link>
                <Link href={`/services/${service}/${villeSlug}`} className="block text-sm text-gray-600 hover:text-blue-600 py-1">
                  {trade.name} {'à'} {villeData.name}
                </Link>
                <Link href={`/services/${service}`} className="block text-sm text-gray-600 hover:text-blue-600 py-1">
                  {trade.name} {'—'} tous les artisans
                </Link>
                <Link href={`/devis/${service}/${villeSlug}`} className="block text-sm text-gray-600 hover:text-blue-600 py-1">
                  Devis {tradeLower} {'à'} {villeData.name}
                </Link>
                <Link href={`/avis/${service}/${villeSlug}`} className="block text-sm text-gray-600 hover:text-blue-600 py-1">
                  Avis {tradeLower} {'à'} {villeData.name}
                </Link>
                <Link href={`/urgence/${service}/${villeSlug}`} className="block text-sm text-gray-600 hover:text-blue-600 py-1">
                  {trade.name} urgence {'à'} {villeData.name}
                </Link>
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Cette ville</h3>
              <div className="space-y-2">
                <Link href={`/villes/${villeSlug}`} className="block text-sm text-gray-600 hover:text-blue-600 py-1">
                  Artisans {'à'} {villeData.name}
                </Link>
                {otherTrades.slice(0, 5).map((slug) => {
                  const t = tradeContent[slug]
                  if (!t) return null
                  return (
                    <Link key={slug} href={`/tarifs/${slug}/${villeSlug}`} className="block text-sm text-gray-600 hover:text-blue-600 py-1">
                      Tarifs {t.name.toLowerCase()} {'à'} {villeData.name}
                    </Link>
                  )
                })}
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Informations utiles</h3>
              <div className="space-y-2">
                <Link href="/tarifs" className="block text-sm text-gray-600 hover:text-blue-600 py-1">Guide complet des tarifs</Link>
                <Link href="/comment-ca-marche" className="block text-sm text-gray-600 hover:text-blue-600 py-1">Comment {'ç'}a marche</Link>
                <Link href="/devis" className="block text-sm text-gray-600 hover:text-blue-600 py-1">Demander un devis</Link>
                <Link href="/faq" className="block text-sm text-gray-600 hover:text-blue-600 py-1">FAQ</Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Editorial */}
      <section className="mb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-slate-50 rounded-2xl border border-slate-200 p-6">
            <h3 className="text-sm font-semibold text-slate-700 mb-2">M{'é'}thodologie tarifaire</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Les prix affich{'é'}s pour {villeData.name} sont des fourchettes indicatives ajust{'é'}es en fonction des donn{'é'}es r{'é'}gionales ({villeData.region}). Ils varient selon la complexit{'é'} du chantier, les mat{'é'}riaux et l&apos;urgence. Seul un devis personnalis{'é'} fait foi. {SITE_NAME} est un annuaire ind{'é'}pendant.
            </p>
          </div>
        </div>
      </section>

      <EstimationWidget context={{
        metier: trade.name,
        metierSlug: service,
        ville: villeData.name,
        departement: villeData.departementCode,
        pageUrl: `/tarifs/${service}/${villeSlug}`,
      }} />
    </div>
  )
}

// ---------------------------------------------------------------------------
// Sub-component
// ---------------------------------------------------------------------------

function LocalFactorCard({
  icon,
  title,
  value,
  description,
}: {
  icon: React.ReactNode
  title: string
  value: string | null
  description: string
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
          {icon}
        </div>
        <div>
          <h3 className="font-semibold text-gray-900 text-sm">{title}</h3>
          {value && <p className="text-xs text-blue-600 font-medium">{value}</p>}
        </div>
      </div>
      <p className="text-gray-600 text-sm leading-relaxed">{description}</p>
    </div>
  )
}
