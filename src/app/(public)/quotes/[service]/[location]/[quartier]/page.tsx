import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { SITE_URL } from '@/lib/seo/config'
import { tradeContent, getTradesSlugs } from '@/lib/data/trade-content'
import { cities, getNeighborhoodBySlug, getNeighborhoodsByCity } from '@/lib/data/usa'

const tradeSlugs = getTradesSlugs()

export function generateStaticParams() {
  const topServices = tradeSlugs.slice(0, 10)
  const topCities = cities.slice(0, 30)
  return topServices.flatMap((s) =>
    topCities.flatMap((v) =>
      getNeighborhoodsByCity(v.slug).map((q) => ({
        service: s,
        location: v.slug,
        quartier: q.slug,
      }))
    )
  )
}

export const dynamicParams = true
export const revalidate = 86400

export async function generateMetadata({
  params,
}: {
  params: Promise<{ service: string; location: string; quartier: string }>
}): Promise<Metadata> {
  const { service, location: locationSlug, quartier: quartierSlug } = await params
  const trade = tradeContent[service]
  const quartier = getNeighborhoodBySlug(locationSlug, quartierSlug)
  if (!trade || !quartier) return {}

  return {
    title: `${trade.name} Consultation in ${quartier.neighborhoodName} | US Attorneys`,
    robots: { index: false },
    alternates: { canonical: `${SITE_URL}/quotes/${service}/${locationSlug}/${quartierSlug}` },
  }
}

export default async function QuotesQuartierPage({
  params,
}: {
  params: Promise<{ service: string; location: string; quartier: string }>
}) {
  const { service, location: locationSlug, quartier: quartierSlug } = await params
  const trade = tradeContent[service]
  const quartier = getNeighborhoodBySlug(locationSlug, quartierSlug)
  if (!trade || !quartier) notFound()

  return (
    <div className="max-w-4xl mx-auto px-4 py-16">
      <h1 className="text-3xl font-bold text-gray-900 mb-4">
        {trade.name} Consultation in {quartier.neighborhoodName}
      </h1>
      <p className="text-gray-500">Content coming soon.</p>
    </div>
  )
}
