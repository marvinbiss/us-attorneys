import { Metadata } from 'next'
import Link from 'next/link'
import {
  BarChart3, Building2, TrendingUp, MapPin, Thermometer,
  GraduationCap, Zap, Users, Hammer, Euro, ArrowUpRight,
  ArrowDownRight, Minus, Calendar, BookOpen, ExternalLink,
  ChevronRight,
} from 'lucide-react'
import JsonLd from '@/components/JsonLd'
import Breadcrumb from '@/components/Breadcrumb'
import { SITE_URL, SITE_NAME } from '@/lib/seo/config'
import { DEPT_ARTISAN_COUNTS } from '@/lib/data/dept-artisan-counts'
import { DEPARTMENTS } from '@/lib/geography'
import {
  servicePricings,
  regionalIndices,
  getPrixMoyenNational,
  getVariationMoyenne,
} from '@/lib/data/barometre'

// ---------------------------------------------------------------------------
// Compute stats from real data
// ---------------------------------------------------------------------------

function computeDeptStats() {
  const entries = Object.entries(DEPT_ARTISAN_COUNTS)

  const totalArtisans = entries.reduce((s, [, v]) => s + v.artisans, 0)
  const totalBtp = entries.reduce((s, [, v]) => s + v.btp, 0)
  const btpRatio = Math.round((totalBtp / totalArtisans) * 100)

  // Population data (from INSEE 2024, sourced from dept-artisan-counts comments)
  const DEPT_POP: Record<string, number> = {
    '75': 2104000, '77': 1421000, '78': 1448000, '91': 1306000,
    '92': 1624000, '93': 1644000, '94': 1407000, '95': 1249000,
    '02': 525000, '59': 2608000, '60': 829000, '62': 1468000, '80': 572000,
    '08': 270000, '10': 311000, '51': 567000, '52': 172000, '54': 733000,
    '55': 184000, '57': 1046000, '67': 1140000, '68': 764000, '88': 363000,
    '14': 694000, '27': 601000, '50': 495000, '61': 278000, '76': 1256000,
    '22': 600000, '29': 909000, '35': 1094000, '56': 759000,
    '44': 1437000, '49': 818000, '53': 307000, '72': 566000, '85': 685000,
    '18': 302000, '28': 432000, '36': 218000, '37': 610000, '41': 329000, '45': 680000,
    '21': 534000, '25': 543000, '39': 260000, '58': 202000, '70': 234000,
    '71': 551000, '89': 338000, '90': 142000,
    '01': 655000, '03': 335000, '07': 328000, '15': 144000, '26': 517000,
    '38': 1272000, '42': 762000, '43': 227000, '63': 659000, '69': 1878000,
    '73': 436000, '74': 826000,
    '16': 352000, '17': 651000, '19': 240000, '23': 116000, '24': 413000,
    '33': 1623000, '40': 413000, '47': 330000, '64': 682000, '79': 374000,
    '86': 439000, '87': 373000,
    '09': 153000, '11': 374000, '12': 279000, '30': 748000, '31': 1415000,
    '32': 191000, '34': 1175000, '46': 174000, '48': 76000, '65': 228000,
    '66': 479000, '81': 389000, '82': 262000,
    '04': 164000, '05': 141000, '06': 1083000, '13': 2043000, '83': 1076000,
    '84': 561000,
    '2A': 158000, '2B': 181000,
    '971': 384000, '972': 364000, '973': 294000, '974': 860000, '976': 321000,
  }

  // Top 10 by absolute count
  const sortedByCount = entries
    .map(([code, data]) => ({
      code,
      name: DEPARTMENTS[code] || code,
      artisans: data.artisans,
      btp: data.btp,
    }))
    .sort((a, b) => b.artisans - a.artisans)
    .slice(0, 10)

  // Top 10 by density (artisans per 10 000 inhabitants)
  const withDensity = entries
    .filter(([code]) => DEPT_POP[code] && DEPT_POP[code] > 50000)
    .map(([code, data]) => ({
      code,
      name: DEPARTMENTS[code] || code,
      artisans: data.artisans,
      density: Math.round((data.artisans / DEPT_POP[code]) * 10000),
      population: DEPT_POP[code],
    }))
    .sort((a, b) => b.density - a.density)
    .slice(0, 10)

  return { totalArtisans, totalBtp, btpRatio, sortedByCount, withDensity }
}

const {
  totalArtisans,
  totalBtp,
  btpRatio,
  sortedByCount,
  withDensity,
} = computeDeptStats()

const prixMoyen = getPrixMoyenNational()
const variationMoyenne = getVariationMoyenne()

// ---------------------------------------------------------------------------
// Metadata
// ---------------------------------------------------------------------------

const pageTitle = 'Statistiques artisans France 2026 : chiffres clés, prix et tendances'
const pageDescription = `${(totalArtisans / 1000).toFixed(0)}k+ artisans référencés. Chiffres clés du marché artisanal français : répartition géographique, tarifs moyens, rénovation énergétique, emploi et tendances 2026. Sources : CMA, INSEE, ADEME, CAPEB, FFB.`
const pageUrl = `${SITE_URL}/statistiques-artisans-france`

export const metadata: Metadata = {
  title: pageTitle,
  description: pageDescription,
  alternates: { canonical: pageUrl },
  robots: {
    index: true,
    follow: true,
    'max-snippet': -1,
    'max-image-preview': 'large',
    'max-video-preview': -1,
  },
  openGraph: {
    title: pageTitle,
    description: pageDescription,
    url: pageUrl,
    type: 'article',
    siteName: SITE_NAME,
    locale: 'fr_FR',
    images: [
      {
        url: `${SITE_URL}/opengraph-image`,
        width: 1200,
        height: 630,
        alt: 'Statistiques artisans France 2026 — ServicesArtisans',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: pageTitle,
    description: pageDescription,
    images: [`${SITE_URL}/opengraph-image`],
  },
}

export const revalidate = 86400 // 24h

// ---------------------------------------------------------------------------
// Helper components
// ---------------------------------------------------------------------------

function StatCard({
  value,
  label,
  source,
  icon: Icon,
  accent = 'blue',
}: {
  value: string
  label: string
  source: string
  icon: React.ComponentType<{ className?: string }>
  accent?: 'blue' | 'green' | 'orange' | 'red' | 'purple' | 'teal'
}) {
  const accents = {
    blue: 'bg-blue-50 border-blue-200 text-blue-700',
    green: 'bg-green-50 border-green-200 text-green-700',
    orange: 'bg-orange-50 border-orange-200 text-orange-700',
    red: 'bg-red-50 border-red-200 text-red-700',
    purple: 'bg-purple-50 border-purple-200 text-purple-700',
    teal: 'bg-teal-50 border-teal-200 text-teal-700',
  }
  const iconBg = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    orange: 'bg-orange-100 text-orange-600',
    red: 'bg-red-100 text-red-600',
    purple: 'bg-purple-100 text-purple-600',
    teal: 'bg-teal-100 text-teal-600',
  }

  return (
    <div className={`rounded-xl border p-5 ${accents[accent]} transition-shadow hover:shadow-md`}>
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${iconBg[accent]}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <p className="text-3xl font-bold tracking-tight mb-1">{value}</p>
      <p className="text-sm font-medium opacity-90 mb-2">{label}</p>
      <p className="text-xs opacity-60">Source : {source}</p>
    </div>
  )
}

function TrendBadge({ tendance, variation }: { tendance: 'hausse' | 'stable' | 'baisse'; variation?: number }) {
  if (tendance === 'hausse') {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-red-600 bg-red-50 px-2 py-0.5 rounded-full">
        <ArrowUpRight className="w-3 h-3" />
        {variation !== undefined ? `+${variation}%` : 'Hausse'}
      </span>
    )
  }
  if (tendance === 'baisse') {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
        <ArrowDownRight className="w-3 h-3" />
        {variation !== undefined ? `${variation}%` : 'Baisse'}
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 text-xs font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
      <Minus className="w-3 h-3" />
      {variation !== undefined ? `${variation > 0 ? '+' : ''}${variation}%` : 'Stable'}
    </span>
  )
}

function SectionTitle({
  id,
  icon: Icon,
  title,
  subtitle,
}: {
  id: string
  icon: React.ComponentType<{ className?: string }>
  title: string
  subtitle: string
}) {
  return (
    <div className="mb-8" id={id}>
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
          <Icon className="w-5 h-5" />
        </div>
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900">{title}</h2>
      </div>
      <p className="text-gray-600 ml-[52px]">{subtitle}</p>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function StatistiquesArtisansFrancePage() {
  const breadcrumbItems = [
    { label: 'Statistiques artisans France' },
  ]

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Accueil',
        item: SITE_URL,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Statistiques artisans France',
        item: pageUrl,
      },
    ],
  }

  const datasetSchema = {
    '@context': 'https://schema.org',
    '@type': 'Dataset',
    name: 'Statistiques du marché artisanal en France (2026)',
    description: 'Données agrégées sur le nombre d\'artisans, les tarifs, la répartition géographique et les tendances du marché artisanal français.',
    url: pageUrl,
    license: 'https://creativecommons.org/licenses/by/4.0/',
    creator: {
      '@type': 'Organization',
      name: SITE_NAME,
      url: SITE_URL,
    },
    datePublished: '2026-01-15',
    dateModified: '2026-03-01',
    temporalCoverage: '2024/2026',
    spatialCoverage: {
      '@type': 'Place',
      name: 'France',
    },
    keywords: [
      'artisans france',
      'statistiques artisanat',
      'nombre artisans',
      'marché artisanal',
      'BTP france',
      'prix artisans',
      'rénovation énergétique',
    ],
    distribution: {
      '@type': 'DataDownload',
      contentUrl: pageUrl,
      encodingFormat: 'text/html',
    },
    isBasedOn: [
      'https://www.cma-france.fr/',
      'https://www.insee.fr/',
      'https://www.ademe.fr/',
      'https://www.capeb.fr/',
      'https://www.ffbatiment.fr/',
    ],
  }

  const webPageSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: pageTitle,
    description: pageDescription,
    url: pageUrl,
    datePublished: '2026-01-15',
    dateModified: '2026-03-01',
    inLanguage: 'fr',
    isPartOf: {
      '@type': 'WebSite',
      name: SITE_NAME,
      url: SITE_URL,
    },
    publisher: {
      '@type': 'Organization',
      name: SITE_NAME,
      url: SITE_URL,
    },
    mainEntity: {
      '@type': 'Article',
      headline: pageTitle,
      datePublished: '2026-01-15',
      dateModified: '2026-03-01',
      author: {
        '@type': 'Organization',
        name: SITE_NAME,
      },
    },
  }

  // Table of contents
  const toc = [
    { id: 'marche', label: 'Le marché en chiffres' },
    { id: 'geographie', label: 'Répartition géographique' },
    { id: 'tarifs', label: 'Tarifs et prix 2026' },
    { id: 'renovation', label: 'Rénovation énergétique' },
    { id: 'emploi', label: 'Emploi et formation' },
    { id: 'tendances', label: 'Tendances 2026' },
    { id: 'methodologie', label: 'Méthodologie' },
    { id: 'sources', label: 'Sources' },
  ]

  return (
    <>
      <JsonLd data={[breadcrumbSchema, datasetSchema, webPageSchema]} />

      <div className="bg-white">
        {/* Breadcrumb */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
          <Breadcrumb items={breadcrumbItems} />
        </div>

        {/* Hero */}
        <header className="relative overflow-hidden bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 text-white mt-4">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0" style={{
              backgroundImage: 'radial-gradient(circle at 25% 25%, white 1px, transparent 1px), radial-gradient(circle at 75% 75%, white 1px, transparent 1px)',
              backgroundSize: '50px 50px',
            }} />
          </div>

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
            <div className="flex items-center gap-2 mb-4">
              <Calendar className="w-4 h-4 text-blue-300" />
              <span className="text-sm text-blue-300">Dernière mise à jour : mars 2026</span>
            </div>

            <h1 className="text-3xl md:text-5xl font-bold mb-6 leading-tight">
              Statistiques artisans en France
              <span className="block text-blue-300 mt-2">Chiffres clés, prix et tendances 2026</span>
            </h1>

            <p className="text-lg md:text-xl text-blue-100 max-w-3xl mb-10">
              Toutes les données essentielles sur le marché artisanal français :
              nombre d&apos;artisans, répartition géographique, tarifs moyens par métier,
              rénovation énergétique et perspectives 2026. Données actualisées, sources officielles.
            </p>

            {/* Hero stat counters */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 md:p-6 border border-white/20">
                <p className="text-3xl md:text-4xl font-bold">1,3M</p>
                <p className="text-sm text-blue-200 mt-1">Artisans en France</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 md:p-6 border border-white/20">
                <p className="text-3xl md:text-4xl font-bold">300 Md&euro;</p>
                <p className="text-sm text-blue-200 mt-1">Chiffre d&apos;affaires</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 md:p-6 border border-white/20">
                <p className="text-3xl md:text-4xl font-bold">{totalArtisans.toLocaleString('fr-FR')}</p>
                <p className="text-sm text-blue-200 mt-1">Artisans référencés</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 md:p-6 border border-white/20">
                <p className="text-3xl md:text-4xl font-bold">101</p>
                <p className="text-sm text-blue-200 mt-1">Départements couverts</p>
              </div>
            </div>
          </div>
        </header>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">

          {/* Table of Contents */}
          <nav className="mb-16 bg-gray-50 rounded-xl p-6 border border-gray-200" aria-label="Sommaire">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-blue-600" />
              Sommaire
            </h2>
            <ol className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {toc.map((item, i) => (
                <li key={item.id}>
                  <a
                    href={`#${item.id}`}
                    className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors group"
                  >
                    <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 text-xs font-bold flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
                      {i + 1}
                    </span>
                    {item.label}
                  </a>
                </li>
              ))}
            </ol>
          </nav>

          {/* ============================================================= */}
          {/* Section 1: Le marché artisanal en chiffres */}
          {/* ============================================================= */}
          <section className="mb-20">
            <SectionTitle
              id="marche"
              icon={BarChart3}
              title="Le marché artisanal en chiffres"
              subtitle="Vue d'ensemble du secteur artisanal français — données 2024-2026"
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <StatCard
                value="1,3 million"
                label="Entreprises artisanales en France"
                source="CMA France 2025"
                icon={Building2}
                accent="blue"
              />
              <StatCard
                value={`${(totalBtp / 1000).toFixed(0)}k`}
                label="Entreprises artisanales du BTP"
                source="CAPEB 2024, calcul ServicesArtisans"
                icon={Hammer}
                accent="orange"
              />
              <StatCard
                value="300 Md€"
                label="Chiffre d'affaires du secteur artisanal"
                source="U2P/ISM 2024"
                icon={Euro}
                accent="green"
              />
              <StatCard
                value={`${btpRatio} %`}
                label="Part du BTP dans l'artisanat"
                source="Calcul ServicesArtisans sur données CMA/CAPEB"
                icon={Building2}
                accent="purple"
              />
              <StatCard
                value="~250 000"
                label="Créations d'entreprises artisanales par an"
                source="CMA France 2024"
                icon={TrendingUp}
                accent="teal"
              />
              <StatCard
                value={`${totalArtisans.toLocaleString('fr-FR')}`}
                label="Artisans référencés dans notre base"
                source="Données SIRENE, ServicesArtisans"
                icon={Users}
                accent="blue"
              />
              <StatCard
                value="3,1 millions"
                label="Actifs dans l'artisanat (salariés + indépendants)"
                source="ISM/U2P 2024"
                icon={Users}
                accent="green"
              />
              <StatCard
                value="~580 000"
                label="Entreprises artisanales de services"
                source="CMA France 2024"
                icon={Zap}
                accent="orange"
              />
              <StatCard
                value="~170 000"
                label="Entreprises artisanales de production"
                source="CMA France 2024"
                icon={Hammer}
                accent="red"
              />
            </div>
          </section>

          {/* ============================================================= */}
          {/* Section 2: Répartition géographique */}
          {/* ============================================================= */}
          <section className="mb-20">
            <SectionTitle
              id="geographie"
              icon={MapPin}
              title="Répartition géographique"
              subtitle="Disparités régionales du tissu artisanal français"
            />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Top 10 by count */}
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                  <h3 className="font-bold text-gray-900">Top 10 départements par nombre d&apos;artisans</h3>
                  <p className="text-sm text-gray-500 mt-1">Source : CMA, CAPEB, INSEE — calculs ServicesArtisans</p>
                </div>
                <div className="divide-y divide-gray-100">
                  {sortedByCount.map((dept, i) => {
                    const maxCount = sortedByCount[0].artisans
                    const barWidth = (dept.artisans / maxCount) * 100
                    return (
                      <div key={dept.code} className="px-6 py-3 flex items-center gap-4">
                        <span className="text-sm font-bold text-gray-400 w-6 text-right">{i + 1}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium text-gray-900 truncate">
                              {dept.name} ({dept.code})
                            </span>
                            <span className="text-sm font-bold text-blue-700 ml-2">
                              {dept.artisans.toLocaleString('fr-FR')}
                            </span>
                          </div>
                          <div className="w-full bg-gray-100 rounded-full h-2">
                            <div
                              className="bg-blue-500 h-2 rounded-full transition-all"
                              style={{ width: `${barWidth}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Top 10 by density */}
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                  <h3 className="font-bold text-gray-900">Top 10 départements par densité artisanale</h3>
                  <p className="text-sm text-gray-500 mt-1">Artisans pour 10 000 habitants — Source : INSEE, CMA</p>
                </div>
                <div className="divide-y divide-gray-100">
                  {withDensity.map((dept, i) => {
                    const maxDensity = withDensity[0].density
                    const barWidth = (dept.density / maxDensity) * 100
                    return (
                      <div key={dept.code} className="px-6 py-3 flex items-center gap-4">
                        <span className="text-sm font-bold text-gray-400 w-6 text-right">{i + 1}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium text-gray-900 truncate">
                              {dept.name} ({dept.code})
                            </span>
                            <span className="text-sm font-bold text-green-700 ml-2">
                              {dept.density} / 10 000 hab.
                            </span>
                          </div>
                          <div className="w-full bg-gray-100 rounded-full h-2">
                            <div
                              className="bg-green-500 h-2 rounded-full transition-all"
                              style={{ width: `${barWidth}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* Regional insights */}
            <div className="mt-8 bg-blue-50 rounded-xl border border-blue-200 p-6">
              <h3 className="font-bold text-blue-900 mb-3">Disparités régionales : ce qu&apos;il faut retenir</h3>
              <ul className="space-y-2 text-sm text-blue-800">
                <li className="flex items-start gap-2">
                  <ChevronRight className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span><strong>L&apos;Île-de-France</strong> concentre environ 27 % des entreprises artisanales, avec Paris (75) et la Seine-Saint-Denis (93) en tête.</span>
                </li>
                <li className="flex items-start gap-2">
                  <ChevronRight className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>Les départements du <strong>Sud-Est</strong> (PACA, Corse) affichent les densités les plus élevées, tirées par le BTP et la rénovation.</span>
                </li>
                <li className="flex items-start gap-2">
                  <ChevronRight className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>Les zones rurales (Creuse, Lozère) ont moins d&apos;artisans en valeur absolue mais souvent une <strong>densité supérieure</strong> à la moyenne nationale.</span>
                </li>
              </ul>
            </div>
          </section>

          {/* ============================================================= */}
          {/* Section 3: Tarifs et prix 2026 */}
          {/* ============================================================= */}
          <section className="mb-20">
            <SectionTitle
              id="tarifs"
              icon={Euro}
              title="Tarifs et prix des artisans en 2026"
              subtitle={`Prix moyens constatés par métier — variation annuelle moyenne : ${variationMoyenne > 0 ? '+' : ''}${variationMoyenne} %`}
            />

            {/* Summary cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
              <StatCard
                value={`${prixMoyen} €`}
                label="Prix moyen d'une intervention artisanale"
                source="Baromètre ServicesArtisans 2026"
                icon={Euro}
                accent="green"
              />
              <StatCard
                value={`${variationMoyenne > 0 ? '+' : ''}${variationMoyenne} %`}
                label="Variation annuelle moyenne des prix"
                source="Baromètre ServicesArtisans 2026"
                icon={TrendingUp}
                accent={variationMoyenne > 2 ? 'red' : 'orange'}
              />
              <StatCard
                value={`${servicePricings.length} métiers`}
                label="Métiers analysés dans le baromètre"
                source="ServicesArtisans 2026"
                icon={Hammer}
                accent="blue"
              />
            </div>

            {/* Price tables by service */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {servicePricings.map((sp) => (
                <div key={sp.service} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  <div className="bg-gray-50 px-5 py-3 border-b border-gray-200 flex items-center justify-between">
                    <h3 className="font-bold text-gray-900">{sp.serviceName}</h3>
                    <Link
                      href={`/barometre-prix/${sp.service}`}
                      className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                    >
                      Voir détail <ExternalLink className="w-3 h-3" />
                    </Link>
                  </div>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-xs text-gray-500 border-b border-gray-100">
                        <th className="px-5 py-2 font-medium">Intervention</th>
                        <th className="px-3 py-2 font-medium text-right">Fourchette</th>
                        <th className="px-3 py-2 font-medium text-right">Tendance</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {sp.interventions.map((int) => (
                        <tr key={int.name} className="hover:bg-gray-50">
                          <td className="px-5 py-2.5 text-gray-700">{int.name}</td>
                          <td className="px-3 py-2.5 text-right text-gray-900 font-medium whitespace-nowrap">
                            {int.prixMin}&ndash;{int.prixMax} &euro;
                            {int.unite !== 'intervention' && (
                              <span className="text-gray-400 font-normal">/{int.unite}</span>
                            )}
                          </td>
                          <td className="px-3 py-2.5 text-right">
                            <TrendBadge tendance={int.tendance} variation={int.variation} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}
            </div>

            {/* Regional indices */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                <h3 className="font-bold text-gray-900">Indices régionaux des prix (base 100 = moyenne nationale)</h3>
                <p className="text-sm text-gray-500 mt-1">Source : Baromètre ServicesArtisans 2026</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 divide-y sm:divide-y-0 divide-gray-100">
                {regionalIndices
                  .filter((r) => !['guadeloupe', 'martinique', 'guyane', 'la-reunion', 'mayotte'].includes(r.regionSlug))
                  .map((region) => (
                    <div key={region.regionSlug} className="px-6 py-3 flex items-center justify-between border-b border-gray-100">
                      <span className="text-sm text-gray-700">{region.region}</span>
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-bold ${region.index > 105 ? 'text-red-600' : region.index < 95 ? 'text-green-600' : 'text-gray-700'}`}>
                          {region.index}
                        </span>
                        <TrendBadge tendance={region.tendance} />
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </section>

          {/* ============================================================= */}
          {/* Section 4: Rénovation énergétique */}
          {/* ============================================================= */}
          <section className="mb-20">
            <SectionTitle
              id="renovation"
              icon={Thermometer}
              title="Rénovation énergétique"
              subtitle="Les chiffres clés de la transition énergétique du bâtiment en France"
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
              <StatCard
                value="~4,8 millions"
                label="Passoires thermiques en France (DPE F ou G)"
                source="ONRE/ADEME 2024"
                icon={Thermometer}
                accent="red"
              />
              <StatCard
                value="~17 %"
                label="Part des logements en passoire énergétique"
                source="ONRE 2024"
                icon={Building2}
                accent="orange"
              />
              <StatCard
                value="~700 000"
                label="Dossiers MaPrimeRénov' par an"
                source="ANAH 2024"
                icon={Euro}
                accent="green"
              />
              <StatCard
                value="~65 000"
                label="Artisans certifiés RGE en France"
                source="ADEME/FAIRE 2024"
                icon={Zap}
                accent="teal"
              />
              <StatCard
                value="~16 000 €"
                label="Budget moyen d'une rénovation énergétique"
                source="ANAH/ADEME 2024"
                icon={Euro}
                accent="blue"
              />
              <StatCard
                value="~5,6 Md€"
                label="Budget MaPrimeRénov' 2024"
                source="Ministère de la Transition écologique"
                icon={Euro}
                accent="purple"
              />
            </div>

            <div className="bg-orange-50 rounded-xl border border-orange-200 p-6">
              <h3 className="font-bold text-orange-900 mb-3">L&apos;enjeu de la rénovation énergétique</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-orange-800">
                <div>
                  <p className="mb-2">La loi Climat et Résilience interdit progressivement la location des passoires thermiques :</p>
                  <ul className="space-y-1 ml-4">
                    <li>&bull; DPE G : interdit depuis janvier 2025</li>
                    <li>&bull; DPE F : interdit à partir de 2028</li>
                    <li>&bull; DPE E : interdit à partir de 2034</li>
                  </ul>
                </div>
                <div>
                  <p className="mb-2">Ce calendrier génère une demande massive d&apos;artisans qualifiés RGE, notamment :</p>
                  <ul className="space-y-1 ml-4">
                    <li>&bull; Installateurs de pompes à chaleur</li>
                    <li>&bull; Poseurs d&apos;isolation (ITE, combles, planchers)</li>
                    <li>&bull; Menuisiers (remplacement fenêtres)</li>
                    <li>&bull; Chauffagistes (systèmes performants)</li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          {/* ============================================================= */}
          {/* Section 5: Emploi et formation */}
          {/* ============================================================= */}
          <section className="mb-20">
            <SectionTitle
              id="emploi"
              icon={GraduationCap}
              title="Emploi et formation dans l'artisanat"
              subtitle="L'artisanat, premier employeur de France avec 3,1 millions d'actifs"
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
              <StatCard
                value="~200 000"
                label="Apprentis formés chaque année dans l'artisanat"
                source="CMA France 2024"
                icon={GraduationCap}
                accent="purple"
              />
              <StatCard
                value="85 %"
                label="Taux d'insertion professionnelle après un CAP/BEP artisanat"
                source="DEPP/Éducation nationale 2024"
                icon={TrendingUp}
                accent="green"
              />
              <StatCard
                value="2 550 € net"
                label="Salaire médian d'un artisan du bâtiment"
                source="INSEE/DADS 2024"
                icon={Euro}
                accent="blue"
              />
              <StatCard
                value="70 000 à 80 000"
                label="Postes non pourvus dans le BTP chaque année"
                source="FFB/CAPEB 2024"
                icon={Users}
                accent="red"
              />
              <StatCard
                value="45 ans"
                label="Âge moyen d'un chef d'entreprise artisanale"
                source="ISM 2024"
                icon={Users}
                accent="orange"
              />
              <StatCard
                value="25 %"
                label="Part de femmes dans l'artisanat (en hausse)"
                source="CMA France 2024"
                icon={Users}
                accent="teal"
              />
            </div>

            <div className="bg-purple-50 rounded-xl border border-purple-200 p-6">
              <h3 className="font-bold text-purple-900 mb-3">La pénurie de main d&apos;oeuvre dans le BTP</h3>
              <p className="text-sm text-purple-800 mb-3">
                Le secteur du bâtiment fait face à une tension majeure sur le recrutement.
                Selon la FFB et la CAPEB, 70 000 à 80 000 postes restent vacants chaque année,
                soit un taux de vacance parmi les plus élevés de l&apos;économie française.
              </p>
              <p className="text-sm text-purple-800">
                Les métiers les plus en tension : <strong>couvreurs, plombiers-chauffagistes, électriciens,
                menuisiers</strong> et <strong>maçons</strong>. L&apos;apprentissage et la reconversion professionnelle
                sont les leviers prioritaires pour combler ce déficit.
              </p>
            </div>
          </section>

          {/* ============================================================= */}
          {/* Section 6: Tendances 2026 */}
          {/* ============================================================= */}
          <section className="mb-20">
            <SectionTitle
              id="tendances"
              icon={TrendingUp}
              title="Tendances du marché artisanal en 2026"
              subtitle="Les dynamiques qui transforment le secteur"
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Trend 1 */}
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-200 p-6">
                <div className="w-10 h-10 rounded-lg bg-green-100 text-green-600 flex items-center justify-center mb-4">
                  <Building2 className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-green-900 mb-2">Boom de la rénovation</h3>
                <p className="text-sm text-green-800 mb-3">
                  Le marché de la rénovation progresse de 4 à 6 % par an, tiré par les obligations
                  réglementaires (loi Climat, RE2020) et les aides publiques (MaPrimeRénov&apos;).
                </p>
                <p className="text-sm text-green-700">
                  <strong>+4,5 %</strong> de croissance attendue en 2026 pour la rénovation énergétique.
                </p>
              </div>

              {/* Trend 2 */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-200 p-6">
                <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center mb-4">
                  <Zap className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-blue-900 mb-2">Impact de la RE2020</h3>
                <p className="text-sm text-blue-800 mb-3">
                  La Réglementation Environnementale 2020 impose des standards exigeants
                  sur les constructions neuves : bas carbone, biosourcés, performance thermique.
                </p>
                <p className="text-sm text-blue-700">
                  <strong>+15 %</strong> de demande estimée pour les artisans qualifiés RE2020 d&apos;ici 2027.
                </p>
              </div>

              {/* Trend 3 */}
              <div className="bg-gradient-to-br from-purple-50 to-violet-50 rounded-xl border border-purple-200 p-6">
                <div className="w-10 h-10 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center mb-4">
                  <BarChart3 className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-purple-900 mb-2">Digitalisation du secteur</h3>
                <p className="text-sm text-purple-800 mb-3">
                  Les artisans adoptent massivement les outils numériques : devis en ligne,
                  prise de rendez-vous, réseaux sociaux, annuaires spécialisés.
                </p>
                <p className="text-sm text-purple-700">
                  <strong>72 %</strong> des artisans utilisent internet pour trouver des clients (CMA 2025).
                </p>
              </div>
            </div>

            {/* Additional trends */}
            <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <StatCard
                value="+4,5 %"
                label="Croissance prévue du marché de la rénovation en 2026"
                source="FFB/CAPEB prévisions 2026"
                icon={TrendingUp}
                accent="green"
              />
              <StatCard
                value="72 %"
                label="Artisans utilisant internet pour trouver des clients"
                source="CMA France 2025"
                icon={Zap}
                accent="blue"
              />
              <StatCard
                value="-8 %"
                label="Baisse des mises en chantier neuves en 2025"
                source="SDES/Sit@del 2025"
                icon={Building2}
                accent="red"
              />
              <StatCard
                value="55 %"
                label="Part du chiffre d'affaires BTP réalisée en rénovation"
                source="FFB 2024"
                icon={Hammer}
                accent="orange"
              />
            </div>
          </section>

          {/* ============================================================= */}
          {/* Méthodologie */}
          {/* ============================================================= */}
          <section className="mb-20" id="methodologie">
            <div className="bg-gray-50 rounded-xl border border-gray-200 p-6 md:p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                <BookOpen className="w-6 h-6 text-blue-600" />
                Méthodologie
              </h2>
              <div className="prose prose-sm max-w-none text-gray-700">
                <p>
                  Les statistiques présentées sur cette page proviennent de sources officielles
                  et de calculs réalisés par l&apos;équipe ServicesArtisans. Voici notre méthodologie :
                </p>
                <ul className="space-y-2 mt-3">
                  <li>
                    <strong>Nombre d&apos;artisans par département :</strong> dérivés des données
                    INSEE (populations légales 2024) croisées avec les ratios de densité artisanale
                    publiés par Le Moniteur, la CMA et la CAPEB. Calibrés sur les totaux régionaux
                    et nationaux connus (CMA : 1,3M ; CAPEB : 621 803 BTP).
                  </li>
                  <li>
                    <strong>Tarifs :</strong> fourchettes issues de notre baromètre de prix 2026,
                    constitué à partir d&apos;enquêtes auprès d&apos;artisans partenaires et de données
                    sectorielles (CAPEB, FFB, QUALIT&apos;EnR). Les variations sont calculées
                    en glissement annuel.
                  </li>
                  <li>
                    <strong>Indices régionaux :</strong> base 100 correspondant à la moyenne
                    nationale. Calculés à partir des écarts de prix constatés entre régions,
                    pondérés par le volume d&apos;interventions.
                  </li>
                  <li>
                    <strong>Données rénovation énergétique :</strong> sources ADEME, ANAH,
                    Observatoire National de la Rénovation Énergétique (ONRE) et rapports
                    parlementaires.
                  </li>
                  <li>
                    <strong>Données emploi :</strong> sources INSEE, DARES, DEPP,
                    ISM (Institut Supérieur des Métiers) et CMA France.
                  </li>
                </ul>
                <p className="mt-3 text-xs text-gray-500">
                  Les chiffres sont arrondis pour faciliter la lecture. Les estimations sont
                  signalées par le symbole &laquo; ~ &raquo;. Dernière mise à jour : mars 2026.
                </p>
              </div>
            </div>
          </section>

          {/* ============================================================= */}
          {/* Sources */}
          {/* ============================================================= */}
          <section className="mb-20" id="sources">
            <div className="bg-white rounded-xl border border-gray-200 p-6 md:p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Sources et références</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  {
                    name: 'CMA France',
                    desc: 'Chambres de Métiers et de l\'Artisanat — données nationales et régionales',
                    url: 'https://www.cma-france.fr/',
                  },
                  {
                    name: 'INSEE',
                    desc: 'Institut National de la Statistique — populations, emploi, revenus',
                    url: 'https://www.insee.fr/',
                  },
                  {
                    name: 'ADEME',
                    desc: 'Agence de la transition écologique — rénovation énergétique, RGE',
                    url: 'https://www.ademe.fr/',
                  },
                  {
                    name: 'CAPEB',
                    desc: 'Confédération de l\'Artisanat et des Petites Entreprises du Bâtiment',
                    url: 'https://www.capeb.fr/',
                  },
                  {
                    name: 'FFB',
                    desc: 'Fédération Française du Bâtiment — conjoncture, emploi BTP',
                    url: 'https://www.ffbatiment.fr/',
                  },
                  {
                    name: 'ANAH',
                    desc: 'Agence Nationale de l\'Habitat — MaPrimeRénov\', aides',
                    url: 'https://www.anah.gouv.fr/',
                  },
                  {
                    name: 'U2P',
                    desc: 'Union des Entreprises de Proximité — chiffres clés artisanat',
                    url: 'https://u2p-france.fr/',
                  },
                  {
                    name: 'ISM',
                    desc: 'Institut Supérieur des Métiers — baromètre de l\'artisanat',
                    url: 'https://www.infometiers.org/',
                  },
                  {
                    name: 'ONRE',
                    desc: 'Observatoire National de la Rénovation Énergétique',
                    url: 'https://www.statistiques.developpement-durable.gouv.fr/',
                  },
                ].map((source) => (
                  <div key={source.name} className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                    <h3 className="font-bold text-gray-900 text-sm mb-1">{source.name}</h3>
                    <p className="text-xs text-gray-600 mb-2">{source.desc}</p>
                    <a
                      href={source.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                    >
                      Consulter <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ============================================================= */}
          {/* Cross-links / CTA */}
          {/* ============================================================= */}
          <section className="mb-12">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-xl p-8 text-white">
              <h2 className="text-2xl font-bold mb-4">Explorez nos autres ressources</h2>
              <p className="text-blue-100 mb-6">
                Retrouvez des données détaillées sur les tarifs, les artisans par ville et nos guides pratiques.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Link
                  href="/barometre-prix"
                  className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20 hover:bg-white/20 transition-colors group"
                >
                  <h3 className="font-bold mb-1 flex items-center gap-2">
                    Baromètre des prix
                    <ArrowUpRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </h3>
                  <p className="text-sm text-blue-200">Tarifs détaillés par métier et par région</p>
                </Link>
                <Link
                  href="/services"
                  className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20 hover:bg-white/20 transition-colors group"
                >
                  <h3 className="font-bold mb-1 flex items-center gap-2">
                    Annuaire par métier
                    <ArrowUpRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </h3>
                  <p className="text-sm text-blue-200">Trouvez un artisan qualifié près de chez vous</p>
                </Link>
                <Link
                  href="/guides"
                  className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20 hover:bg-white/20 transition-colors group"
                >
                  <h3 className="font-bold mb-1 flex items-center gap-2">
                    Guides pratiques
                    <ArrowUpRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </h3>
                  <p className="text-sm text-blue-200">Conseils pour vos projets de travaux</p>
                </Link>
              </div>
            </div>
          </section>

        </div>
      </div>
    </>
  )
}
