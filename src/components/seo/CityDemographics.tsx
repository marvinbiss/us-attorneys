/**
 * CityDemographics — displays census demographic data for a city.
 *
 * Works with or without census_data from DB. When census data is unavailable,
 * it generates content from just city name, state, and population (static data).
 * SEO value: unique, data-driven content connecting demographics to legal needs.
 */

import { Users, DollarSign, GraduationCap, Home, BarChart3, Scale } from 'lucide-react'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface CensusData {
  median_household_income?: number | null
  unemployment_rate?: number | null
  median_age?: number | null
  population?: number | null
  spanish_speakers?: number | null
  // Extended fields (if added later)
  poverty_rate?: number | null
  total_households?: number | null
  owner_occupied_pct?: number | null
  bachelor_degree_pct?: number | null
}

interface CityDemographicsProps {
  cityName: string
  stateCode: string
  stateName: string
  /** Population string from static data (e.g. "8,336,817") */
  population?: string
  /** Census data JSONB from locations_us table */
  censusData?: CensusData | null
  /** Optional: specialty context for tailored legal market commentary */
  specialtyName?: string
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatNumber(n: number): string {
  return n.toLocaleString('en-US')
}

function formatCurrency(n: number): string {
  return '$' + n.toLocaleString('en-US')
}

function formatPct(n: number): string {
  return n.toFixed(1) + '%'
}

/** Parse population string "8,336,817" to number */
function parsePopulation(pop?: string): number {
  if (!pop) return 0
  return parseInt(pop.replace(/,/g, ''), 10) || 0
}

/** Classify city market size from population */
function getMarketSize(pop: number): string {
  if (pop >= 1_000_000) return 'major metropolitan'
  if (pop >= 250_000) return 'large urban'
  if (pop >= 100_000) return 'mid-size'
  if (pop >= 25_000) return 'small city'
  return 'small community'
}

/** Generate legal market insights from demographics */
function getLegalInsights(
  cityName: string,
  stateName: string,
  pop: number,
  census: CensusData | null | undefined,
  specialtyName?: string,
): string[] {
  const insights: string[] = []
  const market = getMarketSize(pop)
  const income = census?.median_household_income

  // Population-based insight
  if (pop >= 500_000) {
    insights.push(
      `As a ${market} area with ${formatNumber(pop)} residents, ${cityName} has a highly competitive legal market with attorneys specializing across all practice areas.`
    )
  } else if (pop >= 100_000) {
    insights.push(
      `${cityName} is a ${market} market with ${formatNumber(pop)} residents, supporting a diverse range of legal practices from family law to business litigation.`
    )
  } else if (pop >= 25_000) {
    insights.push(
      `With a population of ${formatNumber(pop)}, ${cityName} is a ${market} legal market where many attorneys handle multiple practice areas to serve the community.`
    )
  } else if (pop > 0) {
    insights.push(
      `${cityName} is a ${market} with ${formatNumber(pop)} residents. Residents often seek attorneys in nearby larger cities, though local practitioners offer personalized service.`
    )
  }

  // Income-based insight
  if (income) {
    if (income >= 90_000) {
      insights.push(
        `The median household income of ${formatCurrency(income)} indicates strong demand for corporate law, estate planning, real estate transactions, and wealth management legal services.`
      )
    } else if (income >= 60_000) {
      insights.push(
        `With a median household income of ${formatCurrency(income)}, ${cityName} residents commonly seek attorneys for family law, real estate closings, and employment matters.`
      )
    } else {
      insights.push(
        `A median household income of ${formatCurrency(income)} suggests significant demand for pro bono services, legal aid clinics, and affordable legal representation in ${cityName}.`
      )
    }
  }

  // Unemployment insight
  if (census?.unemployment_rate != null && census.unemployment_rate > 0) {
    if (census.unemployment_rate >= 6) {
      insights.push(
        `The ${formatPct(census.unemployment_rate)} unemployment rate drives demand for employment law, workers' compensation, and disability benefits attorneys in ${stateName}.`
      )
    } else {
      insights.push(
        `A ${formatPct(census.unemployment_rate)} unemployment rate reflects a stable job market, with legal needs focused on employment contracts, business formation, and commercial litigation.`
      )
    }
  }

  // Specialty-specific insight
  if (specialtyName && pop > 0) {
    insights.push(
      `For ${specialtyName.toLowerCase()} matters, ${cityName} residents benefit from ${market === 'major metropolitan' || market === 'large urban' ? 'a large pool of specialized attorneys' : 'dedicated practitioners who understand local ${stateName} courts and regulations'}.`
    )
  }

  return insights
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function CityDemographics({
  cityName,
  stateCode,
  stateName,
  population,
  censusData,
  specialtyName,
}: CityDemographicsProps) {
  const pop = censusData?.population ?? parsePopulation(population)
  const hasCensus = !!(censusData && (censusData.median_household_income || censusData.median_age || censusData.unemployment_rate))

  // Don't render anything if we have no data at all
  if (pop === 0 && !hasCensus) return null

  const insights = getLegalInsights(cityName, stateName, pop, censusData, specialtyName)

  // Build stat cards
  const stats: { label: string; value: string; icon: React.ReactNode; subtitle?: string }[] = []

  if (pop > 0) {
    stats.push({
      label: 'Population',
      value: formatNumber(pop),
      icon: <Users className="w-5 h-5 text-blue-500" />,
      subtitle: getMarketSize(pop),
    })
  }

  if (censusData?.median_household_income) {
    stats.push({
      label: 'Median Income',
      value: formatCurrency(censusData.median_household_income),
      icon: <DollarSign className="w-5 h-5 text-emerald-500" />,
      subtitle: 'household',
    })
  }

  if (censusData?.median_age) {
    stats.push({
      label: 'Median Age',
      value: censusData.median_age.toFixed(1),
      icon: <BarChart3 className="w-5 h-5 text-violet-500" />,
      subtitle: 'years',
    })
  }

  if (censusData?.unemployment_rate != null && censusData.unemployment_rate > 0) {
    stats.push({
      label: 'Unemployment',
      value: formatPct(censusData.unemployment_rate),
      icon: <Scale className="w-5 h-5 text-amber-500" />,
      subtitle: 'rate',
    })
  }

  if (censusData?.owner_occupied_pct) {
    stats.push({
      label: 'Homeownership',
      value: formatPct(censusData.owner_occupied_pct),
      icon: <Home className="w-5 h-5 text-teal-500" />,
      subtitle: 'owner-occupied',
    })
  }

  if (censusData?.bachelor_degree_pct) {
    stats.push({
      label: 'College Educated',
      value: formatPct(censusData.bachelor_degree_pct),
      icon: <GraduationCap className="w-5 h-5 text-indigo-500" />,
      subtitle: "bachelor's+",
    })
  }

  return (
    <section className="py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Heading */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
            <BarChart3 className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h2 className="font-heading text-2xl font-bold text-slate-900 tracking-tight">
              Legal Market Overview in {cityName}, {stateName}
            </h2>
            <p className="text-sm text-slate-500">
              {hasCensus ? 'U.S. Census Bureau ACS data' : `${stateCode} demographic profile`}
            </p>
          </div>
        </div>

        {/* Stats Grid */}
        {stats.length > 0 && (
          <div className={`grid grid-cols-2 ${stats.length >= 3 ? 'lg:grid-cols-3' : ''} gap-4 mb-6`}>
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="bg-white rounded-xl border border-gray-200 p-5"
              >
                <div className="flex items-center gap-2 mb-2">
                  {stat.icon}
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    {stat.label}
                  </span>
                </div>
                <p className="text-xl font-bold text-slate-900">{stat.value}</p>
                {stat.subtitle && (
                  <p className="text-xs text-slate-400 mt-0.5">{stat.subtitle}</p>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Legal Market Insights */}
        {insights.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="font-semibold text-slate-900 mb-3">
              {specialtyName
                ? `${specialtyName} Market in ${cityName}`
                : `Legal Services Demand in ${cityName}`}
            </h3>
            <div className="space-y-3">
              {insights.map((insight, i) => (
                <p key={i} className="text-sm text-slate-600 leading-relaxed">
                  {insight}
                </p>
              ))}
            </div>
            {hasCensus && (
              <p className="text-xs text-slate-400 mt-4">
                Source: U.S. Census Bureau, American Community Survey (ACS) 5-Year Estimates
              </p>
            )}
          </div>
        )}
      </div>
    </section>
  )
}
