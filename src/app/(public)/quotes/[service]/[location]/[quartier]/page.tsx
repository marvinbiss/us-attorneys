import { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowRight, CheckCircle, Euro, ChevronDown, MapPin } from 'lucide-react'
import Breadcrumb from '@/components/Breadcrumb'
import JsonLd from '@/components/JsonLd'
import { getBreadcrumbSchema, getFAQSchema } from '@/lib/seo/jsonld'
import { SITE_URL, SITE_NAME } from '@/lib/seo/config'
import { hashCode, getRegionalMultiplier, generateQuartierContent } from '@/lib/seo/location-content'
import { tradeContent, getTradesSlugs } from '@/lib/data/trade-content'
import { cities, getNeighborhoodBySlug, getNeighborhoodsByCity, getNearbyCities, getStateByCode } from '@/lib/data/usa'
import { getServiceImage } from '@/lib/data/images'
import { relatedServices } from '@/lib/constants/navigation'
import DevisForm from '@/components/DevisForm'
import dynamic from 'next/dynamic'

const EstimationWidget = dynamic(
  () => import('@/components/estimation/EstimationWidget'),
  { ssr: false }
)

// ---------------------------------------------------------------------------
// Static params: top 3 services x top 10 cities x their quartiers
// ---------------------------------------------------------------------------

const tradeSlugs = getTradesSlugs()

export function generateStaticParams() {
  const topServices = tradeSlugs.slice(0, 10)
  const topCities = cities.slice(0, 30)
  return topServices.flatMap((s) =>
    topCities.flatMap((v) =>
      getNeighborhoodsByCity(v.slug).map((q) => ({
        service: s,
        location: v.slug,
        quartier: q.slug,
      }))
    )
  )
}

export const dynamicParams = true
export const revalidate = 86400

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
  params: Promise<{ service: string; location: string; quartier: string }>
}): Promise<Metadata> {
  const { service, location, quartier } = await params
  const trade = tradeContent[service]
  const quartierData = getNeighborhoodBySlug(location, quartier)
  if (!trade || !quartierData) return {}

  const { city: ville, neighborhoodName: quartierName } = quartierData
  const tradeLower = trade.name.toLowerCase()
  const villeRegion = getStateByCode(ville.stateCode)?.region ?? ''
  const multiplier = getRegionalMultiplier(villeRegion)
  const minPrice = Math.round(trade.priceRange.min * multiplier)
  const maxPrice = Math.round(trade.priceRange.max * multiplier)
  const unit = trade.priceRange.unit

  const titleHash = Math.abs(hashCode(`devis-q-title-${service}-${location}-${quartier}`))
  const titleTemplates = [
    `Devis ${tradeLower} ${quartierName} ${ville.name}`,
    `Devis ${tradeLower} ${quartierName} gratuit`,
    `Devis gratuit ${tradeLower} ${quartierName}`,
    `Devis ${tradeLower} ${quartierName} 2026`,
    `${quartierName} : devis ${tradeLower} gratuit`,
  ]
  const title = truncateTitle(titleTemplates[titleHash % titleTemplates.length])

  const description = `Devis ${tradeLower} à ${quartierName}, ${ville.name} : ${minPrice}–${maxPrice} ${unit}. Comparez jusqu’à 3 artisans. Gratuit, sans engagement.`

  const serviceImage = getServiceImage(service)
  const canonicalUrl = `${SITE_URL}/quotes/${service}/${location}/${quartier}`

  return {
    title,
    description,
    alternates: { canonical: canonicalUrl },
    openGraph: {
      locale: 'fr_FR',
      title,
      description,
      url: canonicalUrl,
      type: 'website',
      images: [{ url: serviceImage.src, width: 800, height: 600, alt: `Devis ${trade.name} à ${quartierName}, ${ville.name}` }],
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

export default async function DevisQuartierPage({
  params,
}: {
  params: Promise<{ service: string; location: string; quartier: string }>
}) {
  const { service, location, quartier } = await params

  const trade = tradeContent[service]
  const quartierData = getNeighborhoodBySlug(location, quartier)
  if (!trade || !quartierData) notFound()

  const { city: ville, neighborhoodName: quartierName } = quartierData
  const villeRegion = getStateByCode(ville.stateCode)?.region ?? ''
  const quartierContent = generateQuartierContent(ville as never, quartierName, service)
  const multiplier = getRegionalMultiplier(villeRegion)
  const minPrice = Math.round(trade.priceRange.min * multiplier)
  const maxPrice = Math.round(trade.priceRange.max * multiplier)
  const tradeLower = trade.name.toLowerCase()
  const unit = trade.priceRange.unit
  const { profile } = quartierContent

  // --- Tips (3 hash-selected) ---
  const tipHash = hashCode(`tips-dq-${service}-${location}-${quartier}`)
  const selectedTips = Array.from({ length: Math.min(3, trade.tips.length) }, (_, i) =>
    trade.tips[(tipHash + i) % trade.tips.length]
  )

  // --- FAQ: 2 trade + 3 quartier ---
  const combinedFaq: { question: string; answer: string }[] = []
  if (trade.faq.length > 0) {
    const tradeFaqHash = Math.abs(hashCode(`trade-faq-dq-${service}-${location}-${quartier}`))
    const idx1 = tradeFaqHash % trade.faq.length
    const idx2 = (tradeFaqHash + 3) % trade.faq.length
    combinedFaq.push({ question: trade.faq[idx1].q, answer: trade.faq[idx1].a })
    if (idx2 !== idx1) combinedFaq.push({ question: trade.faq[idx2].q, answer: trade.faq[idx2].a })
  }
  combinedFaq.push(...quartierContent.faqItems.slice(0, 3))

  // --- JSON-LD schemas ---
  const breadcrumbSchema = getBreadcrumbSchema([
    { name: 'Accueil', url: '/' },
    { name: 'Devis', url: '/quotes' },
    { name: `Devis ${tradeLower}`, url: `/quotes/${service}` },
    { name: ville.name, url: `/quotes/${service}/${location}` },
    { name: quartierName, url: `/quotes/${service}/${location}/${quartier}` },
  ])

  const faqSchema = combinedFaq.length > 0 ? getFAQSchema(combinedFaq) : null

  const serviceSchema = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: `Devis ${trade.name} à ${quartierName}, ${ville.name}`,
    description: `Demandez un devis gratuit pour ${tradeLower} à ${quartierName}, ${ville.name}. Prix : ${minPrice}–${maxPrice} ${unit}.`,
    provider: { '@type': 'Organization', name: SITE_NAME, url: SITE_URL },
    areaServed: {
      '@type': 'Place',
      name: `${quartierName}, ${ville.name}`,
      containedInPlace: {
        '@type': 'City',
        name: ville.name,
        containedInPlace: {
          '@type': 'AdministrativeArea',
          name: villeRegion,
        },
      },
    },
    offers: {
      '@type': 'AggregateOffer',
      priceCurrency: 'EUR',
      lowPrice: minPrice,
      highPrice: maxPrice,
    },
  }

  const jsonLdData: Record<string, unknown>[] = [
    breadcrumbSchema,
    ...(faqSchema ? [faqSchema] : []),
    serviceSchema,
  ]

  // --- Cross-links ---
  const otherQuartiers = getNeighborhoodsByCity(location).filter((q) => q.slug !== quartier).slice(0, 10)
  const relatedSlugs = relatedServices[service] || []
  const otherServices = relatedSlugs.length > 0
    ? relatedSlugs.slice(0, 6).filter((s) => tradeContent[s])
    : tradeSlugs.filter((s) => s !== service).slice(0, 6)
  const nearbyCities = getNearbyCities(location, 6)

  return (
    <div className="min-h-screen bg-gray-50">
      <JsonLd data={jsonLdData} />

      {/* ─── 1. HERO ──────────────────────────────────────────── */}
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
              { label: 'Devis', href: '/quotes' },
              { label: `Devis ${tradeLower}`, href: `/quotes/${service}` },
              { label: ville.name, href: `/quotes/${service}/${location}` },
              { label: quartierName },
            ]}
            className="mb-6 text-slate-400 [&_a]:text-slate-400 [&_a:hover]:text-white [&_svg]:text-slate-600"
          />
          <div className="text-center">
            <h1 className="font-heading text-4xl md:text-5xl font-extrabold mb-6 tracking-[-0.025em]">
              {(() => {
                const h1Hash = Math.abs(hashCode(`devis-q-h1-${service}-${location}-${quartier}`))
                const h1Templates = [
                  `Devis ${tradeLower} à ${quartierName}, ${ville.name}`,
                  `Obtenez un devis ${tradeLower} gratuit — ${quartierName}`,
                  `${trade.name} à ${quartierName} : devis gratuit en 24h`,
                  `Devis ${tradeLower} : artisans à ${quartierName}, ${ville.name}`,
                  `${quartierName}, ${ville.name} : devis ${tradeLower} détaillé`,
                ]
                return h1Templates[h1Hash % h1Templates.length]
              })()}
            </h1>
            <p className="text-xl text-slate-400 max-w-3xl mx-auto mb-4">
              Comparez jusqu&apos;à 3 devis de {tradeLower}s à {quartierName} ({ville.stateName}).
            </p>
            <div className="flex flex-wrap justify-center gap-3 mt-8">
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur px-4 py-2 rounded-full border border-white/10 text-sm">
                <Euro className="w-4 h-4 text-amber-400" />
                <span>{minPrice} – {maxPrice} {unit}</span>
              </div>
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur px-4 py-2 rounded-full border border-white/10 text-sm">
                <MapPin className="w-4 h-4 text-amber-400" />
                <span>{quartierName}, {ville.stateCode}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 2. DEVIS FORM ────────────────────────────────────── */}
      <section id="formulaire" className="relative -mt-16 z-10 px-4 pb-20">
        <DevisForm
          prefilledService={service}
          prefilledCity={ville.name}
          prefilledCityPostal={ville.zipCode}
        />
      </section>

      {/* ─── 3. QUARTIER CONTEXT ──────────────────────────────── */}
      <section className="py-12 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="prose prose-gray max-w-none">
            <h2 className="border-l-4 border-amber-500 pl-4 !mt-0">
              Devis {trade.name} dans le quartier {quartierName} à {ville.name}
            </h2>
            <p>{quartierContent.intro}</p>
            <h3>Contexte du bâti à {quartierName}</h3>
            <p>{quartierContent.batimentContext}</p>
          </div>
          {/* 4-column stat cards */}
          <div className="not-prose grid grid-cols-2 sm:grid-cols-4 gap-3 my-6">
            <StatCard label="Type de bâti" value={profile.eraLabel} color="amber" />
            <StatCard label="Densité urbaine" value={profile.densityLabel} color="blue" />
            <StatCard label="Département" value={`${ville.stateCode} — ${ville.stateName}`} color="slate" />
            <StatCard label="Région" value={villeRegion} color="emerald" />
          </div>
        </div>
      </section>

      {/* ─── 4. TRADE PRICING ─────────────────────────────────── */}
      <section className="py-12 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-2xl p-8 text-center mb-12">
            <h2 className="text-lg font-semibold text-gray-700 mb-2">
              Tarif indicatif à {quartierName}, {ville.name}
            </h2>
            <div className="flex items-baseline justify-center gap-2">
              <span className="text-5xl font-bold text-blue-600">
                {minPrice} — {maxPrice}
              </span>
              <span className="text-gray-600 text-lg">{unit}</span>
            </div>
            <p className="text-gray-500 text-sm mt-3">
              Prix moyen constaté à {quartierName}, main-d&apos;œuvre incluse
            </p>
            {multiplier !== 1.0 && (
              <p className="text-xs text-gray-400 mt-2">
                {multiplier > 1.0
                  ? `Les tarifs en ${villeRegion} sont en moyenne ${Math.round((multiplier - 1) * 100)} % supérieurs à la moyenne nationale`
                  : `Les tarifs en ${villeRegion} sont en moyenne ${Math.round((1 - multiplier) * 100)} % inférieurs à la moyenne nationale`}
              </p>
            )}
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Prestations courantes à {quartierName}
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {trade.commonTasks.slice(0, 6).map((task, i) => {
              const [label, price] = task.split(' : ')
              const adjustedPrice =
                price && multiplier !== 1.0
                  ? price.replace(/\d[\d\s]*/g, (m) => {
                      const n = parseInt(m.replace(/\s/g, ''), 10)
                      return isNaN(n) ? m : String(Math.round(n * multiplier))
                    })
                  : price
              return (
                <div
                  key={i}
                  className="flex items-start justify-between gap-3 p-4 bg-white rounded-xl text-sm border border-gray-200 hover:bg-blue-50 hover:border-blue-200 transition-colors"
                >
                  <span className="text-gray-700">{label}</span>
                  {adjustedPrice && (
                    <span className="font-semibold text-amber-700 whitespace-nowrap">{adjustedPrice}</span>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ─── 5. TIPS ──────────────────────────────────────────── */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            Conseils pour choisir un {tradeLower} à {quartierName}
          </h2>
          <div className="space-y-4">
            {selectedTips.map((tip, i) => (
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

      {/* ─── 6. FAQ ───────────────────────────────────────────── */}
      {combinedFaq.length > 0 && (
        <section className="py-16 bg-gray-50">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">
              Questions fréquentes — Devis {trade.name} à {quartierName}, {ville.name}
            </h2>
            <div className="space-y-4">
              {combinedFaq.map((item, i) => (
                <details key={i} className="bg-white rounded-xl border border-gray-200 group">
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
      )}

      {/* ─── 7. CTA ───────────────────────────────────────────── */}
      <section className="py-20 bg-blue-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Prêt à lancer votre projet à {quartierName} ?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Comparez les profils et obtenez un devis gratuit auprès de professionnels référencés à {quartierName}.
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
              href={`/practice-areas/${service}/${location}/${quartier}`}
              className="inline-flex items-center gap-2 bg-blue-500 text-white px-8 py-4 rounded-xl font-semibold hover:bg-blue-400 transition-colors text-lg border border-blue-400"
            >
              Voir les {tradeLower}s à {quartierName}
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* ─── 8. CROSS-LINKS ───────────────────────────────────── */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          {/* Other quartiers */}
          {otherQuartiers.length > 0 && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Devis {tradeLower} dans d&apos;autres quartiers de {ville.name}
              </h2>
              <div className="flex flex-wrap gap-2">
                {otherQuartiers.map((q) => (
                  <Link
                    key={q.slug}
                    href={`/quotes/${service}/${location}/${q.slug}`}
                    className="text-sm bg-gray-50 text-blue-700 px-3 py-1.5 rounded-full border border-blue-100 hover:bg-blue-50 transition-colors"
                  >
                    {q.name}
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Other services */}
          {otherServices.length > 0 && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Autres devis artisans à {quartierName}
              </h2>
              <div className="flex flex-wrap gap-2">
                {otherServices.map((slug) => {
                  const t = tradeContent[slug]
                  if (!t) return null
                  return (
                    <Link
                      key={slug}
                      href={`/quotes/${slug}/${location}/${quartier}`}
                      className="text-sm bg-gray-50 text-gray-700 px-3 py-1.5 rounded-full border border-gray-200 hover:bg-gray-100 transition-colors"
                    >
                      Devis {t.name.toLowerCase()}
                    </Link>
                  )
                })}
              </div>
            </div>
          )}

          {/* Nearby cities */}
          {nearbyCities.length > 0 && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Devis {tradeLower} dans les villes proches
              </h2>
              <div className="flex flex-wrap gap-2">
                {nearbyCities.map((c) => (
                  <Link
                    key={c.slug}
                    href={`/quotes/${service}/${c.slug}`}
                    className="text-sm bg-gray-50 text-gray-700 px-3 py-1.5 rounded-full border border-gray-200 hover:bg-gray-100 transition-colors"
                  >
                    {c.name}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ─── 9. VOIR AUSSI ────────────────────────────────────── */}
      <section className="py-12 bg-gray-50 border-t">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Voir aussi</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Ce service</h3>
              <div className="space-y-2">
                <Link href={`/quotes/${service}`} className="block text-sm text-gray-600 hover:text-blue-600 py-1">
                  Devis {tradeLower} en France
                </Link>
                <Link href={`/tarifs/${service}/${location}`} className="block text-sm text-gray-600 hover:text-blue-600 py-1">
                  Tarifs {tradeLower} à {ville.name}
                </Link>
                <Link href={`/practice-areas/${service}/${location}/${quartier}`} className="block text-sm text-gray-600 hover:text-blue-600 py-1">
                  {trade.name} à {quartierName}
                </Link>
                <Link href={`/practice-areas/${service}`} className="block text-sm text-gray-600 hover:text-blue-600 py-1">
                  {trade.name} — tous les artisans
                </Link>
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Cette ville</h3>
              <div className="space-y-2">
                <Link href={`/cities/${location}`} className="block text-sm text-gray-600 hover:text-blue-600 py-1">
                  Artisans à {ville.name}
                </Link>
                {otherServices.slice(0, 3).map((slug) => {
                  const t = tradeContent[slug]
                  if (!t) return null
                  return (
                    <Link key={slug} href={`/quotes/${slug}/${location}`} className="block text-sm text-gray-600 hover:text-blue-600 py-1">
                      Devis {t.name.toLowerCase()} à {ville.name}
                    </Link>
                  )
                })}
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Informations utiles</h3>
              <div className="space-y-2">
                <Link href="/quotes" className="block text-sm text-gray-600 hover:text-blue-600 py-1">Demander un devis</Link>
                <Link href="/tarifs" className="block text-sm text-gray-600 hover:text-blue-600 py-1">Guide complet des tarifs</Link>
                <Link href="/comment-ca-marche" className="block text-sm text-gray-600 hover:text-blue-600 py-1">Comment ça marche</Link>
                <Link href="/faq" className="block text-sm text-gray-600 hover:text-blue-600 py-1">FAQ</Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 10. EDITORIAL CREDIBILITY ────────────────────────── */}
      <section className="mb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-slate-50 rounded-2xl border border-slate-200 p-6">
            <h3 className="text-sm font-semibold text-slate-700 mb-2">Transparence tarifaire</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Les prix affichés pour {quartierName} à {ville.name} sont des fourchettes indicatives ajustées en fonction des données régionales ({villeRegion}). Ils varient selon la complexité du chantier, les matériaux et l&apos;urgence. Seul un devis personnalisé fait foi. {SITE_NAME} est un annuaire indépendant.
            </p>
          </div>
        </div>
      </section>

      <EstimationWidget context={{
        metier: trade.name,
        metierSlug: service,
        ville: ville.name,
        departement: ville.stateCode,
        pageUrl: `/quotes/${service}/${location}/${quartier}`,
      }} />
    </div>
  )
}

// ---------------------------------------------------------------------------
// Sub-component: Stat card
// ---------------------------------------------------------------------------

const STAT_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  amber: { bg: 'bg-amber-50', border: 'border-amber-100', text: 'text-amber-700' },
  blue: { bg: 'bg-blue-50', border: 'border-blue-100', text: 'text-blue-700' },
  slate: { bg: 'bg-slate-50', border: 'border-slate-100', text: 'text-slate-700' },
  emerald: { bg: 'bg-emerald-50', border: 'border-emerald-100', text: 'text-emerald-700' },
}

function StatCard({
  label,
  value,
  color,
}: {
  label: string
  value: string
  color: string
}) {
  const c = STAT_COLORS[color] ?? STAT_COLORS.slate
  return (
    <div className={`text-center p-3 ${c.bg} rounded-xl border ${c.border}`}>
      <div className={`text-sm font-bold ${c.text}`}>{value}</div>
      <div className="text-xs text-gray-500 mt-1">{label}</div>
    </div>
  )
}
