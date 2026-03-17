import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { SITE_URL } from '@/lib/seo/config'
import { tradeContent, getPracticeAreaSlugs } from '@/lib/data/trade-content'
import { cities, getCityBySlug } from '@/lib/data/usa'

export const revalidate = 86400

const tradeSlugs = getPracticeAreaSlugs()

function parsePopulation(pop: string): number {
  return parseInt(pop.replace(/\s/g, ''), 10) || 0
}

const top50Cities = [...cities]
  .sort((a, b) => parsePopulation(b.population) - parsePopulation(a.population))
  .slice(0, 50)

export function generateStaticParams() {
  const params: { service: string; city: string }[] = []
  for (const service of tradeSlugs) {
    for (const city of top50Cities) {
      params.push({ service, city: city.slug })
    }
  }
  return params
}

export const dynamicParams = true

export async function generateMetadata({
  params,
}: {
  params: Promise<{ service: string; city: string }>
}): Promise<Metadata> {
  const { service, city: villeSlug } = await params
  const trade = tradeContent[service]
  const villeData = getCityBySlug(villeSlug)
  if (!trade || !villeData) return {}

  const title = `${trade.name} Reviews in ${villeData.name}`
  return {
    title,
    robots: { index: false },
    alternates: { canonical: `${SITE_URL}/reviews/${service}/${villeSlug}` },
  }
}

export default async function ReviewsServiceVillePage({
  params,
}: {
  params: Promise<{ service: string; city: string }>
}) {
  const { service, city: villeSlug } = await params
  const trade = tradeContent[service]
  const villeData = getCityBySlug(villeSlug)
  if (!trade || !villeData) notFound()

  return (
    <div className="max-w-4xl mx-auto px-4 py-16">
      <h1 className="text-3xl font-bold text-gray-900 mb-4">
        {trade.name} Reviews in {villeData.name}
      </h1>
      <p className="text-gray-500">Content coming soon.</p>
    </div>
  )
}
