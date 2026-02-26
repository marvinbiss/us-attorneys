import { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import {
  Phone,
  Clock,
  Shield,
  CheckCircle,
  ArrowRight,
  AlertTriangle,
  MapPin,
  Users,
  Thermometer,
  Building2,
} from 'lucide-react'
import Breadcrumb from '@/components/Breadcrumb'
import JsonLd from '@/components/JsonLd'
import { getBreadcrumbSchema, getFAQSchema } from '@/lib/seo/jsonld'
import { SITE_URL, SITE_NAME, PHONE_TEL } from '@/lib/seo/config'
import { tradeContent } from '@/lib/data/trade-content'
import { hashCode, getRegionalMultiplier } from '@/lib/seo/location-content'
import { villes, getVilleBySlug, getNearbyCities } from '@/lib/data/france'
import { getCommuneBySlug, formatNumber } from '@/lib/data/commune-data'
import { getServiceImage } from '@/lib/data/images'
import { relatedServices } from '@/lib/constants/navigation'

// ---------------------------------------------------------------------------
// Emergency-specific display data
// ---------------------------------------------------------------------------

const emergencyMeta: Record<
  string,
  { gradient: string; lightBg: string; lightText: string; problems: string[] }
> = {
  plombier: {
    gradient: 'from-blue-600 to-blue-800',
    lightBg: 'bg-blue-50',
    lightText: 'text-blue-700',
    problems: [
      'Fuite d\'eau importante',
      'Canalisation bouchée',
      'Dégât des eaux',
      'Chauffe-eau en panne',
      'WC bouché',
      'Rupture de tuyau',
    ],
  },
  electricien: {
    gradient: 'from-amber-600 to-amber-800',
    lightBg: 'bg-amber-50',
    lightText: 'text-amber-700',
    problems: [
      'Panne de courant',
      'Court-circuit',
      'Tableau électrique défaillant',
      'Prise qui chauffe',
      'Odeur de brûlé électrique',
      'Fil dénudé dangereux',
    ],
  },
  serrurier: {
    gradient: 'from-green-600 to-green-800',
    lightBg: 'bg-green-50',
    lightText: 'text-green-700',
    problems: [
      'Porte claquée',
      'Clé perdue ou volée',
      'Serrure bloquée',
      'Cambriolage (sécurisation)',
      'Changement de serrure urgent',
      'Porte blindée bloquée',
    ],
  },
  chauffagiste: {
    gradient: 'from-red-600 to-red-800',
    lightBg: 'bg-red-50',
    lightText: 'text-red-700',
    problems: [
      'Panne de chauffage',
      'Fuite de gaz',
      'Chaudière en panne',
      'Radiateur qui fuit',
      'Ballon d\'eau chaude HS',
      'Problème de thermostat',
    ],
  },
  vitrier: {
    gradient: 'from-cyan-600 to-cyan-800',
    lightBg: 'bg-cyan-50',
    lightText: 'text-cyan-700',
    problems: [
      'Vitre cassée',
      'Baie vitrée brisée',
      'Vitrine commerciale endommagée',
      'Double vitrage fissuré',
      'Effraction / cambriolage',
      'Tempête / grêle',
    ],
  },
  climaticien: {
    gradient: 'from-indigo-600 to-indigo-800',
    lightBg: 'bg-indigo-50',
    lightText: 'text-indigo-700',
    problems: [
      'Panne de climatisation',
      'Climatisation qui ne refroidit plus',
      'Fuite de fluide frigorigène',
      'Unité extérieure en panne',
      'Bruit anormal',
      'Climatisation en panne pendant la canicule',
    ],
  },
}

// Default problems for services without a specific emergencyMeta entry
function getDefaultProblems(trade: (typeof tradeContent)[string]): string[] {
  if (trade.emergencyInfo) {
    // Derive from commonTasks (take first 6)
    return trade.commonTasks.slice(0, 6)
  }
  return [
    'Panne urgente',
    'Dégât nécessitant une intervention rapide',
    'Problème de sécurité',
    'Dysfonctionnement critique',
    'Urgence suite à intempéries',
    'Intervention de mise en sécurité',
  ]
}

// ---------------------------------------------------------------------------
// Static params: top 8 emergency services x top 30 cities = 240 pages
// ---------------------------------------------------------------------------

const emergencySlugs = Object.keys(tradeContent).filter(
  (slug) => tradeContent[slug].emergencyInfo
)

function parsePopulation(pop: string): number {
  return parseInt(pop.replace(/\s/g, ''), 10) || 0
}

const top10Cities = [...villes]
  .sort((a, b) => parsePopulation(b.population) - parsePopulation(a.population))
  .slice(0, 10)

export const dynamicParams = true

export function generateStaticParams() {
  const topServices = emergencySlugs.slice(0, 5)
  return topServices.flatMap((s) =>
    top10Cities.map((v) => ({ service: s, ville: v.slug }))
  )
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function truncateTitle(title: string, maxLen = 42): string {
  if (title.length <= maxLen) return title
  return title.slice(0, maxLen - 1).replace(/\s+\S*$/, '') + '…'
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

// ---------------------------------------------------------------------------
// Metadata
// ---------------------------------------------------------------------------

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

  const titleHash = Math.abs(hashCode(`urgence-ville-title-${service}-${villeSlug}`))
  const titleTemplates = [
    `Urgence ${tradeLower} à ${villeData.name} — soir & week-end`,
    `Dépannage ${tradeLower} urgent à ${villeData.name}`,
    `${trade.name} urgence ${villeData.name} — y compris le week-end`,
    `${trade.name} d'urgence à ${villeData.name} soir & week-end`,
    `Urgence ${tradeLower} ${villeData.name} : intervention rapide`,
  ]
  const title = truncateTitle(titleTemplates[titleHash % titleTemplates.length])

  const descHash = Math.abs(hashCode(`urgence-ville-desc-${service}-${villeSlug}`))
  const descTemplates = [
    `Urgence ${tradeLower} à ${villeData.name} : intervention rapide, y compris le week-end. ${trade.averageResponseTime}. Artisans référencés, devis gratuit.`,
    `Dépannage ${tradeLower} urgent à ${villeData.name} : disponible soir et week-end. ${trade.averageResponseTime}. Artisans vérifiés.`,
    `${trade.name} d'urgence à ${villeData.name} : intervention rapide 7j/7. Professionnels référencés à proximité. Devis gratuit.`,
    `Besoin d'un ${tradeLower} en urgence à ${villeData.name}\u00A0? Intervention rapide, soir et week-end. ${trade.averageResponseTime}.`,
    `Urgence ${tradeLower} ${villeData.name} : artisans disponibles pour intervention immédiate. ${trade.averageResponseTime}. Devis gratuit.`,
  ]
  const description = descTemplates[descHash % descTemplates.length]

  const serviceImage = getServiceImage(service)
  const canonicalUrl = `${SITE_URL}/urgence/${service}/${villeSlug}`

  // noindex when no real providers exist for this city.
  // Allows Google to re-index later if providers appear.
  // Fail open (providerCount=1) when DB is down to avoid false noindex.
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
      images: [
        {
          url: serviceImage.src,
          width: 800,
          height: 600,
          alt: `${trade.name} urgence à ${villeData.name}`,
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

export default async function UrgenceServiceVillePage({
  params,
}: {
  params: Promise<{ service: string; ville: string }>
}) {
  const { service, ville: villeSlug } = await params

  const trade = tradeContent[service]
  const villeData = getVilleBySlug(villeSlug)
  if (!trade || !villeData || !trade.emergencyInfo) notFound()

  const commune = await getCommuneBySlug(villeSlug)

  const meta = emergencyMeta[service] || {
    gradient: 'from-red-600 to-red-800',
    lightBg: 'bg-red-50',
    lightText: 'text-red-700',
    problems: getDefaultProblems(trade),
  }

  const tradeLower = trade.name.toLowerCase()
  const multiplier = getRegionalMultiplier(villeData.region)
  const minPrice = Math.round(trade.priceRange.min * multiplier)
  const maxPrice = Math.round(trade.priceRange.max * multiplier)

  // Hash-selected tips (3 from trade.tips)
  const tipsHash = Math.abs(hashCode(`urgence-tips-${service}-${villeSlug}`))
  const selectedTips = trade.tips.length <= 3
    ? trade.tips
    : Array.from({ length: 3 }, (_, i) => {
        const idx = (tipsHash + i * 7) % trade.tips.length
        return trade.tips[idx]
      }).filter((tip, i, arr) => arr.indexOf(tip) === i)

  // Emergency FAQ items
  const emergencyFaqItems = [
    {
      question: `Combien coûte un ${tradeLower} en urgence à ${villeData.name} ?`,
      answer: `Les interventions d'urgence de nuit (après 20h) sont majorées de 50 à 100 % par rapport aux tarifs de journée. \u00c0 ${villeData.name}, comptez environ ${Math.round(minPrice * 1.5)} à ${Math.round(maxPrice * 2)} ${trade.priceRange.unit} en urgence nocturne. Demandez toujours un devis avant intervention.`,
    },
    {
      question: `Quel est le délai d'intervention à ${villeData.name} ?`,
      answer: `${trade.averageResponseTime}. Les artisans d'urgence référencés à ${villeData.name} sont disponibles selon leurs horaires, y compris parfois les jours fériés. Le délai varie selon votre localisation exacte et la disponibilité des professionnels.`,
    },
    {
      question: `Que faire en attendant le ${tradeLower} ?`,
      answer: `En attendant l'arrivée du professionnel à ${villeData.name} : sécurisez la zone, coupez l'arrivée d'eau ou le disjoncteur si nécessaire, et ne tentez pas de réparation vous-même. Protégez vos biens des dégâts éventuels.`,
    },
    {
      question: `Un ${tradeLower} d'urgence est-il assuré ?`,
      answer: `Tout ${tradeLower} professionnel doit disposer d'une assurance responsabilité civile professionnelle (RC Pro). Pour les travaux de bâtiment concernés par la loi Spinetta (art. 1792 du Code civil), une garantie décennale est également obligatoire. Exigez les attestations d'assurance avant le début des travaux, même en urgence.`,
    },
  ]

  // Hash-selected trade FAQ items (2 from trade.faq)
  const faqHash = Math.abs(hashCode(`urgence-faq-${service}-${villeSlug}`))
  const tradeFaqItems = trade.faq.length <= 2
    ? trade.faq
    : Array.from({ length: 2 }, (_, i) => {
        const idx = (faqHash + i * 5) % trade.faq.length
        return trade.faq[idx]
      }).filter((f, i, arr) => arr.indexOf(f) === i)

  const allFaqItems = [
    ...emergencyFaqItems.map((f) => ({ question: f.question, answer: f.answer })),
    ...tradeFaqItems.map((f) => ({
      question: f.q.replace(/\?$/, '') + ` à ${villeData.name} ?`,
      answer: f.a,
    })),
  ]

  // Nearby cities
  const nearbyCities = getNearbyCities(villeSlug, 6)

  // Other emergency services for cross-links
  const otherEmergencyServices = emergencySlugs
    .filter((s) => s !== service)
    .slice(0, 5)

  // Related services for "Voir aussi"
  const relatedSlugs = relatedServices[service] || []
  const otherTrades =
    relatedSlugs.length > 0
      ? relatedSlugs.slice(0, 4).filter((s) => tradeContent[s])
      : Object.keys(tradeContent)
          .filter((s) => s !== service)
          .slice(0, 4)

  // ---------------------------------------------------------------------------
  // JSON-LD schemas
  // ---------------------------------------------------------------------------

  const breadcrumbSchema = getBreadcrumbSchema([
    { name: 'Accueil', url: '/' },
    { name: 'Urgence', url: '/urgence' },
    { name: `${trade.name} urgence`, url: `/urgence/${service}` },
    { name: villeData.name, url: `/urgence/${service}/${villeSlug}` },
  ])

  const faqSchema = getFAQSchema(allFaqItems)

  const serviceSchema = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: `${trade.name} urgence à ${villeData.name} soir & week-end`,
    description: `Intervention d'urgence ${tradeLower} à ${villeData.name}. ${trade.averageResponseTime}. Disponible soir et week-end.`,
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
    hoursAvailable: {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: [
        'Monday',
        'Tuesday',
        'Wednesday',
        'Thursday',
        'Friday',
        'Saturday',
        'Sunday',
      ],
      opens: '00:00',
      closes: '23:59',
    },
    offers: {
      '@type': 'AggregateOffer',
      priceCurrency: 'EUR',
      lowPrice: minPrice,
      highPrice: Math.round(maxPrice * 2),
      offerCount: commune?.nb_entreprises_artisanales ?? undefined,
    },
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <JsonLd data={[breadcrumbSchema, faqSchema, serviceSchema]} />

      {/* ─── HERO ──────────────────────────────────────────── */}
      <section
        className={`relative bg-gradient-to-br ${meta.gradient} text-white py-16 md:py-20 overflow-hidden`}
      >
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-white rounded-full blur-[150px] animate-pulse" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Breadcrumb inside hero */}
          <Breadcrumb
            items={[
              { label: 'Urgence', href: '/urgence' },
              { label: `${trade.name} urgence`, href: `/urgence/${service}` },
              { label: villeData.name },
            ]}
            className="mb-6 text-white/60 [&_a]:text-white/60 [&_a:hover]:text-white [&_svg]:text-white/40"
          />

          <div className="flex items-center gap-2 mb-6">
            <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm border border-white/20 px-4 py-2 rounded-full">
              <div className="w-2.5 h-2.5 rounded-full bg-white animate-pulse" />
              <span className="text-sm font-semibold">
                Disponible soir et week-end
              </span>
            </div>
          </div>

          <h1 className="font-heading text-4xl md:text-5xl font-bold mb-6 leading-tight">
            {(() => {
              const h1Hash = Math.abs(
                hashCode(`urgence-ville-h1-${service}-${villeSlug}`)
              )
              const h1Templates = [
                `${trade.name} urgence à ${villeData.name}`,
                `Urgence ${tradeLower} à ${villeData.name} soir & week-end`,
                `Dépannage ${tradeLower} urgent à ${villeData.name}`,
                `${trade.name} d'urgence à ${villeData.name}`,
                `Intervention ${tradeLower} urgente à ${villeData.name}`,
              ]
              return h1Templates[h1Hash % h1Templates.length]
            })()}
            <br />
            <span className="opacity-80">Trouvez rapidement un professionnel.</span>
          </h1>

          <p className="text-xl opacity-90 max-w-2xl mb-8">
            {trade.emergencyInfo} Artisans référencés
            disponibles à {villeData.name} et ses environs.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 mb-8">
            <div className="flex flex-col items-center sm:items-start">
              <a
                href={PHONE_TEL}
                className="inline-flex items-center justify-center gap-3 bg-white text-gray-900 px-8 py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all"
              >
                <Phone className="w-6 h-6" />
                Appeler l&apos;assistance
              </a>
              <span className="text-sm text-white/60 mt-2">Service de mise en relation</span>
            </div>
            <Link
              href={`/devis/${service}/${villeSlug}`}
              className="inline-flex items-center justify-center gap-3 bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all"
            >
              Demander un devis à {villeData.name}
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>

          <div className="flex flex-wrap gap-3">
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 border border-white/10">
              <Clock className="w-4 h-4" />
              <span className="text-sm">{trade.averageResponseTime}</span>
            </div>
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 border border-white/10">
              <Shield className="w-4 h-4" />
              <span className="text-sm">Artisans référencés</span>
            </div>
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 border border-white/10">
              <CheckCircle className="w-4 h-4" />
              <span className="text-sm">Devis gratuit</span>
            </div>
          </div>
        </div>
      </section>

      {/* ─── EMERGENCY PROBLEMS ────────────────────────────── */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="font-heading text-3xl font-bold text-gray-900 mb-3">
              Urgences {tradeLower} courantes à {villeData.name}
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Les {tradeLower}s d&apos;urgence référencés
              interviennent rapidement à {villeData.name} pour tous ces
              problèmes.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {meta.problems.map((problem) => (
              <div
                key={problem}
                className={`flex items-center gap-3 ${meta.lightBg} ${meta.lightText} px-5 py-4 rounded-xl`}
              >
                <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                <span className="font-medium">{problem}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── EMERGENCY PRICING ─────────────────────────────── */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="font-heading text-3xl font-bold text-gray-900 mb-3 text-center">
            Tarifs {tradeLower} urgence à {villeData.name}
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto text-center mb-10">
            Prix indicatifs pour les interventions d&apos;urgence à{' '}
            {villeData.name}. Les majorations varient selon l&apos;horaire et le
            jour d&apos;intervention.
          </p>

          {/* 3 pricing cards */}
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto mb-12">
            <div className="bg-white rounded-2xl border border-gray-200 p-6 text-center">
              <div className="text-sm font-semibold text-gray-500 mb-2 uppercase tracking-wide">
                Tarif journée
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-1">
                {minPrice} — {maxPrice}
              </div>
              <div className="text-sm text-gray-500">
                {trade.priceRange.unit}
              </div>
              <div className="mt-3 text-xs text-gray-400">
                Lundi à samedi, 8h–20h
              </div>
            </div>
            <div className="bg-white rounded-2xl border-2 border-amber-300 p-6 text-center relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-100 text-amber-700 text-xs font-semibold px-3 py-1 rounded-full">
                +50 %
              </div>
              <div className="text-sm font-semibold text-gray-500 mb-2 uppercase tracking-wide">
                Nuit / Week-end
              </div>
              <div className="text-3xl font-bold text-amber-600 mb-1">
                {Math.round(minPrice * 1.5)} —{' '}
                {Math.round(maxPrice * 1.5)}
              </div>
              <div className="text-sm text-gray-500">
                {trade.priceRange.unit}
              </div>
              <div className="mt-3 text-xs text-gray-400">
                Samedi après 20h, dimanche matin
              </div>
            </div>
            <div className="bg-white rounded-2xl border-2 border-red-300 p-6 text-center relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-red-100 text-red-700 text-xs font-semibold px-3 py-1 rounded-full">
                +100 %
              </div>
              <div className="text-sm font-semibold text-gray-500 mb-2 uppercase tracking-wide">
                Dimanche / Jour férié
              </div>
              <div className="text-3xl font-bold text-red-600 mb-1">
                {Math.round(minPrice * 2)} — {Math.round(maxPrice * 2)}
              </div>
              <div className="text-sm text-gray-500">
                {trade.priceRange.unit}
              </div>
              <div className="mt-3 text-xs text-gray-400">
                Dimanche, jours fériés, 1er mai
              </div>
            </div>
          </div>

          {multiplier !== 1.0 && (
            <p className="text-xs text-gray-400 text-center mb-8">
              {multiplier > 1.0
                ? `Les tarifs en ${villeData.region} sont en moyenne ${Math.round((multiplier - 1) * 100)} % supérieurs à la moyenne nationale`
                : `Les tarifs en ${villeData.region} sont en moyenne ${Math.round((1 - multiplier) * 100)} % inférieurs à la moyenne nationale`}
            </p>
          )}

          {/* Common tasks grid */}
          <h3 className="font-heading text-xl font-bold text-gray-900 mb-4 text-center">
            Prestations courantes
          </h3>
          <div className="grid md:grid-cols-2 gap-4 max-w-4xl mx-auto">
            {trade.commonTasks.map((task, i) => (
              <div
                key={i}
                className="flex items-start gap-3 bg-white rounded-xl border border-gray-200 p-4"
              >
                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <span className="text-gray-700 text-sm">{task}</span>
              </div>
            ))}
          </div>

          <div className="text-center mt-8">
            <Link
              href={`/tarifs/${service}/${villeSlug}`}
              className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-semibold"
            >
              Tarifs détaillés {tradeLower} à {villeData.name}
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ─── LOCAL CONTEXT ─────────────────────────────────── */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="font-heading text-2xl font-bold text-gray-900 mb-2 text-center">
            Contexte local à {villeData.name}
          </h2>
          <p className="text-gray-500 text-sm text-center mb-8">
            Données locales qui influencent les interventions d&apos;urgence{' '}
            {tradeLower} à {villeData.name}.
          </p>
          <div className="grid sm:grid-cols-2 gap-6">
            <LocalFactorCard
              icon={<Users className="w-5 h-5 text-amber-600" />}
              title="Artisans locaux"
              value={
                commune?.nb_entreprises_artisanales
                  ? `${formatNumber(commune.nb_entreprises_artisanales)} entreprises`
                  : null
              }
              description={
                commune?.nb_entreprises_artisanales
                  ? `${villeData.name} compte ${formatNumber(commune.nb_entreprises_artisanales)} entreprises artisanales, ce qui facilite l'accès à un ${tradeLower} d'urgence disponible rapidement.`
                  : `Le nombre d'artisans disponibles à ${villeData.name} influence le délai d'intervention en urgence.`
              }
            />
            <LocalFactorCard
              icon={<Thermometer className="w-5 h-5 text-green-600" />}
              title="Climat"
              value={getClimatLabel(commune?.climat_zone ?? null)}
              description={`Le climat local à ${villeData.name} influence la fréquence de certaines urgences (gel, canicule, intempéries). Anticipez les périodes à risque.`}
            />
            <LocalFactorCard
              icon={<Building2 className="w-5 h-5 text-purple-600" />}
              title="Type de logement"
              value={
                commune?.part_maisons_pct
                  ? `${commune.part_maisons_pct} % de maisons`
                  : null
              }
              description={
                commune?.part_maisons_pct
                  ? commune.part_maisons_pct > 50
                    ? `\u00c0 ${villeData.name}, ${commune.part_maisons_pct} % des logements sont des maisons individuelles. Les interventions d'urgence sur maisons (toiture, canalisations) sont fréquentes.`
                    : `\u00c0 ${villeData.name}, les appartements sont majoritaires (${100 - commune.part_maisons_pct} %). Les urgences en copropriété peuvent impliquer des contraintes spécifiques.`
                  : `La répartition entre maisons et appartements à ${villeData.name} influence les types d'urgences rencontrées.`
              }
            />
            <LocalFactorCard
              icon={<MapPin className="w-5 h-5 text-blue-600" />}
              title="Population"
              value={
                commune
                  ? `${formatNumber(commune.population)} habitants`
                  : villeData.population
              }
              description={`La taille de ${villeData.name} conditionne le maillage d'artisans d'urgence disponibles et les délais d'intervention.`}
            />
          </div>
        </div>
      </section>

      {/* ─── WHAT TO DO WHILE WAITING ──────────────────────── */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="font-heading text-2xl font-bold text-gray-900 mb-6 text-center">
            Que faire en attendant le {tradeLower} ?
          </h2>
          <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-6 md:p-8">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <h3 className="font-heading text-lg font-semibold text-amber-800 mb-2">
                  Conseils de sécurité en attendant l&apos;artisan
                </h3>
                <p className="text-amber-700 leading-relaxed">
                  {trade.emergencyInfo}
                </p>
                <p className="text-amber-600 text-sm mt-4">
                  En cas d&apos;urgence vitale (fuite de gaz, incendie),
                  appelez le 18 (pompiers) ou le 112 avant toute autre
                  démarche.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── CERTIFICATIONS ────────────────────────────────── */}
      {trade.certifications.length > 0 && (
        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="font-heading text-2xl font-bold text-gray-900 mb-6 text-center">
              Certifications à vérifier
            </h2>
            <div className="flex flex-wrap justify-center gap-3">
              {trade.certifications.map((cert) => (
                <div
                  key={cert}
                  className="flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-lg text-sm font-medium"
                >
                  <Shield className="w-4 h-4" />
                  {cert}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ─── TIPS ──────────────────────────────────────────── */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="font-heading text-2xl font-bold text-gray-900 mb-6 text-center">
            Conseils pratiques
          </h2>
          <div className="space-y-4">
            {selectedTips.map((tip, i) => (
              <div
                key={i}
                className="flex items-start gap-4 bg-white rounded-xl border border-gray-200 p-5"
              >
                <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-amber-600 font-bold text-sm">
                    {i + 1}
                  </span>
                </div>
                <p className="text-gray-700 text-sm leading-relaxed">{tip}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FAQ ───────────────────────────────────────────── */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="font-heading text-2xl font-bold text-gray-900 mb-6 text-center">
            Questions fréquentes — {trade.name} urgence à{' '}
            {villeData.name}
          </h2>
          <div className="space-y-4">
            {allFaqItems.map((item, i) => (
              <details
                key={i}
                className="bg-gray-50 rounded-xl border border-gray-200 group"
              >
                <summary className="flex items-center justify-between p-5 cursor-pointer list-none">
                  <h3 className="text-base font-semibold text-gray-900 pr-4">
                    {item.question}
                  </h3>
                  <ArrowRight className="w-4 h-4 text-gray-400 flex-shrink-0 group-open:rotate-90 transition-transform" />
                </summary>
                <div className="px-5 pb-5 text-gray-600 text-sm leading-relaxed">
                  {item.answer}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA ───────────────────────────────────────────── */}
      <section
        className={`bg-gradient-to-br ${meta.gradient} text-white py-16 overflow-hidden`}
      >
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="font-heading text-3xl font-bold mb-4">
            Besoin d&apos;un {tradeLower} en urgence à {villeData.name}
            &nbsp;?
          </h2>
          <p className="text-xl opacity-90 mb-8">
            Les {tradeLower}s référencés à{' '}
            {villeData.name} sont disponibles selon leurs horaires, y compris parfois les jours fériés.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <div className="flex flex-col items-center">
              <a
                href={PHONE_TEL}
                className="inline-flex items-center justify-center gap-3 bg-white text-gray-900 px-8 py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all"
              >
                <Phone className="w-6 h-6" />
                Appeler l&apos;assistance
              </a>
              <span className="text-sm text-white/60 mt-2">Service de mise en relation</span>
            </div>
            <Link
              href={`/devis/${service}/${villeSlug}`}
              className="inline-flex items-center justify-center gap-3 bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all"
            >
              Demander un devis à {villeData.name}
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* ─── CROSS-LINKS: NEARBY CITIES ────────────────────── */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="font-heading text-2xl font-bold text-gray-900 mb-6">
            {trade.name} urgence dans d&apos;autres villes
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-w-3xl">
            {nearbyCities.map((v) => (
              <Link
                key={v.slug}
                href={`/urgence/${service}/${v.slug}`}
                className="bg-gray-50 hover:bg-red-50 border border-gray-200 hover:border-red-300 rounded-xl p-4 transition-all group text-center"
              >
                <div className="font-semibold text-gray-900 group-hover:text-red-600 transition-colors text-sm">
                  {trade.name} urgence à {v.name}
                </div>
                <div className="text-xs text-gray-500 mt-1">Soir & week-end</div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CROSS-LINKS: OTHER EMERGENCY SERVICES ─────────── */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="font-heading text-2xl font-bold text-gray-900 mb-6">
            Autres urgences à {villeData.name}
          </h2>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {otherEmergencyServices.map((slug) => {
              const t = tradeContent[slug]
              return (
                <Link
                  key={slug}
                  href={`/urgence/${slug}/${villeSlug}`}
                  className="bg-white hover:bg-red-50 border border-gray-200 hover:border-red-300 rounded-xl p-4 transition-all group text-center"
                >
                  <div className="font-semibold text-gray-900 group-hover:text-red-600 transition-colors text-sm">
                    {t.name} urgence
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {t.averageResponseTime}
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      </section>

      {/* ─── VOIR AUSSI ────────────────────────────────────── */}
      <section className="py-12 bg-white border-t">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="font-heading text-xl font-bold text-gray-900 mb-6">
            Voir aussi
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div>
              <h3 className="font-heading font-semibold text-gray-900 mb-3">
                Ce service
              </h3>
              <div className="space-y-2">
                <Link
                  href={`/urgence/${service}`}
                  className="block text-sm text-gray-600 hover:text-blue-600 py-1"
                >
                  {trade.name} urgence en France
                </Link>
                <Link
                  href={`/services/${service}/${villeSlug}`}
                  className="block text-sm text-gray-600 hover:text-blue-600 py-1"
                >
                  {trade.name} à {villeData.name}
                </Link>
                <Link
                  href={`/tarifs/${service}/${villeSlug}`}
                  className="block text-sm text-gray-600 hover:text-blue-600 py-1"
                >
                  Tarifs {tradeLower} à {villeData.name}
                </Link>
                <Link
                  href={`/devis/${service}/${villeSlug}`}
                  className="block text-sm text-gray-600 hover:text-blue-600 py-1"
                >
                  Devis {tradeLower} à {villeData.name}
                </Link>
                <Link
                  href={`/avis/${service}/${villeSlug}`}
                  className="block text-sm text-gray-600 hover:text-blue-600 py-1"
                >
                  Avis {tradeLower} à {villeData.name}
                </Link>
              </div>
            </div>
            <div>
              <h3 className="font-heading font-semibold text-gray-900 mb-3">
                Cette ville
              </h3>
              <div className="space-y-2">
                <Link
                  href={`/villes/${villeSlug}`}
                  className="block text-sm text-gray-600 hover:text-blue-600 py-1"
                >
                  Artisans à {villeData.name}
                </Link>
                {otherTrades.slice(0, 3).map((slug) => {
                  const t = tradeContent[slug]
                  if (!t) return null
                  return (
                    <Link
                      key={slug}
                      href={`/urgence/${slug}/${villeSlug}`}
                      className="block text-sm text-gray-600 hover:text-blue-600 py-1"
                    >
                      {t.name} urgence à {villeData.name}
                    </Link>
                  )
                })}
              </div>
            </div>
            <div>
              <h3 className="font-heading font-semibold text-gray-900 mb-3">
                Informations utiles
              </h3>
              <div className="space-y-2">
                <Link
                  href="/urgence"
                  className="block text-sm text-gray-600 hover:text-blue-600 py-1"
                >
                  Toutes les urgences
                </Link>
                <Link
                  href="/comment-ca-marche"
                  className="block text-sm text-gray-600 hover:text-blue-600 py-1"
                >
                  Comment ça marche
                </Link>
                <Link
                  href="/tarifs"
                  className="block text-sm text-gray-600 hover:text-blue-600 py-1"
                >
                  Guide des tarifs
                </Link>
                <Link
                  href="/faq"
                  className="block text-sm text-gray-600 hover:text-blue-600 py-1"
                >
                  FAQ
                </Link>
                <Link
                  href="/notre-processus-de-verification"
                  className="block text-sm text-gray-600 hover:text-blue-600 py-1"
                >
                  Processus de vérification
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── EDITORIAL CREDIBILITY ─────────────────────────── */}
      <section className="mb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-slate-50 rounded-2xl border border-slate-200 p-6">
            <h3 className="text-sm font-semibold text-slate-700 mb-2">
              Information importante
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Les délais d&apos;intervention et tarifs affichés pour{' '}
              {villeData.name} sont des estimations basées sur la
              disponibilité habituelle des artisans et les données
              régionales ({villeData.region}). Ils peuvent varier selon la
              complexité de l&apos;intervention et la disponibilité
              des professionnels. {SITE_NAME} est un annuaire indépendant
              — nous mettons en relation mais ne réalisons pas les
              interventions. En cas d&apos;urgence vitale, appelez le 18
              (pompiers) ou le 112.
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
          {value && (
            <p className="text-xs text-blue-600 font-medium">{value}</p>
          )}
        </div>
      </div>
      <p className="text-gray-600 text-sm leading-relaxed">{description}</p>
    </div>
  )
}
