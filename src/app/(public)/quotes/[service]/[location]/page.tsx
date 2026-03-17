import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { SITE_URL } from '@/lib/seo/config'
import { tradeContent } from '@/lib/data/trade-content'
import { getCityBySlug } from '@/lib/data/usa'
import { resolveZipToCity } from '@/lib/location-resolver'

export function generateStaticParams() {
  return [{ service: 'personal-injury', location: 'new-york' }]
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

  const title = `Free ${trade.name} Consultation in ${villeData.name}`
  const description = `Request a free ${trade.name.toLowerCase()} consultation in ${villeData.name}, ${villeData.stateName}. Compare up to 3 verified attorneys. ${trade.priceRange.min}–${trade.priceRange.max} ${trade.priceRange.unit}. No obligation.`
  return {
    title,
    description,
    robots: { index: false },
    alternates: { canonical: `${SITE_URL}/quotes/${service}/${locationSlug}` },
    openGraph: { title, description, url: `${SITE_URL}/quotes/${service}/${locationSlug}`, type: 'website', locale: 'en_US' },
  }
}

export default async function QuotesServiceLocationPage({
  params,
}: {
  params: Promise<{ service: string; location: string }>
}) {
  const { service, location: locationSlug } = await params
  const trade = tradeContent[service]
  const villeData = getCityBySlug(locationSlug) || await resolveZipToCity(locationSlug)
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
