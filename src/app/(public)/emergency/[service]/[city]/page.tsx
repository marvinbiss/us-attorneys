import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { SITE_URL } from '@/lib/seo/config'
import { getAlternateLanguages } from '@/lib/seo/hreflang'
import { tradeContent } from '@/lib/data/trade-content'
import { cities, getCityBySlug } from '@/lib/data/usa'
import { REVALIDATE } from '@/lib/cache'

export const revalidate = REVALIDATE.serviceLocation

const emergencySlugs = Object.keys(tradeContent)

function parsePopulation(pop: string): number {
  return parseInt(pop.replace(/\s/g, ''), 10) || 0
}

const top10Cities = [...cities]
  .sort((a, b) => parsePopulation(b.population) - parsePopulation(a.population))
  .slice(0, 10)

export const dynamicParams = true

export function generateStaticParams() {
  const topServices = emergencySlugs.slice(0, 5)
  return topServices.flatMap((s) =>
    top10Cities.map((v) => ({ service: s, city: v.slug }))
  )
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ service: string; city: string }>
}): Promise<Metadata> {
  const { service, city: villeSlug } = await params
  const trade = tradeContent[service]
  const villeData = getCityBySlug(villeSlug)
  if (!trade || !villeData) return {}

  const title = `Emergency ${trade.name} ${villeData.name}`
  return {
    title,
    robots: { index: true, follow: true },
    alternates: {
      canonical: `${SITE_URL}/emergency/${service}/${villeSlug}`,
      languages: getAlternateLanguages(`/emergency/${service}/${villeSlug}`),
    },
  }
}

export default async function EmergencyServiceVillePage({
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
        Emergency {trade.name} in {villeData.name}
      </h1>
      <p className="text-gray-500">Content coming soon.</p>
    </div>
  )
}
