import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { AlertTriangle, ArrowRight, Shield, Clock, Euro, MapPin, ChevronDown, Lightbulb, ListChecks, Eye, Users, Thermometer, Building2, BookOpen } from 'lucide-react'
import Breadcrumb from '@/components/Breadcrumb'
import JsonLd from '@/components/JsonLd'
import { getBreadcrumbSchema, getFAQSchema, getHowToSchema } from '@/lib/seo/jsonld'
import { SITE_URL, SITE_NAME } from '@/lib/seo/config'
import { getProblemBySlug, getProblemSlugs, getProblemsByService } from '@/lib/data/problems'
import { tradeContent } from '@/lib/data/trade-content'
import { villes, getVilleBySlug, getNearbyCities } from '@/lib/data/france'
import { hashCode, getRegionalMultiplier } from '@/lib/seo/location-content'
import { getCommuneBySlug, formatNumber, type CommuneData } from '@/lib/data/commune-data'
import { allArticlesMeta } from '@/lib/data/blog/articles-index'

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
// Problem × City correlation helper
// ---------------------------------------------------------------------------

type ProblemCategory =
  | 'plomberie'
  | 'electricite'
  | 'chauffage'
  | 'toiture'
  | 'humidite'
  | 'nuisibles'
  | 'maconnerie'
  | 'autre'

function getProblemCategory(primaryService: string, slug: string): ProblemCategory {
  const plomberieProblems = [
    'fuite-eau', 'canalisation-bouchee', 'robinet-qui-fuit', 'robinet-qui-goutte',
    'wc-bouche', 'wc-qui-coule', 'chasse-eau-bloquee', 'degat-des-eaux',
    'inondation', 'gel-tuyaux', 'ballon-eau-chaude-panne', 'panne-ballon-eau-chaude',
    'odeur-egout',
  ]
  const electriciteProblems = [
    'panne-electrique', 'court-circuit', 'disjoncteur-qui-saute', 'prise-qui-chauffe',
    'interphone-panne', 'alarme-declenchee',
  ]
  const chauffageProblems = [
    'panne-chaudiere', 'chaudiere-qui-fuit', 'radiateur-froid',
  ]
  const toitureProblems = [
    'infiltration-toiture', 'tuile-cassee', 'gouttiere-bouchee', 'toit-qui-fuit',
  ]
  const humiditeProblems = [
    'humidite', 'moisissure', 'mur-humide', 'fenetre-qui-condense',
    'peinture-qui-cloque', 'probleme-isolation',
  ]
  const nuisiblesProblems = ['nuisibles', 'infestation-fourmis']

  if (plomberieProblems.includes(slug)) return 'plomberie'
  if (electriciteProblems.includes(slug)) return 'electricite'
  if (chauffageProblems.includes(slug)) return 'chauffage'
  if (toitureProblems.includes(slug)) return 'toiture'
  if (humiditeProblems.includes(slug)) return 'humidite'
  if (nuisiblesProblems.includes(slug)) return 'nuisibles'
  if (primaryService === 'macon') return 'maconnerie'
  return 'autre'
}

interface CorrelationInsight {
  text: string
  severity: 'high' | 'medium' | 'low'
}

function getProblemCityCorrelation(
  category: ProblemCategory,
  commune: CommuneData | null,
  villeName: string,
): CorrelationInsight[] {
  if (!commune) return []
  const insights: CorrelationInsight[] = []

  switch (category) {
    case 'plomberie': {
      if (commune.jours_gel_annuels != null && commune.jours_gel_annuels > 25) {
        insights.push({
          text: `Les ${commune.jours_gel_annuels} jours de gel annuels à ${villeName} fragilisent les canalisations et augmentent le risque de fuite.`,
          severity: 'high',
        })
      }
      if (commune.part_maisons_pct != null && commune.part_maisons_pct > 60) {
        insights.push({
          text: `Avec ${commune.part_maisons_pct} % de maisons individuelles, les installations de plomberie sont plus exposées aux problèmes de canalisations et de raccordement.`,
          severity: 'medium',
        })
      }
      if (commune.precipitation_annuelle != null && commune.precipitation_annuelle > 800) {
        insights.push({
          text: `Les ${formatNumber(Math.round(commune.precipitation_annuelle))} mm de précipitations annuelles sollicitent fortement les réseaux d'évacuation à ${villeName}.`,
          severity: 'medium',
        })
      }
      if (commune.nb_logements != null && commune.nb_logements > 10000) {
        insights.push({
          text: `Avec ${formatNumber(commune.nb_logements)} logements, le réseau de plomberie de ${villeName} est dense et les interventions fréquentes.`,
          severity: 'low',
        })
      }
      break
    }

    case 'electricite': {
      if (commune.pct_passoires_dpe != null && commune.pct_passoires_dpe > 15) {
        insights.push({
          text: `Avec ${commune.pct_passoires_dpe} % de passoires énergétiques, de nombreux logements à ${villeName} ont des installations électriques vétustes qui augmentent le risque de panne.`,
          severity: 'high',
        })
      }
      if (commune.prix_m2_moyen != null && commune.prix_m2_moyen < 2500 && commune.nb_logements != null) {
        insights.push({
          text: `Le prix moyen au m² de ${formatNumber(commune.prix_m2_moyen)} € à ${villeName} suggère un parc immobilier ancien, souvent associé à des installations électriques qui nécessitent une mise aux normes.`,
          severity: 'medium',
        })
      }
      if (commune.nb_logements != null && commune.nb_logements > 5000) {
        insights.push({
          text: `Les ${formatNumber(commune.nb_logements)} logements de ${villeName} génèrent une demande soutenue en dépannage électrique.`,
          severity: 'low',
        })
      }
      break
    }

    case 'chauffage': {
      if (commune.jours_gel_annuels != null && commune.jours_gel_annuels > 15) {
        insights.push({
          text: `Avec ${commune.jours_gel_annuels} jours de gel par an à ${villeName}, les chaudières sont fortement sollicitées durant l'hiver, ce qui augmente le risque de panne.`,
          severity: 'high',
        })
      }
      if (commune.temperature_moyenne_hiver != null) {
        insights.push({
          text: `Avec une température hivernale moyenne de ${commune.temperature_moyenne_hiver} °C à ${villeName}, un système de chauffage performant et bien entretenu est indispensable.`,
          severity: commune.temperature_moyenne_hiver < 3 ? 'high' : 'medium',
        })
      }
      if (commune.climat_zone === 'montagnard') {
        insights.push({
          text: `Le climat montagnard de ${villeName} impose des contraintes particulières : les équipements de chauffage doivent être dimensionnés pour supporter des hivers rigoureux.`,
          severity: 'high',
        })
      } else if (commune.climat_zone === 'continental') {
        insights.push({
          text: `Le climat continental de ${villeName} entraîne des hivers froids qui sollicitent intensément les installations de chauffage.`,
          severity: 'medium',
        })
      }
      if (commune.pct_passoires_dpe != null && commune.pct_passoires_dpe > 15) {
        insights.push({
          text: `${commune.pct_passoires_dpe} % des logements de ${villeName} sont des passoires énergétiques : la surconsommation use prématurément les chaudières.`,
          severity: 'medium',
        })
      }
      break
    }

    case 'toiture': {
      if (commune.precipitation_annuelle != null && commune.precipitation_annuelle > 700) {
        insights.push({
          text: `Avec ${formatNumber(Math.round(commune.precipitation_annuelle))} mm de pluie par an, les toitures à ${villeName} sont particulièrement exposées aux infiltrations.`,
          severity: 'high',
        })
      }
      if (commune.climat_zone === 'oceanique' || commune.climat_zone === 'semi-oceanique') {
        insights.push({
          text: `Le climat ${commune.climat_zone === 'oceanique' ? 'océanique' : 'semi-océanique'} de ${villeName} expose les toitures aux vents et aux pluies fréquentes, accélérant l'usure des matériaux.`,
          severity: 'medium',
        })
      }
      if (commune.part_maisons_pct != null && commune.part_maisons_pct > 50) {
        insights.push({
          text: `${commune.part_maisons_pct} % des logements de ${villeName} sont des maisons individuelles, chacune avec sa propre toiture à entretenir.`,
          severity: 'medium',
        })
      }
      if (commune.jours_gel_annuels != null && commune.jours_gel_annuels > 30) {
        insights.push({
          text: `Les ${commune.jours_gel_annuels} jours de gel par an provoquent des cycles gel-dégel qui fragilisent les tuiles et les joints de toiture.`,
          severity: 'medium',
        })
      }
      break
    }

    case 'humidite': {
      if (commune.precipitation_annuelle != null && commune.precipitation_annuelle > 700) {
        insights.push({
          text: `Les ${formatNumber(Math.round(commune.precipitation_annuelle))} mm de précipitations annuelles à ${villeName} favorisent les problèmes d'humidité dans les logements.`,
          severity: 'high',
        })
      }
      if (
        commune.temperature_moyenne_hiver != null &&
        commune.temperature_moyenne_ete != null
      ) {
        const delta = commune.temperature_moyenne_ete - commune.temperature_moyenne_hiver
        if (delta > 18) {
          insights.push({
            text: `L'écart de température de ${Math.round(delta)} °C entre l'été (${commune.temperature_moyenne_ete} °C) et l'hiver (${commune.temperature_moyenne_hiver} °C) à ${villeName} crée des conditions propices à la condensation.`,
            severity: 'high',
          })
        } else if (delta > 12) {
          insights.push({
            text: `L'amplitude thermique de ${Math.round(delta)} °C entre été et hiver à ${villeName} peut provoquer des phénomènes de condensation sur les parois froides.`,
            severity: 'medium',
          })
        }
      }
      if (commune.climat_zone === 'oceanique') {
        insights.push({
          text: `Le climat océanique de ${villeName}, humide toute l'année, prédispose les logements aux remontées capillaires et à la condensation.`,
          severity: 'medium',
        })
      }
      if (commune.pct_passoires_dpe != null && commune.pct_passoires_dpe > 15) {
        insights.push({
          text: `Les ${commune.pct_passoires_dpe} % de passoires énergétiques à ${villeName} sont particulièrement vulnérables aux problèmes d'humidité par manque d'isolation.`,
          severity: 'medium',
        })
      }
      break
    }

    case 'nuisibles': {
      if (commune.climat_zone === 'mediterraneen') {
        insights.push({
          text: `Le climat méditerranéen de ${villeName} est particulièrement favorable à la prolifération d'insectes et de nuisibles toute l'année.`,
          severity: 'high',
        })
      }
      if (commune.temperature_moyenne_ete != null && commune.temperature_moyenne_ete > 25) {
        insights.push({
          text: `Avec une température estivale moyenne de ${commune.temperature_moyenne_ete} °C à ${villeName}, les conditions sont idéales pour la reproduction des insectes.`,
          severity: 'high',
        })
      }
      if (commune.part_maisons_pct != null && commune.part_maisons_pct > 60) {
        insights.push({
          text: `Les ${commune.part_maisons_pct} % de maisons individuelles avec jardins à ${villeName} offrent davantage de points d'entrée aux nuisibles.`,
          severity: 'medium',
        })
      }
      if (commune.precipitation_annuelle != null && commune.precipitation_annuelle > 800) {
        insights.push({
          text: `L'humidité liée aux ${formatNumber(Math.round(commune.precipitation_annuelle))} mm de pluie annuels favorise certains nuisibles comme les moustiques et les cloportes.`,
          severity: 'low',
        })
      }
      break
    }

    case 'maconnerie': {
      if (commune.jours_gel_annuels != null && commune.jours_gel_annuels > 25) {
        insights.push({
          text: `Les ${commune.jours_gel_annuels} jours de gel annuels à ${villeName} provoquent des cycles gel-dégel qui fissurent les façades et fragilisent les maçonneries.`,
          severity: 'high',
        })
      }
      if (commune.precipitation_annuelle != null && commune.precipitation_annuelle > 800) {
        insights.push({
          text: `Les ${formatNumber(Math.round(commune.precipitation_annuelle))} mm de précipitations annuelles à ${villeName} accélèrent l'érosion des joints et des enduits de façade.`,
          severity: 'medium',
        })
      }
      if (commune.part_maisons_pct != null && commune.part_maisons_pct > 60) {
        insights.push({
          text: `Avec ${commune.part_maisons_pct} % de maisons individuelles, les travaux de maçonnerie sont fréquents à ${villeName}.`,
          severity: 'low',
        })
      }
      break
    }

    default: {
      // Generic insights for all other problem types
      if (commune.nb_logements != null && commune.nb_logements > 5000) {
        insights.push({
          text: `Avec ${formatNumber(commune.nb_logements)} logements, ${villeName} génère une demande importante en interventions du bâtiment.`,
          severity: 'low',
        })
      }
      if (commune.part_maisons_pct != null && commune.part_maisons_pct > 60) {
        insights.push({
          text: `${commune.part_maisons_pct} % des logements de ${villeName} sont des maisons individuelles, ce qui influence le type d'intervention nécessaire.`,
          severity: 'low',
        })
      }
      break
    }
  }

  return insights.slice(0, 4)
}

function getInsightIcon(severity: 'high' | 'medium' | 'low'): string {
  switch (severity) {
    case 'high': return '!!'
    case 'medium': return '!'
    case 'low': return 'i'
  }
}

function getInsightColors(severity: 'high' | 'medium' | 'low') {
  switch (severity) {
    case 'high': return { bg: 'bg-red-100', text: 'text-red-700', dot: 'bg-red-500' }
    case 'medium': return { bg: 'bg-amber-100', text: 'text-amber-700', dot: 'bg-amber-500' }
    case 'low': return { bg: 'bg-blue-100', text: 'text-blue-700', dot: 'bg-blue-500' }
  }
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
    `${problem.name} ${villeData.name} — Solutions`,
    `${problem.name} à ${villeData.name} : coûts`,
    `${problem.name} ${villeData.name} — Artisans`,
    `${problem.name} ${villeData.name} — Diagnostic`,
  ]
  const title = truncateTitle(titleTemplates[titleHash % titleTemplates.length])

  const multiplier = getRegionalMultiplier(villeData.region)
  const minPrice = Math.round(problem.estimatedCost.min * multiplier)
  const maxPrice = Math.round(problem.estimatedCost.max * multiplier)

  const description = `${problem.name} à ${villeData.name} : coût ${minPrice} à ${maxPrice} \u20ac. Diagnostic, conseils d'urgence et artisans référencés. ${problem.averageResponseTime}.`

  return {
    title,
    description,
    alternates: { canonical: `${SITE_URL}/problemes/${probleme}/${ville}` },
    robots: { index: true, follow: true },
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

  // HowTo schema: symptoms as diagnostic steps + immediate actions as resolution steps
  const howToSteps = [
    ...problem.symptoms.map((symptom, i) => ({
      name: `Symptôme ${i + 1}`,
      text: symptom,
    })),
    ...problem.immediateActions.map((action, i) => ({
      name: `Action ${i + 1}`,
      text: action,
    })),
  ]
  const howToSchema = getHowToSchema(howToSteps, {
    name: `Que faire en cas de ${problem.name.toLowerCase()} à ${villeData.name}`,
    description: `Diagnostic et actions immédiates pour résoudre un problème de ${problem.name.toLowerCase()} à ${villeData.name}. ${problem.symptoms.length} symptômes à identifier et ${problem.immediateActions.length} actions d'urgence.`,
  })

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
      <JsonLd data={[breadcrumbSchema, faqSchema, serviceSchema, howToSchema]} />

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
            <Link
              href={`/services/${problem.primaryService}/${ville}`}
              className="inline-flex items-center justify-center gap-3 bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all"
            >
              <MapPin className="w-5 h-5" />
              Trouver un {tradeName.toLowerCase()} à {villeData.name}
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

      {/* Why this problem is frequent in this city — unique correlation */}
      {(() => {
        const category = getProblemCategory(problem.primaryService, problem.slug)
        const insights = getProblemCityCorrelation(category, commune, villeData.name)
        const hasLocalResources = commune?.nb_artisans_btp != null || commune?.nb_artisans_rge != null

        if (insights.length === 0 && !hasLocalResources) return null

        return (
          <section className="py-16 bg-blue-50/60">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-10">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-blue-100 text-blue-700 rounded-full text-sm font-medium mb-4">
                  <MapPin className="w-4 h-4" />
                  Analyse locale
                </div>
                <h2 className="text-3xl font-bold text-gray-900 mb-3">
                  Pourquoi ce problème est fréquent à {villeData.name}
                </h2>
                <p className="text-gray-600 max-w-2xl mx-auto text-sm">
                  Les caractéristiques climatiques, démographiques et immobilières de {villeData.name} influencent directement la fréquence des problèmes de {problem.name.toLowerCase()}.
                </p>
              </div>

              {insights.length > 0 && (
                <div className="space-y-4 mb-10">
                  {insights.map((insight, i) => {
                    const colors = getInsightColors(insight.severity)
                    return (
                      <div
                        key={i}
                        className="bg-white rounded-xl border-l-4 border-blue-500 shadow-sm p-5 flex items-start gap-4"
                      >
                        <div className={`w-8 h-8 ${colors.bg} rounded-lg flex items-center justify-center flex-shrink-0`}>
                          <span className={`text-xs font-bold ${colors.text}`}>
                            {getInsightIcon(insight.severity)}
                          </span>
                        </div>
                        <p className="text-gray-700 text-sm leading-relaxed">{insight.text}</p>
                      </div>
                    )
                  })}
                </div>
              )}

              {/* Ressources locales */}
              {hasLocalResources && (
                <div className="bg-white rounded-2xl border border-blue-200 p-6">
                  <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Users className="w-5 h-5 text-blue-600" />
                    Ressources locales à {villeData.name}
                  </h3>
                  <div className="grid sm:grid-cols-2 gap-4 mb-5">
                    {commune?.nb_artisans_btp != null && (
                      <div className="flex items-center gap-3 bg-blue-50 rounded-lg p-4">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <Building2 className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-lg font-bold text-gray-900">{formatNumber(commune.nb_artisans_btp)}</p>
                          <p className="text-xs text-gray-500">artisans du bâtiment à {villeData.name}</p>
                        </div>
                      </div>
                    )}
                    {commune?.nb_artisans_rge != null && (
                      <div className="flex items-center gap-3 bg-green-50 rounded-lg p-4">
                        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <Shield className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                          <p className="text-lg font-bold text-gray-900">{formatNumber(commune.nb_artisans_rge)}</p>
                          <p className="text-xs text-gray-500">artisans certifiés RGE</p>
                        </div>
                      </div>
                    )}
                  </div>
                  <Link
                    href={`/services/${problem.primaryService}/${ville}`}
                    className="inline-flex items-center gap-2 text-blue-600 font-medium text-sm hover:text-blue-800 transition-colors"
                  >
                    Voir les {tradeName.toLowerCase()}s à {villeData.name}
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              )}
            </div>
          </section>
        )
      })()}

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

      {/* Related blog articles */}
      {(() => {
        // Match articles by tags that relate to the problem's primary service or problem name
        const serviceKeywords = [
          problem.primaryService,
          tradeName.toLowerCase(),
          problem.name.toLowerCase(),
          ...problem.relatedServices,
        ]
        const relatedArticles = allArticlesMeta
          .filter(a =>
            a.tags.some(tag =>
              serviceKeywords.some(kw =>
                tag.toLowerCase().includes(kw) || kw.includes(tag.toLowerCase())
              )
            )
          )
          .slice(0, 3)

        if (relatedArticles.length === 0) return null

        return (
          <section className="py-16 bg-white">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-8">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-blue-50 text-blue-600 rounded-full text-sm font-medium mb-4">
                  <BookOpen className="w-4 h-4" />
                  Articles utiles
                </div>
                <h2 className="text-2xl font-bold text-gray-900">
                  Nos conseils sur {problem.name.toLowerCase()}
                </h2>
              </div>
              <div className="space-y-4">
                {relatedArticles.map(article => (
                  <Link
                    key={article.slug}
                    href={`/blog/${article.slug}`}
                    className="flex items-start gap-4 bg-gray-50 hover:bg-blue-50 rounded-xl border border-gray-200 hover:border-blue-200 p-5 transition-all group"
                  >
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors text-sm mb-1">
                        {article.title}
                      </h3>
                      <p className="text-xs text-gray-500 line-clamp-2">{article.excerpt}</p>
                      <span className="inline-block mt-2 text-xs text-blue-600 font-medium">{article.readTime}</span>
                    </div>
                    <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-blue-600 flex-shrink-0 mt-1 transition-colors" />
                  </Link>
                ))}
              </div>
              <div className="text-center mt-6">
                <Link
                  href="/blog"
                  className="inline-flex items-center gap-2 text-blue-600 font-medium text-sm hover:text-blue-800 transition-colors"
                >
                  Tous nos articles
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </section>
        )
      })()}

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
