import { NextResponse } from 'next/server'
import { cities, usRegions, getStateByCode } from '@/lib/data/usa'

// This route is server-only — usa.ts never reaches the client bundle via Header.tsx

const megaMenuRegions = [
  'South',
  'West',
  'Northeast',
  'Midwest',
]

function parsePopulation(pop: string): number {
  return parseInt(pop.replace(/\s/g, ''), 10) || 0
}

function formatPop(pop: string): string {
  const n = parsePopulation(pop)
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  return `${Math.round(n / 1000)}K`
}

const citiesByRegion = megaMenuRegions.map((regionName) => {
  const regionVilles = cities
    .filter((v) => getStateByCode(v.stateCode)?.region === regionName)
    .sort((a, b) => parsePopulation(b.population) - parsePopulation(a.population))
    .slice(0, 4)
  return {
    region: regionName,
    cities: regionVilles.map((v) => ({
      name: v.name,
      slug: v.slug,
      population: formatPop(v.population),
    })),
  }
})

const popularCities = [...cities]
  .sort((a, b) => parsePopulation(b.population) - parsePopulation(a.population))
  .slice(0, 12)
  .map((v) => ({ name: v.name, slug: v.slug }))

const metroRegions = usRegions.slice(0, 13).map((r) => ({
  slug: r.slug,
  name: r.name,
  states: r.states.map((d) => ({ name: d.name, code: d.code, slug: d.slug })),
}))

const domTomRegions = usRegions.slice(13).map((r) => ({
  slug: r.slug,
  name: r.name,
  states: r.states.map((d) => ({ name: d.name, code: d.code, slug: d.slug })),
}))

const payload = { citiesByRegion, popularCities, metroRegions, domTomRegions }

export async function GET() {
  return NextResponse.json(payload, {
    headers: {
      // Cache for 24 h at CDN edge, stale-while-revalidate for 7 days
      'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=604800',
    },
  })
}
