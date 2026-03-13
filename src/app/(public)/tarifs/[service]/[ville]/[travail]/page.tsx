import { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowRight, Euro, ChevronDown, MapPin, ArrowLeft, Users } from 'lucide-react'
import Breadcrumb from '@/components/Breadcrumb'
import JsonLd from '@/components/JsonLd'
import { getBreadcrumbSchema, getFAQSchema, getServicePricingSchema, getSpeakableSchema } from '@/lib/seo/jsonld'
import { SITE_URL, SITE_NAME } from '@/lib/seo/config'
import { tradeContent, getTasksForService } from '@/lib/data/trade-content'
import { getVilleBySlug, getNearbyCities } from '@/lib/data/france'
import { getCommuneBySlug } from '@/lib/data/commune-data'
import LastUpdated from '@/components/seo/LastUpdated'
import CrossIntentLinks from '@/components/seo/CrossIntentLinks'
import { getServiceImage } from '@/lib/data/images'

// ---------------------------------------------------------------------------
// Static params: empty — too many combinations (46 x 10 x 300 = 138K)
// ---------------------------------------------------------------------------

export function generateStaticParams() {
  return []
}

export const dynamicParams = true
export const revalidate = 86400 // ISR 24h

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getRegionalMultiplier(region: string): number {
  const multipliers: Record<string, number> = {
    'Ile-de-France': 1.25,
    '\u00CEle-de-France': 1.25,
    "Provence-Alpes-C\u00F4te d'Azur": 1.10,
    'Auvergne-Rh\u00F4ne-Alpes': 1.10,
    'Occitanie': 1.05,
    'Nouvelle-Aquitaine': 1.00,
    'Hauts-de-France': 0.95,
    'Grand Est': 0.95,
    'Bretagne': 1.00,
    'Pays de la Loire': 1.00,
    'Normandie': 0.95,
    'Centre-Val de Loire': 0.95,
    'Bourgogne-Franche-Comt\u00E9': 0.95,
    'Corse': 1.10,
  }
  return multipliers[region] ?? 1.0
}

function formatNumber(n: number): string {
  return n.toLocaleString('fr-FR')
}

/** Extract numeric price range from a priceText like "80 a 250 EUR selon la complexite" */
function extractPriceRange(priceText: string, multiplier: number): { low: number; high: number } | null {
  const numbers = priceText.match(/\d[\d\s]*/g)
  if (!numbers || numbers.length < 1) return null
  const parsed = numbers.map((n) => parseInt(n.replace(/\s/g, ''), 10)).filter((n) => !isNaN(n))
  if (parsed.length === 0) return null
  const low = Math.round(Math.min(...parsed) * multiplier)
  const high = Math.round(Math.max(...parsed) * multiplier)
  return { low, high }
}

/** Apply multiplier to price text */
function applyMultiplier(priceText: string, multiplier: number): string {
  if (multiplier === 1) return priceText
  return priceText.replace(/(\d[\d\s]*)/g, (match) => {
    const num = parseInt(match.replace(/\s/g, ''), 10)
    if (isNaN(num)) return match
    return Math.round(num * multiplier).toLocaleString('fr-FR')
  })
}

// ---------------------------------------------------------------------------
// Metadata
// ---------------------------------------------------------------------------

export async function generateMetadata({
  params,
}: {
  params: Promise<{ service: string; ville: string; travail: string }>
}): Promise<Metadata> {
  const { service, ville: villeSlug, travail } = await params
  const trade = tradeContent[service]
  const villeData = getVilleBySlug(villeSlug)
  if (!trade || !villeData) return {}

  const tasks = getTasksForService(service)
  const currentTask = tasks.find((t) => t.slug === travail)
  if (!currentTask) return {}

  const multiplier = getRegionalMultiplier(villeData.region)
  const priceRange = extractPriceRange(currentTask.priceText, multiplier)

  const title = `Prix ${currentTask.name.toLowerCase()} \u00E0 ${villeData.name} \u2014 Tarifs 2026 | ${SITE_NAME}`
  const description = priceRange
    ? `Combien co\u00FBte ${currentTask.name.toLowerCase()} \u00E0 ${villeData.name} ? ${priceRange.low} \u00E0 ${priceRange.high} \u20AC. Comparez les tarifs et trouvez un ${trade.name.toLowerCase()} qualifi\u00E9.`
    : `Combien co\u00FBte ${currentTask.name.toLowerCase()} \u00E0 ${villeData.name} ? Comparez les tarifs et trouvez un ${trade.name.toLowerCase()} qualifi\u00E9.`
  const canonicalUrl = `${SITE_URL}/tarifs/${service}/${villeSlug}/${travail}`

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

export default async function TarifsServiceTravailVillePage({
  params,
}: {
  params: Promise<{ service: string; ville: string; travail: string }>
}) {
  const { service, ville: villeSlug, travail } = await params

  const trade = tradeContent[service]
  const villeData = getVilleBySlug(villeSlug)
  if (!trade || !villeData) notFound()

  const tasks = getTasksForService(service)
  const currentTask = tasks.find((t) => t.slug === travail)
  if (!currentTask) notFound()

  const currentTaskIndex = tasks.indexOf(currentTask)

  const commune = await getCommuneBySlug(villeSlug)

  const multiplier = getRegionalMultiplier(villeData.region)
  const priceRange = extractPriceRange(currentTask.priceText, multiplier)
  const adjustedPriceText = applyMultiplier(currentTask.priceText, multiplier)
  const tradeLower = trade.name.toLowerCase()

  // JSON-LD schemas
  const breadcrumbSchema = getBreadcrumbSchema([
    { name: 'Accueil', url: '/' },
    { name: 'Tarifs artisans', url: '/tarifs' },
    { name: `Tarifs ${tradeLower}`, url: `/tarifs/${service}` },
    { name: villeData.name, url: `/tarifs/${service}/${villeSlug}` },
    { name: currentTask.name, url: `/tarifs/${service}/${villeSlug}/${travail}` },
  ])

  // FAQ: pick 2-3 from trade FAQ + 1 custom
  const relevantFaqItems = trade.faq.slice(0, 3).map((f) => ({
    question: f.q.replace(/\?$/, '') + ` \u00E0 ${villeData.name} ?`,
    answer: f.a,
  }))
  const customFaqItem = {
    question: `Combien co\u00FBte ${currentTask.name.toLowerCase()} \u00E0 ${villeData.name} ?`,
    answer: priceRange
      ? `Le prix de ${currentTask.name.toLowerCase()} \u00E0 ${villeData.name} se situe entre ${priceRange.low} et ${priceRange.high} \u20AC. Ce tarif peut varier selon la complexit\u00E9, l'accessibilit\u00E9 et les mat\u00E9riaux utilis\u00E9s. Demandez un devis gratuit pour un prix pr\u00E9cis.`
      : `Le prix de ${currentTask.name.toLowerCase()} \u00E0 ${villeData.name} varie selon la complexit\u00E9 du chantier. Demandez un devis gratuit pour un prix pr\u00E9cis.`,
  }
  const allFaqItems = [...relevantFaqItems, customFaqItem]
  const faqSchema = getFAQSchema(allFaqItems)

  const pricingSchema = priceRange
    ? getServicePricingSchema({
        serviceName: `${currentTask.name} - ${trade.name}`,
        serviceSlug: service,
        description: `Prix ${currentTask.name.toLowerCase()} \u00E0 ${villeData.name} : ${priceRange.low}-${priceRange.high} \u20AC. Tarifs ajust\u00E9s pour la r\u00E9gion ${villeData.region}.`,
        lowPrice: priceRange.low,
        highPrice: priceRange.high,
        priceUnit: '\u20AC',
        offerCount: commune?.nb_entreprises_artisanales ?? undefined,
        location: villeData.name,
        url: `${SITE_URL}/tarifs/${service}/${villeSlug}/${travail}`,
      })
    : null

  const speakableSchema = getSpeakableSchema({
    url: `${SITE_URL}/tarifs/${service}/${villeSlug}/${travail}`,
    title: `Prix ${currentTask.name.toLowerCase()} \u00E0 ${villeData.name}`,
  })

  const relatedCities = getNearbyCities(villeSlug, 6)

  return (
    <div className="min-h-screen bg-gray-50">
      <JsonLd data={[breadcrumbSchema, faqSchema, pricingSchema, speakableSchema].filter(Boolean)} />

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
              { label: currentTask.name, href: `/tarifs/${service}/${villeSlug}` },
              { label: villeData.name },
            ]}
            className="mb-6 text-slate-400 [&_a]:text-slate-400 [&_a:hover]:text-white [&_svg]:text-slate-600"
          />
          <div className="text-center">
            <h1 className="font-heading text-4xl md:text-5xl font-extrabold mb-6 tracking-[-0.025em]">
              Prix {currentTask.name.toLowerCase()} {'\u00E0'} {villeData.name}
            </h1>
            {priceRange && (
              <p className="text-xl text-slate-400 max-w-3xl mx-auto mb-4">
                {adjustedPriceText}
              </p>
            )}
            <LastUpdated label="Tarifs v\u00E9rifi\u00E9s et mis \u00E0 jour le" className="justify-center text-slate-500 mb-4" />
            <div className="flex flex-wrap justify-center gap-3 mt-8">
              {priceRange && (
                <div className="flex items-center gap-2 bg-white/10 backdrop-blur px-4 py-2 rounded-full border border-white/10 text-sm">
                  <Euro className="w-4 h-4 text-amber-400" />
                  <span>{priceRange.low} {'\u2013'} {priceRange.high} {'\u20AC'}</span>
                </div>
              )}
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

      {/* Task price detail */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-2xl p-8 text-center mb-12">
            <h2 className="text-lg font-semibold text-gray-700 mb-2">
              {currentTask.name} {'\u00E0'} {villeData.name}
            </h2>
            {priceRange ? (
              <div className="flex items-baseline justify-center gap-2">
                <span className="text-5xl font-bold text-blue-600">
                  {priceRange.low} {'\u2014'} {priceRange.high}
                </span>
                <span className="text-gray-600 text-lg">{'\u20AC'}</span>
              </div>
            ) : (
              <div className="text-2xl font-bold text-blue-600">
                {adjustedPriceText || 'Sur devis'}
              </div>
            )}
            <p className="text-gray-500 text-sm mt-3">
              Ce tarif peut varier selon la complexit{'\u00E9'}, l{'\u2019'}accessibilit{'\u00E9'} et les mat{'\u00E9'}riaux utilis{'\u00E9'}s.
            </p>
            {multiplier !== 1.0 && (
              <p className="text-xs text-gray-400 mt-2">
                {multiplier > 1.0
                  ? `Les tarifs en ${villeData.region} sont en moyenne ${Math.round((multiplier - 1) * 100)} % sup\u00E9rieurs \u00E0 la moyenne nationale`
                  : `Les tarifs en ${villeData.region} sont en moyenne ${Math.round((1 - multiplier) * 100)} % inf\u00E9rieurs \u00E0 la moyenne nationale`}
              </p>
            )}
          </div>

          {/* Commune data if available */}
          {commune && (commune.population || commune.revenu_median) && (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
              {commune.population > 0 && (
                <div className="bg-gray-50 rounded-xl border border-gray-200 p-4 text-center">
                  <div className="text-2xl font-bold text-gray-900">{formatNumber(commune.population)}</div>
                  <div className="text-sm text-gray-500 mt-1">Habitants</div>
                </div>
              )}
              {commune.revenu_median && (
                <div className="bg-gray-50 rounded-xl border border-gray-200 p-4 text-center">
                  <div className="text-2xl font-bold text-gray-900">{formatNumber(commune.revenu_median)} {'\u20AC'}/an</div>
                  <div className="text-sm text-gray-500 mt-1">Revenu m{'\u00E9'}dian</div>
                </div>
              )}
              {commune.nb_entreprises_artisanales && (
                <div className="bg-gray-50 rounded-xl border border-gray-200 p-4 text-center">
                  <div className="text-2xl font-bold text-gray-900">{formatNumber(commune.nb_entreprises_artisanales)}</div>
                  <div className="text-sm text-gray-500 mt-1">Entreprises artisanales</div>
                </div>
              )}
            </div>
          )}

          {/* All tasks table with highlight */}
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Tous les tarifs {tradeLower} {'\u00E0'} {villeData.name}
          </h2>
          <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-sm mb-4">
            <table className="w-full text-left">
              <caption className="px-5 py-3 text-left text-base font-semibold text-gray-900 bg-white border-b border-gray-100">
                Tarifs {tradeLower} {villeData.name} {'\u2014'} 2026
                {trade.priceRange.unit && (
                  <span className="ml-2 text-sm font-normal text-gray-500">
                    ({trade.priceRange.unit})
                  </span>
                )}
              </caption>
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th scope="col" className="px-5 py-3.5 text-sm font-semibold text-gray-700">
                    Prestation
                  </th>
                  <th scope="col" className="px-5 py-3.5 text-sm font-semibold text-gray-700 text-right">
                    Prix indicatif
                  </th>
                </tr>
              </thead>
              <tbody>
                {trade.commonTasks.map((task, i) => {
                  const colonIndex = task.indexOf(':')
                  const name = colonIndex === -1 ? task.trim() : task.slice(0, colonIndex).trim()
                  let priceStr = colonIndex === -1 ? 'Sur devis' : task.slice(colonIndex + 1).trim()
                  if (multiplier !== 1) {
                    priceStr = priceStr.replace(/(\d[\d\s]*)/g, (match) => {
                      const num = parseInt(match.replace(/\s/g, ''), 10)
                      if (isNaN(num)) return match
                      return Math.round(num * multiplier).toLocaleString('fr-FR')
                    })
                  }
                  const isHighlighted = i === currentTaskIndex
                  return (
                    <tr
                      key={i}
                      className={
                        isHighlighted
                          ? 'bg-blue-50 border-l-4 border-l-blue-500 font-semibold'
                          : `hover:bg-blue-50/60 transition-colors ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`
                      }
                    >
                      <td className={`px-5 py-4 text-sm border-t border-gray-100 ${isHighlighted ? 'text-blue-900' : 'text-gray-800'}`}>
                        {isHighlighted ? (
                          <span>{name}</span>
                        ) : (
                          <Link
                            href={`/tarifs/${service}/${tasks[i].slug}/${villeSlug}`}
                            className="hover:text-blue-600 transition-colors"
                          >
                            {name}
                          </Link>
                        )}
                      </td>
                      <td className={`px-5 py-4 text-sm font-medium border-t border-gray-100 text-right whitespace-nowrap ${isHighlighted ? 'text-blue-900' : 'text-gray-900'}`}>
                        {priceStr || 'Sur devis'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
              <tfoot>
                <tr className="bg-gray-50/80 border-t border-gray-200">
                  <td colSpan={2} className="px-5 py-3 text-xs text-gray-500 italic">
                    Prix indicatifs, peuvent varier selon la complexit{'\u00E9'} des travaux, la r{'\u00E9'}gion et le professionnel.
                    {multiplier !== 1 && (
                      <span className="ml-1">
                        Tarifs ajust{'\u00E9'}s pour {villeData.name} ({multiplier > 1 ? '+' : ''}{Math.round((multiplier - 1) * 100)}{'\u00A0'}% vs moyenne nationale).
                      </span>
                    )}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">
            Questions fr{'\u00E9'}quentes {'\u2014'} {currentTask.name} {'\u00E0'} {villeData.name}
          </h2>
          <div className="space-y-4">
            {allFaqItems.map((item, i) => (
              <details key={i} className="bg-white rounded-xl border border-gray-200 group">
                <summary className="flex items-center justify-between p-6 cursor-pointer list-none">
                  <h3 className="text-base font-semibold text-gray-900 pr-4">{item.question}</h3>
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
          <h2 className="text-3xl font-bold text-white mb-4">
            Trouver un {tradeLower} {'\u00E0'} {villeData.name}
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Comparez les profils et obtenez un devis gratuit pour {currentTask.name.toLowerCase()} {'\u00E0'} {villeData.name}.
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

      {/* Same task in nearby cities */}
      {relatedCities.length > 0 && (
        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Prix {currentTask.name.toLowerCase()} dans d&apos;autres villes
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 max-w-3xl">
              {relatedCities.map((v) => {
                const m = getRegionalMultiplier(v.region)
                const range = extractPriceRange(currentTask.priceText, m)
                return (
                  <Link
                    key={v.slug}
                    href={`/tarifs/${service}/${v.slug}/${travail}`}
                    className="bg-gray-50 hover:bg-blue-50 border border-gray-200 hover:border-blue-300 rounded-xl p-4 transition-all group text-center"
                  >
                    <div className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors text-sm">
                      {currentTask.name} {'\u00E0'} {v.name}
                    </div>
                    {range && (
                      <div className="text-xs text-gray-500 mt-1">
                        {range.low} {'\u2013'} {range.high} {'\u20AC'}
                      </div>
                    )}
                  </Link>
                )
              })}
            </div>
          </div>
        </section>
      )}

      {/* Back link */}
      <section className="py-8 bg-gray-50 border-t">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link
            href={`/tarifs/${service}/${villeSlug}`}
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Tous les tarifs {tradeLower} {'\u00E0'} {villeData.name}
          </Link>
        </div>
      </section>

      {/* Cross-intent navigation */}
      <CrossIntentLinks
        service={service}
        serviceName={trade.name}
        ville={villeSlug}
        villeName={villeData.name}
        currentIntent="tarifs"
      />

      {/* Methodology */}
      <section className="mb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-slate-50 rounded-2xl border border-slate-200 p-6">
            <h3 className="text-sm font-semibold text-slate-700 mb-2">M{'\u00E9'}thodologie tarifaire</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Les prix affich{'\u00E9'}s pour {currentTask.name.toLowerCase()} {'\u00E0'} {villeData.name} sont des fourchettes indicatives ajust{'\u00E9'}es en fonction des donn{'\u00E9'}es r{'\u00E9'}gionales ({villeData.region}). Ils varient selon la complexit{'\u00E9'} du chantier, les mat{'\u00E9'}riaux et l&apos;urgence. Seul un devis personnalis{'\u00E9'} fait foi. {SITE_NAME} est un annuaire ind{'\u00E9'}pendant.
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
