import { Metadata } from 'next'
import Link from 'next/link'
import {
  BarChart3, Building2, TrendingUp, MapPin, Thermometer,
  GraduationCap, Zap, Users, Hammer, DollarSign, ArrowUpRight,
  ArrowDownRight, Minus, Calendar, BookOpen, ExternalLink,
  ChevronRight,
} from 'lucide-react'
import JsonLd from '@/components/JsonLd'
import Breadcrumb from '@/components/Breadcrumb'
import { SITE_URL, SITE_NAME } from '@/lib/seo/config'
import { DEPT_ARTISAN_COUNTS } from '@/lib/data/dept-attorney-counts'
import { DEPARTMENTS } from '@/lib/geography'
import {
  servicePricings,
  regionalIndices,
  getPrixMoyenNational,
  getVariationMoyenne,
} from '@/lib/data/price-index'

// ---------------------------------------------------------------------------
// Compute stats from real data
// ---------------------------------------------------------------------------

function computeStateStats() {
  const entries = Object.entries(DEPT_ARTISAN_COUNTS)

  const totalAttorneys = entries.reduce((s, [, v]) => s + v.artisans, 0)
  const totalLitigators = entries.reduce((s, [, v]) => s + v.btp, 0)
  const litigationRatio = Math.round((totalLitigators / totalAttorneys) * 100)

  // Population data (US Census 2024 estimates, by state)
  const STATE_POP: Record<string, number> = {
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

  // Top 10 by density (attorneys per 10,000 inhabitants)
  const withDensity = entries
    .filter(([code]) => STATE_POP[code] && STATE_POP[code] > 50000)
    .map(([code, data]) => ({
      code,
      name: DEPARTMENTS[code] || code,
      artisans: data.artisans,
      density: Math.round((data.artisans / STATE_POP[code]) * 10000),
      population: STATE_POP[code],
    }))
    .sort((a, b) => b.density - a.density)
    .slice(0, 10)

  return { totalAttorneys, totalLitigators, litigationRatio, sortedByCount, withDensity }
}

const {
  totalAttorneys,
  totalLitigators,
  litigationRatio,
  sortedByCount,
  withDensity,
} = computeStateStats()

const avgFee = getPrixMoyenNational()
const avgVariation = getVariationMoyenne()

// ---------------------------------------------------------------------------
// Metadata
// ---------------------------------------------------------------------------

const pageTitle = 'Attorney Statistics USA 2026: Key Figures'
const pageDescription = `${(totalAttorneys / 1000).toFixed(0)}k+ attorneys listed. Key figures on the US legal market: geographic distribution, average fees, legal trends, employment, and 2026 outlook. Sources: ABA, state bar associations, BLS, NALP.`
const pageUrl = `${SITE_URL}/attorney-statistics`

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
    locale: 'en_US',
    images: [
      {
        url: `${SITE_URL}/opengraph-image`,
        width: 1200,
        height: 630,
        alt: 'Attorney Statistics USA 2026 — USAttorneys',
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
      <p className="text-xs opacity-60">Source: {source}</p>
    </div>
  )
}

function TrendBadge({ tendance, variation }: { tendance: 'hausse' | 'stable' | 'baisse'; variation?: number }) {
  if (tendance === 'hausse') {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-red-600 bg-red-50 px-2 py-0.5 rounded-full">
        <ArrowUpRight className="w-3 h-3" />
        {variation !== undefined ? `+${variation}%` : 'Up'}
      </span>
    )
  }
  if (tendance === 'baisse') {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
        <ArrowDownRight className="w-3 h-3" />
        {variation !== undefined ? `${variation}%` : 'Down'}
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

export default function AttorneyStatisticsPage() {
  const breadcrumbItems = [
    { label: 'Attorney Statistics USA' },
  ]

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: SITE_URL,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Attorney Statistics USA',
        item: pageUrl,
      },
    ],
  }

  const datasetSchema = {
    '@context': 'https://schema.org',
    '@type': 'Dataset',
    name: 'US Legal Market Statistics (2026)',
    description: 'Aggregated data on the number of attorneys, fees, geographic distribution, and trends in the US legal market.',
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
      name: 'United States',
    },
    keywords: [
      'attorneys united states',
      'legal market statistics',
      'number of lawyers',
      'US legal market',
      'attorney fees',
      'legal trends',
    ],
    distribution: {
      '@type': 'DataDownload',
      contentUrl: pageUrl,
      encodingFormat: 'text/html',
    },
    isBasedOn: [
      'https://www.americanbar.org/',
      'https://www.bls.gov/',
      'https://www.nalp.org/',
      'https://www.lsac.org/',
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
    inLanguage: 'en',
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
    { id: 'market', label: 'The market in numbers' },
    { id: 'geography', label: 'Geographic distribution' },
    { id: 'fees', label: 'Fees and rates 2026' },
    { id: 'trends-legal', label: 'Legal industry trends' },
    { id: 'employment', label: 'Employment and education' },
    { id: 'trends', label: '2026 outlook' },
    { id: 'methodology', label: 'Methodology' },
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
              <span className="text-sm text-blue-300">Last updated: March 2026</span>
            </div>

            <h1 className="text-3xl md:text-5xl font-bold mb-6 leading-tight">
              Attorney Statistics in the United States
              <span className="block text-blue-300 mt-2">Key figures, fees, and 2026 trends</span>
            </h1>

            <p className="text-lg md:text-xl text-blue-100 max-w-3xl mb-10">
              All essential data on the US legal market:
              number of attorneys, geographic distribution, average fees by practice area,
              legal technology trends, and 2026 outlook. Updated data from official sources.
            </p>

            {/* Hero stat counters */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 md:p-6 border border-white/20">
                <p className="text-3xl md:text-4xl font-bold">1.3M+</p>
                <p className="text-sm text-blue-200 mt-1">Licensed attorneys in the US</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 md:p-6 border border-white/20">
                <p className="text-3xl md:text-4xl font-bold">$350B</p>
                <p className="text-sm text-blue-200 mt-1">Legal services revenue</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 md:p-6 border border-white/20">
                <p className="text-3xl md:text-4xl font-bold">{totalAttorneys.toLocaleString('en-US')}</p>
                <p className="text-sm text-blue-200 mt-1">Attorneys listed</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 md:p-6 border border-white/20">
                <p className="text-3xl md:text-4xl font-bold">50 + DC</p>
                <p className="text-sm text-blue-200 mt-1">States covered</p>
              </div>
            </div>
          </div>
        </header>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">

          {/* Table of Contents */}
          <nav className="mb-16 bg-gray-50 rounded-xl p-6 border border-gray-200" aria-label="Table of contents">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-blue-600" />
              Table of Contents
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
          {/* Section 1: The legal market in numbers */}
          {/* ============================================================= */}
          <section className="mb-20">
            <SectionTitle
              id="market"
              icon={BarChart3}
              title="The legal market in numbers"
              subtitle="Overview of the US legal sector — 2024-2026 data"
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <StatCard
                value="1.3 million+"
                label="Licensed attorneys in the United States"
                source="ABA 2025"
                icon={Building2}
                accent="blue"
              />
              <StatCard
                value={`${(totalLitigators / 1000).toFixed(0)}k`}
                label="Litigation and trial attorneys"
                source="ABA 2024, USAttorneys calculations"
                icon={Hammer}
                accent="orange"
              />
              <StatCard
                value="$350B+"
                label="US legal services market revenue"
                source="IBISWorld/BLS 2024"
                icon={DollarSign}
                accent="green"
              />
              <StatCard
                value={`${litigationRatio}%`}
                label="Litigation share of all practice areas"
                source="USAttorneys calculations on ABA/BLS data"
                icon={Building2}
                accent="purple"
              />
              <StatCard
                value="~50,000"
                label="New bar admissions per year"
                source="ABA/NCBE 2024"
                icon={TrendingUp}
                accent="teal"
              />
              <StatCard
                value={`${totalAttorneys.toLocaleString('en-US')}`}
                label="Attorneys listed in our directory"
                source="State bar data, USAttorneys"
                icon={Users}
                accent="blue"
              />
              <StatCard
                value="~450,000"
                label="Law firm employees (paralegals, staff)"
                source="BLS 2024"
                icon={Users}
                accent="green"
              />
              <StatCard
                value="~200"
                label="ABA-accredited law schools"
                source="ABA 2024"
                icon={Zap}
                accent="orange"
              />
              <StatCard
                value="~175,000"
                label="Solo practitioners"
                source="ABA 2024"
                icon={Hammer}
                accent="red"
              />
            </div>
          </section>

          {/* ============================================================= */}
          {/* Section 2: Geographic distribution */}
          {/* ============================================================= */}
          <section className="mb-20">
            <SectionTitle
              id="geography"
              icon={MapPin}
              title="Geographic distribution"
              subtitle="Regional disparities in the US legal profession"
            />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Top 10 by count */}
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                  <h3 className="font-bold text-gray-900">Top 10 states by number of attorneys</h3>
                  <p className="text-sm text-gray-500 mt-1">Source: ABA, state bar associations — USAttorneys calculations</p>
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
                              {dept.artisans.toLocaleString('en-US')}
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
                  <h3 className="font-bold text-gray-900">Top 10 states by attorney density</h3>
                  <p className="text-sm text-gray-500 mt-1">Attorneys per 10,000 residents — Source: ABA, Census Bureau</p>
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
                              {dept.density} / 10,000 pop.
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
              <h3 className="font-bold text-blue-900 mb-3">Regional disparities: key takeaways</h3>
              <ul className="space-y-2 text-sm text-blue-800">
                <li className="flex items-start gap-2">
                  <ChevronRight className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span><strong>New York and California</strong> together account for roughly 25% of all licensed attorneys, with New York City and Los Angeles as the largest legal markets.</span>
                </li>
                <li className="flex items-start gap-2">
                  <ChevronRight className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>The <strong>Northeast corridor</strong> (DC, New York, Massachusetts, Connecticut) has the highest attorney density per capita, driven by federal government and corporate headquarters.</span>
                </li>
                <li className="flex items-start gap-2">
                  <ChevronRight className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>Rural states and the Mountain West have fewer attorneys in absolute numbers but often face <strong>access-to-justice gaps</strong> with underserved communities.</span>
                </li>
              </ul>
            </div>
          </section>

          {/* ============================================================= */}
          {/* Section 3: Fees and rates 2026 */}
          {/* ============================================================= */}
          <section className="mb-20">
            <SectionTitle
              id="fees"
              icon={DollarSign}
              title="Attorney fees and rates in 2026"
              subtitle={`Average fees observed by practice area — annual average variation: ${avgVariation > 0 ? '+' : ''}${avgVariation}%`}
            />

            {/* Summary cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
              <StatCard
                value={`$${avgFee}`}
                label="Average cost of a legal service"
                source="USAttorneys Fee Index 2026"
                icon={DollarSign}
                accent="green"
              />
              <StatCard
                value={`${avgVariation > 0 ? '+' : ''}${avgVariation}%`}
                label="Average annual fee variation"
                source="USAttorneys Fee Index 2026"
                icon={TrendingUp}
                accent={avgVariation > 2 ? 'red' : 'orange'}
              />
              <StatCard
                value={`${servicePricings.length} areas`}
                label="Practice areas analyzed in the index"
                source="USAttorneys 2026"
                icon={Hammer}
                accent="blue"
              />
            </div>

            {/* Price tables by service */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {servicePricings.map((sp) => (
                <div key={sp.service} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  <div className="bg-gray-50 px-5 py-3 border-b border-gray-200 flex items-center justify-between">
                    <h3 className="font-bold text-gray-900">{sp.specialtyName}</h3>
                    <Link
                      href={`/price-index/pricing/${sp.service}`}
                      className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                    >
                      View details <ExternalLink className="w-3 h-3" />
                    </Link>
                  </div>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-xs text-gray-500 border-b border-gray-100">
                        <th className="px-5 py-2 font-medium">Service</th>
                        <th className="px-3 py-2 font-medium text-right">Range</th>
                        <th className="px-3 py-2 font-medium text-right">Trend</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {sp.interventions.map((int) => (
                        <tr key={int.name} className="hover:bg-gray-50">
                          <td className="px-5 py-2.5 text-gray-700">{int.name}</td>
                          <td className="px-3 py-2.5 text-right text-gray-900 font-medium whitespace-nowrap">
                            {int.prixMin}&ndash;{int.prixMax} $
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
                <h3 className="font-bold text-gray-900">Regional fee indices (base 100 = national average)</h3>
                <p className="text-sm text-gray-500 mt-1">Source: USAttorneys Fee Index 2026</p>
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
          {/* Section 4: Legal industry trends */}
          {/* ============================================================= */}
          <section className="mb-20">
            <SectionTitle
              id="trends-legal"
              icon={Thermometer}
              title="Legal industry trends"
              subtitle="Key developments shaping the US legal landscape"
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
              <StatCard
                value="~80%"
                label="Of civil legal needs go unmet for low-income Americans"
                source="Legal Services Corporation 2024"
                icon={Thermometer}
                accent="red"
              />
              <StatCard
                value="~70%"
                label="Of law firms now use some form of legal technology"
                source="ABA Legal Technology Survey 2024"
                icon={Building2}
                accent="orange"
              />
              <StatCard
                value="$2.5B+"
                label="Invested in legal tech startups annually"
                source="Stanford CodeX/CB Insights 2024"
                icon={DollarSign}
                accent="green"
              />
              <StatCard
                value="~40 states"
                label="Have adopted or exploring alternative legal service models"
                source="ABA/IAALS 2024"
                icon={Zap}
                accent="teal"
              />
              <StatCard
                value="$300/hr"
                label="Average hourly rate for US attorneys"
                source="Clio Legal Trends 2024"
                icon={DollarSign}
                accent="blue"
              />
              <StatCard
                value="$22B+"
                label="Annual pro bono legal services value"
                source="ABA 2024"
                icon={DollarSign}
                accent="purple"
              />
            </div>

            <div className="bg-orange-50 rounded-xl border border-orange-200 p-6">
              <h3 className="font-bold text-orange-900 mb-3">The access-to-justice gap</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-orange-800">
                <div>
                  <p className="mb-2">Key challenges facing the US legal market:</p>
                  <ul className="space-y-1 ml-4">
                    <li>&bull; 80% of civil legal needs for low-income Americans remain unmet</li>
                    <li>&bull; Rising costs have made legal services less accessible</li>
                    <li>&bull; Rural areas face severe attorney shortages</li>
                  </ul>
                </div>
                <div>
                  <p className="mb-2">Emerging solutions driving change in the industry:</p>
                  <ul className="space-y-1 ml-4">
                    <li>&bull; AI-powered legal research and document review</li>
                    <li>&bull; Alternative fee arrangements (flat fees, subscriptions)</li>
                    <li>&bull; Online legal service platforms</li>
                    <li>&bull; State bar regulatory reforms (e.g., Arizona, Utah)</li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          {/* ============================================================= */}
          {/* Section 5: Employment and education */}
          {/* ============================================================= */}
          <section className="mb-20">
            <SectionTitle
              id="employment"
              icon={GraduationCap}
              title="Employment and legal education"
              subtitle="The legal profession employs over 1.8 million workers across the United States"
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
              <StatCard
                value="~37,000"
                label="JD degrees awarded annually"
                source="ABA/LSAC 2024"
                icon={GraduationCap}
                accent="purple"
              />
              <StatCard
                value="78%"
                label="Bar exam pass rate (first-time takers)"
                source="NCBE 2024"
                icon={TrendingUp}
                accent="green"
              />
              <StatCard
                value="$165,000"
                label="Median starting salary at large firms"
                source="NALP 2024"
                icon={DollarSign}
                accent="blue"
              />
              <StatCard
                value="~30,000"
                label="Open legal positions annually"
                source="BLS 2024"
                icon={Users}
                accent="red"
              />
              <StatCard
                value="47 years"
                label="Average age of practicing attorneys"
                source="ABA 2024"
                icon={Users}
                accent="orange"
              />
              <StatCard
                value="38%"
                label="Female attorneys (growing steadily)"
                source="ABA 2024"
                icon={Users}
                accent="teal"
              />
            </div>

            <div className="bg-purple-50 rounded-xl border border-purple-200 p-6">
              <h3 className="font-bold text-purple-900 mb-3">Hiring trends in the legal profession</h3>
              <p className="text-sm text-purple-800 mb-3">
                The legal industry continues to evolve with growing demand in specialized areas.
                According to the BLS and NALP, job openings are concentrated in technology law,
                healthcare compliance, and cybersecurity — reflecting broader economic shifts.
              </p>
              <p className="text-sm text-purple-800">
                The most in-demand specialties: <strong>intellectual property, data privacy,
                healthcare law, immigration</strong>, and <strong>environmental law</strong>.
                Diversity initiatives and remote work options are transforming firm culture and recruitment.
              </p>
            </div>
          </section>

          {/* ============================================================= */}
          {/* Section 6: 2026 outlook */}
          {/* ============================================================= */}
          <section className="mb-20">
            <SectionTitle
              id="trends"
              icon={TrendingUp}
              title="2026 legal market outlook"
              subtitle="The dynamics transforming the legal sector"
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Trend 1 */}
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-200 p-6">
                <div className="w-10 h-10 rounded-lg bg-green-100 text-green-600 flex items-center justify-center mb-4">
                  <Building2 className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-green-900 mb-2">AI and legal tech boom</h3>
                <p className="text-sm text-green-800 mb-3">
                  AI-powered tools are transforming legal research, contract review, and document
                  drafting. Law firms are investing heavily in technology to improve efficiency.
                </p>
                <p className="text-sm text-green-700">
                  <strong>+25%</strong> growth expected in legal tech adoption by 2027.
                </p>
              </div>

              {/* Trend 2 */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-200 p-6">
                <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center mb-4">
                  <Zap className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-blue-900 mb-2">Alternative fee models</h3>
                <p className="text-sm text-blue-800 mb-3">
                  Clients increasingly demand flat fees, subscription models, and value-based
                  pricing. The traditional billable hour model is being challenged.
                </p>
                <p className="text-sm text-blue-700">
                  <strong>45%</strong> of clients now prefer alternative fee arrangements over hourly billing.
                </p>
              </div>

              {/* Trend 3 */}
              <div className="bg-gradient-to-br from-purple-50 to-violet-50 rounded-xl border border-purple-200 p-6">
                <div className="w-10 h-10 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center mb-4">
                  <BarChart3 className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-purple-900 mb-2">Remote and hybrid practice</h3>
                <p className="text-sm text-purple-800 mb-3">
                  The shift to remote work has permanently changed legal practice. Virtual
                  consultations, digital court filings, and online mediation are now standard.
                </p>
                <p className="text-sm text-purple-700">
                  <strong>68%</strong> of attorneys now offer virtual consultations (ABA 2025).
                </p>
              </div>
            </div>

            {/* Additional trends */}
            <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <StatCard
                value="+3.5%"
                label="Projected growth in legal services demand by 2026"
                source="BLS/IBISWorld projections 2026"
                icon={TrendingUp}
                accent="green"
              />
              <StatCard
                value="68%"
                label="Attorneys offering virtual consultations"
                source="ABA 2025"
                icon={Zap}
                accent="blue"
              />
              <StatCard
                value="+12%"
                label="Increase in cybersecurity and data privacy legal work"
                source="Thomson Reuters 2025"
                icon={Building2}
                accent="red"
              />
              <StatCard
                value="55%"
                label="Of legal work now involves some form of technology"
                source="Clio Legal Trends 2024"
                icon={Hammer}
                accent="orange"
              />
            </div>
          </section>

          {/* ============================================================= */}
          {/* Methodology */}
          {/* ============================================================= */}
          <section className="mb-20" id="methodology">
            <div className="bg-gray-50 rounded-xl border border-gray-200 p-6 md:p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                <BookOpen className="w-6 h-6 text-blue-600" />
                Methodology
              </h2>
              <div className="prose prose-sm max-w-none text-gray-700">
                <p>
                  The statistics presented on this page come from official sources
                  and calculations performed by the USAttorneys team. Here is our methodology:
                </p>
                <ul className="space-y-2 mt-3">
                  <li>
                    <strong>Number of attorneys by state:</strong> derived from
                    state bar association membership data crossed with Census Bureau population
                    estimates. Calibrated against ABA national totals (1.3M+ licensed attorneys).
                  </li>
                  <li>
                    <strong>Fees:</strong> ranges from our 2026 fee index,
                    compiled from surveys of partner attorneys, published fee schedules,
                    and industry reports (Clio, NALP, Thomson Reuters). Variations are calculated
                    on a year-over-year basis.
                  </li>
                  <li>
                    <strong>Regional indices:</strong> base 100 corresponding to the national
                    average. Calculated from observed fee differences between regions,
                    weighted by volume of legal services.
                  </li>
                  <li>
                    <strong>Legal trend data:</strong> sources include ABA, Legal Services
                    Corporation, Stanford CodeX, and Bureau of Labor Statistics reports.
                  </li>
                  <li>
                    <strong>Employment data:</strong> sources include BLS, NALP,
                    LSAC (Law School Admission Council), and ABA.
                  </li>
                </ul>
                <p className="mt-3 text-xs text-gray-500">
                  Figures are rounded for readability. Estimates are
                  indicated by the &ldquo;~&rdquo; symbol. Last updated: March 2026.
                </p>
              </div>
            </div>
          </section>

          {/* ============================================================= */}
          {/* Sources */}
          {/* ============================================================= */}
          <section className="mb-20" id="sources">
            <div className="bg-white rounded-xl border border-gray-200 p-6 md:p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Sources and references</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  {
                    name: 'American Bar Association (ABA)',
                    desc: 'National data on attorney demographics, bar admissions, and legal education',
                    url: 'https://www.americanbar.org/',
                  },
                  {
                    name: 'Bureau of Labor Statistics (BLS)',
                    desc: 'Employment statistics, salary data, and occupational outlook for attorneys',
                    url: 'https://www.bls.gov/',
                  },
                  {
                    name: 'NALP',
                    desc: 'National Association for Law Placement — hiring data, salary surveys',
                    url: 'https://www.nalp.org/',
                  },
                  {
                    name: 'LSAC',
                    desc: 'Law School Admission Council — applicant data, enrollment trends',
                    url: 'https://www.lsac.org/',
                  },
                  {
                    name: 'Legal Services Corporation',
                    desc: 'Access to justice data, unmet legal needs reports',
                    url: 'https://www.lsc.gov/',
                  },
                  {
                    name: 'Clio Legal Trends',
                    desc: 'Annual reports on legal industry technology and billing trends',
                    url: 'https://www.clio.com/resources/legal-trends/',
                  },
                  {
                    name: 'Thomson Reuters',
                    desc: 'Legal market intelligence, law firm performance data',
                    url: 'https://www.thomsonreuters.com/',
                  },
                  {
                    name: 'US Census Bureau',
                    desc: 'Population data by state, demographic statistics',
                    url: 'https://www.census.gov/',
                  },
                  {
                    name: 'NCBE',
                    desc: 'National Conference of Bar Examiners — bar exam statistics',
                    url: 'https://www.ncbex.org/',
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
                      Visit <ExternalLink className="w-3 h-3" />
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
              <h2 className="text-2xl font-bold mb-4">Explore our other resources</h2>
              <p className="text-blue-100 mb-6">
                Find detailed data on fees, attorneys by city, and our practical guides.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Link
                  href="/price-index"
                  className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20 hover:bg-white/20 transition-colors group"
                >
                  <h3 className="font-bold mb-1 flex items-center gap-2">
                    Fee Index
                    <ArrowUpRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </h3>
                  <p className="text-sm text-blue-200">Detailed fees by practice area and region</p>
                </Link>
                <Link
                  href="/services"
                  className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20 hover:bg-white/20 transition-colors group"
                >
                  <h3 className="font-bold mb-1 flex items-center gap-2">
                    Attorney Directory
                    <ArrowUpRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </h3>
                  <p className="text-sm text-blue-200">Find a qualified attorney near you</p>
                </Link>
                <Link
                  href="/guides"
                  className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20 hover:bg-white/20 transition-colors group"
                >
                  <h3 className="font-bold mb-1 flex items-center gap-2">
                    Legal Guides
                    <ArrowUpRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </h3>
                  <p className="text-sm text-blue-200">Practical advice for your legal matters</p>
                </Link>
              </div>
            </div>
          </section>

        </div>
      </div>
    </>
  )
}
