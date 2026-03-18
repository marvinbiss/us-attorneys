import Link from 'next/link'
import { states } from '@/lib/data/usa'
import { PRACTICE_AREAS_200, CATEGORY_ORDER } from '@/lib/data/practice-areas-200'
import { ArrowRight, MapPin, Scale, Building2, Search } from 'lucide-react'

// ============================================================================
// GeoFooterLinks — Doctolib/Zillow-level internal linking mesh
// Server component: renders a comprehensive footer section with geographic
// and practice area cross-links for maximum internal linking density.
// Accepts optional city/state context to render a "Popular Searches in {City}"
// section with city×PA combinations — targeting ~150-200 internal links/page.
// All links are SSR in the initial HTML — a key advantage over client-rendered
// competitors (Ember.js/SPA) where links are invisible to crawlers.
// ============================================================================

// Group states by region
const REGIONS: Record<string, string[]> = {
  Northeast: ['CT', 'ME', 'MA', 'NH', 'NJ', 'NY', 'PA', 'RI', 'VT'],
  Midwest: ['IL', 'IN', 'IA', 'KS', 'MI', 'MN', 'MO', 'NE', 'ND', 'OH', 'SD', 'WI'],
  South: ['AL', 'AR', 'DE', 'DC', 'FL', 'GA', 'KY', 'LA', 'MD', 'MS', 'NC', 'OK', 'SC', 'TN', 'TX', 'VA', 'WV'],
  West: ['AK', 'AZ', 'CA', 'CO', 'HI', 'ID', 'MT', 'NV', 'NM', 'OR', 'UT', 'WA', 'WY'],
}

// Category display names for practice area grouping
const CATEGORY_NAMES: Record<string, string> = {
  'personal-injury': 'Personal Injury',
  'criminal-defense': 'Criminal Defense',
  'family-law': 'Family Law',
  'business-corporate': 'Business & Corporate',
  'intellectual-property': 'Intellectual Property',
  'real-estate': 'Real Estate',
  'immigration': 'Immigration',
  'estate-planning': 'Estate Planning',
  'employment': 'Employment',
  'bankruptcy': 'Bankruptcy',
  'tax': 'Tax',
  'specialized': 'Specialized',
  'government-administrative': 'Government & Administrative',
  'technology-cyber': 'Technology & Cyber',
  'personal-family-additional': 'Additional',
}

// High-demand PAs for the city × PA grid (these drive the most searches)
const HIGH_DEMAND_PA_SLUGS = [
  'personal-injury', 'criminal-defense', 'divorce', 'immigration-law',
  'dui-dwi', 'bankruptcy', 'estate-planning', 'employment-law',
  'real-estate-law', 'business-law', 'child-custody', 'workers-compensation',
  'medical-malpractice', 'car-accidents', 'tax-law', 'intellectual-property',
  'wrongful-death', 'drug-crimes', 'slip-and-fall', 'corporate-law',
]

// Top cities per state (from static data — first N cities listed in state.cities)
function getTopCitiesForState(stateCode: string, limit: number = 10): string[] {
  const state = states.find(s => s.code === stateCode)
  if (!state) return []
  return state.cities.slice(0, limit)
}

// Get parent practice areas only (no subspecialties) for clean linking
function getParentPracticeAreas() {
  return PRACTICE_AREAS_200.filter(pa => pa.parentSlug === null)
}

// Group practice areas by category
function getPracticeAreasByCategory() {
  const parentAreas = getParentPracticeAreas()
  const grouped: Record<string, typeof parentAreas> = {}

  for (const cat of CATEGORY_ORDER) {
    const areas = parentAreas.filter(pa => pa.category === cat)
    if (areas.length > 0) {
      grouped[cat] = areas
    }
  }

  return grouped
}

function formatCitySlug(slug: string): string {
  return slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
}

interface GeoFooterLinksProps {
  /** Optional city slug for contextual "Popular searches in {City}" */
  citySlug?: string
  /** Optional city display name */
  cityName?: string
  /** Optional state code for contextual city x PA grid */
  stateCode?: string
}

export default function GeoFooterLinks({
  citySlug,
  cityName,
  stateCode,
}: GeoFooterLinksProps = {}) {
  const practiceAreasByCategory = getPracticeAreasByCategory()

  // Build city × PA grid for the contextual city (if provided)
  const highDemandPAs = PRACTICE_AREAS_200.filter(pa => HIGH_DEMAND_PA_SLUGS.includes(pa.slug))

  // Get nearby cities for the state context
  const stateCities = stateCode ? getTopCitiesForState(stateCode, 12) : []
  const state = stateCode ? states.find(s => s.code === stateCode) : null

  return (
    <section className="relative border-t border-white/[0.06] bg-gray-950" aria-label="Explore attorneys by state and practice area">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        {/* Section title */}
        <h2 className="text-white font-heading text-xl font-bold mb-10 tracking-tight">
          Find Attorneys Across the United States
        </h2>

        {/* ============================================================ */}
        {/* CONTEXTUAL: Popular Searches in {City}                       */}
        {/* Renders a city × PA grid when city context is provided       */}
        {/* ============================================================ */}
        {citySlug && cityName && (
          <div className="mb-14">
            <h3 className="text-white font-heading font-semibold mb-6 text-xs uppercase tracking-[0.15em] flex items-center gap-2">
              <Search className="w-3.5 h-3.5 text-gray-500" aria-hidden="true" />
              Popular Searches in {cityName}
            </h3>
            <div className="flex flex-wrap gap-2">
              {highDemandPAs.map(pa => (
                <Link
                  key={`city-pa-${pa.slug}`}
                  href={`/practice-areas/${pa.slug}/${citySlug}`}
                  className="inline-flex items-center px-3 py-1.5 bg-white/[0.04] hover:bg-white/[0.08] text-gray-400 hover:text-white border border-white/[0.06] hover:border-white/[0.12] rounded-full text-xs transition-all duration-200"
                >
                  {pa.name} in {cityName}
                </Link>
              ))}
            </div>

            {/* City hub link */}
            <div className="mt-4">
              <Link
                href={`/cities/${citySlug}`}
                className="text-clay-400 hover:text-clay-300 text-sm flex items-center gap-1 group"
              >
                All attorneys in {cityName}
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" aria-hidden="true" />
              </Link>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* CONTEXTUAL: Top Cities × Top PAs in {State}                  */}
        {/* Grid of state's cities × high-demand PAs when state context  */}
        {/* ============================================================ */}
        {state && stateCities.length > 0 && (
          <div className="mb-14">
            <h3 className="text-white font-heading font-semibold mb-6 text-xs uppercase tracking-[0.15em] flex items-center gap-2">
              <MapPin className="w-3.5 h-3.5 text-gray-500" aria-hidden="true" />
              Attorneys in {state.name}
            </h3>

            {/* Desktop: cities × PAs grid */}
            <div className="hidden lg:grid lg:grid-cols-4 gap-6">
              {stateCities.slice(0, 8).map(cs => (
                <div key={cs}>
                  <h4 className="text-clay-400 font-semibold text-sm mb-2">
                    <Link href={`/cities/${cs}`} className="hover:text-clay-300 transition-colors">
                      {formatCitySlug(cs)}
                    </Link>
                  </h4>
                  <ul className="space-y-1">
                    {highDemandPAs.slice(0, 5).map(pa => (
                      <li key={`${cs}-${pa.slug}`}>
                        <Link
                          href={`/practice-areas/${pa.slug}/${cs}`}
                          className="text-gray-400 hover:text-white text-xs transition-colors duration-200 inline-block py-0.5"
                        >
                          {pa.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            {/* Mobile: collapsible by city */}
            <div className="lg:hidden space-y-2">
              {stateCities.slice(0, 5).map(cs => (
                <details key={cs} className="group border border-white/[0.06] rounded-xl overflow-hidden">
                  <summary className="flex items-center justify-between cursor-pointer px-5 py-3 text-white font-heading font-semibold text-xs uppercase tracking-[0.15em] hover:bg-white/[0.03] transition-colors">
                    {formatCitySlug(cs)}
                    <ArrowRight className="w-4 h-4 text-gray-500 transition-transform duration-200 group-open:rotate-90" aria-hidden="true" />
                  </summary>
                  <ul className="grid grid-cols-2 gap-x-4 gap-y-1 px-5 pb-4">
                    {highDemandPAs.slice(0, 8).map(pa => (
                      <li key={`${cs}-${pa.slug}`}>
                        <Link
                          href={`/practice-areas/${pa.slug}/${cs}`}
                          className="text-gray-400 hover:text-white text-xs transition-colors duration-200 inline-block py-0.5"
                        >
                          {pa.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </details>
              ))}
            </div>

            {/* State hub link */}
            <div className="mt-4">
              <Link
                href={`/states/${state.slug}`}
                className="text-clay-400 hover:text-clay-300 text-sm flex items-center gap-1 group"
              >
                All attorneys in {state.name}
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" aria-hidden="true" />
              </Link>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* STATES BY REGION — Desktop: full grid, Mobile: collapsible  */}
        {/* ============================================================ */}
        <div className="mb-14">
          <h3 className="text-white font-heading font-semibold mb-6 text-xs uppercase tracking-[0.15em] flex items-center gap-2">
            <MapPin className="w-3.5 h-3.5 text-gray-500" aria-hidden="true" />
            Attorneys by State
          </h3>

          {/* Desktop: full grid */}
          <div className="hidden lg:grid lg:grid-cols-4 gap-8">
            {Object.entries(REGIONS).map(([regionName, stateCodes]) => (
              <div key={regionName}>
                <h4 className="text-clay-400 font-semibold text-sm mb-3">{regionName}</h4>
                <ul className="space-y-1.5">
                  {stateCodes.map(code => {
                    const st = states.find(s => s.code === code)
                    if (!st) return null
                    return (
                      <li key={code}>
                        <Link
                          href={`/states/${st.slug}`}
                          className="text-gray-400 hover:text-white text-sm transition-colors duration-200 inline-block py-0.5"
                        >
                          {st.name}
                        </Link>
                      </li>
                    )
                  })}
                </ul>
              </div>
            ))}
          </div>

          {/* Mobile/Tablet: collapsible by region */}
          <div className="lg:hidden space-y-2">
            {Object.entries(REGIONS).map(([regionName, stateCodes]) => (
              <details key={regionName} className="group border border-white/[0.06] rounded-xl overflow-hidden">
                <summary className="flex items-center justify-between cursor-pointer px-5 py-3 text-white font-heading font-semibold text-xs uppercase tracking-[0.15em] hover:bg-white/[0.03] transition-colors">
                  {regionName}
                  <ArrowRight className="w-4 h-4 text-gray-500 transition-transform duration-200 group-open:rotate-90" aria-hidden="true" />
                </summary>
                <ul className="grid grid-cols-2 gap-x-4 gap-y-1 px-5 pb-4">
                  {stateCodes.map(code => {
                    const st = states.find(s => s.code === code)
                    if (!st) return null
                    return (
                      <li key={code}>
                        <Link
                          href={`/states/${st.slug}`}
                          className="text-gray-400 hover:text-white text-sm transition-colors duration-200 inline-block py-0.5"
                        >
                          {st.name}
                        </Link>
                      </li>
                    )
                  })}
                </ul>
              </details>
            ))}
          </div>
        </div>

        {/* ============================================================ */}
        {/* TOP CITIES PER MAJOR STATE                                  */}
        {/* ============================================================ */}
        <div className="mb-14">
          <h3 className="text-white font-heading font-semibold mb-6 text-xs uppercase tracking-[0.15em] flex items-center gap-2">
            <Building2 className="w-3.5 h-3.5 text-gray-500" aria-hidden="true" />
            Top Cities
          </h3>

          {/* Desktop: show top 8 states with their cities */}
          <div className="hidden lg:grid lg:grid-cols-4 gap-8">
            {['CA', 'TX', 'FL', 'NY', 'IL', 'PA', 'OH', 'GA'].map(code => {
              const st = states.find(s => s.code === code)
              if (!st) return null
              const topCities = getTopCitiesForState(code, 8)
              return (
                <div key={code}>
                  <h4 className="text-clay-400 font-semibold text-sm mb-3">
                    <Link href={`/states/${st.slug}`} className="hover:text-clay-300 transition-colors">
                      {st.name}
                    </Link>
                  </h4>
                  <ul className="space-y-1.5">
                    {topCities.map(cs => (
                      <li key={cs}>
                        <Link
                          href={`/cities/${cs}`}
                          className="text-gray-400 hover:text-white text-sm transition-colors duration-200 inline-block py-0.5"
                        >
                          {formatCitySlug(cs)}
                        </Link>
                      </li>
                    ))}
                    <li className="pt-1">
                      <Link
                        href={`/states/${st.slug}`}
                        className="text-clay-400 hover:text-clay-300 text-xs flex items-center gap-1 group py-0.5"
                      >
                        All cities in {st.name}
                        <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" aria-hidden="true" />
                      </Link>
                    </li>
                  </ul>
                </div>
              )
            })}
          </div>

          {/* Mobile: show top 5 states collapsible */}
          <div className="lg:hidden space-y-2">
            {['CA', 'TX', 'FL', 'NY', 'IL'].map(code => {
              const st = states.find(s => s.code === code)
              if (!st) return null
              const topCities = getTopCitiesForState(code, 5)
              return (
                <details key={code} className="group border border-white/[0.06] rounded-xl overflow-hidden">
                  <summary className="flex items-center justify-between cursor-pointer px-5 py-3 text-white font-heading font-semibold text-xs uppercase tracking-[0.15em] hover:bg-white/[0.03] transition-colors">
                    {st.name}
                    <ArrowRight className="w-4 h-4 text-gray-500 transition-transform duration-200 group-open:rotate-90" aria-hidden="true" />
                  </summary>
                  <ul className="grid grid-cols-2 gap-x-4 gap-y-1 px-5 pb-4">
                    {topCities.map(cs => (
                      <li key={cs}>
                        <Link
                          href={`/cities/${cs}`}
                          className="text-gray-400 hover:text-white text-sm transition-colors duration-200 inline-block py-0.5"
                        >
                          {formatCitySlug(cs)}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </details>
              )
            })}
          </div>
        </div>

        {/* ============================================================ */}
        {/* PRACTICE AREAS BY CATEGORY                                  */}
        {/* ============================================================ */}
        <div>
          <h3 className="text-white font-heading font-semibold mb-6 text-xs uppercase tracking-[0.15em] flex items-center gap-2">
            <Scale className="w-3.5 h-3.5 text-gray-500" aria-hidden="true" />
            Practice Areas
          </h3>

          {/* Desktop: multi-column grid of categories */}
          <div className="hidden lg:grid lg:grid-cols-5 gap-8">
            {Object.entries(practiceAreasByCategory).slice(0, 10).map(([category, areas]) => (
              <div key={category}>
                <h4 className="text-clay-400 font-semibold text-sm mb-3">
                  {CATEGORY_NAMES[category] || category}
                </h4>
                <ul className="space-y-1.5">
                  {areas.slice(0, 6).map(pa => (
                    <li key={pa.slug}>
                      <Link
                        href={`/practice-areas/${pa.slug}`}
                        className="text-gray-400 hover:text-white text-sm transition-colors duration-200 inline-block py-0.5"
                      >
                        {pa.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Mobile: collapsible categories */}
          <div className="lg:hidden space-y-2">
            {Object.entries(practiceAreasByCategory).slice(0, 8).map(([category, areas]) => (
              <details key={category} className="group border border-white/[0.06] rounded-xl overflow-hidden">
                <summary className="flex items-center justify-between cursor-pointer px-5 py-3 text-white font-heading font-semibold text-xs uppercase tracking-[0.15em] hover:bg-white/[0.03] transition-colors">
                  {CATEGORY_NAMES[category] || category}
                  <ArrowRight className="w-4 h-4 text-gray-500 transition-transform duration-200 group-open:rotate-90" aria-hidden="true" />
                </summary>
                <ul className="grid grid-cols-2 gap-x-4 gap-y-1 px-5 pb-4">
                  {areas.slice(0, 8).map(pa => (
                    <li key={pa.slug}>
                      <Link
                        href={`/practice-areas/${pa.slug}`}
                        className="text-gray-400 hover:text-white text-sm transition-colors duration-200 inline-block py-0.5"
                      >
                        {pa.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </details>
            ))}
          </div>

          {/* View all link */}
          <div className="mt-6 flex gap-4">
            <Link
              href="/services"
              className="text-clay-400 hover:text-clay-300 text-sm flex items-center gap-1 group"
            >
              All 75+ Practice Areas
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" aria-hidden="true" />
            </Link>
            <Link
              href="/states"
              className="text-clay-400 hover:text-clay-300 text-sm flex items-center gap-1 group"
            >
              All 50 States + DC
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" aria-hidden="true" />
            </Link>
          </div>
        </div>

        {/* ============================================================ */}
        {/* CROSS-LINKS: Top Practice Area x Top City combos            */}
        {/* ============================================================ */}
        <div className="mt-14 pt-10 border-t border-white/[0.06]">
          <h3 className="text-white font-heading font-semibold mb-6 text-xs uppercase tracking-[0.15em]">
            Popular Searches
          </h3>
          <div className="flex flex-wrap gap-2">
            {[
              { pa: 'personal-injury', city: 'los-angeles', label: 'Personal Injury in Los Angeles' },
              { pa: 'criminal-defense', city: 'new-york', label: 'Criminal Defense in New York' },
              { pa: 'divorce', city: 'chicago', label: 'Divorce Attorney in Chicago' },
              { pa: 'immigration-law', city: 'miami', label: 'Immigration in Miami' },
              { pa: 'dui-dwi', city: 'houston', label: 'DUI Attorney in Houston' },
              { pa: 'bankruptcy', city: 'phoenix', label: 'Bankruptcy in Phoenix' },
              { pa: 'estate-planning', city: 'dallas', label: 'Estate Planning in Dallas' },
              { pa: 'employment-law', city: 'san-francisco', label: 'Employment Law in San Francisco' },
              { pa: 'real-estate-law', city: 'seattle', label: 'Real Estate Law in Seattle' },
              { pa: 'business-law', city: 'denver', label: 'Business Law in Denver' },
              { pa: 'child-custody', city: 'atlanta', label: 'Child Custody in Atlanta' },
              { pa: 'workers-compensation', city: 'philadelphia', label: 'Workers Comp in Philadelphia' },
              { pa: 'medical-malpractice', city: 'boston', label: 'Medical Malpractice in Boston' },
              { pa: 'car-accidents', city: 'san-antonio', label: 'Car Accident in San Antonio' },
              { pa: 'tax-law', city: 'san-diego', label: 'Tax Attorney in San Diego' },
              { pa: 'intellectual-property', city: 'san-jose', label: 'IP Attorney in San Jose' },
              { pa: 'wrongful-death', city: 'nashville', label: 'Wrongful Death in Nashville' },
              { pa: 'corporate-law', city: 'charlotte', label: 'Corporate Law in Charlotte' },
              { pa: 'drug-crimes', city: 'las-vegas', label: 'Drug Crimes in Las Vegas' },
              { pa: 'slip-and-fall', city: 'orlando', label: 'Slip & Fall in Orlando' },
              { pa: 'domestic-violence', city: 'tampa', label: 'Domestic Violence in Tampa' },
              { pa: 'probate', city: 'portland', label: 'Probate in Portland' },
              { pa: 'foreclosure', city: 'jacksonville', label: 'Foreclosure in Jacksonville' },
              { pa: 'visa-applications', city: 'washington', label: 'Visa Applications in Washington DC' },
            ].map(({ pa, city, label }) => (
              <Link
                key={`${pa}-${city}`}
                href={`/practice-areas/${pa}/${city}`}
                className="inline-flex items-center px-3 py-1.5 bg-white/[0.04] hover:bg-white/[0.08] text-gray-400 hover:text-white border border-white/[0.06] hover:border-white/[0.12] rounded-full text-xs transition-all duration-200"
              >
                {label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
