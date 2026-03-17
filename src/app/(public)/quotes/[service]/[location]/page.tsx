import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { SITE_URL } from '@/lib/seo/config'
import { tradeContent, getPracticeAreaSlugs } from '@/lib/data/trade-content'
import { cities, getCityBySlug } from '@/lib/data/usa'

function parsePopulation(pop: string): number {
  return parseInt(pop.replace(/\s/g, ''), 10) || 0
}

const tradeSlugs = getPracticeAreaSlugs()

const top5Cities = [...cities]
  .sort((a, b) => parsePopulation(b.population) - parsePopulation(a.population))
  .slice(0, 5)

export function generateStaticParams() {
  const params: { service: string; location: string }[] = []
  for (const service of tradeSlugs) {
    for (const ville of top5Cities) {
      params.push({ service, location: ville.slug })
    }
  }
  return params
}

export const dynamicParams = true

export async function generateMetadata({
  params,
}: {
  params: Promise<{ service: string; location: string }>
}): Promise<Metadata> {
  const { service, location: locationSlug } = await params
  const trade = tradeContent[service]
  const villeData = getCityBySlug(locationSlug)
  if (!trade || !villeData) return {}

  return {
    title: `${trade.name} Consultation in ${villeData.name} | US Attorneys`,
    robots: { index: false },
    alternates: { canonical: `${SITE_URL}/quotes/${service}/${locationSlug}` },
  }
}

export default async function QuotesServiceLocationPage({
  params,
}: {
  params: Promise<{ service: string; location: string }>
}) {
  const { service, location: locationSlug } = await params
  const trade = tradeContent[service]
  const villeData = getCityBySlug(locationSlug)
  if (!trade || !villeData) notFound()

  return (
    <div className="max-w-4xl mx-auto px-4 py-16">
      <h1 className="text-3xl font-bold text-gray-900 mb-4">
        {trade.name} Consultation in {villeData.name}
      </h1>
      <p className="text-gray-500">Content coming soon.</p>
    </div>
  )
}
