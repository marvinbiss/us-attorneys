import { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowRight, CheckCircle, Euro, ChevronDown, MapPin, Users, Thermometer, Building2 } from 'lucide-react'
import Breadcrumb from '@/components/Breadcrumb'
import JsonLd from '@/components/JsonLd'
import { getBreadcrumbSchema, getFAQSchema } from '@/lib/seo/jsonld'
import { SITE_URL, SITE_NAME } from '@/lib/seo/config'
import { hashCode, getRegionalMultiplier } from '@/lib/seo/location-content'
import { tradeContent, getTradesSlugs } from '@/lib/data/trade-content'
import { villes, getVilleBySlug, getNearbyCities } from '@/lib/data/france'
import { getCommuneBySlug, formatNumber, formatEuro } from '@/lib/data/commune-data'
import { getServiceImage } from '@/lib/data/images'
import { relatedServices } from '@/lib/constants/navigation'
import { getProblemsByService } from '@/lib/data/problems'
import DevisForm from '@/components/DevisForm'

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
  const params: { service: string; location: string }[] = []
  for (const service of tradeSlugs) {
    for (const ville of top5Cities) {
      params.push({ service, location: ville.slug })
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
  params: Promise<{ service: string; location: string }>
}): Promise<Metadata> {
  const { service, location } = await params
  const trade = tradeContent[service]
  const villeData = getVilleBySlug(location)
  if (!trade || !villeData) return {}

  const tradeLower = trade.name.toLowerCase()
  const multiplier = getRegionalMultiplier(villeData.region)
  const minPrice = Math.round(trade.priceRange.min * multiplier)
  const maxPrice = Math.round(trade.priceRange.max * multiplier)

  const dept = villeData.departement

  const titleHash = Math.abs(hashCode(`devis-loc-title-${service}-${location}`))
  const titleTemplates = [
    `Devis ${tradeLower} ${villeData.name} — Gratuit`,
    `Devis ${tradeLower} ${villeData.name} 2026`,
    `Devis ${tradeLower} ${villeData.name} : comparez`,
    `Devis ${tradeLower} à ${villeData.name} — Gratuit`,
    `Devis ${tradeLower} ${villeData.name} : 3 offres`,
  ]
  const title = truncateTitle(titleTemplates[titleHash % titleTemplates.length])

  const descHash = Math.abs(hashCode(`devis-loc-desc-${service}-${location}`))
  const descTemplates = [
    `Devis ${tradeLower} à ${villeData.name} : ${minPrice}–${maxPrice} ${trade.priceRange.unit}. Comparez jusqu'à 3 artisans référencés. 100 % gratuit, sans engagement.`,
    `Demandez un devis ${tradeLower} à ${villeData.name} (${dept}). Prix local : ${minPrice}–${maxPrice} ${trade.priceRange.unit}. Réponse sous 24h.`,
    `${trade.name} à ${villeData.name} : obtenez un devis gratuit et comparez les artisans vérifiés. De ${minPrice} à ${maxPrice} ${trade.priceRange.unit}.`,
    `Devis ${tradeLower} ${villeData.name} : comparez les prix (${minPrice}–${maxPrice} ${trade.priceRange.unit}) et choisissez le meilleur artisan. Gratuit.`,
    `Besoin d'un ${tradeLower} à ${villeData.name} ? Recevez jusqu'à 3 devis gratuits d'artisans vérifiés dans le ${dept}.`,
  ]
  const description = descTemplates[descHash % descTemplates.length]

  const serviceImage = getServiceImage(service)
  const canonicalUrl = `${SITE_URL}/devis/${service}/${location}`

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
      images: [{ url: serviceImage.src, width: 800, height: 600, alt: `Devis ${trade.name} à ${villeData.name}` }],
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

export default async function DevisServiceLocationPage({
  params,
}: {
  params: Promise<{ service: string; location: string }>
}) {
  const { service, location } = await params

  const trade = tradeContent[service]
  const villeData = getVilleBySlug(location)
  if (!trade || !villeData) notFound()

  const commune = await getCommuneBySlug(location)

  const multiplier = getRegionalMultiplier(villeData.region)
  const minPrice = Math.round(trade.priceRange.min * multiplier)
  const maxPrice = Math.round(trade.priceRange.max * multiplier)

  const tradeLower = trade.name.toLowerCase()

  // Count recent devis requests for freshness signal
  let recentDevisCount = 0
  if (process.env.NEXT_BUILD_SKIP_DB !== '1') {
    try {
      const { createAdminClient } = await import('@/lib/supabase/admin')
      const supabase = createAdminClient()
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
      const { count } = await supabase
        .from('devis_requests')
        .select('*', { count: 'exact', head: true })
        .ilike('city', villeData.name)
        .ilike('service_name', trade.name)
        .gte('created_at', thirtyDaysAgo.toISOString())
      recentDevisCount = count ?? 0
    } catch {
      recentDevisCount = 0
    }
  }

  // Schemas
  const breadcrumbSchema = getBreadcrumbSchema([
    { name: 'Accueil', url: '/' },
    { name: 'Devis', url: '/devis' },
    { name: `Devis ${tradeLower}`, url: `/devis/${service}` },
    { name: villeData.name, url: `/devis/${service}/${location}` },
  ])

  const faqSchema = getFAQSchema(
    trade.faq.slice(0, 5).map((f) => ({
      question: f.q.replace(/\?$/, '') + ` à ${villeData.name} ?`,
      answer: f.a,
    }))
  )

  const serviceSchema = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: `Devis ${trade.name} à ${villeData.name}`,
    description: `Demandez un devis gratuit pour ${tradeLower} à ${villeData.name} (${villeData.departement}). Prix : ${minPrice}–${maxPrice} ${trade.priceRange.unit}.`,
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
      offerCount: commune?.nb_entreprises_artisanales ?? undefined,
    },
  }

  // Related city links
  const nearbyCities = getNearbyCities(location, 6)

  // Related services
  const relatedSlugs = relatedServices[service] || []
  const otherTrades = relatedSlugs.length > 0
    ? relatedSlugs.slice(0, 6).filter((s) => tradeContent[s])
    : tradeSlugs.filter((s) => s !== service).slice(0, 6)

  return (
    <div className="min-h-screen bg-gray-50">
      <JsonLd data={[breadcrumbSchema, faqSchema, serviceSchema]} />

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
              { label: 'Devis', href: '/devis' },
              { label: `Devis ${tradeLower}`, href: `/devis/${service}` },
              { label: villeData.name },
            ]}
            className="mb-6 text-slate-400 [&_a]:text-slate-400 [&_a:hover]:text-white [&_svg]:text-slate-600"
          />
          <div className="text-center">
            <h1 className="font-heading text-4xl md:text-5xl font-extrabold mb-6 tracking-[-0.025em]">
              {(() => {
                const h1Hash = Math.abs(hashCode(`devis-loc-h1-${service}-${location}`))
                const h1Templates = [
                  `Devis ${tradeLower} à ${villeData.name}`,
                  `Obtenez un devis gratuit pour ${tradeLower} à ${villeData.name}`,
                  `${trade.name} à ${villeData.name} — Devis gratuit en 24h`,
                  `Devis ${tradeLower} : comparez les artisans à ${villeData.name}`,
                  `${trade.name} à ${villeData.name} : devis détaillé gratuit`,
                ]
                return h1Templates[h1Hash % h1Templates.length]
              })()}
            </h1>
            <p className="text-xl text-slate-400 max-w-3xl mx-auto mb-4">
              Comparez jusqu&apos;à 3 devis de {tradeLower}s à {villeData.name} ({villeData.departement}).
              Prix local : {minPrice} à {maxPrice} {trade.priceRange.unit}.
            </p>
            {recentDevisCount > 0 && (
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-50 text-green-700 rounded-full text-sm font-medium mt-4">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                {recentDevisCount} devis demandé{recentDevisCount > 1 ? 's' : ''} ce mois-ci
              </div>
            )}
            <div className="flex flex-wrap justify-center gap-3 mt-8">
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur px-4 py-2 rounded-full border border-white/10 text-sm">
                <Euro className="w-4 h-4 text-amber-400" />
                <span>{minPrice} – {maxPrice} {trade.priceRange.unit}</span>
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

      {/* DevisForm pre-filled */}
      <section id="formulaire" className="relative -mt-16 z-10 px-4 pb-20">
        <DevisForm
          prefilledService={service}
          prefilledCity={villeData.name}
          prefilledCityPostal={villeData.codePostal}
        />
      </section>

      {/* Common tasks grid with prices */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-2xl p-8 text-center mb-12">
            <h2 className="text-lg font-semibold text-gray-700 mb-2">
              Tarif indicatif à {villeData.name}
            </h2>
            <div className="flex items-baseline justify-center gap-2">
              <span className="text-5xl font-bold text-blue-600">
                {minPrice} — {maxPrice}
              </span>
              <span className="text-gray-600 text-lg">{trade.priceRange.unit}</span>
            </div>
            <p className="text-gray-500 text-sm mt-3">
              Prix moyen constaté à {villeData.name} et ses alentours, main-d&apos;œuvre incluse
            </p>
            {multiplier !== 1.0 && (
              <p className="text-xs text-gray-400 mt-2">
                {multiplier > 1.0
                  ? `Les tarifs en ${villeData.region} sont en moyenne ${Math.round((multiplier - 1) * 100)} % supérieurs à la moyenne nationale`
                  : `Les tarifs en ${villeData.region} sont en moyenne ${Math.round((1 - multiplier) * 100)} % inférieurs à la moyenne nationale`}
              </p>
            )}
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Prestations courantes à {villeData.name}
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
            Facteurs locaux à {villeData.name}
          </h2>
          <p className="text-gray-500 text-sm text-center mb-8">
            Plusieurs facteurs locaux influencent le coût d'un {tradeLower} à {villeData.name}.
          </p>
          <div className="grid sm:grid-cols-2 gap-6">
            <LocalFactorCard
              icon={<Euro className="w-5 h-5 text-blue-600" />}
              title="Pouvoir d'achat local"
              value={commune?.revenu_median ? `${formatNumber(commune.revenu_median)} €/an` : null}
              description={
                commune?.revenu_median
                  ? `Le revenu médian à ${villeData.name} est de ${formatNumber(commune.revenu_median)} € par an, ce qui influence le positionnement tarifaire des artisans locaux.`
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
              value={commune?.part_maisons_pct ? `${commune.part_maisons_pct} % de maisons` : null}
              description={
                commune?.part_maisons_pct
                  ? commune.part_maisons_pct > 50
                    ? `À ${villeData.name}, ${commune.part_maisons_pct} % des logements sont des maisons individuelles. Les interventions sur maisons (toiture, façade, jardin) sont fréquentes.`
                    : `À ${villeData.name}, les appartements sont majoritaires (${100 - commune.part_maisons_pct} %). Les travaux en copropriété peuvent impliquer des contraintes spécifiques.`
                  : `La répartition entre maisons et appartements à ${villeData.name} influence les types de travaux demandés.`
              }
            />
          </div>
        </div>
      </section>

      {/* Contexte local pour votre devis */}
      {commune && (
        <section className="py-12 bg-white border-t">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Contexte local pour votre devis à {villeData.name}
            </h2>
            <div className="grid sm:grid-cols-2 gap-6">
              {(commune.nb_artisans_btp != null || commune.nb_entreprises_artisanales != null) && (
                <div className="bg-gray-50 rounded-xl border border-gray-200 p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Users className="w-5 h-5 text-blue-600" />
                    </div>
                    <h3 className="font-semibold text-gray-900 text-sm">Tissu artisanal</h3>
                  </div>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    {commune.nb_artisans_btp != null
                      ? `${formatNumber(commune.nb_artisans_btp)} artisans BTP référencés à ${villeData.name}, ce qui favorise la concurrence et des devis compétitifs.`
                      : `${formatNumber(commune.nb_entreprises_artisanales!)} entreprises artisanales à ${villeData.name}, ce qui favorise la concurrence et des devis compétitifs.`}
                  </p>
                </div>
              )}

              {commune.nb_artisans_rge != null && (
                <div className="bg-gray-50 rounded-xl border border-gray-200 p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    </div>
                    <h3 className="font-semibold text-gray-900 text-sm">Artisans RGE certifiés</h3>
                  </div>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    {formatNumber(commune.nb_artisans_rge)} artisans RGE certifiés à {villeData.name} pour les travaux éligibles aux aides à la rénovation énergétique.
                  </p>
                </div>
              )}

              {commune.revenu_median != null && (
                <div className="bg-gray-50 rounded-xl border border-gray-200 p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Euro className="w-5 h-5 text-amber-600" />
                    </div>
                    <h3 className="font-semibold text-gray-900 text-sm">Budget des ménages</h3>
                  </div>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    Le revenu médian à {villeData.name} est de {formatEuro(commune.revenu_median)}/an, ce qui contextualise le budget moyen des ménages pour les travaux.
                  </p>
                </div>
              )}

              {commune.prix_m2_moyen != null && (
                <div className="bg-gray-50 rounded-xl border border-gray-200 p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Building2 className="w-5 h-5 text-purple-600" />
                    </div>
                    <h3 className="font-semibold text-gray-900 text-sm">Prix immobilier</h3>
                  </div>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    Le prix au m² de {formatEuro(commune.prix_m2_moyen)} à {villeData.name} permet d&apos;estimer le budget travaux proportionnel à la valeur du bien.
                  </p>
                </div>
              )}

              {commune.pct_passoires_dpe != null && (
                <div className="bg-gray-50 rounded-xl border border-gray-200 p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Thermometer className="w-5 h-5 text-red-600" />
                    </div>
                    <h3 className="font-semibold text-gray-900 text-sm">Passoires thermiques</h3>
                  </div>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    {commune.pct_passoires_dpe}&nbsp;% de passoires thermiques (DPE F ou G) à {villeData.name} — forte demande en rénovation énergétique.
                  </p>
                </div>
              )}

              {(commune.jours_gel_annuels != null || commune.climat_zone != null) && (
                <div className="bg-gray-50 rounded-xl border border-gray-200 p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-sky-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Thermometer className="w-5 h-5 text-sky-600" />
                    </div>
                    <h3 className="font-semibold text-gray-900 text-sm">Contexte climatique</h3>
                  </div>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    {getClimatLabel(commune.climat_zone ?? null)}
                    {commune.jours_gel_annuels != null && ` avec ${commune.jours_gel_annuels} jours de gel par an`}
                    {' — '}un facteur à prendre en compte pour planifier vos travaux de {tradeLower}.
                  </p>
                </div>
              )}

              {commune.part_maisons_pct != null && (
                <div className="bg-gray-50 rounded-xl border border-gray-200 p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Building2 className="w-5 h-5 text-indigo-600" />
                    </div>
                    <h3 className="font-semibold text-gray-900 text-sm">Type de bâti dominant</h3>
                  </div>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    {commune.part_maisons_pct > 50
                      ? `${commune.part_maisons_pct} % de maisons individuelles à ${villeData.name} — les travaux de toiture, façade et jardin sont fréquents.`
                      : `${100 - commune.part_maisons_pct} % d'appartements à ${villeData.name} — les travaux en copropriété et de rénovation intérieure prédominent.`}
                  </p>
                </div>
              )}
            </div>

            {/* Bon à savoir */}
            {((commune.revenu_median != null && commune.revenu_median < 28000) ||
              (commune.pct_passoires_dpe != null && commune.pct_passoires_dpe > 20) ||
              (commune.jours_gel_annuels != null && commune.jours_gel_annuels > 30)) && (
              <div className="mt-8 bg-blue-50 rounded-xl border border-blue-200 p-6">
                <h3 className="font-semibold text-blue-900 text-sm mb-3">💡 Bon à savoir</h3>
                <ul className="space-y-2 text-sm text-blue-800">
                  {commune.revenu_median != null && commune.revenu_median < 22000 && (
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                      <span>Avec un revenu médian de {formatEuro(commune.revenu_median)}/an, de nombreux ménages à {villeData.name} peuvent être éligibles à <strong>MaPrimeRénov&apos; Bleu</strong> (barème le plus avantageux).</span>
                    </li>
                  )}
                  {commune.revenu_median != null && commune.revenu_median >= 22000 && commune.revenu_median < 28000 && (
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                      <span>Avec un revenu médian de {formatEuro(commune.revenu_median)}/an, de nombreux ménages à {villeData.name} peuvent être éligibles à <strong>MaPrimeRénov&apos; Jaune</strong> (barème avantageux).</span>
                    </li>
                  )}
                  {commune.pct_passoires_dpe != null && commune.pct_passoires_dpe > 20 && (
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                      <span>Avec {commune.pct_passoires_dpe}&nbsp;% de passoires thermiques, la rénovation énergétique est une <strong>urgence</strong> à {villeData.name}. Les aides de l&apos;État sont renforcées pour ces logements.</span>
                    </li>
                  )}
                  {commune.jours_gel_annuels != null && commune.jours_gel_annuels > 30 && (
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                      <span>Avec {commune.jours_gel_annuels} jours de gel par an, l&apos;<strong>isolation</strong> est une priorité à {villeData.name} pour réduire la facture de chauffage.</span>
                    </li>
                  )}
                </ul>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Conseils */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            Conseils pour choisir un {tradeLower} à {villeData.name}
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
            Questions fréquentes — Devis {trade.name} à {villeData.name}
          </h2>
          <div className="space-y-4">
            {trade.faq.slice(0, 5).map((item, i) => (
              <details key={i} className="bg-white rounded-xl border border-gray-200 group">
                <summary className="flex items-center justify-between p-6 cursor-pointer list-none">
                  <h3 className="text-base font-semibold text-gray-900 pr-4">
                    {item.q.replace(/\?$/, '')} à {villeData.name}&nbsp;?
                  </h3>
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
            Trouver un {tradeLower} à {villeData.name}
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Comparez les profils et obtenez un devis gratuit auprès de professionnels référencés à {villeData.name}.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <a
              href="#formulaire"
              className="inline-flex items-center gap-2 bg-white text-blue-600 px-8 py-4 rounded-xl font-semibold hover:bg-blue-50 transition-colors text-lg"
            >
              Demander un devis gratuit
              <ArrowRight className="w-5 h-5" />
            </a>
            <Link
              href={`/services/${service}/${location}`}
              className="inline-flex items-center gap-2 bg-blue-500 text-white px-8 py-4 rounded-xl font-semibold hover:bg-blue-400 transition-colors text-lg border border-blue-400"
            >
              Voir les {tradeLower}s à {villeData.name}
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Related cities */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Devis {tradeLower} dans d&apos;autres villes
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 max-w-3xl">
            {nearbyCities.map((v) => (
              <Link
                key={v.slug}
                href={`/devis/${service}/${v.slug}`}
                className="bg-gray-50 hover:bg-blue-50 border border-gray-200 hover:border-blue-300 rounded-xl p-4 transition-all group text-center"
              >
                <div className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors text-sm">
                  Devis {tradeLower} à {v.name}
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Related services */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Autres devis artisans à {villeData.name}
          </h2>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
            {otherTrades.map((slug) => {
              const t = tradeContent[slug]
              if (!t) return null
              const m = getRegionalMultiplier(villeData.region)
              return (
                <Link
                  key={slug}
                  href={`/devis/${slug}/${location}`}
                  className="bg-white hover:bg-blue-50 border border-gray-200 hover:border-blue-300 rounded-xl p-4 transition-all group"
                >
                  <div className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors text-sm">
                    Devis {t.name.toLowerCase()} à {villeData.name}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {Math.round(t.priceRange.min * m)} — {Math.round(t.priceRange.max * m)} {t.priceRange.unit}
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      </section>

      {/* Services complémentaires */}
      {(() => {
        const complementary = otherTrades
          .filter((s) => s !== service && tradeContent[s])
          .slice(0, 4)
        if (complementary.length === 0) return null
        return (
          <section className="py-12 bg-gray-50 border-t">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                Services complémentaires à {villeData.name}
              </h2>
              <p className="text-sm text-gray-500 mb-4">
                Ces services sont souvent demandés avec {tradeLower}.
              </p>
              <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4">
                {complementary.map((slug) => {
                  const t = tradeContent[slug]
                  if (!t) return null
                  const m = getRegionalMultiplier(villeData.region)
                  return (
                    <div key={slug} className="bg-white rounded-xl border border-gray-200 p-4 space-y-2.5">
                      <div className="font-semibold text-gray-900 text-sm">{t.name}</div>
                      <div className="text-xs text-gray-500">
                        {Math.round(t.priceRange.min * m)}–{Math.round(t.priceRange.max * m)} {t.priceRange.unit}
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        <Link
                          href={`/services/${slug}/${location}`}
                          className="inline-flex items-center px-2.5 py-1 bg-gray-50 hover:bg-blue-50 text-gray-600 hover:text-blue-700 rounded-lg text-xs font-medium border border-gray-200 hover:border-blue-200 transition-all"
                        >
                          Artisans
                        </Link>
                        <Link
                          href={`/devis/${slug}/${location}`}
                          className="inline-flex items-center px-2.5 py-1 bg-gray-50 hover:bg-amber-50 text-gray-600 hover:text-amber-800 rounded-lg text-xs font-medium border border-gray-200 hover:border-amber-200 transition-all"
                        >
                          Devis
                        </Link>
                        <Link
                          href={`/tarifs/${slug}/${location}`}
                          className="inline-flex items-center px-2.5 py-1 bg-gray-50 hover:bg-emerald-50 text-gray-600 hover:text-emerald-800 rounded-lg text-xs font-medium border border-gray-200 hover:border-emerald-200 transition-all"
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
              <h2 className="text-xl font-bold text-gray-900 mb-4">Problèmes courants</h2>
              <div className="flex flex-wrap gap-3">
                {problems.map((p) => (
                  <Link
                    key={p.slug}
                    href={`/problemes/${p.slug}/${location}`}
                    className="px-4 py-2.5 bg-gray-50 hover:bg-orange-50 text-gray-700 hover:text-orange-800 rounded-lg text-sm font-medium border border-gray-200 hover:border-orange-200 transition-all"
                  >
                    {p.name} à {villeData.name}
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
            <Link href={`/avis/${service}/${location}`} className="px-4 py-2 bg-blue-50 text-blue-800 rounded-lg text-sm font-medium border border-blue-100 hover:border-blue-200 transition-colors">
              Avis {tradeLower} à {villeData.name}
            </Link>
            <Link href={`/tarifs/${service}/${location}`} className="px-4 py-2 bg-emerald-50 text-emerald-800 rounded-lg text-sm font-medium border border-emerald-100 hover:border-emerald-200 transition-colors">
              Tarifs {tradeLower} à {villeData.name}
            </Link>
            <Link href={`/urgence/${service}/${location}`} className="px-4 py-2 bg-red-50 text-red-800 rounded-lg text-sm font-medium border border-red-100 hover:border-red-200 transition-colors">
              Urgence {tradeLower} à {villeData.name}
            </Link>
            <Link href={`/services/${service}/${location}`} className="px-4 py-2 bg-gray-50 text-gray-800 rounded-lg text-sm font-medium border border-gray-200 hover:border-gray-300 transition-colors">
              {trade.name} à {villeData.name}
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
                <Link href={`/devis/${service}`} className="block text-sm text-gray-600 hover:text-blue-600 py-1">
                  Devis {tradeLower} en France
                </Link>
                <Link href={`/tarifs/${service}/${location}`} className="block text-sm text-gray-600 hover:text-blue-600 py-1">
                  Tarifs {tradeLower} à {villeData.name}
                </Link>
                <Link href={`/services/${service}/${location}`} className="block text-sm text-gray-600 hover:text-blue-600 py-1">
                  {trade.name} à {villeData.name}
                </Link>
                <Link href={`/services/${service}`} className="block text-sm text-gray-600 hover:text-blue-600 py-1">
                  {trade.name} — tous les artisans
                </Link>
                <Link href={`/avis/${service}/${location}`} className="block text-sm text-gray-600 hover:text-blue-600 py-1">
                  Avis {tradeLower} à {villeData.name}
                </Link>
                <Link href={`/urgence/${service}/${location}`} className="block text-sm text-gray-600 hover:text-blue-600 py-1">
                  {trade.name} urgence à {villeData.name}
                </Link>
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Cette ville</h3>
              <div className="space-y-2">
                <Link href={`/villes/${location}`} className="block text-sm text-gray-600 hover:text-blue-600 py-1">
                  Artisans à {villeData.name}
                </Link>
                {otherTrades.slice(0, 5).map((slug) => {
                  const t = tradeContent[slug]
                  if (!t) return null
                  return (
                    <Link key={slug} href={`/devis/${slug}/${location}`} className="block text-sm text-gray-600 hover:text-blue-600 py-1">
                      Devis {t.name.toLowerCase()} à {villeData.name}
                    </Link>
                  )
                })}
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Informations utiles</h3>
              <div className="space-y-2">
                <Link href="/devis" className="block text-sm text-gray-600 hover:text-blue-600 py-1">Demander un devis</Link>
                <Link href="/tarifs" className="block text-sm text-gray-600 hover:text-blue-600 py-1">Guide complet des tarifs</Link>
                <Link href="/comment-ca-marche" className="block text-sm text-gray-600 hover:text-blue-600 py-1">Comment ça marche</Link>
                <Link href="/faq" className="block text-sm text-gray-600 hover:text-blue-600 py-1">FAQ</Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Editorial credibility */}
      <section className="mb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-slate-50 rounded-2xl border border-slate-200 p-6">
            <h3 className="text-sm font-semibold text-slate-700 mb-2">Transparence tarifaire</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Les prix affichés pour {villeData.name} sont des fourchettes indicatives ajustées en fonction des données régionales ({villeData.region}). Ils varient selon la complexité du chantier, les matériaux et l&apos;urgence. Seul un devis personnalisé fait foi. {SITE_NAME} est un annuaire indépendant.
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Sub-component: Local factor card
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
