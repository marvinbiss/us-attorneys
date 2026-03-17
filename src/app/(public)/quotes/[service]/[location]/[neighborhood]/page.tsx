import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { SITE_URL } from '@/lib/seo/config'
import { tradeContent } from '@/lib/data/trade-content'
import { getNeighborhoodBySlug } from '@/lib/data/usa'
import { REVALIDATE } from '@/lib/cache'

// All ISR — parent route already has seeds (dynamicParams = true)
export function generateStaticParams() {
  return []
}

export const dynamicParams = true
export const revalidate = REVALIDATE.serviceLocation

export async function generateMetadata({
  params,
}: {
  params: Promise<{ service: string; location: string; neighborhood: string }>
}): Promise<Metadata> {
  const { service, location: locationSlug, neighborhood: quartierSlug } = await params
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
  params: Promise<{ service: string; location: string; neighborhood: string }>
}) {
  const { service, location: locationSlug, neighborhood: quartierSlug } = await params
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
