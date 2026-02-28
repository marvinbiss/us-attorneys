import { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowRight, CheckCircle, Euro, ChevronDown, MapPin, Users, Thermometer, Building2 } from 'lucide-react'
import Breadcrumb from '@/components/Breadcrumb'
import JsonLd from '@/components/JsonLd'
import { getBreadcrumbSchema, getFAQSchema } from '@/lib/seo/jsonld'
import { SITE_URL, SITE_NAME } from '@/lib/seo/config'
import { tradeContent, getTradesSlugs } from '@/lib/data/trade-content'
import { villes, getVilleBySlug, getNearbyCities } from '@/lib/data/france'
import { getCommuneBySlug } from '@/lib/data/commune-data'
import { hashCode } from '@/lib/seo/location-content'
import { getServiceImage } from '@/lib/data/images'

// ---------------------------------------------------------------------------
// Static params: top 5 cities x 46 services = 230 pages
// ---------------------------------------------------------------------------

const tradeSlugs = getTradesSlugs()

function parsePopulation(pop: string): number {
  return parseInt(pop.replace(/\s/g, ''), 10) || 0
}

const top5Cities = [...villes]
  .sort((a, b) => parsePopulation(b.population) - parsePopulation(a.population))
  .slice(0, 5)

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

function getRegionalMultiplier(region: string): number {
  const multipliers: Record<string, number> = {
    'Ile-de-France': 1.25,
    '\u00CEle-de-France': 1.25,
    'Provence-Alpes-C\u00F4te d\'Azur': 1.10,
    'Auvergne-Rh\u00F4ne-Alpes': 1.10,
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
    return `\u00C0 noter : le climat méditerranéen favorise les travaux extérieurs quasiment toute l'année. La demande de ${serviceName.toLowerCase()} peut \u00EAtre plus forte en été avec l'afflux de résidents saisonniers.`
  }
  if (zone === 'montagnard') {
    return `En zone de montagne, les conditions hivernales peuvent limiter certains travaux extérieurs et augmenter les délais d'intervention. Prévoyez vos travaux de ${serviceName.toLowerCase()} en amont.`
  }
  if (zone === 'continental') {
    return `Avec un climat continental, les écarts de température sont importants. Les travaux de ${serviceName.toLowerCase()} liés au chauffage et \u00E0 l'isolation sont particuli\u00E8rement pertinents.`
  }
  if (zone === 'oceanique' || zone === 'semi-oceanique') {
    return `Le climat océanique implique une humidité fréquente. Les interventions de ${serviceName.toLowerCase()} liées \u00E0 l'étanchéité et \u00E0 la ventilation sont courantes.`
  }
  return `Les conditions climatiques locales peuvent influencer le type et la fréquence des interventions de ${serviceName.toLowerCase()}.`
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
    `Tarif ${tradeLower} \u00e0 ${villeData.name} 2026`,
    `Tarifs ${tradeLower} ${villeData.name}`,
    `Prix ${tradeLower} \u00e0 ${villeData.name}`,
    `Co\u00fbt ${tradeLower} ${villeData.name} 2026`,
  ]
  const title = truncateTitle(titleTemplates[titleHash % titleTemplates.length])

  const descHash = Math.abs(hashCode(`tarif-desc-${service}-${villeSlug}`))
  const descTemplates = [
    `Prix ${tradeLower} \u00E0 ${villeData.name} en 2026 : ${minPrice}\u2013${maxPrice} ${unit}. Tarifs locaux, facteurs de prix et devis gratuit.`,
    `Tarif ${tradeLower} \u00E0 ${villeData.name} (${dept}) : de ${minPrice} \u00E0 ${maxPrice} ${unit}. Comparez les artisans et demandez un devis.`,
    `Quel est le prix d\u2019un ${tradeLower} \u00E0 ${villeData.name} ? De ${minPrice} \u00E0 ${maxPrice} ${unit} en 2026. Guide complet et devis gratuit.`,
    `Guide des tarifs ${tradeLower} \u00E0 ${villeData.name} en 2026. Prix moyen : ${minPrice}\u2013${maxPrice} ${unit}. Conseils et devis sans engagement.`,
    `Tarifs ${tradeLower} ${villeData.name} en 2026 : ${minPrice} \u00E0 ${maxPrice} ${unit}. D\u00E9couvrez les prix locaux et obtenez un devis gratuit.`,
  ]
  const description = descTemplates[descHash % descTemplates.length]

  const canonicalUrl = `${SITE_URL}/tarifs/${service}/${villeSlug}`

  let providerCount = 1
  if (process.env.NEXT_BUILD_SKIP_DB !== '1') {
    try {
      const { createAdminClient } = await import('@/lib/supabase/admin')
      const supabase = createAdminClient()
      const { count } = await supabase
        .from('providers')
        .select('id', { count: 'exact', head: true })
        .eq('is_active', true)
        .eq('address_city', villeData.name)
        .limit(1)
      providerCount = count ?? 0
    } catch {
      providerCount = 1
    }
  }

  return {
    title,
    description,
    alternates: { canonical: canonicalUrl },
    ...(providerCount === 0 ? { robots: { index: false, follow: true } } : {}),
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
      question: f.q.replace(/\?$/, '') + ` \u00E0 ${villeData.name}\u00A0?`,
      answer: f.a,
    }))
  )

  const offerCount = commune?.nb_entreprises_artisanales
  const localBusinessSchema = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: `${trade.name} \u00E0 ${villeData.name}`,
    description: `Service de ${tradeLower} \u00E0 ${villeData.name} (${villeData.departement}). Tarifs 2026 : ${minPrice} \u00E0 ${maxPrice} ${trade.priceRange.unit}.`,
    provider: {
      '@type': 'Organization',
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

  const pricingItemListSchema = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `Tarifs ${trade.name} \u00E0 ${villeData.name}`,
    description: `Liste des prestations et prix indicatifs pour ${trade.name} \u00E0 ${villeData.name}`,
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

  const relatedCities = getNearbyCities(villeSlug, 6)

  const otherTrades = tradeSlugs.filter((s) => s !== service).slice(0, 6)

  return (
    <div className="min-h-screen bg-gray-50">
      <JsonLd data={[breadcrumbSchema, faqSchema, localBusinessSchema, pricingItemListSchema]} />

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
                  `Tarifs ${tradeLower} \u00E0 ${villeData.name} en 2026`,
                  `Prix ${tradeLower} \u00E0 ${villeData.name} : guide des tarifs 2026`,
                  `Combien co\u00FBte un ${tradeLower} \u00E0 ${villeData.name}\u00A0?`,
                  `${trade.name} \u00E0 ${villeData.name} : tarifs et prix 2026`,
                  `Guide des tarifs ${tradeLower} \u00E0 ${villeData.name}`,
                ]
                return h1Templates[h1Hash % h1Templates.length]
              })()}
            </h1>
            <p className="text-xl text-slate-400 max-w-3xl mx-auto mb-4">
              Prix {tradeLower} {'\u00E0'} {villeData.name} ({villeData.departement}) :
              {' '}{minPrice} {'\u00E0'} {maxPrice} {trade.priceRange.unit}.
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
              Tarif horaire moyen {'\u00E0'} {villeData.name}
            </h2>
            <div className="flex items-baseline justify-center gap-2">
              <span className="text-5xl font-bold text-blue-600">
                {minPrice} {'—'} {maxPrice}
              </span>
              <span className="text-gray-600 text-lg">{trade.priceRange.unit}</span>
            </div>
            <p className="text-gray-500 text-sm mt-3">
              Prix moyen constat{'é'} {'\u00E0'} {villeData.name} et ses alentours,
              main-d&apos;oeuvre incluse
            </p>
            {multiplier !== 1.0 && (
              <p className="text-xs text-gray-400 mt-2">
                {multiplier > 1.0
                  ? `Les tarifs en ${villeData.region} sont en moyenne ${Math.round((multiplier - 1) * 100)}\u00A0% supérieurs \u00E0 la moyenne nationale`
                  : `Les tarifs en ${villeData.region} sont en moyenne ${Math.round((1 - multiplier) * 100)}\u00A0% inférieurs \u00E0 la moyenne nationale`}
              </p>
            )}
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Prestations courantes et prix {'\u00E0'} {villeData.name}
          </h2>
          <div className="space-y-4">
            {trade.commonTasks.map((task, i) => (
              <div key={i} className="flex items-start gap-4 bg-gray-50 rounded-xl border border-gray-200 p-5 hover:bg-blue-50 hover:border-blue-200 transition-colors">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Euro className="w-4 h-4 text-blue-600" />
                </div>
                <span className="text-gray-800">{task}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Local factors */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2 text-center">
            Facteurs qui influencent les prix {'\u00E0'} {villeData.name}
          </h2>
          <p className="text-gray-500 text-sm text-center mb-8">
            Plusieurs facteurs locaux expliquent les variations tarifaires {'\u00E0'} {villeData.name}.
          </p>
          <div className="grid sm:grid-cols-2 gap-6">
            <LocalFactorCard
              icon={<Euro className="w-5 h-5 text-blue-600" />}
              title="Pouvoir d'achat local"
              value={commune?.revenu_median ? `${formatNumber(commune.revenu_median)} €/an` : null}
              description={
                commune?.revenu_median
                  ? `Le revenu médian \u00E0 ${villeData.name} est de ${formatNumber(commune.revenu_median)}\u00A0€ par an, ce qui influence le positionnement tarifaire des artisans locaux.`
                  : `Le pouvoir d'achat local \u00E0 ${villeData.name} influence le niveau des tarifs pratiqués par les artisans.`
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
                    : `${villeData.name} compte ${formatNumber(commune.nb_entreprises_artisanales)} entreprises artisanales. Une concurrence modérée peut impliquer des tarifs lég\u00E8rement plus élevés.`
                  : `Le nombre d'artisans disponibles \u00E0 ${villeData.name} influence directement les tarifs pratiqués.`
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
              value={commune?.part_maisons_pct ? `${commune.part_maisons_pct}\u00A0% de maisons` : null}
              description={
                commune?.part_maisons_pct
                  ? commune.part_maisons_pct > 50
                    ? `\u00C0 ${villeData.name}, ${commune.part_maisons_pct}\u00A0% des logements sont des maisons individuelles. Les interventions sur maisons (toiture, fa\u00E7ade, jardin) sont fréquentes.`
                    : `\u00C0 ${villeData.name}, les appartements sont majoritaires (${100 - commune.part_maisons_pct}\u00A0%). Les travaux en copropriété peuvent impliquer des contraintes spécifiques.`
                  : `La répartition entre maisons et appartements \u00E0 ${villeData.name} influence les types de travaux demandés.`
              }
            />
          </div>

          {commune && (commune.nb_artisans_rge || commune.prix_m2_moyen) && (
            <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {commune.prix_m2_moyen && (
                <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
                  <div className="text-2xl font-bold text-gray-900">{formatNumber(commune.prix_m2_moyen)} {'€'}/m{'\u00B2'}</div>
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

      {/* Conseils */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            Conseils pour choisir un {tradeLower} {'\u00E0'} {villeData.name}
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
            Questions fr{'é'}quentes {'—'} {trade.name} {'\u00E0'} {villeData.name}
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
            Trouver un {tradeLower} {'\u00E0'} {villeData.name}
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Comparez les profils et obtenez un devis gratuit aupr{'\u00E8'}s de professionnels r{'é'}f{'é'}renc{'é'}s {'\u00E0'} {villeData.name}.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href={`/services/${service}/${villeSlug}`}
              className="inline-flex items-center gap-2 bg-white text-blue-600 px-8 py-4 rounded-xl font-semibold hover:bg-blue-50 transition-colors text-lg"
            >
              Voir les {tradeLower}s {'\u00E0'} {villeData.name}
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
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-w-3xl">
            {relatedCities.map((v) => (
              <Link
                key={v.slug}
                href={`/tarifs/${service}/${v.slug}`}
                className="bg-gray-50 hover:bg-blue-50 border border-gray-200 hover:border-blue-300 rounded-xl p-4 transition-all group text-center"
              >
                <div className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors text-sm">
                  {trade.name} {'\u00E0'} {v.name}
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
            Autres tarifs artisans {'\u00E0'} {villeData.name}
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
                    {t.name} {'\u00E0'} {villeData.name}
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

      {/* Cross-intent navigation */}
      <section className="py-8 border-t">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Voir aussi</h2>
          <div className="flex flex-wrap gap-3">
            <Link href={`/devis/${service}/${villeSlug}`} className="px-4 py-2 bg-amber-50 text-amber-800 rounded-lg text-sm font-medium border border-amber-100 hover:border-amber-200 transition-colors">
              Devis {tradeLower} {'\u00E0'} {villeData.name}
            </Link>
            <Link href={`/avis/${service}/${villeSlug}`} className="px-4 py-2 bg-blue-50 text-blue-800 rounded-lg text-sm font-medium border border-blue-100 hover:border-blue-200 transition-colors">
              Avis {tradeLower} {'\u00E0'} {villeData.name}
            </Link>
            <Link href={`/urgence/${service}/${villeSlug}`} className="px-4 py-2 bg-red-50 text-red-800 rounded-lg text-sm font-medium border border-red-100 hover:border-red-200 transition-colors">
              Urgence {tradeLower} {'\u00E0'} {villeData.name}
            </Link>
            <Link href={`/services/${service}/${villeSlug}`} className="px-4 py-2 bg-gray-50 text-gray-800 rounded-lg text-sm font-medium border border-gray-200 hover:border-gray-300 transition-colors">
              {trade.name} {'\u00E0'} {villeData.name}
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
                  {trade.name} {'\u00E0'} {villeData.name}
                </Link>
                <Link href={`/services/${service}`} className="block text-sm text-gray-600 hover:text-blue-600 py-1">
                  {trade.name} {'—'} tous les artisans
                </Link>
                <Link href={`/devis/${service}/${villeSlug}`} className="block text-sm text-gray-600 hover:text-blue-600 py-1">
                  Devis {tradeLower} {'\u00E0'} {villeData.name}
                </Link>
                <Link href={`/avis/${service}/${villeSlug}`} className="block text-sm text-gray-600 hover:text-blue-600 py-1">
                  Avis {tradeLower} {'\u00E0'} {villeData.name}
                </Link>
                <Link href={`/urgence/${service}/${villeSlug}`} className="block text-sm text-gray-600 hover:text-blue-600 py-1">
                  {trade.name} urgence {'\u00E0'} {villeData.name}
                </Link>
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Cette ville</h3>
              <div className="space-y-2">
                <Link href={`/villes/${villeSlug}`} className="block text-sm text-gray-600 hover:text-blue-600 py-1">
                  Artisans {'\u00E0'} {villeData.name}
                </Link>
                {otherTrades.slice(0, 3).map((slug) => (
                  <Link key={slug} href={`/tarifs/${slug}/${villeSlug}`} className="block text-sm text-gray-600 hover:text-blue-600 py-1">
                    Tarifs {tradeContent[slug].name.toLowerCase()} {'\u00E0'} {villeData.name}
                  </Link>
                ))}
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Informations utiles</h3>
              <div className="space-y-2">
                <Link href="/tarifs" className="block text-sm text-gray-600 hover:text-blue-600 py-1">Guide complet des tarifs</Link>
                <Link href="/comment-ca-marche" className="block text-sm text-gray-600 hover:text-blue-600 py-1">Comment {'\u00E7'}a marche</Link>
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
