import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { AlertTriangle, ArrowRight, Shield, Clock, Euro, MapPin, ChevronDown, Lightbulb, ListChecks, Eye, Users, Thermometer, Building2 } from 'lucide-react'
import Breadcrumb from '@/components/Breadcrumb'
import JsonLd from '@/components/JsonLd'
import { getBreadcrumbSchema, getFAQSchema } from '@/lib/seo/jsonld'
import { SITE_URL, SITE_NAME } from '@/lib/seo/config'
import { getProblemBySlug, getProblemSlugs, getProblemsByService } from '@/lib/data/problems'
import { tradeContent } from '@/lib/data/trade-content'
import { villes, getVilleBySlug, getNearbyCities } from '@/lib/data/france'
import { hashCode, getRegionalMultiplier } from '@/lib/seo/location-content'
import { getCommuneBySlug, formatNumber } from '@/lib/data/commune-data'

// ---------------------------------------------------------------------------
// Static params: top 10 problems x top 30 cities = 300 pre-rendered pages
// ---------------------------------------------------------------------------

function parsePopulation(pop: string): number {
  return parseInt(pop.replace(/\s/g, ''), 10) || 0
}

const top10Cities = [...villes]
  .sort((a, b) => parsePopulation(b.population) - parsePopulation(a.population))
  .slice(0, 10)

export function generateStaticParams() {
  const top10Problems = getProblemSlugs().slice(0, 10)
  return top10Problems.flatMap((p) =>
    top10Cities.map((v) => ({ probleme: p, ville: v.slug }))
  )
}

export const dynamicParams = true
export const revalidate = 86400

// ---------------------------------------------------------------------------
// Urgency config
// ---------------------------------------------------------------------------

const urgencyGradients = {
  haute: 'from-red-600 to-red-800',
  moyenne: 'from-amber-600 to-amber-800',
  basse: 'from-green-600 to-green-800',
}

const urgencyLabels = {
  haute: 'Urgence haute',
  moyenne: 'Urgence moyenne',
  basse: 'Non urgent',
}

const urgencyDotColors = {
  haute: 'bg-red-400',
  moyenne: 'bg-amber-400',
  basse: 'bg-green-400',
}

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

function truncateTitle(title: string, maxLen = 42): string {
  if (title.length <= maxLen) return title
  return title.slice(0, maxLen - 1).replace(/\s+\S*$/, '') + '…'
}

// ---------------------------------------------------------------------------
// Metadata
// ---------------------------------------------------------------------------

export async function generateMetadata({
  params,
}: {
  params: Promise<{ probleme: string; ville: string }>
}): Promise<Metadata> {
  const { probleme, ville } = await params
  const problem = getProblemBySlug(probleme)
  const villeData = getVilleBySlug(ville)
  if (!problem || !villeData) return {}

  const titleHash = Math.abs(hashCode(`probleme-ville-title-${probleme}-${ville}`))
  const titleTemplates = [
    `${problem.name} à ${villeData.name} — Solutions`,
    `${problem.name} ${villeData.name} : diagnostic et coûts`,
    `Résoudre ${problem.name.toLowerCase()} à ${villeData.name}`,
    `${problem.name} à ${villeData.name} — Artisans`,
  ]
  const title = truncateTitle(titleTemplates[titleHash % titleTemplates.length])

  const multiplier = getRegionalMultiplier(villeData.region)
  const minPrice = Math.round(problem.estimatedCost.min * multiplier)
  const maxPrice = Math.round(problem.estimatedCost.max * multiplier)

  const description = `${problem.name} à ${villeData.name} : coût ${minPrice} à ${maxPrice} \u20ac. Diagnostic, conseils d'urgence et artisans référencés. ${problem.averageResponseTime}.`

  // noindex when no real providers exist for this city
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
    alternates: { canonical: `${SITE_URL}/problemes/${probleme}/${ville}` },
    ...(providerCount === 0 ? { robots: { index: false, follow: true } } : {}),
    openGraph: {
      locale: 'fr_FR',
      title,
      description,
      url: `${SITE_URL}/problemes/${probleme}/${ville}`,
      type: 'website',
      images: [{ url: `${SITE_URL}/opengraph-image`, width: 1200, height: 630, alt: `${problem.name} à ${villeData.name}` }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [`${SITE_URL}/opengraph-image`],
    },
  }
}

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------

export default async function ProblemeVillePage({
  params,
}: {
  params: Promise<{ probleme: string; ville: string }>
}) {
  const { probleme, ville } = await params

  const problem = getProblemBySlug(probleme)
  const villeData = getVilleBySlug(ville)
  if (!problem || !villeData) notFound()

  const trade = tradeContent[problem.primaryService]
  const tradeName = trade?.name ?? problem.primaryService
  const gradient = urgencyGradients[problem.urgencyLevel]

  const commune = await getCommuneBySlug(ville)
  const multiplier = getRegionalMultiplier(villeData.region)
  const minPrice = Math.round(problem.estimatedCost.min * multiplier)
  const maxPrice = Math.round(problem.estimatedCost.max * multiplier)

  // H1 variation
  const h1Hash = Math.abs(hashCode(`probleme-ville-h1-${probleme}-${ville}`))
  const h1Templates = [
    `${problem.name} à ${villeData.name}`,
    `${problem.name} à ${villeData.name} — Que faire ?`,
    `Résoudre un problème de ${problem.name.toLowerCase()} à ${villeData.name}`,
    `${problem.name} : artisans à ${villeData.name}`,
  ]
  const h1 = h1Templates[h1Hash % h1Templates.length]

  // Related data
  const nearbyCities = getNearbyCities(ville, 6)
  const relatedProblems = getProblemsByService(problem.primaryService)
    .filter((p) => p.slug !== problem.slug)
    .slice(0, 4)

  // FAQ: 3 problem-specific + 2 from trade
  const localFaq = problem.faq.slice(0, 3).map((f) => ({
    question: f.q.replace(/\?$/, '') + ` à ${villeData.name} ?`,
    answer: f.a,
  }))
  const tradeFaq = trade
    ? trade.faq.slice(0, 2).map((f) => ({
        question: f.q.replace(/\?$/, '') + ` à ${villeData.name} ?`,
        answer: f.a,
      }))
    : []
  const allFaq = [...localFaq, ...tradeFaq]

  // Schemas
  const breadcrumbSchema = getBreadcrumbSchema([
    { name: 'Accueil', url: '/' },
    { name: 'Problèmes', url: '/problemes' },
    { name: problem.name, url: `/problemes/${probleme}` },
    { name: villeData.name, url: `/problemes/${probleme}/${ville}` },
  ])

  const faqSchema = getFAQSchema(allFaq)

  const serviceSchema = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: `${problem.name} à ${villeData.name}`,
    description: `Diagnostic et résolution de ${problem.name.toLowerCase()} à ${villeData.name} (${villeData.departement}). Coût : ${minPrice} à ${maxPrice} \u20ac.`,
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
    },
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <JsonLd data={[breadcrumbSchema, faqSchema, serviceSchema]} />

      {/* Breadcrumb */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <Breadcrumb items={[
            { label: 'Problèmes', href: '/problemes' },
            { label: problem.name, href: `/problemes/${probleme}` },
            { label: villeData.name },
          ]} />
        </div>
      </div>

      {/* Hero */}
      <section className={`relative bg-gradient-to-br ${gradient} text-white py-16 md:py-20 overflow-hidden`}>
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-white rounded-full blur-[150px] animate-pulse" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 mb-6">
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/20 backdrop-blur-sm border border-white/20 text-sm font-semibold">
              <span className={`w-2.5 h-2.5 rounded-full ${urgencyDotColors[problem.urgencyLevel]} animate-pulse`} />
              {urgencyLabels[problem.urgencyLevel]}
            </span>
          </div>
          <h1 className="font-heading text-4xl md:text-5xl font-bold mb-6 leading-tight">
            {h1}
          </h1>
          <p className="text-xl opacity-90 max-w-2xl mb-8">
            {problem.description}
          </p>
          <div className="flex flex-wrap gap-3 mb-8">
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 border border-white/10">
              <Euro className="w-4 h-4" />
              <span className="text-sm">{minPrice} – {maxPrice} \u20ac</span>
            </div>
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 border border-white/10">
              <MapPin className="w-4 h-4" />
              <span className="text-sm">{villeData.name} ({villeData.departementCode})</span>
            </div>
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 border border-white/10">
              <Clock className="w-4 h-4" />
              <span className="text-sm">{problem.averageResponseTime}</span>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-4">
            <Link
              href={`/devis/${problem.primaryService}/${ville}`}
              className="inline-flex items-center justify-center gap-3 bg-white text-gray-900 px-8 py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all"
            >
              Devis gratuit à {villeData.name}
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href={`/urgence/${problem.primaryService}/${ville}`}
              className="inline-flex items-center justify-center gap-3 bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all"
            >
              {tradeName} urgence à {villeData.name}
            </Link>
          </div>
        </div>
      </section>

      {/* Symptoms localized */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-amber-50 text-amber-600 rounded-full text-sm font-medium mb-4">
              <Eye className="w-4 h-4" />
              Symptômes
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-3">
              Comment reconnaître ce problème ?
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              \u00c0 {villeData.name}, voici les signes qui indiquent un problème de {problem.name.toLowerCase()}.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-5xl mx-auto">
            {problem.symptoms.map((symptom, i) => (
              <div
                key={i}
                className="flex items-start gap-3 bg-gray-50 rounded-xl border border-gray-200 p-5"
              >
                <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                <span className="text-gray-700 text-sm">{symptom}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Immediate actions */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-red-50 text-red-600 rounded-full text-sm font-medium mb-4">
              <ListChecks className="w-4 h-4" />
              Actions immédiates
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-3">
              Que faire en urgence ?
            </h2>
          </div>
          <div className="space-y-4">
            {problem.immediateActions.map((action, i) => (
              <div key={i} className="flex items-start gap-4 bg-white rounded-xl border border-gray-200 p-5">
                <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <span className="text-red-600 font-bold">{i + 1}</span>
                </div>
                <p className="text-gray-700 leading-relaxed">{action}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Local pricing */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-6 text-center">
            Coût à {villeData.name}
          </h2>
          <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-2xl p-8 text-center mb-8">
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Fourchette de prix à {villeData.name}</h3>
            <div className="flex items-baseline justify-center gap-2">
              <span className="text-5xl font-bold text-blue-600">
                {minPrice} — {maxPrice}
              </span>
              <span className="text-gray-600 text-lg">\u20ac</span>
            </div>
            <p className="text-gray-500 text-sm mt-3">
              Prix indicatif pour {problem.name.toLowerCase()} à {villeData.name} et ses alentours
            </p>
            {multiplier !== 1.0 && (
              <p className="text-xs text-gray-400 mt-2">
                {multiplier > 1.0
                  ? `Les tarifs en ${villeData.region} sont en moyenne ${Math.round((multiplier - 1) * 100)} % supérieurs à la moyenne nationale`
                  : `Les tarifs en ${villeData.region} sont en moyenne ${Math.round((1 - multiplier) * 100)} % inférieurs à la moyenne nationale`}
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Local context — 4 stat cards */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2 text-center">
            Contexte local — {villeData.name}
          </h2>
          <p className="text-gray-500 text-sm text-center mb-8">
            Données locales qui influencent le coût et la disponibilité des artisans.
          </p>
          <div className="grid sm:grid-cols-2 gap-6">
            <LocalFactorCard
              icon={<Users className="w-5 h-5 text-blue-600" />}
              title="Artisans locaux"
              value={commune?.nb_entreprises_artisanales ? `${formatNumber(commune.nb_entreprises_artisanales)} entreprises` : null}
              description={
                commune?.nb_entreprises_artisanales
                  ? `${villeData.name} compte ${formatNumber(commune.nb_entreprises_artisanales)} entreprises artisanales, ce qui garantit un bon choix de professionnels pour intervenir rapidement.`
                  : `La disponibilité des artisans à ${villeData.name} dépend du nombre de professionnels installés localement.`
              }
            />
            <LocalFactorCard
              icon={<Thermometer className="w-5 h-5 text-green-600" />}
              title="Zone climatique"
              value={getClimatLabel(commune?.climat_zone ?? null)}
              description={
                problem.seasonality
                  ? `Ce problème est plus fréquent en ${problem.seasonality}. Le climat à ${villeData.name} influence la fréquence de ce type d'intervention.`
                  : `Le climat local à ${villeData.name} peut influencer la fréquence et l'urgence de ce type de problème.`
              }
            />
            <LocalFactorCard
              icon={<Building2 className="w-5 h-5 text-purple-600" />}
              title="Type de logement"
              value={commune?.part_maisons_pct ? `${commune.part_maisons_pct} % de maisons` : null}
              description={
                commune?.part_maisons_pct
                  ? commune.part_maisons_pct > 50
                    ? `\u00c0 ${villeData.name}, ${commune.part_maisons_pct} % des logements sont des maisons individuelles. Les problèmes de ${problem.name.toLowerCase()} y sont courants.`
                    : `\u00c0 ${villeData.name}, les appartements sont majoritaires. Les interventions en copropriété peuvent impliquer le syndic.`
                  : `La répartition entre maisons et appartements influence les spécificités des interventions à ${villeData.name}.`
              }
            />
            <LocalFactorCard
              icon={<MapPin className="w-5 h-5 text-amber-600" />}
              title="Population"
              value={commune?.population ? formatNumber(commune.population) + ' habitants' : villeData.population + ' habitants'}
              description={`${villeData.name} est une commune de ${villeData.departement} (${villeData.region}). La densité de population influence les délais d'intervention des artisans.`}
            />
          </div>
        </div>
      </section>

      {/* Prevention tips localized */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-green-50 text-green-600 rounded-full text-sm font-medium mb-4">
              <Shield className="w-4 h-4" />
              Prévention
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-3">
              Prévention à {villeData.name}
            </h2>
          </div>
          <div className="space-y-4">
            {problem.preventiveTips.map((tip, i) => (
              <div key={i} className="flex items-start gap-4 bg-gray-50 rounded-xl border border-gray-200 p-5">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Lightbulb className="w-4 h-4 text-green-600" />
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
            Questions fréquentes — {problem.name} à {villeData.name}
          </h2>
          <div className="space-y-4">
            {allFaq.map((item, i) => (
              <details key={i} className="bg-white rounded-xl border border-gray-200 group">
                <summary className="flex items-center justify-between p-5 cursor-pointer list-none">
                  <h3 className="text-base font-semibold text-gray-900 pr-4">{item.question}</h3>
                  <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0 group-open:rotate-180 transition-transform" />
                </summary>
                <div className="px-5 pb-5 text-gray-600 text-sm leading-relaxed">
                  {item.answer}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className={`bg-gradient-to-br ${gradient} text-white py-16 overflow-hidden`}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Besoin d&apos;un {tradeName.toLowerCase()} à {villeData.name} ?
          </h2>
          <p className="text-xl opacity-90 mb-8">
            Comparez les artisans référencés et obtenez un devis gratuit.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href={`/devis/${problem.primaryService}/${ville}`}
              className="inline-flex items-center justify-center gap-3 bg-white text-gray-900 px-8 py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all"
            >
              Devis gratuit
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href={`/urgence/${problem.primaryService}/${ville}`}
              className="inline-flex items-center justify-center gap-3 bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all"
            >
              {tradeName} urgence
            </Link>
          </div>
        </div>
      </section>

      {/* Nearby cities */}
      {nearbyCities.length > 0 && (
        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              {problem.name} dans d&apos;autres villes
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-w-3xl">
              {nearbyCities.map((v) => (
                <Link
                  key={v.slug}
                  href={`/problemes/${probleme}/${v.slug}`}
                  className="bg-gray-50 hover:bg-amber-50 border border-gray-200 hover:border-amber-300 rounded-xl p-4 transition-all group text-center"
                >
                  <div className="font-semibold text-gray-900 group-hover:text-amber-600 transition-colors text-sm">
                    {problem.name} à {v.name}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Other problems */}
      {relatedProblems.length > 0 && (
        <section className="py-16 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Autres problèmes à {villeData.name}
            </h2>
            <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4">
              {relatedProblems.map((rp) => (
                <Link
                  key={rp.slug}
                  href={`/problemes/${rp.slug}/${ville}`}
                  className="bg-white hover:bg-amber-50 border border-gray-200 hover:border-amber-300 rounded-xl p-4 transition-all group"
                >
                  <div className="font-semibold text-gray-900 group-hover:text-amber-600 transition-colors text-sm">
                    {rp.name} à {villeData.name}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {Math.round(rp.estimatedCost.min * multiplier)} – {Math.round(rp.estimatedCost.max * multiplier)} \u20ac
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Voir aussi */}
      <section className="py-12 bg-white border-t">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Voir aussi</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Ce problème</h3>
              <div className="space-y-2">
                <Link href={`/problemes/${probleme}`} className="block text-sm text-gray-600 hover:text-amber-600 py-1">
                  {problem.name} en France
                </Link>
                <Link href={`/devis/${problem.primaryService}/${ville}`} className="block text-sm text-gray-600 hover:text-amber-600 py-1">
                  Devis {tradeName.toLowerCase()} à {villeData.name}
                </Link>
                <Link href={`/services/${problem.primaryService}/${ville}`} className="block text-sm text-gray-600 hover:text-amber-600 py-1">
                  {tradeName} à {villeData.name}
                </Link>
                <Link href={`/urgence/${problem.primaryService}/${ville}`} className="block text-sm text-gray-600 hover:text-amber-600 py-1">
                  {tradeName} urgence à {villeData.name}
                </Link>
                <Link href={`/tarifs/${problem.primaryService}/${ville}`} className="block text-sm text-gray-600 hover:text-amber-600 py-1">
                  Tarifs {tradeName.toLowerCase()} à {villeData.name}
                </Link>
                <Link href={`/avis/${problem.primaryService}/${ville}`} className="block text-sm text-gray-600 hover:text-amber-600 py-1">
                  Avis {tradeName.toLowerCase()} à {villeData.name}
                </Link>
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">\u00c0 {villeData.name}</h3>
              <div className="space-y-2">
                <Link href={`/villes/${ville}`} className="block text-sm text-gray-600 hover:text-amber-600 py-1">
                  Artisans à {villeData.name}
                </Link>
                {relatedProblems.slice(0, 3).map((rp) => (
                  <Link key={rp.slug} href={`/problemes/${rp.slug}/${ville}`} className="block text-sm text-gray-600 hover:text-amber-600 py-1">
                    {rp.name} à {villeData.name}
                  </Link>
                ))}
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Informations utiles</h3>
              <div className="space-y-2">
                <Link href="/problemes" className="block text-sm text-gray-600 hover:text-amber-600 py-1">Tous les problèmes</Link>
                <Link href="/urgence" className="block text-sm text-gray-600 hover:text-amber-600 py-1">Urgence artisan 24h/24</Link>
                <Link href="/tarifs" className="block text-sm text-gray-600 hover:text-amber-600 py-1">Guide des tarifs</Link>
                <Link href="/faq" className="block text-sm text-gray-600 hover:text-amber-600 py-1">FAQ</Link>
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
              Les prix affichés pour {villeData.name} sont des fourchettes indicatives ajustées en fonction des données régionales ({villeData.region}). Ils varient selon la complexité du problème et l&apos;urgence. Seul un devis personnalisé fait foi. {SITE_NAME} est un annuaire indépendant — nous mettons en relation mais ne réalisons pas les interventions.
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
